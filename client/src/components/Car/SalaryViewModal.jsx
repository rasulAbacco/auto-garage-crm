// client/src/components/Car/SalaryViewModal.jsx
// Salary slip (payslip) – A4 document with PDF download.
import React, { useRef, useState, useEffect } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { ArrowLeft, Download, Loader2, Receipt } from "lucide-react";
import { HiMiniWrenchScrewdriver } from "react-icons/hi2";

/* ================= HELPERS ================= */
const NAVY = "#001F3F";

const n = (v) => {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
};

const money = (v) =>
  n(v).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatMonthYear = (month, year) =>
  new Date(year, month - 1).toLocaleString("en-IN", {
    month: "long",
    year: "numeric",
  });

const fmtDate = (d) => {
  if (!d) return "";
  const dt = new Date(d);
  return Number.isNaN(dt.getTime())
    ? ""
    : dt.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
};

const getFinancialYear = (month, year) => {
  const start = month >= 4 ? year : year - 1;
  return `${start}-${String(start + 1).slice(-2)}`;
};

// Indian numbering: Crore / Lakh / Thousand / Hundred, with paise
const ONES = [
  "",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Eleven",
  "Twelve",
  "Thirteen",
  "Fourteen",
  "Fifteen",
  "Sixteen",
  "Seventeen",
  "Eighteen",
  "Nineteen",
];
const TENS = [
  "",
  "",
  "Twenty",
  "Thirty",
  "Forty",
  "Fifty",
  "Sixty",
  "Seventy",
  "Eighty",
  "Ninety",
];
const twoDigits = (x) =>
  x < 20
    ? ONES[x]
    : `${TENS[Math.floor(x / 10)]}${x % 10 ? ` ${ONES[x % 10]}` : ""}`;
const threeDigits = (x) => {
  const h = Math.floor(x / 100);
  const r = x % 100;
  return [h ? `${ONES[h]} Hundred` : "", r ? twoDigits(r) : ""]
    .filter(Boolean)
    .join(" ");
};
const intToWords = (num) => {
  if (num === 0) return "Zero";
  const parts = [];
  const crore = Math.floor(num / 10000000);
  const lakh = Math.floor((num % 10000000) / 100000);
  const thousand = Math.floor((num % 100000) / 1000);
  const rest = num % 1000;
  if (crore) parts.push(`${intToWords(crore)} Crore`);
  if (lakh) parts.push(`${twoDigits(lakh)} Lakh`);
  if (thousand) parts.push(`${twoDigits(thousand)} Thousand`);
  if (rest) parts.push(threeDigits(rest));
  return parts.join(" ");
};
const amountInWords = (amount) => {
  const v = Math.abs(n(amount));
  const rupees = Math.floor(v);
  const paise = Math.round((v - rupees) * 100);
  return `Rupees ${intToWords(rupees)}${paise ? ` and ${twoDigits(paise)} Paise` : ""} Only`;
};

/* ================= DOCUMENT PIECES ================= */
const InfoRow = ({ label, value }) => (
  <tr>
    <td
      style={{
        padding: "5px 0",
        width: "44%",
        color: "#64748B",
        fontSize: 11,
        fontWeight: 600,
        verticalAlign: "top",
      }}
    >
      {label}
    </td>
    <td
      style={{
        padding: "5px 0",
        color: NAVY,
        fontSize: 12,
        fontWeight: 700,
        verticalAlign: "top",
      }}
    >
      {value || "—"}
    </td>
  </tr>
);

