const express = require('express');
const authRoutes = require('./authRoutes');
const productoRoutes = require('./productoRoutes');
const carritoRoutes = require('./carritoRoutes');
const pagoRoutes = require('./pagoRoutes');
const ordenRoutes = require('./ordenRoutes');
const dashboardRoutes = require('./dashboardRoutes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/productos', productoRoutes);
router.use('/carrito', carritoRoutes);
router.use('/pagos', pagoRoutes);
router.use('/ordenes', ordenRoutes);
router.use('/dashboard', dashboardRoutes);

router.get('/health', (req, res) => {
    return res.json({
        success: true,
        message: 'API funcionando correctamente',
        timestamp: new Date().toISOString()
    });
});

module.exports = router;
