import { useState, useEffect, useCallback } from 'react'
import { getAlumnoResumen, getAlumnoRespuestas } from '../data/api.js'

export function useAlumnoReporte(groupId, studentId) {
  const [alumno, setAlumno] = useState(null)
  const [respuestas, setRespuestas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [alumnoData, respuestasData] = await Promise.all([
        getAlumnoResumen(groupId, studentId),
        getAlumnoRespuestas(groupId, studentId),
      ])
      setAlumno(alumnoData)
      setRespuestas(respuestasData)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [groupId, studentId])

  useEffect(() => { load() }, [load])

  return { alumno, respuestas, loading, error }
}
