import { useState, useEffect, useCallback } from 'react'
import { getSalaById, getReporteSala } from '../data/api.js'

export function useReporteSala(id) {
  const [sala, setSala] = useState(null)
  const [reporte, setReporte] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [salaData, reporteData] = await Promise.all([getSalaById(id), getReporteSala(id)])
      setSala(salaData)
      setReporte(reporteData)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { load() }, [load])

  return { sala, reporte, loading, error }
}
