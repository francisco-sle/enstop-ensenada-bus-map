import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, 
  Paintbrush, 
  MapPin, 
  Eye, 
  Undo2, 
  Trash2, 
  Download, 
  Info,
  Layers,
  Settings
} from 'lucide-react'
import { EditorMap } from '../components/Map/EditorMap'
import { useOsrmRoute } from '../hooks/useOsrmRoute'

interface PlacedStop {
  id: string
  name: string
  lat: number
  lng: number
  isTerminal: boolean
}

export function EditorPage() {
  const navigate = useNavigate()
  const { snapCoordinates, loading: isSnapping } = useOsrmRoute()

  // State
  const [mode, setMode] = useState<'draw-route' | 'add-stop' | 'view'>('view')
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([])
  const [routeHistory, setRouteHistory] = useState<[number, number][][]>([]) // for undo
  const [stops, setStops] = useState<PlacedStop[]>([])
  
  // Route details metadata
  const [routeName, setRouteName] = useState('Nueva Ruta')
  const [routeShortName, setRouteShortName] = useState('N1')
  const [routeDirection, setRouteDirection] = useState<'circular' | 'bidirectional'>('circular')
  const [routeColor, setRouteColor] = useState('#4ca8d4')
  
  // Snapping logic wrapper
  const handleSnapTrace = async (coords: [number, number][]) => {
    // Snap coords to streets
    const snapped = await snapCoordinates(coords, 'driving')
    return snapped
  }

  const handleRouteCoordsSnapped = (newCoords: [number, number][]) => {
    setRouteHistory(prev => [...prev, routeCoords])
    setRouteCoords(prev => {
      if (prev.length === 0) return newCoords
      // Trim the leading point of the new stroke if it overlaps the existing tail
      // (OSRM Match API can return a point very close to where the prior stroke ended)
      const tail = prev[prev.length - 1]
      const head = newCoords[0]
      const latDiff = Math.abs(head[0] - tail[0])
      const lngDiff = Math.abs(head[1] - tail[1])
      const isTooClose = latDiff < 0.0002 && lngDiff < 0.0002 // ~20m
      return [...prev, ...(isTooClose ? newCoords.slice(1) : newCoords)]
    })
  }

  const handleAddStop = useCallback((latlng: [number, number]) => {
    const newStop: PlacedStop = {
      id: `stop-${Date.now()}`,
      name: `Parada ${stops.length + 1}`,
      lat: latlng[0],
      lng: latlng[1],
      isTerminal: false
    }
    setStops(prev => [...prev, newStop])
  }, [stops.length])

  const handleDeleteStop = useCallback((id: string) => {
    setStops(prev => prev.filter(s => s.id !== id))
  }, [])

  const handleUpdateStopName = (id: string, name: string) => {
    setStops(prev => prev.map(s => s.id === id ? { ...s, name } : s))
  }

  const handleToggleTerminal = (id: string) => {
    setStops(prev => prev.map(s => s.id === id ? { ...s, isTerminal: !s.isTerminal } : s))
  }

  const handleUndo = () => {
    if (routeHistory.length > 0) {
      const prev = routeHistory[routeHistory.length - 1]
      setRouteCoords(prev)
      setRouteHistory(prev => prev.slice(0, prev.length - 1))
    }
  }

  const handleClearRoute = () => {
    if (window.confirm('¿Deseas borrar todo el trazo de la ruta?')) {
      setRouteHistory(prev => [...prev, routeCoords])
      setRouteCoords([])
    }
  }

  const handleClearStops = () => {
    if (window.confirm('¿Deseas borrar todas las paradas añadidas?')) {
      setStops([])
    }
  }

  const handleExportJSON = () => {
    // Format the data exactly like db schema / mocks structure
    // coords must be [lng, lat] for GeoJSON
    const formattedRouteGeom = {
      type: 'LineString',
      coordinates: routeCoords.map(c => [c[1], c[0]])
    }

    const exportedStops = stops.map((s, index) => ({
      id: 1000 + index,
      name: s.name,
      common_name: s.name,
      geom: {
        type: 'Point',
        coordinates: [s.lng, s.lat]
      },
      is_terminal: s.isTerminal,
      accessible: true,
      created_at: new Date().toISOString()
    }))

    const exportedRoute = {
      id: 999,
      name: `${routeShortName} — ${routeName}`,
      short_name: routeShortName,
      category_id: 1,
      description: `Creada en Enstop Editor`,
      direction: routeDirection,
      geom: formattedRouteGeom,
      route_stops: exportedStops.map((s, i) => ({
        stop_id: s.id,
        sequence: i + 1
      }))
    }

    const exportPayload = {
      route: exportedRoute,
      stops: exportedStops
    }

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportPayload, null, 2))
    const downloadAnchor = document.createElement('a')
    downloadAnchor.setAttribute("href", dataStr)
    downloadAnchor.setAttribute("download", `route-${routeShortName.toLowerCase()}.json`)
    document.body.appendChild(downloadAnchor)
    downloadAnchor.click()
    downloadAnchor.remove()
  }

  return (
    <div className="w-full h-full flex flex-col md:flex-row overflow-hidden relative bg-bay-950">
      
      {/* Sidebar - Tools and settings */}
      <div className="w-full md:w-[360px] lg:w-[400px] shrink-0 bg-surface border-r border-white/8 flex flex-col overflow-y-auto z-10 select-none">
        
        {/* Top Header */}
        <div className="p-4 border-b border-white/8 flex items-center gap-3">
          <button 
            onClick={() => navigate('/about')}
            className="p-2 hover:bg-white/5 rounded-lg text-white/70 hover:text-white transition-colors"
            aria-label="Volver a Acerca"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h2 className="text-sm font-bold text-white font-display">Diseñador de Rutas</h2>
            <p className="text-2xs text-white/55">Crea trazados de ruta y paradas desde cero</p>
          </div>
        </div>

        {/* Settings Form */}
        <div className="p-4 flex flex-col gap-4 border-b border-white/8 bg-bay-950/20">
          <div className="flex items-center gap-2 text-pacific-400 font-semibold text-xs uppercase tracking-wider">
            <Settings size={14} />
            <span>Datos de la Ruta</span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-1 flex flex-col gap-1">
              <label className="text-[10px] text-white/50 font-bold uppercase">Código</label>
              <input 
                type="text" 
                value={routeShortName}
                onChange={e => setRouteShortName(e.target.value)}
                className="bg-surface-elevated border border-white/8 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-pacific-400 font-bold text-center"
                placeholder="R1"
              />
            </div>
            <div className="col-span-2 flex flex-col gap-1">
              <label className="text-[10px] text-white/50 font-bold uppercase">Nombre Completo</label>
              <input 
                type="text" 
                value={routeName}
                onChange={e => setRouteName(e.target.value)}
                className="bg-surface-elevated border border-white/8 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-pacific-400"
                placeholder="Centro - Chapultepec"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-white/50 font-bold uppercase">Sentido</label>
              <select 
                value={routeDirection}
                onChange={e => setRouteDirection(e.target.value as 'circular' | 'bidirectional')}
                className="bg-surface-elevated border border-white/8 rounded-lg px-2 py-2 text-xs text-white focus:outline-none focus:border-pacific-400 cursor-pointer"
              >
                <option value="circular">Circular (Bucle)</option>
                <option value="bidirectional">Ida/Vuelta</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-white/50 font-bold uppercase">Color de Ruta</label>
              <div className="flex gap-2 items-center">
                <input 
                  type="color" 
                  value={routeColor}
                  onChange={e => setRouteColor(e.target.value)}
                  className="w-8 h-8 rounded-lg border border-white/8 cursor-pointer p-0 bg-transparent"
                />
                <input 
                  type="text" 
                  value={routeColor}
                  onChange={e => setRouteColor(e.target.value)}
                  className="bg-surface-elevated border border-white/8 rounded-lg px-2 py-2 text-[11px] text-white focus:outline-none focus:border-pacific-400 uppercase font-mono flex-1 text-center"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Drawing Controls */}
        <div className="p-4 flex flex-col gap-3 border-b border-white/8">
          <div className="flex items-center gap-2 text-pacific-400 font-semibold text-xs uppercase tracking-wider">
            <Layers size={14} />
            <span>Herramientas de Dibujo</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setMode('view')}
              className={`flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                mode === 'view' 
                  ? 'bg-pacific/10 border-pacific text-pacific shadow-glow' 
                  : 'bg-white/5 border-white/8 text-white/70 hover:bg-white/8'
              }`}
            >
              <Eye size={16} />
              <span>Navegar</span>
            </button>

            <button
              onClick={() => setMode('draw-route')}
              className={`flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                mode === 'draw-route' 
                  ? 'bg-pacific/10 border-pacific text-pacific shadow-glow' 
                  : 'bg-white/5 border-white/8 text-white/70 hover:bg-white/8'
              }`}
            >
              <Paintbrush size={16} />
              <span>Pintar Ruta</span>
            </button>

            <button
              onClick={() => setMode('add-stop')}
              className={`flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                mode === 'add-stop' 
                  ? 'bg-pacific/10 border-pacific text-pacific shadow-glow' 
                  : 'bg-white/5 border-white/8 text-white/70 hover:bg-white/8'
              }`}
            >
              <MapPin size={16} />
              <span>Añadir Parada</span>
            </button>
          </div>

          {mode === 'draw-route' && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex gap-2.5 items-start mt-1">
              <Info size={16} className="text-amber-400 shrink-0 mt-0.5" />
              <p className="text-[10px] leading-relaxed text-white/80">
                <strong>Hold click (mantén presionado)</strong> y arrastra el cursor por el mapa para pintar el recorrido. Al soltar, el trazo se ajustará automáticamente a las calles transitables.
              </p>
            </div>
          )}

          {mode === 'add-stop' && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex gap-2.5 items-start mt-1">
              <Info size={16} className="text-amber-400 shrink-0 mt-0.5" />
              <p className="text-[10px] leading-relaxed text-white/80">
                Haz click en cualquier punto del mapa para colocar una parada de microbús. Podrás cambiarle el nombre y ordenarla en el listado.
              </p>
            </div>
          )}

          {/* Action Operations */}
          <div className="flex gap-2 mt-2">
            <button
              onClick={handleUndo}
              disabled={routeHistory.length === 0}
              className="flex-1 btn py-2 min-h-0 text-xs gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
              title="Deshacer último trazo"
            >
              <Undo2 size={14} />
              <span>Deshacer</span>
            </button>

            <button
              onClick={handleClearRoute}
              disabled={routeCoords.length === 0}
              className="flex-1 btn py-2 min-h-0 text-xs gap-1.5 text-red-400 hover:text-red-300 disabled:opacity-40 disabled:cursor-not-allowed"
              title="Borrar ruta entera"
            >
              <Trash2 size={14} />
              <span>Borrar Ruta</span>
            </button>
          </div>
        </div>

        {/* Stops List */}
        <div className="flex-1 p-4 flex flex-col gap-3 min-h-[200px]">
          <div className="flex items-center justify-between">
            <span className="text-pacific-400 font-semibold text-xs uppercase tracking-wider">
              Paradas Colocadas ({stops.length})
            </span>
            {stops.length > 0 && (
              <button 
                onClick={handleClearStops}
                className="text-[10px] text-red-400 hover:text-red-300 font-semibold transition-colors"
              >
                Borrar todas
              </button>
            )}
          </div>

          {stops.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-2 border border-dashed border-white/8 rounded-xl p-6 text-center text-white/45">
              <MapPin size={24} className="text-white/30" />
              <p className="text-[11px]">No hay paradas en esta ruta. Activa "Añadir Parada" y haz click en el mapa.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2 overflow-y-auto max-h-[300px] pr-1">
              {stops.map((stop, index) => (
                <div 
                  key={stop.id} 
                  className="bg-surface-elevated border border-white/8 rounded-xl p-3 flex flex-col gap-2 group hover:border-white/12 transition-all"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] bg-pacific/15 text-pacific font-bold px-1.5 py-0.5 rounded">
                      #{index + 1}
                    </span>
                    <input 
                      type="text" 
                      value={stop.name} 
                      onChange={e => handleUpdateStopName(stop.id, e.target.value)}
                      className="bg-transparent border-b border-transparent hover:border-white/20 focus:border-pacific text-xs text-white font-bold px-1 focus:outline-none flex-1 truncate"
                    />
                    <button 
                      onClick={() => handleDeleteStop(stop.id)}
                      className="opacity-0 group-hover:opacity-100 text-white/40 hover:text-red-400 transition-all p-1"
                      title="Eliminar parada"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-white/50">
                    <span>{stop.lat.toFixed(5)}, {stop.lng.toFixed(5)}</span>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={stop.isTerminal}
                        onChange={() => handleToggleTerminal(stop.id)}
                        className="rounded border-white/10 text-pacific bg-bay-950 focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5"
                      />
                      <span>¿Terminal?</span>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-white/8 bg-bay-950/40 mt-auto">
          <button
            onClick={handleExportJSON}
            disabled={routeCoords.length === 0}
            className="w-full btn btn-primary py-3 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Download size={16} />
            <span>Exportar Ruta en JSON</span>
          </button>
        </div>

      </div>

      {/* Map Content View */}
      <div className="flex-1 h-full w-full relative min-h-0">
        <EditorMap 
          mode={mode}
          routeCoords={routeCoords}
          stops={stops}
          onRouteCoordsSnapped={handleRouteCoordsSnapped}
          onAddStop={handleAddStop}
          onDeleteStop={handleDeleteStop}
          snapTrace={handleSnapTrace}
          isSnapping={isSnapping}
        />
      </div>

    </div>
  )
}
