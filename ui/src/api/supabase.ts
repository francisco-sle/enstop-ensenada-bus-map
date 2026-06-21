import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/supabase-generated'

const isMock = import.meta.env.VITE_USE_MOCKS === 'true'
const supabaseUrl = isMock
  ? typeof window !== 'undefined'
    ? window.location.origin
    : 'http://127.0.0.1:54321'
  : import.meta.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321'

const supabaseAnonKey = isMock
  ? 'mock_anon_key'
  : import.meta.env.VITE_SUPABASE_ANON_KEY || 'dummy_anon_key'

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
export type { Database }
