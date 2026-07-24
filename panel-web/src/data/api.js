// Única puerta de entrada a los datos.
import { supabase } from '../supabaseClient.js'

function friendlyDbError(error) {
  if (!error) return 'Ocurrió un error inesperado.'
  if (error.code === '42501') return 'No tienes permiso para realizar esta acción.'
  const msg = (error.message || '').toLowerCase()
  if (msg.includes('fetch') || msg.includes('network')) {
    return 'No se pudo conectar con el servidor. Revisa tu conexión a internet.'
  }
  return 'Ocurrió un error al comunicarse con el servidor. Inténtalo de nuevo.'
}

export async function registrarDocente({ fullName, email, password, code }) {
  const { data, error } = await supabase.functions.invoke('registrar-docente', {
    body: { email, password, full_name: fullName, code },
  })

  if (error) {
    let mensaje = friendlyDbError(error)
    if (typeof error.context?.json === 'function') {
      try {
        const body = await error.context.json()
        if (body?.error) mensaje = body.error
      } catch {
        // el cuerpo de la respuesta no era JSON; se mantiene el mensaje genérico
      }
    }
    throw new Error(mensaje)
  }

  if (data?.error) throw new Error(data.error)

  return data
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

export async function getSalaById(id) {
  const { data, error } = await supabase
    .from('groups')
    .select('id, name, join_code, is_active')
    .eq('id', id)
    .single()

  if (error) throw new Error(friendlyDbError(error))
  return { id: data.id, nombre: data.name, codigo: data.join_code, activa: data.is_active }
}

function buildReporte({ kingdoms, members, progress, responses, levelsPorReino }) {
  const alumnos = members.map(m => {
    const studentId = m.student_id
    const perfil = m.profiles
    const porReino = {}
    for (const k of kingdoms) {
      const p = progress.find(pr => pr.student_id === studentId && pr.kingdom_id === k.id)
      porReino[k.id] = {
        crystalEarned: p?.crystal_earned ?? false,
        levelsDone: p?.levels_done ?? 0,
        totalLevels: levelsPorReino[k.id] ?? 0,
        score: p?.score ?? 0,
      }
    }
    const misRespuestas = responses.filter(r => r.student_id === studentId)
    const totalRespuestas = misRespuestas.length
    const correctas = misRespuestas.filter(r => r.is_correct).length
    const ultimaActividad = misRespuestas.reduce(
      (max, r) => (!max || r.answered_at > max ? r.answered_at : max),
      null
    )

    return {
      id: studentId,
      nombre: perfil?.full_name || perfil?.username || 'Alumno',
      porReino,
      totalRespuestas,
      correctas,
      pctAciertos: totalRespuestas ? Math.round((correctas / totalRespuestas) * 100) : 0,
      ultimaActividad,
    }
  })

  const resumenPorReino = {}
  for (const k of kingdoms) {
    const empezaron = alumnos.filter(
      a => a.porReino[k.id]?.levelsDone > 0 || a.porReino[k.id]?.crystalEarned
    ).length
    const terminaron = alumnos.filter(a => a.porReino[k.id]?.crystalEarned).length
    resumenPorReino[k.id] = { kingdom: k, empezaron, terminaron }
  }

  const totalRespuestasGlobal = responses.length
  const correctasGlobal = responses.filter(r => r.is_correct).length
  const pctAciertosGeneral = totalRespuestasGlobal
    ? Math.round((correctasGlobal / totalRespuestasGlobal) * 100)
    : 0

  const porPregunta = {}
  for (const r of responses) {
    const qId = r.question_id
    if (!porPregunta[qId]) {
      porPregunta[qId] = {
        questionId: qId,
        prompt: r.questions?.prompt ?? '(pregunta eliminada)',
        kingdomId: r.questions?.kingdom_id ?? null,
        total: 0,
        correctas: 0,
      }
    }
    porPregunta[qId].total += 1
    if (r.is_correct) porPregunta[qId].correctas += 1
  }
  const preguntas = Object.values(porPregunta)
    .map(p => ({ ...p, pctError: Math.round(((p.total - p.correctas) / p.total) * 100) }))
    .sort((a, b) => b.pctError - a.pctError)

  return {
    kingdoms,
    alumnos,
    resumenPorReino,
    totalAlumnos: alumnos.length,
    pctAciertosGeneral,
    preguntas,
  }
}

export async function getReporteSala(groupId) {
  const [
    { data: gk, error: gkError },
    { data: members, error: memError },
    { data: progress, error: progError },
    { data: responses, error: respError },
  ] = await Promise.all([
    supabase.from('group_kingdoms').select('kingdom_id, kingdoms(id, code, name)').eq('group_id', groupId),
    supabase.from('group_members').select('student_id, profiles(id, username, full_name)').eq('group_id', groupId),
    supabase
      .from('player_progress')
      .select('student_id, kingdom_id, crystal_earned, levels_done, score')
      .eq('group_id', groupId),
    supabase
      .from('player_responses')
      .select('student_id, question_id, is_correct, answered_at, questions(prompt, kingdom_id)')
      .eq('group_id', groupId),
  ])

  if (gkError) throw new Error(friendlyDbError(gkError))
  if (memError) throw new Error(friendlyDbError(memError))
  if (progError) throw new Error(friendlyDbError(progError))
  if (respError) throw new Error(friendlyDbError(respError))

  const kingdoms = gk.map(x => x.kingdoms).filter(Boolean)
  const kingdomIds = kingdoms.map(k => k.id)

  const levelsPorReino = {}
  if (kingdomIds.length) {
    const { data: levels, error: levelsError } = await supabase
      .from('levels')
      .select('kingdom_id')
      .in('kingdom_id', kingdomIds)

    if (levelsError) throw new Error(friendlyDbError(levelsError))
    for (const l of levels) {
      levelsPorReino[l.kingdom_id] = (levelsPorReino[l.kingdom_id] ?? 0) + 1
    }
  }

  return buildReporte({ kingdoms, members, progress, responses, levelsPorReino })
}

export async function getAlumnoResumen(groupId, studentId) {
  const [
    { data: perfil, error: perfilError },
    { data: progress, error: progError },
  ] = await Promise.all([
    supabase.from('profiles').select('id, username, full_name').eq('id', studentId).single(),
    supabase
      .from('player_progress')
      .select('kingdom_id, crystal_earned, levels_done, score, kingdoms(name, code)')
      .eq('group_id', groupId)
      .eq('student_id', studentId),
  ])

  if (perfilError) throw new Error(friendlyDbError(perfilError))
  if (progError) throw new Error(friendlyDbError(progError))

  return {
    id: perfil.id,
    nombre: perfil.full_name || perfil.username,
    porReino: progress.map(p => ({
      kingdomId: p.kingdom_id,
      nombre: p.kingdoms?.name,
      code: p.kingdoms?.code,
      crystalEarned: p.crystal_earned,
      levelsDone: p.levels_done,
      score: p.score,
    })),
  }
}

export async function getAlumnoRespuestas(groupId, studentId) {
  const { data, error } = await supabase
    .from('player_responses')
    .select('id, is_correct, answered_at, questions(prompt, type), question_options(content)')
    .eq('group_id', groupId)
    .eq('student_id', studentId)
    .order('answered_at', { ascending: false })

  if (error) throw new Error(friendlyDbError(error))

  return data.map(r => ({
    id: r.id,
    prompt: r.questions?.prompt ?? '(pregunta eliminada)',
    tipo: r.questions?.type,
    opcionElegida: r.question_options?.content ?? null,
    correcta: r.is_correct,
    fecha: r.answered_at,
  }))
}
