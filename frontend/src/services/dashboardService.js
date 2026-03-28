import api from './api'

export const dashboardService = {
  async getDashboard(params = {}) {
    const response = await api.get('/dashboard', { params })
    return response.data
  },

  async getStats() {
    const response = await api.get('/dashboard/stats')
    return response.data
  },

  async getRecentOrders() {
    const response = await api.get('/dashboard/recent-orders')
    return response.data
  },
}
