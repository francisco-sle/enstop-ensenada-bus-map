import { useState } from 'react'

// Helper to calculate approximate distance in meters between two lat/lng points
function getDistanceMeters(p1: [number, number], p2: [number, number]): number {
  const latDiff = p1[0] - p2[0]
  const lngDiff = p1[1] - p2[1]
  const latMeters = latDiff * 111000
  const lngMeters = lngDiff * 94000 // Approximate for Ensenada (lat 31.8)
  return Math.sqrt(latMeters * latMeters + lngMeters * lngMeters)
}

// Compute cardinal bearing (0–360°) from point A to point B
function getBearing(from: [number, number], to: [number, number]): number {
  const dLat = to[0] - from[0]
  const dLng = to[1] - from[1]
  // atan2 in lat/lng space gives approximate bearing
  const angle = Math.atan2(dLng, dLat) * (180 / Math.PI)
  return (angle + 360) % 360
}

// Ramer-Douglas-Peucker simplification — retains shape-critical points,
// discards redundant collinear ones. Epsilon is in degrees (lat/lng space).
function rdpSimplify(coords: [number, number][], epsilon: number): [number, number][] {
  if (coords.length <= 2) return coords

  // Find the point with the maximum perpendicular distance from the line
  // between first and last
  const first = coords[0]
  const last = coords[coords.length - 1]
  const dx = last[0] - first[0]
  const dy = last[1] - first[1]
  const lineLen = Math.sqrt(dx * dx + dy * dy)

  let maxDist = 0
  let maxIdx = 0

  for (let i = 1; i < coords.length - 1; i++) {
    const px = coords[i][0] - first[0]
    const py = coords[i][1] - first[1]
    // Perpendicular distance from point to the first→last line
    const perp =
      lineLen === 0 ? Math.sqrt(px * px + py * py) : Math.abs(px * dy - py * dx) / lineLen
    if (perp > maxDist) {
      maxDist = perp
      maxIdx = i
    }
  }

  if (maxDist > epsilon) {
    const left = rdpSimplify(coords.slice(0, maxIdx + 1), epsilon)
    const right = rdpSimplify(coords.slice(maxIdx), epsilon)
    return [...left.slice(0, -1), ...right]
  }

  return [first, last]
}

// Prunes backtracking "overshoots" and wiggles from a hand-drawn path
function pruneOvershoots(coords: [number, number][]): [number, number][] {
  if (coords.length < 3) return coords

  const result = [...coords]
  let changed = true
  let iterations = 0
  const maxIterations = 5 // Avoid infinite loops

  while (changed && iterations < maxIterations) {
    changed = false
    iterations++

    for (let i = 1; i < result.length - 1; i++) {
      const pPrev = result[i - 1]
      const pCurr = result[i]
      const pNext = result[i + 1]

      // Compute vectors for the angle at the current vertex
      const v1 = [pCurr[0] - pPrev[0], pCurr[1] - pPrev[1]]
      const v2 = [pNext[0] - pCurr[0], pNext[1] - pCurr[1]]

      const len1 = Math.sqrt(v1[0] * v1[0] + v1[1] * v1[1])
      const len2 = Math.sqrt(v2[0] * v2[0] + v2[1] * v2[1])

      if (len1 === 0 || len2 === 0) continue

      // Dot product to check for sharp turn (> 120 degrees backtrack)
      const dot = v1[0] * v2[0] + v1[1] * v2[1]
      const cosTheta = dot / (len1 * len2)

      if (cosTheta < -0.8) {
        // Only prune extreme zigzags (>145°), not valid U-turns at bus termini
        let pruneStart = i
        let pruneEnd = i
        let bestDistance = Infinity
        let foundPrune = false

        // Look for nearby points before and after the sharp turn that close the loop
        const maxSearch = 12
        for (let left = Math.max(0, i - maxSearch); left < i; left++) {
          for (let right = i + 1; right < Math.min(result.length, i + maxSearch); right++) {
            const dist = getDistanceMeters(result[left], result[right])

            // If the backtrack returns to a point within 35 meters
            if (dist < 35) {
              let pathDist = 0
              for (let k = left; k < right; k++) {
                pathDist += getDistanceMeters(result[k], result[k + 1])
              }

              // Path must be significantly longer than the shortcut to count as an overshoot
              if (pathDist > dist * 2 && pathDist > 40) {
                if (dist < bestDistance) {
                  bestDistance = dist
                  pruneStart = left
                  pruneEnd = right
                  foundPrune = true
                }
              }
            }
          }
        }

        if (foundPrune && pruneEnd > pruneStart + 1) {
          result.splice(pruneStart + 1, pruneEnd - pruneStart - 1)
          changed = true
          break // Restart loop with pruned array
        }
      }
    }
  }

  return result
}

export interface SnappedRoute {
  trace: [number, number][]
  nodes: { coord: [number, number]; traceIndex: number }[]
}

