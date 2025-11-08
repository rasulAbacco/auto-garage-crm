// server/controllers/serviceController.js
import prisma from "../models/prismaClient.js";

/**
 * Convert a media file record to a data: URI string (defensive for Buffers, Uint8Array, Array, base64 strings).
 * Expects file to have at least: { data, mimeType, type } where data may be Buffer/Uint8Array/Array/string.
 */
function toDataUri(file) {
    if (!file) return null;
    const mime = file.mimeType || file.type || "application/octet-stream";

    // If there is no data property, return null
    if (file.data === undefined || file.data === null) return null;

    // If already a full data URI, return as-is
    if (typeof file.data === "string") {
        if (file.data.startsWith("data:")) return file.data;
        // If it's a base64 string (no data: prefix), prefix it
        return `data:${mime};base64,${file.data}`;
    }

    // If it's an Array (e.g. [137,80,78,...]) or Uint8Array or Buffer
    try {
        // If it's an Array of numbers
        if (Array.isArray(file.data)) {
            const buf = Buffer.from(file.data);
            return `data:${mime};base64,${buf.toString("base64")}`;
        }

        // If it's an ArrayBuffer (e.g. Web API), convert to Buffer
        if (file.data instanceof ArrayBuffer) {
            const buf = Buffer.from(new Uint8Array(file.data));
            return `data:${mime};base64,${buf.toString("base64")}`;
        }

        // If it's a typed array (Uint8Array, etc.)
        if (ArrayBuffer.isView(file.data)) {
            const buf = Buffer.from(file.data);
            return `data:${mime};base64,${buf.toString("base64")}`;
        }

        // If it's a Buffer already
        if (Buffer.isBuffer(file.data)) {
            return `data:${mime};base64,${file.data.toString("base64")}`;
        }

        // Fallback: attempt to Buffer.from it (handles many cases)
        const buf = Buffer.from(file.data);
        return `data:${mime};base64,${buf.toString("base64")}`;
    } catch (err) {
        console.warn("toDataUri: failed to convert file.data to base64", err);
        return null;
    }
}

/**
 * Map an array of media file records to the API-friendly shape.
 * Ensures `data` is a proper data:<mime>;base64,... string (or null).
 */
function mapMediaFiles(mediaFiles = []) {
    if (!Array.isArray(mediaFiles)) return [];
    return mediaFiles.map((f) => ({
        id: f.id,
        fileName: f.fileName || f.name || null,
        mimeType: f.mimeType || f.type || null,
        data: toDataUri(f),
    }));
}

/* ============================================================
   📦 Get All Services
   @route   GET /api/services
   @access  Private
============================================================ */
export const getServices = async (req, res) => {
    try {
        const services = await prisma.service.findMany({
            include: {
                client: { select: { id: true, fullName: true, regNumber: true } },
                category: { select: { id: true, name: true } },
                subService: { select: { id: true, name: true } },
                mediaFiles: true,
            },
            orderBy: { date: "desc" },
        });

        const formatted = services.map((s) => ({
            ...s,
            mediaFiles: mapMediaFiles(s.mediaFiles),
        }));

        return res.json(formatted);
    } catch (error) {
        console.error("❌ Error fetching services:", error);
        return res.status(500).json({ message: "Error fetching services" });
    }
};

