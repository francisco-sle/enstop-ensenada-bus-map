import { useState, useEffect, useRef } from 'react'

export interface PhotonResult {
  label: string
  lat: number
  lng: number
  type: string // e.g. 'street', 'city', 'house'
}

// Ensenada municipality bounding box [minLng, minLat, maxLng, maxLat]
const ENSENADA_BBOX = '-116.90,31.60,-116.35,32.00'
const PHOTON_URL = 'https://photon.komoot.io/api/'
const DEBOUNCE_MS = 300
const MIN_QUERY_LENGTH = 3

/**
 * Constructs a human-readable address label from raw Photon feature properties.
 * Prioritizes: name → street+housenumber → city.
 *
 * @example
 * buildLabel({ name: 'Parque Riviera', street: 'Av. Lázaro Cárdenas', city: 'Ensenada' })
 * // => 'Parque Riviera, Av. Lázaro Cárdenas, Ensenada'
 *
 * buildLabel({ street: 'Calle Primera', housenumber: '42', city: 'Ensenada' })
 * // => 'Calle Primera 42, Ensenada'
 */
function buildLabel(props: Record<string, string | undefined>): string {
  const parts: string[] = []
  if (props.name) parts.push(props.name)
  if (props.street) {
    const streetPart = props.housenumber ? `${props.street} ${props.housenumber}` : props.street
    if (!parts.includes(streetPart)) parts.push(streetPart)
  }
  if (props.city && props.city !== props.name) parts.push(props.city)
  return parts.join(', ') || 'Dirección desconocida'
}

/**
 * Debounced geocoding hook. Queries the Photon API (Komoot) for address
 * suggestions within the Ensenada municipality bounding box.
 *
 * - Requests are debounced by 300ms.
 * - Queries shorter than 3 characters are short-circuited (no API call).
 * - In-flight requests are automatically aborted when the query changes.
 *
 * @param query - Raw text input from the user.
 * @returns `{ results, isLoading }` — `results` is empty while loading or when input is too short.
 *
 * @example
 * function SearchInput() {
 *   const [q, setQ] = useState('')
 *   const { results, isLoading } = usePhotonGeocoder(q)
 *   //  results: PhotonResult[] — label, lat, lng, type
 *   return <input onChange={e => setQ(e.target.value)} />
 * }
 */
export function usePhotonGeocoder(query: string): {
  results: PhotonResult[]
  isLoading: boolean
} {
  const [results, setResults] = useState<PhotonResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    const trimmed = query.trim()

    // Cancel any previous in-flight request + timer
    if (abortRef.current) {
      abortRef.current.abort()
      abortRef.current = null
    }

    // All state updates happen inside the async timeout — never synchronously inside the effect
    const controller = new AbortController()
    abortRef.current = controller

    const timer = setTimeout(async () => {
      // Short query — clear results without hitting the API
      if (trimmed.length < MIN_QUERY_LENGTH) {
        setResults([])
        setIsLoading(false)
        return
      }

      setIsLoading(true)

      try {
        const params = new URLSearchParams({
          q: trimmed,
          bbox: ENSENADA_BBOX,
          limit: '5',
        })

        const response = await fetch(`${PHOTON_URL}?${params.toString()}`, {
          signal: controller.signal,
        })

        if (!response.ok) throw new Error(`Photon API error: ${response.status}`)

        const data = (await response.json()) as {
          features: Array<{
            geometry: { coordinates: [number, number] }
            properties: Record<string, string | undefined>
          }>
        }

        const parsed: PhotonResult[] = data.features.map((f) => ({
          label: buildLabel(f.properties),
          lat: f.geometry.coordinates[1],
          lng: f.geometry.coordinates[0],
          type: f.properties.type ?? 'place',
        }))

        setResults(parsed)
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') return
        console.warn('[Photon] Geocoding request failed:', err)
        setResults([])
      } finally {
        setIsLoading(false)
      }
    }, DEBOUNCE_MS)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [query])

  return { results, isLoading }
}
