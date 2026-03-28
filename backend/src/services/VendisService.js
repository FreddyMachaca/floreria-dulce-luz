const axios = require('axios');
const vendisConfig = require('../config/vendis');

class VendisService {
    constructor() {
        this.client = axios.create({
            baseURL: vendisConfig.apiUrl,
            headers: {
                Authorization: `Bearer ${vendisConfig.tokenApi}`,
                'Content-Type': 'application/json'
            },
            timeout: 30000
        });
    }

    calculateExpirationDate() {
        const now = new Date();
        const expiration = new Date(now.getTime() + vendisConfig.qrExpirationMinutes * 60 * 1000);

        const year = expiration.getFullYear();
        const month = String(expiration.getMonth() + 1).padStart(2, '0');
        const day = String(expiration.getDate()).padStart(2, '0');
        const hours = String(expiration.getHours()).padStart(2, '0');
        const minutes = String(expiration.getMinutes()).padStart(2, '0');
        const seconds = String(expiration.getSeconds()).padStart(2, '0');

        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    }

    async generateQr(amount, description) {
        const qrExpiration = this.calculateExpirationDate();

        const response = await this.client.post(vendisConfig.endpoints.generateQr, {
            device_id: parseInt(vendisConfig.deviceId, 10),
            amount: parseFloat(amount),
            modify_amount: false,
            is_multi_use: false,
            qr_expiration: qrExpiration,
            description: `Pago QR ${description}`
        });

        if (!response.data.success) {
            return {
                success: false,
                message: response.data.message || 'Error al generar QR'
            };
        }

        return {
            success: true,
            data: {
                qrImage: response.data.data.qr_image,
                qrUrl: response.data.data.qr_url,
                qrId: response.data.data.qr_id,
                qrExpiration
            }
        };
    }
}

module.exports = new VendisService();