/* ============================================================
   👤 Get All Services by a Specific Client
   @route   GET /api/services/client/:clientId
   @access  Private
============================================================ */
export const getServicesByClient = async (req, res) => {
    try {
        const { clientId } = req.params;
        if (!clientId || isNaN(Number(clientId))) {
            return res.status(400).json({ message: "Invalid client ID" });
        }

        const client = await prisma.client.findUnique({
            where: { id: parseInt(clientId) },
            include: {
                services: {
                    include: {
                        category: { select: { id: true, name: true } },
                        subService: { select: { id: true, name: true } },
                        mediaFiles: true,
                    },
                    orderBy: { date: "desc" },
                },
            },
        });

        if (!client) return res.status(404).json({ message: "Client not found" });
        if (!client.services.length)
            return res.status(404).json({ message: "No services found for this client" });

        // Normalize any mediaFiles inside services
        const servicesWithMedia = client.services.map((s) => ({
            ...s,
            mediaFiles: mapMediaFiles(s.mediaFiles),
        }));

        res.status(200).json({
            client: {
                id: client.id,
                fullName: client.fullName,
                regNumber: client.regNumber,
                vehicleMake: client.vehicleMake,
                vehicleModel: client.vehicleModel,
            },
            services: servicesWithMedia,
        });
    } catch (error) {
        console.error("❌ Error fetching services by client:", error);
        res.status(500).json({ message: "Error fetching services for client" });
    }
};

/* ============================================================
   🔍 Get a Single Service by ID
   @route   GET /api/services/:id
   @access  Private
============================================================ */
export const getServiceById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id || isNaN(Number(id))) {
            return res.status(400).json({ message: "Invalid or missing service ID" });
        }

        const service = await prisma.service.findUnique({
            where: { id: parseInt(id) },
            include: {
                client: true,
                category: true,
                subService: true,
                mediaFiles: true,
            },
        });

        if (!service) return res.status(404).json({ message: "Service not found" });

        const modified = {
            ...service,
            mediaFiles: mapMediaFiles(service.mediaFiles),
        };

        res.json(modified);
    } catch (error) {
        console.error("❌ Error fetching service:", error);
        res.status(500).json({ message: "Error fetching service" });
    }
};

/* ============================================================
   ➕ Create a New Service (with GST fields)
   @route   POST /api/services
   @access  Private
============================================================ */
export const createService = async (req, res) => {
    try {
        const {
            clientId,
            categoryId,
            subServiceId,
            notes,
            date,
            partsCost,
            laborCost,
            partsGst,
            laborGst,
            cost,
            status,
        } = req.body;

        if (!clientId || !date) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        const pCost = parseFloat(partsCost || 0);
        const lCost = parseFloat(laborCost || 0);
        const pGst = parseFloat(partsGst || 0);
        const lGst = parseFloat(laborGst || 0);

        const computedCost =
            cost !== undefined && cost !== null
                ? parseFloat(cost)
                : pCost + (pCost * pGst) / 100 + lCost + (lCost * lGst) / 100;

        const service = await prisma.service.create({
            data: {
                date: new Date(date),
                partsCost: pCost,
                partsGst: pGst,
                laborCost: lCost,
                laborGst: lGst,
                cost: computedCost,
                status: status || "Pending",
                notes: notes || null,
                clientId: parseInt(clientId),
                categoryId: categoryId ? parseInt(categoryId) : null,
                subServiceId: subServiceId ? parseInt(subServiceId) : null,
            },
        });

        // Save media to DB as binary
        if (req.files?.length) {
            for (const file of req.files) {
                await prisma.serviceMedia.create({
                    data: {
                        serviceId: service.id,
                        fileName: file.originalname,
                        mimeType: file.mimetype,
                        data: file.buffer,
                    },
                });
            }
        }

        const media = await prisma.serviceMedia.findMany({
            where: { serviceId: service.id },
        });

        res.status(201).json({
            message: "Service created successfully",
            service: {
                ...service,
                mediaFiles: mapMediaFiles(media),
            },
        });
    } catch (error) {
        console.error("Error creating service:", error);
        res.status(500).json({ message: "Error creating service" });
    }
};

