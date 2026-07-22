// Única puerta de entrada a los datos.
// Cuando llegue Supabase: reemplazar el cuerpo de cada función; las vistas no cambian.
import { SALAS } from './mock/salas.js'
import { ALUMNOS_BY_SALA } from './mock/alumnos.js'

let _salas = [...SALAS]

export async function getSalas() {
  return [..._salas]
}

export async function createSala(nombre) {
  const codigo = 'HUM-' + Math.random().toString(36).slice(2, 6).toUpperCase()
  const sala = {
    id: Date.now(),
    nombre,
    grado: '',
    codigo,
    alumnos: 0,
    progreso: 0,
    reinoVerde: true,
    reinoRojo: false,
  }
  _salas = [..._salas, sala]
  return sala
}

export async function getSala(id) {
  return _salas.find(s => String(s.id) === String(id)) ?? null
}

export async function getSalaAlumnos(id) {
  return ALUMNOS_BY_SALA[Number(id)] ?? []
}
