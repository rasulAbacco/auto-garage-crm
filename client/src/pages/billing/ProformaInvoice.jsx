// client/src/pages/billing/ProformaInvoice.jsx  (preview before generating the invoice)
import React from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { FiEdit, FiCheckCircle, FiArrowLeft, FiFileText } from "react-icons/fi";
import { useTheme } from "../../contexts/ThemeContext";
import Invoice from "./Invoice";
import { calcTotals, money } from "./billingUtils";
import { tk, btnBase } from "../clients/components/clientUi";

export default function InvoicePreview() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const t = tk(isDark);

  const invoiceDraft = location.state?.invoiceDraft;

  if (!invoiceDraft) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-4 lg:ml-16">
        <div
          className={`w-full max-w-md rounded-2xl border-2 p-6 text-center ${t.card}`}
        >
          <div
            className={`mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl ${t.chipNavy}`}
          >
            <FiFileText size={18} />
          </div>
          <h3
            className={`text-[16px] font-black uppercase tracking-tight ${t.heading}`}
          >
            Nothing to preview
          </h3>
          <p className={`mt-1 text-[14px] ${t.muted}`}>
            Open the billing form and press "Preview" to see a proforma invoice.
          </p>
          <Link
            to="/billing/new"
            className={`${btnBase} mt-5 h-10 px-4 ${t.btnPrimary}`}
          >
            Go to billing form
          </Link>
        </div>
      </div>
    );
  }

  const tot = calcTotals(
    invoiceDraft.costItems || [],
    invoiceDraft.discountAmount ?? invoiceDraft.discounts,
  );
  const backToForm = (autoSubmit = false) =>
    navigate("/billing/new", {
      state: {
        restoreForm: true,
        invoiceDraft,
        ...(autoSubmit && { autoSubmit: true }),
      },
    });

  return (
    <div className="min-h-screen pb-24 lg:ml-16 lg:pb-8">
      <div className="no-print mx-auto mb-4 flex max-w-[210mm] flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <button
            type="button"
            onClick={() => backToForm(false)}
            className={`inline-flex items-center gap-1.5 text-[12px] font-black uppercase tracking-[0.15em] ${t.muted} ${
              isDark ? "hover:text-white" : "hover:text-[#001F3F]"
            }`}
          >
            <FiArrowLeft size={14} /> Back to form
          </button>
          <h1
            className={`text-[16px] font-black uppercase tracking-tight ${t.heading}`}
          >
            Proforma{" "}
            <span className="font-light lowercase italic">preview.</span>
          </h1>
          <p className={`text-[12px] font-medium sm:text-[14px] ${t.muted}`}>
            Check everything before generating · payable{" "}
            <b className={t.heading}>{money(tot.roundedAmount)}</b>
          </p>
        </div>
        <div className="hidden gap-2 sm:flex">
          <button
            onClick={() => backToForm(false)}
            className={`${btnBase} h-10 border-2 px-4 ${t.btnGhost}`}
          >
            <FiEdit size={14} /> Edit
          </button>
          <button
            onClick={() => backToForm(true)}
            className={`${btnBase} h-10 px-4 ${t.btnPrimary} shadow-lg`}
          >
            <FiCheckCircle size={14} /> Confirm & generate
          </button>
        </div>
      </div>

      <Invoice previewData={invoiceDraft} />

      {/* phone action bar (above the bottom nav) */}
      <div
        className={`no-print fixed inset-x-0 z-30 border-t-2 p-3 backdrop-blur sm:hidden ${
          isDark
            ? "border-white/5 bg-[#000814]/95"
            : "border-[#CBD5E1] bg-white/95"
        }`}
        style={{ bottom: "calc(66px + env(safe-area-inset-bottom))" }}
      >
        <div className="mx-auto flex max-w-xl gap-2">
          <button
            onClick={() => backToForm(false)}
            className={`${btnBase} h-11 flex-1 border-2 ${t.btnGhost}`}
          >
            <FiEdit size={14} /> Edit
          </button>
          <button
            onClick={() => backToForm(true)}
            className={`${btnBase} h-11 flex-[2] ${t.btnPrimary} shadow-xl`}
          >
            <FiCheckCircle size={14} /> Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
