import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/supabase-generated'

const isMock = import.meta.env.VITE_USE_MOCKS === 'true'
const defaultUrl = isMock && typeof window !== 'undefined'
  ? window.location.origin
  : 'http://localhost:54321'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || defaultUrl
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'dummy_anon_key'

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
export type { Database }
