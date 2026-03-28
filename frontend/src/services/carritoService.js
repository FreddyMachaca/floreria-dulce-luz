import api from './api'

export const carritoService = {
  async getCarrito() {
    const response = await api.get('/carrito')
    return response.data
  },

  async addItem(producto_id, cantidad = 1) {
    const response = await api.post('/carrito/items', { producto_id, cantidad })
    return response.data
  },

  async updateItemQuantity(id, cantidad) {
    const response = await api.put(`/carrito/items/${id}`, { cantidad })
    return response.data
  },

  async removeItem(id) {
    const response = await api.delete(`/carrito/items/${id}`)
    return response.data
  },

  async clearCarrito() {
    const response = await api.delete('/carrito')
    return response.data
  },

  async setClienteInfo(payload) {
    const response = await api.post('/carrito/cliente', payload)
    return response.data
  },
}
