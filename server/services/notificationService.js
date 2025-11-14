// server/services/notificationService.js
import { sendSMS, sendWhatsApp } from './contactWiseService.js';

export const sendServiceNotification = async (client, service) => {
    const {
        fullName,
        phone,
        vehicleMake,
        vehicleModel,
        vehicleYear,
        regNumber
    } = client;

    const {
        date,
        category,
        subService,
        notes,
        partsCost,
        laborCost,
        partsGst,
        laborGst,
        cost,
        status
    } = service;

    const partsGstAmount = (partsCost * partsGst) / 100;
    const laborGstAmount = (laborCost * laborGst) / 100;

    const message = `
Dear ${fullName},

Your service has been scheduled successfully!

CLIENT INFORMATION:
Name: ${fullName}
Phone: ${phone}
Vehicle: ${vehicleMake} ${vehicleModel} (${vehicleYear})
Registration: ${regNumber}

SERVICE DETAILS:
Date: ${new Date(date).toLocaleDateString()}
Category: ${category?.name || 'N/A'}
Sub-Service: ${subService?.name || 'N/A'}
Notes: ${notes || 'N/A'}
Status: ${status}

COST BREAKDOWN:
Parts Cost: ₹${partsCost.toFixed(2)}
Parts GST (${partsGst}%): ₹${partsGstAmount.toFixed(2)}
Labor Cost: ₹${laborCost.toFixed(2)}
Labor GST (${laborGst}%): ₹${laborGstAmount.toFixed(2)}
----------------------------------------
Total Estimated Cost: ₹${cost.toFixed(2)}

Thank you for choosing our service!
  `.trim();

    try {
        if (phone) {
            // Send SMS
            await sendSMS(phone, message);
            console.log(`SMS sent to ${phone}`);

            // Send WhatsApp
            await sendWhatsApp(phone, message);
            console.log(`WhatsApp sent to ${phone}`);
        } else {
            console.log('No phone number available for client, skipping notification');
        }
    } catch (error) {
        console.error('Notification sending failed:', error);
        // Re-throw the error so the caller can handle it
        throw error;
    }
};