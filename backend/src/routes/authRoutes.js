const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { verifyAccessToken } = require('../middlewares/auth');
const { authLimiter } = require('../middlewares/rateLimiter');
const validateRequest = require('../middlewares/validateRequest');

const router = express.Router();

router.post(
    '/register',
    authLimiter,
    [
        body('nombre').trim().notEmpty().withMessage('El nombre es requerido'),
        body('apellido').trim().notEmpty().withMessage('El apellido es requerido'),
        body('email').isEmail().withMessage('Email invalido').normalizeEmail(),
        body('password')
            .isLength({ min: 6 })
            .withMessage('La contrasena debe tener al menos 6 caracteres')
    ],
    validateRequest,
    authController.register
);

router.post(
    '/login',
    authLimiter,
    [
        body('email').isEmail().withMessage('Email invalido').normalizeEmail(),
        body('password').notEmpty().withMessage('La contrasena es requerida')
    ],
    validateRequest,
    authController.login
);

router.post('/refresh-token', authController.refreshToken);
router.post('/logout', verifyAccessToken, authController.logout);
router.get('/profile', verifyAccessToken, authController.getProfile);

module.exports = router;
