const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');
const pool = require('../config/db');

const verifyAccessToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Token de acceso no proporcionado'
            });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, jwtConfig.accessSecret);

        const [usuarios] = await pool.query(
            'SELECT id, email, nombre, apellido, rol, activo FROM usuarios WHERE id = ? AND activo = 1',
            [decoded.userId]
        );

        if (usuarios.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Usuario no encontrado o inactivo'
            });
        }

        req.user = usuarios[0];
        return next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expirado',
                code: 'TOKEN_EXPIRED'
            });
        }

        return res.status(401).json({
            success: false,
            message: 'Token invalido'
        });
    }
};

const verifyAdmin = (req, res, next) => {
    if (req.user && req.user.rol === 'admin') {
        return next();
    }

    return res.status(403).json({
        success: false,
        message: 'Acceso denegado. Se requiere rol de administrador'
    });
};

module.exports = {
    verifyAccessToken,
    verifyAdmin
};
