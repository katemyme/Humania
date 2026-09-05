import { useState, useEffect, useCallback } from 'react'
import {
  getSalas,
  createSala as apiCreateSala,
  setSalaActiva as apiSetSalaActiva,
  deleteSala as apiDeleteSala,
} from '../data/api.js'

export function useSalas() {
  const [salas, setSalas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getSalas()
      setSalas(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const createSala = useCallback(async (teacherId, nombre, kingdomIds) => {
    const sala = await apiCreateSala(teacherId, nombre, kingdomIds)
    setSalas(prev => [sala, ...prev])
    return sala
  }, [])

  const toggleActiva = useCallback(async (id, activa) => {
    await apiSetSalaActiva(id, activa)
    setSalas(prev => prev.map(s => (s.id === id ? { ...s, activa } : s)))
  }, [])

  const deleteSala = useCallback(async id => {
    await apiDeleteSala(id)
    setSalas(prev => prev.filter(s => s.id !== id))
  }, [])

  return { salas, loading, error, createSala, toggleActiva, deleteSala }
}
