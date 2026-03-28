import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'
import '../auth/AuthPage.css'

const AdminHomePage = () => {
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const handleLogout = async () => {
    await logout()
    navigate('/admin/login', { replace: true })
  }

  return (
    <main className="dashboard-shell">
      <section className="dashboard-card">
        <h1 className="dashboard-title">Panel administrador</h1>
        <p className="dashboard-text">Sesion activa: {user?.nombre} {user?.apellido} ({user?.email})</p>
        <p className="dashboard-text">Este panel ya valida rol admin con token y sesion activa.</p>

        <div className="dashboard-actions">
          <button type="button" className="dashboard-button" onClick={() => navigate('/')}>Volver a tienda</button>
          <button type="button" className="dashboard-button secondary" onClick={handleLogout}>Cerrar sesion</button>
        </div>
      </section>
    </main>
  )
}

export default AdminHomePage
