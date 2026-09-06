import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import AppHeader from '../components/AppHeader.jsx'
import StatCard from '../components/StatCard.jsx'
import Button from '../components/Button.jsx'
import ResetPasswordModal from './ResetPasswordModal.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useAlumnoReporte } from '../hooks/useAlumnoReporte.js'
import styles from './AlumnoDetalle.module.css'

function formatFecha(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('es', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

export default function AlumnoDetalle() {
  const { id: salaId, studentId } = useParams()
  const navigate = useNavigate()
  const { isAuditor } = useAuth()
  const { alumno, respuestas, loading, error } = useAlumnoReporte(salaId, studentId)
  const [resetOpen, setResetOpen] = useState(false)

  if (loading) return (
    <div className={styles.page}>
      <AppHeader />
      <p className={styles.loadingMsg}>Cargando alumno…</p>
    </div>
  )

  if (error) return (
    <div className={styles.page}>
      <AppHeader />
      <p className={styles.loadingMsg}>{error}</p>
    </div>
  )

  if (!alumno) return (
    <div className={styles.page}>
      <AppHeader />
      <p className={styles.loadingMsg}>Alumno no encontrado.</p>
    </div>
  )

  return (
    <div className={styles.page}>
      <AppHeader />

      <main className={styles.main}>
        <button className={styles.backLink} onClick={() => navigate(`/salas/${salaId}`)}>
          ← Volver a la sala
        </button>

        <div className={styles.titleRow}>
          <h1 className={styles.heading}>{alumno.nombre}</h1>
          {/* El auditor es solo lectura: no puede tocar contraseñas. */}
          {!isAuditor && (
            <Button variant="outline" className={styles.resetBtn} onClick={() => setResetOpen(true)}>
              Restablecer contraseña
            </Button>
          )}
        </div>

        <div className={styles.statsGrid}>
          {alumno.porReino.map(r => (
            <StatCard
              key={r.kingdomId}
              value={`${r.crystalEarned ? '★ ' : ''}${r.levelsDone} niveles · ${r.score} pts`}
              label={r.nombre ?? 'Reino'}
              valueColor={r.code === 'rojo' ? 'var(--color-rojo-texto)' : 'var(--color-verde-texto)'}
            />
          ))}
        </div>

        <h2 className={styles.sectionTitle}>Respuestas</h2>

        {respuestas.length === 0 ? (
          <p className={styles.empty}>Este alumno todavía no respondió ninguna pregunta.</p>
        ) : (
          <div className={styles.table}>
            <div className={styles.thead}>
              <span>Pregunta</span>
              <span>Su respuesta</span>
              <span>Resultado</span>
              <span>Fecha</span>
            </div>
            {respuestas.map(r => (
              <div key={r.id} className={styles.row}>
                <span className={styles.prompt}>{r.prompt}</span>
                <span>{r.opcionElegida ?? '—'}</span>
                <span className={`${styles.resultado} ${r.correcta ? styles.correcto : styles.incorrecto}`}>
                  {r.correcta ? '✓ Correcta' : '✗ Incorrecta'}
                </span>
                <span className={styles.fecha}>{formatFecha(r.fecha)}</span>
              </div>
            ))}
          </div>
        )}
      </main>

      {resetOpen && (
        <ResetPasswordModal alumno={alumno} onClose={() => setResetOpen(false)} />
      )}
    </div>
  )
}