/* ============================================================
   ✏️ Update Existing Service (with GST fields)
   @route   PUT /api/services/:id
   @access  Private
============================================================ */
export const updateService = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id || isNaN(Number(id))) {
            return res.status(400).json({ message: "Invalid service ID" });
        }

        const {
            clientId,
            categoryId,
            subServiceId,
            notes,
            date,
            partsCost,
            laborCost,
            partsGst,
            laborGst,
            cost,
            status,
        } = req.body;

        const pCost = parseFloat(partsCost || 0);
        const lCost = parseFloat(laborCost || 0);
        const pGst = parseFloat(partsGst || 0);
        const lGst = parseFloat(laborGst || 0);

        const computedCost =
            cost !== undefined && cost !== null
                ? parseFloat(cost)
                : pCost + (pCost * pGst) / 100 + lCost + (lCost * lGst) / 100;

        const updateData = {
            date: date ? new Date(date) : undefined,
            partsCost: isNaN(pCost) ? undefined : pCost,
            partsGst: isNaN(pGst) ? undefined : pGst,
            laborCost: isNaN(lCost) ? undefined : lCost,
            laborGst: isNaN(lGst) ? undefined : lGst,
            cost: computedCost,
            status,
            notes: notes || undefined,
            clientId: clientId ? parseInt(clientId) : undefined,
            categoryId: categoryId ? parseInt(categoryId) : undefined,
            subServiceId: subServiceId ? parseInt(subServiceId) : undefined,
        };

        Object.keys(updateData).forEach((k) => updateData[k] === undefined && delete updateData[k]);

        const updatedService = await prisma.service.update({
            where: { id: parseInt(id) },
            data: updateData,
        });

        // Save uploaded files
        if (req.files?.length) {
            for (const file of req.files) {
                await prisma.serviceMedia.create({
                    data: {
                        serviceId: updatedService.id,
                        fileName: file.originalname,
                        mimeType: file.mimetype,
                        data: file.buffer,
                    },
                });
            }
        }

        const media = await prisma.serviceMedia.findMany({
            where: { serviceId: updatedService.id },
        });

        res.json({
            message: "Service updated successfully",
            service: {
                ...updatedService,
                mediaFiles: mapMediaFiles(media),
            },
        });
    } catch (error) {
        console.error("Error updating service:", error);
        res.status(500).json({ message: "Error updating service" });
    }
};

/* ============================================================
   🗑️ Delete Service
   @route   DELETE /api/services/:id
   @access  Private
============================================================ */
export const deleteService = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id || isNaN(Number(id))) {
            return res.status(400).json({ message: "Invalid service ID" });
        }

        const service = await prisma.service.findUnique({
            where: { id: parseInt(id) },
        });

        if (!service) return res.status(404).json({ message: "Service not found" });

        await prisma.service.delete({ where: { id: parseInt(id) } });

        res.json({ message: "🗑️ Service deleted successfully" });
    } catch (error) {
        console.error("❌ Error deleting service:", error);
        res.status(500).json({ message: "Error deleting service" });
    }
};

