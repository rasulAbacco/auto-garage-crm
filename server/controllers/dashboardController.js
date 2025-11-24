// server/controllers/dashboardController.js
import prisma from "../models/prismaClient.js";

/**
 * @desc Get dashboard summary data
 * @route GET /api/dashboard
 * @access Private
 */

export const getDashboardData = async (req, res) => {
    try {
        const userId = req.user.id;

        // ✅ Run all heavy queries in parallel
        const [
            recentClients,
            recentServices,
            recentInvoices,
            upcomingReminders,
            totalClients,
            monthlyRevenueRaw,
            weeklyDataRaw,
            serviceTypesRaw
        ] = await Promise.all([
            // ✅ 1. Recent clients
            prisma.client.findMany({
                where: { userId },
                select: {
                    id: true,
                    fullName: true,
                    phone: true,
                    email: true,
                    vehicleMake: true,
                    vehicleModel: true,
                    regNumber: true,
                    createdAt: true,
                },
                orderBy: { createdAt: "desc" },
                take: 5,
            }),

            // ✅ 2. Recent services
            prisma.service.findMany({
                where: { client: { userId } },
                include: {
                    client: { select: { id: true, fullName: true } },
                    category: { select: { name: true } },
                    subService: { select: { name: true } },
                },
                orderBy: { date: "desc" },
                take: 10,
            }),

            // ✅ 3. Recent invoices
            prisma.invoice.findMany({
                where: { client: { userId } },
                include: {
                    client: { select: { id: true, fullName: true } },
                },
                orderBy: { createdAt: "desc" },
                take: 10,
            }),

            // ✅ 4. Future reminders
            prisma.reminder.findMany({
                where: {
                    client: { userId },
                    remindAt: { gte: new Date() },
                },
                include: { client: { select: { id: true, fullName: true } } },
                orderBy: { remindAt: "asc" },
                take: 5,
            }),

            // ✅ 5. Total clients count
            prisma.client.count({ where: { userId } }),

            // ✅ 6. Monthly revenue (6 months) using GROUP BY
            prisma.$queryRaw`
        SELECT 
          DATE_TRUNC('month', "createdAt") AS month,
          SUM(CASE WHEN status = 'Paid' THEN "grandTotal" ELSE 0 END) AS revenue,
          COUNT(*) FILTER (WHERE status = 'Paid') AS serviceCount
        FROM "Invoice"
        WHERE "clientId" IN (SELECT id FROM "Client" WHERE "userId" = ${userId})
        AND "createdAt" >= NOW() - INTERVAL '6 months'
        GROUP BY 1
        ORDER BY 1 ASC;
      `,

            // ✅ 7. Weekly appointments in one query
            prisma.$queryRaw`
        SELECT 
          TO_CHAR("date", 'Dy') AS day,
          COUNT(*) AS appointments,
          COUNT(*) FILTER (WHERE status = 'Completed') AS completed
        FROM "Service"
        WHERE "clientId" IN (SELECT id FROM "Client" WHERE "userId" = ${userId})
        AND "date" >= NOW() - INTERVAL '7 days'
        GROUP BY day
        ORDER BY MIN("date");
      `,

            // ✅ 8. Service type distribution in one query
            prisma.$queryRaw`
        SELECT c.name AS category, COUNT(*) AS value
        FROM "Service" s
        JOIN "ServiceCategory" c ON s."categoryId" = c.id
        WHERE s."clientId" IN (SELECT id FROM "Client" WHERE "userId" = ${userId})
        GROUP BY c.name
        ORDER BY value DESC
        LIMIT 5;
      `
        ]);

        // ✅ Revenue stats
        const paidInvoices = recentInvoices.filter(inv => inv.status === "Paid");
        const pendingInvoices = recentInvoices.filter(inv => inv.status === "Pending");
        const overdueInvoices = recentInvoices.filter(inv => inv.status === "Overdue");

        const totalRevenue = paidInvoices.reduce((a, b) => a + Number(b.grandTotal), 0);
        const pendingRevenue = pendingInvoices.reduce((a, b) => a + Number(b.grandTotal), 0);
        const overdueRevenue = overdueInvoices.reduce((a, b) => a + Number(b.grandTotal), 0);

        // ✅ Weekly & Monthly formatting
        const monthlyRevenue = monthlyRevenueRaw.map(m => ({
            month: new Date(m.month).toLocaleString('default', { month: 'short' }),
            revenue: Number(m.revenue),
            services: Number(m.serviceCount)
        }));

        const weeklyAppointments = weeklyDataRaw.map(w => ({
            day: w.day,
            appointments: Number(w.appointments),
            completed: Number(w.completed)
        }));

        // ✅ Format today's appointments
        const todayAppointments = recentServices
            .filter(s => new Date(s.date).toDateString() === new Date().toDateString())
            .map(service => {
                const time = new Date(service.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const initials = service.client.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

                return {
                    id: service.id,
                    name: service.client.fullName,
                    time,
                    service: service.subService?.name || service.category?.name || "Service",
                    status: service.status,
                    avatar: initials
                };
            });

        res.json({
            stats: {
                totalRevenue,
                pendingRevenue,
                overdueRevenue,
                totalServices: recentServices.length,
                totalClients,
                upcomingReminders: upcomingReminders.length,
                avgServiceTime: "2.5 hrs",
                customerRating: 4.8,
            },
            charts: {
                monthlyRevenue,
                weeklyAppointments,
                serviceTypes: serviceTypesRaw.map(s => ({
                    name: s.category,
                    value: Number(s.value),
                })),
            },
            data: {
                clients: recentClients,
                services: recentServices,
                invoices: recentInvoices,
                reminders: upcomingReminders,
                todayAppointments
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching dashboard" });
    }
};


// Helper function to generate random colors
function getRandomColor() {
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'];
    return colors[Math.floor(Math.random() * colors.length)];
}