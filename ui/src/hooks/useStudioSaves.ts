import { useState, useEffect, useCallback } from 'react'
import type { DrawStroke, PlacedStop } from '../pages/EditorPage'

export interface StudioSaveData {
  strokes: DrawStroke[]
  stops: PlacedStop[]
  routeName: string
  routeShortName: string
  routeDirection: 'circular' | 'bidirectional'
  routeColor: string
}

export interface StudioSave {
  id: string
  type: 'autosave' | 'manual'
  name: string
  timestamp: number
  data: StudioSaveData
}

const STORAGE_KEY = 'enstop_studio_saves'

export function useStudioSaves() {
  const [saves, setSaves] = useState<StudioSave[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        return JSON.parse(stored)
      }
    } catch (err) {
      console.error('Failed to load studio saves from local storage', err)
    }
    return []
  })

  // Save to local storage whenever saves state changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saves))
    } catch (err) {
      console.error('Failed to save studio saves to local storage', err)
    }
  }, [saves])

  const createSave = useCallback(
    (data: StudioSaveData, type: 'autosave' | 'manual', customName?: string) => {
      setSaves((prev) => {
        let newSaves = [...prev]

        // If autosave, remove previous autosave to keep only one (or keep a history, let's keep only 1 autosave to save space)
        if (type === 'autosave') {
          newSaves = newSaves.filter((s) => s.type !== 'autosave')
        }

        const name = customName
          ? customName
          : type === 'autosave'
            ? `Autoguardado - ${data.routeShortName || 'Nueva Ruta'}`
            : `Guardado - ${data.routeShortName || 'Nueva Ruta'}`

        const newSave: StudioSave = {
          id: `save-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type,
          name,
          timestamp: Date.now(),
          data,
        }

        return [newSave, ...newSaves]
      })
    },
    [],
  )

  const deleteSave = useCallback((id: string) => {
    setSaves((prev) => prev.filter((s) => s.id !== id))
  }, [])

  const clearAll = useCallback(() => {
    setSaves([])
  }, [])

  return {
    saves,
    createSave,
    deleteSave,
    clearAll,
  }
}
