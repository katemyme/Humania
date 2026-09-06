import { useState, useRef } from 'react'
import { copyToClipboard } from '../utils/clipboard.js'
import styles from './RoomCodeChip.module.css'

export default function RoomCodeChip({ codigo, onCopy }) {
  const [copied, setCopied] = useState(false)
  const timerRef = useRef(null)

  async function handleCopy() {
    await copyToClipboard(codigo).catch(() => {})
    setCopied(true)
    onCopy?.(codigo)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setCopied(false), 1500)
  }

  return (
    <button
      type="button"
      className={`${styles.chip} ${copied ? styles.chipCopied : ''}`}
      onClick={handleCopy}
      aria-label={`Copiar código de sala ${codigo}`}
    >
      <div className={styles.info}>
        <span className={styles.chipLabel}>Código de sala</span>
        <span className={styles.code}>{codigo}</span>
      </div>
      <span className={styles.copyBtn} aria-live="polite" aria-atomic="true">
        {copied ? '¡Copiado!' : 'Copiar'}
      </span>
    </button>
  )
}
