// src/puncherPages/clients/ClientFormModal.jsx
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { puncherApi, VEHICLE_LABEL } from "../puncherApi";
import { Modal, Field, Input, TextArea, Segmented, PrimaryButton, GhostButton, ErrorBox } from "../PuncherUI";

const EMPTY = {
  fullName: "",
  phone: "",
  email: "",
  address: "",
  vehicleType: "",
  vehicleMake: "",
  vehicleModel: "",
  regNumber: "",
  notes: "",
};

/** Add / edit a Puncher Shop client. `vehicleTypes` = what the shop supports. */
export default function ClientFormModal({ open, onClose, onSaved, client, vehicleTypes = ["CAR", "BIKE"], isDark }) {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const vehicleKey = vehicleTypes.join(",");

  // Reset only when the modal opens or the edited client changes
  useEffect(() => {
    if (!open) return;
    setError(null);
    setForm(
      client
        ? Object.fromEntries(Object.keys(EMPTY).map((k) => [k, client[k] ?? ""]))
        : { ...EMPTY, vehicleType: vehicleKey.split(",")[0] || "CAR" },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, client]);

  // Keep the chosen vehicle valid once the shop's vehicle support has loaded
  useEffect(() => {
    const allowed = vehicleKey.split(",");
    setForm((f) => (f.vehicleType && !allowed.includes(f.vehicleType) && !client ? { ...f, vehicleType: allowed[0] } : f));
  }, [vehicleKey, client]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e?.target ? e.target.value : e }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const body = Object.fromEntries(Object.entries(form).map(([k, v]) => [k, v === "" ? null : v]));
      body.fullName = form.fullName.trim();
      body.phone = form.phone.trim();
      const saved = await puncherApi(client ? `/clients/${client.id}` : "/clients", {
        method: client ? "PUT" : "POST",
        body,
      });
      toast.success(client ? "Client updated" : "Client added");
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
      title={client ? "Edit Client" : "Add Client"}
      footer={
        <>
          <GhostButton isDark={isDark} onClick={onClose} type="button">
            Cancel
          </GhostButton>
          <PrimaryButton type="submit" form="puncher-client-form" disabled={saving}>
            {saving ? "Saving..." : client ? "Save Changes" : "Add Client"}
          </PrimaryButton>
        </>
      }
    >
      <form id="puncher-client-form" onSubmit={submit} className="space-y-4">
        <ErrorBox message={error} isDark={isDark} />
        {vehicleTypes.length > 1 && (
          <Field label="Vehicle" required isDark={isDark} group>
            <div>
              <Segmented
                isDark={isDark}
                value={form.vehicleType}
                onChange={set("vehicleType")}
                options={vehicleTypes.map((v) => ({ value: v, label: VEHICLE_LABEL[v] }))}
              />
            </div>
          </Field>
        )}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Client Name" required isDark={isDark}>
            <Input isDark={isDark} value={form.fullName} onChange={set("fullName")} required minLength={2} placeholder="e.g. Ravi Kumar" />
          </Field>
          <Field label="Phone" required isDark={isDark}>
            <Input isDark={isDark} value={form.phone} onChange={set("phone")} required inputMode="tel" placeholder="10-digit mobile" />
          </Field>
          <Field label="Vehicle Make" isDark={isDark}>
            <Input isDark={isDark} value={form.vehicleMake} onChange={set("vehicleMake")} placeholder={form.vehicleType === "BIKE" ? "e.g. Honda" : "e.g. Maruti"} />
          </Field>
          <Field label="Vehicle Model" isDark={isDark}>
            <Input isDark={isDark} value={form.vehicleModel} onChange={set("vehicleModel")} placeholder={form.vehicleType === "BIKE" ? "e.g. Activa" : "e.g. Swift"} />
          </Field>
          <Field label="Registration No." isDark={isDark}>
            <Input isDark={isDark} value={form.regNumber} onChange={set("regNumber")} placeholder="KA01AB1234" className="uppercase" />
          </Field>
          <Field label="Email" isDark={isDark}>
            <Input isDark={isDark} type="email" value={form.email} onChange={set("email")} placeholder="optional" />
          </Field>
        </div>
        <Field label="Address" isDark={isDark}>
          <Input isDark={isDark} value={form.address} onChange={set("address")} placeholder="optional" />
        </Field>
        <Field label="Notes" isDark={isDark}>
          <TextArea isDark={isDark} value={form.notes} onChange={set("notes")} placeholder="Tyre size, preferences..." />
        </Field>
      </form>
    </Modal>
  );
}
