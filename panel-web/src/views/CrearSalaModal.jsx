import { useState } from 'react'
import Modal from '../components/Modal.jsx'
import Button from '../components/Button.jsx'
import styles from './CrearSalaModal.module.css'

export default function CrearSalaModal({ onClose, onCreate }) {
  const [nombre, setNombre] = useState('')

  function handleCreate() {
    const trimmed = nombre.trim()
    if (!trimmed) return
    onCreate(trimmed)
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
      <div className={styles.actions}>
        <Button variant="ghost" onClick={onClose}>Cancelar</Button>
        <Button variant="confirm" onClick={handleCreate} disabled={!nombre.trim()}>Crear</Button>
      </div>
    </Modal>
  )
}
