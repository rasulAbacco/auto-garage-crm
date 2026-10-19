// client/src/components/Car/PreparePayrollModal.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Lock, Sparkles, Loader2, Save, Users } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";
import {
  tk,
  btnBase,
  Modal,
  Avatar,
  StatusPill,
  EmptyState,
  MiniNumber,
  inr,
  n,
  monthName,
} from "./staffUi";

const FIELDS = [
  { key: "leaves", label: "Leaves" },
  { key: "bonus", label: "Bonus" },
  { key: "extraDeductions", label: "Extra ded." },
];

export default function PreparePayrollModal({
  staffList,
  existingSalaries,
  month,
  year,
  onClose,
  onSubmit,
  isDark: isDarkProp,
}) {
  const theme = useTheme();
  const isDark = isDarkProp ?? theme?.isDark;
  const t = tk(isDark);

  const staff = Array.isArray(staffList) ? staffList : [];
  const salaries = Array.isArray(existingSalaries) ? existingSalaries : [];

  const [inputs, setInputs] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const initial = {};
    staff.forEach((s) => {
      const salary = salaries.find((sal) => sal.staffId === s.id);
      initial[s.id] = {
        salaryId: salary?.id || null,
        leaves: salary ? salary.leaves : "",
        bonus: salary ? salary.bonus : "",
        extraDeductions: salary ? salary.extraDeductions : "",
        status: salary?.status || "UNPAID",
      };
    });
    setInputs(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [staffList, existingSalaries]);

  const updateField = (staffId, field, value) => {
    setInputs((prev) => ({
      ...prev,
      [staffId]: {
        ...prev[staffId],
        [field]: value === "" ? "" : Number(value),
      },
    }));
  };

  const estNet = (s) => {
    const row = inputs[s.id] || {};
    return (
      n(s.baseSalary) +
      n(row.bonus) -
      n(row.leaves) * n(s.deductionPerLeave) -
      n(row.extraDeductions)
    );
  };

  const summary = useMemo(() => {
    const rows = Object.values(inputs);
    return {
      paid: rows.filter((r) => r.status === "PAID").length,
      saved: rows.filter((r) => r.salaryId && r.status !== "PAID").length,
      fresh: rows.filter((r) => !r.salaryId).length,
      total: staff.reduce((acc, s) => acc + estNet(s), 0),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputs, staff]);

  const handleGenerate = async () => {
    const createPayload = {};
    const updatePayload = [];

    Object.entries(inputs).forEach(([staffId, data]) => {
      const payload = {
        leaves: Number(data.leaves) || 0,
        bonus: Number(data.bonus) || 0,
        extraDeductions: Number(data.extraDeductions) || 0,
      };
      if (data.salaryId && data.status !== "PAID") {
        updatePayload.push({ id: data.salaryId, data: payload });
      } else if (!data.salaryId) {
        createPayload[staffId] = payload;
      }
    });

    setSaving(true);
    try {
      await onSubmit({ createPayload, updatePayload });
    } finally {
      setSaving(false);
    }
  };

  const RowStatus = ({ s }) => {
    const row = inputs[s.id];
    if (!row) return null;
    if (row.status === "PAID")
      return (
        <span className="inline-flex items-center gap-1 rounded-lg border border-green-500/30 bg-green-500/10 px-2 py-0.5 text-[12px] font-black uppercase tracking-wider text-green-600">
          <Lock size={12} /> Paid
        </span>
      );
    if (row.salaryId) return <StatusPill status={row.status} />;
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[12px] font-black uppercase tracking-wider ${t.inner} ${t.heading}`}
      >
        <Sparkles size={12} /> New
      </span>
    );
  };

  const th =
    "px-3 py-3 text-[12px] font-black uppercase tracking-wider text-slate-400";
  const period = `${monthName(month)} ${year}`;

  return (
    <Modal
      isDark={isDark}
      open
      onClose={saving ? () => {} : onClose}
      icon={Sparkles}
      title="Prepare payroll"
      subtitle={`${period} · enter leaves, bonus and extra deductions`}
      maxW="max-w-6xl"
      footer={
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p
            className={`text-[12px] font-bold uppercase tracking-wider ${t.muted}`}
          >
            Est. total{" "}
            <span
              className={`ml-1 font-mono text-[14px] ${isDark ? "text-green-400" : "text-green-700"}`}
            >
              {inr(summary.total)}
            </span>
            <span className="ml-2 normal-case tracking-normal">
              · paid rows are locked
            </span>
          </p>
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className={`${btnBase} h-10 border-2 px-4 ${t.btnGhost}`}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={saving || !staff.length}
              className={`${btnBase} h-10 px-5 ${t.btnPrimary}`}
            >
              {saving ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Save size={14} />
              )}
              {saving ? "Saving…" : "Save salaries"}
            </button>
          </div>
        </div>
      }
    >
      {!staff.length ? (
        <EmptyState
          isDark={isDark}
          icon={Users}
          title="No staff yet"
          text="Add staff on the Staff page first, then prepare payroll."
        />
      ) : (
        <div className="space-y-3 p-3 sm:p-4">
          {/* summary chips */}
          <div className="flex flex-wrap gap-2">
            {[
              ["New", summary.fresh],
              ["Saved", summary.saved],
              ["Paid", summary.paid],
            ].map(([label, v]) => (
              <span
                key={label}
                className={`rounded-lg border-2 px-2.5 py-1 text-[12px] font-black uppercase tracking-wider ${t.inner} ${t.body}`}
              >
                {label} <span className={t.heading}>{v}</span>
              </span>
            ))}
          </div>

          {/* desktop grid */}
          <div
            className={`hidden overflow-x-auto rounded-xl border-2 lg:block ${t.line}`}
          >
            <table className="w-full border-collapse text-left">
              <thead className={`border-b-2 ${t.cardHead}`}>
                <tr>
                  <th className={th}>Staff</th>
                  <th className={`${th} text-right`}>Base</th>
                  <th className={`${th} text-right`}>Per leave</th>
                  <th className={th}>Leaves</th>
                  <th className={th}>Bonus</th>
                  <th className={th}>Extra deductions</th>
                  <th className={`${th} text-right`}>Est. net</th>
                  <th className={`${th} text-center`}>Status</th>
                </tr>
              </thead>
              <tbody>
                {staff.map((s) => {
                  const locked = inputs[s.id]?.status === "PAID";
                  return (
                    <tr
                      key={s.id}
                      className={`border-b last:border-0 ${t.line} ${locked ? "bg-green-500/5" : ""}`}
                    >
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={s.name} isDark={isDark} size="sm" />
                          <div className="min-w-0">
                            <p
                              className={`truncate text-[14px] font-black ${t.heading}`}
                            >
                              {s.name}
                            </p>
                            {s.role && (
                              <p className={`truncate text-[12px] ${t.muted}`}>
                                {s.role}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td
                        className={`px-3 py-2.5 text-right font-mono text-[14px] font-bold ${t.body}`}
                      >
                        {inr(s.baseSalary)}
                      </td>
                      <td
                        className={`px-3 py-2.5 text-right font-mono text-[14px] ${t.muted}`}
                      >
                        {inr(s.deductionPerLeave)}
                      </td>
                      {FIELDS.map((f) => (
                        <td key={f.key} className="px-3 py-2.5">
                          <MiniNumber
                            isDark={isDark}
                            aria-label={`${f.label} for ${s.name}`}
                            className="max-w-[110px]"
                            disabled={locked}
                            value={inputs[s.id]?.[f.key] ?? ""}
                            onChange={(e) =>
                              updateField(s.id, f.key, e.target.value)
                            }
                            placeholder="0"
                          />
                        </td>
                      ))}
                      <td
                        className={`px-3 py-2.5 text-right font-mono text-[14px] font-black ${isDark ? "text-green-400" : "text-green-700"}`}
                      >
                        {inr(estNet(s))}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <RowStatus s={s} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* phone / tablet cards */}
          <div className="grid gap-3 sm:grid-cols-2 lg:hidden">
            {staff.map((s) => {
              const locked = inputs[s.id]?.status === "PAID";
              return (
                <div
                  key={s.id}
                  className={`rounded-2xl border-2 p-3 ${t.inner} ${locked ? "opacity-80" : ""}`}
                >
                  <div className="flex items-start gap-2.5">
                    <Avatar name={s.name} isDark={isDark} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p
                        className={`truncate text-[14px] font-black ${t.heading}`}
                      >
                        {s.name}
                      </p>
                      <p className={`truncate text-[12px] ${t.muted}`}>
                        Base {inr(s.baseSalary)} · {inr(s.deductionPerLeave)}
                        /leave
                      </p>
                    </div>
                    <RowStatus s={s} />
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {FIELDS.map((f) => (
                      <label key={f.key} className="min-w-0">
                        <span className="mb-1 block truncate text-[12px] font-bold uppercase tracking-wider text-slate-400">
                          {f.label}
                        </span>
                        <MiniNumber
                          isDark={isDark}
                          disabled={locked}
                          value={inputs[s.id]?.[f.key] ?? ""}
                          onChange={(e) =>
                            updateField(s.id, f.key, e.target.value)
                          }
                          placeholder="0"
                        />
                      </label>
                    ))}
                  </div>
                  <div
                    className={`mt-3 flex items-center justify-between border-t-2 pt-2 ${t.line}`}
                  >
                    <span className="text-[12px] font-bold uppercase tracking-wider text-slate-400">
                      Est. net
                    </span>
                    <span
                      className={`font-mono text-[14px] font-black ${isDark ? "text-green-400" : "text-green-700"}`}
                    >
                      {inr(estNet(s))}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Modal>
  );
}
