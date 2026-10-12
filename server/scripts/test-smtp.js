// server/scripts/test-smtp.js
// Checks the SMTP login from .env without starting the app.
// Run from the server folder:   node scripts/test-smtp.js
import dotenv from "dotenv";
import nodemailer from "nodemailer";

dotenv.config();

const email = process.env.SMTP_EMAIL || "";
const pass = process.env.SMTP_PASS || "";
const host = process.env.SMTP_HOST || "smtp.gmail.com";
const port = Number(process.env.SMTP_PORT || 465);

console.log("SMTP_EMAIL      :", JSON.stringify(email));
console.log("SMTP_PASS length:", pass.length, "(a Google App Password is 16 letters, no spaces)");
if (/\s/.test(pass)) console.log("⚠️  SMTP_PASS contains spaces — remove them");
if (/^["']|["']$/.test(pass)) console.log("⚠️  SMTP_PASS has quote marks — remove them");
if (email !== email.trim()) console.log("⚠️  SMTP_EMAIL has extra spaces");
console.log("Server          :", `${host}:${port}`);

const transporter = nodemailer.createTransport({
  host,
  port,
  secure: port === 465,
  auth: { user: email, pass },
});

try {
  await transporter.verify();
  console.log("✅ Login OK — sending a test email to", email);
  await transporter.sendMail({
    from: email,
    to: email,
    subject: "MotorDesk SMTP test",
    text: "If you can read this, SMTP_EMAIL / SMTP_PASS are working.",
  });
  console.log("✅ Test email sent. Check the inbox of", email);
} catch (err) {
  console.log("❌ Failed:", err.message);
  if (/535|BadCredentials|Username and Password/i.test(err.message)) {
    console.log(
      "→ Google rejected the login. Create an App Password while signed in as",
      email || "(SMTP_EMAIL is empty)",
      "at https://myaccount.google.com/apppasswords and paste it into SMTP_PASS.",
    );
  }
}