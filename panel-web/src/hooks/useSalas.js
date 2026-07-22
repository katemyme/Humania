import { useState, useEffect, useCallback } from 'react'
import { getSalas, createSala as apiCreateSala } from '../data/api.js'

export function useSalas() {
  const [salas, setSalas] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getSalas().then(data => {
      setSalas(data)
      setLoading(false)
    })
  }, [])

  const createSala = useCallback(async (nombre) => {
    const sala = await apiCreateSala(nombre)
    setSalas(prev => [...prev, sala])
    return sala
  }, [])

  return { salas, loading, createSala }
}
