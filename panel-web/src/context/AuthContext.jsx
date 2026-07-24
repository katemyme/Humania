import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../supabaseClient.js'

const AuthContext = createContext(null)

// El panel solo distingue "docente" (rol admin en la BD) y "auditor".
const ROLE_MAP = { admin: 'docente', auditor: 'auditor' }

function buildUser(authUser, dbRole) {
  const email = authUser.email ?? ''
  const initials = email.slice(0, 2).toUpperCase()
  return { id: authUser.id, email, role: ROLE_MAP[dbRole], initials }
}

function friendlyAuthError(error) {
  const msg = error?.message ?? ''
  if (msg.includes('Invalid login credentials')) return 'Correo o contraseña incorrectos.'
  if (msg.includes('Email not confirmed')) return 'Tu correo aún no ha sido confirmado.'
  if (msg.toLowerCase().includes('fetch') || msg.toLowerCase().includes('network')) {
    return 'No se pudo conectar con el servidor. Revisa tu conexión a internet.'
  }
  return 'Ocurrió un error al iniciar sesión. Inténtalo de nuevo.'
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  async function loadProfile(authUser) {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', authUser.id)
      .single()

    if (error || !profile) {
      await supabase.auth.signOut()
      setUser(null)
      throw new Error('No se pudo cargar tu perfil. Contacta al administrador.')
    }

    if (profile.role !== 'admin' && profile.role !== 'auditor') {
      await supabase.auth.signOut()
      setUser(null)
      throw new Error('Este panel es solo para docentes. Tu cuenta es de alumno.')
    }

    setUser(buildUser(authUser, profile.role))
  }

  useEffect(() => {
    let active = true

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!active) return
      if (session?.user) {
        try {
          await loadProfile(session.user)
        } catch {
          // Sesión inválida o rol no permitido: loadProfile ya limpió el estado.
        }
      }
      if (active) setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        setUser(null)
      }
    })

    return () => {
      active = false
      listener.subscription.unsubscribe()
    }
  }, [])

  async function login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw new Error(friendlyAuthError(error))
    await loadProfile(data.user)
  }

  async function logout() {
    await supabase.auth.signOut()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAuditor: user?.role === 'auditor' }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
