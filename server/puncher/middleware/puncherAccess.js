// server/puncher/middleware/puncherAccess.js
import prisma from "../../models/prismaClient.js";

/**
 * Runs after `protect`.
 * Only an OWNER account registered as a Puncher Shop (allowedCrms has PUNCHER)
 * may use these APIs. Car / Bike / Wash-only accounts and all staff tokens are
 * rejected, and every query is scoped to the owner's own userId, so the
 * existing CRMs are unaffected and cannot read puncher data.
 *
 * Note: the shared generateToken() does not currently sign `crmType`, so the
 * account's allowedCrms is the source of truth. If a token ever does carry a
 * workspace, it must be PUNCHER.
 * Loads the shop profile into req.puncherShop.
 */
export const requirePuncherAccess = async (req, res, next) => {
  try {
    const user = req.user;

    if (!user || user.type !== "owner") {
      return res
        .status(403)
        .json({ message: "Puncher Shop access is available to the shop owner only." });
    }

    if (user.crmType && user.crmType !== "PUNCHER") {
      return res
        .status(403)
        .json({ message: "Please login to the Puncher Shop workspace to continue." });
    }

    if (!Array.isArray(user.allowedCrms) || !user.allowedCrms.includes("PUNCHER")) {
      return res
        .status(403)
        .json({ message: "You do not have access to the Puncher Shop CRM." });
    }

    // Profile is created at registration; create a default one for safety
    let shop = await prisma.puncherShop.findUnique({ where: { userId: user.id } });
    if (!shop) {
      shop = await prisma.puncherShop.create({
        data: { userId: user.id, vehicleSupport: "BOTH" },
      });
    }

    req.puncherShop = shop;
    return next();
  } catch (err) {
    console.error("❌ requirePuncherAccess error:", err);
    return res.status(500).json({ message: "Failed to verify Puncher Shop access" });
  }
};
