// server/services/OCRServices.js
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

/**
 * Create a new OCR record
 */
export const createRecord = async ({ userId, clientId, rawText, parsedData, confidence, imageUrl }) => {
    const client = await prisma.client.findUnique({ where: { id: clientId } });
    if (!client) throw new Error("Client not found");

    // Optional ownership enforcement:
    // if (client.userId !== userId) throw new Error("Not authorized for this client");

    const record = await prisma.ocrRecord.create({
        data: {
            userId,
            clientId,
            rawText,
            parsedData,
            confidence,
            imageUrl,
        },
    });

    return record;
};

/**
 * Fetch OCR history for a user (optionally filter by clientId)
 */
export const listRecords = async (userId, clientId) => {
    const where = { userId };
    if (clientId) where.clientId = clientId;

    return await prisma.ocrRecord.findMany({
        where,
        orderBy: { createdAt: "desc" },
    });
};

/**
 * Delete OCR record owned by user
 */
export const deleteRecord = async (userId, id) => {
    const record = await prisma.ocrRecord.findUnique({ where: { id } });
    if (!record) throw new Error("Record not found");
    if (record.userId !== userId) throw new Error("Not authorized");
    await prisma.ocrRecord.delete({ where: { id } });
    return true;
};
