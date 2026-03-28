import api from './api'

export const checkoutService = {
  async setClienteInfo(payload) {
    const response = await api.post('/carrito/cliente', payload)
    return response.data
  },

  async generateQr(forceNew = false) {
    const response = await api.post('/pagos/generar-qr', { forceNew })
    return response.data
  },

  async checkQrStatus() {
    const response = await api.get('/pagos/verificar-qr')
    return response.data
  },
}
