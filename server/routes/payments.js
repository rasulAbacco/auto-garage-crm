// server/routes/payments.js

import express from "express";
import Razorpay from "razorpay";
import crypto from "crypto";
import prisma from "../models/prismaClient.js";

const router = express.Router();

// Razorpay Instance
// Razorpay Instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
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
      orderId,
      referenceCode,  // NEW
      gstNumber       // NEW
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
        referralCode: referenceCode || null,  // NEW
        gstNumber: gstNumber || null,         // NEW
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
  console.log("🔍 Verify endpoint called");
  console.log("📦 Request body:", req.body);

  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

    // ⭐ Validation 1: Check if all required fields are present
    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      console.error("❌ Missing required fields");
      return res.status(400).json({ 
        success: false,
        error: "Invalid payload - missing required fields" 
      });
    }

    console.log("✅ All required fields present");
    console.log("Payment ID:", razorpay_payment_id);
    console.log("Order ID:", razorpay_order_id);

    // ⭐ Validation 2: Verify signature
    const secret = process.env.RAZORPAY_KEY_SECRET;
    
    if (!secret) {
      console.error("❌ RAZORPAY_SECRET not configured");
      return res.status(500).json({ 
        success: false,
        error: "Server configuration error" 
      });
    }

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(body)
      .digest("hex");

    console.log("🔐 Expected signature:", expectedSignature);
    console.log("🔐 Received signature:", razorpay_signature);

    if (expectedSignature !== razorpay_signature) {
      console.error("❌ Signature mismatch!");
      return res.status(400).json({ 
        success: false,
        error: "Invalid signature - payment verification failed" 
      });
    }

    console.log("✅ Signature verified successfully");

    // ⭐ Find payment record using findFirst (since orderId is not unique in schema)
    const payment = await prisma.payment.findFirst({
      where: { orderId: razorpay_order_id }
    });

    if (!payment) {
      console.error("❌ Payment record not found for orderId:", razorpay_order_id);
      return res.status(404).json({ 
        success: false,
        error: "Payment record not found" 
      });
    }

    console.log("✅ Payment record found:", payment.id);

    // ⭐ Check if already verified
    if (payment.status === "SUCCESS") {
      console.log("⚠️ Payment already verified");
      return res.json({ 
        success: true, 
        payment,
        message: "Payment already verified" 
      });
    }

    // ⭐ Calculate expiry date
    const currentDate = new Date();
    let expiryDate = new Date(currentDate);
    
    if (payment.billingPeriod === "monthly") {
      expiryDate.setMonth(expiryDate.getMonth() + 1);
      console.log("📅 Expiry date set to 1 month from now:", expiryDate);
    } else if (payment.billingPeriod === "yearly") {
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);
      console.log("📅 Expiry date set to 1 year from now:", expiryDate);
    } else {
      console.warn("⚠️ Unknown billing period:", payment.billingPeriod);
    }

    // ⭐ Update payment record using the id field
    console.log("💾 Updating payment record...");
    const updated = await prisma.payment.update({
      where: { id: payment.id },  // Use id instead of orderId
      data: {
        paymentId: razorpay_payment_id,
        signature: razorpay_signature,
        status: "SUCCESS",
        paidAt: currentDate,
        expiryDate: expiryDate
      }
    });

    console.log("✅ Payment updated successfully:", {
      id: updated.id,
      paymentId: updated.paymentId,
      status: updated.status,
      paidAt: updated.paidAt,
      expiryDate: updated.expiryDate
    });

    // ⭐ After updating payment status to SUCCESS
    let referrer = null;

    // If referral code exists, find the user who referred
    if (payment.referralCode) {
      referrer = await prisma.user.findUnique({
        where: { myReferralCode: payment.referralCode }
      });
    }

    // ⭐ Check if user already exists
    let existingUser = await prisma.user.findUnique({
      where: { email: payment.email }
    });

    if (existingUser) {
      return res.json({
        success: true,
        payment: updated,
        userId: existingUser.id,
        message: "Payment verified successfully (existing user)"
      });
    }

    // ⭐ Generate referral code for new user
    const myReferralCode =
      "ATREF-" + Math.random().toString(36).substring(2, 8).toUpperCase();

    // ⭐ Create new user with temporary password
    const newUser = await prisma.user.create({
      data: {
        email: payment.email,
        password: "TEMP_PASSWORD",
        myReferralCode,
        referredByCode: payment.referralCode,
        referredByUserId: referrer?.id || null,
        allowedCrms: [],
      }
    });

    // ⭐ Return success + userId
    return res.json({
      success: true,
      payment: updated,
      userId: newUser.id,
      message: "Payment verified successfully & new user created"
    });


  } catch (err) {
    console.error("❌ Verification error:", err);
    console.error("Error stack:", err.stack);
    
    return res.status(500).json({ 
      success: false,
      error: "Verification failed",
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Fetch logged-in user's active plan
router.get("/user-plan/:email", async (req, res) => {
  try {
    const { email } = req.params;

    const payment = await prisma.payment.findFirst({
      where: { email, status: "SUCCESS" },
      orderBy: { paidAt: "desc" },
    });

    if (!payment) {
      return res.json({ success: false, message: "No active plan found" });
    }

    return res.json({ success: true, payment });
  } catch (err) {
    res.status(500).json({ error: "Error fetching plan" });
  }
});

export default router;