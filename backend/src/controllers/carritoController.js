const pool = require('../config/db');
const VendisService = require('../services/VendisService');

const getOrCreateCarrito = async (sessionId) => {
    let [carritos] = await pool.query('SELECT * FROM carritos WHERE session_id = ?', [sessionId]);

    if (carritos.length === 0) {
        await pool.query('INSERT INTO carritos (session_id) VALUES (?)', [sessionId]);
        [carritos] = await pool.query('SELECT * FROM carritos WHERE session_id = ?', [sessionId]);
    }

    return carritos[0];
};

const clearQrFromCarrito = async (carritoId) => {
    await pool.query(
        'UPDATE carritos SET qr_id = NULL, qr_url = NULL, qr_image = NULL, qr_expiration = NULL WHERE id = ?',
        [carritoId]
    );
};

const getCarrito = async (req, res) => {
    try {
        const sessionId = req.headers['x-session-id'];

        if (!sessionId) {
            return res.status(400).json({
                success: false,
                message: 'Session ID requerido'
            });
        }

        const carrito = await getOrCreateCarrito(sessionId);

        const [items] = await pool.query(
            `SELECT
                ci.id,
                ci.producto_id,
                ci.cantidad,
                p.nombre,
                p.precio,
                p.imagen,
                p.cantidad as stock_disponible,
                p.es_servicio,
                (ci.cantidad * p.precio) as subtotal
             FROM carrito_items ci
             JOIN productos p ON ci.producto_id = p.id
             WHERE ci.carrito_id = ?`,
            [carrito.id]
        );

        const subtotal = items.reduce((acc, item) => acc + parseFloat(item.subtotal), 0);
        const total = subtotal;

        let qrData = null;

        if (carrito.qr_id && carrito.qr_expiration && !VendisService.isQrExpired(carrito.qr_expiration)) {
            qrData = {
                qrId: carrito.qr_id,
                qrUrl: carrito.qr_url,
                qrImage: carrito.qr_image,
                expiration: carrito.qr_expiration
            };
        }

        return res.json({
            success: true,
            data: {
                id: carrito.id,
                items,
                subtotal: subtotal.toFixed(2),
                total: total.toFixed(2),
                cantidadItems: items.length,
                cliente: {
                    nombre: carrito.cliente_nombre,
                    apellido: carrito.cliente_apellido,
                    telefono: carrito.cliente_telefono,
                    departamento: carrito.cliente_departamento
                },
                qr: qrData
            }
        });
    } catch (error) {
        console.error('Error en getCarrito:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al obtener carrito'
        });
    }
};

const addItem = async (req, res) => {
    try {
        const sessionId = req.headers['x-session-id'];
        const productoId = parseInt(req.body.producto_id, 10);
        const cantidad = parseInt(req.body.cantidad, 10) || 1;

        if (!sessionId) {
            return res.status(400).json({
                success: false,
                message: 'Session ID requerido'
            });
        }

        const [productos] = await pool.query(
            'SELECT * FROM productos WHERE id = ? AND activo = 1 AND estado = "disponible"',
            [productoId]
        );

        if (productos.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Producto no disponible'
            });
        }

        const producto = productos[0];

        if (!producto.es_servicio && producto.cantidad < cantidad) {
            return res.status(400).json({
                success: false,
                message: 'Stock insuficiente'
            });
        }

        const carrito = await getOrCreateCarrito(sessionId);
        await clearQrFromCarrito(carrito.id);

        const [existingItem] = await pool.query(
            'SELECT * FROM carrito_items WHERE carrito_id = ? AND producto_id = ?',
            [carrito.id, productoId]
        );

        if (existingItem.length > 0) {
            const nuevaCantidad = existingItem[0].cantidad + cantidad;

            if (!producto.es_servicio && producto.cantidad < nuevaCantidad) {
                return res.status(400).json({
                    success: false,
                    message: 'Stock insuficiente'
                });
            }

            await pool.query(
                'UPDATE carrito_items SET cantidad = ? WHERE id = ?',
                [nuevaCantidad, existingItem[0].id]
            );
        } else {
            await pool.query(
                'INSERT INTO carrito_items (carrito_id, producto_id, cantidad) VALUES (?, ?, ?)',
                [carrito.id, productoId, cantidad]
            );
        }

        return res.json({
            success: true,
            message: 'Producto agregado al carrito'
        });
    } catch (error) {
        console.error('Error en addItem:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al agregar producto al carrito'
        });
    }
};

