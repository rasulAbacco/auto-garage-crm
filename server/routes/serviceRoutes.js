import express from "express";
import {
    getServices,
    getServiceById,
    getServicesByClient,
    createService,
    updateService,
    deleteService,
} from "../controllers/serviceController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

// Standard CRUD
router.get("/", getServices);
router.get("/:id", getServiceById);
router.get("/client/:clientId", getServicesByClient);
router.post("/", createService);
router.put("/:id", updateService);
router.delete("/:id", deleteService);

export default router;
