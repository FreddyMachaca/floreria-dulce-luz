import api from './api'

export const authService = {
  register: async (payload) => {
    const response = await api.post('/auth/register', payload)
    return response.data
  },

  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password })
    return response.data
  },

  logout: async () => {
    const response = await api.post('/auth/logout')
    return response.data
  },

  refreshToken: async () => {
    const response = await api.post('/auth/refresh-token')
    return response.data
  },

  getProfile: async () => {
    const response = await api.get('/auth/profile')
    return response.data
  },
}
