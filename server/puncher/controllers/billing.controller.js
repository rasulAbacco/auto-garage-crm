// server/puncher/controllers/billing.controller.js
import prisma from "../../models/prismaClient.js";
import {
  BillingError,
  calculateTotals,
  createWithInvoiceNumber,
} from "../services/billing.service.js";
import { round2, serialize, toNum } from "../services/serialize.js";
import { billingSchema, zodMessage } from "../validators/puncher.validators.js";

const parseId = (v) => {
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : null;
};

const PAYMENT_MODES = ["CASH", "UPI", "CARD", "BANK_TRANSFER"];

/** GET /api/puncher/billings?status=&clientId= */
export const listBillings = async (req, res) => {
  try {
    const { status, clientId } = req.query;
    const where = { userId: req.user.id };
    if (["PENDING", "PAID", "CANCELLED"].includes(status)) where.status = status;
    if (parseId(clientId)) where.clientId = parseId(clientId);

    const billings = await prisma.puncherBilling.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        client: {
          select: { id: true, fullName: true, phone: true, vehicleType: true, regNumber: true },
        },
        _count: { select: { items: true } },
      },
    });

    return res.json(serialize(billings));
  } catch (err) {
    console.error("❌ listBillings error:", err);
    return res.status(500).json({ message: "Failed to load bills" });
  }
};

/** GET /api/puncher/billings/:id — full invoice */
export const getBilling = async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ message: "Invalid bill id" });

  try {
    const billing = await prisma.puncherBilling.findFirst({
      where: { id, userId: req.user.id },
      include: {
        client: true,
        items: { orderBy: { id: "asc" } },
        user: {
          select: {
            companyName: true,
            username: true,
            phone: true,
            email: true,
            address: true,
            gstNumber: true,
          },
        },
      },
    });
    if (!billing) return res.status(404).json({ message: "Bill not found" });

    const { user, ...rest } = billing;
    return res.json(serialize({ ...rest, shop: user }));
  } catch (err) {
    console.error("❌ getBilling error:", err);
    return res.status(500).json({ message: "Failed to load bill" });
  }
};

/**
 * POST /api/puncher/billings
 * { clientId, serviceIds[], extraItems[], discount, gstPercent, paymentMode, status, notes }
 * Each service can be billed once (unless its bill is cancelled).
 */
export const createBilling = async (req, res) => {
  const parsed = billingSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: zodMessage(parsed.error) });
  const input = parsed.data;
  const userId = req.user.id;

  try {
    const client = await prisma.puncherClient.findFirst({
      where: { id: input.clientId, userId },
    });
    if (!client) return res.status(404).json({ message: "Client not found" });

    const serviceIds = [...new Set(input.serviceIds)];
    const services = serviceIds.length
      ? await prisma.puncherService.findMany({
          where: { id: { in: serviceIds }, userId, clientId: client.id },
          include: {
            billingItems: { where: { billing: { status: { not: "CANCELLED" } } } },
          },
        })
      : [];

    if (services.length !== serviceIds.length) {
      return res
        .status(400)
        .json({ message: "Some selected services do not belong to this client." });
    }
    const alreadyBilled = services.filter((s) => s.billingItems.length > 0);
    if (alreadyBilled.length) {
      return res.status(409).json({
        message: `Already billed: ${alreadyBilled.map((s) => s.serviceName).join(", ")}`,
      });
    }
    if (services.some((s) => s.status === "CANCELLED")) {
      return res.status(400).json({ message: "Cancelled services cannot be billed." });
    }

    const items = [
      ...services.map((s) => ({
        serviceId: s.id,
        description: s.tyrePosition
          ? `${s.serviceName} (${s.tyrePosition.replace(/_/g, " ").toLowerCase()})`
          : s.serviceName,
        quantity: s.quantity,
        unitPrice: toNum(s.unitPrice),
        amount: round2(s.quantity * toNum(s.unitPrice)),
      })),
      ...input.extraItems.map((i) => ({
        serviceId: null,
        description: i.description,
        quantity: i.quantity,
        unitPrice: round2(i.unitPrice),
        amount: round2(i.quantity * i.unitPrice),
      })),
    ];

    const totals = calculateTotals(items, input);
    const isPaid = input.status === "PAID";
    if (isPaid && !input.paymentMode) {
      return res.status(400).json({ message: "Select a payment mode for a paid bill." });
    }

    const billing = await createWithInvoiceNumber(prisma, userId, (invoiceNumber) =>
      prisma.$transaction(async (tx) => {
        const created = await tx.puncherBilling.create({
          data: {
            invoiceNumber,
            userId,
            clientId: client.id,
            ...totals,
            paymentMode: input.paymentMode ?? null,
            status: input.status,
            paidAt: isPaid ? new Date() : null,
            notes: input.notes ?? null,
            items: { create: items },
          },
          include: { items: true, client: true },
        });

        // Billed work is finished work
        if (serviceIds.length) {
          await tx.puncherService.updateMany({
            where: { id: { in: serviceIds }, userId },
            data: { status: "COMPLETED" },
          });
        }
        return created;
      }),
    );

    return res.status(201).json(serialize(billing));
  } catch (err) {
    if (err instanceof BillingError) return res.status(err.status).json({ message: err.message });
    console.error("❌ createBilling error:", err);
    return res.status(500).json({ message: "Failed to create bill" });
  }
};

/** PATCH /api/puncher/billings/:id/pay { paymentMode } */
export const markBillingPaid = async (req, res) => {
  const id = parseId(req.params.id);
  const paymentMode = req.body?.paymentMode;
  if (!id) return res.status(400).json({ message: "Invalid bill id" });
  if (!PAYMENT_MODES.includes(paymentMode)) {
    return res.status(400).json({ message: "Select a valid payment mode" });
  }

  try {
    const result = await prisma.puncherBilling.updateMany({
      where: { id, userId: req.user.id, status: "PENDING" },
      data: { status: "PAID", paymentMode, paidAt: new Date() },
    });
    if (result.count === 0) {
      return res.status(409).json({ message: "Only pending bills can be marked as paid" });
    }
    return res.json({ id, status: "PAID", paymentMode });
  } catch (err) {
    console.error("❌ markBillingPaid error:", err);
    return res.status(500).json({ message: "Failed to update bill" });
  }
};

/** PATCH /api/puncher/billings/:id/cancel — frees its services for re-billing */
export const cancelBilling = async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ message: "Invalid bill id" });

  try {
    const result = await prisma.puncherBilling.updateMany({
      where: { id, userId: req.user.id, status: { not: "CANCELLED" } },
      data: { status: "CANCELLED" },
    });
    if (result.count === 0) {
      return res.status(404).json({ message: "Bill not found or already cancelled" });
    }
    return res.json({ id, status: "CANCELLED" });
  } catch (err) {
    console.error("❌ cancelBilling error:", err);
    return res.status(500).json({ message: "Failed to cancel bill" });
  }
};

/** DELETE /api/puncher/billings/:id — paid bills are kept for records */
export const deleteBilling = async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ message: "Invalid bill id" });

  try {
    const result = await prisma.puncherBilling.deleteMany({
      where: { id, userId: req.user.id, status: { not: "PAID" } },
    });
    if (result.count === 0) {
      return res
        .status(409)
        .json({ message: "Bill not found, or it is paid (paid bills can only be cancelled)" });
    }
    return res.json({ message: "Bill deleted" });
  } catch (err) {
    console.error("❌ deleteBilling error:", err);
    return res.status(500).json({ message: "Failed to delete bill" });
  }
};
