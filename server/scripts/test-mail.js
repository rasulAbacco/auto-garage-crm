// server/scripts/test-mail.js
// Checks the Microsoft 365 email settings from .env without starting the app.
// Run from the server folder:   node scripts/test-mail.js
import dotenv from "dotenv";
import { getTransporter, isMailConfigured, senderAddress } from "../services/paymentInvoice/mailer.js";

dotenv.config();

const show = (k) => {
  const v = process.env[k] || "";
  const masked = k === "MS_CLIENT_SECRET" ? (v ? `${"*".repeat(Math.max(0, v.length - 4))}${v.slice(-4)} (length ${v.length})` : "") : v;
  console.log(`${k.padEnd(17)}: ${masked ? JSON.stringify(masked) : "❌ MISSING"}`);
  if (v !== v.trim()) console.log(`   ⚠️  ${k} has extra spaces`);
  if (/^["']|["']$/.test(v)) console.log(`   ⚠️  ${k} has quote marks — remove them`);
};
["MS_TENANT_ID", "MS_CLIENT_ID", "MS_CLIENT_SECRET", "MS_SMTP_USER"].forEach(show);

// A Secret ID is a GUID (xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx); the secret VALUE is not
if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test((process.env.MS_CLIENT_SECRET || "").trim())) {
  console.log(
    "\n⚠️  MS_CLIENT_SECRET looks like the Secret ID, not the secret VALUE.\n" +
      "   Azure → App registrations → your app → Certificates & secrets → New client secret,\n" +
      "   then copy the 'Value' column immediately (it is only shown once).",
  );
}

if (!isMailConfigured()) {
  console.log("\n❌ Fill in all four MS_ values in server/.env and run again.");
  process.exit(1);
}

const to = process.argv[2] || senderAddress();
console.log(`\nSending a test email from ${senderAddress()} to ${to} ...`);

try {
  await getTransporter().sendMail({
    from: `"MotorDesk" <${senderAddress()}>`,
    to,
    subject: "MotorDesk email test",
    html: "<p>If you can read this, the Microsoft 365 email settings are working.</p>",
  });
  console.log(`✅ Sent! Check the inbox of ${to}.`);
} catch (err) {
  console.log("❌ Failed:", err.message);
  const m = err.message;
  if (/AADSTS7000215|invalid_client/i.test(m)) console.log("→ MS_CLIENT_SECRET is wrong. Use the secret's VALUE (not the Secret ID), or create a new secret.");
  else if (/AADSTS700016|unauthorized_client/i.test(m)) console.log("→ MS_CLIENT_ID is wrong or the app is not in this tenant.");
  else if (/AADSTS90002|AADSTS900023|tenant/i.test(m)) console.log("→ MS_TENANT_ID is wrong. Copy the Directory (tenant) ID from the app's Overview page.");
  else if (/ErrorAccessDenied|Access is denied|Authorization_RequestDenied/i.test(m)) console.log("→ Add Microsoft Graph APPLICATION permission 'Mail.Send' to the app and click 'Grant admin consent'.");
  else if (/MailboxNotEnabledForRESTAPI|ResourceNotFound|ErrorInvalidUser|MailboxNotFound/i.test(m)) console.log(`→ ${senderAddress()} has no Exchange Online mailbox. Assign it a Microsoft 365 licence that includes Exchange Online.`);
}