const updateItemQuantity = async (req, res) => {
    try {
        const sessionId = req.headers['x-session-id'];
        const { id } = req.params;
        const cantidad = parseInt(req.body.cantidad, 10);

        if (!sessionId) {
            return res.status(400).json({
                success: false,
                message: 'Session ID requerido'
            });
        }

        const carrito = await getOrCreateCarrito(sessionId);

        const [items] = await pool.query(
            `SELECT ci.*, p.cantidad as stock_disponible, p.es_servicio
             FROM carrito_items ci
             JOIN productos p ON ci.producto_id = p.id
             WHERE ci.id = ? AND ci.carrito_id = ?`,
            [id, carrito.id]
        );

        if (items.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Item no encontrado en el carrito'
            });
        }

        if (!items[0].es_servicio && cantidad > items[0].stock_disponible) {
            return res.status(400).json({
                success: false,
                message: 'Stock insuficiente'
            });
        }

        await clearQrFromCarrito(carrito.id);

        if (cantidad <= 0) {
            await pool.query('DELETE FROM carrito_items WHERE id = ?', [id]);
        } else {
            await pool.query('UPDATE carrito_items SET cantidad = ? WHERE id = ?', [cantidad, id]);
        }

        return res.json({
            success: true,
            message: 'Cantidad actualizada'
        });
    } catch (error) {
        console.error('Error en updateItemQuantity:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al actualizar cantidad'
        });
    }
};

const removeItem = async (req, res) => {
    try {
        const sessionId = req.headers['x-session-id'];
        const { id } = req.params;

        if (!sessionId) {
            return res.status(400).json({
                success: false,
                message: 'Session ID requerido'
            });
        }

        const carrito = await getOrCreateCarrito(sessionId);

        const [items] = await pool.query(
            'SELECT id FROM carrito_items WHERE id = ? AND carrito_id = ?',
            [id, carrito.id]
        );

        if (items.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Item no encontrado en el carrito'
            });
        }

        await clearQrFromCarrito(carrito.id);
        await pool.query('DELETE FROM carrito_items WHERE id = ?', [id]);

        return res.json({
            success: true,
            message: 'Producto eliminado del carrito'
        });
    } catch (error) {
        console.error('Error en removeItem:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al eliminar producto del carrito'
        });
    }
};

const clearCarrito = async (req, res) => {
    try {
        const sessionId = req.headers['x-session-id'];

        if (!sessionId) {
            return res.status(400).json({
                success: false,
                message: 'Session ID requerido'
            });
        }

        const carrito = await getOrCreateCarrito(sessionId);

        await pool.query('DELETE FROM carrito_items WHERE carrito_id = ?', [carrito.id]);
        await pool.query(
            `UPDATE carritos SET
             qr_id = NULL,
             qr_url = NULL,
             qr_image = NULL,
             qr_expiration = NULL,
             cliente_nombre = NULL,
             cliente_apellido = NULL,
             cliente_telefono = NULL,
             cliente_departamento = NULL
             WHERE id = ?`,
            [carrito.id]
        );

        return res.json({
            success: true,
            message: 'Carrito vaciado'
        });
    } catch (error) {
        console.error('Error en clearCarrito:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al vaciar carrito'
        });
    }
};

const setClienteInfo = async (req, res) => {
    try {
        const sessionId = req.headers['x-session-id'];
        const { nombre, apellido, telefono, departamento } = req.body;

        if (!sessionId) {
            return res.status(400).json({
                success: false,
                message: 'Session ID requerido'
            });
        }

        const carrito = await getOrCreateCarrito(sessionId);

        const [items] = await pool.query('SELECT id FROM carrito_items WHERE carrito_id = ?', [carrito.id]);

        if (items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'El carrito esta vacio'
            });
        }

        await pool.query(
            `UPDATE carritos
             SET cliente_nombre = ?, cliente_apellido = ?, cliente_telefono = ?, cliente_departamento = ?
             WHERE id = ?`,
            [nombre, apellido, telefono, departamento, carrito.id]
        );

        return res.json({
            success: true,
            message: 'Informacion del cliente guardada'
        });
    } catch (error) {
        console.error('Error en setClienteInfo:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al guardar informacion del cliente'
        });
    }
};

module.exports = {
    getCarrito,
    addItem,
    updateItemQuantity,
    removeItem,
    clearCarrito,
    setClienteInfo
};
