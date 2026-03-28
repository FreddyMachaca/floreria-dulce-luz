require('dotenv').config();

module.exports = {
    deviceId: process.env.VENDIS_DEVICE_ID,
    tokenApi: process.env.VENDIS_TOKEN_API,
    apiUrl: process.env.VENDIS_API_URL,
    qrExpirationMinutes: parseInt(process.env.VENDIS_QR_EXPIRATION_MINUTES, 10) || 15,
    endpoints: {
        generateQr: '/devices/simple-qr/generate',
        getQrStatus: '/devices/simple-qr/get'
    }
};
