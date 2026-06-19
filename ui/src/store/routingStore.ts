import { create } from 'zustand'
import type { RoutingResult } from '../types'

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

export const useRoutingStore = create<RoutingState>((set) => ({
  origin: null,
  destination: null,
  routingResults: [],
  selectedResultIndex: null,
  mapClickMode: null,
  isMinimized: true,
  setOrigin: (origin) => set({ origin }),
  setDestination: (destination) => set({ destination }),
  setRoutingResults: (routingResults) =>
    set({ routingResults, selectedResultIndex: routingResults.length > 0 ? 0 : null }),
  setSelectedResultIndex: (selectedResultIndex) => set({ selectedResultIndex }),
  setMapClickMode: (mapClickMode) => set({ mapClickMode }),
  setIsMinimized: (isMinimized) => set({ isMinimized }),
  clearRouting: () =>
    set({
      origin: null,
      destination: null,
      routingResults: [],
      selectedResultIndex: null,
      mapClickMode: null,
      isMinimized: true,
    }),
}))
