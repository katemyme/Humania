import { useState, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import AppHeader from '../components/AppHeader.jsx'
import StatCard from '../components/StatCard.jsx'
import RoomCodeChip from '../components/RoomCodeChip.jsx'
import Toast from '../components/Toast.jsx'
import Button from '../components/Button.jsx'
import AlumnosTable from './AlumnosTable.jsx'
import PreguntasFalladas from './PreguntasFalladas.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useReporteSala } from '../hooks/useReporteSala.js'
import { useToast } from '../hooks/useToast.js'
import { alumnosToCsv, downloadCsv } from '../utils/csv.js'
import styles from './SalaDetalle.module.css'

export default function SalaDetalle() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAuditor } = useAuth()
  const { sala, reporte, loading, error } = useReporteSala(id)
  const { toast, showToast } = useToast()
  const [search, setSearch] = useState('')

  const kingdomsById = useMemo(
    () => Object.fromEntries((reporte?.kingdoms ?? []).map(k => [k.id, k])),
    [reporte]
  )

  const filteredAlumnos = useMemo(() => {
    if (!reporte) return []
    const q = search.trim().toLowerCase()
    if (!q) return reporte.alumnos
    return reporte.alumnos.filter(a => a.nombre.toLowerCase().includes(q))
  }, [reporte, search])

  function handleCopy(codigo) {
    showToast(`Código ${codigo} copiado`)
  }

  function handleExport() {
    const csv = alumnosToCsv(reporte.alumnos, reporte.kingdoms)
    downloadCsv(`${sala.nombre}-alumnos.csv`, csv)
  }

  if (loading) return (
    <div className={styles.page}>
      <AppHeader />
      <p className={styles.loadingMsg}>Cargando sala…</p>
    </div>
  )

  if (error) return (
    <div className={styles.page}>
      <AppHeader />
      <p className={styles.loadingMsg}>{error}</p>
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
          <h1 className={styles.heading}>{sala.nombre}</h1>
          <RoomCodeChip codigo={sala.codigo} onCopy={handleCopy} />
        </div>

        <div className={styles.statsGrid}>
          <StatCard value={reporte.totalAlumnos} label="Alumnos" />
          <StatCard value={`${reporte.pctAciertosGeneral}%`} label="Aciertos generales" />
          {reporte.kingdoms.map(k => {
            const r = reporte.resumenPorReino[k.id]
            return (
              <StatCard
                key={k.id}
                value={`${r.empezaron} / ${r.terminaron}`}
                label={`${k.name} — empezaron / terminaron`}
                valueColor={k.code === 'rojo' ? 'var(--color-rojo-texto)' : 'var(--color-verde-texto)'}
              />
            )
          })}
        </div>

        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Alumnos</h2>
            <div className={styles.sectionControls}>
              <input
                className={styles.search}
                placeholder="Buscar alumno…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {!isAuditor && (
                <Button
                  variant="outline"
                  className={styles.exportBtn}
                  onClick={handleExport}
                  disabled={reporte.alumnos.length === 0}
                >
                  Exportar CSV
                </Button>
              )}
            </div>
          </div>
          <AlumnosTable
            alumnos={filteredAlumnos}
            kingdoms={reporte.kingdoms}
            onSelect={studentId => navigate(`/salas/${id}/alumnos/${studentId}`)}
          />
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Preguntas con más errores</h2>
          <PreguntasFalladas preguntas={reporte.preguntas} kingdomsById={kingdomsById} />
        </div>
      </main>

      <Toast message={toast} />
    </div>
  )
}
