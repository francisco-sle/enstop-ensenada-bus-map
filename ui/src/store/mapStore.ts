import { create } from 'zustand'

/** Cap on routes drawn in color at once — beyond this the map stops being readable. */
export const MAX_SHOWN_ROUTES = 5

/** [[south, west], [north, east]] of the map area not covered by floating panels. */
export type ViewBounds = [[number, number], [number, number]]

interface MapState {
  center: [number, number]
  zoom: number
  selectedStopId: number | null
  selectedRouteId: number | null
  userLocation: [number, number] | null
  /** Routes drawn in color, in the order the user picked them (drives color assignment). */
  shownRouteIds: number[]
  viewBounds: ViewBounds | null
  setCenter: (center: [number, number]) => void
  setZoom: (zoom: number) => void
  setSelectedStopId: (id: number | null) => void
  setSelectedRouteId: (id: number | null) => void
  setUserLocation: (loc: [number, number] | null) => void
  /** Adds or removes a route. Returns false when adding would exceed MAX_SHOWN_ROUTES. */
  toggleShownRoute: (id: number) => boolean
  setShownRouteIds: (ids: number[]) => void
  setViewBounds: (bounds: ViewBounds) => void
  resetMap: () => void
}

export const useMapStore = create<MapState>((set, get) => ({
  center: [31.83, -116.6], // Ensenada central view covering Reforma
  zoom: 13,
  selectedStopId: null,
  selectedRouteId: null,
  userLocation: null,
  shownRouteIds: [],
  viewBounds: null,
  setCenter: (center) => set({ center }),
  setZoom: (zoom) => set({ zoom }),
  setSelectedStopId: (selectedStopId) => set({ selectedStopId, selectedRouteId: null }),
  setSelectedRouteId: (selectedRouteId) => set({ selectedRouteId }),
  setUserLocation: (userLocation) => set({ userLocation }),
  toggleShownRoute: (id) => {
    const { shownRouteIds } = get()
    if (shownRouteIds.includes(id)) {
      set({ shownRouteIds: shownRouteIds.filter((r) => r !== id) })
      return true
    }
    if (shownRouteIds.length >= MAX_SHOWN_ROUTES) return false
    set({ shownRouteIds: [...shownRouteIds, id] })
    return true
  },
  setShownRouteIds: (shownRouteIds) => set({ shownRouteIds }),
  setViewBounds: (viewBounds) => set({ viewBounds }),
  resetMap: () =>
    set({ selectedStopId: null, selectedRouteId: null, zoom: 13, center: [31.83, -116.6] }),
}))
