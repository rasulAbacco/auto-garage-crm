// server/controllers/reportController.js
import prisma from "../models/prismaClient.js";

/**
 * @desc Revenue summary (total, paid, pending)
 * @route GET /api/reports/revenue
 * @access Private
 */
export const getRevenueSummary = async (req, res) => {
    try {
        const invoices = await prisma.invoice.findMany({
            select: { grandTotal: true, status: true, issuedAt: true },
        });

        const totalRevenue = invoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
        const paidRevenue = invoices
            .filter((i) => i.status === "Paid")
            .reduce((sum, inv) => sum + inv.grandTotal, 0);
        const pendingRevenue = totalRevenue - paidRevenue;

        res.json({
            totalRevenue,
            paidRevenue,
            pendingRevenue,
            invoiceCount: invoices.length,
        });
    } catch (error) {
        console.error("❌ Error fetching revenue report:", error);
        res.status(500).json({ message: "Error fetching revenue summary" });
    }
};

/**
 * @desc Top clients by revenue
 * @route GET /api/reports/top-clients
 * @access Private
 */
export const getTopClients = async (req, res) => {
    try {
        const topClients = await prisma.invoice.groupBy({
            by: ["clientId"],
            _sum: { grandTotal: true },
            orderBy: { _sum: { grandTotal: "desc" } },
            take: 5,
        });

        const clients = await Promise.all(
            topClients.map(async (item) => {
                const client = await prisma.client.findUnique({
                    where: { id: item.clientId },
                    select: { id: true, fullName: true, phone: true },
                });
                return {
                    ...client,
                    totalSpent: item._sum.grandTotal || 0,
                };
            })
        );

        res.json(clients);
    } catch (error) {
        console.error("❌ Error fetching top clients:", error);
        res.status(500).json({ message: "Error fetching top clients" });
    }
};

/**
 * @desc Service frequency report
 * @route GET /api/reports/services
 * @access Private
 */
export const getServiceStats = async (req, res) => {
    try {
        const serviceStats = await prisma.service.groupBy({
            by: ["type"],
            _count: { type: true },
            orderBy: { _count: { type: "desc" } },
            take: 10,
        });

        res.json(serviceStats);
    } catch (error) {
        console.error("❌ Error fetching service stats:", error);
        res.status(500).json({ message: "Error fetching service statistics" });
    }
};

/**
 * @desc Invoice summary (by status)
 * @route GET /api/reports/invoices
 * @access Private
 */
export const getInvoiceStatusSummary = async (req, res) => {
    try {
        const counts = await prisma.invoice.groupBy({
            by: ["status"],
            _count: { status: true },
        });

        res.json(counts);
    } catch (error) {
        console.error("❌ Error fetching invoice summary:", error);
        res.status(500).json({ message: "Error fetching invoice summary" });
    }
};

// server/controllers/reportController.js
export const getFullInvoiceDetails = async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`🔍 Fetching full invoice #${id}`);

        const invoice = await prisma.invoice.findUnique({
            where: { id: parseInt(id) },
            include: {
                client: {
                    select: {
                        id: true,
                        fullName: true,
                        phone: true,
                        email: true,
                        address: true,
                        vehicleMake: true,
                        vehicleModel: true,
                        vehicleYear: true,
                        regNumber: true,
                        vin: true,
                    },
                },
                services: {
                    select: {
                        id: true,
                        type: true,
                        date: true,
                        partsCost: true,
                        laborCost: true,
                        cost: true,
                        status: true,
                        description: true,
                        // Optional: if you add a nextServiceDate field later
                    },
                },
            },
        });

        if (!invoice) {
            console.warn(`⚠️ Invoice #${id} not found`);
            return res.status(404).json({ message: "Invoice not found" });
        }

        res.json(invoice);
    } catch (error) {
        console.error("❌ Error fetching invoice details:", error);
        res.status(500).json({ message: "Error fetching invoice details" });
    }
};
