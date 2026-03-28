import { useCallback, useEffect, useMemo, useState } from 'react'
import AdminLayout from '../../components/admin/AdminLayout'
import { productoService } from '../../services/productoService'
import { formatCurrency } from '../../utils/currencyUtils'
import './AdminPanel.css'

const initialForm = {
  nombre: '',
  descripcion: '',
  precio: '',
  cantidad: '',
  es_servicio: false,
  estado: 'disponible',
  activo: true,
  imagen: '',
}

const ProductosPage = () => {
  const [productos, setProductos] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState(initialForm)

  const isEditing = useMemo(() => Boolean(editingId), [editingId])

  const loadProductos = useCallback(async () => {
    try {
      setLoading(true)
      const response = await productoService.getProductos({ page: 1, limit: 100 })
      setProductos(response.data?.productos || [])
    } catch (error) {
      setMessage(error.response?.data?.message || 'No se pudo cargar productos')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadProductos()
  }, [loadProductos])

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const resetForm = () => {
    setFormData(initialForm)
    setEditingId(null)
  }

  const handleEdit = (producto) => {
    setEditingId(producto.id)
    setFormData({
      nombre: producto.nombre || '',
      descripcion: producto.descripcion || '',
      precio: String(producto.precio ?? ''),
      cantidad: String(producto.cantidad ?? ''),
      es_servicio: Boolean(producto.es_servicio),
      estado: producto.estado || 'disponible',
      activo: Boolean(producto.activo),
      imagen: producto.imagen || '',
    })
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Deseas eliminar este producto?')) {
      return
    }

    try {
      await productoService.deleteProducto(id)
      await loadProductos()
      setMessage('Producto eliminado correctamente')
    } catch (error) {
      setMessage(error.response?.data?.message || 'No se pudo eliminar el producto')
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setMessage('')

    const payload = {
      nombre: formData.nombre,
      descripcion: formData.descripcion,
      precio: Number(formData.precio),
      cantidad: Number(formData.cantidad || 0),
      es_servicio: formData.es_servicio,
      estado: formData.estado,
      activo: formData.activo,
      imagen: formData.imagen || null,
    }

    try {
      if (isEditing) {
        await productoService.updateProducto(editingId, payload)
        setMessage('Producto actualizado')
      } else {
        await productoService.createProducto(payload)
        setMessage('Producto creado')
      }

      resetForm()
      await loadProductos()
    } catch (error) {
      setMessage(error.response?.data?.message || 'No se pudo guardar el producto')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AdminLayout
      title="CRUD de Productos"
      subtitle="Crea, edita y elimina productos desde un solo flujo"
      actions={
        isEditing ? (
          <button type="button" className="admin-header-button secondary" onClick={resetForm}>
            Cancelar edicion
          </button>
        ) : null
      }
    >
      <article className="admin-card">
        <div className="admin-card-head">
          <h2>{isEditing ? 'Editar producto' : 'Nuevo producto'}</h2>
        </div>

        <form className="admin-form" onSubmit={handleSubmit}>
          <input name="nombre" placeholder="Nombre" value={formData.nombre} onChange={handleChange} required />
          <input name="precio" type="number" step="0.01" min="0" placeholder="Precio" value={formData.precio} onChange={handleChange} required />
          <textarea className="full" name="descripcion" placeholder="Descripcion" value={formData.descripcion} onChange={handleChange} />
          <input
            name="cantidad"
            type="number"
            min="0"
            placeholder="Cantidad"
            value={formData.cantidad}
            onChange={handleChange}
            disabled={formData.es_servicio}
          />
          <input name="imagen" placeholder="URL de imagen (opcional)" value={formData.imagen} onChange={handleChange} />

          <select name="estado" value={formData.estado} onChange={handleChange}>
            <option value="disponible">disponible</option>
            <option value="no_disponible">no_disponible</option>
          </select>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--ink)' }}>
            <input type="checkbox" name="es_servicio" checked={formData.es_servicio} onChange={handleChange} />
            Es servicio
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--ink)' }}>
            <input type="checkbox" name="activo" checked={formData.activo} onChange={handleChange} />
            Activo
          </label>

          <div className="admin-inline-actions full">
            <button type="submit" className="admin-button" disabled={saving}>
              {saving ? 'Guardando...' : isEditing ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>

        {message ? <p className="admin-message">{message}</p> : null}
      </article>

      <article className="admin-card">
        <div className="admin-card-head">
          <h2>Listado de productos</h2>
          {loading ? <p className="admin-message">Cargando productos...</p> : null}
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Precio</th>
                <th>Stock</th>
                <th>Estado</th>
                <th>Activo</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {productos.length === 0 ? (
                <tr>
                  <td colSpan={6}>No hay productos</td>
                </tr>
              ) : (
                productos.map((producto) => (
                  <tr key={producto.id}>
                    <td>{producto.nombre}</td>
                    <td>{formatCurrency(producto.precio)}</td>
                    <td>{producto.es_servicio ? 'Servicio' : producto.cantidad}</td>
                    <td>
                      <span className={`admin-chip ${producto.estado === 'disponible' ? 'ok' : 'off'}`}>
                        {producto.estado}
                      </span>
                    </td>
                    <td>
                      <span className={`admin-chip ${producto.activo ? 'ok' : 'off'}`}>
                        {producto.activo ? 'si' : 'no'}
                      </span>
                    </td>
                    <td>
                      <div className="admin-inline-actions">
                        <button type="button" className="admin-button secondary" onClick={() => handleEdit(producto)}>
                          Editar
                        </button>
                        <button type="button" className="admin-button" onClick={() => handleDelete(producto.id)}>
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </article>
    </AdminLayout>
  )
}

export default ProductosPage
