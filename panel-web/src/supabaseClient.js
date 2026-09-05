import { createClient } from '@supabase/supabase-js'

// Proyecto de demostración. La clave es la publishable/anon: está pensada para
// vivir en el cliente y RLS es quien aplica los permisos, así que el panel
// arranca sin configurar nada. Para apuntar a otro Supabase, crea
// panel-web/.env.local (ver .env.example) y estos valores quedan sobrescritos.
const DEMO_URL = 'https://lbvmqlsqyozzjmlxjneq.supabase.co'
const DEMO_ANON_KEY = 'sb_publishable_q3Sf6KTaskTxkHZFAj7imw_dSLKDSUW'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || DEMO_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || DEMO_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
