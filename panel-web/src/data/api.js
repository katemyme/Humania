// Única puerta de entrada a los datos.
import { supabase } from '../supabaseClient.js'
import { SALAS } from './mock/salas.js'
import { ALUMNOS_BY_SALA } from './mock/alumnos.js'

function friendlyDbError(error) {
  if (!error) return 'Ocurrió un error inesperado.'
  if (error.code === '42501') return 'No tienes permiso para realizar esta acción.'
  const msg = (error.message || '').toLowerCase()
  if (msg.includes('fetch') || msg.includes('network')) {
    return 'No se pudo conectar con el servidor. Revisa tu conexión a internet.'
  }
  return 'Ocurrió un error al comunicarse con el servidor. Inténtalo de nuevo.'
}

const SALA_SELECT = `
  id,
  name,
  join_code,
  is_active,
  created_at,
  group_members(count),
  group_kingdoms(kingdom_id, kingdoms(code))
`

function mapSala(g) {
  return {
    id: g.id,
    nombre: g.name,
    codigo: g.join_code,
    activa: g.is_active,
    alumnos: g.group_members?.[0]?.count ?? 0,
    reinos: (g.group_kingdoms ?? []).map(gk => gk.kingdoms?.code).filter(Boolean),
  }
}

export async function getSalas() {
  const { data, error } = await supabase
    .from('groups')
    .select(SALA_SELECT)
    .order('created_at', { ascending: false })

  if (error) throw new Error(friendlyDbError(error))
  return data.map(mapSala)
}

export async function getKingdoms() {
  const { data, error } = await supabase
    .from('kingdoms')
    .select('id, code, name')
    .order('order_index')

  if (error) throw new Error(friendlyDbError(error))
  return data
}

export async function createSala(teacherId, nombre, kingdomIds = []) {
  const { data: inserted, error } = await supabase
    .from('groups')
    .insert({ teacher_id: teacherId, name: nombre })
    .select('id')
    .single()

  if (error) throw new Error(friendlyDbError(error))

  if (kingdomIds.length) {
    const rows = kingdomIds.map(kingdom_id => ({ group_id: inserted.id, kingdom_id }))
    const { error: gkError } = await supabase.from('group_kingdoms').insert(rows)
    if (gkError) throw new Error(friendlyDbError(gkError))
  }

  // Se vuelve a leer la fila: join_code lo genera un trigger en la base de datos.
  const { data: sala, error: readError } = await supabase
    .from('groups')
    .select(SALA_SELECT)
    .eq('id', inserted.id)
    .single()

  if (readError) throw new Error(friendlyDbError(readError))
  return mapSala(sala)
}

export async function setSalaActiva(id, activa) {
  const { error } = await supabase.from('groups').update({ is_active: activa }).eq('id', id)
  if (error) throw new Error(friendlyDbError(error))
}

// --- Detalle de sala: aún no conectado a Supabase, sigue usando datos de ejemplo.
let _salas = [...SALAS]

export async function getSala(id) {
  return _salas.find(s => String(s.id) === String(id)) ?? null
}

export async function getSalaAlumnos(id) {
  return ALUMNOS_BY_SALA[Number(id)] ?? []
}
