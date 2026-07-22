import styles from './ProgressBar.module.css'

export default function ProgressBar({ pct, color = 'var(--color-azul)', height = 10, ariaLabel }) {
  const value = Math.min(100, Math.max(0, pct))
  return (
    <div
      className={styles.track}
      style={{ height }}
      role="progressbar"
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={ariaLabel}
    >
      <div
        className={styles.fill}
        style={{ width: `${value}%`, background: color }}
      />
    </div>
  )
}
