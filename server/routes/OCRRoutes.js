// server/routes/OCRRoutes.js
import express from "express";
import multer from "multer";
import path from "path";
import { ensureAuth } from "../utils/OCRUtils.js";
import { protect } from "../middleware/authMiddleware.js";
import * as ocrController from "../controllers/OCRController.js";

const router = express.Router();

// Configure upload directory (ensure folder exists)
const UPLOAD_DIR = process.env.UPLOAD_DIR || "./uploads/ocr";
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const name = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
        cb(null, name);
    },
});
const upload = multer({ storage, limits: { fileSize: 8 * 1024 * 1024 } }); // 8MB

// OCR routes (protected)
router.post("/upload", ensureAuth, upload.single("image"), ocrController.uploadRecord);
router.get("/history", ensureAuth, ocrController.listRecords);
router.delete("/:id", ensureAuth, ocrController.deleteRecord);
router.get("/all", ensureAuth, ocrController.listAllRecords);


export default router;
