import styles from './Field.module.css'

export default function Field({ label, id, ...inputProps }) {
  return (
    <label className={styles.field} htmlFor={id}>
      <span className={styles.label}>{label}</span>
      <input id={id} className={styles.input} {...inputProps} />
    </label>
  )
}
