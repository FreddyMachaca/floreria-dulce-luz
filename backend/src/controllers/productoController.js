const fs = require('fs');
const path = require('path');
const pool = require('../config/db');

const uploadPath = process.env.UPLOAD_PATH || 'uploads';
const uploadAbsolutePath = path.resolve(__dirname, '../../', uploadPath);

const parseBoolean = (value, defaultValue = false) => {
    if (value === undefined || value === null || value === '') return defaultValue;
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value === 1;
    if (typeof value === 'string') {
        const normalized = value.toLowerCase().trim();
        if (normalized === 'true' || normalized === '1') return true;
        if (normalized === 'false' || normalized === '0') return false;
    }
    return defaultValue;
};

const removeLocalImage = (imagePath) => {
    if (!imagePath || typeof imagePath !== 'string') return;
    const normalized = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
    const localFile = path.resolve(__dirname, '../../', normalized);
    if (!localFile.startsWith(uploadAbsolutePath)) return;
    if (fs.existsSync(localFile)) {
        fs.unlinkSync(localFile);
    }
};

const getProductos = async (req, res) => {
    try {
        const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
        const limit = Math.max(parseInt(req.query.limit, 10) || 12, 1);
        const offset = (page - 1) * limit;
        const { search = '', estado } = req.query;

        const whereParts = ['1=1'];
        const params = [];

        if (search) {
            whereParts.push('(nombre LIKE ? OR descripcion LIKE ?)');
            params.push(`%${search}%`, `%${search}%`);
        }

        if (estado) {
            whereParts.push('estado = ?');
            params.push(estado);
        }

        if (req.query.activo !== undefined) {
            whereParts.push('activo = ?');
            params.push(parseBoolean(req.query.activo, true) ? 1 : 0);
        }

        const whereClause = whereParts.join(' AND ');

        const [countResult] = await pool.query(
            `SELECT COUNT(*) as total FROM productos WHERE ${whereClause}`,
            params
        );

        const [productos] = await pool.query(
            `SELECT id, nombre, descripcion, precio, cantidad, imagen, estado, activo, created_at, updated_at
             FROM productos
             WHERE ${whereClause}
             ORDER BY created_at DESC
             LIMIT ? OFFSET ?`,
            [...params, limit, offset]
        );

        return res.json({
            success: true,
            data: {
                productos,
                pagination: {
                    page,
                    limit,
                    total: countResult[0].total,
                    totalPages: Math.ceil(countResult[0].total / limit)
                }
            }
        });
    } catch (error) {
        console.error('Error en getProductos:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al obtener productos'
        });
    }
};

const getProductosPublicos = async (req, res) => {
    try {
        const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
        const limit = Math.max(parseInt(req.query.limit, 10) || 12, 1);
        const offset = (page - 1) * limit;
        const { search = '' } = req.query;

        const whereParts = ['activo = 1', 'estado = "disponible"'];
        const params = [];

        if (search) {
            whereParts.push('(nombre LIKE ? OR descripcion LIKE ?)');
            params.push(`%${search}%`, `%${search}%`);
        }

        const whereClause = whereParts.join(' AND ');

        const [countResult] = await pool.query(
            `SELECT COUNT(*) as total FROM productos WHERE ${whereClause}`,
            params
        );

        const [productos] = await pool.query(
            `SELECT id, nombre, descripcion, precio, cantidad, imagen, estado
             FROM productos
             WHERE ${whereClause}
             ORDER BY created_at DESC
             LIMIT ? OFFSET ?`,
            [...params, limit, offset]
        );

        return res.json({
            success: true,
            data: {
                productos,
                pagination: {
                    page,
                    limit,
                    total: countResult[0].total,
                    totalPages: Math.ceil(countResult[0].total / limit)
                }
            }
        });
    } catch (error) {
        console.error('Error en getProductosPublicos:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al obtener productos'
        });
    }
};

const getProductoById = async (req, res) => {
    try {
        const { id } = req.params;

        const [productos] = await pool.query(
            'SELECT id, nombre, descripcion, precio, cantidad, imagen, estado, activo, created_at, updated_at FROM productos WHERE id = ?',
            [id]
        );

        if (productos.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Producto no encontrado'
            });
        }

        return res.json({
            success: true,
            data: productos[0]
        });
    } catch (error) {
        console.error('Error en getProductoById:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al obtener producto'
        });
    }
};

