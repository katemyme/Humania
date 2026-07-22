import iconImg from '../assets/Icon.png'
import lettersImg from '../assets/Letters.png'
import { useAuth } from '../context/AuthContext.jsx'
import styles from './AppHeader.module.css'

export default function AppHeader() {
  const { user, isAuditor } = useAuth()

  const badge = isAuditor
    ? { label: 'Auditor · solo lectura', className: styles.badgeAuditor }
    : { label: 'Docente', className: styles.badgeDocente }

  return (
    <header className={styles.header}>
      <div className={styles.brand}>
        <img src={iconImg} alt="" className={styles.brandIcon} />
        <img src={lettersImg} alt="Humania" className={styles.brandLetters} />
      </div>
      <div className={styles.right}>
        <span className={`${styles.badge} ${badge.className}`}>{badge.label}</span>
        <div className={styles.avatar}>{user?.initials ?? '?'}</div>
      </div>
    </header>
  )
}
