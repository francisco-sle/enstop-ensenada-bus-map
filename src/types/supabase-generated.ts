/* eslint-disable @typescript-eslint/no-explicit-any */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      categories: {
        Row: {
          id: number
          name: string
          color_hex: string
        }
        Insert: {
          id?: number
          name: string
          color_hex: string
        }
        Update: {
          id?: number
          name?: string
          color_hex?: string
        }
        Relationships: []
      }
      routes: {
        Row: {
          id: number
          name: string
          short_name: string
          category_id: number | null
          description: string | null
          geom: any // GeoJSON Geometry (LineString)
          direction: 'inbound' | 'outbound' | 'circular' | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: number
          name: string
          short_name: string
          category_id?: number | null
          description?: string | null
          geom: any
          direction?: 'inbound' | 'outbound' | 'circular' | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: number
          name?: string
          short_name?: string
          category_id?: number | null
          description?: string | null
          geom?: any
          direction?: 'inbound' | 'outbound' | 'circular' | null
          is_active?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "routes_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          }
        ]
      }
      stops: {
        Row: {
          id: number
          name: string
          common_name: string | null
          geom: any // GeoJSON Geometry (Point)
          is_terminal: boolean
          accessible: boolean
          created_at: string
        }
        Insert: {
          id?: number
          name: string
          common_name?: string | null
          geom: any
          is_terminal?: boolean
          accessible?: boolean
          created_at?: string
        }
        Update: {
          id?: number
          name?: string
          common_name?: string | null
          geom?: any
          is_terminal?: boolean
          accessible?: boolean
          created_at?: string
        }
        Relationships: []
      }
      route_stops: {
        Row: {
          id: number
          route_id: number
          stop_id: number
          sequence: number
        }
        Insert: {
          id?: number
          route_id: number
          stop_id: number
          sequence: number
        }
        Update: {
          id?: number
          route_id?: number
          stop_id?: number
          sequence?: number
        }
        Relationships: [
          {
            foreignKeyName: "route_stops_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "routes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "route_stops_stop_id_fkey"
            columns: ["stop_id"]
            isOneToOne: false
            referencedRelation: "stops"
            referencedColumns: ["id"]
          }
        ]
      }
      fare_rules: {
        Row: {
          id: number
          route_id: number
          passenger_type: 'normal' | 'student_government' | 'student_highschool' | 'disability'
          fare_mxn: number
          effective_from: string
          notes: string | null
          updated_at: string
        }
        Insert: {
          id?: number
          route_id: number
          passenger_type: 'normal' | 'student_government' | 'student_highschool' | 'disability'
          fare_mxn: number
          effective_from?: string
          notes?: string | null
          updated_at?: string
        }
        Update: {
          id?: number
          route_id?: number
          passenger_type?: 'normal' | 'student_government' | 'student_highschool' | 'disability'
          fare_mxn?: number
          effective_from?: string
          notes?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fare_rules_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "routes"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      nearby_stops: {
        Args: {
          lat: number
          lng: number
          radius_meters?: number
        }
        Returns: Database['public']['Tables']['stops']['Row'][]
      }
      routes_for_stop: {
        Args: {
          p_stop_id: number
        }
        Returns: Database['public']['Tables']['routes']['Row'][]
      }
      current_fare: {
        Args: {
          p_route_id: number
          p_passenger_type: string
        }
        Returns: Database['public']['Tables']['fare_rules']['Row']
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
