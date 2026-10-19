// client/src/components/Car/StaffEditModal.jsx
import React, { useState } from "react";
import toast from "react-hot-toast";
import {
  User,
  Briefcase,
  Mail,
  Lock,
  Phone,
  IndianRupee,
  TrendingDown,
  Loader2,
  Save,
  Edit3,
  AlertCircle,
} from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";
import {
  tk,
  btnBase,
  Modal,
  TextField,
  PasswordField,
  inr,
  n,
} from "./staffUi";

const API = import.meta.env.VITE_API_BASE_URL;

function Group({ isDark, title, children }) {
  const t = tk(isDark);
  return (
    <div className="space-y-3">
      <h4
        className={`border-b-2 pb-2 text-[12px] font-black uppercase tracking-[0.15em] ${t.line} ${t.heading}`}
      >
        {title}
      </h4>
      {children}
    </div>
  );
}

export default function StaffEditModal({ staff, onClose, onSaved }) {
  const { isDark } = useTheme();
  const t = tk(isDark);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    ...staff,
    phone: staff.phone ?? "",
    email: staff.login?.email || "",
    password: "", // empty = keep current password
    advanceAmount: staff.advanceAmount || 0,
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const save = async (e) => {
    e?.preventDefault();
    if (!String(form.name || "").trim()) {
      setError("Name is required");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/car-staff/${staff.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        toast.success("Staff details saved");
        onSaved?.();
        onClose();
      } else {
        const err = await res.json().catch(() => null);
        setError(err?.message || "Failed to update staff");
      }
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const estimate =
    n(form.baseSalary) + n(form.bonusDefault) - n(form.extraDeductionsDefault);
  const money = (name, label, icon = <IndianRupee size={12} />) => (
    <TextField
      isDark={isDark}
      label={label}
      icon={icon}
      name={name}
      type="number"
      min="0"
      inputMode="decimal"
      value={form[name] ?? ""}
      onChange={handleChange}
      placeholder="0"
    />
  );

  return (
    <Modal
      isDark={isDark}
      open
      onClose={loading ? () => {} : onClose}
      icon={Edit3}
      title="Edit staff details"
      subtitle={`Update information for ${staff.name}`}
      maxW="max-w-2xl"
      footer={
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p
            className={`text-[12px] font-bold uppercase tracking-wider ${t.muted}`}
          >
            Est. monthly{" "}
            <span
              className={`ml-1 font-mono text-[14px] ${isDark ? "text-green-400" : "text-green-700"}`}
            >
              {inr(estimate)}
            </span>
          </p>
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className={`${btnBase} h-10 border-2 px-4 ${t.btnGhost}`}
            >
              Cancel
            </button>
            <button
              type="submit"
              form="staff-edit-form"
              disabled={loading}
              className={`${btnBase} h-10 px-5 ${t.btnPrimary}`}
            >
              {loading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Save size={14} />
              )}
              {loading ? "Saving…" : "Save changes"}
            </button>
          </div>
        </div>
      }
    >
      <form
        id="staff-edit-form"
        onSubmit={save}
        className="space-y-6 p-4 sm:p-5"
      >
        <Group isDark={isDark} title="Identity & access">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TextField
              isDark={isDark}
              label="Full name"
              icon={<User size={12} />}
              required
              name="name"
              value={form.name ?? ""}
              onChange={handleChange}
              placeholder="Staff name"
            />
            <TextField
              isDark={isDark}
              label="Role / position"
              icon={<Briefcase size={12} />}
              name="role"
              value={form.role ?? ""}
              onChange={handleChange}
              placeholder="Job title"
            />
            <TextField
              isDark={isDark}
              label="Phone"
              icon={<Phone size={12} />}
              name="phone"
              type="tel"
              inputMode="tel"
              value={form.phone ?? ""}
              onChange={handleChange}
              placeholder="98765 43210"
            />
            <TextField
              isDark={isDark}
              label="Login email"
              icon={<Mail size={12} />}
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="email@example.com"
            />
            <PasswordField
              isDark={isDark}
              className="sm:col-span-2"
              label="New password"
              icon={<Lock size={12} />}
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Leave empty to keep current"
              autoComplete="new-password"
            />
          </div>
        </Group>

        <Group isDark={isDark} title="Payroll defaults">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {money("baseSalary", "Base salary")}
            {money("bonusDefault", "Monthly bonus")}
            {money("advanceAmount", "Advance amount")}
          </div>
        </Group>

        <Group isDark={isDark} title="Deductions & attendance">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {money(
              "deductionPerLeave",
              "Deduction per leave",
              <TrendingDown size={12} />,
            )}
            {money(
              "extraDeductionsDefault",
              "Extra deductions",
              <TrendingDown size={12} />,
            )}
          </div>
        </Group>

        {error && (
          <div className="flex items-center gap-2 rounded-xl border-2 border-red-500/30 bg-red-500/10 px-3 py-2 text-[14px] font-semibold text-red-500">
            <AlertCircle size={14} className="shrink-0" /> {error}
          </div>
        )}
      </form>
    </Modal>
  );
}
