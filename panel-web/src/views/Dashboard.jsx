import { useState } from 'react'
import AppHeader from '../components/AppHeader.jsx'
import StatCard from '../components/StatCard.jsx'
import Toast from '../components/Toast.jsx'
import SalaCard from './SalaCard.jsx'
import CrearSalaModal from './CrearSalaModal.jsx'
import Button from '../components/Button.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useSalas } from '../hooks/useSalas.js'
import { useToast } from '../hooks/useToast.js'
import { calcAvancePromedio } from '../utils/stats.js'
import styles from './Dashboard.module.css'

export default function Dashboard() {
  const { isAuditor } = useAuth()
  const { salas, loading, createSala } = useSalas()
  const { toast, showToast } = useToast()
  const [showModal, setShowModal] = useState(false)

  const totalAlumnos = salas.reduce((a, s) => a + s.alumnos, 0)
  const avgProgreso = calcAvancePromedio(salas)

  // RoomCodeChip ya escribe al portapapeles internamente; aquí solo mostramos toast.
  function handleCopy(codigo) {
    showToast(`Código ${codigo} copiado`)
  }

  async function handleCreate(nombre) {
    const sala = await createSala(nombre)
    setShowModal(false)
    showToast(`Sala creada: ${sala.codigo}`)
  }

  return (
    <div className={styles.page}>
      <AppHeader />

      <main className={styles.main}>
        <div className={styles.topRow}>
          <div>
            <h1 className={styles.heading}>Mis salas</h1>
            <p className={styles.subheading}>
              Crea salas, comparte el código y sigue el avance de tus alumnos.
            </p>
          </div>
          {!isAuditor && (
            <Button variant="primarySm" onClick={() => setShowModal(true)}>
              <span aria-hidden>+</span> Crear sala
            </Button>
          )}
        </div>

        <div className={styles.statsGrid}>
          <StatCard value={salas.length} label="Salas activas" />
          <StatCard value={totalAlumnos}   label="Alumnos totales" />
          <StatCard value={`${avgProgreso}%`} label="Avance promedio" />
        </div>

        {loading ? (
          <p className={styles.loading}>Cargando salas…</p>
        ) : (
          <div className={styles.salasGrid}>
            {salas.map(sala => (
              <SalaCard key={sala.id} sala={sala} onCopy={handleCopy} />
            ))}
          </div>
        )}
      </main>

      <Toast message={toast} />

      {showModal && (
        <CrearSalaModal
          onClose={() => setShowModal(false)}
          onCreate={handleCreate}
        />
      )}
    </div>
  )
}
