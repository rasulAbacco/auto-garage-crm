import prisma from "../models/prismaClient.js";
import { getOwnerUserId } from "../utils/getAdminId.js";

/* -----------------------------------------------------
   Helpers
----------------------------------------------------- */

// Fields returned for the bike on every reminder
const bikeSelect = {
  id: true,
  ownerName: true,
  phone: true,
  bikeBrand: true,
  bikeModel: true,
  regNumber: true,
};

// 15-day and 7-day alert times, calculated from the service date
const alertDates = (serviceDate) => {
  const remind15At = new Date(serviceDate);
  remind15At.setDate(remind15At.getDate() - 15);
  const remind7At = new Date(serviceDate);
  remind7At.setDate(remind7At.getDate() - 7);
  return { remind15At, remind7At };
};

// Accepts the schema names and older names some screens still send
const readBody = (body = {}) => ({
  bikeId: body.bikeId ?? body.bikeClientId,
  serviceDate: body.serviceDate ?? body.remindDate,
  note: body.note ?? body.message,
});

const parseDate = (value) => {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

const findOwnBike = (bikeId, ownerUserId) =>
  prisma.bike.findFirst({ where: { id: Number(bikeId), ownerUserId } });

const findOwnReminder = (id, ownerUserId) =>
  prisma.bikeReminder.findFirst({
    where: { id: Number(id), bike: { ownerUserId } },
  });

/* =====================================================
   GET ALL BIKE REMINDERS
   GET /api/bike-reminders
===================================================== */
export const getBikeReminders = async (req, res) => {
  try {
    const ownerUserId = getOwnerUserId(req.user);

    const reminders = await prisma.bikeReminder.findMany({
      where: { bike: { ownerUserId } },
      include: { bike: { select: bikeSelect } },
      orderBy: { serviceDate: "asc" },
    });

    res.json({ success: true, total: reminders.length, data: reminders });
  } catch (error) {
    console.error("getBikeReminders error:", error);
    res
      .status(500)
      .json({ success: false, message: "Error fetching bike reminders" });
  }
};

/* =====================================================
   GET SINGLE BIKE REMINDER
   GET /api/bike-reminders/:id
===================================================== */
export const getBikeReminderById = async (req, res) => {
  try {
    const ownerUserId = getOwnerUserId(req.user);

    const reminder = await prisma.bikeReminder.findFirst({
      where: { id: Number(req.params.id), bike: { ownerUserId } },
      include: { bike: { select: bikeSelect } },
    });

    if (!reminder) {
      return res
        .status(404)
        .json({ success: false, message: "Bike reminder not found" });
    }

    res.json({ success: true, data: reminder });
  } catch (error) {
    console.error("getBikeReminderById error:", error);
    res
      .status(500)
      .json({ success: false, message: "Error fetching bike reminder" });
  }
};

/* =====================================================
   CREATE BIKE REMINDER
   POST /api/bike-reminders
   Body: { bikeId, serviceDate, note? }
===================================================== */
export const createBikeReminder = async (req, res) => {
  try {
    const { bikeId, serviceDate, note } = readBody(req.body);

    if (!bikeId) {
      return res
        .status(400)
        .json({ success: false, message: "Please select a bike" });
    }
    const serviceDateObj = parseDate(serviceDate);
    if (!serviceDateObj) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Please choose a valid service date",
        });
    }

    const ownerUserId = getOwnerUserId(req.user);
    const bike = await findOwnBike(bikeId, ownerUserId);
    if (!bike) {
      return res
        .status(403)
        .json({ success: false, message: "Bike not found in your garage" });
    }

    const reminder = await prisma.bikeReminder.create({
      data: {
        bikeId: bike.id,
        userId: req.user.id,
        serviceDate: serviceDateObj,
        note: note?.trim() || null,
        ...alertDates(serviceDateObj),
      },
      include: { bike: { select: bikeSelect } },
    });

    res
      .status(201)
      .json({ success: true, message: "Reminder created", data: reminder });
  } catch (error) {
    console.error("createBikeReminder error:", error);
    res
      .status(500)
      .json({ success: false, message: "Error creating bike reminder" });
  }
};

/* =====================================================
   UPDATE BIKE REMINDER
   PUT /api/bike-reminders/:id
   Body: any of { bikeId, serviceDate, note }
===================================================== */
export const updateBikeReminder = async (req, res) => {
  try {
    const ownerUserId = getOwnerUserId(req.user);
    const existing = await findOwnReminder(req.params.id, ownerUserId);

    if (!existing) {
      return res
        .status(404)
        .json({ success: false, message: "Bike reminder not found" });
    }

    const { bikeId, serviceDate, note } = readBody(req.body);
    const data = {};

    if (note !== undefined) data.note = note?.trim() || null;

    if (bikeId !== undefined && Number(bikeId) !== existing.bikeId) {
      const bike = await findOwnBike(bikeId, ownerUserId);
      if (!bike) {
        return res
          .status(403)
          .json({ success: false, message: "Bike not found in your garage" });
      }
      data.bikeId = bike.id;
    }

    if (serviceDate !== undefined) {
      const newDate = parseDate(serviceDate);
      if (!newDate) {
        return res
          .status(400)
          .json({
            success: false,
            message: "Please choose a valid service date",
          });
      }
      // Date changed → recalculate alerts and allow them to be sent again
      if (newDate.getTime() !== new Date(existing.serviceDate).getTime()) {
        Object.assign(data, alertDates(newDate), {
          serviceDate: newDate,
          sent15: false,
          sent7: false,
        });
      }
    }

    const updated = await prisma.bikeReminder.update({
      where: { id: existing.id },
      data,
      include: { bike: { select: bikeSelect } },
    });

    res.json({
      success: true,
      message: "Bike reminder updated successfully",
      data: updated,
    });
  } catch (error) {
    console.error("updateBikeReminder error:", error);
    res
      .status(500)
      .json({ success: false, message: "Error updating bike reminder" });
  }
};

/* =====================================================
   DELETE BIKE REMINDER
   DELETE /api/bike-reminders/:id
===================================================== */
export const deleteBikeReminder = async (req, res) => {
  try {
    const ownerUserId = getOwnerUserId(req.user);
    const reminder = await findOwnReminder(req.params.id, ownerUserId);

    if (!reminder) {
      return res
        .status(404)
        .json({ success: false, message: "Bike reminder not found" });
    }

    await prisma.bikeReminder.delete({ where: { id: reminder.id } });

    res.json({ success: true, message: "Bike reminder deleted successfully" });
  } catch (error) {
    console.error("deleteBikeReminder error:", error);
    res
      .status(500)
      .json({ success: false, message: "Error deleting bike reminder" });
  }
};
