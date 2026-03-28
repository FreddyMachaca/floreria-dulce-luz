const pool = require('../config/db');

const getOrdenes = async (req, res) => {
    try {
        const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
        const limit = Math.max(parseInt(req.query.limit, 10) || 10, 1);
        const offset = (page - 1) * limit;
        const { estado, search, fecha_inicio, fecha_fin } = req.query;

        const whereParts = ['1=1'];
        const params = [];

        if (estado) {
            whereParts.push('estado = ?');
            params.push(estado);
        }

        if (search) {
            whereParts.push('(codigo_unico LIKE ? OR cliente_nombre LIKE ? OR cliente_apellido LIKE ? OR cliente_telefono LIKE ?)');
            params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
        }

        if (fecha_inicio) {
            whereParts.push('DATE(created_at) >= ?');
            params.push(fecha_inicio);
        }

        if (fecha_fin) {
            whereParts.push('DATE(created_at) <= ?');
            params.push(fecha_fin);
        }

        const whereClause = whereParts.join(' AND ');

        const [countResult] = await pool.query(
            `SELECT COUNT(*) as total FROM ordenes WHERE ${whereClause}`,
            params
        );

        const [ordenes] = await pool.query(
            `SELECT * FROM ordenes
             WHERE ${whereClause}
             ORDER BY created_at DESC
             LIMIT ? OFFSET ?`,
            [...params, limit, offset]
        );

        return res.json({
            success: true,
            data: {
                ordenes,
                pagination: {
                    page,
                    limit,
                    total: countResult[0].total,
                    totalPages: Math.ceil(countResult[0].total / limit)
                }
            }
        });
    } catch (error) {
        console.error('Error en getOrdenes:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al obtener ordenes'
        });
    }
};

const getOrdenById = async (req, res) => {
    try {
        const { id } = req.params;

        const [ordenes] = await pool.query('SELECT * FROM ordenes WHERE id = ?', [id]);

        if (ordenes.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Orden no encontrada'
            });
        }

        const [detalles] = await pool.query(
            `SELECT od.*, p.imagen as producto_imagen
             FROM orden_detalle od
             LEFT JOIN productos p ON od.producto_id = p.id
             WHERE od.orden_id = ?`,
            [id]
        );

        return res.json({
            success: true,
            data: {
                ...ordenes[0],
                detalles
            }
        });
    } catch (error) {
        console.error('Error en getOrdenById:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al obtener orden'
        });
    }
};

const getOrdenByCodigo = async (req, res) => {
    try {
        const { codigo } = req.params;

        const [ordenes] = await pool.query('SELECT * FROM ordenes WHERE codigo_unico = ?', [codigo]);

        if (ordenes.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Orden no encontrada'
            });
        }

        const [detalles] = await pool.query(
            `SELECT od.*, p.imagen as producto_imagen
             FROM orden_detalle od
             LEFT JOIN productos p ON od.producto_id = p.id
             WHERE od.orden_id = ?`,
            [ordenes[0].id]
        );

        return res.json({
            success: true,
            data: {
                ...ordenes[0],
                detalles
            }
        });
    } catch (error) {
        console.error('Error en getOrdenByCodigo:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al obtener orden'
        });
    }
};

const updateOrdenEstado = async (req, res) => {
    try {
        const { id } = req.params;
        const { estado } = req.body;

        const [ordenes] = await pool.query('SELECT id FROM ordenes WHERE id = ?', [id]);

        if (ordenes.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Orden no encontrada'
            });
        }

        await pool.query('UPDATE ordenes SET estado = ? WHERE id = ?', [estado, id]);

        const [ordenActualizada] = await pool.query('SELECT * FROM ordenes WHERE id = ?', [id]);

        return res.json({
            success: true,
            message: 'Estado de orden actualizado',
            data: ordenActualizada[0]
        });
    } catch (error) {
        console.error('Error en updateOrdenEstado:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al actualizar estado de orden'
        });
    }
};

module.exports = {
    getOrdenes,
    getOrdenById,
    getOrdenByCodigo,
    updateOrdenEstado
};
