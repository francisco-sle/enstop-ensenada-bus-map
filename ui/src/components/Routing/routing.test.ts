import { describe, it, expect } from 'vitest'
import { computeABRoute, getNearbyStops } from './routing'
import type { DBStop, RouteDetail } from '../../types'

// Mock stops along Av. Reforma
const mockStops: DBStop[] = [
  {
    id: 1,
    name: 'Terminal Centro',
    common_name: 'Centro',
    geom: { type: 'Point', coordinates: [-116.625, 31.868] },
    is_terminal: true,
    accessible: true,
    created_at: '',
  },
  {
    id: 2,
    name: 'Calle Segunda',
    common_name: 'Revolución',
    geom: { type: 'Point', coordinates: [-116.621, 31.865] },
    is_terminal: false,
    accessible: true,
    created_at: '',
  },
  {
    id: 3,
    name: 'Terminal Chapultepec',
    common_name: 'Chapultepec',
    geom: { type: 'Point', coordinates: [-116.58, 31.784] },
    is_terminal: true,
    accessible: true,
    created_at: '',
  },
]

// Mock Route Detail for R1
const mockRoute: RouteDetail = {
  id: 1,
  name: 'R1 — Centro–Chapultepec',
  short_name: 'R1',
  category_id: 1,
  description: 'Reforma Troncal',
  direction: 'circular',
  is_active: true,
  created_at: '',
  category: {
    id: 1,
    name: 'Centro–Chapultepec',
    color_hex: '#3DBFA8',
  },
  geom: {
    type: 'LineString',
    coordinates: [
      [-116.625, 31.868],
      [-116.621, 31.865],
      [-116.58, 31.784],
    ],
  },
  route_stops: [
    { id: 1, route_id: 1, stop_id: 1, sequence: 1, stop: mockStops[0] },
    { id: 2, route_id: 1, stop_id: 2, sequence: 2, stop: mockStops[1] },
    { id: 3, route_id: 1, stop_id: 3, sequence: 3, stop: mockStops[2] },
  ],
}

describe('A-to-B Transit Routing Algorithm', () => {
  it('should successfully match a direct route going forward', () => {
    // User wants to go from Stop 1 to Stop 3
    const originLat = 31.868
    const originLng = -116.625
    const destLat = 31.784
    const destLng = -116.58

    const results = computeABRoute(
      originLat,
      originLng,
      destLat,
      destLng,
      [mockStops[0]], // nearby origin stops
      [mockStops[2]], // nearby dest stops
      [mockRoute],
    )

    expect(results).toHaveLength(1)
    const res = results[0]
    expect(res.routeId).toBe(1)
    expect(res.routeShortName).toBe('R1')
    expect(res.originStop.id).toBe(1)
    expect(res.destStop.id).toBe(3)
    expect(res.busDistanceKm).toBeGreaterThan(1)
    expect(res.totalMinutes).toBeGreaterThan(0)
  })

  it('should invalidate direction if route is not circular and sequence is reversed', () => {
    // Make route one-way (inbound)
    const nonCircularRoute: RouteDetail = {
      ...mockRoute,
      direction: 'inbound',
    }

    // User wants to go from Stop 3 to Stop 1 (against sequence direction)
    const originLat = 31.784
    const originLng = -116.58
    const destLat = 31.868
    const destLng = -116.625

    const results = computeABRoute(
      originLat,
      originLng,
      destLat,
      destLng,
      [mockStops[2]],
      [mockStops[0]],
      [nonCircularRoute],
    )

    expect(results).toHaveLength(0)
  })

  it('should compute walking durations correctly based on 5km/h speed', () => {
    const originLat = 31.868
    const originLng = -116.625
    // Walk to stop 2 is 0.5km
    const results = computeABRoute(
      originLat,
      originLng,
      31.865,
      -116.621,
      [mockStops[0]],
      [mockStops[1]],
      [mockRoute],
    )

    expect(results).toHaveLength(1)
    const res = results[0]
    // walking distance origin -> stop 1 is 0 (coords are exact)
    // walking distance stop 2 -> dest is 0 (coords are exact)
    expect(res.walkOriginKm).toBeCloseTo(0, 2)
    expect(res.walkDestKm).toBeCloseTo(0, 2)
  })

  it('should exclude route option if bus segment contains fewer than 2 coordinates', () => {
    const stopA: DBStop = {
      id: 1,
      name: 'Stop A',
      common_name: 'A',
      geom: { type: 'Point', coordinates: [-116.625, 31.868] },
      is_terminal: false,
      accessible: true,
      created_at: '',
    }
    const stopB: DBStop = {
      id: 4,
      name: 'Stop B',
      common_name: 'B',
      geom: { type: 'Point', coordinates: [-116.625, 31.868] },
      is_terminal: false,
      accessible: true,
      created_at: '',
    }
    const routeWithBothStops: RouteDetail = {
      ...mockRoute,
      route_stops: [
        { id: 1, route_id: 1, stop_id: 1, sequence: 1, stop: stopA },
        { id: 4, route_id: 1, stop_id: 4, sequence: 2, stop: stopB },
      ],
    }

    const results = computeABRoute(
      31.868,
      -116.625,
      31.868,
      -116.625,
      [stopA],
      [stopB],
      [routeWithBothStops],
    )

    expect(results).toHaveLength(0)
  })
})

describe('getNearbyStops helper function', () => {
  it('should find stops within range and sort by proximity', () => {
    // Coordinate is closest to stop 1 (approx 31.868, -116.625)
    // and farther from stop 2, and very far from stop 3
    const nearby = getNearbyStops(31.867, -116.624, mockStops, 2.0)
    expect(nearby).toHaveLength(2)
    expect(nearby[0].id).toBe(1)
    expect(nearby[1].id).toBe(2)
  })

  it('should exclude stops outside the max distance range', () => {
    // Near Terminal Chapultepec (Stop 3), Stop 1 and 2 should be excluded
    const nearby = getNearbyStops(31.785, -116.581, mockStops, 2.0)
    expect(nearby).toHaveLength(1)
    expect(nearby[0].id).toBe(3)
  })
})
