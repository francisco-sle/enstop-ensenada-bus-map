import { useState, useCallback, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Paintbrush,
  MapPin,
  Eye,
  Undo2,
  Trash2,
  Download,
  Upload,
  Info,
  Layers,
  Settings,
} from 'lucide-react'
import { EditorMap } from '../components/Map/EditorMap'
import { useOsrmRoute } from '../hooks/useOsrmRoute'

export interface DrawStroke {
  id: string
  nodes: { coord: [number, number]; traceIndex: number }[]
  trace: [number, number][]
}

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
  const [mode, setMode] = useState<'draw-route' | 'add-stop' | 'view'>('draw-route')
  const [strokes, setStrokes] = useState<DrawStroke[]>([])
  const [history, setHistory] = useState<DrawStroke[][]>([])
  const [future, setFuture] = useState<DrawStroke[][]>([])
  const [stops, setStops] = useState<PlacedStop[]>([])
  const [selectedNode, setSelectedNode] = useState<{ strokeId: string; nodeIndex: number } | null>(
    null,
  )

  const dragStartStrokesRef = useRef<DrawStroke[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  const saveState = useCallback(
    (newStrokes: DrawStroke[]) => {
      setHistory((prev) => [...prev, strokes])
      setFuture([])
      setStrokes(newStrokes)
    },
    [strokes],
  )

  const handleRouteCoordsSnapped = (newSnapped: {
    trace: [number, number][]
    nodes: { coord: [number, number]; traceIndex: number }[]
  }) => {
    if (strokes.length > 0) {
      const lastStroke = strokes[strokes.length - 1]
      const lastCoord = lastStroke.trace[lastStroke.trace.length - 1]
      const firstCoord = newSnapped.trace[0]
      const latDiff = Math.abs(firstCoord[0] - lastCoord[0])
      const lngDiff = Math.abs(firstCoord[1] - lastCoord[1])

      if (latDiff > 0.0005 || lngDiff > 0.0005) {
        // ~50m
        alert('La nueva ruta debe continuar desde el final del trazo anterior.')
        return
      }

      const isExactMatch = firstCoord[0] === lastCoord[0] && firstCoord[1] === lastCoord[1]
      const traceOffset = isExactMatch ? 1 : 0
      const newTrace = newSnapped.trace.slice(traceOffset)

      const newNodes = newSnapped.nodes
        .filter((_, idx) => !(isExactMatch && idx === 0))
        .map((node) => ({
          ...node,
          traceIndex: node.traceIndex + lastStroke.trace.length - traceOffset,
        }))

      const mergedStroke: DrawStroke = {
        ...lastStroke,
        trace: [...lastStroke.trace, ...newTrace],
        nodes: [...lastStroke.nodes, ...newNodes],
      }

      saveState([...strokes.slice(0, -1), mergedStroke])
      return
    }

    const newStroke: DrawStroke = {
      id: `stroke-${Date.now()}`,
      nodes: newSnapped.nodes,
      trace: newSnapped.trace,
    }
    saveState([...strokes, newStroke])
  }

  const handleNodeDragStart = useCallback(() => {
    dragStartStrokesRef.current = strokes
  }, [strokes])

  const handleLineClickNodeInsert = useCallback(
    (strokeId: string, traceInsertIdx: number, coord: [number, number]) => {
      dragStartStrokesRef.current = strokes
      setStrokes((prevStrokes) => {
        const newStrokes = [...prevStrokes]
        const strokeIdx = newStrokes.findIndex((s) => s.id === strokeId)
        if (strokeIdx === -1) return newStrokes

        const stroke = { ...newStrokes[strokeIdx] }
        stroke.nodes = [...stroke.nodes]
        stroke.trace = [...stroke.trace]

        // 1. Insert into trace
        stroke.trace.splice(traceInsertIdx, 0, coord)

        // 2. Find where it belongs in nodes and shift subsequent indices
        let nodeInsertIdx = stroke.nodes.length
        for (let i = 0; i < stroke.nodes.length; i++) {
          if (stroke.nodes[i].traceIndex >= traceInsertIdx) {
            stroke.nodes[i] = {
              ...stroke.nodes[i],
              traceIndex: stroke.nodes[i].traceIndex + 1,
            }
          }
        }

        for (let i = 0; i < stroke.nodes.length; i++) {
          if (stroke.nodes[i].traceIndex > traceInsertIdx) {
            nodeInsertIdx = i
            break
          }
        }

        // 3. Insert node
        stroke.nodes.splice(nodeInsertIdx, 0, { coord, traceIndex: traceInsertIdx })

        newStrokes[strokeIdx] = stroke
        return newStrokes
      })
    },
    [strokes],
  )

  const handleNodeDrag = useCallback(
    (strokeId: string, nodeIndex: number, newCoord: [number, number]) => {
      setStrokes((prevStrokes) => {
        const newStrokes = [...prevStrokes]
        const strokeIdx = newStrokes.findIndex((s) => s.id === strokeId)
        if (strokeIdx === -1) return newStrokes

        const stroke = { ...newStrokes[strokeIdx] }
        stroke.nodes = [...stroke.nodes]
        stroke.trace = [...stroke.trace]

        const origCurrTraceIdx = stroke.nodes[nodeIndex].traceIndex

        let deleteBeforeCount: number
        if (nodeIndex > 0) {
          const origPrevTraceIdx = stroke.nodes[nodeIndex - 1].traceIndex
          deleteBeforeCount = Math.max(0, origCurrTraceIdx - origPrevTraceIdx - 1)
        } else {
          // If dragging the first node, ensure any dangling trace points before it are deleted
          deleteBeforeCount = origCurrTraceIdx
        }

        let deleteAfterCount: number
        if (nodeIndex < stroke.nodes.length - 1) {
          const origNextTraceIdx = stroke.nodes[nodeIndex + 1].traceIndex
          deleteAfterCount = Math.max(0, origNextTraceIdx - origCurrTraceIdx - 1)
        } else {
          // If dragging the last node, ensure any dangling trace points after it are deleted
          deleteAfterCount = stroke.trace.length - 1 - origCurrTraceIdx
        }

        let totalDeleted = 0

        // Delete AFTER first, so we don't mess up BEFORE indices
        if (deleteAfterCount > 0) {
          stroke.trace.splice(origCurrTraceIdx + 1, deleteAfterCount)
          totalDeleted += deleteAfterCount
        }

        if (deleteBeforeCount > 0) {
          stroke.trace.splice(origCurrTraceIdx - deleteBeforeCount, deleteBeforeCount)
          totalDeleted += deleteBeforeCount
        }

        const newNodes = [...stroke.nodes]
        newNodes[nodeIndex] = {
          ...newNodes[nodeIndex],
          coord: newCoord,
          traceIndex: origCurrTraceIdx - deleteBeforeCount,
        }

        for (let i = nodeIndex + 1; i < newNodes.length; i++) {
          newNodes[i] = {
            ...newNodes[i],
            traceIndex: newNodes[i].traceIndex - totalDeleted,
          }
        }

        stroke.nodes = newNodes
        stroke.trace[newNodes[nodeIndex].traceIndex] = newCoord

        newStrokes[strokeIdx] = stroke
        return newStrokes
      })
    },
    [],
  )

  const handleNodeDragEnd = useCallback(() => {
    setHistory((prev) => [...prev, dragStartStrokesRef.current])
    setFuture([])
  }, [])

  const handleAddStop = useCallback(
    (latlng: [number, number]) => {
      const newStop: PlacedStop = {
        id: `stop-${Date.now()}`,
        name: `Parada ${stops.length + 1}`,
        lat: latlng[0],
        lng: latlng[1],
        isTerminal: false,
      }
      setStops((prev) => [...prev, newStop])
    },
    [stops.length],
  )

  const handleDeleteStop = useCallback((id: string) => {
    setStops((prev) => prev.filter((s) => s.id !== id))
  }, [])

  const handleUpdateStopName = (id: string, name: string) => {
    setStops((prev) => prev.map((s) => (s.id === id ? { ...s, name } : s)))
  }

  const handleDeleteNode = useCallback(
    (strokeId: string, nodeIndex: number) => {
      const strokeIdx = strokes.findIndex((s) => s.id === strokeId)
      if (strokeIdx === -1) return
      const stroke = strokes[strokeIdx]

      if (stroke.nodes.length <= 2) {
        alert('No se puede eliminar. La ruta debe tener al menos un inicio y un fin.')
        return
      }

      const newStroke = { ...stroke, nodes: [...stroke.nodes], trace: [...stroke.trace] }

      if (nodeIndex === 0) {
        const newFirstTraceIdx = newStroke.nodes[1].traceIndex
        newStroke.trace.splice(0, newFirstTraceIdx)
        newStroke.nodes = newStroke.nodes.map((n) => ({
          ...n,
          traceIndex: n.traceIndex - newFirstTraceIdx,
        }))
      } else if (nodeIndex === stroke.nodes.length - 1) {
        const newLastTraceIdx = newStroke.nodes[nodeIndex - 1].traceIndex
        const deleteAfterCount = newStroke.trace.length - 1 - newLastTraceIdx
        if (deleteAfterCount > 0) {
          newStroke.trace.splice(newLastTraceIdx + 1, deleteAfterCount)
        }
      } else {
        const prevTraceIdx = newStroke.nodes[nodeIndex - 1].traceIndex
        const nextTraceIdx = newStroke.nodes[nodeIndex + 1].traceIndex
        const deleteCount = nextTraceIdx - prevTraceIdx - 1
        if (deleteCount > 0) {
          newStroke.trace.splice(prevTraceIdx + 1, deleteCount)
          for (let i = nodeIndex + 1; i < newStroke.nodes.length; i++) {
            newStroke.nodes[i] = {
              ...newStroke.nodes[i],
              traceIndex: newStroke.nodes[i].traceIndex - deleteCount,
            }
          }
        }
      }

      newStroke.nodes.splice(nodeIndex, 1)

      const newStrokes = [...strokes]
      newStrokes[strokeIdx] = newStroke
      saveState(newStrokes)
      setSelectedNode(null)
    },
    [strokes, saveState],
  )

  const handleToggleTerminal = (id: string) => {
    setStops((prev) => prev.map((s) => (s.id === id ? { ...s, isTerminal: !s.isTerminal } : s)))
  }

  const handleUndo = useCallback(() => {
    if (history.length > 0) {
      const prev = history[history.length - 1]
      setFuture((f) => [strokes, ...f])
      setStrokes(prev)
      setHistory((h) => h.slice(0, h.length - 1))
    }
  }, [history, strokes])

  const handleRedo = useCallback(() => {
    if (future.length > 0) {
      const next = future[0]
      setHistory((h) => [...h, strokes])
      setStrokes(next)
      setFuture((f) => f.slice(1))
    }
  }, [future, strokes])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

      if (e.ctrlKey && !e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        handleUndo()
      } else if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        handleRedo()
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        if (selectedNode) {
          e.preventDefault()
          handleDeleteNode(selectedNode.strokeId, selectedNode.nodeIndex)
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleUndo, handleRedo, handleDeleteNode, selectedNode])

  const handleClearRoute = () => {
    if (window.confirm('¿Deseas borrar todo el trazo de la ruta?')) {
      saveState([])
    }
  }

  const handleClearStops = () => {
    if (window.confirm('¿Deseas borrar todas las paradas añadidas?')) {
      setStops([])
    }
  }

  const handleExportRoute = () => {
    const flatCoords = strokes.flatMap((s) => s.trace)
    const formattedRouteGeom = {
      type: 'LineString',
      coordinates: flatCoords.map((c) => [c[1], c[0]]),
    }

    const exportedRoute = {
      id: 999,
      name: `${routeShortName} — ${routeName}`,
      short_name: routeShortName,
      category_id: 1,
      description: `Creada en Enstop Editor`,
      direction: routeDirection,
      geom: formattedRouteGeom,
      route_stops: stops.map((_, i) => ({
        stop_id: 1000 + i,
        sequence: i + 1,
      })),
    }

    const dataStr =
      'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportedRoute, null, 2))
    const downloadAnchor = document.createElement('a')
    downloadAnchor.setAttribute('href', dataStr)
    downloadAnchor.setAttribute('download', `route-${routeShortName.toLowerCase() || 'new'}.json`)
    document.body.appendChild(downloadAnchor)
    downloadAnchor.click()
    downloadAnchor.remove()
  }

  const handleExportStops = () => {
    const exportedStops = stops.map((s, index) => ({
      id: 1000 + index,
      name: s.name,
      common_name: s.name,
      geom: {
        type: 'Point',
        coordinates: [s.lng, s.lat],
      },
      is_terminal: s.isTerminal,
      accessible: true,
      created_at: new Date().toISOString(),
    }))

    const dataStr =
      'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportedStops, null, 2))
    const downloadAnchor = document.createElement('a')
    downloadAnchor.setAttribute('href', dataStr)
    downloadAnchor.setAttribute('download', `stops-${routeShortName.toLowerCase() || 'new'}.json`)
    document.body.appendChild(downloadAnchor)
    downloadAnchor.click()
    downloadAnchor.remove()
  }

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const text = ev.target?.result as string
        const data = JSON.parse(text)

        if (Array.isArray(data)) {
          // Assume stops
          const importedStops = data
            .filter((s: any) => s.geom?.type === 'Point')
            .map((s: any) => ({
              id: `stop-${Date.now()}-${Math.random()}`,
              name: s.name || s.common_name || 'Parada Importada',
              lat: s.geom.coordinates[1],
              lng: s.geom.coordinates[0],
              isTerminal: !!s.is_terminal,
            }))

          if (importedStops.length > 0) {
            setStops((prev) => [...prev, ...importedStops])
            alert(`Se han importado ${importedStops.length} paradas con éxito.`)
          } else {
            alert('El archivo no contiene un formato de paradas válido.')
          }
        } else if (data && data.geom && data.geom.type === 'LineString') {
          // Assume route
          const coordinates = data.geom.coordinates as [number, number][]
          const trace = coordinates.map((c) => [c[1], c[0]] as [number, number])

          const importedStroke: DrawStroke = {
            id: `imported-${Date.now()}`,
            trace,
            nodes: [
              { coord: trace[0], traceIndex: 0 },
              { coord: trace[trace.length - 1], traceIndex: trace.length - 1 },
            ],
          }

          saveState([...strokes, importedStroke])
          alert('Ruta importada con éxito.')
        } else {
          alert('Formato de archivo JSON no reconocido.')
        }
      } catch (err) {
        console.error(err)
        alert('Error al leer el archivo JSON.')
      }

      e.target.value = ''
    }

    reader.readAsText(file)
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
                onChange={(e) => setRouteShortName(e.target.value)}
                className="bg-surface-elevated border border-white/8 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-pacific-400 font-bold text-center"
                placeholder="R1"
              />
            </div>
            <div className="col-span-2 flex flex-col gap-1">
              <label className="text-[10px] text-white/50 font-bold uppercase">
                Nombre Completo
              </label>
              <input
                type="text"
                value={routeName}
                onChange={(e) => setRouteName(e.target.value)}
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
                onChange={(e) => setRouteDirection(e.target.value as 'circular' | 'bidirectional')}
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
                  onChange={(e) => setRouteColor(e.target.value)}
                  className="w-8 h-8 rounded-lg border border-white/8 cursor-pointer p-0 bg-transparent"
                />
                <input
                  type="text"
                  value={routeColor}
                  onChange={(e) => setRouteColor(e.target.value)}
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
                  ? 'bg-pacific/10 border-pacific text-pacific'
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
                  ? 'bg-pacific/10 border-pacific text-pacific'
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
                  ? 'bg-pacific/10 border-pacific text-pacific'
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
                <strong>Click Derecho (mantén presionado)</strong> y arrastra el cursor por el mapa
                para pintar el recorrido. Al soltar, el trazo se ajustará a las calles transitables.
                Puedes mover el mapa con click izquierdo.
              </p>
            </div>
          )}

          {mode === 'add-stop' && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex gap-2.5 items-start mt-1">
              <Info size={16} className="text-amber-400 shrink-0 mt-0.5" />
              <p className="text-[10px] leading-relaxed text-white/80">
                Haz click en cualquier punto del mapa para colocar una parada de microbús. Podrás
                cambiarle el nombre y ordenarla en el listado.
              </p>
            </div>
          )}

          {/* Action Operations */}
          <div className="flex gap-2 mt-2">
            <button
              onClick={handleUndo}
              disabled={history.length === 0}
              className="btn btn-secondary flex-1 py-2 min-h-0 text-xs disabled:opacity-40 disabled:cursor-not-allowed"
              title="Deshacer (Ctrl+Z)"
            >
              <Undo2 size={14} />
              <span>Deshacer</span>
            </button>

            <button
              onClick={handleClearRoute}
              disabled={strokes.length === 0}
              className="btn btn-secondary flex-1 py-2 min-h-0 text-xs text-red-400 hover:text-red-300 disabled:opacity-40 disabled:cursor-not-allowed"
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
              <p className="text-[11px]">
                No hay paradas en esta ruta. Activa "Añadir Parada" y haz click en el mapa.
              </p>
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
                      onChange={(e) => handleUpdateStopName(stop.id, e.target.value)}
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
                    <span>
                      {stop.lat.toFixed(5)}, {stop.lng.toFixed(5)}
                    </span>
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
        <div className="p-4 border-t border-white/8 bg-bay-950/40 mt-auto flex flex-col gap-2">
          <div className="flex gap-2">
            <button
              onClick={handleExportRoute}
              disabled={strokes.length === 0}
              className="btn btn-primary flex-1 py-3 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Download size={16} />
              <span>Ruta JSON</span>
            </button>
            <button
              onClick={handleExportStops}
              disabled={stops.length === 0}
              className="btn btn-secondary flex-1 py-3 text-brand-primary disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Download size={16} />
              <span>Paradas JSON</span>
            </button>
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn btn-secondary w-full py-2"
          >
            <Upload size={14} />
            <span className="text-xs">Importar JSON (Ruta o Paradas)</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportJSON}
            accept=".json"
            className="hidden"
          />
        </div>
      </div>

      {/* Map Content View */}
      <div className="flex-1 h-full w-full relative min-h-0">
        <EditorMap
          mode={mode}
          strokes={strokes}
          stops={stops}
          onRouteCoordsSnapped={handleRouteCoordsSnapped}
          onNodeDragStart={handleNodeDragStart}
          onNodeDrag={handleNodeDrag}
          onNodeDragEnd={handleNodeDragEnd}
          onLineClick={handleLineClickNodeInsert}
          onAddStop={handleAddStop}
          onDeleteStop={handleDeleteStop}
          selectedNode={selectedNode}
          onSelectNode={setSelectedNode}
          snapTrace={handleSnapTrace}
          isSnapping={isSnapping}
        />

        {selectedNode && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-bay-900 border border-red-500/30 text-white shadow-xl px-4 py-2 rounded-full flex items-center gap-3 text-sm animate-fade-in pointer-events-none">
            <span>
              Nodo seleccionado. Pulsa <strong>Supr</strong> o <strong>Retroceso</strong> para
              eliminarlo.
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
