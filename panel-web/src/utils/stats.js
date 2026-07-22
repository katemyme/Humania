// Promedio de avance ponderado por cantidad de alumnos por sala.
// Σ(alumnos_i × avance_i) / Σ(alumnos_i)
export function calcAvancePromedio(salas) {
  const totalAlumnos = salas.reduce((a, s) => a + s.alumnos, 0)
  if (!totalAlumnos) return 0
  const suma = salas.reduce((a, s) => a + s.alumnos * s.progreso, 0)
  return Math.round(suma / totalAlumnos)
}
