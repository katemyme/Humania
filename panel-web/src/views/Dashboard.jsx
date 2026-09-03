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
import styles from './Dashboard.module.css'

export default function Dashboard() {
  const { user, isAuditor } = useAuth()
  const { salas, loading, error, createSala, toggleActiva, deleteSala } = useSalas()
  const { toast, showToast } = useToast()
  const [showModal, setShowModal] = useState(false)

  const salasActivas = salas.filter(s => s.activa).length
  const totalAlumnos = salas.reduce((a, s) => a + s.alumnos, 0)

  // RoomCodeChip ya escribe al portapapeles internamente; aquí solo mostramos toast.
  function handleCopy(codigo) {
    showToast(`Código ${codigo} copiado`)
  }

  async function handleCreate(nombre, kingdomIds) {
    const sala = await createSala(user.id, nombre, kingdomIds)
    setShowModal(false)
    showToast(`Sala creada: ${sala.codigo}`)
  }

  async function handleToggleActiva(sala) {
    try {
      await toggleActiva(sala.id, !sala.activa)
      showToast(sala.activa ? 'Sala desactivada' : 'Sala activada')
    } catch (err) {
      showToast(err.message)
    }
  }

  async function handleDelete(sala) {
    try {
      await deleteSala(sala.id)
      showToast(`Sala "${sala.nombre}" eliminada`)
    } catch (err) {
      showToast(err.message)
    }
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
          <StatCard value={salasActivas} label="Salas activas" />
          <StatCard value={totalAlumnos} label="Alumnos totales" />
        </div>

        {loading ? (
          <p className={styles.loading}>Cargando salas…</p>
        ) : error ? (
          <p className={styles.error}>{error}</p>
        ) : salas.length === 0 ? (
          <p className={styles.empty}>Aún no tienes salas. Crea la primera con el botón de arriba.</p>
        ) : (
          <div className={styles.salasGrid}>
            {salas.map(sala => (
              <SalaCard
                key={sala.id}
                sala={sala}
                onCopy={handleCopy}
                onToggleActiva={handleToggleActiva}
                onDelete={handleDelete}
              />
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
