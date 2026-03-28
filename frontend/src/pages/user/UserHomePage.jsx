import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'
import '../auth/AuthPage.css'

const UserHomePage = () => {
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <main className="dashboard-shell">
      <section className="dashboard-card">
        <h1 className="dashboard-title">Mi cuenta</h1>
        <p className="dashboard-text">Bienvenida: {user?.nombre} {user?.apellido}</p>
        <p className="dashboard-text">Email: {user?.email}</p>
        <p className="dashboard-text">Rol: {user?.rol}</p>

        <div className="dashboard-actions">
          <button type="button" className="dashboard-button" onClick={() => navigate('/')}>Ir a inicio</button>
          <button type="button" className="dashboard-button secondary" onClick={handleLogout}>Cerrar sesion</button>
        </div>
      </section>
    </main>
  )
}

export default UserHomePage
