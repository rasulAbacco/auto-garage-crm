// server/routes/serviceRoutes.js
import express from "express";
import {
    getServices,
    getServiceById,
    getServicesByClient,
    createService,
    updateService,
    deleteService,
    getServiceTypes, // 👈 new endpoint for category + sub-services (optional)
} from "../controllers/serviceController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// 🔒 Protect all routes
router.use(protect);

/* ========================
   SERVICE MANAGEMENT ROUTES
   ======================== */

// 🟢 Get all services
router.get("/", getServices);

// 🟢 Get all services by a specific client
// ⚠️ Keep above "/:id" to avoid conflict
router.get("/client/:clientId", getServicesByClient);

// 🟢 Get a single service by ID
router.get("/:id", getServiceById);

// 🟢 Create new service
router.post("/", createService);

// 🟢 Update service
router.put("/:id", updateService);

// 🟢 Delete service
router.delete("/:id", deleteService);

// 🟢 Get all service categories + sub-services
// (for frontend dropdowns)
router.get("/types/list", getServiceTypes);

export default router;
