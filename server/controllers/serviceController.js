// server/controllers/serviceController.js
import prisma from "../models/prismaClient.js";

/* ============================================================
   📦 Get All Services
   @route   GET /api/services
   @access  Private
============================================================ */
export const getServices = async (req, res) => {
    try {
        const services = await prisma.service.findMany({
            include: {
                client: {
                    select: { id: true, fullName: true, regNumber: true },
                },
                category: { select: { id: true, name: true } },
                subService: { select: { id: true, name: true } },
            },
            orderBy: { date: "desc" },
        });

        res.json(services);
    } catch (error) {
        console.error("❌ Error fetching services:", error);
        res.status(500).json({ message: "Error fetching services" });
    }
};

/* ============================================================
   👤 Get All Services by a Specific Client
   @route   GET /api/services/client/:clientId
   @access  Private
============================================================ */
export const getServicesByClient = async (req, res) => {
    try {
        const { clientId } = req.params;
        if (!clientId || isNaN(Number(clientId))) {
            return res.status(400).json({ message: "Invalid client ID" });
        }

        const client = await prisma.client.findUnique({
            where: { id: parseInt(clientId) },
            include: {
                services: {
                    include: {
                        category: { select: { id: true, name: true } },
                        subService: { select: { id: true, name: true } },
                    },
                    orderBy: { date: "desc" },
                },
            },
        });

        if (!client) return res.status(404).json({ message: "Client not found" });
        if (!client.services.length)
            return res.status(404).json({ message: "No services found for this client" });

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
        console.error("❌ Error fetching services by client:", error);
        res.status(500).json({ message: "Error fetching services for client" });
    }
};

/* ============================================================
   🔍 Get a Single Service by ID
   @route   GET /api/services/:id
   @access  Private
============================================================ */
export const getServiceById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id || isNaN(Number(id))) {
            return res.status(400).json({ message: "Invalid or missing service ID" });
        }

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
                category: { select: { id: true, name: true } },
                subService: { select: { id: true, name: true } },
            },
        });

        if (!service)
            return res.status(404).json({ message: "Service not found" });

        res.json(service);
    } catch (error) {
        console.error("❌ Error fetching service:", error);
        res.status(500).json({ message: "Error fetching service" });
    }
};

/* ============================================================
   ➕ Create a New Service (with GST fields)
   @route   POST /api/services
   @access  Private
============================================================ */
export const createService = async (req, res) => {
    try {
        const {
            clientId,
            categoryId,
            subServiceId,
            notes,
            date,
            partsCost,
            laborCost,
            partsGst,
            laborGst,
            cost,
            status,
        } = req.body;

        if (!clientId || !date) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        const pCost = parseFloat(partsCost || 0);
        const lCost = parseFloat(laborCost || 0);
        const pGst = parseFloat(partsGst || 0);
        const lGst = parseFloat(laborGst || 0);

        const computedCost =
            cost !== undefined && cost !== null
                ? parseFloat(cost)
                : pCost + (pCost * pGst) / 100 + lCost + (lCost * lGst) / 100;

        const service = await prisma.service.create({
            data: {
                
                date: new Date(date),
                partsCost: pCost,
                partsGst: pGst,
                laborCost: lCost,
                laborGst: lGst,
                cost: computedCost,
                status: status || "Pending",
                notes: notes || null,
                client: { connect: { id: parseInt(clientId) } },
                ...(categoryId && { category: { connect: { id: parseInt(categoryId) } } }),
                ...(subServiceId && { subService: { connect: { id: parseInt(subServiceId) } } }),
            },
            include: {
                client: { select: { fullName: true, regNumber: true } },
                category: true,
                subService: true,
            },
        });

        res.status(201).json({
            message: "✅ Service created successfully",
            service,
        });
    } catch (error) {
        console.error("❌ Error creating service:", error);
        res.status(500).json({ message: "Error creating service" });
    }
};

/* ============================================================
   ✏️ Update Existing Service (with GST fields)
   @route   PUT /api/services/:id
   @access  Private
============================================================ */
export const updateService = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id || isNaN(Number(id))) {
            return res.status(400).json({ message: "Invalid service ID" });
        }

        const {
            clientId,
            categoryId,
            subServiceId,
            notes,
            date,
            partsCost,
            laborCost,
            partsGst,
            laborGst,
            cost,
            status,
        } = req.body;

        const pCost = parseFloat(partsCost || 0);
        const lCost = parseFloat(laborCost || 0);
        const pGst = parseFloat(partsGst || 0);
        const lGst = parseFloat(laborGst || 0);

        const computedCost =
            cost !== undefined && cost !== null
                ? parseFloat(cost)
                : pCost + (pCost * pGst) / 100 + lCost + (lCost * lGst) / 100;

        const updateData = {
            date: date ? new Date(date) : undefined,
            partsCost: isNaN(pCost) ? undefined : pCost,
            partsGst: isNaN(pGst) ? undefined : pGst,
            laborCost: isNaN(lCost) ? undefined : lCost,
            laborGst: isNaN(lGst) ? undefined : lGst,
            cost: computedCost,
            status,
            notes: notes || undefined,
            clientId: clientId ? parseInt(clientId) : undefined,
            ...(categoryId && { categoryId: parseInt(categoryId) }),
            ...(subServiceId && { subServiceId: parseInt(subServiceId) }),
        };

        Object.keys(updateData).forEach(
            (key) => updateData[key] === undefined && delete updateData[key]
        );

        const updatedService = await prisma.service.update({
            where: { id: parseInt(id) },
            data: updateData,
            include: {
                client: { select: { fullName: true, regNumber: true } },
                category: true,
                subService: true,
            },
        });

        res.json({
            message: "✅ Service updated successfully",
            service: updatedService,
        });
    } catch (error) {
        console.error("❌ Error updating service:", error);
        res.status(500).json({ message: "Error updating service" });
    }
};

/* ============================================================
   🗑️ Delete Service
   @route   DELETE /api/services/:id
   @access  Private
============================================================ */
export const deleteService = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id || isNaN(Number(id))) {
            return res.status(400).json({ message: "Invalid service ID" });
        }

        const service = await prisma.service.findUnique({
            where: { id: parseInt(id) },
        });

        if (!service)
            return res.status(404).json({ message: "Service not found" });

        await prisma.service.delete({ where: { id: parseInt(id) } });

        res.json({ message: "🗑️ Service deleted successfully" });
    } catch (error) {
        console.error("❌ Error deleting service:", error);
        res.status(500).json({ message: "Error deleting service" });
    }
};

/* ============================================================
   📘 Get Service Types (Categories + SubServices)
   @route   GET /api/services/types/list
   @access  Private
============================================================ */
export const getServiceTypes = async (req, res) => {
    try {
        const categories = await prisma.serviceCategory.findMany({
            include: {
                subServices: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
            orderBy: { id: "asc" },
        });

        res.status(200).json(categories);
    } catch (error) {
        console.error("❌ Error fetching service types:", error);
        res.status(500).json({ message: "Error fetching service types" });
    }
};
