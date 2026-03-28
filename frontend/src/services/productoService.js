import api from './api'

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/$/, '')
const SERVER_BASE = API_BASE.endsWith('/api') ? API_BASE.slice(0, -4) : API_BASE

const buildProductoFormData = (payload = {}) => {
  const formData = new FormData()

  if (payload.nombre !== undefined) formData.append('nombre', payload.nombre)
  if (payload.descripcion !== undefined) formData.append('descripcion', payload.descripcion)
  if (payload.precio !== undefined) formData.append('precio', String(payload.precio))
  if (payload.cantidad !== undefined) formData.append('cantidad', String(payload.cantidad))
  if (payload.estado !== undefined) formData.append('estado', payload.estado)
  if (payload.activo !== undefined) formData.append('activo', payload.activo ? 'true' : 'false')
  if (payload.remove_imagen !== undefined) formData.append('remove_imagen', payload.remove_imagen ? 'true' : 'false')
  if (payload.imagenFile instanceof File) formData.append('imagen', payload.imagenFile)

  return formData
}

export const resolveImageUrl = (imagePath) => {
  if (!imagePath) return null
  if (/^https?:\/\//i.test(imagePath)) return imagePath
  if (imagePath.startsWith('/')) return `${SERVER_BASE}${imagePath}`
  return `${SERVER_BASE}/${imagePath}`
}

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
    const formData = buildProductoFormData(payload)
    const response = await api.post('/productos', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },

  async updateProducto(id, payload) {
    const formData = buildProductoFormData(payload)
    const response = await api.put(`/productos/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },

  async deleteProducto(id) {
    const response = await api.delete(`/productos/${id}`)
    return response.data
  },
}
