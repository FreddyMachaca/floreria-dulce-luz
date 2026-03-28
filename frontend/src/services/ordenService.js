import api from './api'

export const ordenService = {
  async getOrdenes(params = {}) {
    const response = await api.get('/ordenes', { params })
    return response.data
  },

  async getOrdenById(id) {
    const response = await api.get(`/ordenes/${id}`)
    return response.data
  },

  async updateOrdenEstado(id, estado) {
    const response = await api.put(`/ordenes/${id}/estado`, { estado })
    return response.data
  },
}
