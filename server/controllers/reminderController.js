// server/controllers/reminderController.js
import prisma from "../models/prismaClient.js";

/* -------------------------------------------------------
   Utility: Subtract days from date
--------------------------------------------------------*/
function subtractDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() - days);
  return d;
}

/* -------------------------------------------------------
   Utility: Does the logged-in user own this reminder?
--------------------------------------------------------*/
function canAccess(reminder, req) {
  // Reminders created without a user (legacy rows) are accessible to anyone logged in
  if (!reminder.userId || !req.user?.id) return true;
  return reminder.userId === req.user.id;
}

/* =======================================================
   GET ALL REMINDERS (WITH TIME-RANGE FILTERING)
======================================================= */
export const getReminders = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { range } = req.query;

    const where = userId ? { userId } : {};

    if (range && range !== "all") {
      const now = new Date();
      let startDate;
      let endDate;

      if (range === "week") {
        const currentDay = now.getDay();
        startDate = new Date(now);
        startDate.setDate(now.getDate() - currentDay);
        startDate.setHours(0, 0, 0, 0);

        endDate = new Date(now);
        endDate.setDate(now.getDate() + (6 - currentDay));
        endDate.setHours(23, 59, 59, 999);
      } else if (range === "month") {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
        endDate = new Date(
          now.getFullYear(),
          now.getMonth() + 1,
          0,
          23,
          59,
          59,
          999,
        );
      } else if (range === "year") {
        startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
        endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
      }

      if (startDate && endDate) {
        where.serviceDate = { gte: startDate, lte: endDate };
      }
    }

    const reminders = await prisma.reminder.findMany({
      where,
      include: {
        client: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            vehicleMake: true,
            vehicleModel: true,
            regNumber: true,
          },
        },
        user: { select: { id: true, username: true } },
      },
      orderBy: { serviceDate: "asc" },
    });

    return res
      .status(200)
      .json({ success: true, total: reminders.length, data: reminders });
  } catch (error) {
    console.error("❌ Error fetching reminders:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching reminders",
      error: error.message,
    });
  }
};

/* =======================================================
   GET SINGLE REMINDER
======================================================= */
export const getReminderById = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid reminder id" });
    }

    const reminder = await prisma.reminder.findUnique({
      where: { id },
      include: { client: true, user: { select: { id: true, username: true } } },
    });

    if (!reminder || !canAccess(reminder, req)) {
      return res
        .status(404)
        .json({ success: false, message: "Reminder not found" });
    }

    return res.json({ success: true, data: reminder });
  } catch (error) {
    console.error("❌ Error fetching reminder:", error);
    return res
      .status(500)
      .json({ success: false, message: "Error fetching reminder" });
  }
};

/* =======================================================
   CREATE REMINDER
======================================================= */
export const createReminder = async (req, res) => {
  try {
    const { clientId, serviceDate, note } = req.body;

    if (!clientId || !serviceDate) {
      return res
        .status(400)
        .json({
          success: false,
          message: "clientId and serviceDate are required",
        });
    }

    const parsedClientId = parseInt(clientId, 10);
    if (isNaN(parsedClientId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid clientId" });
    }

    const serviceDateObj = new Date(serviceDate);
    if (isNaN(serviceDateObj.getTime())) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid serviceDate" });
    }

    const reminder = await prisma.reminder.create({
      data: {
        clientId: parsedClientId,
        userId: req.user?.id || null,
        serviceDate: serviceDateObj,
        note: note || null,
        remind15At: subtractDays(serviceDateObj, 15),
        remind7At: subtractDays(serviceDateObj, 7),
      },
      include: { client: true, user: { select: { id: true, username: true } } },
    });

    return res.status(201).json({
      success: true,
      message: "Reminder created successfully",
      data: reminder,
    });
  } catch (error) {
    console.error("❌ Error creating reminder:", error);
    return res.status(500).json({
      success: false,
      message: "Error creating reminder",
      error: error.message,
    });
  }
};

/* =======================================================
   UPDATE REMINDER
   Body may include: note, serviceDate, clientId, completed
   - completed: true  -> stops all WhatsApp alerts (sent15 + sent7 = true)
   - completed: false -> re-opens the reminder (flags reset)
======================================================= */
export const updateReminder = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid reminder id" });
    }

    const existing = await prisma.reminder.findUnique({ where: { id } });

    if (!existing || !canAccess(existing, req)) {
      return res
        .status(404)
        .json({ success: false, message: "Reminder not found" });
    }

    const updatedData = {};

    if (req.body.note !== undefined) {
      updatedData.note = req.body.note || null;
    }

    // If serviceDate is updated, recalculate reminder dates and reset flags
    if (req.body.serviceDate) {
      const newServiceDate = new Date(req.body.serviceDate);
      if (isNaN(newServiceDate.getTime())) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid serviceDate" });
      }
      updatedData.serviceDate = newServiceDate;
      updatedData.remind15At = subtractDays(newServiceDate, 15);
      updatedData.remind7At = subtractDays(newServiceDate, 7);
      updatedData.sent15 = false;
      updatedData.sent7 = false;
    }

    if (req.body.clientId) {
      const parsedClientId = Number(req.body.clientId);
      if (isNaN(parsedClientId)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid clientId" });
      }
      updatedData.clientId = parsedClientId;
    }

    // Mark complete / reopen (also accepts legacy `sent` field from older UI)
    const completed =
      typeof req.body.completed === "boolean"
        ? req.body.completed
        : typeof req.body.sent === "boolean"
          ? req.body.sent
          : undefined;

    if (completed !== undefined) {
      updatedData.sent15 = completed;
      updatedData.sent7 = completed;
    }

    if (Object.keys(updatedData).length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Nothing to update" });
    }

    const updatedReminder = await prisma.reminder.update({
      where: { id },
      data: updatedData,
      include: { client: true, user: { select: { id: true, username: true } } },
    });

    return res.json({
      success: true,
      message: "Reminder updated successfully",
      data: updatedReminder,
    });
  } catch (error) {
    console.error("❌ Error updating reminder:", error);
    return res.status(500).json({
      success: false,
      message: "Error updating reminder",
      error: error.message,
    });
  }
};

/* =======================================================
   DELETE REMINDER
======================================================= */
export const deleteReminder = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid reminder id" });
    }

    const reminder = await prisma.reminder.findUnique({ where: { id } });

    if (!reminder || !canAccess(reminder, req)) {
      return res
        .status(404)
        .json({ success: false, message: "Reminder not found" });
    }

    await prisma.reminder.delete({ where: { id } });

    return res.json({
      success: true,
      message: "Reminder deleted successfully",
    });
  } catch (error) {
    console.error("❌ Error deleting reminder:", error);
    return res.status(500).json({
      success: false,
      message: "Error deleting reminder",
      error: error.message,
    });
  }
};
