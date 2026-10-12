// server/puncher/controllers/shop.controller.js
import prisma from "../../models/prismaClient.js";
import { getCatalogFor } from "../services/catalog.service.js";
import { shopSchema, zodMessage } from "../validators/puncher.validators.js";

/** GET /api/puncher/shop — shop profile + owner basics */
export const getShop = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        username: true,
        email: true,
        phone: true,
        companyName: true,
        address: true,
        gstNumber: true,
        plan: true,
        planExpiry: true,
      },
    });

    return res.json({ ...req.puncherShop, owner: user });
  } catch (err) {
    console.error("❌ getShop error:", err);
    return res.status(500).json({ message: "Failed to load shop profile" });
  }
};

/** PUT /api/puncher/shop — update vehicle support (Car / Bike / Car & Bike) or name */
export const updateShop = async (req, res) => {
  const parsed = shopSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: zodMessage(parsed.error) });

  try {
    const shop = await prisma.puncherShop.update({
      where: { userId: req.user.id },
      data: parsed.data,
    });
    return res.json(shop);
  } catch (err) {
    console.error("❌ updateShop error:", err);
    return res.status(500).json({ message: "Failed to update shop profile" });
  }
};

/** GET /api/puncher/catalog — services available for this shop's vehicle support */
export const getCatalog = (req, res) => {
  return res.json(getCatalogFor(req.puncherShop.vehicleSupport));
};
