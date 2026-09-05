function escapeCsvValue(value) {
  const str = String(value ?? '')
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str
}

export function alumnosToCsv(alumnos, kingdoms) {
  const headers = [
    'Alumno',
    ...kingdoms.flatMap(k => [`${k.name} - Cristal`, `${k.name} - Niveles`, `${k.name} - Puntaje`]),
    'Preguntas respondidas',
    '% Aciertos',
    'Última actividad',
  ]

  const rows = alumnos.map(a => {
    const reinoCols = kingdoms.flatMap(k => {
      const info = a.porReino[k.id] ?? { crystalEarned: false, levelsDone: 0, totalLevels: 0, score: 0 }
      return [info.crystalEarned ? 'Sí' : 'No', `${info.levelsDone}/${info.totalLevels}`, info.score]
    })
    return [
      a.nombre,
      ...reinoCols,
      a.totalRespuestas,
      `${a.pctAciertos}%`,
      a.ultimaActividad ? new Date(a.ultimaActividad).toLocaleDateString('es') : 'Sin actividad',
    ]
  })

  return [headers, ...rows].map(row => row.map(escapeCsvValue).join(',')).join('\n')
}

export function downloadCsv(filename, content) {
  const blob = new Blob(['﻿' + content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
