import styles from './StatCard.module.css'

export default function StatCard({ value, label, valueColor }) {
  return (
    <div className={styles.card}>
      <span className={styles.value} style={valueColor ? { color: valueColor } : {}}>
        {value}
      </span>
      <span className={styles.label}>{label}</span>
    </div>
  )
}
