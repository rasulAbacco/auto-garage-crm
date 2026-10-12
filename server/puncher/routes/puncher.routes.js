// server/puncher/routes/puncher.routes.js
/**
 * 🛞 PUNCHER SHOP CRM — mounted at /api/puncher
 * Every route: valid JWT (protect) + Puncher Shop owner session (requirePuncherAccess).
 */
import express from "express";
import { protect } from "../../middleware/authMiddleware.js";
import { requirePuncherAccess } from "../middleware/puncherAccess.js";

import { getShop, updateShop, getCatalog } from "../controllers/shop.controller.js";
import { getDashboard } from "../controllers/dashboard.controller.js";
import {
  listClients,
  getClient,
  createClient,
  updateClient,
  deleteClient,
} from "../controllers/client.controller.js";
import {
  listServices,
  getService,
  createService,
  updateService,
  updateServiceStatus,
  deleteService,
} from "../controllers/service.controller.js";
import {
  listBillings,
  getBilling,
  createBilling,
  markBillingPaid,
  cancelBilling,
  deleteBilling,
} from "../controllers/billing.controller.js";

const router = express.Router();

router.use(protect, requirePuncherAccess);

// Shop profile & catalog
router.get("/shop", getShop);
router.put("/shop", updateShop);
router.get("/catalog", getCatalog);
router.get("/dashboard", getDashboard);

// Clients
router.get("/clients", listClients);
router.get("/clients/:id", getClient);
router.post("/clients", createClient);
router.put("/clients/:id", updateClient);
router.delete("/clients/:id", deleteClient);

// Services
router.get("/services", listServices);
router.get("/services/:id", getService);
router.post("/services", createService);
router.put("/services/:id", updateService);
router.patch("/services/:id/status", updateServiceStatus);
router.delete("/services/:id", deleteService);

// Billings
router.get("/billings", listBillings);
router.get("/billings/:id", getBilling);
router.post("/billings", createBilling);
router.patch("/billings/:id/pay", markBillingPaid);
router.patch("/billings/:id/cancel", cancelBilling);
router.delete("/billings/:id", deleteBilling);

export default router;
