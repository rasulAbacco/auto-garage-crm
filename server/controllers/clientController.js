// server/controllers/clientController.js
import prisma from "../models/prismaClient.js";

/**
 * @desc Get all clients
 * @route GET /api/clients
 * @access Private
 */
export const getClients = async (req, res) => {
    try {
        const clients = await prisma.client.findMany({
            where: { userId: req.user?.id },
            include: { services: true },
            orderBy: { createdAt: "desc" },
        });
        res.json(clients);
    } catch (error) {
        console.error("Error fetching clients:", error);
        res.status(500).json({ message: "Error fetching clients" });
    }
};

/**
 * @desc Get single client by ID
 * @route GET /api/clients/:id
 * @access Private
 */
export const getClientById = async (req, res) => {
    try {
        const { id } = req.params;
        const client = await prisma.client.findUnique({
            where: { id: parseInt(id) },
            include: { services: true },
        });

        if (!client) return res.status(404).json({ message: "Client not found" });

        res.json(client);
    } catch (error) {
        console.error("Error fetching client:", error);
        res.status(500).json({ message: "Error fetching client" });
    }
};

/**
 * @desc Create a new client
 * @route POST /api/clients
 * @access Private
 */
export const createClient = async (req, res) => {
    try {
        const {
            fullName,
            phone,
            email,
            address,
            vehicleMake,
            vehicleModel,
            vehicleYear,
            regNumber,
            vin,
            carImage,
            adImage,
            staffPerson,
        } = req.body;

        if (!fullName || !phone || !vehicleMake || !vehicleModel || !vehicleYear || !regNumber) {
            return res.status(400).json({ message: "Missing required client fields" });
        }

        const client = await prisma.client.create({
            data: {
                fullName,
                phone,
                email,
                address,
                vehicleMake,
                vehicleModel,
                vehicleYear: parseInt(vehicleYear),
                regNumber,
                vin,
                carImage,
                adImage,
                staffPerson,
                userId: req.user?.id || null,
            },
        });

        res.status(201).json({
            message: "Client created successfully",
            client,
        });
    } catch (error) {
        console.error("Error creating client:", error);
        res.status(500).json({ message: "Error creating client" });
    }
};

/**
 * @desc Update a client
 * @route PUT /api/clients/:id
 * @access Private
 */
export const updateClient = async (req, res) => {
    try {
        const { id } = req.params;
        const parsedId = parseInt(id);

        if (isNaN(parsedId)) {
            return res.status(400).json({ message: "Invalid client ID" });
        }

        // Find existing client
        const client = await prisma.client.findUnique({ where: { id: parsedId } });
        if (!client) {
            return res.status(404).json({ message: "Client not found" });
        }

        // Destructure and remove unwanted fields
        const {
            id: _,
            userId,
            createdAt,
            updatedAt,
            services,
            invoices,
            ...safeData
        } = req.body;

        const updatedClient = await prisma.client.update({
            where: { id: parsedId },
            data: safeData,
        });

        res.status(200).json({
            message: "Client updated successfully",
            client: updatedClient,
        });
    } catch (error) {
        console.error("Error updating client:", error);
        res.status(500).json({ message: "Error updating client" });
    }
};


/**
 * @desc Delete a client
 * @route DELETE /api/clients/:id
 * @access Private
 */
export const deleteClient = async (req, res) => {
    try {
        const { id } = req.params;
        const parsedId = parseInt(id);

        if (isNaN(parsedId)) {
            return res.status(400).json({ message: "Invalid client ID" });
        }

        // Check if the client exists
        const client = await prisma.client.findUnique({
            where: { id: parsedId },
            include: { services: true, invoices: true },
        });

        if (!client) {
            return res.status(404).json({ message: "Client not found" });
        }

        // ✅ Step 1: Delete related services first
        await prisma.service.deleteMany({
            where: { clientId: parsedId },
        });

        // ✅ Step 2: Delete related invoices (if any)
        await prisma.invoice.deleteMany({
            where: { clientId: parsedId },
        });

        // ✅ Step 3: Delete the client
        await prisma.client.delete({
            where: { id: parsedId },
        });

        res.status(200).json({ message: "Client and related records deleted successfully" });
    } catch (error) {
        console.error("Error deleting client:", error);
        res.status(500).json({ message: "Error deleting client" });
    }
};
