import styles from './ProgressBar.module.css'

export default function ProgressBar({ pct, color = 'var(--color-azul)', height = 10 }) {
  return (
    <div className={styles.track} style={{ height }}>
      <div
        className={styles.fill}
        style={{ width: `${Math.min(100, Math.max(0, pct))}%`, background: color }}
      />
    </div>
  )
}
