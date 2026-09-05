import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Faltan las variables de entorno de Supabase. Revisa panel-web/.env.local (VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY).'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
