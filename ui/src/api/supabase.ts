import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/supabase-generated'

export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
export type { Database }
