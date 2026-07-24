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

const PREGUNTA_SELECT = `
  id,
  kingdom_id,
  level_id,
  author_id,
  group_id,
  type,
  prompt,
  created_at,
  groups(name),
  question_options(id, content, is_correct, correct_order, order_index)
`

function mapPregunta(q) {
  return {
    id: q.id,
    kingdomId: q.kingdom_id,
    levelId: q.level_id,
    authorId: q.author_id,
    groupId: q.group_id,
    salaNombre: q.groups?.name ?? null,
    tipo: q.type,
    prompt: q.prompt,
    opciones: (q.question_options ?? [])
      .slice()
      .sort((a, b) => a.order_index - b.order_index)
      .map(o => ({
        id: o.id,
        content: o.content,
        isCorrect: o.is_correct,
        correctOrder: o.correct_order,
      })),
  }
}

export async function getPreguntas() {
  const { data, error } = await supabase
    .from('questions')
    .select(PREGUNTA_SELECT)
    .order('created_at', { ascending: false })

  if (error) throw new Error(friendlyDbError(error))
  return data.map(mapPregunta)
}

async function getPregunta(id) {
  const { data, error } = await supabase
    .from('questions')
    .select(PREGUNTA_SELECT)
    .eq('id', id)
    .single()

  if (error) throw new Error(friendlyDbError(error))
  return mapPregunta(data)
}

// Reemplaza todas las opciones de una pregunta: evita choques con la
// restricción unique(question_id, order_index) al reordenar/agregar/quitar.
async function replaceOpciones(questionId, opciones) {
  const { error: delError } = await supabase.from('question_options').delete().eq('question_id', questionId)
  if (delError) throw new Error(friendlyDbError(delError))

  if (!opciones.length) return

  const rows = opciones.map((o, i) => ({
    question_id: questionId,
    content: o.content,
    is_correct: !!o.isCorrect,
    correct_order: o.correctOrder ?? null,
    order_index: i,
  }))
  const { error } = await supabase.from('question_options').insert(rows)
  if (error) throw new Error(friendlyDbError(error))
}

export async function createPregunta(authorId, { kingdomId, groupId, tipo, prompt, opciones }) {
  const { data: inserted, error } = await supabase
    .from('questions')
    .insert({ author_id: authorId, kingdom_id: kingdomId, group_id: groupId, type: tipo, prompt })
    .select('id')
    .single()

  if (error) throw new Error(friendlyDbError(error))

  await replaceOpciones(inserted.id, opciones)
  return getPregunta(inserted.id)
}

export async function updatePregunta(id, { kingdomId, groupId, tipo, prompt, opciones }) {
  const { error } = await supabase
    .from('questions')
    .update({ kingdom_id: kingdomId, group_id: groupId, type: tipo, prompt })
    .eq('id', id)

  if (error) throw new Error(friendlyDbError(error))

  await replaceOpciones(id, opciones)
  return getPregunta(id)
}

export async function deletePregunta(id) {
  const { error } = await supabase.from('questions').delete().eq('id', id)
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
