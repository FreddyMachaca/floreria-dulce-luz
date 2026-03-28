const express = require('express');
const pagoController = require('../controllers/pagoController');

const router = express.Router();

router.post('/generar-qr', pagoController.generateQr);
router.get('/verificar-qr', pagoController.checkQrStatus);
router.post('/callback', pagoController.vendisCallback);

module.exports = router;
