const pool = require('../config/db');

const getDashboard = async (req, res) => {
    try {
        const periodo = Math.max(parseInt(req.query.periodo, 10) || 30, 1);

        const [totalVentas] = await pool.query(
            `SELECT
                COUNT(*) as total_ordenes,
                COALESCE(SUM(total), 0) as ingresos_totales
             FROM ordenes
             WHERE estado = 'pagado'
             AND created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)`,
            [periodo]
        );

        const [ventasPorDia] = await pool.query(
            `SELECT
                DATE(created_at) as fecha,
                COUNT(*) as cantidad,
                SUM(total) as total
             FROM ordenes
             WHERE estado = 'pagado'
             AND created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
             GROUP BY DATE(created_at)
             ORDER BY fecha ASC`,
            [periodo]
        );

        const [productosTopVentas] = await pool.query(
            `SELECT
                p.id,
                p.nombre,
                p.imagen,
                SUM(od.cantidad) as cantidad_vendida,
                SUM(od.subtotal) as total_vendido
             FROM orden_detalle od
             JOIN ordenes o ON o.id = od.orden_id
             JOIN productos p ON p.id = od.producto_id
             WHERE o.estado = 'pagado'
             AND o.created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
             GROUP BY p.id, p.nombre, p.imagen
             ORDER BY cantidad_vendida DESC
             LIMIT 10`,
            [periodo]
        );

        const [estadisticasGenerales] = await pool.query(
            `SELECT
                (SELECT COUNT(*) FROM productos WHERE activo = 1) as total_productos,
                (SELECT COUNT(*) FROM ordenes WHERE estado = 'pendiente') as ordenes_pendientes,
                (SELECT COUNT(*) FROM ordenes WHERE estado = 'pagado' AND DATE(created_at) = CURDATE()) as ventas_hoy`
        );

        const [ultimasOrdenes] = await pool.query(
            `SELECT id, codigo_unico, cliente_nombre, cliente_apellido, total, estado, created_at
             FROM ordenes
             ORDER BY created_at DESC
             LIMIT 5`
        );

        return res.json({
            success: true,
            data: {
                resumen: {
                    totalOrdenes: totalVentas[0].total_ordenes,
                    ingresosTotales: parseFloat(totalVentas[0].ingresos_totales).toFixed(2),
                    ...estadisticasGenerales[0]
                },
                ventasPorDia,
                productosTopVentas,
                ultimasOrdenes
            }
        });
    } catch (error) {
        console.error('Error en getDashboard:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al obtener datos del dashboard'
        });
    }
};

const getReporteVentas = async (req, res) => {
    try {
        const { fecha_inicio, fecha_fin } = req.query;
        const whereParts = ["o.estado = 'pagado'"];
        const params = [];

        if (fecha_inicio) {
            whereParts.push('DATE(o.created_at) >= ?');
            params.push(fecha_inicio);
        }

        if (fecha_fin) {
            whereParts.push('DATE(o.created_at) <= ?');
            params.push(fecha_fin);
        }

        const whereClause = whereParts.join(' AND ');

        const [ventas] = await pool.query(
            `SELECT
                o.id,
                o.codigo_unico,
                o.cliente_nombre,
                o.cliente_apellido,
                o.total,
                o.created_at,
                od.producto_nombre,
                od.cantidad,
                od.subtotal
             FROM ordenes o
             JOIN orden_detalle od ON od.orden_id = o.id
             WHERE ${whereClause}
             ORDER BY o.created_at DESC`,
            params
        );

        const [totales] = await pool.query(
            `SELECT
                COUNT(DISTINCT o.id) as total_ordenes,
                COALESCE(SUM(od.subtotal), 0) as total_vendido,
                COALESCE(SUM(od.cantidad), 0) as total_productos
             FROM ordenes o
             JOIN orden_detalle od ON od.orden_id = o.id
             WHERE ${whereClause}`,
            params
        );

        return res.json({
            success: true,
            data: {
                ventas,
                totales: {
                    totalOrdenes: totales[0].total_ordenes || 0,
                    totalVendido: parseFloat(totales[0].total_vendido || 0).toFixed(2),
                    totalProductos: totales[0].total_productos || 0
                }
            }
        });
    } catch (error) {
        console.error('Error en getReporteVentas:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al obtener reporte de ventas'
        });
    }
};

const getStats = async (req, res) => {
    try {
        const [stats] = await pool.query(
            `SELECT
                (SELECT COUNT(*) FROM ordenes) as totalOrdenes,
                (SELECT COALESCE(SUM(total), 0)
                 FROM ordenes
                 WHERE estado = 'pagado'
                 AND MONTH(created_at) = MONTH(CURDATE())
                 AND YEAR(created_at) = YEAR(CURDATE())) as ventasMes,
                (SELECT COUNT(*) FROM productos WHERE activo = 1) as totalProductos,
                (SELECT COUNT(*) FROM ordenes WHERE estado = 'pendiente') as ordenesPendientes`
        );

        return res.json({
            success: true,
            data: stats[0]
        });
    } catch (error) {
        console.error('Error en getStats:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al obtener estadisticas'
        });
    }
};

const getRecentOrders = async (req, res) => {
    try {
        const [orders] = await pool.query(
            `SELECT id, codigo_unico, cliente_nombre, cliente_apellido, total, estado, created_at
             FROM ordenes
             ORDER BY created_at DESC
             LIMIT 10`
        );

        return res.json({
            success: true,
            data: orders
        });
    } catch (error) {
        console.error('Error en getRecentOrders:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al obtener ordenes recientes'
        });
    }
};

const getChartData = async (req, res) => {
    try {
        const [ventas] = await pool.query(
            `SELECT
                DATE_FORMAT(created_at, '%b %Y') as mes,
                SUM(total) as total
             FROM ordenes
             WHERE estado = 'pagado'
             AND created_at >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
             GROUP BY YEAR(created_at), MONTH(created_at), DATE_FORMAT(created_at, '%b %Y')
             ORDER BY YEAR(created_at), MONTH(created_at)`
        );

        return res.json({
            success: true,
            data: { ventas }
        });
    } catch (error) {
        console.error('Error en getChartData:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al obtener datos del grafico'
        });
    }
};

module.exports = {
    getDashboard,
    getReporteVentas,
    getStats,
    getRecentOrders,
    getChartData
};
