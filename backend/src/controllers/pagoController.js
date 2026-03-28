const pool = require('../config/db');
const VendisService = require('../services/VendisService');

const generateCodigoUnico = () => {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).slice(2, 6).toUpperCase();
    return `ORD-${timestamp}-${random}`;
};

const resetQr = async (carritoId) => {
    await pool.query(
        'UPDATE carritos SET qr_id = NULL, qr_url = NULL, qr_image = NULL, qr_expiration = NULL WHERE id = ?',
        [carritoId]
    );
};

const procesarPago = async (carrito, payment) => {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const [items] = await connection.query(
            `SELECT ci.producto_id, ci.cantidad, p.nombre, p.precio, p.cantidad as stock_disponible, p.es_servicio
             FROM carrito_items ci
             JOIN productos p ON p.id = ci.producto_id
             WHERE ci.carrito_id = ?
             FOR UPDATE`,
            [carrito.id]
        );

        if (items.length === 0) {
            throw new Error('El carrito esta vacio');
        }

        for (const item of items) {
            if (!item.es_servicio && item.stock_disponible < item.cantidad) {
                throw new Error(`Stock insuficiente para ${item.nombre}`);
            }
        }

        const subtotal = items.reduce((acc, item) => acc + (item.cantidad * parseFloat(item.precio)), 0);
        const total = subtotal;
        const codigoUnico = generateCodigoUnico();

        const [ordenResult] = await connection.query(
            `INSERT INTO ordenes (
                usuario_id,
                codigo_unico,
                cliente_nombre,
                cliente_apellido,
                cliente_telefono,
                cliente_departamento,
                subtotal,
                total,
                estado,
                qr_id,
                qr_url,
                qr_expiration,
                fecha_pago,
                pago_nombre,
                pago_banco,
                pago_monto
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                null,
                codigoUnico,
                carrito.cliente_nombre,
                carrito.cliente_apellido,
                carrito.cliente_telefono,
                carrito.cliente_departamento,
                subtotal,
                total,
                'pagado',
                carrito.qr_id,
                carrito.qr_url,
                carrito.qr_expiration,
                payment.payment_date || new Date(),
                payment.payment_name || null,
                payment.payment_bank || null,
                payment.payment_amount || total
            ]
        );

        const ordenId = ordenResult.insertId;

        for (const item of items) {
            const itemSubtotal = item.cantidad * parseFloat(item.precio);

            await connection.query(
                `INSERT INTO orden_detalle (orden_id, producto_id, producto_nombre, producto_precio, cantidad, subtotal)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [ordenId, item.producto_id, item.nombre, item.precio, item.cantidad, itemSubtotal]
            );

            if (!item.es_servicio) {
                await connection.query(
                    'UPDATE productos SET cantidad = cantidad - ? WHERE id = ?',
                    [item.cantidad, item.producto_id]
                );
            }
        }

        await connection.query('DELETE FROM carrito_items WHERE carrito_id = ?', [carrito.id]);

        await connection.query(
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

        await connection.commit();

        return {
            success: true,
            orden: {
                id: ordenId,
                codigoUnico,
                total: total.toFixed(2)
            }
        };
    } catch (error) {
        await connection.rollback();
        console.error('Error en procesarPago:', error);
        return {
            success: false,
            message: error.message
        };
    } finally {
        connection.release();
    }
};

