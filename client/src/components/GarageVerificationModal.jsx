// src/components/GarageVerificationModal.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  X,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  FileCheck,
  UploadCloud,
  Loader2,
  Info,
  ArrowRight,
  ArrowLeft,
  Lock,
  BadgeCheck,
  IdCard,
  CreditCard,
  Building2,
  Receipt,
} from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";
import { tk, btnBase } from "../pages/clients/components/clientUi";

const API_URL = import.meta.env.VITE_API_BASE_URL;
const FEE = 199;

const DOCS = [
  {
    id: "aadhar",
    title: "Owner's Aadhaar card",
    placeholder: "12-digit Aadhaar number",
    icon: IdCard,
    flag: "hasAadharDocument",
    required: true,
  },
  {
    id: "pan",
    title: "Owner's PAN card",
    placeholder: "10-character PAN",
    icon: CreditCard,
    flag: "hasPanDocument",
    required: true,
  },
  {
    id: "garageReg",
    title: "Garage registration",
    placeholder: "Registration / licence number",
    icon: Building2,
    flag: "hasGarageRegDocument",
    required: true,
  },
  {
    id: "gst",
    title: "GST certificate",
    placeholder: "15-character GSTIN",
    icon: Receipt,
    flag: "hasGstDocument",
    required: false,
  },
];

