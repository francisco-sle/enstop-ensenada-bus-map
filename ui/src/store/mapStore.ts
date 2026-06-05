import { create } from 'zustand'

interface MapState {
  center: [number, number]
  zoom: number
  selectedStopId: number | null
  selectedRouteId: number | null
  userLocation: [number, number] | null
  setCenter: (center: [number, number]) => void
  setZoom: (zoom: number) => void
  setSelectedStopId: (id: number | null) => void
  setSelectedRouteId: (id: number | null) => void
  setUserLocation: (loc: [number, number] | null) => void
  resetMap: () => void
}

export const useMapStore = create<MapState>((set) => ({
  center: [31.83, -116.60], // Ensenada central view covering Reforma
  zoom: 13,
  selectedStopId: null,
  selectedRouteId: null,
  userLocation: null,
  setCenter: (center) => set({ center }),
  setZoom: (zoom) => set({ zoom }),
  setSelectedStopId: (selectedStopId) => set({ selectedStopId }),
  setSelectedRouteId: (selectedRouteId) => set({ selectedRouteId }),
  setUserLocation: (userLocation) => set({ userLocation }),
  resetMap: () => set({ selectedStopId: null, selectedRouteId: null, zoom: 13, center: [31.83, -116.60] })
}))
