const errorHandler = (err, req, res, next) => {
    if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({
            success: false,
            message: 'El registro ya existe'
        });
    }

    const statusCode = err.statusCode || 500;
    const message = err.message || 'Error interno del servidor';

    return res.status(statusCode).json({
        success: false,
        message: process.env.NODE_ENV === 'production' ? 'Error interno del servidor' : message
    });
};

module.exports = errorHandler;
