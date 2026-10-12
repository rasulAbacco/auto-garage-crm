// server/puncher/controllers/dashboard.controller.js
import prisma from "../../models/prismaClient.js";
import { round2, serialize, toNum } from "../services/serialize.js";

const startOfDay = (d = new Date()) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
// Local calendar date (toISOString would shift the day on servers ahead of UTC, e.g. IST)
const localDateKey = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const startOfMonth = (d = new Date()) => new Date(d.getFullYear(), d.getMonth(), 1);

/** GET /api/puncher/dashboard — headline stats for the Puncher Shop dashboard */
export const getDashboard = async (req, res) => {
  const userId = req.user.id;
  const today = startOfDay();
  const monthStart = startOfMonth();
  const weekStart = new Date(today);
  weekStart.setDate(weekStart.getDate() - 6);

  try {
    const [
      clientsByVehicle,
      servicesByStatus,
      servicesToday,
      monthRevenue,
      totalRevenue,
      pendingDue,
      recentServices,
      topServices,
      weekPaid,
    ] = await Promise.all([
      prisma.puncherClient.groupBy({
        by: ["vehicleType"],
        where: { userId },
        _count: { _all: true },
      }),
      prisma.puncherService.groupBy({
        by: ["status"],
        where: { userId },
        _count: { _all: true },
      }),
      prisma.puncherService.count({ where: { userId, serviceDate: { gte: today } } }),
      prisma.puncherBilling.aggregate({
        where: { userId, status: "PAID", paidAt: { gte: monthStart } },
        _sum: { grandTotal: true },
      }),
      prisma.puncherBilling.aggregate({
        where: { userId, status: "PAID" },
        _sum: { grandTotal: true },
      }),
      prisma.puncherBilling.aggregate({
        where: { userId, status: "PENDING" },
        _sum: { grandTotal: true },
        _count: { _all: true },
      }),
      prisma.puncherService.findMany({
        where: { userId },
        orderBy: { serviceDate: "desc" },
        take: 6,
        include: { client: { select: { id: true, fullName: true, regNumber: true } } },
      }),
      prisma.puncherService.groupBy({
        by: ["serviceName"],
        where: { userId, status: { not: "CANCELLED" } },
        _count: { _all: true },
        orderBy: { _count: { serviceName: "desc" } },
        take: 5,
      }),
      prisma.puncherBilling.findMany({
        where: { userId, status: "PAID", paidAt: { gte: weekStart } },
        select: { paidAt: true, grandTotal: true },
      }),
    ]);

    const clientCount = (type) =>
      clientsByVehicle.find((c) => c.vehicleType === type)?._count._all || 0;
    const statusCount = (s) => servicesByStatus.find((x) => x.status === s)?._count._all || 0;

    // Revenue for each of the last 7 days (oldest first)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + i);
      const next = new Date(day);
      next.setDate(day.getDate() + 1);
      const amount = weekPaid
        .filter((b) => b.paidAt >= day && b.paidAt < next)
        .reduce((sum, b) => sum + toNum(b.grandTotal), 0);
      return { date: localDateKey(day), amount: round2(amount) };
    });

    return res.json({
      vehicleSupport: req.puncherShop.vehicleSupport,
      clients: {
        total: clientCount("CAR") + clientCount("BIKE"),
        car: clientCount("CAR"),
        bike: clientCount("BIKE"),
      },
      services: {
        today: servicesToday,
        pending: statusCount("PENDING"),
        inProgress: statusCount("IN_PROGRESS"),
        completed: statusCount("COMPLETED"),
        cancelled: statusCount("CANCELLED"),
      },
      revenue: {
        thisMonth: round2(toNum(monthRevenue._sum.grandTotal)),
        total: round2(toNum(totalRevenue._sum.grandTotal)),
        pendingAmount: round2(toNum(pendingDue._sum.grandTotal)),
        pendingBills: pendingDue._count._all,
        last7Days,
      },
      recentServices: serialize(recentServices),
      topServices: topServices.map((t) => ({ name: t.serviceName, count: t._count._all })),
    });
  } catch (err) {
    console.error("❌ puncher getDashboard error:", err);
    return res.status(500).json({ message: "Failed to load dashboard" });
  }
};
