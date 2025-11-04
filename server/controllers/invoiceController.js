// server/controllers/invoiceController.js
import prisma from "../models/prismaClient.js";

/**
 * @desc Get all invoices
 * @route GET /api/invoices
 * @access Private
 */
export const getInvoices = async (req, res) => {
    try {
        const invoices = await prisma.invoice.findMany({
            include: {
                client: true,
                services: true,
            },
            orderBy: { createdAt: "desc" },
        });
        res.json(invoices);
    } catch (error) {
        console.error("❌ Error fetching invoices:", error);
        res.status(500).json({ message: "Error fetching invoices" });
    }
};

/**
 * @desc Get single invoice by ID
 * @route GET /api/invoices/:id
 * @access Private
 */
export const getInvoiceById = async (req, res) => {
    try {
        const { id } = req.params;

        const invoice = await prisma.invoice.findUnique({
            where: { id: parseInt(id) },
            include: { client: true, services: true },
        });

        if (!invoice) {
            return res.status(404).json({ message: "Invoice not found" });
        }

        res.json(invoice);
    } catch (error) {
        console.error("❌ Error fetching invoice:", error);
        res.status(500).json({ message: "Error fetching invoice" });
    }
};

/**
 * @desc Create new invoice
 * @route POST /api/invoices
 * @access Private
 */
export const createInvoice = async (req, res) => {
    try {
        const {
            clientId,
            serviceIds = [],
            totalAmount,
            tax = 0,
            discount = 0,
            grandTotal,
            status,
            dueDate,
            notes,
        } = req.body;

        if (!clientId || !totalAmount || !grandTotal) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        const invoiceNumber = `INV-${Date.now()}`;

        // ✅ Step 1: Create invoice
        const invoice = await prisma.invoice.create({
            data: {
                invoiceNumber,
                clientId: parseInt(clientId),
                totalAmount: parseFloat(totalAmount),
                tax: parseFloat(tax),
                discount: parseFloat(discount),
                grandTotal: parseFloat(grandTotal),
                status: status || "Pending",
                dueDate: dueDate ? new Date(dueDate) : null,
                notes,
            },
            include: {
                client: true,
                services: true,
            },
        });

        // ✅ Step 2: Link each service individually
        if (serviceIds.length > 0) {
            for (const sid of serviceIds) {
                await prisma.service.update({
                    where: { id: parseInt(sid) },
                    data: {
                        invoiceId: invoice.id,
                        description: notes || "Service billed via invoice",
                        status: status || "Pending",
                    },
                });
            }
        }

        // ✅ Step 3: Fetch invoice again with updated services
        const updatedInvoice = await prisma.invoice.findUnique({
            where: { id: invoice.id },
            include: {
                client: true,
                services: true,
            },
        });

        res.status(201).json({
            message: "Invoice created successfully and linked to service(s)",
            invoice: updatedInvoice,
        });
    } catch (error) {
        console.error("❌ Error creating invoice:", error);
        res.status(500).json({ message: "Error creating invoice" });
    }
};
/**
 * @desc Update invoice
 * @route PUT /api/invoices/:id
 * @access Private
 */
export const updateInvoice = async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;

        const invoice = await prisma.invoice.findUnique({
            where: { id: parseInt(id) },
        });

        if (!invoice) {
            return res.status(404).json({ message: "Invoice not found" });
        }

        const updatedInvoice = await prisma.invoice.update({
            where: { id: parseInt(id) },
            data: {
                ...data,
                dueDate: data.dueDate ? new Date(data.dueDate) : null,
            },
            include: { client: true, services: true },
        });

        res.json({
            message: "Invoice updated successfully",
            invoice: updatedInvoice,
        });
    } catch (error) {
        console.error("❌ Error updating invoice:", error);
        res.status(500).json({ message: "Error updating invoice" });
    }
};

/**
 * @desc Delete invoice
 * @route DELETE /api/invoices/:id
 * @access Private
 */
export const deleteInvoice = async (req, res) => {
    try {
        const { id } = req.params;

        const invoice = await prisma.invoice.findUnique({
            where: { id: parseInt(id) },
        });

        if (!invoice) {
            return res.status(404).json({ message: "Invoice not found" });
        }

        await prisma.invoice.delete({
            where: { id: parseInt(id) },
        });

        res.json({ message: "Invoice deleted successfully" });
    } catch (error) {
        console.error("❌ Error deleting invoice:", error);
        res.status(500).json({ message: "Error deleting invoice" });
    }
};

