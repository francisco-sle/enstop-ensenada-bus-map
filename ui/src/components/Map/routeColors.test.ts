import { describe, expect, it } from 'vitest'
import { assignRouteColors, COMPARE_PALETTE } from './routeColors'
import type { RouteWithCategory } from '../../types'

const route = (id: number, color: string) =>
  ({ id, brand: { color_hex: color }, category: null }) as unknown as RouteWithCategory

describe('assignRouteColors', () => {
  const routes = new Map([
    [1, route(1, '#EF4444')],
    [2, route(2, '#ef4444')],
    [3, route(3, '#3b82f6')],
    [4, route(4, '#ef4444')],
  ])

  it('keeps operator colors when they do not clash', () => {
    const colors = assignRouteColors([1, 3], routes)
    expect(colors.get(1)).toBe('#ef4444')
    expect(colors.get(3)).toBe('#3b82f6')
  })

  it('gives clashing routes distinct compare colors in pick order', () => {
    const colors = assignRouteColors([2, 1, 4], routes)
    expect(colors.get(2)).toBe('#ef4444')
    expect(colors.get(1)).toBe(COMPARE_PALETTE[0])
    expect(colors.get(4)).toBe(COMPARE_PALETTE[1])
  })

  it('ignores unknown ids', () => {
    expect(assignRouteColors([99], routes).size).toBe(0)
  })
})