const getProductoPublicoById = async (req, res) => {
    try {
        const { id } = req.params;

        const [productos] = await pool.query(
            `SELECT id, nombre, descripcion, precio, cantidad, imagen, estado
             FROM productos
             WHERE id = ? AND activo = 1 AND estado = 'disponible'`,
            [id]
        );

        if (productos.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Producto no encontrado'
            });
        }

        return res.json({
            success: true,
            data: productos[0]
        });
    } catch (error) {
        console.error('Error en getProductoPublicoById:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al obtener producto'
        });
    }
};

const createProducto = async (req, res) => {
    try {
        const { nombre, descripcion, precio, cantidad, estado, activo } = req.body;
        const activoValue = parseBoolean(activo, true) ? 1 : 0;
        const cantidadValue = parseInt(cantidad, 10) || 0;
        const imagePath = req.file ? `/${uploadPath}/${req.file.filename}` : null;

        const [result] = await pool.query(
            `INSERT INTO productos (nombre, descripcion, precio, cantidad, imagen, estado, activo)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                nombre,
                descripcion || null,
                parseFloat(precio),
                cantidadValue,
                imagePath,
                estado || 'disponible',
                activoValue
            ]
        );

        const [nuevoProducto] = await pool.query(
            'SELECT id, nombre, descripcion, precio, cantidad, imagen, estado, activo, created_at, updated_at FROM productos WHERE id = ?',
            [result.insertId]
        );

        return res.status(201).json({
            success: true,
            message: 'Producto creado exitosamente',
            data: nuevoProducto[0]
        });
    } catch (error) {
        console.error('Error en createProducto:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al crear producto'
        });
    }
};

const updateProducto = async (req, res) => {
    try {
        const { id } = req.params;

        const [productos] = await pool.query(
            'SELECT id, nombre, descripcion, precio, cantidad, imagen, estado, activo FROM productos WHERE id = ?',
            [id]
        );

        if (productos.length === 0) {
            if (req.file) {
                removeLocalImage(`/${uploadPath}/${req.file.filename}`);
            }
            return res.status(404).json({
                success: false,
                message: 'Producto no encontrado'
            });
        }

        const actual = productos[0];
        let imagePath = actual.imagen;

        if (req.file) {
            removeLocalImage(actual.imagen);
            imagePath = `/${uploadPath}/${req.file.filename}`;
        }

        if (parseBoolean(req.body.remove_imagen, false)) {
            removeLocalImage(actual.imagen);
            imagePath = null;
        }

        await pool.query(
            `UPDATE productos
             SET nombre = ?, descripcion = ?, precio = ?, cantidad = ?, imagen = ?, estado = ?, activo = ?
             WHERE id = ?`,
            [
                req.body.nombre ?? actual.nombre,
                req.body.descripcion ?? actual.descripcion,
                req.body.precio !== undefined ? parseFloat(req.body.precio) : actual.precio,
                req.body.cantidad !== undefined ? (parseInt(req.body.cantidad, 10) || 0) : actual.cantidad,
                imagePath,
                req.body.estado ?? actual.estado,
                req.body.activo !== undefined ? (parseBoolean(req.body.activo, true) ? 1 : 0) : actual.activo,
                id
            ]
        );

        const [productoActualizado] = await pool.query(
            'SELECT id, nombre, descripcion, precio, cantidad, imagen, estado, activo, created_at, updated_at FROM productos WHERE id = ?',
            [id]
        );

        return res.json({
            success: true,
            message: 'Producto actualizado exitosamente',
            data: productoActualizado[0]
        });
    } catch (error) {
        console.error('Error en updateProducto:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al actualizar producto'
        });
    }
};

const deleteProducto = async (req, res) => {
    try {
        const { id } = req.params;

        const [productos] = await pool.query(
            'SELECT id, imagen FROM productos WHERE id = ?',
            [id]
        );

        if (productos.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Producto no encontrado'
            });
        }

        removeLocalImage(productos[0].imagen);
        await pool.query('DELETE FROM productos WHERE id = ?', [id]);

        return res.json({
            success: true,
            message: 'Producto eliminado exitosamente'
        });
    } catch (error) {
        console.error('Error en deleteProducto:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al eliminar producto'
        });
    }
};

module.exports = {
    getProductos,
    getProductosPublicos,
    getProductoById,
    getProductoPublicoById,
    createProducto,
    updateProducto,
    deleteProducto
};
