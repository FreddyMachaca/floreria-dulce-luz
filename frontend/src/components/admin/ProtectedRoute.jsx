import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'

const ProtectedRoute = ({ children, requireRole, redirectTo = '/login' }) => {
  const { isAuthenticated, loading, user } = useAuth()

  if (loading) {
    return (
      <div className="auth-shell">
        <div className="auth-card">
          <h2 className="auth-title">Cargando sesion...</h2>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to={redirectTo} replace />
  }

  if (requireRole && user?.rol !== requireRole) {
    return <Navigate to="/login" replace />
  }

  return children
}

export default ProtectedRoute
