import prisma from "../models/prismaClient.js";
import { getOwnerUserId } from "../utils/getAdminId.js";
import { sendWhatsAppTemplate } from "../services/whatsappService.js"; // ✅ Added Import

/* =====================================================
   SERVICE TYPES (GLOBAL)
===================================================== */
export const getBikeServiceTypes = async (req, res) => {
  try {
    // public route: only the shared default list (garage-added ones stay private)
    const data = await prisma.bikeServiceCategory.findMany({
      where: { ownerUserId: null },
      include: {
        subServices: { where: { ownerUserId: null }, orderBy: { id: "asc" } },
      },
      orderBy: { id: "asc" },
    });

    res.json(data);
  } catch (err) {
    console.error("getBikeServiceTypes error:", err);
    res.status(500).json({
      message: "Failed to load service types",
    });
  }
};

/* =====================================================
   PAYMENT HELPERS
   A service's payment state comes from its linked invoice.
   If the invoice is Paid -> balance due is 0.
===================================================== */
const INVOICE_SELECT = {
  id: true,
  invoiceNumber: true,
  bikeId: true,
  serviceCategory: true,
  serviceSubCategory: true,
  grandTotal: true,
  advancePaid: true,
  balanceDue: true,
  status: true,
  paymentMode: true,
  paidAt: true,
  createdAt: true,
};

const norm = (v) => String(v || "").trim().toLowerCase();

const serviceKeys = (s) =>
  [s.category?.name || s.categoryText, s.subService?.name || s.subServiceText]
    .map(norm)
    .filter(Boolean);

