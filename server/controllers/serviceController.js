import prisma from "../models/prismaClient.js";

/**
 * @desc Get all services
 * @route GET /api/services
 * @access Private
 */
export const getServices = async (req, res) => {
    try {
        const services = await prisma.service.findMany({
            include: {
                client: {
                    select: { id: true, fullName: true, regNumber: true },
                },
            },
            orderBy: { date: "desc" },
        });
        res.json(services);
    } catch (error) {
        console.error("Error fetching services:", error);
        res.status(500).json({ message: "Error fetching services" });
    }
};

/**
 * @desc Get all services for a specific client
 * @route GET /api/services/client/:clientId
 * @access Private
 */
export const getServicesByClient = async (req, res) => {
    try {
        const { clientId } = req.params;

        const client = await prisma.client.findUnique({
            where: { id: parseInt(clientId) },
            include: {
                services: {
                    include: {
                        invoice: true,
                    },
                    orderBy: { date: "desc" },
                },
            },
        });

        if (!client) {
            return res.status(404).json({ message: "Client not found" });
        }

        if (!client.services.length) {
            return res.status(404).json({ message: "No services found for this client" });
        }

        res.status(200).json({
            client: {
                id: client.id,
                fullName: client.fullName,
                regNumber: client.regNumber,
                vehicleMake: client.vehicleMake,
                vehicleModel: client.vehicleModel,
            },
            services: client.services,
        });
    } catch (error) {
        console.error("Error fetching services by client:", error);
        res.status(500).json({ message: "Error fetching services for client" });
    }
};

/**
 * @desc Get single service by ID
 * @route GET /api/services/:id
 * @access Private
 */
export const getServiceById = async (req, res) => {
    try {
        const { id } = req.params;
        const service = await prisma.service.findUnique({
            where: { id: parseInt(id) },
            include: {
                client: {
                    select: {
                        id: true,
                        fullName: true,
                        vehicleModel: true,
                        vehicleMake: true,
                        regNumber: true,
                    },
                },
                invoice: true,
            },
        });

        if (!service) return res.status(404).json({ message: "Service not found" });

        res.json(service);
    } catch (error) {
        console.error("Error fetching service:", error);
        res.status(500).json({ message: "Error fetching service" });
    }
};

/**
 * @desc Create new service
 * @route POST /api/services
 * @access Private
 */
export const createService = async (req, res) => {
    try {
        const { type, date, cost, partsCost, laborCost, status, description, clientId } = req.body;

        if (!clientId || !type || !date) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        const computedCost =
            cost !== undefined && cost !== null
                ? parseFloat(cost)
                : (parseFloat(partsCost || 0) + parseFloat(laborCost || 0)) || null;

        const service = await prisma.service.create({
            data: {
                type,
                date: new Date(date),
                partsCost: partsCost ? parseFloat(partsCost) : null,
                laborCost: laborCost ? parseFloat(laborCost) : null,
                cost: computedCost, // ✅ auto-calculated total
                status,
                description,
                client: { connect: { id: parseInt(clientId) } },
            },
        });

        res.status(201).json({
            message: "Service created successfully",
            service,
        });
    } catch (error) {
        console.error("Error creating service:", error);
        res.status(500).json({ message: "Error creating service" });
    }
};


/**
 * @desc Update service
 * @route PUT /api/services/:id
 * @access Private
 */
export const updateService = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            type,
            date,
            partsCost,
            laborCost,
            cost,
            status,
            description,
            clientId,
            invoiceId,
        } = req.body;

        // ✅ Recalculate cost automatically
        const computedCost =
            cost !== undefined && cost !== null
                ? parseFloat(cost)
                : (parseFloat(partsCost || 0) + parseFloat(laborCost || 0)) || null;

        const updateData = {
            type,
            date: date ? new Date(date) : undefined,
            partsCost: partsCost ? parseFloat(partsCost) : undefined,
            laborCost: laborCost ? parseFloat(laborCost) : undefined,
            cost: computedCost,
            status,
            description,
            clientId: clientId ? parseInt(clientId) : undefined,
            invoiceId: invoiceId ? parseInt(invoiceId) : null,
        };

        Object.keys(updateData).forEach(
            (key) => updateData[key] === undefined && delete updateData[key]
        );

        const updatedService = await prisma.service.update({
            where: { id: parseInt(id) },
            data: updateData,
        });

        res.json({
            message: "Service updated successfully",
            service: updatedService,
        });
    } catch (error) {
        console.error("Error updating service:", error);
        res.status(500).json({ message: "Error updating service" });
    }
};



/**
 * @desc Delete service
 * @route DELETE /api/services/:id
 * @access Private
 */
export const deleteService = async (req, res) => {
    try {
        const { id } = req.params;

        const service = await prisma.service.findUnique({ where: { id: parseInt(id) } });
        if (!service) return res.status(404).json({ message: "Service not found" });

        await prisma.service.delete({ where: { id: parseInt(id) } });

        res.json({ message: "Service deleted successfully" });
    } catch (error) {
        console.error("Error deleting service:", error);
        res.status(500).json({ message: "Error deleting service" });
    }
};
