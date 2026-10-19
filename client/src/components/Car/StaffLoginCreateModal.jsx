// client/src/components/Car/StaffLoginCreateModal.jsx
import React, { useState } from "react";
import toast from "react-hot-toast";
import { useTheme } from "../../contexts/ThemeContext";
import {
  Mail,
  Lock,
  Loader2,
  ShieldCheck,
  KeyRound,
  AlertCircle,
} from "lucide-react";
import {
  tk,
  btnBase,
  Modal,
  TextField,
  PasswordField,
  Avatar,
} from "./staffUi";

const API = import.meta.env.VITE_API_BASE_URL;

export default function StaffLoginCreateModal({ staff, onClose, onSaved }) {
  const { isDark } = useTheme();
  const t = tk(isDark);
  const [form, setForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const submit = async (e) => {
    e.preventDefault();

    if (!form.email || !form.password)
      return setError("Email and password are required");
    if (form.password !== form.confirmPassword)
      return setError("Passwords do not match");

    setLoading(true);
    try {
      const res = await fetch(`${API}/api/staff-auth/create/${staff.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          email: form.email.trim(),
          password: form.password,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.message || "Failed to create login");
        return;
      }

      toast.success(`Login created for ${staff.name}`);
      onSaved?.();
      onClose();
    } catch (err) {
      console.error(err);
      setError("Failed to create login");
    } finally {
      setLoading(false);
    }
  };

  const mismatch =
    form.confirmPassword && form.password !== form.confirmPassword;

  return (
    <Modal
      isDark={isDark}
      open
      onClose={loading ? () => {} : onClose}
      icon={KeyRound}
      title="Create staff login"
      subtitle="Set up sign-in details for this employee."
      maxW="max-w-lg"
      footer={
        <div className="grid grid-cols-2 gap-2 sm:flex sm:justify-end">
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
            form="staff-login-form"
            disabled={loading}
            className={`${btnBase} h-10 px-5 ${t.btnPrimary}`}
          >
            {loading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <ShieldCheck size={14} />
            )}
            {loading ? "Creating…" : "Create login"}
          </button>
        </div>
      }
    >
      <form
        id="staff-login-form"
        onSubmit={submit}
        className="space-y-4 p-4 sm:p-5"
      >
        <div
          className={`flex items-center gap-3 rounded-xl border-2 p-3 ${t.inner}`}
        >
          <Avatar name={staff.name} isDark={isDark} />
          <div className="min-w-0">
            <p className="text-[12px] font-bold uppercase tracking-wider text-slate-400">
              Assigning to
            </p>
            <p className={`truncate text-[14px] font-black ${t.heading}`}>
              {staff.name}
              {staff.role ? (
                <span className={`font-medium ${t.muted}`}>
                  {" "}
                  · {staff.role}
                </span>
              ) : null}
            </p>
          </div>
        </div>

        <TextField
          isDark={isDark}
          label="Work email"
          icon={<Mail size={12} />}
          required
          type="email"
          name="email"
          placeholder="name@yourgarage.com"
          value={form.email}
          onChange={handleChange}
          autoComplete="off"
          autoFocus
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <PasswordField
            isDark={isDark}
            label="Password"
            icon={<Lock size={12} />}
            required
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            autoComplete="new-password"
          />
          <PasswordField
            isDark={isDark}
            label="Confirm password"
            icon={<ShieldCheck size={12} />}
            required
            name="confirmPassword"
            placeholder="Type it again"
            value={form.confirmPassword}
            onChange={handleChange}
            autoComplete="new-password"
          />
        </div>
        {mismatch && !error && (
          <p className="text-[12px] font-bold text-amber-500">
            Passwords don't match yet.
          </p>
        )}

        {error && (
          <div className="flex items-center gap-2 rounded-xl border-2 border-red-500/30 bg-red-500/10 px-3 py-2 text-[14px] font-semibold text-red-500">
            <AlertCircle size={14} className="shrink-0" /> {error}
          </div>
        )}
      </form>
    </Modal>
  );
}
