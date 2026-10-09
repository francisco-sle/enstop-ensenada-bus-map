import { describe, expect, it } from 'vitest'
import { layoutStops, MAX_LAYOUT_ZOOM, stopSpacingPx, type LayoutPoint } from './stopLayout'

// ~1 m of longitude in Ensenada
const M = 1 / 94_500

const point = (id: number, meters: number, priority = 0, gateZoom = 11): LayoutPoint => ({
  id,
  lng: -116.6 + meters * M,
  lat: 31.86,
  priority,
  gateZoom,
})

describe('layoutStops', () => {
  it('lets the higher-priority stop win a collision', () => {
    const layout = layoutStops([point(1, 0, 0), point(2, 20, 10)], { spacing: stopSpacingPx })
    expect(layout.get(2)!).toBeLessThan(layout.get(1)!)
  })

  it('shows isolated stops as soon as their gate opens', () => {
    const layout = layoutStops([point(1, 0, 0, 14), point(2, 5000, 0, 14)], {
      spacing: stopSpacingPx,
    })
    expect(layout.get(1)).toBe(14)
    expect(layout.get(2)).toBe(14)
  })

  it('never places two stops closer than the spacing below the max zoom', () => {
    const points = Array.from({ length: 300 }, (_, i) => point(i, (i * 37) % 2000, i % 7))
    const layout = layoutStops(points, { spacing: stopSpacingPx })
    for (let zoom = 11; zoom < MAX_LAYOUT_ZOOM; zoom++) {
      const visible = points.filter((p) => layout.get(p.id)! <= zoom)
      const pxPerMeter = (256 * 2 ** zoom) / (360 * 94_500)
      const xs = visible.map((p) => ((p.lng + 116.6) / M) * pxPerMeter).sort((a, b) => a - b)
      for (let i = 1; i < xs.length; i++) {
        expect(xs[i] - xs[i - 1]).toBeGreaterThanOrEqual(stopSpacingPx(zoom) - 0.01)
      }
    }
  })

  it('places every stop by the max zoom, even exact duplicates', () => {
    const layout = layoutStops([point(1, 0), point(2, 0), point(3, 1)], { spacing: stopSpacingPx })
    expect([...layout.values()].every((z) => z <= MAX_LAYOUT_ZOOM)).toBe(true)
    expect(layout.size).toBe(3)
  })

  it('keeps clear of obstacles from their min zoom on', () => {
    const p = point(1, 0)
    const layout = layoutStops([p], {
      spacing: stopSpacingPx,
      obstacles: [{ lng: p.lng, lat: p.lat + 10 * M, minZoom: 11 }],
    })
    expect(layout.get(1)).toBe(MAX_LAYOUT_ZOOM)
  })
})
