// server/routes/sparePartsRoutes.js
import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getSpareParts,
  getSparePartVendors,
} from "../controllers/sparePartsController.js";

const router = express.Router();

router.use(protect);

// ?vehicle=bike | car
router.get("/products", getSpareParts);
router.get("/vendors", getSparePartVendors);

export default router;