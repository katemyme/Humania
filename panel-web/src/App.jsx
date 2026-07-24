import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'
import Login from './views/Login.jsx'
import Dashboard from './views/Dashboard.jsx'
import SalaDetalle from './views/SalaDetalle.jsx'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  return user ? children : <Navigate to="/login" replace />
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  return user ? <Navigate to="/salas" replace /> : children
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={
            <PublicRoute><Login /></PublicRoute>
          } />
          <Route path="/salas" element={
            <ProtectedRoute><Dashboard /></ProtectedRoute>
          } />
          <Route path="/salas/:id" element={
            <ProtectedRoute><SalaDetalle /></ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/salas" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
