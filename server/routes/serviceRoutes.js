// server/routes/serviceRoutes.js
import express from "express";
import {
    getServices,
    getServiceById,
    getServicesByClient,
    createService,
    updateService,
    deleteService,
    getServiceTypes,
} from "../controllers/serviceController.js";
import { protect } from "../middleware/authMiddleware.js";
import multer from "multer";

const router = express.Router();

// ✅ Multer memory storage for binary DB storage
const upload = multer({ storage: multer.memoryStorage() });

/* ========================
   SERVICE MANAGEMENT ROUTES
   ======================== */

// ✅ Service types route must be BEFORE :id
router.get("/list", protect, getServiceTypes);

// ✅ List services
router.get("/", protect, getServices);

// ✅ Services by client
router.get("/client/:clientId", protect, getServicesByClient);

// ✅ Get single service
router.get("/:id", protect, getServiceById);

// ✅ Create service (multer must run BEFORE protect)
router.post("/", upload.array("media", 20), protect, createService);

// ✅ Update service (multer must run BEFORE protect)
router.put("/:id", upload.array("media", 20), protect, updateService);

// ✅ Delete service
router.delete("/:id", protect, deleteService);

export default router;



// // server/routes/serviceRoutes.js
// import express from "express";
// import {
//     getServices,
//     getServiceById,
//     getServicesByClient,
//     createService,
//     updateService,
//     deleteService,
//     getServiceTypes, // 👈 new endpoint for category + sub-services (optional)
// } from "../controllers/serviceController.js";
// import { protect } from "../middleware/authMiddleware.js";

// const router = express.Router();

// // 🔒 Protect all routes
// router.use(protect);

// /* ========================
//    SERVICE MANAGEMENT ROUTES
//    ======================== */

// // 🟢 Get all services
// router.get("/", getServices);

// // 🟢 Get all services by a specific client
// // ⚠️ Keep above "/:id" to avoid conflict
// router.get("/client/:clientId", getServicesByClient);

// // 🟢 Get a single service by ID
// router.get("/:id", getServiceById);

// // 🟢 Create new service
// router.post("/", createService);

// // 🟢 Update service
// router.put("/:id", updateService);

// // 🟢 Delete service
// router.delete("/:id", deleteService);

// // 🟢 Get all service categories + sub-services
// // (for frontend dropdowns)
// router.get("/types/list", getServiceTypes);

// export default router;
