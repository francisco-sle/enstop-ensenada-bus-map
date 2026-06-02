import type { Database } from './supabase-generated'

export type DBRoute = Database['public']['Tables']['routes']['Row']
export type DBStop = Database['public']['Tables']['stops']['Row']
export type DBCategory = Database['public']['Tables']['categories']['Row']
export type DBRouteStop = Database['public']['Tables']['route_stops']['Row']
export type DBFareRule = Database['public']['Tables']['fare_rules']['Row']

export type RouteCategory = DBCategory

export interface RouteStopWithStop {
  id: number
  route_id: number
  stop_id: number
  sequence: number
  stop: DBStop
}

export interface RouteWithCategory extends DBRoute {
  category: RouteCategory | null
}

export interface RouteDetail extends RouteWithCategory {
  route_stops: RouteStopWithStop[]
}

export type PassengerType = 'normal' | 'student_government' | 'student_highschool' | 'disability'

export interface RoutingResult {
  routeId: number
  routeName: string
  routeShortName: string
  routeColor: string
  originStop: DBStop
  destStop: DBStop
  busDistanceKm: number
  walkOriginKm: number
  walkDestKm: number
  totalMinutes: number
  subPolylineCoords: [number, number][] // [lat, lng][] for Leaflet polylines
}
