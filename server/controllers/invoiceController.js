// server/controllers/invoiceController.js
import prisma from "../models/prismaClient.js";

/* ============================================================
   📄 Get All Invoices
============================================================ */
export const getInvoices = async (req, res) => {
    try {
        // Only get invoices for the authenticated user's clients
        const invoices = await prisma.invoice.findMany({
            where: {
                client: {
                    userId: req.user.id // Filter by authenticated user
                }
            },
            include: {
                client: {
                    select: {
                        id: true,
                        fullName: true,
                        phone: true,
                        email: true,
                        regNumber: true,
                    },
                },
                services: {
                    select: {
                        id: true,
                        partsCost: true,
                        partsGst: true,
                        laborCost: true,
                        laborGst: true,
                        cost: true,
                        status: true,
                        date: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        res.status(200).json(invoices);
    } catch (error) {
        console.error("❌ Error fetching invoices:", error);
        res.status(500).json({ message: "Error fetching invoices" });
    }
};

/* ============================================================
   📘 Get Single Invoice
============================================================ */
export const getInvoiceById = async (req, res) => {
    try {
        const { id } = req.params;

        // Check that the invoice belongs to a client of the authenticated user
        const invoice = await prisma.invoice.findFirst({
            where: {
                id: parseInt(id),
                client: {
                    userId: req.user.id // Filter by authenticated user
                }
            },
            include: {
                client: true,
                services: true,
            },
        });

        if (!invoice) {
            return res.status(404).json({ message: "Invoice not found or access denied" });
        }

        res.status(200).json(invoice);
    } catch (error) {
        console.error("❌ Error fetching invoice:", error);
        res.status(500).json({ message: "Error fetching invoice" });
    }
};

/* ============================================================
   ➕ Create Invoice
============================================================ */
export const createInvoice = async (req, res) => {
    try {
        const {
            clientId,
            serviceIds = [],

            // ✅ Pricing
            partsCost = 0,
            partsGst = 0,
            laborCost = 0,
            laborGst = 0,
            totalAmount,
            tax = 0,
            discount = 0,
            grandTotal,

            // ✅ Payment
            paymentMode = null,
            status = "Pending",
            dueDate,
            notes,

            // ✅ Service details (missing earlier)
            serviceCategory,
            serviceSubCategory,
            serviceNotes,
            mechanic,
            vehicle,
        } = req.body;

        // Validation
        if (!clientId || !grandTotal)
            return res.status(400).json({ message: "Missing required fields" });

        // Check correct ownership
        const client = await prisma.client.findFirst({
            where: {
                id: parseInt(clientId),
                userId: req.user.id,
            },
        });

        if (!client) {
            return res.status(403).json({
                message: "You are not authorized to create an invoice for this client",
            });
        }

        // ✅ Check serviceIds
        if (serviceIds.length > 0) {
            const unpaidServices = await prisma.service.findMany({
                where: {
                    id: { in: serviceIds.map(Number) },
                    status: { notIn: ["Paid", "Processing"] },
                    client: {
                        userId: req.user.id,
                    },
                },
            });

            if (unpaidServices.length > 0) {
                return res.status(400).json({
                    message:
                        "All related services must be marked as 'Paid' or 'Processing' before creating an invoice.",
                    unpaidServices,
                });
            }
        }

        const invoiceNumber = `INV-${Date.now()}`;

        // ✅ Create Invoice With Service Fields
        const invoice = await prisma.invoice.create({
            data: {
                invoiceNumber,
                clientId: parseInt(clientId),

                // Pricing
                totalAmount: parseFloat(totalAmount || 0),
                partsCost: parseFloat(partsCost || 0),
                partsGst: parseFloat(partsGst || 0),
                laborCost: parseFloat(laborCost || 0),
                laborGst: parseFloat(laborGst || 0),
                tax: parseFloat(tax),
                discount: parseFloat(discount),
                grandTotal: parseFloat(grandTotal),

                // Payment
                paymentMode,
                status,
                paidAt: status === "Paid" ? new Date() : null,
                dueDate: dueDate ? new Date(dueDate) : null,

                notes: notes || null,

                // ✅ Store service details (fix)
                serviceCategory: serviceCategory || null,
                serviceSubCategory: serviceSubCategory || null,
                serviceNotes: serviceNotes || null,
                mechanic: mechanic || null,
                vehicle: vehicle || null,
            },
            include: {
                client: true,
            },
        });

        // ✅ If invoice created for services → link them
        if (serviceIds.length > 0) {
            await prisma.service.updateMany({
                where: {
                    id: { in: serviceIds.map(Number) },
                    client: {
                        userId: req.user.id,
                    },
                },
                data: {
                    invoiceId: invoice.id,
                    status: "Billed",
                },
            });
        }

        const fullInvoice = await prisma.invoice.findUnique({
            where: { id: invoice.id },
            include: {
                client: true,
                services: true,
            },
        });

        res.status(201).json({
            message: "✅ Invoice created successfully",
            invoice: fullInvoice,
        });
    } catch (error) {
        console.error("❌ Error creating invoice:", error);
        res.status(500).json({ message: "Error creating invoice" });
    }
};


/* ============================================================
   ✏️ Update Invoice
============================================================ */
export const updateInvoice = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            partsCost,
            partsGst,
            laborCost,
            laborGst,
            totalAmount,
            tax,
            discount,
            grandTotal,
            paymentMode,
            status,
            dueDate,
            notes,
        } = req.body;

        // Check that the invoice belongs to a client of the authenticated user
        const invoice = await prisma.invoice.findFirst({
            where: {
                id: parseInt(id),
                client: {
                    userId: req.user.id // Filter by authenticated user
                }
            },
        });

        if (!invoice) return res.status(404).json({ message: "Invoice not found or access denied" });

        const updatedInvoice = await prisma.invoice.update({
            where: { id: parseInt(id) },
            data: {
                partsCost: parseFloat(partsCost || 0),
                partsGst: parseFloat(partsGst || 0),
                laborCost: parseFloat(laborCost || 0),
                laborGst: parseFloat(laborGst || 0),
                totalAmount: parseFloat(totalAmount || 0),
                tax: parseFloat(tax || 0),
                discount: parseFloat(discount || 0),
                grandTotal: parseFloat(grandTotal || 0),
                paymentMode,
                status,
                paidAt: status === "Paid" ? new Date() : null,
                dueDate: dueDate ? new Date(dueDate) : null,
                notes,
            },
            include: {
                client: true,
                services: true,
            },
        });

        res.status(200).json({
            message: "✅ Invoice updated successfully",
            invoice: updatedInvoice,
        });
    } catch (error) {
        console.error("❌ Error updating invoice:", error);
        res.status(500).json({ message: "Error updating invoice" });
    }
};

/* ============================================================
   🗑️ Delete Invoice
============================================================ */
export const deleteInvoice = async (req, res) => {
    try {
        const { id } = req.params;

        // Check that the invoice belongs to a client of the authenticated user
        const invoice = await prisma.invoice.findFirst({
            where: {
                id: parseInt(id),
                client: {
                    userId: req.user.id // Filter by authenticated user
                }
            },
        });

        if (!invoice) return res.status(404).json({ message: "Invoice not found or access denied" });

        await prisma.service.updateMany({
            where: {
                invoiceId: invoice.id,
                client: {
                    userId: req.user.id // Ensure services belong to the user's clients
                }
            },
            data: { invoiceId: null, status: "Unpaid" },
        });

        await prisma.invoice.delete({ where: { id: invoice.id } });

        res.json({ message: "🗑️ Invoice deleted successfully" });
    } catch (error) {
        console.error("❌ Error deleting invoice:", error);
        res.status(500).json({ message: "Error deleting invoice" });
    }
};

/* ============================================================
   📘 GET CLIENTS (Paginated + Lightweight)
============================================================ */
export const getClients = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page || "1"));
        const limit = Math.min(100, parseInt(req.query.limit || "50"));
        const skip = (page - 1) * limit;

        const where = { userId: req.user.id }; // Only get clients for the authenticated user

        if (req.query.q) {
            const q = String(req.query.q).trim().toLowerCase();
            where.OR = [
                { fullName: { contains: q, mode: "insensitive" } },
                { phone: { contains: q, mode: "insensitive" } },
                { email: { contains: q, mode: "insensitive" } },
                { regNumber: { contains: q, mode: "insensitive" } },
                { vehicleMake: { contains: q, mode: "insensitive" } },
                { vehicleModel: { contains: q, mode: "insensitive" } },
            ];
        }

        const [total, clients] = await Promise.all([
            prisma.client.count({ where }),
            prisma.client.findMany({
                where,
                select: {
                    id: true,
                    fullName: true,
                    phone: true,
                    email: true,
                    regNumber: true,
                    vehicleMake: true,
                    vehicleModel: true,
                    createdAt: true,
                    _count: { select: { services: true } },
                },
                orderBy: { createdAt: "desc" },
                skip,
                take: limit,
            }),
        ]);

        res.status(200).json({
            success: true,
            total,
            page,
            limit,
            pages: Math.ceil(total / limit),
            data: clients,
        });
    } catch (error) {
        console.error("❌ Error fetching clients:", error);
        res.status(500).json({ message: "Error fetching clients" });
    }
};

