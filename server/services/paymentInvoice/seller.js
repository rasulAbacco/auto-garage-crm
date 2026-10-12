// server/services/paymentInvoice/seller.js
// Company details printed on subscription invoices. Edit here if needed.
export const SELLER = {
  name: "Abacco Technology",
  tagline: "MotorDesk Garage Management Software",
  // Reply-to / support address shown on the invoice (defaults to the sender)
  get supportEmail() {
    return process.env.MS_SMTP_USER || "";
  },
};