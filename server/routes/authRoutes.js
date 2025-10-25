import express from "express";
import { registerUser, loginUser, getProfile, verifyToken } from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Auth routes
router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/profile", protect, getProfile);
router.get("/verify", protect, getProfile);

export default router;
