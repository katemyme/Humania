import { useState, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import AppHeader from '../components/AppHeader.jsx'
import StatCard from '../components/StatCard.jsx'
import RoomCodeChip from '../components/RoomCodeChip.jsx'
import Toast from '../components/Toast.jsx'
import AlumnosTable from './AlumnosTable.jsx'
import { useSala } from '../hooks/useSala.js'
import { useToast } from '../hooks/useToast.js'
import styles from './SalaDetalle.module.css'

const FILTERS = ['todos', 'verde', 'rojo']

export default function SalaDetalle() {
  const { id } = useParams()
  const { sala, alumnos, loading } = useSala(id)
  const { toast, showToast } = useToast()
  const [filter, setFilter] = useState('todos')
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    let list = alumnos
    if (filter === 'verde') list = list.filter(s => s.verde >= 50)
    if (filter === 'rojo')  list = list.filter(s => s.rojo  >= 50)
    const q = search.trim().toLowerCase()
    if (q) list = list.filter(s => s.nombre.toLowerCase().includes(q))
    return list
  }, [alumnos, filter, search])

  const avg = (key) =>
    alumnos.length ? Math.round(alumnos.reduce((a, s) => a + s[key], 0) / alumnos.length) : 0

  const completados = alumnos.filter(s => s.verde === 100 && s.rojo === 100).length

  // RoomCodeChip escribe al portapapeles internamente; aquí solo mostramos toast.
  function handleCopy(codigo) {
    showToast(`Código ${codigo} copiado`)
  }

  function filterClass(key) {
    if (filter !== key) return styles.tabInactive
    return { todos: styles.tabTodos, verde: styles.tabVerde, rojo: styles.tabRojo }[key]
  }

  if (loading) return (
    <div className={styles.page}>
      <AppHeader />
      <p className={styles.loadingMsg}>Cargando sala…</p>
    </div>
  )

  if (!sala) return (
    <div className={styles.page}>
      <AppHeader />
      <p className={styles.loadingMsg}>Sala no encontrada.</p>
    </div>
  )

  return (
    <div className={styles.page}>
      <AppHeader />

      <main className={styles.main}>
        <Link to="/salas" className={styles.backLink}>← Volver a mis salas</Link>

        <div className={styles.salaHeader}>
          <div>
            <h1 className={styles.heading}>{sala.nombre}</h1>
            <p className={styles.grado}>{sala.grado}</p>
          </div>
          <RoomCodeChip codigo={sala.codigo} onCopy={handleCopy} />
        </div>

        <div className={styles.statsGrid}>
          <StatCard value={sala.alumnos}      label="Alumnos" />
          <StatCard value={`${avg('verde')}%`} label="Avance Reino Verde" valueColor="var(--color-verde-texto)" />
          <StatCard value={`${avg('rojo')}%`}  label="Avance Reino Rojo"  valueColor="var(--color-rojo-texto)" />
          <StatCard value={completados}         label="Alumnos completaron ambos reinos" />
        </div>

        <div className={styles.controls}>
          <div className={styles.tabs}>
            {FILTERS.map(key => (
              <button
                key={key}
                className={`${styles.tab} ${filterClass(key)}`}
                onClick={() => setFilter(key)}
              >
                {key === 'todos' ? 'Todos' : key === 'verde' ? 'Reino Verde' : 'Reino Rojo'}
              </button>
            ))}
          </div>
          <input
            className={styles.search}
            placeholder="Buscar alumno…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <AlumnosTable alumnos={filtered} />
      </main>

      <Toast message={toast} />
    </div>
  )
}
