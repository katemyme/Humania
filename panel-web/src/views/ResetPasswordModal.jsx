import { useState } from 'react'
import Modal from '../components/Modal.jsx'
import Button from '../components/Button.jsx'
import { resetPasswordAlumno } from '../data/api.js'
import { copyToClipboard } from '../utils/clipboard.js'
import styles from './ResetPasswordModal.module.css'

const MIN_LARGO = 6

export default function ResetPasswordModal({ alumno, onClose }) {
  const [password, setPassword] = useState('')
  const [generada, setGenerada] = useState('')
  const [copiada, setCopiada] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const invalida = password !== '' && password.length < MIN_LARGO

  async function handleReset() {
    if (invalida) return
    setError('')
    setSubmitting(true)
    try {
      setGenerada(await resetPasswordAlumno(alumno.id, password))
    } catch (err) {
      setError(err.message || 'No se pudo restablecer la contraseña. Inténtalo de nuevo.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleCopiar() {
    await copyToClipboard(generada).catch(() => {})
    setCopiada(true)
  }

  // Paso 2: la contraseña ya se cambió y solo se muestra esta vez.
  if (generada) {
    return (
      <Modal onClose={onClose}>
        <h2 className={styles.heading}>Contraseña restablecida</h2>
        <p className={styles.texto}>
          Dictale esta contraseña a <strong>{alumno.nombre}</strong> para que entre al juego.
          No se vuelve a mostrar.
        </p>

        <div className={styles.passwordBox}>
          <code className={styles.password}>{generada}</code>
          <button type="button" className={styles.copiar} onClick={handleCopiar}>
            {copiada ? '¡Copiada!' : 'Copiar'}
          </button>
        </div>

        <div className={styles.actions}>
          <Button variant="confirm" onClick={onClose}>Listo</Button>
        </div>
      </Modal>
    )
  }

  // Paso 1: confirmar y, si se quiere, elegir la contraseña a mano.
  return (
    <Modal onClose={onClose}>
      <h2 className={styles.heading}>Restablecer contraseña</h2>
      <p className={styles.texto}>
        Se cambiará la contraseña de <strong>{alumno.nombre}</strong>. La actual dejará de
        funcionar en cuanto confirmes.
      </p>

      <label className={styles.field}>
        <span className={styles.label}>Contraseña nueva (opcional)</span>
        <input
          className={styles.input}
          type="text"
          placeholder="Déjalo vacío y se genera una temporal"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleReset()}
          autoFocus
        />
        <span className={styles.hint}>
          {invalida
            ? `Debe tener al menos ${MIN_LARGO} caracteres.`
            : 'Si lo dejas vacío, el servidor genera una contraseña temporal fácil de dictar.'}
        </span>
      </label>

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.actions}>
        <Button variant="ghost" onClick={onClose} disabled={submitting}>Cancelar</Button>
        <Button variant="confirm" onClick={handleReset} disabled={invalida || submitting}>
          {submitting ? 'Restableciendo…' : 'Restablecer'}
        </Button>
      </div>
    </Modal>
  )
}
