import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/supabase-generated'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'http://localhost:54321'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'dummy_anon_key'

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
export type { Database }