export default function SalaryViewModal({ salary, companyProfile, onClose }) {
  const payslipRef = useRef(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [scale, setScale] = useState(1);
  const [sheetH, setSheetH] = useState(1123); // 297mm in px
  const [logoFailed, setLogoFailed] = useState(false);

  useEffect(() => {
    const el = payslipRef.current;
    if (el && el.offsetHeight && el.offsetHeight !== sheetH)
      setSheetH(el.offsetHeight);
  });

  // shrink the A4 preview to fit phones / tablets
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setScale(width < 850 ? (width - 32) / 794 : 1);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (!salary) return null;

  /* ---------- figures ---------- */
  const month = Number(salary.month);
  const year = Number(salary.year);
  const daysInMonth = month && year ? new Date(year, month, 0).getDate() : 30;
  const leaves = n(salary.leaves);
  const paidDays = Math.max(0, daysInMonth - leaves);

  const earnings = [
    { label: "Basic Salary", amount: n(salary.baseSalary) },
    { label: "Bonus / Incentive", amount: n(salary.bonus) },
  ];
  const deductions = [
    {
      label: `Leave Deduction${leaves ? ` (${leaves} day${leaves === 1 ? "" : "s"})` : ""}`,
      amount: n(salary.leaveDeduction),
    },
    { label: "Other Deductions", amount: n(salary.extraDeductions) },
  ];

  const gross = earnings.reduce((s, r) => s + r.amount, 0);
  let totalDed = deductions.reduce((s, r) => s + r.amount, 0);
  const computedNet = gross - totalDed;

  // If the saved net differs (e.g. advance recovered on the server), show the gap as its own line so the slip adds up.
  const savedNet =
    salary.netSalary !== undefined && salary.netSalary !== null
      ? n(salary.netSalary)
      : computedNet;
  const gap = Math.round((computedNet - savedNet) * 100) / 100;
  if (gap > 0) {
    deductions.push({ label: "Advance / Adjustment", amount: gap });
    totalDed += gap;
  } else if (gap < 0) {
    earnings.push({ label: "Other Earnings / Adjustment", amount: -gap });
  }
  const grossShown = earnings.reduce((s, r) => s + r.amount, 0);
  const netPay = grossShown - totalDed;

  const rows = Math.max(earnings.length, deductions.length);
  const isPaid = salary.status === "PAID";
  const period = month && year ? formatMonthYear(month, year) : "";
  const slipNo = `PS-${year || ""}${String(month || "").padStart(2, "0")}-${String(salary.staff?.id ?? salary.staffId ?? salary.id ?? "").padStart(4, "0")}`;

  const company = {
    name: companyProfile?.companyName || companyProfile?.name || "Garage",
    address: companyProfile?.address || "",
    phone:
      companyProfile?.phone ||
      companyProfile?.mobile ||
      companyProfile?.contactNumber ||
      "",
    email: companyProfile?.email || "",
    gst:
      companyProfile?.gstNumber ||
      companyProfile?.gstin ||
      companyProfile?.gst ||
      "",
    logo: companyProfile?.logo || companyProfile?.logoUrl || "",
  };

  /* ---------- PDF ---------- */
  const handleDownloadPdf = async () => {
    setIsDownloading(true);
    try {
      const canvas = await html2canvas(payslipRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        width: 794,
        onclone: (doc) => {
          const wrap = doc.getElementById("payslip-scale-wrap");
          if (wrap) wrap.style.transform = "none";
        },
      });
      const pdf = new jsPDF("p", "mm", "a4");
      pdf.addImage(
        canvas.toDataURL("image/png"),
        "PNG",
        0,
        0,
        210,
        (canvas.height * 210) / canvas.width,
      );
      const safeName = String(salary.staff?.name || "Staff").replace(
        /[^\w-]+/g,
        "_",
      );
      pdf.save(
        `Payslip_${safeName}_${period.replace(/\s+/g, "_") || "slip"}.pdf`,
      );
    } catch (error) {
      console.error("PDF Error:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  /* ---------- styles for the document ---------- */
  const cell = {
    padding: "8px 12px",
    fontSize: 12,
    color: NAVY,
    borderBottom: "1px solid #E2E8F0",
  };
  const amt = {
    ...cell,
    textAlign: "right",
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
    fontWeight: 700,
    whiteSpace: "nowrap",
  };
  const head = {
    padding: "8px 12px",
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: "#FFFFFF",
    background: NAVY,
    textAlign: "left",
  };
  const box = {
    border: "1.5px solid #CBD5E1",
    borderRadius: 10,
    overflow: "hidden",
  };

  return (
    <div className="fixed inset-0 z-[60] flex flex-col overflow-hidden bg-[#000814]/95 backdrop-blur-md">
      {/* toolbar */}
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 bg-[#001F3F] px-3 py-2.5 sm:px-5">
        <div className="flex min-w-0 items-center gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border-2 border-white/10 px-3 text-[12px] font-black uppercase tracking-[0.15em] text-slate-200 transition hover:bg-white/5 active:scale-95"
          >
            <ArrowLeft size={14} />
            <span className="hidden sm:inline">Back</span>
          </button>
          <div className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-[#001F3F] sm:flex">
            <Receipt size={14} />
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-[14px] font-black uppercase tracking-tight text-white">
              Salary slip{" "}
              <span className="font-light lowercase italic">
                {salary.staff?.name || ""}
              </span>
            </h2>
            <p className="truncate text-[12px] font-medium text-slate-400">
              {period}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleDownloadPdf}
          disabled={isDownloading}
          className="inline-flex h-9 shrink-0 items-center gap-2 rounded-xl bg-white px-3 text-[12px] font-black uppercase tracking-[0.15em] text-[#001F3F] shadow-lg transition hover:bg-blue-50 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 sm:px-4"
        >
          {isDownloading ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Download size={14} />
          )}
          <span className="sm:hidden">{isDownloading ? "…" : "PDF"}</span>
          <span className="hidden sm:inline">
            {isDownloading ? "Preparing…" : "Download PDF"}
          </span>
        </button>
      </div>

      {/* preview */}
      <div className="flex flex-1 flex-col items-center overflow-auto p-4">
        <div
          id="payslip-scale-wrap"
          style={{
            transform: `scale(${scale})`,
            transformOrigin: "top center",
            transition: "transform 0.2s ease-out",
            marginBottom: `${sheetH * scale - sheetH}px`,
          }}
        >
          {/* ================= A4 SALARY SLIP ================= */}
          <div
            ref={payslipRef}
            style={{
              width: "210mm",
              minHeight: "297mm",
              background: "#FFFFFF",
              color: NAVY,
              fontFamily: "Inter, 'Segoe UI', Roboto, Arial, sans-serif",
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div style={{ height: 8, background: NAVY }} />

            <div
              style={{
                padding: "36px 44px 28px",
                flex: 1,
                display: "flex",
                flexDirection: "column",
                gap: 22,
              }}
            >
              {/* ---------- company header ---------- */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: 24,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    gap: 14,
                    alignItems: "flex-start",
                    minWidth: 0,
                  }}
                >
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 12,
                      border: "1.5px solid #CBD5E1",
                      background: "#F8FAFC",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      overflow: "hidden",
                      flexShrink: 0,
                    }}
                  >
                    {company.logo && !logoFailed ? (
                      <img
                        src={company.logo}
                        alt=""
                        crossOrigin="anonymous"
                        onError={() => setLogoFailed(true)}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "contain",
                        }}
                      />
                    ) : (
                      <HiMiniWrenchScrewdriver
                        style={{ width: 26, height: 26, color: NAVY }}
                      />
                    )}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 20,
                        fontWeight: 900,
                        textTransform: "uppercase",
                        letterSpacing: "-0.01em",
                        lineHeight: 1.15,
                      }}
                    >
                      {company.name}
                    </div>
                    {company.address && (
                      <div
                        style={{
                          marginTop: 4,
                          fontSize: 11,
                          color: "#475569",
                          maxWidth: 340,
                          lineHeight: 1.45,
                        }}
                      >
                        {company.address}
                      </div>
                    )}
                    <div
                      style={{ marginTop: 3, fontSize: 11, color: "#475569" }}
                    >
                      {[company.phone && `Ph: ${company.phone}`, company.email]
                        .filter(Boolean)
                        .join("  |  ")}
                    </div>
                    {company.gst && (
                      <div
                        style={{
                          marginTop: 2,
                          fontSize: 11,
                          color: "#475569",
                          fontWeight: 700,
                        }}
                      >
                        GSTIN: {company.gst}
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div
                    style={{
                      fontSize: 18,
                      fontWeight: 900,
                      letterSpacing: "0.18em",
                      color: NAVY,
                    }}
                  >
                    SALARY SLIP
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: "#475569",
                      marginTop: 2,
                    }}
                  >
                    For the month of {period}
                  </div>
                  <div style={{ fontSize: 11, color: "#64748B", marginTop: 6 }}>
                    Slip No: <b style={{ color: NAVY }}>{slipNo}</b>
                  </div>
                  <div style={{ fontSize: 11, color: "#64748B" }}>
                    FY {month && year ? getFinancialYear(month, year) : "—"}
                  </div>
                </div>
              </div>

              {/* ---------- employee details ---------- */}
              <div style={box}>
                <div style={{ ...head, padding: "7px 14px" }}>
                  Employee Details
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 24,
                    padding: "10px 16px",
                  }}
                >
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <tbody>
                      <InfoRow
                        label="Employee Name"
                        value={salary.staff?.name}
                      />
                      <InfoRow
                        label="Employee ID"
                        value={
                          salary.staff?.id != null
                            ? `EMP-${String(salary.staff.id).padStart(4, "0")}`
                            : ""
                        }
                      />
                      <InfoRow
                        label="Designation"
                        value={salary.staff?.role || "Staff"}
                      />
                      <InfoRow label="Phone" value={salary.staff?.phone} />
                    </tbody>
                  </table>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <tbody>
                      <InfoRow label="Pay Period" value={period} />
                      <InfoRow label="Days in Month" value={`${daysInMonth}`} />
                      <InfoRow label="Leave Days" value={`${leaves}`} />
                      <InfoRow label="Paid Days" value={`${paidDays}`} />
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ---------- earnings / deductions ---------- */}
              <div style={box}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    tableLayout: "fixed",
                  }}
                >
                  <colgroup>
                    <col style={{ width: "31%" }} />
                    <col style={{ width: "19%" }} />
                    <col style={{ width: "31%" }} />
                    <col style={{ width: "19%" }} />
                  </colgroup>
                  <thead>
                    <tr>
                      <th style={head}>Earnings</th>
                      <th
                        style={{
                          ...head,
                          textAlign: "right",
                          borderRight: "1px solid rgba(255,255,255,0.15)",
                        }}
                      >
                        Amount (₹)
                      </th>
                      <th style={head}>Deductions</th>
                      <th style={{ ...head, textAlign: "right" }}>
                        Amount (₹)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: rows }).map((_, i) => {
                      const e = earnings[i];
                      const d = deductions[i];
                      return (
                        <tr key={i}>
                          <td style={cell}>{e?.label || ""}</td>
                          <td
                            style={{ ...amt, borderRight: "1px solid #E2E8F0" }}
                          >
                            {e ? money(e.amount) : ""}
                          </td>
                          <td style={cell}>{d?.label || ""}</td>
                          <td
                            style={{
                              ...amt,
                              color: d && d.amount > 0 ? "#B91C1C" : NAVY,
                            }}
                          >
                            {d ? money(d.amount) : ""}
                          </td>
                        </tr>
                      );
                    })}
                    <tr style={{ background: "#F8FAFC" }}>
                      <td
                        style={{
                          ...cell,
                          fontWeight: 800,
                          borderBottom: "none",
                        }}
                      >
                        Gross Earnings
                      </td>
                      <td
                        style={{
                          ...amt,
                          fontWeight: 900,
                          borderBottom: "none",
                          borderRight: "1px solid #E2E8F0",
                        }}
                      >
                        {money(grossShown)}
                      </td>
                      <td
                        style={{
                          ...cell,
                          fontWeight: 800,
                          borderBottom: "none",
                        }}
                      >
                        Total Deductions
                      </td>
                      <td
                        style={{
                          ...amt,
                          fontWeight: 900,
                          borderBottom: "none",
                          color: "#B91C1C",
                        }}
                      >
                        {money(totalDed)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* ---------- net pay ---------- */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr auto",
                  borderRadius: 10,
                  overflow: "hidden",
                  border: `1.5px solid ${NAVY}`,
                }}
              >
                <div style={{ padding: "12px 16px" }}>
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      color: "#64748B",
                    }}
                  >
                    Net Pay (in words)
                  </div>
                  <div
                    style={{
                      marginTop: 3,
                      fontSize: 12,
                      fontWeight: 700,
                      fontStyle: "italic",
                      color: NAVY,
                    }}
                  >
                    {amountInWords(netPay)}
                  </div>
                  <div style={{ marginTop: 6, fontSize: 11, color: "#475569" }}>
                    Gross ₹{money(grossShown)} − Deductions ₹{money(totalDed)}
                  </div>
                </div>
                <div
                  style={{
                    background: NAVY,
                    color: "#FFFFFF",
                    padding: "12px 22px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "flex-end",
                    minWidth: 190,
                  }}
                >
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                      opacity: 0.7,
                    }}
                  >
                    Net Pay
                  </div>
                  <div
                    style={{
                      fontSize: 22,
                      fontWeight: 900,
                      fontFamily:
                        "ui-monospace, SFMono-Regular, Menlo, monospace",
                    }}
                  >
                    ₹{money(netPay)}
                  </div>
                </div>
              </div>

              {/* ---------- payment info ---------- */}
              {(() => {
                const mode = salary.paymentMode || salary.paymentMethod;
                const items = [
                  [
                    "Payment Status",
                    isPaid
                      ? "PAID"
                      : salary.status === "HOLD"
                        ? "ON HOLD"
                        : "UNPAID",
                    isPaid
                      ? "#15803D"
                      : salary.status === "HOLD"
                        ? "#B45309"
                        : "#B91C1C",
                  ],
                  [
                    "Payment Date",
                    isPaid ? fmtDate(salary.paidAt) || "—" : "Pending",
                    NAVY,
                  ],
                  ...(mode ? [["Payment Mode", mode, NAVY]] : []),
                ];
                return (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: `repeat(${items.length}, 1fr)`,
                      ...box,
                    }}
                  >
                    {items.map(([k, v, c], i) => (
                      <div
                        key={k}
                        style={{
                          padding: "10px 16px",
                          borderLeft: i ? "1.5px solid #E2E8F0" : "none",
                        }}
                      >
                        <div
                          style={{
                            fontSize: 10,
                            fontWeight: 800,
                            letterSpacing: "0.12em",
                            textTransform: "uppercase",
                            color: "#64748B",
                          }}
                        >
                          {k}
                        </div>
                        <div
                          style={{
                            marginTop: 2,
                            fontSize: 12,
                            fontWeight: 800,
                            color: c,
                          }}
                        >
                          {v}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}

              <div style={{ flex: 1 }} />

              {/* ---------- signatures ---------- */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-end",
                  gap: 40,
                  paddingTop: 40,
                }}
              >
                <div
                  style={{
                    width: 200,
                    borderTop: "1.5px solid #94A3B8",
                    paddingTop: 6,
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      color: "#475569",
                    }}
                  >
                    Employee Signature
                  </div>
                </div>
                <div
                  style={{
                    width: 220,
                    borderTop: `1.5px solid ${NAVY}`,
                    paddingTop: 6,
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      color: NAVY,
                    }}
                  >
                    Authorised Signatory
                  </div>
                  <div style={{ fontSize: 10, color: "#64748B", marginTop: 1 }}>
                    For {company.name}
                  </div>
                </div>
              </div>

              <div
                style={{
                  borderTop: "1px dashed #CBD5E1",
                  paddingTop: 10,
                  textAlign: "center",
                  fontSize: 10,
                  color: "#94A3B8",
                }}
              >
                This is a computer-generated salary slip and does not require a
                physical signature. · Generated on {fmtDate(new Date())}
              </div>
            </div>

            <div style={{ height: 4, background: NAVY }} />
          </div>
        </div>
      </div>
    </div>
  );
}
