const express = require('express');
const dashboardController = require('../controllers/dashboardController');
const { verifyAccessToken, verifyAdmin } = require('../middlewares/auth');

const router = express.Router();

router.get('/', verifyAccessToken, verifyAdmin, dashboardController.getDashboard);
router.get('/stats', verifyAccessToken, verifyAdmin, dashboardController.getStats);
router.get('/recent-orders', verifyAccessToken, verifyAdmin, dashboardController.getRecentOrders);
router.get('/chart-data', verifyAccessToken, verifyAdmin, dashboardController.getChartData);
router.get('/reporte-ventas', verifyAccessToken, verifyAdmin, dashboardController.getReporteVentas);

module.exports = router;
