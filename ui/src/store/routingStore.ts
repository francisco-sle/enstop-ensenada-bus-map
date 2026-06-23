import { create } from 'zustand'
import type { RoutingResult } from '../types'
import { useMapStore } from './mapStore'

export type MapClickMode = 'origin' | 'destination' | null

interface RoutingState {
  origin: { lat: number; lng: number; label: string } | null
  destination: { lat: number; lng: number; label: string } | null
  routingResults: RoutingResult[]
  selectedResultIndex: number | null
  mapClickMode: MapClickMode
  isMinimized: boolean
  setOrigin: (origin: { lat: number; lng: number; label: string } | null) => void
  setDestination: (dest: { lat: number; lng: number; label: string } | null) => void
  setRoutingResults: (results: RoutingResult[]) => void
  setSelectedResultIndex: (index: number | null) => void
  setMapClickMode: (mode: MapClickMode) => void
  setIsMinimized: (minimized: boolean) => void
  clearRouting: () => void
}

export const useRoutingStore = create<RoutingState>((set, get) => ({
  origin: null,
  destination: null,
  routingResults: [],
  selectedResultIndex: null,
  mapClickMode: null,
  isMinimized: true,

  setOrigin: (origin) => {
    set({ origin })
    if (!origin && !get().destination && get().routingResults.length === 0) {
      useMapStore.getState().setVisibleRouteIds(new Set())
    }
  },

  setDestination: (destination) => {
    set({ destination })
    if (!get().origin && !destination && get().routingResults.length === 0) {
      useMapStore.getState().setVisibleRouteIds(new Set())
    }
  },

  setRoutingResults: (routingResults) => {
    const selectedResultIndex = routingResults.length > 0 ? 0 : null
    set({ routingResults, selectedResultIndex })

    if (selectedResultIndex !== null && routingResults[selectedResultIndex]) {
      useMapStore
        .getState()
        .setVisibleRouteIds(new Set([routingResults[selectedResultIndex].routeId]))
    }
  },

  setSelectedResultIndex: (selectedResultIndex) => {
    set({ selectedResultIndex })
    const { routingResults } = get()
    if (selectedResultIndex !== null && routingResults[selectedResultIndex]) {
      useMapStore
        .getState()
        .setVisibleRouteIds(new Set([routingResults[selectedResultIndex].routeId]))
    }
  },

  setMapClickMode: (mapClickMode) => set({ mapClickMode }),
  setIsMinimized: (isMinimized) => set({ isMinimized }),

  clearRouting: () => {
    set({
      origin: null,
      destination: null,
      routingResults: [],
      selectedResultIndex: null,
      mapClickMode: null,
      isMinimized: true,
    })
    useMapStore.getState().setVisibleRouteIds(new Set())
  },
}))
