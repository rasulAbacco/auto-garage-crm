// server/puncher/validators/puncher.validators.js
import { z } from "zod";

const optionalText = z
  .string()
  .trim()
  .max(500)
  .optional()
  .nullable()
  .transform((v) => (v === "" ? null : v));

export const vehicleTypeSchema = z.enum(["CAR", "BIKE"]);
export const vehicleSupportSchema = z.enum(["CAR", "BIKE", "BOTH"]);
export const serviceStatusSchema = z.enum([
  "PENDING",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
]);

export const shopSchema = z.object({
  vehicleSupport: vehicleSupportSchema.optional(),
  shopName: optionalText,
});

export const clientSchema = z.object({
  fullName: z.string().trim().min(2, "Name must be at least 2 characters").max(120),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9+\-\s]{6,15}$/, "Enter a valid phone number"),
  email: z
    .string()
    .trim()
    .email("Enter a valid email")
    .optional()
    .nullable()
    .or(z.literal("").transform(() => null)),
  address: optionalText,
  vehicleType: vehicleTypeSchema,
  vehicleMake: optionalText,
  vehicleModel: optionalText,
  regNumber: z
    .string()
    .trim()
    .max(20)
    .optional()
    .nullable()
    .transform((v) => (v ? v.toUpperCase() : null)),
  notes: optionalText,
});

export const serviceSchema = z.object({
  clientId: z.coerce.number().int().positive(),
  vehicleType: vehicleTypeSchema.optional(), // defaults to the client's vehicle
  serviceType: z.string().trim().min(1).max(40),
  serviceName: z.string().trim().max(120).optional(),
  tyrePosition: optionalText,
  quantity: z.coerce.number().int().min(1).max(100).default(1),
  unitPrice: z.coerce.number().min(0).max(1000000),
  status: serviceStatusSchema.optional(),
  notes: optionalText,
  serviceDate: z.coerce.date().optional(),
});

export const billingSchema = z
  .object({
    clientId: z.coerce.number().int().positive(),
    serviceIds: z.array(z.coerce.number().int().positive()).default([]),
    extraItems: z
      .array(
        z.object({
          description: z.string().trim().min(1).max(200),
          quantity: z.coerce.number().int().min(1).max(100).default(1),
          unitPrice: z.coerce.number().min(0).max(1000000),
        }),
      )
      .default([]),
    discount: z.coerce.number().min(0).default(0),
    gstPercent: z.coerce.number().min(0).max(28).default(0),
    paymentMode: z.enum(["CASH", "UPI", "CARD", "BANK_TRANSFER"]).optional().nullable(),
    status: z.enum(["PENDING", "PAID"]).default("PENDING"),
    notes: optionalText,
  })
  .refine((b) => b.serviceIds.length + b.extraItems.length > 0, {
    message: "Add at least one service or item to the bill",
  });

/** Turns a zod error into a friendly 400 response body */
export const zodMessage = (err) =>
  err?.issues?.map((i) => `${i.path.join(".") || "body"}: ${i.message}`).join(", ") ||
  "Invalid input";