export default function GarageVerificationModal({
  isOpen,
  onClose,
  verification,
  onRefreshState,
}) {
  const { isDark } = useTheme();
  const t = tk(isDark);

  const [currentStep, setCurrentStep] = useState(1); // 1 = overview, 2 = documents, 3 = pay / resubmit
  const [submittingData, setSubmittingData] = useState(false);
  const [modalMessage, setModalMessage] = useState({ type: "", text: "" });
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  const [docNumbers, setDocNumbers] = useState({
    pan: verification?.panNumber || "",
    aadhar: verification?.aadharNumber || "",
    garageReg: verification?.garageRegNumber || "",
    gst: verification?.gstNumber || "",
  });

  // files are kept here and only sent after payment / on resubmit
  const [draftFiles, setDraftFiles] = useState({
    aadhar: null,
    pan: null,
    garageReg: null,
    gst: null,
  });

  useEffect(() => {
    if (!isOpen) return;
    if (document.getElementById("razorpay-js")) {
      setRazorpayLoaded(true);
      return;
    }
    const script = document.createElement("script");
    script.id = "razorpay-js";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => setRazorpayLoaded(true);
    document.body.appendChild(script);
  }, [isOpen]);

  useEffect(() => {
    if (verification) {
      setDocNumbers({
        pan: verification.panNumber || "",
        aadhar: verification.aadharNumber || "",
        garageReg: verification.garageRegNumber || "",
        gst: verification.gstNumber || "",
      });
      if (verification.status !== "NOT_ORDERED" && currentStep === 1)
        setCurrentStep(2);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verification]);

  if (!isOpen) return null;

  const close = () => {
    if (submittingData) return;
    setModalMessage({ type: "", text: "" });
    onClose();
  };

  const handleLocalFileSelection = (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setDraftFiles((prev) => ({ ...prev, [type]: file }));
    setModalMessage({ type: "success", text: `${file.name} added.` });
  };

  const commitDataToProductionBackend = async (paymentDetails = null) => {
    setSubmittingData(true);
    setModalMessage({ type: "info", text: "Uploading your documents…" });

    const fd = new FormData();
    if (paymentDetails) {
      fd.append("razorpay_payment_id", paymentDetails.razorpay_payment_id);
      fd.append("razorpay_order_id", paymentDetails.razorpay_order_id);
      fd.append("razorpay_signature", paymentDetails.razorpay_signature);
    }
    fd.append("panNumber", docNumbers.pan.trim().toUpperCase());
    fd.append("aadharNumber", docNumbers.aadhar.replace(/\s+/g, ""));
    fd.append("garageRegNumber", docNumbers.garageReg.trim());
    fd.append("gstNumber", docNumbers.gst.trim().toUpperCase());
    if (draftFiles.pan) fd.append("panDocument", draftFiles.pan);
    if (draftFiles.aadhar) fd.append("aadharDocument", draftFiles.aadhar);
    if (draftFiles.garageReg)
      fd.append("garageRegDocument", draftFiles.garageReg);
    if (draftFiles.gst) fd.append("gstDocument", draftFiles.gst);

    try {
      const token = localStorage.getItem("token");
      const isReupload = [
        "REJECTED",
        "UNDER_REVIEW",
        "PAID_PENDING_DOCS",
      ].includes(verification?.status);
      await axios({
        method: isReupload ? "PUT" : "POST",
        url: isReupload
          ? `${API_URL}/api/garage-verification/resubmit-documents`
          : `${API_URL}/api/garage-verification/confirm-payment-and-upload`,
        data: fd,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      setModalMessage({
        type: "success",
        text: "Submitted! Your garage is now under review – we'll update the badge once it's checked.",
      });
      await onRefreshState?.();
      setTimeout(() => onClose(), 1500);
    } catch (error) {
      setModalMessage({
        type: "error",
        text:
          error.response?.data?.message || "Upload failed. Please try again.",
      });
    } finally {
      setSubmittingData(false);
    }
  };

  const executePaymentCheckout = async () => {
    if (!razorpayLoaded || !window.Razorpay) {
      setModalMessage({
        type: "error",
        text: "Payment window is still loading. Please try again in a moment.",
      });
      return;
    }
    setSubmittingData(true);
    setModalMessage({ type: "", text: "" });

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${API_URL}/api/payments/create-verification-order`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ amount: FEE }),
        },
      );
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.message || "Could not start the payment");

      const rzp = new window.Razorpay({
        key: data.razorpayKey,
        amount: data.order.amount,
        currency: "INR",
        name: "MotorDesk",
        description: "Verified Garage badge",
        order_id: data.order.id,
        theme: { color: "#001F3F" },
        handler: async (response) => {
          await commitDataToProductionBackend(response);
        },
        modal: { escape: false, backdropclose: false },
      });
      rzp.open();
    } catch (error) {
      setModalMessage({
        type: "error",
        text: error.message || "Could not start the payment",
      });
    } finally {
      setSubmittingData(false);
    }
  };

  const isPaidUser =
    verification?.status !== "NOT_ORDERED" &&
    verification?.status !== undefined;
  const isRejectedState = verification?.status === "REJECTED";

  const docReady = (d) => {
    const hasFile = verification?.[d.flag] || draftFiles[d.id];
    const num = docNumbers[d.id].replace(/\s+/g, "");
    if (d.id === "aadhar") return hasFile && num.length >= 12;
    if (d.id === "pan") return hasFile && num.length >= 10;
    if (d.id === "garageReg") return hasFile && num.length > 0;
    return true;
  };
  const isDraftFormFilled = DOCS.filter((d) => d.required).every(docReady);
  const readyCount = DOCS.filter((d) => d.required && docReady(d)).length;

  const steps = [
    { step: 1, text: "Overview" },
    { step: 2, text: "Documents" },
    { step: 3, text: isPaidUser ? "Resubmit" : "Pay & submit" },
  ];

  const msgCls =
    modalMessage.type === "success"
      ? "border-green-500/30 bg-green-500/10 text-green-600"
      : modalMessage.type === "error"
        ? "border-red-500/30 bg-red-500/10 text-red-500"
        : `${t.inner} ${t.body}`;

  return (
    <div
      className="fixed inset-0 z-[110] flex items-end justify-center bg-[#000814]/60 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={close}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        className={`flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl border-2 sm:rounded-2xl ${t.card}`}
      >
        {/* header */}
        <div className="bg-gradient-to-br from-[#001F3F] to-[#000814] px-4 pb-4 pt-4 text-white sm:px-5">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#001F3F]">
              <ShieldCheck size={18} />
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="text-[14px] font-black uppercase tracking-tight">
                Garage{" "}
                <span className="font-light lowercase italic">
                  verification
                </span>
              </h3>
              <p className="text-[12px] text-white/60">
                Get the Verified badge on your garage profile
              </p>
            </div>
            <button
              type="button"
              onClick={close}
              aria-label="Close"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border-2 border-white/10 text-slate-200 hover:bg-white/10"
            >
              <X size={14} />
            </button>
          </div>

          {/* stepper */}
          <ol className="mt-4 grid grid-cols-3 gap-2">
            {steps.map((s) => {
              const done = currentStep > s.step;
              const now = currentStep === s.step;
              return (
                <li key={s.step} className="min-w-0">
                  <div
                    className={`h-1 rounded-sm ${done || now ? "bg-white" : "bg-white/15"}`}
                  />
                  <p
                    className={`mt-1.5 flex items-center gap-1 truncate text-[12px] font-black uppercase tracking-wider ${now ? "text-white" : done ? "text-white/70" : "text-white/40"}`}
                  >
                    {done ? (
                      <CheckCircle2 size={12} className="shrink-0" />
                    ) : (
                      <span className="shrink-0">0{s.step}</span>
                    )}
                    <span className="truncate">{s.text}</span>
                  </p>
                </li>
              );
            })}
          </ol>
        </div>

        {/* message */}
        {modalMessage.text && (
          <div className="px-4 pt-3 sm:px-5">
            <div
              className={`flex items-start gap-2 rounded-xl border-2 px-3 py-2.5 text-[14px] font-semibold ${msgCls}`}
            >
              {modalMessage.type === "info" ? (
                <Loader2 size={16} className="mt-0.5 shrink-0 animate-spin" />
              ) : modalMessage.type === "success" ? (
                <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
              ) : (
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
              )}
              <span>{modalMessage.text}</span>
            </div>
          </div>
        )}

        {/* body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {currentStep === 1 && (
            <div className="space-y-4">
              <div
                className={`flex items-start gap-3 rounded-xl border-2 p-3 ${t.inner}`}
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-500/10 text-green-600">
                  <BadgeCheck size={18} />
                </span>
                <div>
                  <p className={`text-[14px] font-black ${t.heading}`}>
                    Why get verified?
                  </p>
                  <p className={`text-[14px] ${t.muted}`}>
                    Customers see a Verified badge on your garage in the
                    MotorDesk app and on your invoices, so they trust you
                    faster.
                  </p>
                </div>
              </div>

              <div>
                <p className="mb-2 text-[12px] font-bold uppercase tracking-wider text-slate-400">
                  You'll need
                </p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {DOCS.map((d) => {
                    const Icon = d.icon;
                    return (
                      <div
                        key={d.id}
                        className={`flex items-center gap-2.5 rounded-xl border-2 p-2.5 ${t.inner}`}
                      >
                        <span
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${t.chipNavy}`}
                        >
                          <Icon size={14} />
                        </span>
                        <span className={`text-[14px] font-bold ${t.heading}`}>
                          {d.title}
                        </span>
                        {!d.required && (
                          <span
                            className={`ml-auto text-[12px] font-bold uppercase ${t.muted}`}
                          >
                            Optional
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-start gap-2 rounded-xl border-2 border-amber-500/30 bg-amber-500/10 p-3">
                <Info size={16} className="mt-0.5 shrink-0 text-amber-600" />
                <p className={`text-[14px] ${t.body}`}>
                  One-time fee of <b className={t.heading}>₹{FEE}</b>. No
                  monthly charge.
                </p>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-3">
              {verification?.adminNotes && (
                <div className="flex items-start gap-2 rounded-xl border-2 border-red-500/30 bg-red-500/10 px-3 py-2.5 text-[14px] font-semibold text-red-500">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  <span>
                    <b>Please fix:</b> {verification.adminNotes}
                  </span>
                </div>
              )}

              <p
                className={`text-[12px] font-bold uppercase tracking-wider ${t.muted}`}
              >
                {readyCount} of 3 required documents ready · JPG, PNG or PDF
              </p>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {DOCS.map((d) => {
                  const Icon = d.icon;
                  const saved = verification?.[d.flag];
                  const draft = draftFiles[d.id];
                  const locked = saved && !isRejectedState;
                  const ready = docReady(d) && (saved || draft);
                  return (
                    <div
                      key={d.id}
                      className={`space-y-2.5 rounded-xl border-2 p-3 ${ready ? "!border-green-500/40" : ""} ${t.inner}`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon size={14} className="shrink-0 text-slate-400" />
                        <span
                          className={`min-w-0 flex-1 truncate text-[14px] font-black ${t.heading}`}
                        >
                          {d.title}
                        </span>
                        {(saved || draft) && (
                          <span
                            className={`inline-flex shrink-0 items-center gap-1 rounded-md border px-1.5 py-px text-[12px] font-black uppercase tracking-wider ${
                              draft
                                ? "border-amber-500/30 bg-amber-500/10 text-amber-600"
                                : "border-green-500/30 bg-green-500/10 text-green-600"
                            }`}
                          >
                            <FileCheck size={12} /> {draft ? "Added" : "Saved"}
                          </span>
                        )}
                        {!d.required && !saved && !draft && (
                          <span
                            className={`text-[12px] font-bold uppercase ${t.muted}`}
                          >
                            Optional
                          </span>
                        )}
                      </div>

                      <input
                        type="text"
                        value={docNumbers[d.id]}
                        disabled={locked}
                        onChange={(e) =>
                          setDocNumbers((p) => ({
                            ...p,
                            [d.id]: e.target.value,
                          }))
                        }
                        placeholder={d.placeholder}
                        autoCapitalize={
                          d.id === "pan" || d.id === "gst"
                            ? "characters"
                            : undefined
                        }
                        inputMode={d.id === "aadhar" ? "numeric" : undefined}
                        className={`h-10 w-full rounded-xl border-2 px-3 font-mono text-[14px] font-semibold uppercase outline-none transition disabled:cursor-not-allowed disabled:opacity-60 ${t.input}`}
                      />

                      <input
                        type="file"
                        id={`modal-file-${d.id}`}
                        disabled={submittingData || locked}
                        onChange={(e) => handleLocalFileSelection(e, d.id)}
                        className="hidden"
                        accept=".jpg,.jpeg,.png,.pdf"
                      />
                      <label
                        htmlFor={`modal-file-${d.id}`}
                        className={`flex h-10 w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed px-3 text-[12px] font-black uppercase tracking-wider transition ${
                          locked
                            ? `cursor-not-allowed opacity-60 ${t.line} ${t.muted}`
                            : `cursor-pointer ${isDark ? "border-white/20 text-white hover:border-white/50" : "border-[#CBD5E1] text-[#001F3F] hover:border-[#001F3F]"}`
                        }`}
                      >
                        {locked ? (
                          <Lock size={14} />
                        ) : (
                          <UploadCloud size={14} />
                        )}
                        <span className="truncate">
                          {locked
                            ? "Saved on server"
                            : draft
                              ? draft.name
                              : "Choose file"}
                        </span>
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="mx-auto max-w-sm space-y-4 py-2 text-center">
              <span
                className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl ${t.chipNavy}`}
              >
                {isPaidUser ? <UploadCloud size={22} /> : <Lock size={22} />}
              </span>
              <div>
                <h4
                  className={`text-[16px] font-black uppercase tracking-tight ${t.heading}`}
                >
                  {isPaidUser ? (
                    <>
                      Send{" "}
                      <span className="font-light lowercase italic">
                        for review
                      </span>
                    </>
                  ) : (
                    <>
                      Pay{" "}
                      <span className="font-light lowercase italic">
                        & submit
                      </span>
                    </>
                  )}
                </h4>
                <p className={`text-[14px] ${t.muted}`}>
                  {isPaidUser
                    ? "Your updated documents will be checked again."
                    : "After payment your documents are uploaded and sent for review."}
                </p>
              </div>

              {!isPaidUser && (
                <div
                  className={`overflow-hidden rounded-xl border-2 text-left ${t.line}`}
                >
                  <div
                    className={`flex items-center justify-between px-4 py-2.5 text-[14px] ${t.body}`}
                  >
                    <span>Verified Garage badge</span>
                    <span className="font-mono font-bold">₹{FEE}.00</span>
                  </div>
                  <div
                    className={`flex items-center justify-between border-t-2 px-4 py-2.5 ${t.line} ${t.cardHead}`}
                  >
                    <span
                      className={`text-[12px] font-black uppercase tracking-wider ${t.heading}`}
                    >
                      Total · one-time
                    </span>
                    <span
                      className={`font-mono text-[16px] font-black ${t.heading}`}
                    >
                      ₹{FEE}
                    </span>
                  </div>
                </div>
              )}

              {isPaidUser ? (
                <button
                  type="button"
                  onClick={() => commitDataToProductionBackend(null)}
                  disabled={submittingData || !isDraftFormFilled}
                  className={`${btnBase} h-11 w-full shadow-lg ${t.btnPrimary}`}
                >
                  {submittingData ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <CheckCircle2 size={14} />
                  )}
                  {submittingData ? "Sending…" : "Resubmit for review"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={executePaymentCheckout}
                  disabled={submittingData}
                  className={`${btnBase} h-11 w-full shadow-lg ${t.btnPrimary}`}
                >
                  {submittingData ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Lock size={14} />
                  )}
                  {submittingData ? "Opening payment…" : `Pay ₹${FEE} & submit`}
                </button>
              )}
              <p
                className={`flex items-center justify-center gap-1.5 text-[12px] ${t.muted}`}
              >
                <ShieldCheck size={12} className="text-green-500" /> Secure
                payment by Razorpay
              </p>
            </div>
          )}
        </div>

        {/* footer */}
        <div
          className={`flex items-center justify-between gap-2 border-t-2 px-4 py-3 sm:px-5 ${t.line}`}
        >
          <button
            type="button"
            onClick={() => {
              setModalMessage({ type: "", text: "" });
              setCurrentStep((p) => Math.max(1, p - 1));
            }}
            disabled={currentStep === 1 || submittingData}
            className={`${btnBase} h-10 border-2 px-4 ${t.btnGhost} disabled:invisible`}
          >
            <ArrowLeft size={14} /> Back
          </button>

          {currentStep === 1 && (
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className={`${btnBase} h-10 px-4 ${t.btnPrimary}`}
            >
              Continue <ArrowRight size={14} />
            </button>
          )}
          {currentStep === 2 && (
            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              disabled={!isDraftFormFilled}
              className={`${btnBase} h-10 px-4 ${t.btnPrimary}`}
            >
              {isPaidUser ? "Review" : "Next: payment"} <ArrowRight size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
