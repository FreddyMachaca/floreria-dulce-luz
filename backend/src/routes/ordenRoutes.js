const express = require('express');
const { body } = require('express-validator');
const ordenController = require('../controllers/ordenController');
const { verifyAccessToken, verifyAdmin } = require('../middlewares/auth');
const validateRequest = require('../middlewares/validateRequest');

const router = express.Router();

router.get('/codigo/:codigo', ordenController.getOrdenByCodigo);

router.get('/', verifyAccessToken, verifyAdmin, ordenController.getOrdenes);
router.get('/:id', verifyAccessToken, verifyAdmin, ordenController.getOrdenById);

router.put(
    '/:id/estado',
    verifyAccessToken,
    verifyAdmin,
    [
        body('estado')
            .notEmpty()
            .withMessage('El estado es requerido')
            .isIn(['pendiente', 'pagado', 'cancelado'])
            .withMessage('Estado invalido')
    ],
    validateRequest,
    ordenController.updateOrdenEstado
);

module.exports = router;
