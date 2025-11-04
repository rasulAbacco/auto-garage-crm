// server/routes/reportRoutes.js
import express from "express";
import {
    getRevenueSummary,
    getTopClients,
    getServiceStats,
    getInvoiceStatusSummary,
    getFullInvoiceDetails,
} from "../controllers/reportController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/revenue", protect, getRevenueSummary);
router.get("/top-clients", protect, getTopClients);
router.get("/services", protect, getServiceStats);
router.get("/invoices", protect, getInvoiceStatusSummary);
router.get("/invoice/:id", protect, getFullInvoiceDetails); // <-- new route

export default router;
