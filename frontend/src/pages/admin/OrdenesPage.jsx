import { useCallback, useEffect, useState } from 'react'
import AdminLayout from '../../components/admin/AdminLayout'
import { ordenService } from '../../services/ordenService'
import { formatCurrency } from '../../utils/currencyUtils'
import './AdminPanel.css'

const estadosDisponibles = ['pendiente', 'pagado', 'cancelado']

const OrdenesPage = () => {
  const [ordenes, setOrdenes] = useState([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const loadOrdenes = useCallback(async () => {
    try {
      setLoading(true)
      const response = await ordenService.getOrdenes({ page: 1, limit: 100 })
      setOrdenes(response.data?.ordenes || [])
    } catch (error) {
      setMessage(error.response?.data?.message || 'No se pudo cargar ordenes')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadOrdenes()
  }, [loadOrdenes])

  const handleEstadoChange = async (ordenId, estado) => {
    try {
      await ordenService.updateOrdenEstado(ordenId, estado)
      setMessage('Estado actualizado')
      await loadOrdenes()
    } catch (error) {
      setMessage(error.response?.data?.message || 'No se pudo actualizar el estado')
    }
  }

  return (
    <AdminLayout title="Gestion de Ordenes" subtitle="Control de estados de compra y seguimiento de pedidos">
      <article className="admin-card">
        <div className="admin-card-head">
          <h2>Listado de ordenes</h2>
          {loading ? <p className="admin-message">Cargando ordenes...</p> : null}
        </div>
        {message ? <p className="admin-message">{message}</p> : null}

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Codigo</th>
                <th>Cliente</th>
                <th>Telefono</th>
                <th>Total</th>
                <th>Fecha</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {ordenes.length === 0 ? (
                <tr>
                  <td colSpan={6}>No hay ordenes</td>
                </tr>
              ) : (
                ordenes.map((orden) => (
                  <tr key={orden.id}>
                    <td>{orden.codigo_unico}</td>
                    <td>{orden.cliente_nombre} {orden.cliente_apellido}</td>
                    <td>{orden.cliente_telefono}</td>
                    <td>{formatCurrency(orden.total)}</td>
                    <td>{new Date(orden.created_at).toLocaleString('es-BO')}</td>
                    <td>
                      <select
                        value={orden.estado}
                        onChange={(event) => handleEstadoChange(orden.id, event.target.value)}
                      >
                        {estadosDisponibles.map((estado) => (
                          <option key={estado} value={estado}>
                            {estado}
                          </option>
                        ))}
                      </select>
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

export default OrdenesPage
