import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Logo from '../components/Logo.jsx'
import Field from '../components/Field.jsx'
import Button from '../components/Button.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import styles from './Login.module.css'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email || !password) { setError('Completa todos los campos.'); return }
    setError('')
    setLoading(true)
    await login(email, password)
    navigate('/salas')
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <Logo size="lg" />
          <h1 className={styles.title}>Humania</h1>
          <p className={styles.subtitle}>Panel docente</p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <Field
            id="email"
            label="Correo electrónico"
            type="email"
            placeholder="docente@escuela.edu"
            value={email}
            onChange={e => setEmail(e.target.value)}
            autoComplete="email"
          />
          <Field
            id="password"
            label="Contraseña"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoComplete="current-password"
          />
          {error && <p className={styles.error}>{error}</p>}
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? 'Entrando…' : 'Iniciar sesión'}
          </Button>
        </form>

        <a href="#" className={styles.forgot}>¿Olvidaste tu contraseña?</a>
      </div>
    </div>
  )
}
