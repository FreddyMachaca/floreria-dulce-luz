import api from './api'

export const productoService = {
  async getProductosPublicos(params = {}) {
    const response = await api.get('/productos/publicos', { params })
    return response.data
  },

  async getProductoPublicoById(id) {
    const response = await api.get(`/productos/publicos/${id}`)
    return response.data
  },

  async getProductos(params = {}) {
    const response = await api.get('/productos', { params })
    return response.data
  },

  async getProductoById(id) {
    const response = await api.get(`/productos/${id}`)
    return response.data
  },

  async createProducto(payload) {
    const response = await api.post('/productos', payload)
    return response.data
  },

  async updateProducto(id, payload) {
    const response = await api.put(`/productos/${id}`, payload)
    return response.data
  },

  async deleteProducto(id) {
    const response = await api.delete(`/productos/${id}`)
    return response.data
  },
}
