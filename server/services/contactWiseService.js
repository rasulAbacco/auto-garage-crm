// server/services/contactWiseService.js
import axios from 'axios';

const CONTACTWISE_BASE_URL = 'https://api.contactwise.io/v1';

export const sendSMS = async (to, message) => {
    // Check if credentials are available
    if (!process.env.CONTACTWISE_API_KEY || !process.env.CONTACTWISE_SENDER_ID) {
        console.error('ContactWise API credentials not set');
        return;
    }

    try {
        const response = await axios.post(`${CONTACTWISE_BASE_URL}/sms/send`, {
            api_key: process.env.CONTACTWISE_API_KEY,
            to,
            message,
            sender_id: process.env.CONTACTWISE_SENDER_ID
        });
        return response.data;
    } catch (error) {
        console.error('SMS sending failed:', error.response?.data || error.message);
        throw error;
    }
};

export const sendWhatsApp = async (to, message) => {
    // Check if credentials are available
    if (!process.env.CONTACTWISE_API_KEY || !process.env.CONTACTWISE_WHATSAPP_NUMBER) {
        console.error('ContactWise WhatsApp credentials not set');
        return;
    }

    try {
        const response = await axios.post(`${CONTACTWISE_BASE_URL}/whatsapp/send`, {
            api_key: process.env.CONTACTWISE_API_KEY,
            to,
            message,
            from: process.env.CONTACTWISE_WHATSAPP_NUMBER
        });
        return response.data;
    } catch (error) {
        console.error('WhatsApp sending failed:', error.response?.data || error.message);
        throw error;
    }
};