const generateQr = async (req, res) => {
    try {
        const sessionId = req.headers['x-session-id'];
        const { forceNew = false } = req.body;

        if (!sessionId) {
            return res.status(400).json({
                success: false,
                message: 'Session ID requerido'
            });
        }

        const [carritos] = await pool.query('SELECT * FROM carritos WHERE session_id = ?', [sessionId]);

        if (carritos.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Carrito no encontrado'
            });
        }

        const carrito = carritos[0];

        if (!carrito.cliente_nombre || !carrito.cliente_apellido || !carrito.cliente_telefono || !carrito.cliente_departamento) {
            return res.status(400).json({
                success: false,
                message: 'Datos del cliente incompletos'
            });
        }

        const [items] = await pool.query(
            `SELECT ci.cantidad, p.nombre, p.precio, p.cantidad as stock_disponible, p.es_servicio
             FROM carrito_items ci
             JOIN productos p ON p.id = ci.producto_id
             WHERE ci.carrito_id = ?`,
            [carrito.id]
        );

        if (items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'El carrito esta vacio'
            });
        }

        for (const item of items) {
            if (!item.es_servicio && item.stock_disponible < item.cantidad) {
                return res.status(400).json({
                    success: false,
                    message: `Stock insuficiente para ${item.nombre}`
                });
            }
        }

        const total = items.reduce((acc, item) => acc + (item.cantidad * parseFloat(item.precio)), 0);

        if (!forceNew && carrito.qr_id && carrito.qr_expiration && !VendisService.isQrExpired(carrito.qr_expiration)) {
            const statusResult = await VendisService.getQrStatus(carrito.qr_id);

            if (statusResult.success && statusResult.data.status === 'Pendiente') {
                return res.json({
                    success: true,
                    message: 'QR existente valido',
                    data: {
                        qrId: carrito.qr_id,
                        qrUrl: carrito.qr_url,
                        qrImage: carrito.qr_image,
                        expiration: carrito.qr_expiration,
                        expirationMinutes: VendisService.getExpirationMinutes(),
                        total: total.toFixed(2)
                    }
                });
            }
        }

        const descripcion = `Orden ${carrito.cliente_nombre} ${carrito.cliente_apellido}`;
        const qrResult = await VendisService.generateQr(total, descripcion);

        if (!qrResult.success) {
            return res.status(500).json({
                success: false,
                message: qrResult.message
            });
        }

        await pool.query(
            `UPDATE carritos
             SET qr_id = ?, qr_url = ?, qr_image = ?, qr_expiration = ?
             WHERE id = ?`,
            [qrResult.data.qrId, qrResult.data.qrUrl, qrResult.data.qrImage, qrResult.data.expiration, carrito.id]
        );

        return res.json({
            success: true,
            message: 'QR generado exitosamente',
            data: {
                qrId: qrResult.data.qrId,
                qrUrl: qrResult.data.qrUrl,
                qrImage: qrResult.data.qrImage,
                expiration: qrResult.data.expiration,
                expirationMinutes: qrResult.data.expirationMinutes,
                total: total.toFixed(2)
            }
        });
    } catch (error) {
        console.error('Error en generateQr:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al generar QR'
        });
    }
};

const checkQrStatus = async (req, res) => {
    try {
        const sessionId = req.headers['x-session-id'];

        if (!sessionId) {
            return res.status(400).json({
                success: false,
                message: 'Session ID requerido'
            });
        }

        const [carritos] = await pool.query('SELECT * FROM carritos WHERE session_id = ?', [sessionId]);

        if (carritos.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Carrito no encontrado'
            });
        }

        const carrito = carritos[0];

        if (!carrito.qr_id) {
            return res.status(400).json({
                success: false,
                message: 'No hay QR generado para este carrito'
            });
        }

        if (VendisService.isQrExpired(carrito.qr_expiration)) {
            await resetQr(carrito.id);
            return res.json({
                success: true,
                data: {
                    status: 'Expirado',
                    needsRegeneration: true,
                    message: 'El QR ha expirado. Debe generar uno nuevo.'
                }
            });
        }

        const statusResult = await VendisService.getQrStatus(carrito.qr_id);

        if (!statusResult.success) {
            return res.status(500).json({
                success: false,
                message: statusResult.message
            });
        }

        if (statusResult.data.status === 'Pagado') {
            const payment = statusResult.data.payments[0] || {};
            const ordenResult = await procesarPago(carrito, payment);

            if (ordenResult.success) {
                return res.json({
                    success: true,
                    data: {
                        status: 'Pagado',
                        orden: ordenResult.orden
                    }
                });
            }

            return res.status(500).json({
                success: false,
                message: ordenResult.message || 'No se pudo registrar el pago'
            });
        }

        if (statusResult.data.status === 'Anulado' || statusResult.data.status === 'Fallido') {
            await resetQr(carrito.id);
            return res.json({
                success: true,
                data: {
                    status: statusResult.data.status,
                    needsRegeneration: true,
                    message: `El QR fue ${statusResult.data.status.toLowerCase()}. Debe generar uno nuevo.`
                }
            });
        }

        return res.json({
            success: true,
            data: {
                status: statusResult.data.status,
                needsRegeneration: false
            }
        });
    } catch (error) {
        console.error('Error en checkQrStatus:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al verificar estado del QR'
        });
    }
};

const vendisCallback = async (req, res) => {
    try {
        const { payment_date, payment_amount, qr_id, payment_name, payment_bank } = req.body;

        const [carritos] = await pool.query('SELECT * FROM carritos WHERE qr_id = ?', [qr_id]);

        if (carritos.length === 0) {
            return res.json({
                success: false,
                message: 'Carrito no encontrado'
            });
        }

        const payment = {
            payment_date,
            payment_amount,
            payment_name,
            payment_bank
        };

        const result = await procesarPago(carritos[0], payment);

        return res.json({
            success: result.success,
            message: result.success ? 'Ok' : (result.message || 'Error al procesar pago')
        });
    } catch (error) {
        console.error('Error en vendisCallback:', error);
        return res.json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    generateQr,
    checkQrStatus,
    vendisCallback
};
