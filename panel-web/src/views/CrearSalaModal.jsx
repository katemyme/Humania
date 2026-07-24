import { useState, useEffect } from 'react'
import Modal from '../components/Modal.jsx'
import Button from '../components/Button.jsx'
import { getKingdoms } from '../data/api.js'
import styles from './CrearSalaModal.module.css'

export default function CrearSalaModal({ onClose, onCreate }) {
  const [nombre, setNombre] = useState('')
  const [kingdoms, setKingdoms] = useState([])
  const [kingdomsLoading, setKingdomsLoading] = useState(true)
  const [selected, setSelected] = useState([])
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let active = true
    getKingdoms()
      .then(data => { if (active) setKingdoms(data) })
      .catch(() => { if (active) setError('No se pudieron cargar los reinos.') })
      .finally(() => { if (active) setKingdomsLoading(false) })
    return () => { active = false }
  }, [])

  function toggleKingdom(id) {
    setSelected(prev => prev.includes(id) ? prev.filter(k => k !== id) : [...prev, id])
  }

  async function handleCreate() {
    const trimmed = nombre.trim()
    if (!trimmed) return
    setError('')
    setSubmitting(true)
    try {
      await onCreate(trimmed, selected)
    } catch (err) {
      setError(err.message || 'No se pudo crear la sala. Inténtalo de nuevo.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal onClose={onClose}>
      <h2 className={styles.heading}>Crear nueva sala</h2>
      <label className={styles.field}>
        <span className={styles.label}>Nombre de la sala</span>
        <input
          className={styles.input}
          placeholder="Ej: 5°B Ciencias"
          value={nombre}
          onChange={e => setNombre(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleCreate()}
          autoFocus
        />
      </label>

      <div className={styles.field}>
        <span className={styles.label}>Reinos a asignar</span>
        {kingdomsLoading ? (
          <p className={styles.hint}>Cargando reinos…</p>
        ) : (
          <div className={styles.kingdoms}>
            {kingdoms.map(k => (
              <label key={k.id} className={styles.kingdomOption}>
                <input
                  type="checkbox"
                  checked={selected.includes(k.id)}
                  onChange={() => toggleKingdom(k.id)}
                />
                {k.name}
              </label>
            ))}
          </div>
        )}
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.actions}>
        <Button variant="ghost" onClick={onClose} disabled={submitting}>Cancelar</Button>
        <Button variant="confirm" onClick={handleCreate} disabled={!nombre.trim() || submitting}>
          {submitting ? 'Creando…' : 'Crear'}
        </Button>
      </div>
    </Modal>
  )
}
