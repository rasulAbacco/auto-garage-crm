// server/routes/clientRoutes.js
import express from "express";
import {
    getClients,
    getClientById,
    createClient,
    updateClient,
    deleteClient,
} from "../controllers/clientController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// All routes require auth
router.use(protect);

// CRUD
router.get("/", getClients);
router.get("/:id", getClientById);
router.post("/", createClient);
router.put("/:id", updateClient);
router.delete("/:id", deleteClient);

export default router;
