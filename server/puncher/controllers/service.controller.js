// server/puncher/controllers/service.controller.js
import prisma from "../../models/prismaClient.js";
import {
  allowedVehicleTypes,
  findCatalogService,
} from "../services/catalog.service.js";
import { round2, serialize } from "../services/serialize.js";
import {
  serviceSchema,
  serviceStatusSchema,
  zodMessage,
} from "../validators/puncher.validators.js";

const parseId = (v) => {
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : null;
};

// A service counts as billed when it is on any non-cancelled bill
const billedFilter = { some: { billing: { status: { not: "CANCELLED" } } } };

/** GET /api/puncher/services?status=&clientId=&vehicleType=&unbilled=true */
export const listServices = async (req, res) => {
  try {
    const { status, clientId, vehicleType, unbilled } = req.query;
    const where = { userId: req.user.id };

    if (status && serviceStatusSchema.safeParse(status).success) where.status = status;
    if (parseId(clientId)) where.clientId = parseId(clientId);
    if (vehicleType === "CAR" || vehicleType === "BIKE") where.vehicleType = vehicleType;
    if (unbilled === "true") {
      where.billingItems = { none: { billing: { status: { not: "CANCELLED" } } } };
      where.status = { not: "CANCELLED" };
    }

    const services = await prisma.puncherService.findMany({
      where,
      orderBy: { serviceDate: "desc" },
      include: {
        client: {
          select: { id: true, fullName: true, phone: true, regNumber: true, vehicleType: true },
        },
        billingItems: {
          where: { billing: { status: { not: "CANCELLED" } } },
          select: { billing: { select: { id: true, invoiceNumber: true, status: true } } },
        },
      },
    });

    return res.json(
      serialize(
        services.map(({ billingItems, ...s }) => ({
          ...s,
          billing: billingItems[0]?.billing || null,
        })),
      ),
    );
  } catch (err) {
    console.error("❌ listServices error:", err);
    return res.status(500).json({ message: "Failed to load services" });
  }
};

/** GET /api/puncher/services/:id */
export const getService = async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ message: "Invalid service id" });

  try {
    const service = await prisma.puncherService.findFirst({
      where: { id, userId: req.user.id },
      include: {
        client: true,
        billingItems: { include: { billing: true } },
      },
    });
    if (!service) return res.status(404).json({ message: "Service not found" });

    return res.json(serialize(service));
  } catch (err) {
    console.error("❌ getService error:", err);
    return res.status(500).json({ message: "Failed to load service" });
  }
};

/** Validates input against the shop + client and returns the prisma data object */
async function buildServiceData(req, input) {
  const client = await prisma.puncherClient.findFirst({
    where: { id: input.clientId, userId: req.user.id },
  });
  if (!client) return { error: "Client not found", status: 404 };

  const vehicleType = input.vehicleType || client.vehicleType;
  if (!allowedVehicleTypes(req.puncherShop.vehicleSupport).includes(vehicleType)) {
    return { error: `Your shop does not offer ${vehicleType} services.`, status: 400 };
  }

  const catalog = findCatalogService(input.serviceType);
  if (input.serviceType !== "CUSTOM" && !catalog) {
    return { error: "Unknown service type", status: 400 };
  }
  if (catalog && catalog.key !== "CUSTOM" && catalog.prices[vehicleType] === undefined) {
    return { error: `${catalog.name} is not available for ${vehicleType}.`, status: 400 };
  }

  const serviceName =
    input.serviceType === "CUSTOM"
      ? input.serviceName?.trim()
      : input.serviceName?.trim() || catalog.name;
  if (!serviceName) return { error: "Enter a name for the custom service", status: 400 };

  return {
    data: {
      clientId: client.id,
      vehicleType,
      serviceType: input.serviceType,
      serviceName,
      tyrePosition: input.tyrePosition ?? null,
      quantity: input.quantity,
      unitPrice: round2(input.unitPrice),
      totalPrice: round2(input.quantity * input.unitPrice),
      ...(input.status ? { status: input.status } : {}),
      notes: input.notes ?? null,
      ...(input.serviceDate ? { serviceDate: input.serviceDate } : {}),
    },
  };
}

/** POST /api/puncher/services */
export const createService = async (req, res) => {
  const parsed = serviceSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: zodMessage(parsed.error) });

  try {
    const built = await buildServiceData(req, parsed.data);
    if (built.error) return res.status(built.status).json({ message: built.error });

    const service = await prisma.puncherService.create({
      data: { ...built.data, userId: req.user.id },
      include: { client: { select: { id: true, fullName: true, phone: true } } },
    });
    return res.status(201).json(serialize(service));
  } catch (err) {
    console.error("❌ createService error:", err);
    return res.status(500).json({ message: "Failed to create service" });
  }
};

/** PUT /api/puncher/services/:id — billed services are locked */
export const updateService = async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ message: "Invalid service id" });

  try {
    const existing = await prisma.puncherService.findFirst({
      where: { id, userId: req.user.id },
      include: { _count: { select: { billingItems: true } } },
    });
    if (!existing) return res.status(404).json({ message: "Service not found" });

    const billed = await prisma.puncherService.count({
      where: { id, billingItems: billedFilter },
    });
    if (billed) {
      return res
        .status(409)
        .json({ message: "This service is already billed. Cancel the bill to edit it." });
    }

    const parsed = serviceSchema.safeParse({
      clientId: existing.clientId,
      vehicleType: existing.vehicleType,
      serviceType: existing.serviceType,
      serviceName: existing.serviceName,
      quantity: existing.quantity,
      unitPrice: Number(existing.unitPrice),
      ...req.body,
    });
    if (!parsed.success) return res.status(400).json({ message: zodMessage(parsed.error) });

    const built = await buildServiceData(req, parsed.data);
    if (built.error) return res.status(built.status).json({ message: built.error });

    const service = await prisma.puncherService.update({
      where: { id },
      data: built.data,
    });
    return res.json(serialize(service));
  } catch (err) {
    console.error("❌ updateService error:", err);
    return res.status(500).json({ message: "Failed to update service" });
  }
};

/** PATCH /api/puncher/services/:id/status { status } */
export const updateServiceStatus = async (req, res) => {
  const id = parseId(req.params.id);
  const parsed = serviceStatusSchema.safeParse(req.body?.status);
  if (!id || !parsed.success) return res.status(400).json({ message: "Invalid status" });

  try {
    const result = await prisma.puncherService.updateMany({
      where: { id, userId: req.user.id },
      data: { status: parsed.data },
    });
    if (result.count === 0) return res.status(404).json({ message: "Service not found" });

    return res.json({ id, status: parsed.data });
  } catch (err) {
    console.error("❌ updateServiceStatus error:", err);
    return res.status(500).json({ message: "Failed to update status" });
  }
};

/** DELETE /api/puncher/services/:id — billed services cannot be deleted */
export const deleteService = async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ message: "Invalid service id" });

  try {
    const billed = await prisma.puncherService.count({
      where: { id, userId: req.user.id, billingItems: billedFilter },
    });
    if (billed) {
      return res
        .status(409)
        .json({ message: "This service is on a bill. Cancel the bill before deleting it." });
    }

    const result = await prisma.puncherService.deleteMany({
      where: { id, userId: req.user.id },
    });
    if (result.count === 0) return res.status(404).json({ message: "Service not found" });

    return res.json({ message: "Service deleted" });
  } catch (err) {
    console.error("❌ deleteService error:", err);
    return res.status(500).json({ message: "Failed to delete service" });
  }
};
