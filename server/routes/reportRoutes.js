// server/routes/reportRoutes.js
import express from "express";
import {
    getRevenueSummary,
    getTopClients,
    getServiceStats,
    getInvoiceStatusSummary,
    getFullInvoiceDetails,
    getReportsSummary,
    getServicesList,
} from "../controllers/reportController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

/* ================================
   💰 Revenue & Invoices Reports
================================ */
router.get("/revenue", protect, getRevenueSummary);
router.get("/invoices", protect, getInvoiceStatusSummary);
router.get("/invoice/:id", protect, getFullInvoiceDetails);

/* ================================
   👥 Client Reports
================================ */
router.get("/top-clients", protect, getTopClients);

/* ================================
   🔧 Service Reports
================================ */
router.get("/services", protect, getServiceStats); // basic grouped stats (existing)

router.get("/all-services", protect, getServicesList); // for general frontend usage (e.g., recent services list)

/* ================================
   📊 Combined Reports Summary
================================ */
router.get("/summary", protect, getReportsSummary);

export default router;
