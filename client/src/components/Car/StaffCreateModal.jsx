// client/src/components/Car/StaffCreateModal.jsx
import React, { useState } from "react";
import toast from "react-hot-toast";
import {
  User,
  Briefcase,
  Phone,
  IndianRupee,
  Loader2,
  UserPlus,
  AlertCircle,
} from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";
import { tk, btnBase, Modal, TextField } from "./staffUi";

const API = import.meta.env.VITE_API_BASE_URL;

export default function StaffCreateModal({ onClose, onSaved }) {
  const { isDark } = useTheme();
  const t = tk(isDark);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    role: "",
    phone: "",
    baseSalary: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const save = async (e) => {
    e?.preventDefault();
    if (!form.name.trim() || form.baseSalary === "") {
      setError("Name and base salary are required");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API}/api/car-staff`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ ...form, name: form.name.trim() }),
      });

      if (res.ok) {
        toast.success(`${form.name.trim()} added`);
        onSaved?.();
        onClose();
      } else {
        const err = await res.json().catch(() => null);
        setError(err?.message || "Failed to create staff");
      }
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isDark={isDark}
      open
      onClose={loading ? () => {} : onClose}
      icon={UserPlus}
      title="Add new staff"
      subtitle="Enter the employee's details."
      maxW="max-w-md"
      footer={
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className={`${btnBase} h-10 border-2 ${t.btnGhost}`}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="staff-create-form"
            disabled={loading}
            className={`${btnBase} h-10 ${t.btnPrimary}`}
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            {loading ? "Creating…" : "Create staff"}
          </button>
        </div>
      }
    >
      <form
        id="staff-create-form"
        onSubmit={save}
        className="space-y-4 p-4 sm:p-5"
      >
        <TextField
          isDark={isDark}
          label="Full name"
          icon={<User size={12} />}
          required
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="e.g. Ravi Kumar"
          autoFocus
        />
        <TextField
          isDark={isDark}
          label="Role / position"
          icon={<Briefcase size={12} />}
          name="role"
          value={form.role}
          onChange={handleChange}
          placeholder="e.g. Mechanic"
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField
            isDark={isDark}
            label="Phone"
            icon={<Phone size={12} />}
            name="phone"
            type="tel"
            inputMode="tel"
            value={form.phone}
            onChange={handleChange}
            placeholder="98765 43210"
          />
          <TextField
            isDark={isDark}
            label="Base salary"
            icon={<IndianRupee size={12} />}
            required
            name="baseSalary"
            type="number"
            min="0"
            inputMode="decimal"
            value={form.baseSalary}
            onChange={handleChange}
            placeholder="0"
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl border-2 border-red-500/30 bg-red-500/10 px-3 py-2 text-[14px] font-semibold text-red-500">
            <AlertCircle size={14} className="shrink-0" /> {error}
          </div>
        )}
        <p className={`text-[12px] ${t.muted}`}>
          You can set bonus and deductions later from Edit.
        </p>
      </form>
    </Modal>
  );
}
