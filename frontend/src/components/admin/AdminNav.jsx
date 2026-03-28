import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'

const AdminNav = () => {
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const handleLogout = async () => {
    await logout()
    navigate('/admin/login', { replace: true })
  }

  return (
    <header className="admin-topbar">
      <div className="admin-topbar-left">
        <Link className="admin-brand" to="/admin/dashboard">
          Floreria Dulce Luz
        </Link>
        <nav className="admin-menu">
          <Link to="/admin/dashboard">Dashboard</Link>
          <Link to="/admin/productos">Productos</Link>
          <Link to="/admin/ordenes">Ordenes</Link>
          <Link to="/">Inicio</Link>
        </nav>
      </div>

      <div className="admin-topbar-right">
        <span className="admin-user">{user?.email}</span>
        <button type="button" className="admin-logout" onClick={handleLogout}>
          Cerrar sesion
        </button>
      </div>
    </header>
  )
}

export default AdminNav
