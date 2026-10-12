// src/puncherPages/billing/CreateBillModal.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { puncherApi, inr, prettyEnum, VEHICLE_LABEL } from "../puncherApi";
import { Modal, Field, Input, Select, TextArea, Segmented, PrimaryButton, GhostButton, ErrorBox, cx } from "../PuncherUI";

const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;
const PAYMENT_MODES = ["CASH", "UPI", "CARD", "BANK_TRANSFER"];

export default function CreateBillModal({ open, onClose, onCreated, clients, defaultClientId, isDark }) {
  const [clientId, setClientId] = useState("");
  const [unbilled, setUnbilled] = useState([]);
  const [selected, setSelected] = useState([]);
  const [extras, setExtras] = useState([]);
  const [discount, setDiscount] = useState("");
  const [gstPercent, setGstPercent] = useState("0");
  const [status, setStatus] = useState("PENDING");
  const [paymentMode, setPaymentMode] = useState("CASH");
  const [notes, setNotes] = useState("");
  const [loadingServices, setLoadingServices] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open) return;
    setClientId(defaultClientId ? String(defaultClientId) : "");
    setExtras([]);
    setDiscount("");
    setGstPercent("0");
    setStatus("PENDING");
    setPaymentMode("CASH");
    setNotes("");
    setError(null);
  }, [open, defaultClientId]);

  // Load this client's services that are not on a bill yet
  useEffect(() => {
    if (!open || !clientId) {
      setUnbilled([]);
      setSelected([]);
      return;
    }
    let cancelled = false;
    setLoadingServices(true);
    puncherApi(`/services?clientId=${clientId}&unbilled=true`)
      .then((list) => {
        if (cancelled) return;
        setUnbilled(list);
        setSelected(list.map((s) => s.id)); // pre-select everything unbilled
      })
      .catch((e) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoadingServices(false));
    return () => {
      cancelled = true;
    };
  }, [open, clientId]);

  const toggle = (id) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const setExtra = (i, k, v) => setExtras((list) => list.map((e, idx) => (idx === i ? { ...e, [k]: v } : e)));

  // Same maths as the server (server is the source of truth)
  const totals = useMemo(() => {
    const items = [
      ...unbilled.filter((s) => selected.includes(s.id)).map((s) => s.quantity * s.unitPrice),
      ...extras.map((e) => (Number(e.quantity) || 0) * (Number(e.unitPrice) || 0)),
    ];
    const subtotal = round2(items.reduce((a, b) => a + b, 0));
    const disc = Math.min(Math.max(round2(Number(discount) || 0), 0), subtotal);
    const taxable = round2(subtotal - disc);
    const gst = round2((taxable * (Number(gstPercent) || 0)) / 100);
    return { subtotal, disc, gst, total: round2(taxable + gst), count: items.length };
  }, [unbilled, selected, extras, discount, gstPercent]);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const bill = await puncherApi("/billings", {
        method: "POST",
        body: {
          clientId: Number(clientId),
          serviceIds: selected,
          extraItems: extras
            .filter((x) => x.description.trim())
            .map((x) => ({ description: x.description.trim(), quantity: Number(x.quantity) || 1, unitPrice: Number(x.unitPrice) || 0 })),
          discount: Number(discount) || 0,
          gstPercent: Number(gstPercent) || 0,
          status,
          paymentMode: status === "PAID" ? paymentMode : null,
          notes: notes || null,
        },
      });
      onCreated?.(bill);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const muted = isDark ? "text-gray-400" : "text-gray-600";

  return (
    <Modal
      open={open}
      onClose={onClose}
      isDark={isDark}
      wide
      title="Create Bill"
      footer={
        <>
          <GhostButton isDark={isDark} type="button" onClick={onClose}>Cancel</GhostButton>
          <PrimaryButton type="submit" form="puncher-bill-form" disabled={saving || !clientId || totals.count === 0}>
            {saving ? "Creating..." : `Create Bill · ${inr(totals.total)}`}
          </PrimaryButton>
        </>
      }
    >
      <form id="puncher-bill-form" onSubmit={submit} className="space-y-5">
        <ErrorBox message={error} isDark={isDark} />
        <Field label="Client" required isDark={isDark}>
          <Select isDark={isDark} value={clientId} onChange={(e) => setClientId(e.target.value)} required>
            <option value="">Select client</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.fullName} · {VEHICLE_LABEL[c.vehicleType]}{c.regNumber ? ` · ${c.regNumber}` : ""}
              </option>
            ))}
          </Select>
        </Field>

        {clientId && (
          <div>
            <p className={cx("mb-2 text-sm font-semibold", isDark ? "text-gray-300" : "text-gray-700")}>Services to bill</p>
            {loadingServices ? (
              <p className={cx("text-sm", muted)}>Loading services...</p>
            ) : unbilled.length === 0 ? (
              <p className={cx("text-sm", muted)}>No unbilled services for this client. You can still add items below.</p>
            ) : (
              <ul className={cx("divide-y rounded-xl border-2", isDark ? "border-gray-700 divide-gray-700" : "border-gray-100 divide-gray-100")}>
                {unbilled.map((s) => (
                  <li key={s.id}>
                    <label className="flex items-center gap-3 px-4 py-3 cursor-pointer">
                      <input type="checkbox" checked={selected.includes(s.id)} onChange={() => toggle(s.id)} className="w-4 h-4 accent-sky-500" />
                      <span className={cx("flex-1 text-sm", isDark ? "text-gray-200" : "text-gray-800")}>
                        {s.serviceName}{s.quantity > 1 ? ` × ${s.quantity}` : ""}
                        {s.tyrePosition && <span className={muted}> · {prettyEnum(s.tyrePosition)}</span>}
                      </span>
                      <span className={cx("text-sm font-semibold", isDark ? "text-white" : "text-gray-900")}>{inr(s.totalPrice)}</span>
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div>
          <div className="flex items-center justify-between mb-2">
            <p className={cx("text-sm font-semibold", isDark ? "text-gray-300" : "text-gray-700")}>Extra items (parts, tube, valve...)</p>
            <button type="button" onClick={() => setExtras((l) => [...l, { description: "", quantity: 1, unitPrice: "" }])} className="flex items-center gap-1 text-sm font-semibold text-sky-500 hover:text-sky-600">
              <Plus className="w-4 h-4" /> Add item
            </button>
          </div>
          {extras.map((x, i) => (
            <div key={i} className="grid grid-cols-[1fr_70px_100px_auto] gap-2 mb-2">
              <Input isDark={isDark} placeholder="Description" value={x.description} onChange={(e) => setExtra(i, "description", e.target.value)} aria-label="Item description" />
              <Input isDark={isDark} type="number" min="1" value={x.quantity} onChange={(e) => setExtra(i, "quantity", e.target.value)} aria-label="Quantity" />
              <Input isDark={isDark} type="number" min="0" step="0.01" placeholder="₹" value={x.unitPrice} onChange={(e) => setExtra(i, "unitPrice", e.target.value)} aria-label="Unit price" />
              <button type="button" aria-label="Remove item" onClick={() => setExtras((l) => l.filter((_, idx) => idx !== i))} className="px-2 text-gray-400 hover:text-red-500">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Discount (₹)" isDark={isDark}>
            <Input isDark={isDark} type="number" min="0" step="0.01" value={discount} onChange={(e) => setDiscount(e.target.value)} placeholder="0" />
          </Field>
          <Field label="GST" isDark={isDark}>
            <Select isDark={isDark} value={gstPercent} onChange={(e) => setGstPercent(e.target.value)}>
              {["0", "5", "12", "18", "28"].map((g) => (
                <option key={g} value={g}>{g === "0" ? "No GST" : `${g}%`}</option>
              ))}
            </Select>
          </Field>
        </div>

        <Field label="Payment" isDark={isDark} group>
          <div className="flex flex-wrap items-center gap-3">
            <Segmented isDark={isDark} value={status} onChange={setStatus} options={[{ value: "PENDING", label: "Pay later" }, { value: "PAID", label: "Paid now" }]} />
            {status === "PAID" && (
              <Select isDark={isDark} value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)} className="!w-auto" aria-label="Payment mode">
                {PAYMENT_MODES.map((m) => (
                  <option key={m} value={m}>{prettyEnum(m)}</option>
                ))}
              </Select>
            )}
          </div>
        </Field>

        <Field label="Notes" isDark={isDark}>
          <TextArea isDark={isDark} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Shown on the invoice" />
        </Field>

        <div className={cx("p-4 rounded-xl space-y-1.5 text-sm", isDark ? "bg-gray-900" : "bg-slate-50")}>
          <div className="flex justify-between"><span className={muted}>Subtotal</span><span>{inr(totals.subtotal)}</span></div>
          {totals.disc > 0 && <div className="flex justify-between"><span className={muted}>Discount</span><span>− {inr(totals.disc)}</span></div>}
          {totals.gst > 0 && <div className="flex justify-between"><span className={muted}>GST ({gstPercent}%)</span><span>{inr(totals.gst)}</span></div>}
          <div className={cx("flex justify-between pt-2 mt-1 text-lg font-bold border-t", isDark ? "border-gray-700 text-white" : "border-gray-200 text-gray-900")}>
            <span>Total</span><span>{inr(totals.total)}</span>
          </div>
        </div>
      </form>
    </Modal>
  );
}
