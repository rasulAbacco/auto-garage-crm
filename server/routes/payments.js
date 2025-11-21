import express from "express";
import Razorpay from "razorpay";
import crypto from "crypto";
import prisma from "../models/prismaClient.js";

const router = express.Router();

// Razorpay Instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY,
  key_secret: process.env.RAZORPAY_SECRET,
});

/*
|--------------------------------------------------------------------------
| 1️⃣ CREATE ORDER
|--------------------------------------------------------------------------
*/
router.post("/create-order", async (req, res) => {
  try {
    const { amount } = req.body;

    const order = await razorpay.orders.create({
      amount: amount * 100,
      currency: "INR",
      receipt: "order_" + Date.now(),
    });

    return res.json({ success: true, order });

  } catch (err) {
    console.error("Order creation error:", err);
    return res.status(500).json({ error: "Order creation failed" });
  }
});

/*
|--------------------------------------------------------------------------
| 2️⃣ SAVE FORM DATA BEFORE PAYMENT
|--------------------------------------------------------------------------
*/
router.post("/save-form", async (req, res) => {
  try {
    const {
      customerName,
      companyName,
      email,
      phone,
      plan,
      billingPeriod,
      amount,
      orderId
    } = req.body;

    await prisma.payment.create({
      data: {
        customerName,
        companyName,
        email,
        phone,
        plan,
        billingPeriod,
        amount,
        orderId,
        status: "PENDING"
      }
    });

    return res.json({ success: true });

  } catch (err) {
    console.error("Form save error:", err);
    return res.status(500).json({ error: "Form save failed" });
  }
});

/*
|--------------------------------------------------------------------------
| 3️⃣ VERIFY PAYMENT & UPDATE DB
|--------------------------------------------------------------------------
*/
router.post("/verify", async (req, res) => {
  try {
    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
    } = req.body;

    // Validate payload
    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return res.status(400).json({ error: "Invalid payload" });
    }

    // Verify signature
    const secret = process.env.RAZORPAY_SECRET;
    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ error: "Invalid signature" });
    }

    // Update existing form entry using orderId
    await prisma.payment.updateMany({
      where: { orderId: razorpay_order_id },
      data: {
        paymentId: razorpay_payment_id,
        signature: razorpay_signature,
        status: "SUCCESS"
      }
    });

    // Redirect user to frontend after success
    return res.redirect(302, "http://localhost:5173/register");

  } catch (err) {
    console.error("Verification error:", err);
    return res.status(500).json({ error: "Verification failed" });
  }
});

export default router;
