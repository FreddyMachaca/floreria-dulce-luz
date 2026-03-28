const express = require('express');
const { body } = require('express-validator');
const carritoController = require('../controllers/carritoController');
const validateRequest = require('../middlewares/validateRequest');

const router = express.Router();

router.get('/', carritoController.getCarrito);

router.post(
    '/items',
    [
        body('producto_id')
            .notEmpty()
            .withMessage('El producto es requerido')
            .isInt()
            .withMessage('ID de producto invalido'),
        body('cantidad')
            .optional()
            .isInt({ min: 1 })
            .withMessage('La cantidad debe ser al menos 1')
    ],
    validateRequest,
    carritoController.addItem
);

router.put(
    '/items/:id',
    [
        body('cantidad')
            .notEmpty()
            .withMessage('La cantidad es requerida')
            .isInt({ min: 0 })
            .withMessage('La cantidad debe ser un numero positivo')
    ],
    validateRequest,
    carritoController.updateItemQuantity
);

router.delete('/items/:id', carritoController.removeItem);
router.delete('/', carritoController.clearCarrito);

router.post(
    '/cliente',
    [
        body('nombre')
            .notEmpty()
            .withMessage('El nombre es requerido')
            .trim()
            .isLength({ max: 100 })
            .withMessage('El nombre no puede exceder 100 caracteres'),
        body('apellido')
            .notEmpty()
            .withMessage('El apellido es requerido')
            .trim()
            .isLength({ max: 100 })
            .withMessage('El apellido no puede exceder 100 caracteres'),
        body('telefono')
            .notEmpty()
            .withMessage('El telefono es requerido')
            .trim()
            .isLength({ min: 7, max: 20 })
            .withMessage('El telefono debe tener entre 7 y 20 caracteres'),
        body('departamento')
            .notEmpty()
            .withMessage('El departamento es requerido')
            .trim()
            .isLength({ max: 50 })
            .withMessage('El departamento no puede exceder 50 caracteres')
    ],
    validateRequest,
    carritoController.setClienteInfo
);

module.exports = router;
