// client/src/components/Car/SalaryTable.jsx
import React from "react";
import { Eye, Wallet, Calendar, Loader2 } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";
import { tk, btnBase, Avatar, StatusPill, EmptyState, inr, n } from "./staffUi";

const paidOn = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
      })
    : "";

export default function SalaryTable({
  salaries,
  onPay,
  onView,
  isDark: isDarkProp,
  payingId,
  emptyAction,
}) {
  const theme = useTheme();
  const isDark = isDarkProp ?? theme?.isDark;
  const t = tk(isDark);

  if (!salaries || !salaries.length) {
    return (
      <EmptyState
        isDark={isDark}
        icon={Wallet}
        title="No salaries for this month"
        text="Prepare payroll to create salary records for your staff."
        action={emptyAction}
      />
    );
  }

  const deductions = (r) => n(r.leaveDeduction) + n(r.extraDeductions);
  const netCls = isDark ? "text-green-400" : "text-green-700";

  const PayAction = ({ row, full }) => {
    if (row.status === "UNPAID") {
      const busy = payingId === row.id;
      return (
        <button
          type="button"
          disabled={busy}
          onClick={() => onPay(row)}
          className={`${btnBase} h-8 px-3 ${t.btnPrimary} ${full ? "flex-1" : ""}`}
        >
          {busy ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <Wallet size={12} />
          )}
          Pay
        </button>
      );
    }
    if (row.status === "PAID" && row.paidAt) {
      return (
        <span
          className={`inline-flex items-center gap-1 text-[12px] font-bold ${t.muted}`}
        >
          <Calendar size={12} /> Paid {paidOn(row.paidAt)}
        </span>
      );
    }
    return null;
  };

  const ViewBtn = ({ row }) => (
    <button
      type="button"
      onClick={() => onView(row)}
      title="View payslip"
      aria-label="View payslip"
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border-2 transition ${t.btnGhost}`}
    >
      <Eye size={14} />
    </button>
  );

  const th =
    "px-4 py-3 text-[12px] font-black uppercase tracking-wider text-slate-400";
  const rowHover = isDark ? "hover:bg-white/5" : "hover:bg-[#F8FAFC]";

  return (
    <>
      {/* desktop */}
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full border-collapse text-left">
          <thead className={`border-b-2 ${t.cardHead}`}>
            <tr>
              <th className={th}>Staff member</th>
              <th className={`${th} text-right`}>Base pay</th>
              <th className={`${th} text-center`}>Leaves</th>
              <th className={`${th} text-right`}>Bonus</th>
              <th className={`${th} text-right`}>Deductions</th>
              <th className={`${th} text-right`}>Net salary</th>
              <th className={th}>Status</th>
              <th className={`${th} text-right`}>Action</th>
            </tr>
          </thead>
          <tbody>
            {salaries.map((row) => (
              <tr
                key={row.id}
                className={`border-b transition last:border-0 ${t.line} ${rowHover}`}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={row.staff?.name} isDark={isDark} size="sm" />
                    <div className="min-w-0">
                      <p
                        className={`truncate text-[14px] font-black ${t.heading}`}
                      >
                        {row.staff?.name || "—"}
                      </p>
                      {row.staff?.role && (
                        <p className={`truncate text-[12px] ${t.muted}`}>
                          {row.staff.role}
                        </p>
                      )}
                    </div>
                  </div>
                </td>
                <td
                  className={`px-4 py-3 text-right font-mono text-[14px] font-bold ${t.body}`}
                >
                  {inr(row.baseSalary)}
                </td>
                <td className="px-4 py-3 text-center">
                  <span
                    className={`inline-block min-w-[28px] rounded-lg px-2 py-0.5 text-[12px] font-black ${
                      n(row.leaves) > 0
                        ? "bg-red-500/10 text-red-500"
                        : isDark
                          ? "bg-white/5 text-slate-500"
                          : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    {n(row.leaves)}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-mono text-[14px] font-bold text-green-600">
                  {inr(row.bonus)}
                </td>
                <td className="px-4 py-3 text-right">
                  <p className="font-mono text-[14px] font-bold text-red-500">
                    {inr(deductions(row))}
                  </p>
                  {n(row.leaveDeduction) > 0 && (
                    <p className={`text-[12px] ${t.muted}`}>
                      incl. leave {inr(row.leaveDeduction)}
                    </p>
                  )}
                </td>
                <td
                  className={`px-4 py-3 text-right font-mono text-[16px] font-black ${netCls}`}
                >
                  {inr(row.netSalary)}
                </td>
                <td className="px-4 py-3">
                  <StatusPill status={row.status} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <ViewBtn row={row} />
                    <PayAction row={row} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* phone / tablet */}
      <div className="grid gap-3 p-3 sm:grid-cols-2 sm:p-4 lg:hidden">
        {salaries.map((row) => (
          <div key={row.id} className={`rounded-2xl border-2 p-3 ${t.inner}`}>
            <div className="flex items-start gap-3">
              <Avatar name={row.staff?.name} isDark={isDark} size="sm" />
              <div className="min-w-0 flex-1">
                <p className={`truncate text-[14px] font-black ${t.heading}`}>
                  {row.staff?.name || "—"}
                </p>
                <StatusPill status={row.status} />
              </div>
              <div className="text-right">
                <p className="text-[12px] font-bold uppercase tracking-wider text-slate-400">
                  Net
                </p>
                <p className={`font-mono text-[16px] font-black ${netCls}`}>
                  {inr(row.netSalary)}
                </p>
              </div>
            </div>

            <div
              className={`mt-3 grid grid-cols-4 gap-1 rounded-xl border-2 p-2 text-center ${t.line}`}
            >
              {[
                ["Base", inr(row.baseSalary), t.heading],
                [
                  "Leaves",
                  n(row.leaves),
                  n(row.leaves) > 0 ? "text-red-500" : t.muted,
                ],
                ["Bonus", inr(row.bonus), "text-green-600"],
                ["Deduct", inr(deductions(row)), "text-red-500"],
              ].map(([label, value, cls]) => (
                <div key={label} className="min-w-0">
                  <p className="text-[12px] font-bold uppercase text-slate-400">
                    {label}
                  </p>
                  <p
                    className={`truncate font-mono text-[12px] font-black ${cls}`}
                  >
                    {value}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-3 flex items-center justify-between gap-2">
              <ViewBtn row={row} />
              <PayAction row={row} full />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
