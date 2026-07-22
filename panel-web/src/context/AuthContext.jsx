import { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('humania_user')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })

  // Mock login — reemplazar el cuerpo con supabase.auth.signInWithPassword()
  async function login(email, _password) {
    const role = email.toLowerCase().includes('auditor') ? 'auditor' : 'docente'
    const initials = email.split('@')[0].slice(0, 2).toUpperCase()
    const userData = { email, role, initials }
    localStorage.setItem('humania_user', JSON.stringify(userData))
    setUser(userData)
  }

  function logout() {
    localStorage.removeItem('humania_user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuditor: user?.role === 'auditor' }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
