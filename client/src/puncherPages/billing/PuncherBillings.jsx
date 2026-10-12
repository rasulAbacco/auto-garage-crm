// src/puncherPages/billing/PuncherBillings.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Toaster, toast } from "react-hot-toast";
import { Receipt, PlusCircle, IndianRupee, Clock, FileText, Eye } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";
import { puncherApi, inr, fmtDate, prettyEnum } from "../puncherApi";
import CreateBillModal from "./CreateBillModal";
import {
  PageShell,
  PageHeader,
  StatCard,
  PrimaryButton,
  GhostButton,
  SearchInput,
  Segmented,
  Badge,
  Loading,
  ErrorBox,
  EmptyState,
  cx,
} from "../PuncherUI";

export default function PuncherBillings() {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();

  const [bills, setBills] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [createOpen, setCreateOpen] = useState(params.get("new") === "1");

  const load = async () => {
    setLoading(true);
    try {
      const [b, c] = await Promise.all([puncherApi("/billings"), puncherApi("/clients")]);
      setBills(b);
      setClients(c);
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return bills.filter(
      (b) =>
        (statusFilter === "ALL" || b.status === statusFilter) &&
        (!q || [b.invoiceNumber, b.client?.fullName, b.client?.phone, b.client?.regNumber].filter(Boolean).some((v) => v.toLowerCase().includes(q))),
    );
  }, [bills, search, statusFilter]);

  const sum = (st) => bills.filter((b) => b.status === st).reduce((s, b) => s + b.grandTotal, 0);

  const closeCreate = () => {
    setCreateOpen(false);
    if (params.get("new")) setParams({}, { replace: true });
  };

  return (
    <PageShell>
      <Toaster position="top-right" />
      <PageHeader
        isDark={isDark}
        title="Billings"
        subtitle="Invoices for puncture and tyre services"
        action={
          <PrimaryButton onClick={() => setCreateOpen(true)}>
            <PlusCircle className="w-4 h-4" /> Create Bill
          </PrimaryButton>
        }
      />

      <div className="grid grid-cols-1 gap-4 mb-6 sm:grid-cols-3">
        <StatCard isDark={isDark} title="Total Bills" value={bills.length} icon={FileText} gradient="from-sky-500 to-blue-600" />
        <StatCard isDark={isDark} title="Collected" value={inr(sum("PAID"))} icon={IndianRupee} gradient="from-emerald-500 to-green-600" />
        <StatCard isDark={isDark} title="Pending" value={inr(sum("PENDING"))} icon={Clock} gradient="from-amber-500 to-orange-600" />
      </div>

      <div className="flex flex-col gap-3 mb-6 md:flex-row md:items-center">
        <div className="flex-1">
          <SearchInput isDark={isDark} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by invoice no., client, phone or registration..." aria-label="Search bills" />
        </div>
        <Segmented
          isDark={isDark}
          value={statusFilter}
          onChange={setStatusFilter}
          options={["ALL", "PENDING", "PAID", "CANCELLED"].map((s) => ({ value: s, label: s === "ALL" ? "All" : prettyEnum(s) }))}
        />
      </div>

      <ErrorBox message={error} isDark={isDark} />

      {loading ? (
        <Loading isDark={isDark} label="Loading bills..." />
      ) : filtered.length === 0 ? (
        <EmptyState
          isDark={isDark}
          icon={Receipt}
          title={bills.length ? "No matching bills" : "No bills yet"}
          text={bills.length ? "Try a different filter" : "Create a bill from a client's completed services"}
          action={!bills.length && <PrimaryButton onClick={() => setCreateOpen(true)}><PlusCircle className="w-4 h-4" /> Create Bill</PrimaryButton>}
        />
      ) : (
        <div className={cx("overflow-x-auto rounded-2xl border-2", isDark ? "border-gray-700 bg-gray-800" : "border-gray-100 bg-white")}>
          <table className="w-full text-sm">
            <thead className={isDark ? "text-gray-400" : "text-gray-500"}>
              <tr className={cx("text-left border-b", isDark ? "border-gray-700" : "border-gray-100")}>
                <th className="px-5 py-3 font-semibold">Invoice</th>
                <th className="px-5 py-3 font-semibold">Client</th>
                <th className="px-5 py-3 font-semibold">Date</th>
                <th className="px-5 py-3 font-semibold text-right">Amount</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => (
                <tr key={b.id} className={cx("border-b last:border-0", isDark ? "border-gray-700 text-gray-200" : "border-gray-50 text-gray-800")}>
                  <td className="px-5 py-4 font-semibold whitespace-nowrap">{b.invoiceNumber}</td>
                  <td className="px-5 py-4">
                    <div className="font-medium">{b.client?.fullName}</div>
                    <div className="text-xs text-gray-500">{b.client?.regNumber || b.client?.phone}</div>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">{fmtDate(b.createdAt)}</td>
                  <td className="px-5 py-4 font-bold text-right whitespace-nowrap">{inr(b.grandTotal)}</td>
                  <td className="px-5 py-4">
                    <Badge status={b.status} isDark={isDark} />
                    {b.paymentMode && b.status === "PAID" && <span className="block mt-1 text-xs text-gray-500">{prettyEnum(b.paymentMode)}</span>}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <GhostButton isDark={isDark} onClick={() => navigate(`/puncher-billing/${b.id}`)}>
                      <Eye className="w-4 h-4" /> View
                    </GhostButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <CreateBillModal
        open={createOpen}
        onClose={closeCreate}
        clients={clients}
        defaultClientId={params.get("clientId")}
        isDark={isDark}
        onCreated={(bill) => {
          toast.success(`Bill ${bill.invoiceNumber} created`);
          closeCreate();
          navigate(`/puncher-billing/${bill.id}`);
        }}
      />
    </PageShell>
  );
}
