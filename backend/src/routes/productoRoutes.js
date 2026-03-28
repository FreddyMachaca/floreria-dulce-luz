const express = require('express');
const { body } = require('express-validator');
const productoController = require('../controllers/productoController');
const { verifyAccessToken, verifyAdmin } = require('../middlewares/auth');
const validateRequest = require('../middlewares/validateRequest');

const router = express.Router();

router.get('/publicos', productoController.getProductosPublicos);
router.get('/publicos/:id', productoController.getProductoPublicoById);

router.get('/', verifyAccessToken, verifyAdmin, productoController.getProductos);
router.get('/:id', verifyAccessToken, verifyAdmin, productoController.getProductoById);

router.post(
    '/',
    verifyAccessToken,
    verifyAdmin,
    [
        body('nombre')
            .notEmpty()
            .withMessage('El nombre es requerido')
            .trim()
            .isLength({ max: 255 })
            .withMessage('El nombre no puede exceder 255 caracteres'),
        body('precio')
            .notEmpty()
            .withMessage('El precio es requerido')
            .isFloat({ min: 0 })
            .withMessage('El precio debe ser un numero positivo'),
        body('cantidad')
            .optional()
            .isInt({ min: 0 })
            .withMessage('La cantidad debe ser un numero entero positivo'),
        body('estado')
            .optional()
            .isIn(['disponible', 'no_disponible'])
            .withMessage('Estado invalido'),
        body('es_servicio')
            .optional()
            .isBoolean()
            .withMessage('El campo es_servicio debe ser booleano')
    ],
    validateRequest,
    productoController.createProducto
);

router.put(
    '/:id',
    verifyAccessToken,
    verifyAdmin,
    [
        body('nombre')
            .optional()
            .trim()
            .isLength({ min: 1, max: 255 })
            .withMessage('El nombre debe tener entre 1 y 255 caracteres'),
        body('precio')
            .optional()
            .isFloat({ min: 0 })
            .withMessage('El precio debe ser un numero positivo'),
        body('cantidad')
            .optional()
            .isInt({ min: 0 })
            .withMessage('La cantidad debe ser un numero entero positivo'),
        body('estado')
            .optional()
            .isIn(['disponible', 'no_disponible'])
            .withMessage('Estado invalido'),
        body('activo')
            .optional()
            .isBoolean()
            .withMessage('El campo activo debe ser booleano'),
        body('es_servicio')
            .optional()
            .isBoolean()
            .withMessage('El campo es_servicio debe ser booleano')
    ],
    validateRequest,
    productoController.updateProducto
);

router.delete('/:id', verifyAccessToken, verifyAdmin, productoController.deleteProducto);

module.exports = router;
