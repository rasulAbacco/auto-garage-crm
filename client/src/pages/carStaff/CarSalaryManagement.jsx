// client/src/pages/carStaff/CarSalaryManagement.jsx
import { useCallback, useEffect, useMemo, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import {
  Wallet,
  CheckCircle2,
  Clock,
  Users,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import SalaryFilters from "../../components/Car/SalaryFilters";
import SalaryTable from "../../components/Car/SalaryTable";
import PreparePayrollModal from "../../components/Car/PreparePayrollModal";
import SalaryViewModal from "../../components/Car/SalaryViewModal";
import {
  tk,
  btnBase,
  PageHeading,
  ConfirmDialog,
  StatTile,
  ErrorBar,
  SkeletonRows,
  inr,
  n,
  monthName,
} from "../../components/Car/staffUi";

import {
  getSalaries,
  generateSalary,
  markSalaryPaid,
  updateSalary,
} from "../../utils/salaryApi";
import { useTheme } from "../../contexts/ThemeContext";

const API = import.meta.env.VITE_API_BASE_URL;
const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});
const validYear = (y) => Number(y) >= 2000 && Number(y) <= 2100;
const errMsg = (e, fallback) =>
  e?.response?.data?.message || e?.message || fallback;

export default function SalaryManagement() {
  const { isDark } = useTheme();
  const t = tk(isDark);
  const today = new Date();

  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());
  const [salaries, setSalaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [staffList, setStaffList] = useState([]);
  const [showPrepare, setShowPrepare] = useState(false);
  const [viewSalary, setViewSalary] = useState(null);
  const [companyProfile, setCompanyProfile] = useState(null);
  const [payTarget, setPayTarget] = useState(null);
  const [payingId, setPayingId] = useState(null);

  /* ---------- fetch ---------- */
  const loadSalaries = useCallback(async () => {
    if (!month || !validYear(year)) return;
    setLoading(true);
    setError("");
    try {
      const data = await getSalaries(month, year);
      setSalaries(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setSalaries([]);
      setError(errMsg(e, "Could not load salaries"));
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  const loadStaff = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/car-staff`, {
        headers: authHeaders(),
      });
      const data = await res.json();
      setStaffList(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Failed to load staff", e);
    }
  }, []);

  const loadProfile = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/user/profile`, {
        headers: authHeaders(),
      });
      setCompanyProfile(await res.json());
    } catch (e) {
      console.error("Failed to load profile", e);
    }
  }, []);

  useEffect(() => {
    loadSalaries();
  }, [loadSalaries]);

  useEffect(() => {
    loadStaff();
    loadProfile();
  }, [loadStaff, loadProfile]);

  const openPrepare = () => {
    loadStaff(); // pick up staff added since the page opened
    setShowPrepare(true);
  };

  /* ---------- CSV ---------- */
  const handleDownloadReport = () => {
    if (!salaries.length) {
      toast.error("No salary data to download");
      return;
    }
    const headers = [
      "Staff Name",
      "Base Salary",
      "Leaves",
      "Leave Deduction",
      "Bonus",
      "Extra Deductions",
      "Net Salary",
      "Status",
      "Paid At",
    ];
    const rows = salaries.map((s) => [
      s.staff?.name ?? "",
      n(s.baseSalary),
      n(s.leaves),
      n(s.leaveDeduction),
      n(s.bonus),
      n(s.extraDeductions),
      n(s.netSalary),
      s.status ?? "",
      s.paidAt ? new Date(s.paidAt).toLocaleDateString("en-IN") : "",
    ]);
    const esc = (v) => `"${String(v).replace(/"/g, '""')}"`;
    const csv =
      "﻿" + [headers, ...rows].map((r) => r.map(esc).join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Salary_Report_${monthName(month)}_${year}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  /* ---------- generate / update ---------- */
  const handleGenerate = async ({ createPayload, updatePayload }) => {
    try {
      if (Object.keys(createPayload).length > 0) {
        await generateSalary(month, year, createPayload);
      }
      for (const item of updatePayload) {
        await updateSalary(item.id, item.data);
      }
      toast.success(`Payroll saved for ${monthName(month)} ${year}`);
      setShowPrepare(false);
      loadSalaries();
    } catch (e) {
      console.error(e);
      toast.error(errMsg(e, "Could not save payroll"));
    }
  };

  /* ---------- pay ---------- */
  const confirmPay = async () => {
    if (!payTarget) return;
    const target = payTarget;
    setPayingId(target.id);
    try {
      await markSalaryPaid(target.id);
      toast.success(`${target.staff?.name || "Salary"} marked as paid`);
      setPayTarget(null);
      await loadSalaries();
    } catch (e) {
      console.error(e);
      toast.error(errMsg(e, "Could not mark as paid"));
    } finally {
      setPayingId(null);
    }
  };

  /* ---------- stats ---------- */
  const stats = useMemo(() => {
    const total = salaries.reduce((s, r) => s + n(r.netSalary), 0);
    const paidList = salaries.filter((s) => s.status === "PAID");
    const paid = paidList.reduce((s, r) => s + n(r.netSalary), 0);
    return {
      total,
      paid,
      pending: total - paid,
      paidCount: paidList.length,
      totalCount: salaries.length,
    };
  }, [salaries]);

  const period = `${monthName(month)} ${year || ""}`.trim();

  return (
    <div className="min-h-screen lg:ml-20">
      <Toaster
        position="top-right"
        toastOptions={{ style: { fontSize: 14 } }}
      />

      <div className="mx-auto max-w-[1600px] space-y-4 sm:space-y-5">
        <PageHeading
          isDark={isDark}
          title="Payroll"
          accent="management."
          subtitle={`Salaries, leaves and payslips for ${period}.`}
          right={
            <button
              type="button"
              onClick={loadSalaries}
              aria-label="Refresh"
              title="Refresh"
              className={`${btnBase} h-10 w-10 border-2 ${t.btnGhost}`}
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            </button>
          }
        />

        {/* stats */}
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <StatTile
            isDark={isDark}
            title="Total payroll"
            value={inr(stats.total)}
            icon={Wallet}
          />
          <StatTile
            isDark={isDark}
            title="Paid"
            value={inr(stats.paid)}
            icon={CheckCircle2}
            chip="bg-green-500/10 text-green-600"
          />
          <StatTile
            isDark={isDark}
            title="Pending"
            value={inr(stats.pending)}
            icon={Clock}
            chip="bg-amber-500/10 text-amber-600"
          />
          <StatTile
            isDark={isDark}
            title="Staff paid"
            value={`${stats.paidCount} / ${stats.totalCount}`}
            sub="Paid / total"
            icon={Users}
            chip="bg-blue-500/10 text-blue-500"
          />
        </div>

        <ErrorBar message={error} onRetry={loadSalaries} />

        <div className={`overflow-hidden rounded-2xl border-2 ${t.card}`}>
          <div className={`border-b-2 p-3 sm:p-4 ${t.line}`}>
            <SalaryFilters
              month={month}
              year={year}
              onMonthChange={setMonth}
              onYearChange={setYear}
              onGenerate={openPrepare}
              onDownload={handleDownloadReport}
              disabled={!salaries.length}
              isDark={isDark}
            />
            {!validYear(year) && (
              <p className="mt-2 text-[12px] font-bold text-amber-500">
                Enter a 4-digit year to load salaries.
              </p>
            )}
          </div>

          {loading ? (
            <SkeletonRows isDark={isDark} rows={4} />
          ) : (
            <SalaryTable
              salaries={salaries}
              onPay={setPayTarget}
              onView={setViewSalary}
              payingId={payingId}
              isDark={isDark}
              emptyAction={
                !error && (
                  <button
                    type="button"
                    onClick={openPrepare}
                    className={`${btnBase} h-9 px-4 ${t.btnPrimary}`}
                  >
                    <Sparkles size={14} /> Prepare payroll
                  </button>
                )
              }
            />
          )}
        </div>
      </div>

      {showPrepare && (
        <PreparePayrollModal
          staffList={staffList}
          existingSalaries={salaries}
          month={month}
          year={year}
          isDark={isDark}
          onClose={() => setShowPrepare(false)}
          onSubmit={handleGenerate}
        />
      )}

      {viewSalary && (
        <SalaryViewModal
          salary={viewSalary}
          companyProfile={companyProfile}
          isDark={isDark}
          onClose={() => setViewSalary(null)}
        />
      )}

      <ConfirmDialog
        isDark={isDark}
        open={Boolean(payTarget)}
        tone="success"
        title="Mark as paid?"
        message={
          payTarget
            ? `${payTarget.staff?.name || "This salary"} · ${inr(payTarget.netSalary)} for ${period}. Paid salaries are locked.`
            : ""
        }
        confirmText="Mark paid"
        busy={Boolean(payingId)}
        onConfirm={confirmPay}
        onCancel={() => !payingId && setPayTarget(null)}
      />
    </div>
  );
}
