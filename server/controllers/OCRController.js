// server/controllers/OCRControllers.js
// server/controllers/OCRController.js
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

import { parseOCRText } from "../utils/OCRUtils.js";
import * as ocrService from "../services/OCRServices.js";

export const uploadRecord = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ error: "Unauthorized" });

        const { clientId, rawText, confidence, parsedData } = req.body;
        if (!clientId) return res.status(400).json({ error: "clientId is required" });

        let imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

        let parsed = null;
        if (parsedData) {
            try {
                parsed = typeof parsedData === "string" ? JSON.parse(parsedData) : parsedData;
            } catch {
                parsed = null;
            }
        }

        const conf = confidence ? parseFloat(confidence) : null;

        if (!parsed && rawText) parsed = parseOCRText(rawText, conf || 0);

        /* 🔥 DUPLICATE CHECK */
        const regNo = parsed?.regNo?.trim();

        if (regNo) {
          const existing = await prisma.ocrRecord.findFirst({
            where: {
              parsedData: {
                path: ["regNo"], // JSON path
                string_contains: regNo, // match string inside that key
              },
            },
            include: {
              client: true,
            },
          });

          if (existing) {
            return res.status(400).json({
              success: false,
              duplicate: true,
              message: `This RC (${regNo}) is already registered to ${existing.client.fullName}`,
              clientName: existing.client.fullName,
              clientId: existing.client.id,
            });
          }
        }


        /* SAVE NEW RECORD */
        const record = await ocrService.createRecord({
            userId,
            clientId: parseInt(clientId, 10),
            rawText: rawText || "",
            parsedData: parsed || {},
            confidence: conf || null,
            imageUrl,
        });

        res.status(201).json({ success: true, record });
    } catch (err) {
        next(err);
    }
};


export const listRecords = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ error: "Unauthorized" });

        const clientId = req.query.clientId ? parseInt(req.query.clientId, 10) : null;
        const records = await ocrService.listRecords(userId, clientId);
        res.json(records);
    } catch (err) {
        next(err);
    }
};

export const deleteRecord = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ error: "Unauthorized" });

        const id = parseInt(req.params.id, 10);
        await ocrService.deleteRecord(userId, id);
        res.json({ ok: true });
    } catch (err) {
        next(err);
    }
};

export const listAllRecords = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        const role = req.user?.role;
        if (role !== "admin") return res.status(403).json({ error: "Forbidden" });
        const records = await prisma.ocrRecord.findMany({
            orderBy: { createdAt: "desc" },
            include: { client: true, user: true },
        });
        res.json(records);
    } catch (err) {
        next(err);
    }
};
