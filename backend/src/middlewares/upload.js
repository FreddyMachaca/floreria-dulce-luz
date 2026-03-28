const fs = require('fs');
const path = require('path');
const multer = require('multer');

const uploadPath = process.env.UPLOAD_PATH || 'uploads';
const maxFileSize = parseInt(process.env.MAX_FILE_SIZE, 10) || 25 * 1024 * 1024;
const destinationPath = path.resolve(__dirname, '../../', uploadPath);

if (!fs.existsSync(destinationPath)) {
    fs.mkdirSync(destinationPath, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, destinationPath);
    },
    filename: (_req, file, cb) => {
        const extension = path.extname(file.originalname || '').toLowerCase();
        const baseName = path.basename(file.originalname || 'imagen', extension).replace(/[^a-zA-Z0-9-_]/g, '-');
        const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, `${baseName}-${unique}${extension}`);
    }
});

const allowedMimeTypes = new Set([
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif'
]);

const upload = multer({
    storage,
    limits: { fileSize: maxFileSize },
    fileFilter: (_req, file, cb) => {
        if (!allowedMimeTypes.has(file.mimetype)) {
            cb(new Error('Formato de imagen no permitido'));
            return;
        }
        cb(null, true);
    }
});

module.exports = upload;
