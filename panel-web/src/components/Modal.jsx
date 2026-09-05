import styles from './Modal.module.css'

export default function Modal({ onClose, children }) {
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.card} onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  )
}
