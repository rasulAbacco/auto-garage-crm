// server/routes/contactRoutes.js — public Contact Us form (POST /api/contact)
import express from "express";
import { z } from "zod";
import { sendContactEmails, ContactMailError } from "../services/contact/contact.service.js";

const router = express.Router();

const contactSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(100),
  email: z.string().trim().toLowerCase().email("Please enter a valid email address").max(200),
  message: z.string().trim().min(5, "Please write a short message").max(5000),
  website: z.string().optional(), // honeypot — real visitors never fill this
});

// Simple per-IP limit: 5 messages per 15 minutes (stops spam bursts)
const WINDOW_MS = 15 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const hits = new Map();

function rateLimited(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_PER_WINDOW) {
    hits.set(ip, recent);
    return true;
  }
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear(); // keep memory bounded
  return false;
}

router.post("/", async (req, res) => {
  const parsed = contactSchema.safeParse(req.body || {});
  if (!parsed.success) {
    return res.status(400).json({ success: false, message: parsed.error.issues[0]?.message || "Invalid input" });
  }
  const { name, email, message, website } = parsed.data;

  // Bot filled the hidden field → pretend success, send nothing
  if (website) return res.json({ success: true });

  const ip = (req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "").toString().split(",")[0].trim();
  if (rateLimited(ip)) {
    return res
      .status(429)
      .json({ success: false, message: "Too many messages. Please try again in a few minutes." });
  }

  try {
    const result = await sendContactEmails({ name, email, message, ip });
    return res.json({ success: true, acknowledged: result.acknowledged });
  } catch (err) {
    if (err instanceof ContactMailError) {
      return res.status(502).json({ success: false, message: err.message });
    }
    console.error("❌ Contact form error:", err);
    return res.status(500).json({ success: false, message: "Something went wrong. Please try again." });
  }
});

export default router;