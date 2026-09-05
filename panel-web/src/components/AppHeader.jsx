import { useState, useEffect, useRef } from 'react'
import { useNavigate, NavLink } from 'react-router-dom'
import iconImg from '../assets/Icon.png'
import lettersImg from '../assets/Letters.png'
import { useAuth } from '../context/AuthContext.jsx'
import styles from './AppHeader.module.css'

export default function AppHeader() {
  const { user, isAuditor, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    if (!menuOpen) return
    function handleOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [menuOpen])

  function handleLogout() {
    logout()
    navigate('/login')
  }

  const badge = isAuditor
    ? { label: 'Auditor · solo lectura', className: styles.badgeAuditor }
    : { label: 'Docente', className: styles.badgeDocente }

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <div className={styles.brand}>
          <img src={iconImg} alt="" className={styles.brandIcon} />
          <img src={lettersImg} alt="Humania" className={styles.brandLetters} />
        </div>

        <nav className={styles.nav}>
          <NavLink
            to="/salas"
            className={({ isActive }) => `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`}
          >
            Mis salas
          </NavLink>
          <NavLink
            to="/preguntas"
            className={({ isActive }) => `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`}
          >
            Preguntas
          </NavLink>
        </nav>
      </div>

      <div className={styles.right}>
        <span className={`${styles.badge} ${badge.className}`}>{badge.label}</span>

        <div className={styles.avatarWrap} ref={menuRef}>
          <button
            className={styles.avatar}
            onClick={() => setMenuOpen(o => !o)}
            aria-label="Menú de usuario"
          >
            {user?.initials ?? '?'}
          </button>

          {menuOpen && (
            <div className={styles.menu}>
              <p className={styles.menuEmail}>{user?.email}</p>
              <hr className={styles.menuDivider} />
              <button className={styles.menuLogout} onClick={handleLogout}>
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
