import { useEffect, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'

const SIDEBAR_KEY = 'floreria-admin-sidebar-collapsed'

const menuItems = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: 'pi pi-chart-line' },
  { to: '/admin/productos', label: 'Productos', icon: 'pi pi-box' },
  { to: '/admin/ordenes', label: 'Ordenes', icon: 'pi pi-shopping-bag' },
]

const AdminLayout = ({ title, subtitle, actions, children }) => {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [collapsed, setCollapsed] = useState(() => {
    const stored = localStorage.getItem(SIDEBAR_KEY)
    return stored === '1'
  })
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    localStorage.setItem(SIDEBAR_KEY, collapsed ? '1' : '0')
  }, [collapsed])

  const handleLogout = async () => {
    await logout()
    navigate('/admin/login', { replace: true })
  }

  const closeMobile = () => {
    setMobileOpen(false)
  }

  return (
    <div className={`admin-app ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
      <aside className="admin-sidebar">
        <div className="admin-sidebar-top">
          <Link to="/admin/dashboard" className="admin-sidebar-brand" onClick={closeMobile}>
            <span className="admin-brand-icon">DL</span>
            <span className="admin-brand-text">Floreria Dulce Luz</span>
          </Link>

          <button
            type="button"
            className="admin-collapse-btn"
            onClick={() => setCollapsed((prev) => !prev)}
            aria-label="Colapsar menu"
          >
            <i className={`pi ${collapsed ? 'pi-angle-right' : 'pi-angle-left'}`} />
          </button>
        </div>

        <nav className="admin-sidebar-nav">
          {menuItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
              onClick={closeMobile}
            >
              <i className={item.icon} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-user-badge">
            <span className="admin-user-dot" />
            <span>{user?.email || 'admin'}</span>
          </div>
          <button type="button" className="admin-logout-btn" onClick={handleLogout}>
            <i className="pi pi-sign-out" />
            <span>Cerrar sesion</span>
          </button>
        </div>
      </aside>

      <div className="admin-overlay" onClick={closeMobile} />

      <main className="admin-main">
        <header className="admin-main-header">
          <button type="button" className="admin-mobile-menu" onClick={() => setMobileOpen(true)}>
            <i className="pi pi-bars" />
          </button>

          <div>
            <h1 className="admin-page-title">{title}</h1>
            {subtitle ? <p className="admin-page-subtitle">{subtitle}</p> : null}
          </div>

          <div className="admin-header-actions">{actions}</div>
        </header>

        <section className="admin-main-content">{children}</section>
      </main>
    </div>
  )
}

export default AdminLayout
