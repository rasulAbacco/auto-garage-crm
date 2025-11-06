// server/controllers/invoiceController.js
import prisma from "../models/prismaClient.js";

/* ============================================================
   📄 Get All Invoices
============================================================ */
export const getInvoices = async (req, res) => {
    try {
        const invoices = await prisma.invoice.findMany({
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
        const invoice = await prisma.invoice.findUnique({
            where: { id: parseInt(id) },
            include: {
                client: true,
                services: true,
            },
        });

        if (!invoice) {
            return res.status(404).json({ message: "Invoice not found" });
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
            partsCost = 0,
            partsGst = 0,
            laborCost = 0,
            laborGst = 0,
            totalAmount,
            tax = 0,
            discount = 0,
            grandTotal,
            paymentMode = null,
            status = "Pending",
            dueDate,
            notes,
        } = req.body;

        // Validation
        if (!clientId || !grandTotal)
            return res.status(400).json({ message: "Missing required fields" });

        // ✅ Verify all selected services are Paid before creating invoice
        if (serviceIds.length > 0) {
            const unpaidServices = await prisma.service.findMany({
                where: {
                    id: { in: serviceIds.map(Number) },
                    status: { notIn: ["Paid", "Processing"] },
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

        const invoice = await prisma.invoice.create({
            data: {
                invoiceNumber,
                clientId: parseInt(clientId),
                totalAmount: parseFloat(totalAmount || 0),
                partsCost: parseFloat(partsCost || 0),
                partsGst: parseFloat(partsGst || 0),
                laborCost: parseFloat(laborCost || 0),
                laborGst: parseFloat(laborGst || 0),
                tax: parseFloat(tax),
                discount: parseFloat(discount),
                grandTotal: parseFloat(grandTotal),
                paymentMode,
                status,
                paidAt: status === "Paid" ? new Date() : null,
                dueDate: dueDate ? new Date(dueDate) : null,
                notes: notes || null,
            },
            include: {
                client: true,
            },
        });

        // ✅ Link services to invoice if applicable
        if (serviceIds.length > 0) {
            await prisma.service.updateMany({
                where: { id: { in: serviceIds.map(Number) } },
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

        const invoice = await prisma.invoice.findUnique({
            where: { id: parseInt(id) },
        });
        if (!invoice) return res.status(404).json({ message: "Invoice not found" });

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
        const invoice = await prisma.invoice.findUnique({
            where: { id: parseInt(id) },
        });
        if (!invoice) return res.status(404).json({ message: "Invoice not found" });

        await prisma.service.updateMany({
            where: { invoiceId: invoice.id },
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

        const where = {};
        if (req.user?.id) where.userId = req.user.id;

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

        const client = await prisma.client.findUnique({
            where: { id: parseInt(id) },
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
            return res.status(404).json({ message: "Client not found" });

        res.status(200).json({
            success: true,
            data: client,
        });
    } catch (error) {
        console.error("❌ Error fetching client:", error);
        res.status(500).json({ message: "Error fetching client details" });
    }
};