export function useOsrmRoute() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const snapCoordinates = async (
    coords: [number, number][],
    profile: 'driving' | 'foot' = 'driving',
  ): Promise<SnappedRoute | null> => {
    if (coords.length < 2) return null
    setLoading(true)
    setError(null)

    try {
      // 0. Use RDP spatial simplification first to reduce density while preserving shape.
      // Epsilon ~0.00005° ≈ 5m — keeps curve fidelity, drops redundant collinear points.
      const simplified = rdpSimplify(coords, 0.00005)

      // 1. Prune any hand-drawn wiggles/overshoots on the thinned set
      const prunedCoords = pruneOvershoots(simplified)

      // OSRM expects coordinates in [lng, lat] format
      // Hard cap at 100 waypoints (OSRM public API limit)
      let queryCoordsArray = prunedCoords
      if (prunedCoords.length > 100) {
        const step = Math.ceil(prunedCoords.length / 99)
        queryCoordsArray = prunedCoords.filter((_, idx) => idx % step === 0)
        if (
          queryCoordsArray[queryCoordsArray.length - 1] !== prunedCoords[prunedCoords.length - 1]
        ) {
          queryCoordsArray.push(prunedCoords[prunedCoords.length - 1])
        }
      }

      const queryCoords = queryCoordsArray.map((c) => `${c[1]},${c[0]}`).join(';')
      // 35m snap radius — tolerant enough for imprecise hand-painting near road edges without jumping blocks
      const radiuses = queryCoordsArray.map(() => '35').join(';')

      // Build bearing string: each waypoint gets the bearing FROM the prior point.
      // Range of ±45° allows for painting imprecision while still disambiguating direction.
      const bearings = queryCoordsArray
        .map((_, i) => {
          if (queryCoordsArray.length < 2) return ''
          const fromPt = i === 0 ? queryCoordsArray[0] : queryCoordsArray[i - 1]
          const toPt = i === 0 ? queryCoordsArray[1] : queryCoordsArray[i]
          const bearing = Math.round(getBearing(fromPt, toPt))
          return `${bearing},45`
        })
        .join(';')

      // Helper to compute node mapping to trace indices
      const computeNodes = (trace: [number, number][]) => {
        // Extract corners directly from the OSRM physical trace
        // Epsilon 0.00005 degrees ≈ 5 meters. This preserves all street corners.
        const corners = rdpSimplify(trace, 0.00005)

        const nodes: { coord: [number, number]; traceIndex: number }[] = []
        let searchStartIdx = 0

        for (const coord of corners) {
          // Search forward from the last found index to support intersecting loops correctly
          let idx = -1
          for (let i = searchStartIdx; i < trace.length; i++) {
            if (trace[i][0] === coord[0] && trace[i][1] === coord[1]) {
              idx = i
              break
            }
          }

          if (idx !== -1) {
            nodes.push({ coord: trace[idx], traceIndex: idx })
            searchStartIdx = idx
          } else {
            // Fallback if precision issues occur (very rare)
            const fallbackIdx = trace.findIndex((t) => t[0] === coord[0] && t[1] === coord[1])
            if (fallbackIdx !== -1) {
              nodes.push({ coord: trace[fallbackIdx], traceIndex: fallbackIdx })
              searchStartIdx = fallbackIdx
            }
          }
        }

        return nodes
      }

      // 1. Try Match API first (best for freehand traces)
      const matchUrl = `https://router.project-osrm.org/match/v1/${profile}/${queryCoords}?overview=full&geometries=geojson&tidy=true&radiuses=${radiuses}&bearings=${bearings}`

      try {
        const matchRes = await fetch(matchUrl)
        if (matchRes.ok) {
          const matchData = await matchRes.json()
          if (matchData.code === 'Ok' && matchData.matchings && matchData.matchings.length > 0) {
            // OSRM returns multiple disjoint sub-matchings when it fragments the trace.
            // Concatenating them causes ghost loops on two-way streets.
            // Strategy: pick only the single longest matching by geometry coordinate count.
            const best = matchData.matchings.reduce(
              (
                acc: { geometry: { coordinates: [number, number][] } },
                m: { geometry: { coordinates: [number, number][] } },
              ) => (m.geometry.coordinates.length > acc.geometry.coordinates.length ? m : acc),
            )
            const snapped = best.geometry.coordinates.map(
              (c: [number, number]) => [c[1], c[0]] as [number, number],
            )
            return { trace: snapped, nodes: computeNodes(snapped) }
          }
        }
      } catch (err) {
        console.warn('Match API failed, falling back to Route API', err)
      }

      // 2. Fallback to Route API
      const routeUrl = `https://router.project-osrm.org/route/v1/${profile}/${queryCoords}?overview=full&geometries=geojson&continue_straight=true`
      const routeRes = await fetch(routeUrl)
      if (!routeRes.ok) {
        throw new Error(`OSRM request failed: ${routeRes.statusText}`)
      }

      const routeData = await routeRes.json()
      if (routeData.code === 'Ok' && routeData.routes && routeData.routes.length > 0) {
        const snapped = routeData.routes[0].geometry.coordinates.map(
          (c: [number, number]) => [c[1], c[0]] as [number, number],
        )
        return { trace: snapped, nodes: computeNodes(snapped) }
      } else {
        throw new Error(`OSRM returned code: ${routeData.code}`)
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      console.warn('Failed to fetch snapped route from OSRM:', err)
      setError(errorMessage || 'Failed to snap route to streets')
      // Fallback to original coordinates on error
      return {
        trace: coords,
        nodes: coords.map((c, i) => ({ coord: c, traceIndex: i })),
      }
    } finally {
      setLoading(false)
    }
  }

  return { snapCoordinates, loading, error }
}
