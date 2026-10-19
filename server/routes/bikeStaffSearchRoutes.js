// server/routes/bikeStaffSearchRoutes.js
import express from "express";
import { getBikeMechanics } from "../controllers/bikeStaffSearchController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/mechanics", protect, getBikeMechanics);

export default router;
