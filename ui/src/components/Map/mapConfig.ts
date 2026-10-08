import type { StyleSpecification } from 'maplibre-gl'
import type { ResolvedTheme } from '../../store/themeStore'

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
 * Paint overrides that tint the neutral Positron style toward the app palette.
 * Light: warm paper land, sage parks, soft pacific water and crisp white streets.
 * Dark: deep bay-navy land, muted green parks, ink-blue water and slate streets.
 * Keys are Positron layer ids; unknown ids are ignored.
 */
const paintOverrides: Record<ResolvedTheme, Record<string, Record<string, unknown>>> = {
  light: {
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
  },
  // Positron is a light style, so dark mode recolors every layer that draws
  // a fill, line or label halo — anything left out would glow white.
  dark: {
    background: { 'background-color': '#161D27' },
    landuse_residential: { 'fill-color': '#1A222D' },
    park: { 'fill-color': '#1A2A26' },
    landcover_wood: { 'fill-color': '#1C2D27' },
    landcover_ice_shelf: { 'fill-color': '#1E2631' },
    landcover_glacier: { 'fill-color': '#1E2631' },
    water: { 'fill-color': '#0E2232' },
    waterway: { 'line-color': '#163246' },
    building: { 'fill-color': '#1F2834', 'fill-outline-color': '#273140' },
    tunnel_motorway_casing: { 'line-color': '#1E2632' },
    tunnel_motorway_inner: { 'line-color': '#2A3441' },
    'aeroway-taxiway': { 'line-color': '#2A3442' },
    'aeroway-runway-casing': { 'line-color': '#2A3442' },
    'aeroway-area': { 'fill-color': '#202935' },
    'aeroway-runway': { 'line-color': '#323C4A' },
    road_area_pier: { 'fill-color': '#161D27' },
    road_pier: { 'line-color': '#161D27' },
    highway_path: { 'line-color': '#242D39' },
    highway_minor: { 'line-color': '#29323F', 'line-opacity': 1 },
    highway_major_casing: { 'line-color': '#1E2632' },
    highway_major_inner: { 'line-color': '#343F4D' },
    highway_major_subtle: { 'line-color': '#29323F' },
    highway_motorway_casing: { 'line-color': '#1E2632' },
    highway_motorway_inner: { 'line-color': '#414C5B' },
    highway_motorway_subtle: { 'line-color': '#2D3745' },
    highway_motorway_bridge_casing: { 'line-color': '#1E2632' },
    highway_motorway_bridge_inner: { 'line-color': '#414C5B' },
    railway_transit: { 'line-color': '#2D3745' },
    railway_transit_dashline: { 'line-color': '#1E2632' },
    railway_service: { 'line-color': '#2D3745' },
    railway_service_dashline: { 'line-color': '#1E2632' },
    railway: { 'line-color': '#2D3745' },
    railway_dashline: { 'line-color': '#1E2632' },
    boundary_3: { 'line-color': '#475263' },
    boundary_2: { 'line-color': '#475263' },
    boundary_disputed: { 'line-color': '#475263' },
    waterway_line_label: { 'text-color': '#5E7A90', 'text-halo-color': '#161D27' },
    water_name_point_label: { 'text-color': '#6F9DBA', 'text-halo-color': '#161D27' },
    water_name_line_label: { 'text-color': '#6F9DBA', 'text-halo-color': '#161D27' },
    'highway-name-path': { 'text-color': '#6B7685', 'text-halo-color': '#161D27' },
    'highway-name-minor': { 'text-color': '#8A94A2', 'text-halo-color': '#161D27' },
    'highway-name-major': { 'text-color': '#98A2AF', 'text-halo-color': '#161D27' },
    airport: { 'text-color': '#8A94A2', 'text-halo-color': '#161D27' },
    label_other: { 'text-color': '#9AA4B2', 'text-halo-color': '#161D27' },
    label_village: { 'text-color': '#B9C2CE', 'text-halo-color': '#161D27' },
    label_town: { 'text-color': '#C4CCD7', 'text-halo-color': '#161D27' },
    label_state: { 'text-color': '#9AA4B2', 'text-halo-color': '#161D27' },
    label_city: { 'text-color': '#D3DAE3', 'text-halo-color': '#161D27' },
    label_city_capital: { 'text-color': '#D3DAE3', 'text-halo-color': '#161D27' },
    label_country_3: { 'text-color': '#B9C2CE', 'text-halo-color': '#161D27' },
    label_country_2: { 'text-color': '#B9C2CE', 'text-halo-color': '#161D27' },
    label_country_1: { 'text-color': '#B9C2CE', 'text-halo-color': '#161D27' },
  },
}

export function tintBasemapStyle(
  style: StyleSpecification,
  theme: ResolvedTheme,
): StyleSpecification {
  const overrides = paintOverrides[theme]
  return {
    ...style,
    layers: style.layers.map((layer) => {
      const override = overrides[layer.id]
      if (!override || !('paint' in layer)) return layer
      return { ...layer, paint: { ...layer.paint, ...override } } as typeof layer
    }),
  }
}
