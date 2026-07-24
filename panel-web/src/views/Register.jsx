import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import iconImg from '../assets/Icon.png'
import Field from '../components/Field.jsx'
import Button from '../components/Button.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { registrarDocente } from '../data/api.js'
import styles from './Register.module.css'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function Register() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function validar() {
    if (!fullName.trim() || !email.trim() || !password || !confirmPassword || !code.trim()) {
      return 'Completa todos los campos.'
    }
    if (!EMAIL_REGEX.test(email.trim())) {
      return 'Ingresa un correo electrónico válido.'
    }
    if (password.length < 8) {
      return 'La contraseña debe tener al menos 8 caracteres.'
    }
    if (password !== confirmPassword) {
      return 'Las contraseñas no coinciden.'
    }
    return ''
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const validationError = validar()
    if (validationError) { setError(validationError); return }

    setError('')
    setLoading(true)
    try {
      await registrarDocente({
        fullName: fullName.trim(),
        email: email.trim(),
        password,
        code: code.trim(),
      })
      await login(email.trim(), password)
      navigate('/salas')
    } catch (err) {
      setError(err.message || 'Ocurrió un error al registrarte. Inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <img src={iconImg} alt="Humania" className={styles.icon} />
          <p className={styles.subtitle}>Registro de docentes</p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <Field
            id="fullName"
            label="Nombre completo"
            type="text"
            placeholder="Ej: María Pérez"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            autoComplete="name"
          />
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
            autoComplete="new-password"
          />
          <Field
            id="confirmPassword"
            label="Confirmar contraseña"
            type="password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
          />
          <Field
            id="code"
            label="Código de institución"
            type="text"
            placeholder="Ej: MINED-2025"
            value={code}
            onChange={e => setCode(e.target.value)}
            autoComplete="off"
          />
          {error && <p className={styles.error}>{error}</p>}
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? 'Creando cuenta…' : 'Crear cuenta'}
          </Button>
        </form>

        <Link to="/login" className={styles.forgot}>¿Ya tienes cuenta? Inicia sesión</Link>
      </div>
    </div>
  )
}
