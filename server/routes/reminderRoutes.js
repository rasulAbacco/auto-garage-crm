import express from "express";
import {
    getReminders,
    getReminderById,
    createReminder,
    updateReminder,
    deleteReminder,
} from "../controllers/reminderController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// ✅ Fetch all reminders or create a new one
router.route("/")
    .get(protect, getReminders)
    .post(protect, createReminder);

// ✅ Fetch, update, or delete a specific reminder by ID
router.route("/:id")
    .get(protect, getReminderById)
    .put(protect, updateReminder)
    .delete(protect, deleteReminder);

export default router;
