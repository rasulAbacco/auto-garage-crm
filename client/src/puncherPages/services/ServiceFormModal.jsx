// src/puncherPages/services/ServiceFormModal.jsx
import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { puncherApi, inr, prettyEnum, VEHICLE_LABEL } from "../puncherApi";
import { Modal, Field, Input, Select, TextArea, PrimaryButton, GhostButton, ErrorBox, cx } from "../PuncherUI";

const today = () => new Date().toISOString().slice(0, 10);

/** Log or edit a puncture/tyre job. */
export default function ServiceFormModal({ open, onClose, onSaved, service, clients, catalog, defaultClientId, isDark }) {
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (service) {
      setForm({
        clientId: String(service.clientId),
        serviceType: service.serviceType,
        serviceName: service.serviceName,
        tyrePosition: service.tyrePosition || "",
        quantity: service.quantity,
        unitPrice: service.unitPrice,
        status: service.status,
        notes: service.notes || "",
        serviceDate: String(service.serviceDate).slice(0, 10),
      });
    } else {
      setForm({
        clientId: defaultClientId ? String(defaultClientId) : "",
        serviceType: "",
        serviceName: "",
        tyrePosition: "",
        quantity: 1,
        unitPrice: "",
        status: "PENDING",
        notes: "",
        serviceDate: today(),
      });
    }
  }, [open, service, defaultClientId]);

  const client = clients.find((c) => String(c.id) === String(form.clientId));
  const vehicleType = client?.vehicleType;
  const services = useMemo(
    () => (catalog?.services || []).filter((s) => !vehicleType || s.prices[vehicleType] !== undefined),
    [catalog, vehicleType],
  );
  const positions = (vehicleType && catalog?.tyrePositions?.[vehicleType]) || [];

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const pickService = (e) => {
    const key = e.target.value;
    const item = services.find((s) => s.key === key);
    setForm((f) => ({
      ...f,
      serviceType: key,
      serviceName: key === "CUSTOM" ? "" : item?.name || "",
      // Suggest the default price, but keep anything the user typed for a custom job
      unitPrice: item && vehicleType && key !== "CUSTOM" ? item.prices[vehicleType] : f.unitPrice,
    }));
  };

  const total = (Number(form.quantity) || 0) * (Number(form.unitPrice) || 0);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const body = {
        clientId: Number(form.clientId),
        serviceType: form.serviceType,
        serviceName: form.serviceName || undefined,
        tyrePosition: form.tyrePosition || null,
        quantity: Number(form.quantity),
        unitPrice: Number(form.unitPrice),
        status: form.status,
        notes: form.notes || null,
        serviceDate: form.serviceDate,
      };
      const saved = await puncherApi(service ? `/services/${service.id}` : "/services", {
        method: service ? "PUT" : "POST",
        body,
      });
      toast.success(service ? "Service updated" : "Service added");
      onSaved?.(saved);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      isDark={isDark}
      title={service ? "Edit Service" : "New Service"}
      footer={
        <>
          <GhostButton isDark={isDark} onClick={onClose} type="button">Cancel</GhostButton>
          <PrimaryButton type="submit" form="puncher-service-form" disabled={saving}>
            {saving ? "Saving..." : service ? "Save Changes" : "Add Service"}
          </PrimaryButton>
        </>
      }
    >
      <form id="puncher-service-form" onSubmit={submit} className="space-y-4">
        <ErrorBox message={error} isDark={isDark} />
        <Field label="Client" required isDark={isDark} hint={clients.length === 0 ? "Add a client first from the Client Name page." : undefined}>
          <Select isDark={isDark} value={form.clientId || ""} onChange={set("clientId")} required disabled={!!service}>
            <option value="">Select client</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.fullName} · {VEHICLE_LABEL[c.vehicleType]}{c.regNumber ? ` · ${c.regNumber}` : ""}
              </option>
            ))}
          </Select>
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Service" required isDark={isDark}>
            <Select isDark={isDark} value={form.serviceType || ""} onChange={pickService} required disabled={!client}>
              <option value="">{client ? "Select service" : "Choose a client first"}</option>
              {services.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.name}{vehicleType && s.key !== "CUSTOM" ? ` (${inr(s.prices[vehicleType])})` : ""}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Tyre Position" isDark={isDark}>
            <Select isDark={isDark} value={form.tyrePosition || ""} onChange={set("tyrePosition")} disabled={!client}>
              <option value="">Not specified</option>
              {positions.map((p) => (
                <option key={p} value={p}>{prettyEnum(p)}</option>
              ))}
            </Select>
          </Field>
        </div>

        {form.serviceType === "CUSTOM" && (
          <Field label="Service Name" required isDark={isDark}>
            <Input isDark={isDark} value={form.serviceName} onChange={set("serviceName")} required placeholder="e.g. Rim straightening" />
          </Field>
        )}

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Field label="Quantity" required isDark={isDark}>
            <Input isDark={isDark} type="number" min="1" max="100" value={form.quantity ?? 1} onChange={set("quantity")} required />
          </Field>
          <Field label="Price (₹)" required isDark={isDark}>
            <Input isDark={isDark} type="number" min="0" step="0.01" value={form.unitPrice ?? ""} onChange={set("unitPrice")} required />
          </Field>
          <Field label="Date" isDark={isDark}>
            <Input isDark={isDark} type="date" value={form.serviceDate || ""} onChange={set("serviceDate")} />
          </Field>
        </div>

        <Field label="Status" isDark={isDark}>
          <Select isDark={isDark} value={form.status || "PENDING"} onChange={set("status")}>
            {["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"].map((s) => (
              <option key={s} value={s}>{prettyEnum(s)}</option>
            ))}
          </Select>
        </Field>

        <Field label="Notes" isDark={isDark}>
          <TextArea isDark={isDark} value={form.notes || ""} onChange={set("notes")} placeholder="Tyre size, puncture location..." />
        </Field>

        <div className={cx("flex items-center justify-between p-4 rounded-xl", isDark ? "bg-gray-900" : "bg-slate-50")}>
          <span className={isDark ? "text-gray-400" : "text-gray-600"}>Service total</span>
          <span className={cx("text-xl font-bold", isDark ? "text-white" : "text-gray-900")}>{inr(total)}</span>
        </div>
      </form>
    </Modal>
  );
}
