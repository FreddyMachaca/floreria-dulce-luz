const errorHandler = (err, req, res, next) => {
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
            success: false,
            message: 'El archivo excede el tamano maximo permitido'
        });
    }

    if (err.message === 'Formato de imagen no permitido') {
        return res.status(400).json({
            success: false,
            message: 'Solo se permiten imagenes JPG, PNG, WEBP o GIF'
        });
    }

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
