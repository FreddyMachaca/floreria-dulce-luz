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
        try {
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
                    expiration: qrExpiration,
                    expirationMinutes: vendisConfig.qrExpirationMinutes
                }
            };
        } catch (error) {
            console.error('Error en VendisService.generateQr:', error.message);
            return {
                success: false,
                message: 'Error de conexion con el servicio de pagos'
            };
        }
    }

    async getQrStatus(qrId) {
        try {
            const response = await this.client.get(`${vendisConfig.endpoints.getQrStatus}/${qrId}`);

            if (!response.data.success) {
                return {
                    success: false,
                    message: response.data.message || 'QR no encontrado'
                };
            }

            return {
                success: true,
                data: {
                    status: response.data.data.status,
                    payments: response.data.data.payments || []
                }
            };
        } catch (error) {
            console.error('Error en VendisService.getQrStatus:', error.message);
            return {
                success: false,
                message: 'Error al verificar el estado del QR'
            };
        }
    }

    isQrExpired(expirationDate) {
        if (!expirationDate) return true;
        const now = new Date();
        const expiration = new Date(expirationDate);
        return now >= expiration;
    }

    getExpirationMinutes() {
        return vendisConfig.qrExpirationMinutes;
    }
}

module.exports = new VendisService();
