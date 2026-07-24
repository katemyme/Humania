import { useState } from 'react'
import Button from '../components/Button.jsx'
import styles from './PreguntaCard.module.css'

const TIPO_LABELS = {
  dilema: 'Dilema',
  cronologia: 'Cronología',
  decision: 'Decisión',
  palabra_clave: 'Palabra clave',
}

export default function PreguntaCard({ pregunta, kingdom, isOwn, isAuditor, onEdit, onDelete }) {
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleConfirmDelete() {
    setDeleting(true)
    try {
      await onDelete(pregunta)
    } finally {
      setDeleting(false)
      setConfirming(false)
    }
  }

  return (
    <div className={styles.card}>
      <div className={styles.tags}>
        {kingdom && (
          <span className={`${styles.badge} ${kingdom.code === 'rojo' ? styles.rojo : styles.verde}`}>
            {kingdom.name}
          </span>
        )}
        <span className={styles.tipo}>{TIPO_LABELS[pregunta.tipo] ?? pregunta.tipo}</span>
        {!isOwn && <span className={styles.soloLectura}>Contenido base · solo lectura</span>}
      </div>

      <p className={styles.prompt}>{pregunta.prompt}</p>

      <ul className={styles.opciones}>
        {pregunta.opciones.map(o => (
          <li key={o.id} className={styles.opcion}>
            {pregunta.tipo === 'cronologia' ? (
              <span className={styles.orden}>{o.correctOrder ?? '–'}</span>
            ) : (
              <span className={`${styles.check} ${o.isCorrect ? styles.checkOn : ''}`}>✓</span>
            )}
            <span>{o.content}</span>
          </li>
        ))}
      </ul>

      {isOwn && !isAuditor && (
        <div className={styles.actions}>
          <Button variant="outline" onClick={() => onEdit(pregunta)}>Editar</Button>
          {confirming ? (
            <>
              <Button variant="ghost" onClick={() => setConfirming(false)} disabled={deleting}>Cancelar</Button>
              <Button variant="confirm" onClick={handleConfirmDelete} disabled={deleting}>
                {deleting ? 'Eliminando…' : 'Confirmar borrado'}
              </Button>
            </>
          ) : (
            <Button variant="ghost" onClick={() => setConfirming(true)}>Eliminar</Button>
          )}
        </div>
      )}
    </div>
  )
}
