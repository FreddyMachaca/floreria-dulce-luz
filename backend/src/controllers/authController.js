const pool = require('../config/db');
const AuthService = require('../services/AuthService');

const register = async (req, res) => {
    try {
        const { email, password, nombre, apellido } = req.body;

        const [exists] = await pool.query(
            'SELECT id FROM usuarios WHERE email = ?',
            [email]
        );

        if (exists.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'El email ya esta registrado'
            });
        }

        const hashedPassword = await AuthService.hashPassword(password);

        const [result] = await pool.query(
            'INSERT INTO usuarios (email, password, nombre, apellido, rol, activo) VALUES (?, ?, ?, ?, ?, ?)',
            [email, hashedPassword, nombre, apellido, 'usuario', 1]
        );

        const accessToken = AuthService.generateAccessToken(result.insertId);
        const refreshToken = AuthService.generateRefreshToken(result.insertId);

        await AuthService.saveRefreshToken(result.insertId, refreshToken);
        res.cookie('refreshToken', refreshToken, AuthService.getCookieOptions());

        return res.status(201).json({
            success: true,
            message: 'Registro exitoso',
            data: {
                accessToken,
                usuario: {
                    id: result.insertId,
                    email,
                    nombre,
                    apellido,
                    rol: 'usuario'
                }
            }
        });
    } catch (error) {
        console.error('Error en register:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al registrar usuario'
        });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const [usuarios] = await pool.query(
            'SELECT * FROM usuarios WHERE email = ? AND activo = 1',
            [email]
        );

        if (usuarios.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales invalidas'
            });
        }

        const usuario = usuarios[0];
        const validPassword = await AuthService.comparePassword(password, usuario.password);

        if (!validPassword) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales invalidas'
            });
        }

        const accessToken = AuthService.generateAccessToken(usuario.id);
        const refreshToken = AuthService.generateRefreshToken(usuario.id);

        await AuthService.saveRefreshToken(usuario.id, refreshToken);
        res.cookie('refreshToken', refreshToken, AuthService.getCookieOptions());

        return res.json({
            success: true,
            message: 'Inicio de sesion exitoso',
            data: {
                accessToken,
                usuario: {
                    id: usuario.id,
                    email: usuario.email,
                    nombre: usuario.nombre,
                    apellido: usuario.apellido,
                    rol: usuario.rol
                }
            }
        });
    } catch (error) {
        console.error('Error en login:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al iniciar sesion'
        });
    }
};

const refreshToken = async (req, res) => {
    try {
        const token = req.cookies.refreshToken;

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Token de refresco no proporcionado'
            });
        }

        let decoded;
        try {
            decoded = AuthService.verifyRefreshToken(token);
        } catch (error) {
            return res.status(401).json({
                success: false,
                message: 'Token de refresco invalido'
            });
        }

        const isValid = await AuthService.validateRefreshToken(decoded.userId, token);

        if (!isValid) {
            return res.status(401).json({
                success: false,
                message: 'Token de refresco no valido'
            });
        }

        const [usuarios] = await pool.query(
            'SELECT id, email, nombre, apellido, rol FROM usuarios WHERE id = ? AND activo = 1',
            [decoded.userId]
        );

        if (usuarios.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        const newAccessToken = AuthService.generateAccessToken(decoded.userId);
        const newRefreshToken = AuthService.generateRefreshToken(decoded.userId);

        await AuthService.saveRefreshToken(decoded.userId, newRefreshToken);
        res.cookie('refreshToken', newRefreshToken, AuthService.getCookieOptions());

        return res.json({
            success: true,
            data: {
                accessToken: newAccessToken,
                usuario: usuarios[0]
            }
        });
    } catch (error) {
        console.error('Error en refreshToken:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al refrescar token'
        });
    }
};

const logout = async (req, res) => {
    try {
        await AuthService.revokeRefreshToken(req.user.id);

        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
        });

        return res.json({
            success: true,
            message: 'Sesion cerrada exitosamente'
        });
    } catch (error) {
        console.error('Error en logout:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al cerrar sesion'
        });
    }
};

const getProfile = async (req, res) => {
    return res.json({
        success: true,
        data: {
            usuario: req.user
        }
    });
};

module.exports = {
    register,
    login,
    refreshToken,
    logout,
    getProfile
};
