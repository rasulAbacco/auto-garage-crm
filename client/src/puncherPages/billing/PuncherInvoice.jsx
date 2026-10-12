// src/puncherPages/billing/PuncherInvoice.jsx — printable invoice + pay / cancel / delete
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Toaster, toast } from "react-hot-toast";
import { ArrowLeft, Printer, CheckCircle2, XCircle, Trash2 } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";
import { puncherApi, inr, fmtDate, prettyEnum, VEHICLE_LABEL } from "../puncherApi";
import { PageShell, Badge, Loading, ErrorBox, PrimaryButton, GhostButton, Modal, Select, cx } from "../PuncherUI";

export default function PuncherInvoice() {
  const { id } = useParams();
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [bill, setBill] = useState(null);
  const [error, setError] = useState(null);
  const [payOpen, setPayOpen] = useState(false);
  const [paymentMode, setPaymentMode] = useState("CASH");
  const [confirm, setConfirm] = useState(null); // "cancel" | "delete"
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      setBill(await puncherApi(`/billings/${id}`));
      setError(null);
    } catch (e) {
      setError(e.message);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const act = async (fn, msg) => {
    setBusy(true);
    try {
      await fn();
      toast.success(msg);
      return true;
    } catch (e) {
      toast.error(e.message);
      return false;
    } finally {
      setBusy(false);
    }
  };

  const markPaid = async () => {
    if (await act(() => puncherApi(`/billings/${id}/pay`, { method: "PATCH", body: { paymentMode } }), "Marked as paid")) {
      setPayOpen(false);
      load();
    }
  };

  const runConfirm = async () => {
    if (confirm === "cancel") {
      if (await act(() => puncherApi(`/billings/${id}/cancel`, { method: "PATCH" }), "Bill cancelled")) load();
    } else if (confirm === "delete") {
      if (await act(() => puncherApi(`/billings/${id}`, { method: "DELETE" }), "Bill deleted")) navigate("/puncher-billing");
    }
    setConfirm(null);
  };

  if (!bill && !error) return <PageShell><Loading isDark={isDark} /></PageShell>;

  return (
    <PageShell>
      <Toaster position="top-right" />
      <style>{`@media print { aside, header, .no-print { display: none !important; } main { background: #fff !important; } .print-sheet { box-shadow: none !important; border: 0 !important; } }`}</style>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 no-print">
        <button onClick={() => navigate("/puncher-billing")} className="flex items-center gap-2 text-sm font-semibold text-sky-500 hover:text-sky-600">
          <ArrowLeft className="w-4 h-4" /> Back to billings
        </button>
        {bill && (
          <div className="flex flex-wrap gap-2">
            <GhostButton isDark={isDark} onClick={() => window.print()}><Printer className="w-4 h-4" /> Print</GhostButton>
            {bill.status === "PENDING" && (
              <PrimaryButton onClick={() => setPayOpen(true)}><CheckCircle2 className="w-4 h-4" /> Mark Paid</PrimaryButton>
            )}
            {bill.status !== "CANCELLED" && (
              <GhostButton isDark={isDark} onClick={() => setConfirm("cancel")}><XCircle className="w-4 h-4" /> Cancel Bill</GhostButton>
            )}
            {bill.status !== "PAID" && (
              <GhostButton isDark={isDark} onClick={() => setConfirm("delete")} className="hover:!text-red-500"><Trash2 className="w-4 h-4" /> Delete</GhostButton>
            )}
          </div>
        )}
      </div>

      <ErrorBox message={error} isDark={isDark} />

      {bill && (
        <div className="max-w-3xl p-8 mx-auto bg-white border-2 border-gray-100 shadow-xl text-gray-900 rounded-2xl print-sheet">
          <div className="flex flex-col justify-between gap-6 pb-6 border-b sm:flex-row">
            <div>
              <h1 className="text-2xl font-bold">{bill.shop?.companyName || bill.shop?.username || "Puncher Shop"}</h1>
              <p className="text-sm text-gray-500">
                {[bill.shop?.address, bill.shop?.phone, bill.shop?.email].filter(Boolean).join(" · ")}
              </p>
              {bill.shop?.gstNumber && <p className="text-sm text-gray-500">GSTIN: {bill.shop.gstNumber}</p>}
            </div>
            <div className="sm:text-right">
              <p className="text-xs font-bold tracking-widest uppercase text-sky-600">Invoice</p>
              <p className="text-xl font-bold">{bill.invoiceNumber}</p>
              <p className="text-sm text-gray-500">{fmtDate(bill.createdAt)}</p>
              <div className="mt-2"><Badge status={bill.status} isDark={false} /></div>
            </div>
          </div>

          <div className="grid gap-4 py-6 border-b sm:grid-cols-2">
            <div>
              <p className="text-xs font-bold tracking-widest text-gray-400 uppercase">Billed to</p>
              <p className="font-semibold">{bill.client?.fullName}</p>
              <p className="text-sm text-gray-500">{bill.client?.phone}</p>
              {bill.client?.address && <p className="text-sm text-gray-500">{bill.client.address}</p>}
            </div>
            <div className="sm:text-right">
              <p className="text-xs font-bold tracking-widest text-gray-400 uppercase">Vehicle</p>
              <p className="font-semibold">
                {VEHICLE_LABEL[bill.client?.vehicleType]}{bill.client?.vehicleMake ? ` · ${bill.client.vehicleMake} ${bill.client.vehicleModel || ""}` : ""}
              </p>
              {bill.client?.regNumber && <p className="text-sm text-gray-500">{bill.client.regNumber}</p>}
            </div>
          </div>

          <table className="w-full my-6 text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="py-2 font-semibold">Description</th>
                <th className="py-2 font-semibold text-right">Qty</th>
                <th className="py-2 font-semibold text-right">Rate</th>
                <th className="py-2 font-semibold text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {bill.items.map((it) => (
                <tr key={it.id} className="border-b border-gray-50">
                  <td className="py-3">{it.description}</td>
                  <td className="py-3 text-right">{it.quantity}</td>
                  <td className="py-3 text-right">{inr(it.unitPrice)}</td>
                  <td className="py-3 font-medium text-right">{inr(it.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="ml-auto space-y-1.5 text-sm sm:w-72">
            <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>{inr(bill.subtotal)}</span></div>
            {bill.discount > 0 && <div className="flex justify-between"><span className="text-gray-500">Discount</span><span>− {inr(bill.discount)}</span></div>}
            {bill.gstAmount > 0 && <div className="flex justify-between"><span className="text-gray-500">GST ({bill.gstPercent}%)</span><span>{inr(bill.gstAmount)}</span></div>}
            <div className="flex justify-between pt-2 mt-1 text-lg font-bold border-t"><span>Total</span><span>{inr(bill.grandTotal)}</span></div>
            {bill.status === "PAID" && (
              <p className="text-xs text-right text-green-600">
                Paid via {prettyEnum(bill.paymentMode)} on {fmtDate(bill.paidAt)}
              </p>
            )}
          </div>

          {bill.notes && <p className="pt-4 mt-6 text-sm text-gray-500 border-t">{bill.notes}</p>}
          <p className="mt-8 text-xs text-center text-gray-400">Thank you for your business!</p>
        </div>
      )}

      <Modal
        open={payOpen}
        onClose={() => setPayOpen(false)}
        isDark={isDark}
        title="Mark bill as paid"
        footer={
          <>
            <GhostButton isDark={isDark} onClick={() => setPayOpen(false)}>Cancel</GhostButton>
            <PrimaryButton onClick={markPaid} disabled={busy}>Confirm {bill ? inr(bill.grandTotal) : ""}</PrimaryButton>
          </>
        }
      >
        <label className={cx("block mb-2 text-sm font-semibold", isDark ? "text-gray-300" : "text-gray-700")}>Payment mode</label>
        <Select isDark={isDark} value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)}>
          {["CASH", "UPI", "CARD", "BANK_TRANSFER"].map((m) => <option key={m} value={m}>{prettyEnum(m)}</option>)}
        </Select>
      </Modal>

      <Modal
        open={!!confirm}
        onClose={() => setConfirm(null)}
        isDark={isDark}
        title={confirm === "delete" ? "Delete bill?" : "Cancel bill?"}
        footer={
          <>
            <GhostButton isDark={isDark} onClick={() => setConfirm(null)}>Keep bill</GhostButton>
            <button onClick={runConfirm} disabled={busy} className="px-5 py-2.5 font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 disabled:opacity-50">
              {confirm === "delete" ? "Delete" : "Cancel bill"}
            </button>
          </>
        }
      >
        <p className={isDark ? "text-gray-300" : "text-gray-600"}>
          {confirm === "delete"
            ? "This permanently removes the bill. Its services become available to bill again."
            : "The bill stays on record as cancelled, and its services become available to bill again."}
        </p>
      </Modal>
    </PageShell>
  );
}
