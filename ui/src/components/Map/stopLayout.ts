// ─────────────────────────────────────────────────────────────────────────────
// Stop decluttering (screen-space collision placement)
//
// Instead of fixed importance thresholds per zoom, each stop gets the lowest
// zoom at which it can be drawn without crowding a more important stop — the
// same idea MapLibre/Mapbox use for symbol placement. Density drives what is
// shown: a lone suburban stop appears early, while downtown thins out to the
// most important stops until there is room for the rest.
//
// Placement is hierarchical: once a stop is visible it stays visible on every
// higher zoom (distances double each level), so zooming in only ever adds
// stops. It depends only on zoom, not on the viewport, so panning never
// reshuffles the map.
// ─────────────────────────────────────────────────────────────────────────────

/** Lowest zoom the layout is computed for (matches the map's minZoom). */
export const MIN_LAYOUT_ZOOM = 11
/** From this zoom on every stop is shown, even if it overlaps a neighbor. */
export const MAX_LAYOUT_ZOOM = 18

/**
 * Touch screens get bigger stops and tap areas (see mapIcons.tsx, StopDotsLayer.tsx),
 * so they also need more room between stops for neighboring tap areas not to overlap.
 */
export const IS_TOUCH =
  typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches

/**
 * Zoom at which stops switch from canvas dots to full icon markers. Touch screens
 * switch one level earlier: z15 is the "locate me" zoom, and dots there are too
 * small to read or tap on a phone.
 */
export function iconZoom(touch = IS_TOUCH): number {
  return touch ? 15 : 16
}
export const ICON_ZOOM = iconZoom()

/** Minimum on-screen distance between two stop centers, in CSS pixels. */
export function stopSpacingPx(zoom: number, touch = IS_TOUCH): number {
  if (zoom >= iconZoom(touch)) return touch ? 44 : 30 // tap area (44) / 26px icon plus a gap
  if (zoom >= 15) return 16
  return touch ? 24 : 14
}

/** Stops of the highlighted route are packed tighter so the line reads as a string of stops. */
export function routeStopSpacingPx(zoom: number, touch = IS_TOUCH): number {
  if (zoom >= iconZoom(touch)) return touch ? 44 : 30
  return touch ? 14 : 9
}

/**
 * Lowest zoom at which a stop may appear at all, before collisions are considered.
 * At city scale only hubs are meaningful; neighborhood stops wait for street scale.
 */
export function stopGateZoom(isTerminal: boolean, routeCount: number): number {
  if (isTerminal) return MIN_LAYOUT_ZOOM + 1
  if (routeCount >= 3) return 13
  return 14
}

/** Higher wins collisions: terminals, then busier stops, then accessible ones. */
export function stopPriority(isTerminal: boolean, routeCount: number, accessible: boolean): number {
  return (isTerminal ? 1000 : 0) + routeCount * 10 + (accessible ? 1 : 0)
}

export interface LayoutPoint {
  id: number
  lng: number
  lat: number
  priority: number
  gateZoom: number
}

/** An already-placed point other stops must keep clear of, from `minZoom` on. */
export interface LayoutObstacle {
  lng: number
  lat: number
  minZoom: number
}

interface LayoutOptions {
  spacing: (zoom: number) => number
  obstacles?: LayoutObstacle[]
  minZoom?: number
  maxZoom?: number
}

/** Web Mercator world pixel coordinates at zoom 0 (256px world). */
function project(lng: number, lat: number): [number, number] {
  const sin = Math.sin((Math.max(-85.05, Math.min(85.05, lat)) * Math.PI) / 180)
  return [((lng + 180) / 360) * 256, (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * 256]
}

/**
 * Greedy, priority-ordered placement repeated per zoom level.
 * @returns stop id → lowest zoom at which the stop is shown. Stops absent from
 *   the map never fit (only possible if `maxZoom` is below their gate zoom).
 */
export function layoutStops(points: LayoutPoint[], options: LayoutOptions): Map<number, number> {
  const { spacing, obstacles = [], minZoom = MIN_LAYOUT_ZOOM, maxZoom = MAX_LAYOUT_ZOOM } = options

  const ordered = points
    .map((p) => ({ ...p, world: project(p.lng, p.lat) }))
    .sort((a, b) => b.priority - a.priority || a.id - b.id)
  const blockers = obstacles.map((o) => ({ ...o, world: project(o.lng, o.lat) }))
  const placed = new Map<number, number>()

  for (let zoom = minZoom; zoom <= maxZoom; zoom++) {
    const scale = 2 ** zoom
    const gap = spacing(zoom)
    const grid = new Map<string, [number, number][]>()

    const cell = (x: number, y: number) => [Math.floor(x / gap), Math.floor(y / gap)]
    const insert = (x: number, y: number) => {
      const [cx, cy] = cell(x, y)
      const key = `${cx}:${cy}`
      const bucket = grid.get(key)
      if (bucket) bucket.push([x, y])
      else grid.set(key, [[x, y]])
    }
    const collides = (x: number, y: number) => {
      const [cx, cy] = cell(x, y)
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          for (const [ox, oy] of grid.get(`${cx + dx}:${cy + dy}`) ?? []) {
            if (Math.hypot(ox - x, oy - y) < gap) return true
          }
        }
      }
      return false
    }

    for (const o of blockers) {
      if (o.minZoom <= zoom) insert(o.world[0] * scale, o.world[1] * scale)
    }
    // Carry forward: everything visible one level up stays visible here.
    for (const p of ordered) {
      if (placed.has(p.id)) insert(p.world[0] * scale, p.world[1] * scale)
    }
    for (const p of ordered) {
      if (placed.has(p.id) || p.gateZoom > zoom) continue
      const x = p.world[0] * scale
      const y = p.world[1] * scale
      if (zoom < maxZoom && collides(x, y)) continue
      insert(x, y)
      placed.set(p.id, zoom)
    }
  }

  return placed
}
