import { describe, expect, it } from 'vitest'
import { routeDisplayName, routeInBounds, routeMatchesQuery } from './routeSearch'
import type { RouteWithCategory } from '../../types'

const route = {
  id: 3,
  short_name: 'R3',
  name: 'El Vigía — Centro–El Sauzal',
  description: null,
  brand: { name: 'Transportes El Vigía' },
  category: { name: 'Centro–El Sauzal' },
  geom: {
    type: 'LineString',
    coordinates: [
      [-116.62, 31.86],
      [-116.6, 31.83],
    ],
  },
} as unknown as RouteWithCategory

describe('routeMatchesQuery', () => {
  it('matches number, accents and multiple words', () => {
    expect(routeMatchesQuery(route, 'r3')).toBe(true)
    expect(routeMatchesQuery(route, 'vigia')).toBe(true)
    expect(routeMatchesQuery(route, 'sauzal centro')).toBe(true)
    expect(routeMatchesQuery(route, 'maneadero')).toBe(false)
  })

  it('matches everything for a blank query', () => {
    expect(routeMatchesQuery(route, '  ')).toBe(true)
  })
})

describe('routeInBounds', () => {
  it('detects routes passing through the bounds', () => {
    expect(
      routeInBounds(route, [
        [31.85, -116.63],
        [31.87, -116.61],
      ]),
    ).toBe(true)
    expect(
      routeInBounds(route, [
        [31.7, -116.63],
        [31.75, -116.61],
      ]),
    ).toBe(false)
  })
})

describe('routeDisplayName', () => {
  it('drops the operator prefix', () => {
    expect(routeDisplayName(route)).toBe('Centro–El Sauzal')
  })
})
