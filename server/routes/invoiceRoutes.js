/// server/routes/invoiceRoutes.js
import express from "express";
import {
    getInvoices,
    getInvoiceById,
    createInvoice,
    updateInvoice,
    deleteInvoice,
    getClients,
    getClientById,
} from "../controllers/invoiceController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// All routes protected
router.use(protect);

router.get("/", getInvoices);
router.get("/:id", getInvoiceById);
router.post("/", createInvoice);
router.put("/:id", updateInvoice);
router.delete("/:id", deleteInvoice);
// router.get("/", getClients);       // Lightweight paginated list
// router.get("/:id", getClientById); // Full detailed view for one client

export default router;
