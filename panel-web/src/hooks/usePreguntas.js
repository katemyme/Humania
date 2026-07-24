import { useState, useEffect, useCallback } from 'react'
import {
  getPreguntas,
  getKingdoms,
  createPregunta as apiCreatePregunta,
  updatePregunta as apiUpdatePregunta,
  deletePregunta as apiDeletePregunta,
} from '../data/api.js'

export function usePreguntas() {
  const [preguntas, setPreguntas] = useState([])
  const [kingdoms, setKingdoms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [preguntasData, kingdomsData] = await Promise.all([getPreguntas(), getKingdoms()])
      setPreguntas(preguntasData)
      setKingdoms(kingdomsData)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const createPregunta = useCallback(async (authorId, datos) => {
    const pregunta = await apiCreatePregunta(authorId, datos)
    setPreguntas(prev => [pregunta, ...prev])
    return pregunta
  }, [])

  const updatePregunta = useCallback(async (id, datos) => {
    const pregunta = await apiUpdatePregunta(id, datos)
    setPreguntas(prev => prev.map(p => (p.id === id ? pregunta : p)))
    return pregunta
  }, [])

  const deletePregunta = useCallback(async (id) => {
    await apiDeletePregunta(id)
    setPreguntas(prev => prev.filter(p => p.id !== id))
  }, [])

  return { preguntas, kingdoms, loading, error, createPregunta, updatePregunta, deletePregunta }
}
