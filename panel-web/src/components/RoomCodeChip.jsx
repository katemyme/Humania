import { useState, useRef } from 'react'
import styles from './RoomCodeChip.module.css'

function copyToClipboard(text) {
  if (navigator.clipboard) return navigator.clipboard.writeText(text)
  // Fallback para contextos sin Clipboard API
  const ta = document.createElement('textarea')
  ta.value = text
  ta.style.cssText = 'position:fixed;opacity:0'
  document.body.appendChild(ta)
  ta.focus()
  ta.select()
  document.execCommand('copy')
  document.body.removeChild(ta)
  return Promise.resolve()
}

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
