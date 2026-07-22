import styles from './RoomCodeChip.module.css'

export default function RoomCodeChip({ codigo, onCopy }) {
  return (
    <div className={styles.chip} onClick={onCopy} role="button" tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onCopy()}>
      <div className={styles.info}>
        <span className={styles.chipLabel}>Código de sala</span>
        <span className={styles.code}>{codigo}</span>
      </div>
      <span className={styles.copyBtn}>Copiar</span>
    </div>
  )
}
