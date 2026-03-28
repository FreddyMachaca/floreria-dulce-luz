const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const jwtConfig = require('../config/jwt');
const pool = require('../config/db');

class AuthService {
    generateAccessToken(userId) {
        return jwt.sign(
            { userId },
            jwtConfig.accessSecret,
            { expiresIn: jwtConfig.accessExpiration }
        );
    }

    generateRefreshToken(userId) {
        return jwt.sign(
            { userId },
            jwtConfig.refreshSecret,
            { expiresIn: jwtConfig.refreshExpiration }
        );
    }

    async hashPassword(password) {
        return bcrypt.hash(password, jwtConfig.saltRounds);
    }

    async comparePassword(password, hash) {
        return bcrypt.compare(password, hash);
    }

    verifyAccessToken(token) {
        return jwt.verify(token, jwtConfig.accessSecret);
    }

    verifyRefreshToken(token) {
        return jwt.verify(token, jwtConfig.refreshSecret);
    }

    async saveRefreshToken(userId, token) {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        await pool.query(
            'DELETE FROM refresh_tokens WHERE usuario_id = ?',
            [userId]
        );

        await pool.query(
            'INSERT INTO refresh_tokens (usuario_id, token, expires_at) VALUES (?, ?, ?)',
            [userId, token, expiresAt]
        );
    }

    async validateRefreshToken(userId, token) {
        const [tokens] = await pool.query(
            'SELECT id FROM refresh_tokens WHERE usuario_id = ? AND token = ? AND expires_at > NOW()',
            [userId, token]
        );

        return tokens.length > 0;
    }

    async revokeRefreshToken(userId) {
        await pool.query(
            'DELETE FROM refresh_tokens WHERE usuario_id = ?',
            [userId]
        );
    }

    async cleanExpiredTokens() {
        await pool.query('DELETE FROM refresh_tokens WHERE expires_at < NOW()');
    }

    getCookieOptions() {
        return jwtConfig.cookieOptions;
    }
}

module.exports = new AuthService();
