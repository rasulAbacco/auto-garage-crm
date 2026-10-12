// server/puncher/controllers/client.controller.js
import prisma from "../../models/prismaClient.js";
import { allowedVehicleTypes } from "../services/catalog.service.js";
import { serialize } from "../services/serialize.js";
import { clientSchema, zodMessage } from "../validators/puncher.validators.js";

const parseId = (v) => {
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : null;
};

const vehicleNotSupported = (shop, vehicleType) =>
  !allowedVehicleTypes(shop.vehicleSupport).includes(vehicleType);

/** GET /api/puncher/clients?search=&vehicleType= */
export const listClients = async (req, res) => {
  try {
    const { search, vehicleType } = req.query;
    const where = { userId: req.user.id };

    if (vehicleType === "CAR" || vehicleType === "BIKE") where.vehicleType = vehicleType;

    if (search && String(search).trim()) {
      const q = String(search).trim();
      where.OR = [
        { fullName: { contains: q, mode: "insensitive" } },
        { phone: { contains: q } },
        { regNumber: { contains: q, mode: "insensitive" } },
        { vehicleMake: { contains: q, mode: "insensitive" } },
        { vehicleModel: { contains: q, mode: "insensitive" } },
      ];
    }

    const clients = await prisma.puncherClient.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { services: true, billings: true } } },
    });

    return res.json(serialize(clients));
  } catch (err) {
    console.error("❌ listClients error:", err);
    return res.status(500).json({ message: "Failed to load clients" });
  }
};

/** GET /api/puncher/clients/:id — client with service + billing history */
export const getClient = async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ message: "Invalid client id" });

  try {
    const client = await prisma.puncherClient.findFirst({
      where: { id, userId: req.user.id },
      include: {
        services: { orderBy: { serviceDate: "desc" } },
        billings: { orderBy: { createdAt: "desc" } },
      },
    });
    if (!client) return res.status(404).json({ message: "Client not found" });

    return res.json(serialize(client));
  } catch (err) {
    console.error("❌ getClient error:", err);
    return res.status(500).json({ message: "Failed to load client" });
  }
};

/** POST /api/puncher/clients */
export const createClient = async (req, res) => {
  const parsed = clientSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: zodMessage(parsed.error) });

  if (vehicleNotSupported(req.puncherShop, parsed.data.vehicleType)) {
    return res.status(400).json({
      message: `Your shop is set up for ${req.puncherShop.vehicleSupport} only. Update it in Profile to add ${parsed.data.vehicleType} clients.`,
    });
  }

  try {
    const client = await prisma.puncherClient.create({
      data: { ...parsed.data, userId: req.user.id },
    });
    return res.status(201).json(serialize(client));
  } catch (err) {
    console.error("❌ createClient error:", err);
    return res.status(500).json({ message: "Failed to create client" });
  }
};

/** PUT /api/puncher/clients/:id */
export const updateClient = async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ message: "Invalid client id" });

  const parsed = clientSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: zodMessage(parsed.error) });

  if (parsed.data.vehicleType && vehicleNotSupported(req.puncherShop, parsed.data.vehicleType)) {
    return res.status(400).json({ message: "This vehicle type is not enabled for your shop." });
  }

  try {
    const result = await prisma.puncherClient.updateMany({
      where: { id, userId: req.user.id },
      data: parsed.data,
    });
    if (result.count === 0) return res.status(404).json({ message: "Client not found" });

    const client = await prisma.puncherClient.findUnique({ where: { id } });
    return res.json(serialize(client));
  } catch (err) {
    console.error("❌ updateClient error:", err);
    return res.status(500).json({ message: "Failed to update client" });
  }
};

/** DELETE /api/puncher/clients/:id — cascades to that client's services & bills */
export const deleteClient = async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ message: "Invalid client id" });

  try {
    const result = await prisma.puncherClient.deleteMany({
      where: { id, userId: req.user.id },
    });
    if (result.count === 0) return res.status(404).json({ message: "Client not found" });

    return res.json({ message: "Client deleted" });
  } catch (err) {
    console.error("❌ deleteClient error:", err);
    return res.status(500).json({ message: "Failed to delete client" });
  }
};