/* ============================================================
   📘 Get Service Types (Categories + SubServices)
   @route   GET /api/services/types/list
   @access  Private
============================================================ */
export const getServiceTypes = async (req, res) => {
    try {
        const categories = await prisma.serviceCategory.findMany({
            include: {
                subServices: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
            orderBy: { id: "asc" },
        });

        res.status(200).json(categories);
    } catch (error) {
        console.error("❌ Error fetching service types:", error);
        res.status(500).json({ message: "Error fetching service types" });
    }
};







// // server/controllers/serviceController.js
// import prisma from "../models/prismaClient.js";


// // --- paste this near the top of serviceController.js ---

// /**
//  * Convert a media file record to a data: URI string (defensive for Buffers, Uint8Array, base64 strings).
//  * Expects file to have at least: { data, mimeType, type } where data may be Buffer/Uint8Array/string.
//  */
// function toDataUri(file) {
//     if (!file) return null;
//     const mime = file.mimeType || file.type || 'application/octet-stream';

//     // if already a full data URI, return as-is
//     if (typeof file.data === 'string') {
//         if (file.data.startsWith('data:')) return file.data;
//         // assume raw base64 string -> prefix it
//         return `data:${mime};base64,${file.data}`;
//     }

//     // for Buffer / Uint8Array / ArrayBuffer
//     try {
//         // Buffer.isBuffer works in Node; if not Buffer, convert
//         const buf = Buffer.isBuffer(file.data) ? file.data : Buffer.from(file.data);
//         const b64 = buf.toString('base64');
//         return `data:${mime};base64,${b64}`;
//     } catch (err) {
//         console.warn('toDataUri: failed to convert file.data to base64', err);
//         return null;
//     }
// }

// /**
//  * Map an array of media file records to the API-friendly shape.
//  */
// function mapMediaFiles(mediaFiles = []) {
//     return mediaFiles.map(f => ({
//         id: f.id,
//         fileName: f.fileName || f.name || null,
//         mimeType: f.mimeType || f.type || null,
//         data: toDataUri(f)
//     }));
// }

// /* ============================================================
//    📦 Get All Services
//    @route   GET /api/services
//    @access  Private
// ============================================================ */
// export const getServices = async (req, res) => {
//     try {
//         const services = await prisma.service.findMany({
//             include: {
//                 client: { select: { id: true, fullName: true, regNumber: true } },
//                 category: { select: { id: true, name: true } },
//                 subService: { select: { id: true, name: true } },
//                 mediaFiles: true, // include media
//             },
//             orderBy: { date: "desc" },
//         });

//         // Use the shared mapper so each media file's `data` is a proper data: URI
//         // ✅ Convert binary → proper Base64 using shared mapper
//         const formatted = services.map(s => ({
//             ...s,
//             mediaFiles: mapMediaFiles(s.mediaFiles),
//         }));


//         return res.json(formatted);
//     } catch (error) {
//         console.error("❌ Error fetching services:", error);
//         return res.status(500).json({ message: "Error fetching services" });
//     }
// };





// /* ============================================================
//    👤 Get All Services by a Specific Client
//    @route   GET /api/services/client/:clientId
//    @access  Private
// ============================================================ */
// export const getServicesByClient = async (req, res) => {
//     try {
//         const { clientId } = req.params;
//         if (!clientId || isNaN(Number(clientId))) {
//             return res.status(400).json({ message: "Invalid client ID" });
//         }

//         const client = await prisma.client.findUnique({
//             where: { id: parseInt(clientId) },
//             include: {
//                 services: {
//                     include: {
//                         category: { select: { id: true, name: true } },
//                         subService: { select: { id: true, name: true } },
//                     },
//                     orderBy: { date: "desc" },
//                 },
//             },
//         });

//         if (!client) return res.status(404).json({ message: "Client not found" });
//         if (!client.services.length)
//             return res.status(404).json({ message: "No services found for this client" });

//         res.status(200).json({
//             client: {
//                 id: client.id,
//                 fullName: client.fullName,
//                 regNumber: client.regNumber,
//                 vehicleMake: client.vehicleMake,
//                 vehicleModel: client.vehicleModel,
//             },
//             services: client.services,
//         });
//     } catch (error) {
//         console.error("❌ Error fetching services by client:", error);
//         res.status(500).json({ message: "Error fetching services for client" });
//     }
// };

// /* ============================================================
//    🔍 Get a Single Service by ID
//    @route   GET /api/services/:id
//    @access  Private
// ============================================================ */
// // export const getServiceById = async (req, res) => {
// //     try {
// //         const { id } = req.params;
// //         if (!id || isNaN(Number(id))) {
// //             return res.status(400).json({ message: "Invalid or missing service ID" });
// //         }

// //         const service = await prisma.service.findUnique({
// //             where: { id: parseInt(id) },
// //             include: {
// //                 client: {
// //                     select: {
// //                         id: true,
// //                         fullName: true,
// //                         vehicleModel: true,
// //                         vehicleMake: true,
// //                         regNumber: true,
// //                     },
// //                 },
// //                 category: { select: { id: true, name: true } },
// //                 subService: { select: { id: true, name: true } },
// //             },
// //         });

// //         if (!service)
// //             return res.status(404).json({ message: "Service not found" });

// //         res.json(service);
// //     } catch (error) {
// //         console.error("❌ Error fetching service:", error);
// //         res.status(500).json({ message: "Error fetching service" });
// //     }
// // };
// export const getServiceById = async (req, res) => {
//     try {
//         const { id } = req.params;

//         const service = await prisma.service.findUnique({
//             where: { id: parseInt(id) },
//             include: {
//                 client: true,
//                 category: true,
//                 subService: true,
//                 mediaFiles: true,
//             },
//         });

//         if (!service)
//             return res.status(404).json({ message: "Service not found" });

//         const modified = {
//             ...service,
//             mediaFiles: service.mediaFiles.map(f => ({
//                 id: f.id,
//                 fileName: f.fileName,
//                 mimeType: f.mimeType,
//                 data: `data:${f.mimeType};base64,${f.data.toString("base64")}`,
//             })),
//         };

//         res.json(modified);
//     } catch (error) {
//         console.error("❌ Error fetching service:", error);
//         res.status(500).json({ message: "Error fetching service" });
//     }
// };


// /* ============================================================
//    ➕ Create a New Service (with GST fields)
//    @route   POST /api/services
//    @access  Private
// ============================================================ */
// // export const createService = async (req, res) => {
// //     try {
// //         const {
// //             clientId,
// //             categoryId,
// //             subServiceId,
// //             notes,
// //             date,
// //             partsCost,
// //             laborCost,
// //             partsGst,
// //             laborGst,
// //             cost,
// //             status,
// //         } = req.body;

// //         if (!clientId || !date) {
// //             return res.status(400).json({ message: "Missing required fields" });
// //         }

// //         const pCost = parseFloat(partsCost || 0);
// //         const lCost = parseFloat(laborCost || 0);
// //         const pGst = parseFloat(partsGst || 0);
// //         const lGst = parseFloat(laborGst || 0);

// //         const computedCost =
// //             cost !== undefined && cost !== null
// //                 ? parseFloat(cost)
// //                 : pCost + (pCost * pGst) / 100 + lCost + (lCost * lGst) / 100;

// //         const service = await prisma.service.create({
// //             data: {

// //                 date: new Date(date),
// //                 partsCost: pCost,
// //                 partsGst: pGst,
// //                 laborCost: lCost,
// //                 laborGst: lGst,
// //                 cost: computedCost,
// //                 status: status || "Pending",
// //                 notes: notes || null,
// //                 client: { connect: { id: parseInt(clientId) } },
// //                 ...(categoryId && { category: { connect: { id: parseInt(categoryId) } } }),
// //                 ...(subServiceId && { subService: { connect: { id: parseInt(subServiceId) } } }),
// //             },
// //             include: {
// //                 client: { select: { fullName: true, regNumber: true } },
// //                 category: true,
// //                 subService: true,
// //             },
// //         });

// //         res.status(201).json({
// //             message: "✅ Service created successfully",
// //             service,
// //         });
// //     } catch (error) {
// //         console.error("❌ Error creating service:", error);
// //         res.status(500).json({ message: "Error creating service" });
// //     }
// // };
// export const createService = async (req, res) => {
//     try {
//         const {
//             clientId,
//             categoryId,
//             subServiceId,
//             notes,
//             date,
//             partsCost,
//             laborCost,
//             partsGst,
//             laborGst,
//             cost,
//             status,
//         } = req.body;

//         if (!clientId || !date) {
//             return res.status(400).json({ message: "Missing required fields" });
//         }

//         const pCost = parseFloat(partsCost || 0);
//         const lCost = parseFloat(laborCost || 0);
//         const pGst = parseFloat(partsGst || 0);
//         const lGst = parseFloat(laborGst || 0);

//         const computedCost =
//             cost !== undefined && cost !== null
//                 ? parseFloat(cost)
//                 : pCost + (pCost * pGst) / 100 + lCost + (lCost * lGst) / 100;

//         const service = await prisma.service.create({
//             data: {
//                 date: new Date(date),
//                 partsCost: pCost,
//                 partsGst: pGst,
//                 laborCost: lCost,
//                 laborGst: lGst,
//                 cost: computedCost,
//                 status: status || "Pending",
//                 notes: notes || null,
//                 clientId: parseInt(clientId),
//                 categoryId: categoryId ? parseInt(categoryId) : null,
//                 subServiceId: subServiceId ? parseInt(subServiceId) : null,
//             },
//         });

//         // ✅ Save media to DB as binary
//         if (req.files?.length) {
//             for (const file of req.files) {
//                 await prisma.serviceMedia.create({
//                     data: {
//                         serviceId: service.id,
//                         fileName: file.originalname,
//                         mimeType: file.mimetype,
//                         data: file.buffer,
//                     },
//                 });
//             }
//         }

//         const media = await prisma.serviceMedia.findMany({
//             where: { serviceId: service.id }
//         });

//         res.status(201).json({
//             message: "Service created successfully",
//             service: {
//                 ...service,
//                 mediaFiles: media.map(f => ({
//                     id: f.id,
//                     fileName: f.fileName,
//                     mimeType: f.mimeType,
//                     data: `data:${f.mimeType};base64,${f.data.toString("base64")}`
//                 }))
//             }
//         });

//     } catch (error) {
//         console.error("Error creating service:", error);
//         res.status(500).json({ message: "Error creating service" });
//     }
// };

// /* ============================================================
//    ✏️ Update Existing Service (with GST fields)
//    @route   PUT /api/services/:id
//    @access  Private
// ============================================================ */
// // export const updateService = async (req, res) => {
// //     try {
// //         const { id } = req.params;
// //         if (!id || isNaN(Number(id))) {
// //             return res.status(400).json({ message: "Invalid service ID" });
// //         }

// //         const {
// //             clientId,
// //             categoryId,
// //             subServiceId,
// //             notes,
// //             date,
// //             partsCost,
// //             laborCost,
// //             partsGst,
// //             laborGst,
// //             cost,
// //             status,
// //         } = req.body;

// //         const pCost = parseFloat(partsCost || 0);
// //         const lCost = parseFloat(laborCost || 0);
// //         const pGst = parseFloat(partsGst || 0);
// //         const lGst = parseFloat(laborGst || 0);

// //         const computedCost =
// //             cost !== undefined && cost !== null
// //                 ? parseFloat(cost)
// //                 : pCost + (pCost * pGst) / 100 + lCost + (lCost * lGst) / 100;

// //         const updateData = {
// //             date: date ? new Date(date) : undefined,
// //             partsCost: isNaN(pCost) ? undefined : pCost,
// //             partsGst: isNaN(pGst) ? undefined : pGst,
// //             laborCost: isNaN(lCost) ? undefined : lCost,
// //             laborGst: isNaN(lGst) ? undefined : lGst,
// //             cost: computedCost,
// //             status,
// //             notes: notes || undefined,
// //             clientId: clientId ? parseInt(clientId) : undefined,
// //             ...(categoryId && { categoryId: parseInt(categoryId) }),
// //             ...(subServiceId && { subServiceId: parseInt(subServiceId) }),
// //         };

// //         Object.keys(updateData).forEach(
// //             (key) => updateData[key] === undefined && delete updateData[key]
// //         );

// //         const updatedService = await prisma.service.update({
// //             where: { id: parseInt(id) },
// //             data: updateData,
// //             include: {
// //                 client: { select: { fullName: true, regNumber: true } },
// //                 category: true,
// //                 subService: true,
// //             },
// //         });

// //         res.json({
// //             message: "✅ Service updated successfully",
// //             service: updatedService,
// //         });
// //     } catch (error) {
// //         console.error("❌ Error updating service:", error);
// //         res.status(500).json({ message: "Error updating service" });
// //     }
// // };
// export const updateService = async (req, res) => {
//     try {
//         const { id } = req.params;
//         if (!id || isNaN(Number(id))) {
//             return res.status(400).json({ message: "Invalid service ID" });
//         }

//         const {
//             clientId,
//             categoryId,
//             subServiceId,
//             notes,
//             date,
//             partsCost,
//             laborCost,
//             partsGst,
//             laborGst,
//             cost,
//             status,
//         } = req.body;

//         const pCost = parseFloat(partsCost || 0);
//         const lCost = parseFloat(laborCost || 0);
//         const pGst = parseFloat(partsGst || 0);
//         const lGst = parseFloat(laborGst || 0);

//         const computedCost =
//             cost !== undefined && cost !== null
//                 ? parseFloat(cost)
//                 : pCost + (pCost * pGst) / 100 + lCost + (lCost * lGst) / 100;

//         const updateData = {
//             date: date ? new Date(date) : undefined,
//             partsCost: isNaN(pCost) ? undefined : pCost,
//             partsGst: isNaN(pGst) ? undefined : pGst,
//             laborCost: isNaN(lCost) ? undefined : lCost,
//             laborGst: isNaN(lGst) ? undefined : lGst,
//             cost: computedCost,
//             status,
//             notes: notes || undefined,
//             clientId: clientId ? parseInt(clientId) : undefined,
//             categoryId: categoryId ? parseInt(categoryId) : undefined,
//             subServiceId: subServiceId ? parseInt(subServiceId) : undefined,
//         };

//         Object.keys(updateData).forEach(
//             (k) => updateData[k] === undefined && delete updateData[k]
//         );

//         const updatedService = await prisma.service.update({
//             where: { id: parseInt(id) },
//             data: updateData,
//         });

//         // ✅ Save uploaded files
//         if (req.files?.length) {
//             for (const file of req.files) {
//                 await prisma.serviceMedia.create({
//                     data: {
//                         serviceId: updatedService.id,
//                         fileName: file.originalname,
//                         mimeType: file.mimetype,
//                         data: file.buffer,
//                     },
//                 });
//             }
//         }

//         const media = await prisma.serviceMedia.findMany({
//             where: { serviceId: updatedService.id }
//         });

//         res.json({
//             message: "Service updated successfully",
//             service: {
//                 ...updatedService,
//                 mediaFiles: media.map(f => ({
//                     id: f.id,
//                     fileName: f.fileName,
//                     mimeType: f.mimeType,
//                     data: `data:${f.mimeType};base64,${f.data.toString("base64")}`
//                 }))
//             }
//         });

//     } catch (error) {
//         console.error("Error updating service:", error);
//         res.status(500).json({ message: "Error updating service" });
//     }
// };

// /* ============================================================
//    🗑️ Delete Service
//    @route   DELETE /api/services/:id
//    @access  Private
// ============================================================ */
// export const deleteService = async (req, res) => {
//     try {
//         const { id } = req.params;
//         if (!id || isNaN(Number(id))) {
//             return res.status(400).json({ message: "Invalid service ID" });
//         }

//         const service = await prisma.service.findUnique({
//             where: { id: parseInt(id) },
//         });

//         if (!service)
//             return res.status(404).json({ message: "Service not found" });

//         await prisma.service.delete({ where: { id: parseInt(id) } });

//         res.json({ message: "🗑️ Service deleted successfully" });
//     } catch (error) {
//         console.error("❌ Error deleting service:", error);
//         res.status(500).json({ message: "Error deleting service" });
//     }
// };

// /* ============================================================
//    📘 Get Service Types (Categories + SubServices)
//    @route   GET /api/services/types/list
//    @access  Private
// ============================================================ */
// export const getServiceTypes = async (req, res) => {
//     try {
//         const categories = await prisma.serviceCategory.findMany({
//             include: {
//                 subServices: {
//                     select: {
//                         id: true,
//                         name: true,
//                     },
//                 },
//             },
//             orderBy: { id: "asc" },
//         });

//         res.status(200).json(categories);
//     } catch (error) {
//         console.error("❌ Error fetching service types:", error);
//         res.status(500).json({ message: "Error fetching service types" });
//     }
// };
