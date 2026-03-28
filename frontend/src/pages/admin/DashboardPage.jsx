import { useEffect, useState } from 'react'
import AdminLayout from '../../components/admin/AdminLayout'
import { dashboardService } from '../../services/dashboardService'
import { formatCurrency } from '../../utils/currencyUtils'
import './AdminPanel.css'

const DashboardPage = () => {
  const [dashboard, setDashboard] = useState(null)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const [dashboardResponse, statsResponse] = await Promise.all([
          dashboardService.getDashboard({ periodo: 30 }),
          dashboardService.getStats(),
        ])

        setDashboard(dashboardResponse.data)
        setStats(statsResponse.data)
      } catch (error) {
        setMessage(error.response?.data?.message || 'No se pudo cargar el dashboard')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const resumen = dashboard?.resumen || {}
  const ordenesRecientes = dashboard?.ultimasOrdenes || []

  return (
    <AdminLayout title="Dashboard" subtitle="Resumen de ventas, productos y ordenes de Floreria Dulce Luz">
      <article className="admin-card">
        {loading ? <p className="admin-message">Cargando metricas...</p> : null}
        {message ? <p className="admin-message">{message}</p> : null}

        <div className="metrics-grid">
          <div className="metric-box">
            <div className="metric-label">Ordenes pagadas (30 dias)</div>
            <div className="metric-value">{resumen.totalOrdenes || 0}</div>
          </div>
          <div className="metric-box">
            <div className="metric-label">Ingresos (30 dias)</div>
            <div className="metric-value">{formatCurrency(resumen.ingresosTotales || 0)}</div>
          </div>
          <div className="metric-box">
            <div className="metric-label">Productos activos</div>
            <div className="metric-value">{resumen.total_productos || stats?.totalProductos || 0}</div>
          </div>
          <div className="metric-box">
            <div className="metric-label">Ordenes pendientes</div>
            <div className="metric-value">{resumen.ordenes_pendientes || stats?.ordenesPendientes || 0}</div>
          </div>
        </div>
      </article>

      <article className="admin-card">
        <div className="admin-card-head">
          <h2>Ordenes recientes</h2>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Codigo</th>
                <th>Cliente</th>
                <th>Total</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {ordenesRecientes.length === 0 ? (
                <tr>
                  <td colSpan={4}>No hay ordenes recientes</td>
                </tr>
              ) : (
                ordenesRecientes.map((orden) => (
                  <tr key={orden.id}>
                    <td>{orden.codigo_unico}</td>
                    <td>{orden.cliente_nombre} {orden.cliente_apellido}</td>
                    <td>{formatCurrency(orden.total)}</td>
                    <td>
                      <span className={`admin-chip ${orden.estado === 'pagado' ? 'ok' : orden.estado === 'pendiente' ? 'warn' : 'off'}`}>
                        {orden.estado}
                      </span>
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

export default DashboardPage
