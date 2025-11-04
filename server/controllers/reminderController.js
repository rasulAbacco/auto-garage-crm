// server/controllers/reminderController.js

import prisma from "../models/prismaClient.js";

/**
 * @desc Get all reminders (optionally filter by clientId or status)
 * @route GET /api/reminders
 * @access Private
 */
export const getReminders = async (req, res) => {
    try {
        const { clientId, status } = req.query;

        const reminders = await prisma.reminder.findMany({
            where: {
                ...(clientId ? { clientId: Number(clientId) } : {}),
                ...(status ? { status } : {}),
            },
            include: {
                client: true,
                service: true,
                invoice: true,
            },
            orderBy: { createdAt: "desc" },
        });

        res.json({ success: true, data: reminders });
    } catch (error) {
        console.error("❌ Error fetching reminders:", error);
        res.status(500).json({ success: false, message: "Error fetching reminders" });
    }
};

/**
 * @desc Get single reminder by ID
 * @route GET /api/reminders/:id
 * @access Private
 */
export const getReminderById = async (req, res) => {
    try {
        const { id } = req.params;

        const reminder = await prisma.reminder.findUnique({
            where: { id: Number(id) },
            include: {
                client: true,
                service: true,
                invoice: true,
            },
        });

        if (!reminder) {
            return res.status(404).json({ success: false, message: "Reminder not found" });
        }

        res.json({ success: true, data: reminder });
    } catch (error) {
        console.error("❌ Error fetching reminder:", error);
        res.status(500).json({ success: false, message: "Error fetching reminder" });
    }
};


// server/controllers/reminderController.js

export const createReminder = async (req, res) => {
    try {
        console.log("📩 Received body:", req.body);

        const {
            clientId,
            serviceId,
            invoiceId,
            nextService,
            insuranceRenewal,
            warrantyExpiry,
            notify,
            status,
            notes,
        } = req.body;

        if (!clientId || !nextService) {
            return res.status(400).json({ message: "Missing required fields (clientId or nextService)" });
        }

        const parsedClientId = parseInt(clientId);
        if (isNaN(parsedClientId)) {
            return res.status(400).json({ message: "Invalid clientId" });
        }

        const reminder = await prisma.reminder.create({
            data: {
                clientId: parsedClientId,
                serviceId: serviceId ? parseInt(serviceId) : null,
                invoiceId: invoiceId ? parseInt(invoiceId) : null,
                nextService: new Date(nextService),
                insuranceRenewal: insuranceRenewal ? new Date(insuranceRenewal) : null,
                warrantyExpiry: warrantyExpiry ? new Date(warrantyExpiry) : null,
                notify: notify || "SMS",
                status: status || "Pending",
                notes: notes || null,
            },
            include: {
                client: true,
                service: true,
                invoice: true,
            },
        });

        console.log("✅ Reminder created:", reminder.id);

        return res.status(201).json(reminder);
    } catch (error) {
        console.error("❌ Error creating reminder:", error);
        return res.status(500).json({
            message: "Error creating reminder",
            error: error.message,
        });
    }
};



/**
 * @desc Update reminder
 * @route PUT /api/reminders/:id
 * @access Private
 */
export const updateReminder = async (req, res) => {
    try {
        const { id } = req.params;

        const reminderExists = await prisma.reminder.findUnique({
            where: { id: Number(id) },
        });

        if (!reminderExists) {
            return res.status(404).json({ success: false, message: "Reminder not found" });
        }

        const updatedReminder = await prisma.reminder.update({
            where: { id: Number(id) },
            data: {
                ...req.body,
                clientId: req.body.clientId ? Number(req.body.clientId) : undefined,
                serviceId: req.body.serviceId ? Number(req.body.serviceId) : undefined,
                invoiceId: req.body.invoiceId ? Number(req.body.invoiceId) : undefined,
                nextService: req.body.nextService ? new Date(req.body.nextService) : undefined,
                insuranceRenewal: req.body.insuranceRenewal
                    ? new Date(req.body.insuranceRenewal)
                    : undefined,
                warrantyExpiry: req.body.warrantyExpiry
                    ? new Date(req.body.warrantyExpiry)
                    : undefined,
            },
            include: { client: true, service: true, invoice: true },
        });

        res.json({
            success: true,
            message: "Reminder updated successfully",
            data: updatedReminder,
        });
    } catch (error) {
        console.error("❌ Error updating reminder:", error);
        res.status(500).json({ success: false, message: "Error updating reminder" });
    }
};

/**
 * @desc Delete reminder
 * @route DELETE /api/reminders/:id
 * @access Private
 */
export const deleteReminder = async (req, res) => {
    try {
        const { id } = req.params;

        const reminder = await prisma.reminder.findUnique({
            where: { id: Number(id) },
        });

        if (!reminder) {
            return res.status(404).json({ success: false, message: "Reminder not found" });
        }

        await prisma.reminder.delete({ where: { id: Number(id) } });

        res.json({ success: true, message: "Reminder deleted successfully" });
    } catch (error) {
        console.error("❌ Error deleting reminder:", error);
        res.status(500).json({ success: false, message: "Error deleting reminder" });
    }
};
