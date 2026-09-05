import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import RoomCodeChip from '../components/RoomCodeChip.jsx'
import Button from '../components/Button.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import styles from './SalaCard.module.css'

export default function SalaCard({ sala, onCopy, onToggleActiva, onDelete }) {
  const navigate = useNavigate()
  const { isAuditor } = useAuth()
  const [toggling, setToggling] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleToggle() {
    setToggling(true)
    try {
      await onToggleActiva(sala)
    } finally {
      setToggling(false)
    }
  }

  async function handleConfirmDelete() {
    setDeleting(true)
    try {
      await onDelete(sala)
    } finally {
      setDeleting(false)
      setConfirming(false)
    }
  }

  return (
    <div className={styles.card}>
      <div className={styles.top}>
        <div>
          <h3 className={styles.nombre}>{sala.nombre}</h3>
          <span className={`${styles.estado} ${sala.activa ? styles.estadoActiva : styles.estadoInactiva}`}>
            {sala.activa ? 'Activa' : 'Inactiva'}
          </span>
        </div>
        <div className={styles.reinos}>
          {sala.reinos.includes('verde') && <span className={`${styles.badge} ${styles.verde}`}>Reino Verde</span>}
          {sala.reinos.includes('rojo') && <span className={`${styles.badge} ${styles.rojo}`}>Reino Rojo</span>}
        </div>
      </div>

      <RoomCodeChip
        codigo={sala.codigo}
        onCopy={() => onCopy(sala.codigo)}
      />

      <p className={styles.alumnos}>
        {sala.alumnos} {sala.alumnos === 1 ? 'alumno' : 'alumnos'}
      </p>

      <div className={styles.actions}>
        <Button variant="outline" onClick={() => navigate(`/salas/${sala.id}`)}>
          Ver detalle
        </Button>
        {!isAuditor && !confirming && (
          <Button variant="ghost" onClick={handleToggle} disabled={toggling}>
            {toggling ? 'Guardando…' : sala.activa ? 'Desactivar sala' : 'Activar sala'}
          </Button>
        )}
        {!isAuditor && (
          confirming ? (
            <div className={styles.confirmRow}>
              <p className={styles.confirmText}>
                Se eliminará la sala y todo su progreso. Esta acción no se puede deshacer.
              </p>
              <div className={styles.confirmActions}>
                <Button variant="ghost" onClick={() => setConfirming(false)} disabled={deleting}>
                  Cancelar
                </Button>
                <Button variant="confirm" onClick={handleConfirmDelete} disabled={deleting}>
                  {deleting ? 'Eliminando…' : 'Confirmar borrado'}
                </Button>
              </div>
            </div>
          ) : (
            <Button variant="ghost" onClick={() => setConfirming(true)}>
              Eliminar sala
            </Button>
          )
        )}
      </div>
    </div>
  )
}
