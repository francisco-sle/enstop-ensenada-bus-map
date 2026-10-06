import type { StyleSpecification } from 'maplibre-gl'

/**
 * Basemap: OpenFreeMap vector tiles (free, keyless, no usage caps) rendered
 * through MapLibre GL inside Leaflet. Carto's raster basemaps now require an
 * API key and serve a watermark otherwise.
 */
export const basemap = {
  styleUrl: 'https://tiles.openfreemap.org/styles/positron',
  attribution:
    '<a href="https://openfreemap.org" target="_blank" rel="noopener">OpenFreeMap</a> &copy; <a href="https://www.openmaptiles.org/" target="_blank" rel="noopener">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>',
  maxZoom: 20,
}

/**
 * Paint overrides that tint the neutral Positron style toward the app palette:
 * warm paper land, sage parks, soft pacific water and crisp white streets.
 * Keys are Positron layer ids; unknown ids are ignored.
 */
const paintOverrides: Record<string, Record<string, unknown>> = {
  background: { 'background-color': '#F3F3EF' },
  landuse_residential: { 'fill-color': '#EFEFEA' },
  park: { 'fill-color': '#E2EDDA' },
  landcover_wood: { 'fill-color': '#DCE9D3' },
  water: { 'fill-color': '#C6E0EC' },
  waterway: { 'line-color': '#B9D8E6' },
  building: { 'fill-color': '#E7E7E1', 'fill-outline-color': '#DDDDD6' },
  highway_path: { 'line-color': '#FAFAF7' },
  highway_minor: { 'line-color': '#FFFFFF', 'line-opacity': 1 },
  highway_major_casing: { 'line-color': '#E3E3DC' },
  highway_major_inner: { 'line-color': '#FFFFFF' },
  highway_motorway_casing: { 'line-color': '#E0DFD6' },
  highway_motorway_inner: { 'line-color': '#FFFDF5' },
  highway_motorway_bridge_casing: { 'line-color': '#E0DFD6' },
  highway_motorway_bridge_inner: { 'line-color': '#FFFDF5' },
  water_name_point_label: { 'text-color': '#5B8DA8' },
  water_name_line_label: { 'text-color': '#5B8DA8' },
  'highway-name-minor': { 'text-color': '#8A909A' },
  'highway-name-major': { 'text-color': '#7A808B' },
  label_other: { 'text-color': '#6B7280' },
  label_village: { 'text-color': '#4B5160' },
  label_town: { 'text-color': '#4B5160' },
  label_city: { 'text-color': '#3A404D' },
}

export function tintBasemapStyle(style: StyleSpecification): StyleSpecification {
  return {
    ...style,
    layers: style.layers.map((layer) => {
      const override = paintOverrides[layer.id]
      if (!override || !('paint' in layer)) return layer
      return { ...layer, paint: { ...layer.paint, ...override } } as typeof layer
    }),
  }
}