/* ============================================================
   📘 GET CLIENT BY ID (Detailed)
============================================================ */
export const getClientById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id || isNaN(Number(id))) {
            return res.status(400).json({ message: "Invalid client ID" });
        }

        // Check that the client belongs to the authenticated user
        const client = await prisma.client.findFirst({
            where: {
                id: parseInt(id),
                userId: req.user.id // Filter by authenticated user
            },
            include: {
                services: {
                    select: {
                        id: true,
                        notes: true,
                        partsCost: true,
                        partsGst: true,
                        laborCost: true,
                        laborGst: true,
                        cost: true,
                        status: true,
                        date: true,
                        invoiceId: true,
                    },
                    orderBy: { date: "desc" },
                },
                invoices: {
                    select: {
                        id: true,
                        invoiceNumber: true,
                        totalAmount: true,
                        grandTotal: true,
                        paymentMode: true,
                        status: true,
                        dueDate: true,
                        createdAt: true,
                    },
                    orderBy: { createdAt: "desc" },
                },
            },
        });

        if (!client)
            return res.status(404).json({ message: "Client not found or access denied" });

        res.status(200).json({
            success: true,
            data: client,
        });
    } catch (error) {
        console.error("❌ Error fetching client:", error);
        res.status(500).json({ message: "Error fetching client details" });
    }
};