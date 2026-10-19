// client/src/components/Car/StaffViewModal.jsx
import React from "react";
import {
  TrendingUp,
  TrendingDown,
  Briefcase,
  Phone,
  Mail,
  Calendar,
  Edit3,
  CheckCircle2,
  ShieldAlert,
  UserX,
  User,
} from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";
import {
  tk,
  btnBase,
  Modal,
  Avatar,
  fmtDate,
  inr,
  n,
  staffCode,
} from "./staffUi";

export default function StaffViewModal({ staff, onClose, onEdit }) {
  const { isDark } = useTheme();
  const t = tk(isDark);

  // Estimated from the staff defaults (no monthly data here)
  const baseSalary = n(staff.baseSalary);
  const bonusDefault = n(staff.bonusDefault);
  const extraDeductionsDefault = n(staff.extraDeductionsDefault);
  const advanceAmount = n(staff.advanceAmount);
  const deductionPerLeave = n(staff.deductionPerLeave);

  const totalEarnings = baseSalary + bonusDefault;
  const totalDeductions = extraDeductionsDefault;
  const estimatedNetSalary = totalEarnings - totalDeductions;
  const yearlyProjection = estimatedNetSalary * 12;

  const Row = ({ label, value, tone }) => (
    <div
      className={`flex items-center justify-between gap-3 border-b border-dashed py-2 last:border-0 ${t.line}`}
    >
      <span className={`text-[14px] ${t.muted}`}>{label}</span>
      <span
        className={`font-mono text-[14px] font-bold ${
          tone === "neg"
            ? "text-red-500"
            : tone === "warn"
              ? "text-amber-500"
              : t.heading
        }`}
      >
        {value}
      </span>
    </div>
  );

  const login = staff.login;
  const accessPill = !login ? (
    <span
      className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[12px] font-black uppercase tracking-wider ${t.inner} ${t.muted}`}
    >
      <UserX size={12} /> No login
    </span>
  ) : login.isActive ? (
    <span className="inline-flex items-center gap-1 rounded-lg border border-green-500/30 bg-green-500/10 px-2 py-0.5 text-[12px] font-black uppercase tracking-wider text-green-600">
      <CheckCircle2 size={12} /> Login active
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-lg border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-[12px] font-black uppercase tracking-wider text-red-500">
      <ShieldAlert size={12} /> Login off
    </span>
  );

  const Info = ({ icon: Icon, label, value, href }) => (
    <div
      className={`flex min-w-0 items-center gap-2 rounded-xl border-2 px-3 py-2 ${t.inner}`}
    >
      <Icon size={14} className="shrink-0 text-slate-400" />
      <div className="min-w-0">
        <p className="text-[12px] font-bold uppercase tracking-wider text-slate-400">
          {label}
        </p>
        {href && value ? (
          <a
            href={href}
            className={`block truncate text-[14px] font-bold ${t.heading} hover:underline`}
          >
            {value}
          </a>
        ) : (
          <p className={`truncate text-[14px] font-bold ${t.heading}`}>
            {value || "—"}
          </p>
        )}
      </div>
    </div>
  );

  return (
    <Modal
      isDark={isDark}
      open
      onClose={onClose}
      icon={User}
      title="Staff profile"
      subtitle={`${staff.name} · ${staffCode(staff.id)}`}
      maxW="max-w-2xl"
      footer={
        <div
          className={`grid gap-2 ${onEdit ? "grid-cols-2 sm:flex sm:justify-end" : "sm:flex sm:justify-end"}`}
        >
          <button
            type="button"
            onClick={onClose}
            className={`${btnBase} h-10 border-2 px-5 ${t.btnGhost}`}
          >
            Close
          </button>
          {onEdit && (
            <button
              type="button"
              onClick={onEdit}
              className={`${btnBase} h-10 px-5 ${t.btnPrimary}`}
            >
              <Edit3 size={14} /> Edit
            </button>
          )}
        </div>
      }
    >
      <div className="space-y-4 p-4 sm:p-5">
        {/* identity */}
        <div className="flex items-center gap-3">
          <Avatar name={staff.name} isDark={isDark} size="lg" />
          <div className="min-w-0">
            <h2
              className={`truncate text-[16px] font-black uppercase tracking-tight ${t.heading}`}
            >
              {staff.name}
            </h2>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <span
                className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[12px] font-bold ${t.inner} ${t.body}`}
              >
                <Briefcase size={12} /> {staff.role || "Staff"}
              </span>
              {accessPill}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <Info
            icon={Phone}
            label="Phone"
            value={staff.phone}
            href={staff.phone ? `tel:${staff.phone}` : undefined}
          />
          <Info
            icon={Mail}
            label="Login email"
            value={login?.email}
            href={login?.email ? `mailto:${login.email}` : undefined}
          />
          <Info
            icon={Calendar}
            label="Joined"
            value={fmtDate(staff.createdAt || staff.joinDate)}
          />
        </div>

        {/* pay breakdown */}
        <div className={`overflow-hidden rounded-2xl border-2 ${t.line}`}>
          <div className="grid grid-cols-1 sm:grid-cols-2">
            <div className={`p-4 ${t.inner} border-0`}>
              <p className="mb-2 flex items-center gap-1.5 text-[12px] font-black uppercase tracking-wider text-green-600">
                <TrendingUp size={14} /> Earnings (defaults)
              </p>
              <Row label="Base salary" value={inr(baseSalary)} />
              <Row label="Monthly bonus" value={inr(bonusDefault)} />
              <div
                className={`mt-2 flex items-center justify-between border-t-2 pt-2 ${t.line}`}
              >
                <span className={`text-[14px] font-black ${t.heading}`}>
                  Total earnings
                </span>
                <span className="font-mono text-[14px] font-black text-green-600">
                  {inr(totalEarnings)}
                </span>
              </div>
            </div>

            <div
              className={`border-t-2 p-4 sm:border-l-2 sm:border-t-0 ${t.line}`}
            >
              <p className="mb-2 flex items-center gap-1.5 text-[12px] font-black uppercase tracking-wider text-red-500">
                <TrendingDown size={14} /> Deductions & balances
              </p>
              <Row
                label="Outstanding advance"
                value={inr(advanceAmount)}
                tone={advanceAmount > 0 ? "warn" : undefined}
              />
              <Row
                label="Extra deductions"
                value={`− ${inr(extraDeductionsDefault)}`}
                tone="neg"
              />
              <Row label="Per leave day" value={inr(deductionPerLeave)} />
              <div
                className={`mt-2 flex items-center justify-between border-t-2 pt-2 ${t.line}`}
              >
                <span className={`text-[14px] font-black ${t.heading}`}>
                  Total deductions
                </span>
                <span className="font-mono text-[14px] font-black text-red-500">
                  − {inr(totalDeductions)}
                </span>
              </div>
            </div>
          </div>

          {/* highlight */}
          <div
            className={`flex items-center justify-between gap-3 px-4 py-3 ${
              isDark ? "bg-white text-[#001F3F]" : "bg-[#001F3F] text-white"
            }`}
          >
            <div>
              <p className="text-[12px] font-bold uppercase tracking-[0.15em] opacity-70">
                Est. monthly salary
              </p>
              <p className="font-mono text-[16px] font-black">
                {inr(estimatedNetSalary)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[12px] font-bold uppercase tracking-[0.15em] opacity-70">
                Yearly
              </p>
              <p className="font-mono text-[14px] font-bold opacity-90">
                {inr(yearlyProjection)}
              </p>
            </div>
          </div>
        </div>

        <p className={`text-[12px] ${t.muted}`}>
          Leave deductions are added when you prepare each month's payroll.
        </p>
      </div>
    </Modal>
  );
}
