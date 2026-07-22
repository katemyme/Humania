import Logo from './Logo.jsx'
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
        <Logo size="sm" />
        <span className={styles.brandName}>Humania</span>
      </div>
      <div className={styles.right}>
        <span className={`${styles.badge} ${badge.className}`}>{badge.label}</span>
        <div className={styles.avatar}>{user?.initials ?? '?'}</div>
      </div>
    </header>
  )
}