/*
  Older invoices were created without being linked to their service.
  This finds the matching invoice (same bike, same category/sub-service,
  created after the service) and links it once, so old records fix
  themselves the next time the Services page loads.
*/
async function autoLinkServicesToInvoices(services, ownerUserId) {
  const unlinked = services.filter((s) => !s.bikeInvoiceId);
  if (!unlinked.length) return;

  const bikeIds = [...new Set(unlinked.map((s) => s.clientId))];

  const invoices = await prisma.bikeInvoice.findMany({
    where: { ownerUserId, bikeId: { in: bikeIds } },
    select: { ...INVOICE_SELECT, bikeServices: { select: { id: true } } },
    orderBy: { createdAt: "asc" },
  });

  // invoices already attached to a service can't be reused
  const used = new Set(
    invoices.filter((i) => i.bikeServices.length > 0).map((i) => i.id),
  );

  const oldestFirst = [...unlinked].sort(
    (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
  );

  for (const s of oldestFirst) {
    const keys = serviceKeys(s);

    const match = invoices.find((inv) => {
      if (used.has(inv.id) || inv.bikeId !== s.clientId) return false;
      if (new Date(inv.createdAt) < new Date(s.createdAt)) return false;
      if (!keys.length) return true;
      const invKeys = [inv.serviceCategory, inv.serviceSubCategory]
        .map(norm)
        .filter(Boolean);
      return invKeys.some((k) => keys.includes(k));
    });

    if (!match) continue;
    used.add(match.id);

    await prisma.bikeService.update({
      where: { id: s.id },
      data: {
        bikeInvoiceId: match.id,
        invoiceStatus: match.status === "Paid" ? "paid" : "generated",
        ...(match.status === "Paid" ? { balanceDue: 0 } : {}),
      },
    });

    const { bikeServices, ...invoiceOnly } = match;
    s.bikeInvoiceId = match.id;
    s.bikeInvoice = invoiceOnly;
  }
}

/* Returns { balanceDue, amountPaid, paymentStatus } for a service */
function getPaymentInfo(service, grandTotal, computedBalanceDue) {
  const inv = service.bikeInvoice;

  if (inv && inv.status === "Paid") {
    return {
      balanceDue: 0,
      amountPaid: Number(inv.grandTotal || grandTotal),
      paymentStatus: "Paid",
    };
  }

  if (inv) {
    const invTotal = Number(inv.grandTotal || 0);
    const invAdvance = Number(inv.advancePaid || 0);
    return {
      balanceDue: Math.max(invTotal - invAdvance, 0),
      amountPaid: invAdvance,
      paymentStatus: invAdvance > 0 ? "Partially Paid" : "Unpaid",
    };
  }

  const advance = Number(service.advancePaid || 0);
  const due = Math.max(computedBalanceDue, 0);
  return {
    balanceDue: due,
    amountPaid: advance,
    paymentStatus:
      due <= 0 && grandTotal > 0
        ? "Paid"
        : advance > 0
          ? "Partially Paid"
          : "Unpaid",
  };
}

/* =====================================================
   GET ALL BIKE SERVICES
   GET /api/bike-services
===================================================== */
export const getBikeServices = async (req, res) => {
  try {
    const ownerUserId = getOwnerUserId(req.user);

    const role = String(req.user.role).toLowerCase();

    const whereCondition = {
      ownerUserId,
    };

    const services = await prisma.bikeService.findMany({
      where: whereCondition,
      include: {
        client: true,
        category: true,
        subService: true,
        serviceItems: true,
        serviceMedia: true,
        bikeInvoice: { select: INVOICE_SELECT },
      },
      orderBy: { createdAt: "desc" },
    });

    // 🔗 link old services to their invoices (one-time self-heal)
    try {
      await autoLinkServicesToInvoices(services, ownerUserId);
    } catch (linkErr) {
      console.error("autoLinkServicesToInvoices error:", linkErr);
    }

    // ✅ FIX: Calculate totals with discount and advance paid, or use stored values
    const fixedServices = services.map((s) => {
      // Check if serviceItems exist and have data
      const hasServiceItems = s.serviceItems && s.serviceItems.length > 0;

      let partsSubtotal,
        laborSubtotal,
        cgstTotal,
        sgstTotal,
        grandTotal,
        balanceDue;

      if (hasServiceItems) {
        // Calculate from service items if they exist
        partsSubtotal =
          s.serviceItems
            ?.filter((item) => item.type === "Part")
            .reduce(
              (sum, item) =>
                sum + Number(item.quantity) * Number(item.unitPrice),
              0,
            ) || 0;

        laborSubtotal =
          s.serviceItems
            ?.filter((item) => item.type === "Labor")
            .reduce(
              (sum, item) =>
                sum + Number(item.quantity) * Number(item.unitPrice),
              0,
            ) || 0;

        cgstTotal =
          s.serviceItems?.reduce(
            (sum, item) =>
              sum +
              (Number(item.quantity) *
                Number(item.unitPrice) *
                Number(item.cgst)) /
                100,
            0,
          ) || 0;

        sgstTotal =
          s.serviceItems?.reduce(
            (sum, item) =>
              sum +
              (Number(item.quantity) *
                Number(item.unitPrice) *
                Number(item.sgst)) /
                100,
            0,
          ) || 0;

        grandTotal =
          partsSubtotal +
          laborSubtotal +
          cgstTotal +
          sgstTotal -
          (Number(s.discount) || 0);
        balanceDue = grandTotal - (Number(s.advancePaid) || 0);
      } else {
        // ✅ FIX: Use stored values from database if serviceItems are missing
        partsSubtotal = Number(s.partsSubtotal) || 0;
        laborSubtotal = Number(s.laborSubtotal) || 0;
        cgstTotal = Number(s.cgstTotal) || 0;
        sgstTotal = Number(s.sgstTotal) || 0;
        grandTotal = Number(s.grandTotal) || 0;
        balanceDue = Number(s.balanceDue) || 0;
      }

      const payment = getPaymentInfo(s, grandTotal, balanceDue);

      return {
        ...s,
        partsSubtotal: Number(partsSubtotal.toFixed(2)),
        laborSubtotal: Number(laborSubtotal.toFixed(2)),
        cgstTotal: Number(cgstTotal.toFixed(2)),
        sgstTotal: Number(sgstTotal.toFixed(2)),
        grandTotal: Number(grandTotal.toFixed(2)),
        balanceDue: Number(payment.balanceDue.toFixed(2)),
        amountPaid: Number(payment.amountPaid.toFixed(2)),
        paymentStatus: payment.paymentStatus,
      };
    });

    res.json(fixedServices);
  } catch (err) {
    console.error("getBikeServices error:", err);
    res.status(500).json({
      message: "Failed to fetch bike services",
    });
  }
};

/* =====================================================
   GET SERVICES BY CLIENT
   GET /api/bike-services/client/:clientId
===================================================== */
export const getBikeServicesByClient = async (req, res) => {
  try {
    const ownerUserId = getOwnerUserId(req.user);
    const clientId = Number(req.params.clientId);

    const role = String(req.user.role).toLowerCase();

    const whereCondition = {
      clientId,
      ownerUserId,
    };

    const services = await prisma.bikeService.findMany({
      where: whereCondition,
      include: {
        category: true,
        subService: true,
        serviceItems: true,
        serviceMedia: true,
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(services);
  } catch (err) {
    console.error("getBikeServicesByClient error:", err);
    res.status(500).json({
      message: "Failed to fetch services",
    });
  }
};

/* =====================================================
   GET SINGLE SERVICE
   GET /api/bike-services/:id
===================================================== */
export const getBikeServiceById = async (req, res) => {
  try {
    const ownerUserId = getOwnerUserId(req.user);
    const id = Number(req.params.id);
    const role = String(req.user.role).toLowerCase();

    const service = await prisma.bikeService.findFirst({
      where: { id, ownerUserId },
      include: {
        client: true,
        category: true,
        subService: true,
        serviceItems: true,
        serviceMedia: true,
        bikeInvoice: { select: INVOICE_SELECT },
      },
    });

    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    try {
      await autoLinkServicesToInvoices([service], ownerUserId);
    } catch (linkErr) {
      console.error("autoLinkServicesToInvoices error:", linkErr);
    }

    // ✅ FIX: Check if serviceItems exist and have data
    const hasServiceItems =
      service.serviceItems && service.serviceItems.length > 0;

    let partsSubtotal,
      laborSubtotal,
      cgstTotal,
      sgstTotal,
      grandTotal,
      balanceDue;

    if (hasServiceItems) {
      // Calculate from service items if they exist
      partsSubtotal =
        service.serviceItems
          ?.filter((item) => item.type === "Part")
          .reduce(
            (sum, item) => sum + Number(item.quantity) * Number(item.unitPrice),
            0,
          ) || 0;

      laborSubtotal =
        service.serviceItems
          ?.filter((item) => item.type === "Labor")
          .reduce(
            (sum, item) => sum + Number(item.quantity) * Number(item.unitPrice),
            0,
          ) || 0;

      cgstTotal =
        service.serviceItems?.reduce(
          (sum, item) =>
            sum +
            (Number(item.quantity) *
              Number(item.unitPrice) *
              Number(item.cgst)) /
              100,
          0,
        ) || 0;

      sgstTotal =
        service.serviceItems?.reduce(
          (sum, item) =>
            sum +
            (Number(item.quantity) *
              Number(item.unitPrice) *
              Number(item.sgst)) /
              100,
          0,
        ) || 0;

      grandTotal =
        partsSubtotal +
        laborSubtotal +
        cgstTotal +
        sgstTotal -
        (Number(service.discount) || 0);
      balanceDue = grandTotal - (Number(service.advancePaid) || 0);
    } else {
      // ✅ FIX: Use stored values from database if serviceItems are missing
      partsSubtotal = Number(service.partsSubtotal) || 0;
      laborSubtotal = Number(service.laborSubtotal) || 0;
      cgstTotal = Number(service.cgstTotal) || 0;
      sgstTotal = Number(service.sgstTotal) || 0;
      grandTotal = Number(service.grandTotal) || 0;
      balanceDue = Number(service.balanceDue) || 0;
    }

    const payment = getPaymentInfo(service, grandTotal, balanceDue);

    res.json({
      ...service,
      partsSubtotal: Number(partsSubtotal.toFixed(2)),
      laborSubtotal: Number(laborSubtotal.toFixed(2)),
      cgstTotal: Number(cgstTotal.toFixed(2)),
      sgstTotal: Number(sgstTotal.toFixed(2)),
      grandTotal: Number(grandTotal.toFixed(2)),
      balanceDue: Number(payment.balanceDue.toFixed(2)),
      amountPaid: Number(payment.amountPaid.toFixed(2)),
      paymentStatus: payment.paymentStatus,
    });
  } catch (err) {
    console.error("getBikeServiceById error:", err);
    res.status(500).json({
      message: "Failed to load service",
    });
  }
};

/* =====================================================
   CREATE SERVICE
   POST /api/bike-services
===================================================== */
export const createBikeService = async (req, res) => {
  try {
    /* =====================================================
       NORMALIZE IDS (DROPDOWN ONLY)
    ===================================================== */
    const rawCategoryId = req.body.categoryId;
    const rawSubServiceId = req.body.subServiceId;

    const normalizedCategoryId =
      rawCategoryId && Number(rawCategoryId) > 0 ? Number(rawCategoryId) : null;

    const normalizedSubServiceId =
      rawSubServiceId && Number(rawSubServiceId) > 0
        ? Number(rawSubServiceId)
        : null;

    const ownerUserId = getOwnerUserId(req.user);

    const {
      clientId,
      categoryText,
      subServiceText,
      inDate,
      outDate,
      expectedDelivery,
      status,
      priority,
      assignedMechanic,
      notes,
      parsedServiceItems,
      discountType,
      discountValue,
      advancePaid,
      invoiceStatus,
    } = req.body;

    /* =====================================================
       BASIC VALIDATION
    ===================================================== */
    if (!clientId || !inDate) {
      return res.status(400).json({
        message: "Client and In Date are required",
      });
    }

    /* =====================================================
       NORMALIZE SERVICE ITEMS
    ===================================================== */
    let items = parsedServiceItems;

    if (typeof items === "string") {
      try {
        items = JSON.parse(items);
      } catch {
        return res.status(400).json({
          message: "Invalid parsedServiceItems format",
        });
      }
    }

    if (!Array.isArray(items)) items = [];

    /* =====================================================
       FINAL CATEGORY / SUB-SERVICE VALUES
       (NO CREATION IN MASTER TABLES)
    ===================================================== */
    const resolved = await resolveTypedTypes(
      ownerUserId,
      normalizedCategoryId,
      normalizedSubServiceId,
      categoryText,
      subServiceText,
    );
    const finalCategoryId = resolved.categoryId;
    const finalSubServiceId = resolved.subServiceId;

    const finalCategoryText = !finalCategoryId
      ? categoryText?.trim() || null
      : null;

    const finalSubServiceText = !finalSubServiceId
      ? subServiceText?.trim() || null
      : null;

    if (!finalCategoryId && !finalCategoryText) {
      return res.status(400).json({
        message: "Category is required (select or type)",
      });
    }

    if (!finalSubServiceId && !finalSubServiceText) {
      return res.status(400).json({
        message: "Sub-service is required (select or type)",
      });
    }

    /* =====================================================
       CALCULATIONS
    ===================================================== */
    const partsSubtotal = items
      .filter((i) => i.type === "Part")
      .reduce(
        (sum, i) => sum + Number(i.quantity || 0) * Number(i.unitPrice || 0),
        0,
      );

    const laborSubtotal = items
      .filter((i) => i.type === "Labor")
      .reduce(
        (sum, i) => sum + Number(i.quantity || 0) * Number(i.unitPrice || 0),
        0,
      );

    const cgstTotal = items.reduce(
      (sum, i) =>
        sum +
        (Number(i.quantity || 0) *
          Number(i.unitPrice || 0) *
          Number(i.cgst || 0)) /
          100,
      0,
    );

    const sgstTotal = items.reduce(
      (sum, i) =>
        sum +
        (Number(i.quantity || 0) *
          Number(i.unitPrice || 0) *
          Number(i.sgst || 0)) /
          100,
      0,
    );

    const discount =
      discountType === "Fixed Amount"
        ? Number(discountValue || 0)
        : ((partsSubtotal + laborSubtotal + cgstTotal + sgstTotal) *
            Number(discountValue || 0)) /
          100;

    const grandTotal =
      partsSubtotal + laborSubtotal + cgstTotal + sgstTotal - discount;

    const balanceDue = grandTotal - Number(advancePaid || 0);

    /* =====================================================
       CREATE SERVICE (FINAL)
    ===================================================== */
    const service = await prisma.bikeService.create({
      data: {
        client: {
          connect: { id: Number(clientId) },
        },

        // ✅ Dropdown (optional) - using proper Prisma relation syntax
        ...(finalCategoryId && {
          category: { connect: { id: finalCategoryId } },
        }),
        ...(finalSubServiceId && {
          subService: { connect: { id: finalSubServiceId } },
        }),

        // ✅ Typed (optional)
        categoryText: finalCategoryText,
        subServiceText: finalSubServiceText,

        inDate: new Date(inDate),
        outDate: outDate ? new Date(outDate) : null,
        expectedDelivery: expectedDelivery ? new Date(expectedDelivery) : null,

        status: status || "Pending",
        priority: priority || "Normal",
        assignedMechanic: assignedMechanic || null,
        notes,

        partsSubtotal: Number(partsSubtotal.toFixed(2)),
        laborSubtotal: Number(laborSubtotal.toFixed(2)),
        cgstTotal: Number(cgstTotal.toFixed(2)),
        sgstTotal: Number(sgstTotal.toFixed(2)),
        discountType: discountType || "Fixed Amount",
        discount: Number(discount.toFixed(2)),
        advancePaid: Number(advancePaid || 0),
        grandTotal: Number(grandTotal.toFixed(2)),
        balanceDue: Number(balanceDue.toFixed(2)),

        invoiceStatus: invoiceStatus || "draft",

        ownerUser: {
          connect: { id: ownerUserId },
        },
        createdBy: {
          connect: { id: req.user.id },
        },

        serviceItems: {
          create: items.map((item) => ({
            type: item.type,
            name: item.type === "Labor" ? "Labor" : item.name || "Unnamed Part",
            quantity: Number(item.quantity || 0),
            unitPrice: Number(item.unitPrice || 0),
            cgst: Number(item.cgst || 0),
            sgst: Number(item.sgst || 0),
            total: Number(
              (
                Number(item.quantity || 0) *
                Number(item.unitPrice || 0) *
                (1 + (Number(item.cgst || 0) + Number(item.sgst || 0)) / 100)
              ).toFixed(2),
            ),
          })),
        },

        serviceMedia: {
          create:
            req.files?.map((file) => ({
              fileName: file.originalname,
              mimeType: file.mimetype,
              data: file.buffer,
            })) || [],
        },
      },
      include: {
        serviceItems: true,
        serviceMedia: true,
        client: true,
        category: true,
        subService: true,
      },
    });

    return res.status(201).json(service);
  } catch (err) {
    console.error("createBikeService error:", err);
    return res.status(500).json({
      message: "Service creation failed",
      error: err.message,
    });
  }
};

/* =====================================================
   UPDATE SERVICE
   PUT /api/bike-services/:id
===================================================== */
export const updateBikeService = async (req, res) => {
  try {
    const ownerUserId = getOwnerUserId(req.user);
    const role = String(req.user.role).toLowerCase();
    const id = Number(req.params.id);

    const {
      clientId,
      categoryId,
      categoryText,
      subServiceId,
      subServiceText,
      inDate,
      outDate,
      expectedDelivery,
      status,
      priority,
      assignedMechanic,
      notes,
      parsedServiceItems,
      discountType,
      discountValue,
      advancePaid,
      invoiceStatus,
    } = req.body;

    /* =====================================================
       VERIFY SERVICE
    ===================================================== */
    const existingService = await prisma.bikeService.findFirst({
      where: { id, ownerUserId },
    });

    if (!existingService) {
      return res.status(404).json({
        message: "Service not found or unauthorized",
      });
    }

    /* =====================================================
       NORMALIZE CATEGORY / SUB-SERVICE
    ===================================================== */
    const resolvedTypes = await resolveTypedTypes(
      ownerUserId,
      categoryId && Number(categoryId) > 0 ? Number(categoryId) : null,
      subServiceId && Number(subServiceId) > 0 ? Number(subServiceId) : null,
      categoryText,
      subServiceText,
    );
    const normalizedCategoryId = resolvedTypes.categoryId;
    const normalizedSubServiceId = resolvedTypes.subServiceId;

    const finalCategoryText = !normalizedCategoryId
      ? categoryText?.trim() || null
      : null;

    const finalSubServiceText = !normalizedSubServiceId
      ? subServiceText?.trim() || null
      : null;

    if (!normalizedCategoryId && !finalCategoryText) {
      return res.status(400).json({ message: "Category is required" });
    }

    if (!normalizedSubServiceId && !finalSubServiceText) {
      return res.status(400).json({ message: "Sub-service is required" });
    }

    /* =====================================================
       NORMALIZE SERVICE ITEMS
    ===================================================== */
    let items = parsedServiceItems;

    if (typeof items === "string") {
      try {
        items = JSON.parse(items);
      } catch {
        items = [];
      }
    }

    if (!Array.isArray(items)) items = [];

    /* =====================================================
       CALCULATIONS
    ===================================================== */
    let partsSubtotal,
      laborSubtotal,
      cgstTotal,
      sgstTotal,
      discount,
      grandTotal,
      balanceDue;

    if (items.length > 0) {
      partsSubtotal = items
        .filter((i) => i.type === "Part")
        .reduce(
          (s, i) => s + Number(i.quantity || 0) * Number(i.unitPrice || 0),
          0,
        );

      laborSubtotal = items
        .filter((i) => i.type === "Labor")
        .reduce(
          (s, i) => s + Number(i.quantity || 0) * Number(i.unitPrice || 0),
          0,
        );

      cgstTotal = items.reduce(
        (s, i) =>
          s +
          (Number(i.quantity || 0) *
            Number(i.unitPrice || 0) *
            Number(i.cgst || 0)) /
            100,
        0,
      );

      sgstTotal = items.reduce(
        (s, i) =>
          s +
          (Number(i.quantity || 0) *
            Number(i.unitPrice || 0) *
            Number(i.sgst || 0)) /
            100,
        0,
      );

      discount =
        discountType === "Fixed Amount"
          ? Number(discountValue || 0)
          : ((partsSubtotal + laborSubtotal + cgstTotal + sgstTotal) *
              Number(discountValue || 0)) /
            100;
    } else {
      partsSubtotal = Number(existingService.partsSubtotal) || 0;
      laborSubtotal = Number(existingService.laborSubtotal) || 0;
      cgstTotal = Number(existingService.cgstTotal) || 0;
      sgstTotal = Number(existingService.sgstTotal) || 0;

      discount =
        discountType === "Fixed Amount"
          ? Number(discountValue || existingService.discount || 0)
          : ((partsSubtotal + laborSubtotal + cgstTotal + sgstTotal) *
              Number(discountValue || 0)) /
            100;
    }

    grandTotal =
      partsSubtotal + laborSubtotal + cgstTotal + sgstTotal - discount;

    balanceDue = grandTotal - Number(advancePaid || 0);

    /* =====================================================
       DELETE OLD ITEMS / MEDIA
    ===================================================== */
    if (items.length > 0) {
      await prisma.serviceItem.deleteMany({
        where: { bikeServiceId: id },
      });
    }

    if (req.files?.length > 0) {
      await prisma.serviceMedia.deleteMany({
        where: { serviceId: id },
      });
    }

    /* =====================================================
       UPDATE DATA (🔥 MAIN FIX)
    ===================================================== */
    const updateData = {
      client: { connect: { id: Number(clientId) } },

      // 🔥 CATEGORY
      ...(normalizedCategoryId
        ? {
            category: { connect: { id: normalizedCategoryId } },
            categoryText: null,
          }
        : {
            category: { disconnect: true },
            categoryText: finalCategoryText,
          }),

      // 🔥 SUB-SERVICE
      ...(normalizedSubServiceId
        ? {
            subService: { connect: { id: normalizedSubServiceId } },
            subServiceText: null,
          }
        : {
            subService: { disconnect: true },
            subServiceText: finalSubServiceText,
          }),

      inDate: new Date(inDate),
      outDate: outDate ? new Date(outDate) : null,
      expectedDelivery: expectedDelivery ? new Date(expectedDelivery) : null,

      status,
      priority,
      assignedMechanic,
      notes,

      partsSubtotal,
      laborSubtotal,
      cgstTotal,
      sgstTotal,
      discountType,
      discount,
      advancePaid: Number(advancePaid || 0),
      grandTotal,
      balanceDue,
      invoiceStatus,
    };

    if (items.length > 0) {
      updateData.serviceItems = {
        create: items.map((item) => ({
          type: item.type,
          name: item.type === "Labor" ? "Labor" : item.name || "Unnamed Part",
          quantity: Number(item.quantity || 0),
          unitPrice: Number(item.unitPrice || 0),
          cgst: Number(item.cgst || 0),
          sgst: Number(item.sgst || 0),
          total: Number(
            (
              Number(item.quantity || 0) *
              Number(item.unitPrice || 0) *
              (1 + (Number(item.cgst || 0) + Number(item.sgst || 0)) / 100)
            ).toFixed(2),
          ),
        })),
      };
    }

    if (req.files?.length > 0) {
      updateData.serviceMedia = {
        create: req.files.map((file) => ({
          fileName: file.originalname,
          mimeType: file.mimetype,
          data: file.buffer,
        })),
      };
    }

    /* =====================================================
       UPDATE
    ===================================================== */
    const updated = await prisma.bikeService.update({
      where: { id },
      data: updateData,
      include: {
        serviceItems: true,
        serviceMedia: true,
        client: true,
        category: true,
        subService: true,
      },
    });

    res.json({
      message: "Service updated successfully",
      data: updated,
    });
  } catch (err) {
    console.error("updateBikeService error:", err);
    res.status(500).json({
      message: err.message || "Failed to update service",
    });
  }
};

/* =====================================================
   DELETE SERVICE
   DELETE /api/bike-services/:id
===================================================== */
export const deleteBikeService = async (req, res) => {
  try {
    const ownerUserId = getOwnerUserId(req.user);
    const id = Number(req.params.id);
    const role = String(req.user.role).toLowerCase();

    // Delete related items and media first
    await prisma.serviceItem.deleteMany({
      where: { bikeServiceId: id },
    });

    await prisma.serviceMedia.deleteMany({
      where: { serviceId: id },
    });

    const result = await prisma.bikeService.deleteMany({
      where: { id, ownerUserId },
    });

    if (result.count === 0) {
      return res.status(403).json({
        message: "Unauthorized or service not found",
      });
    }

    res.json({ message: "Service deleted successfully" });
  } catch (err) {
    console.error("deleteBikeService error:", err);
    res.status(500).json({
      message: "Failed to delete service",
    });
  }
};

/* =====================================================
   ADD NEW CATEGORY / SUB-SERVICE (with duplicate check)
===================================================== */

// shared defaults (ownerUserId null) + this garage's own entries
const visibleTo = (ownerUserId) => ({
  OR: [{ ownerUserId: null }, { ownerUserId }],
});

const brandFilter = (brand) => [
  { bikeBrand: null },
  { bikeBrand: "" },
  { bikeBrand: { equals: "All", mode: "insensitive" } },
  ...(brand ? [{ bikeBrand: { equals: brand, mode: "insensitive" } }] : []),
];

// "  oil   CHANGE " -> "Oil Change" for saving, "oil change" for comparing
const cleanName = (v) => String(v || "").trim().replace(/\s+/g, " ");
const compareKey = (v) => cleanName(v).toLowerCase();
const titleCase = (v) =>
  cleanName(v).replace(/\b\w/g, (c) => c.toUpperCase());

/*
  Safety net for saving a service: if the user typed a name that already
  exists (any case / spacing), use the existing category / sub-service id
  instead of saving a duplicate free-text value.
*/
async function resolveTypedTypes(
  ownerUserId,
  categoryId,
  subServiceId,
  categoryText,
  subServiceText,
) {
  let catId = categoryId;
  let subId = subServiceId;

  if (!catId && cleanName(categoryText)) {
    const cats = await prisma.bikeServiceCategory.findMany({
      where: visibleTo(ownerUserId),
      select: { id: true, name: true },
    });
    catId =
      cats.find((c) => compareKey(c.name) === compareKey(categoryText))?.id ||
      null;
  }

  if (!subId && catId && cleanName(subServiceText)) {
    const subs = await prisma.bikeSubService.findMany({
      where: { categoryId: catId, ...visibleTo(ownerUserId) },
      select: { id: true, name: true },
    });
    subId =
      subs.find((x) => compareKey(x.name) === compareKey(subServiceText))
        ?.id || null;
  }

  return { categoryId: catId, subServiceId: subId };
}

/* POST /api/bike-services/types/categories
   body: { name, bikeId? } */
export const createBikeServiceCategory = async (req, res) => {
  try {
    const ownerUserId = getOwnerUserId(req.user);
    const name = cleanName(req.body.name);

    if (name.length < 2) {
      return res
        .status(400)
        .json({ message: "Category name must be at least 2 characters" });
    }
    if (name.length > 60) {
      return res
        .status(400)
        .json({ message: "Category name is too long (max 60)" });
    }

    let brand = "";
    if (req.body.bikeId) {
      const bike = await prisma.bike.findFirst({
        where: { id: Number(req.body.bikeId), ownerUserId },
        select: { bikeBrand: true },
      });
      brand = String(bike?.bikeBrand || "").trim();
    }

    // duplicate check against everything this garage can see
    const visible = await prisma.bikeServiceCategory.findMany({
      where: { AND: [{ OR: brandFilter(brand) }, visibleTo(ownerUserId)] },
      include: {
        subServices: { where: visibleTo(ownerUserId), orderBy: { id: "asc" } },
      },
    });

    const existing = visible.find((c) => compareKey(c.name) === compareKey(name));
    if (existing) {
      return res.status(409).json({
        message: `"${existing.name}" already exists. Please select it from the list.`,
        existing,
      });
    }

    const category = await prisma.bikeServiceCategory.create({
      data: { name: titleCase(name), bikeBrand: "All", ownerUserId },
      include: { subServices: true },
    });

    return res.status(201).json({ message: "Category added", category });
  } catch (err) {
    console.error("createBikeServiceCategory error:", err);
    return res.status(500).json({ message: "Failed to add category" });
  }
};

/* POST /api/bike-services/types/categories/:categoryId/sub-services
   body: { name } */
export const createBikeSubService = async (req, res) => {
  try {
    const ownerUserId = getOwnerUserId(req.user);
    const categoryId = Number(req.params.categoryId);
    const name = cleanName(req.body.name);

    if (name.length < 2) {
      return res
        .status(400)
        .json({ message: "Sub-service name must be at least 2 characters" });
    }
    if (name.length > 60) {
      return res
        .status(400)
        .json({ message: "Sub-service name is too long (max 60)" });
    }

    const category = await prisma.bikeServiceCategory.findFirst({
      where: { id: categoryId, ...visibleTo(ownerUserId) },
      include: {
        subServices: { where: visibleTo(ownerUserId) },
      },
    });

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    const existing = category.subServices.find(
      (s) => compareKey(s.name) === compareKey(name),
    );
    if (existing) {
      return res.status(409).json({
        message: `"${existing.name}" already exists in ${category.name}. Please select it from the list.`,
        existing,
      });
    }

    const subService = await prisma.bikeSubService.create({
      data: { name: titleCase(name), categoryId, ownerUserId },
    });

    return res.status(201).json({ message: "Sub-service added", subService });
  } catch (err) {
    console.error("createBikeSubService error:", err);
    return res.status(500).json({ message: "Failed to add sub-service" });
  }
};

/* =====================================================
   GET CATEGORIES BY BIKE
   GET /api/bike-services/categories/:bikeId
===================================================== */
export const getCategoriesByBike = async (req, res) => {
  try {
    const { bikeId } = req.params;

    const ownerUserId = getOwnerUserId(req.user);

    const bike = await prisma.bike.findFirst({
      where: { id: Number(bikeId), ownerUserId },
    });

    if (!bike) {
      return res.status(404).json({ message: "Bike not found" });
    }

    const brand = String(bike.bikeBrand || "").trim();

    // ✅ Categories saved with bikeBrand "All" (or empty / null) apply to every
    //    bike. Brand match is case-insensitive ("HERO" = "Hero").
    const categories = await prisma.bikeServiceCategory.findMany({
      where: {
        AND: [
          { OR: brandFilter(brand) },
          visibleTo(ownerUserId), // shared defaults + this garage's own
        ],
      },
      include: {
        subServices: {
          where: visibleTo(ownerUserId),
          orderBy: { id: "asc" },
        },
      },
      orderBy: { id: "asc" },
    });

    res.json(categories);
  } catch (error) {
    console.error("getCategoriesByBike error:", error);
    res.status(500).json({
      message: "Failed to load categories",
    });
  }
};

/* =====================================================
   GENERATE INVOICE PDF
   POST /api/bike-services/:id/generate-invoice
===================================================== */
export const generateInvoice = async (req, res) => {
  try {
    const id = Number(req.params.id);

    const service = await prisma.bikeService.findUnique({
      where: { id },
      include: {
        client: true,
        serviceItems: true,
        category: true,
        subService: true,
      },
    });

    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    // Update invoice status
    await prisma.bikeService.update({
      where: { id },
      data: { invoiceStatus: "generated" },
    });

    // TODO: Implement PDF generation logic here
    // You can use libraries like pdfkit, puppeteer, or jsPDF

    res.json({
      message: "Invoice generated successfully",
      invoiceUrl: `/invoices/service-${id}.pdf`,
    });
  } catch (err) {
    console.error("generateInvoice error:", err);
    res.status(500).json({
      message: "Failed to generate invoice",
    });
  }
};

/* =====================================================
   SEND INVOICE EMAIL
   POST /api/bike-services/:id/send-invoice
===================================================== */
export const sendInvoice = async (req, res) => {
  try {
    const id = Number(req.params.id);

    const service = await prisma.bikeService.findUnique({
      where: { id },
      include: {
        client: true,
      },
    });

    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    // Update invoice status
    await prisma.bikeService.update({
      where: { id },
      data: {
        invoiceStatus: "sent",
        invoiceSentAt: new Date(),
      },
    });

    // TODO: Implement email sending logic here
    // You can use nodemailer or similar

    res.json({
      message: "Invoice sent successfully",
      sentTo: service.client.email,
    });
  } catch (err) {
    console.error("sendInvoice error:", err);
    res.status(500).json({
      message: "Failed to send invoice",
    });
  }
};

/* =====================================================
   GET SERVICE MEDIA (IMAGE / FILE)
   GET /api/bike-services/media/:id
===================================================== */
export const getServiceMedia = async (req, res) => {
  try {
    const media = await prisma.bikeServiceMedia.findUnique({
      where: { id: Number(req.params.id) },
    });

    if (!media) {
      return res.status(404).json({ message: "Media not found" });
    }

    res.setHeader("Content-Type", media.mimeType || "image/jpeg");
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.send(media.data);
  } catch (err) {
    console.error("getServiceMedia error:", err);
    res.status(500).json({ message: "Failed to load media" });
  }
};

/* ============================================================
   ✅ WHATSAPP INTEGRATION FUNCTIONS
============================================================ */

/* ============================================================
   Send WhatsApp Approval (Estimate)
   @route   POST /api/bike-services/:id/whatsapp
   @access  Private
============================================================ */
export const sendBikeServiceApproval = async (req, res) => {
  try {
    const serviceId = Number(req.params.id);
    const ownerId = getOwnerUserId(req.user);

    const service = await prisma.bikeService.findFirst({
      where: { id: serviceId, ownerUserId },
      include: { client: true },
    });

    if (!service || !service.client?.phone) {
      return res
        .status(404)
        .json({ message: "Service or Client phone not found" });
    }

    const owner = await prisma.user.findUnique({
      where: { id: ownerId },
      select: { companyName: true },
    });

    // Normalize phone to E.164 (India example)
    let rawPhone = service.client.phone.replace(/\D/g, "");
    const to = rawPhone.startsWith("91") ? rawPhone : `91${rawPhone}`;

    await sendWhatsAppTemplate({
      to,
      templateName: "vehicle_estimate", // Ensure this template exists in Meta
      languageCode: "en",
      variables: [
        service.client.ownerName,
        service.grandTotal ? `₹${service.grandTotal}` : "0",
        new Date(service.inDate).toLocaleDateString(),
        owner?.companyName || "Motor Desk",
      ],
    });

    // Update Service Approval Status
    const updatedService = await prisma.bikeService.update({
      where: { id: service.id },
      data: {
        approvalStatus: "PENDING",
        approvalAt: new Date(),
      },
    });

    return res.json({
      message: "WhatsApp Estimate sent!",
      service: updatedService,
    });
  } catch (error) {
    console.error("WhatsApp Approval error:", error);
    res.status(500).json({ message: "Failed to send approval" });
  }
};

/* ============================================================
   Send Vehicle Ready WhatsApp
   @route   POST /api/bike-services/:id/whatsapp-ready
   @access  Private
============================================================ */
export const sendBikeVehicleReadyWhatsApp = async (req, res) => {
  try {
    const serviceId = Number(req.params.id);
    const ownerId = getOwnerUserId(req.user);

    const service = await prisma.bikeService.findFirst({
      where: { id: serviceId, ownerUserId: ownerId },
      include: { client: true },
    });

    if (!service || !service.client?.phone) {
      return res
        .status(404)
        .json({ message: "Service or Client phone not found" });
    }

    const owner = await prisma.user.findUnique({
      where: { id: ownerId },
      select: { companyName: true },
    });

    const rawPhone = service.client.phone.replace(/\D/g, "");
    const to = rawPhone.startsWith("91") ? rawPhone : `91${rawPhone}`;

    await sendWhatsAppTemplate({
      to,
      templateName: "vehicle_ready",
      languageCode: "en",
      variables: [
        service.client.ownerName,
        service.client.regNumber,
        owner?.companyName || "Our Garage",
      ],
    });

    // ✅ Update status
    const updatedService = await prisma.bikeService.update({
      where: { id: service.id },
      data: {
        status: "Paid", // Or "Completed" based on business logic
        approvalStatus: "READY_SENT",
        approvalAt: new Date(),
      },
    });

    return res.json({
      message: "Vehicle Ready notification sent!",
      service: updatedService,
    });
  } catch (error) {
    console.error("WhatsApp Ready error:", error);
    res.status(500).json({ message: "Failed to send notification" });
  }
};