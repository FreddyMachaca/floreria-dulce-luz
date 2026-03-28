import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'
import './AuthPage.css'

const LoginPage = ({ adminMode = false }) => {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const title = useMemo(() => (adminMode ? 'Panel administrativo' : 'Inicia sesion'), [adminMode])

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')

    const result = await login(formData.email, formData.password)

    if (!result.success) {
      setError(result.message)
      setLoading(false)
      return
    }

    if (adminMode && result.user?.rol !== 'admin') {
      setError('Este acceso es exclusivo para administradores')
      setLoading(false)
      return
    }

    navigate(adminMode ? '/admin' : '/mi-cuenta', { replace: true })
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <span className="auth-eyebrow">Floreria Dulce Luz</span>
        <h1 className="auth-title">{title}</h1>
        <p className="auth-subtitle">Accede con tu cuenta para continuar con tu compra.</p>

        {error ? <p className="auth-error">{error}</p> : null}

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="auth-row">
            <span className="auth-label">Email</span>
            <input
              className="auth-input"
              type="email"
              name="email"
              autoComplete="email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder={adminMode ? 'Correo Electronico' : 'tu@email.com'}
            />
          </label>

          <label className="auth-row">
            <span className="auth-label">Contrasena</span>
            <input
              className="auth-input"
              type="password"
              name="password"
              autoComplete="current-password"
              required
              minLength={6}
              value={formData.password}
              onChange={handleChange}
              placeholder="Minimo 6 caracteres"
            />
          </label>

          <button className="auth-button" type="submit" disabled={loading}>
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        <div className="auth-links">
          {!adminMode ? <Link className="auth-link" to="/registro">Crear cuenta</Link> : null}
          <Link className="auth-link" to="/">Volver al inicio</Link>
          {!adminMode ? <Link className="auth-link" to="/admin/login">Ingreso admin</Link> : null}
        </div>
      </div>
    </div>
  )
}

export default LoginPage
