import { useState, useEffect } from 'react'
import { getSala, getSalaAlumnos } from '../data/api.js'

export function useSala(id) {
  const [sala, setSala] = useState(null)
  const [alumnos, setAlumnos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([getSala(id), getSalaAlumnos(id)]).then(([s, a]) => {
      setSala(s)
      setAlumnos(a)
      setLoading(false)
    })
  }, [id])

  return { sala, alumnos, loading }
}
