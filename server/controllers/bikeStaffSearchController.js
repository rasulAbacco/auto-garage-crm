// server/controllers/bikeStaffSearchController.js
import prisma from "../models/prismaClient.js";

/**
 * GET /api/bike-staff/mechanics
 * Returns this garage's staff for the "Assigned Mechanic" dropdown.
 *  - Staff added in Staff Management  (Staff model)
 *  - Team members                     (BikeTeam model)
 * Mechanics are listed first. Duplicate names (same person in both) appear once.
 */
export const getBikeMechanics = async (req, res) => {
  try {
    // Team logins act on behalf of their garage owner if the middleware provides it
    const ownerId = req.user.ownerId || req.user.id;

    const [staff, team] = await Promise.all([
      prisma.staff.findMany({
        where: { userId: ownerId },
        select: { id: true, name: true, role: true, phone: true },
        orderBy: { name: "asc" },
      }),
      prisma.bikeTeam.findMany({
        where: { ownerId },
        select: { id: true, name: true, role: true, phone: true },
        orderBy: { name: "asc" },
      }),
    ]);

    const seen = new Set();
    const people = [
      ...staff.map((s) => ({ ...s, id: `staff-${s.id}` })),
      ...team.map((t) => ({ ...t, id: `team-${t.id}` })),
    ].filter((p) => {
      const key = String(p.name || "")
        .trim()
        .toLowerCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    const isMechanic = (p) => /mechanic|technician/i.test(p.role || "");
    people.sort(
      (a, b) =>
        Number(isMechanic(b)) - Number(isMechanic(a)) ||
        a.name.localeCompare(b.name),
    );

    res.json(people);
  } catch (err) {
    console.error("Get bike mechanics failed:", err);
    res.status(500).json({ message: "Failed to load staff" });
  }
};
