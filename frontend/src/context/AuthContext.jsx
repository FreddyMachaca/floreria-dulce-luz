import { useCallback, useEffect, useState } from 'react'
import { authService } from '../services/authService'
import { AuthContext } from './authContextValue'

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initAuth = async () => {
      const storedUser = localStorage.getItem('user')
      const accessToken = localStorage.getItem('accessToken')

      if (!storedUser || !accessToken) {
        setLoading(false)
        return
      }

      try {
        const response = await authService.getProfile()
        setUser(response.data.usuario)
      } catch {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('user')
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    initAuth()
  }, [])

  const persistSession = useCallback((accessToken, usuario) => {
    localStorage.setItem('accessToken', accessToken)
    localStorage.setItem('user', JSON.stringify(usuario))
    setUser(usuario)
  }, [])

  const login = useCallback(
    async (email, password) => {
      try {
        const response = await authService.login(email, password)
        persistSession(response.data.accessToken, response.data.usuario)
        return { success: true, user: response.data.usuario }
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || 'Error al iniciar sesion',
        }
      }
    },
    [persistSession],
  )

  const register = useCallback(
    async (payload) => {
      try {
        const response = await authService.register(payload)
        persistSession(response.data.accessToken, response.data.usuario)
        return { success: true, user: response.data.usuario }
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || 'Error al registrar usuario',
        }
      }
    },
    [persistSession],
  )

  const logout = useCallback(async () => {
    try {
      await authService.logout()
    } catch (error) {
      console.error('Error en logout:', error)
    } finally {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('user')
      setUser(null)
    }
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: Boolean(user),
        isAdmin: user?.rol === 'admin',
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
