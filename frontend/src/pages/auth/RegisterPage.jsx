import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'
import './AuthPage.css'

const RegisterPage = () => {
  const navigate = useNavigate()
  const { register } = useAuth()
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    password: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')

    const result = await register(formData)

    if (!result.success) {
      setError(result.message)
      setLoading(false)
      return
    }

    navigate('/mi-cuenta', { replace: true })
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <span className="auth-eyebrow">Floreria Dulce Luz</span>
        <h1 className="auth-title">Crea tu cuenta</h1>
        <p className="auth-subtitle">Registrate para guardar tu sesion y gestionar tus pedidos.</p>

        {error ? <p className="auth-error">{error}</p> : null}

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="auth-row">
            <span className="auth-label">Nombre</span>
            <input
              className="auth-input"
              type="text"
              name="nombre"
              autoComplete="given-name"
              required
              value={formData.nombre}
              onChange={handleChange}
            />
          </label>

          <label className="auth-row">
            <span className="auth-label">Apellido</span>
            <input
              className="auth-input"
              type="text"
              name="apellido"
              autoComplete="family-name"
              required
              value={formData.apellido}
              onChange={handleChange}
            />
          </label>

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
            />
          </label>

          <label className="auth-row">
            <span className="auth-label">Contrasena</span>
            <input
              className="auth-input"
              type="password"
              name="password"
              autoComplete="new-password"
              minLength={6}
              required
              value={formData.password}
              onChange={handleChange}
            />
          </label>

          <button className="auth-button" type="submit" disabled={loading}>
            {loading ? 'Creando cuenta...' : 'Registrarme'}
          </button>
        </form>

        <div className="auth-links">
          <Link className="auth-link" to="/login">Ya tengo cuenta</Link>
          <Link className="auth-link" to="/">Volver al inicio</Link>
        </div>
      </div>
    </div>
  )
}

export default RegisterPage
