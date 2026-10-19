import prisma from "../models/prismaClient.js";

/* ---------------------------------------------------------
   Helpers
   --------------------------------------------------------- */

// Only these fields can be written from the client
const buildInventoryData = (body) => ({
  itemCode: String(body.itemCode || "").trim(),
  itemName: String(body.itemName || "").trim(),
  category: String(body.category || "").trim(),
  brand: body.brand || null,
  model: body.model || null,
  partNumber: body.partNumber || null,
  supplier: body.supplier || null,
  purchasePrice: Number(body.purchasePrice || 0),
  sellingPrice: Number(body.sellingPrice || 0),
  quantity: Number(body.quantity || 0),
  minimumStock: Number(body.minimumStock ?? 5),
  unit: body.unit || "pcs",
  location: body.location || null,
  description: body.description || null,
  status: body.status || "Available",
});

const isDuplicateCode = (err) =>
  err?.code === "P2002" && String(err?.meta?.target || "").includes("itemCode");

// Find an item only if it belongs to the logged-in garage
const findOwnItem = (userId, id) =>
  prisma.inventory.findFirst({ where: { id: Number(id), userId } });

/* ---------------------------------------------------------
   Inventory CRUD
   --------------------------------------------------------- */

export const createInventory = async (req, res) => {
  try {
    const data = buildInventoryData(req.body);

    if (!data.itemCode || !data.itemName || !data.category) {
      return res
        .status(400)
        .json({ message: "Item code, name and category are required" });
    }

    const inventory = await prisma.inventory.create({
      data: { ...data, userId: req.user.id },
    });

    res.status(201).json(inventory);
  } catch (err) {
    if (isDuplicateCode(err)) {
      return res.status(409).json({
        message: `Item code "${req.body.itemCode}" already exists in your inventory`,
      });
    }
    console.error("Create inventory failed:", err);
    res.status(500).json({ message: "Inventory save failed" });
  }
};

export const getInventory = async (req, res) => {
  try {
    const inventory = await prisma.inventory.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: "desc" },
    });
    res.json(inventory);
  } catch (err) {
    console.error("Get inventory failed:", err);
    res.status(500).json({ message: "Failed to load inventory" });
  }
};

export const getInventoryById = async (req, res) => {
  try {
    const item = await findOwnItem(req.user.id, req.params.id);
    if (!item) return res.status(404).json({ message: "Item not found" });
    res.json(item);
  } catch (err) {
    console.error("Get inventory item failed:", err);
    res.status(500).json({ message: "Failed to load item" });
  }
};

export const updateInventory = async (req, res) => {
  try {
    const existing = await findOwnItem(req.user.id, req.params.id);
    if (!existing) return res.status(404).json({ message: "Item not found" });

    const data = buildInventoryData(req.body);
    if (!data.itemCode || !data.itemName || !data.category) {
      return res
        .status(400)
        .json({ message: "Item code, name and category are required" });
    }

    const inventory = await prisma.inventory.update({
      where: { id: existing.id },
      data,
    });

    res.json(inventory);
  } catch (err) {
    if (isDuplicateCode(err)) {
      return res.status(409).json({
        message: `Item code "${req.body.itemCode}" already exists in your inventory`,
      });
    }
    console.error("Update inventory failed:", err);
    res.status(500).json({ message: "Inventory update failed" });
  }
};

export const deleteInventory = async (req, res) => {
  try {
    const existing = await findOwnItem(req.user.id, req.params.id);
    if (!existing) return res.status(404).json({ message: "Item not found" });

    await prisma.inventory.delete({ where: { id: existing.id } });
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    console.error("Delete inventory failed:", err);
    res.status(500).json({ message: "Delete failed" });
  }
};

/* ---------------------------------------------------------
   Suppliers
   --------------------------------------------------------- */

export const getSuppliers = async (req, res) => {
  try {
    const suppliers = await prisma.supplier.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: "desc" },
    });
    res.json(suppliers);
  } catch (err) {
    console.error("Failed to fetch suppliers", err);
    res.status(500).json({ message: "Failed to fetch suppliers" });
  }
};

export const createSupplier = async (req, res) => {
  try {
    const supplierName = String(req.body.supplierName || "").trim();
    const supplierContact = String(req.body.supplierContact || "").trim();

    if (!supplierName || !supplierContact) {
      return res
        .status(400)
        .json({ message: "Supplier name and contact are required" });
    }

    const supplier = await prisma.supplier.create({
      data: { supplierName, supplierContact, userId: req.user.id },
    });

    res.status(201).json(supplier);
  } catch (err) {
    console.error("Supplier creation failed:", err);
    res.status(500).json({ message: "Supplier creation failed" });
  }
};

/* ---------------------------------------------------------
   Deduct stock (single item or { items: [...] })
   All rows succeed or fail together.
   --------------------------------------------------------- */

export const deductInventory = async (req, res) => {
  try {
    const userId = req.user.id;
    const items = Array.isArray(req.body)
      ? req.body
      : Array.isArray(req.body.items)
        ? req.body.items
        : [req.body];

    if (!items.length) {
      return res
        .status(400)
        .json({ message: "No items provided for deduction" });
    }

    for (let i = 0; i < items.length; i++) {
      const { itemCode, itemId, quantity } = items[i];
      const qty = Number(quantity);

      if (!itemCode && !itemId) {
        return res
          .status(400)
          .json({ message: `Item code or ID is required for row ${i + 1}` });
      }
      if (!Number.isFinite(qty) || qty <= 0) {
        return res
          .status(400)
          .json({ message: `Enter a valid quantity for row ${i + 1}` });
      }
    }

    const updatedItems = await prisma.$transaction(async (tx) => {
      const updatedList = [];

      for (const row of items) {
        const qty = Number(row.quantity);

        // Always scoped to this garage
        const item = row.itemId
          ? await tx.inventory.findFirst({
              where: { id: Number(row.itemId), userId },
            })
          : await tx.inventory.findUnique({
              where: {
                userId_itemCode: { userId, itemCode: String(row.itemCode) },
              },
            });

        if (!item) {
          throw new Error(`Item ${row.itemCode || row.itemId} not found`);
        }
        if (item.quantity < qty) {
          throw new Error(
            `Insufficient stock for ${item.itemName} (${item.itemCode}). Available: ${item.quantity}, requested: ${qty}`,
          );
        }

        const newQty = item.quantity - qty;
        const updated = await tx.inventory.update({
          where: { id: item.id },
          data: {
            quantity: newQty,
            status:
              newQty === 0
                ? "Out of Stock"
                : newQty <= item.minimumStock
                  ? "Low Stock"
                  : "Available",
          },
        });

        updatedList.push(updated);
      }

      return updatedList;
    });

    res.json({ message: "Stock deducted successfully", data: updatedItems });
  } catch (err) {
    console.error("Deduct inventory error:", err);
    res.status(400).json({ message: err.message || "Failed to deduct stock" });
  }
};
