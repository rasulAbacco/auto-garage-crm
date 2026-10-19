// client/src/pages/reports/ClientsReport.jsx  (client directory)
import React, { useMemo, useState } from "react";
import {
  FiUsers,
  FiSearch,
  FiPhone,
  FiMail,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";
import { Plate, tk, btnBase } from "../clients/components/clientUi";

const PAGE = 25;
const SORTS = [
  { key: "name", label: "Name A–Z" },
  { key: "make", label: "Vehicle make" },
  { key: "year", label: "Newest vehicle" },
];

export default function ClientsReport({ clients = [], isDark }) {
  const t = tk(isDark);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("name");
  const [page, setPage] = useState(1);

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    const list = clients.filter(
      (c) =>
        !term ||
        [
          c.fullName,
          c.phone,
          c.email,
          c.regNumber,
          c.vehicleMake,
          c.vehicleModel,
        ]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(term)),
    );
    const by = {
      name: (a, b) =>
        String(a.fullName || "").localeCompare(String(b.fullName || "")),
      make: (a, b) =>
        String(a.vehicleMake || "").localeCompare(
          String(b.vehicleMake || ""),
        ) || String(a.fullName || "").localeCompare(String(b.fullName || "")),
      year: (a, b) =>
        (Number(b.vehicleYear) || 0) - (Number(a.vehicleYear) || 0),
    };
    return [...list].sort(by[sort]);
  }, [clients, q, sort]);

  const pages = Math.max(1, Math.ceil(rows.length / PAGE));
  const cur = Math.min(page, pages);
  const shown = rows.slice((cur - 1) * PAGE, cur * PAGE);
  const vehicle = (c) =>
    [c.vehicleYear, c.vehicleMake, c.vehicleModel].filter(Boolean).join(" ") ||
    "—";

  return (
    <section className={`overflow-hidden rounded-2xl border-2 ${t.card}`}>
      <div
        className={`flex flex-col gap-3 border-b-2 px-4 py-3 sm:flex-row sm:items-center ${t.cardHead}`}
      >
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${t.chipNavy}`}
          >
            <FiUsers size={14} />
          </div>
          <div className="min-w-0">
            <h3
              className={`truncate text-[14px] font-black uppercase tracking-tight ${t.heading}`}
            >
              Client directory
            </h3>
            <p className={`text-[12px] ${t.muted}`}>
              {rows.length} of {clients.length} clients
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1 sm:w-64">
            <FiSearch
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={14}
            />
            <input
              type="search"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              placeholder="Search clients…"
              className={`h-10 w-full rounded-xl border-2 pl-9 pr-3 text-[14px] font-semibold outline-none transition ${t.input}`}
            />
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className={`h-10 cursor-pointer rounded-xl border-2 px-2 text-[12px] font-bold outline-none ${t.input} ${isDark ? "[&>option]:bg-[#000814]" : ""}`}
          >
            {SORTS.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {shown.length === 0 ? (
        <p className={`py-14 text-center text-[14px] ${t.muted}`}>
          {q ? "No clients match your search." : "No clients found."}
        </p>
      ) : (
        <>
          {/* desktop table */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr
                  className={`border-b-2 ${t.line} ${isDark ? "bg-white/5" : "bg-[#F8FAFC]"}`}
                >
                  {["Client", "Phone", "Email", "Vehicle", "Reg no"].map(
                    (h) => (
                      <th
                        key={h}
                        className="whitespace-nowrap px-4 py-3 text-[12px] font-black uppercase tracking-[0.15em] text-slate-400"
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {shown.map((c) => (
                  <tr
                    key={c.id}
                    className={`border-b transition-colors last:border-0 ${isDark ? "border-white/5 hover:bg-white/5" : "border-[#E2E8F0] hover:bg-[#F8FAFC]"}`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[12px] font-black ${t.chipNavy}`}
                        >
                          {(c.fullName || "?").charAt(0).toUpperCase()}
                        </div>
                        <span className={`text-[14px] font-bold ${t.heading}`}>
                          {c.fullName || "—"}
                        </span>
                      </div>
                    </td>
                    <td
                      className={`whitespace-nowrap px-4 py-3 text-[14px] ${t.body}`}
                    >
                      {c.phone || "—"}
                    </td>
                    <td
                      className={`max-w-[220px] truncate px-4 py-3 text-[14px] ${t.body}`}
                    >
                      {c.email || "—"}
                    </td>
                    <td className={`px-4 py-3 text-[14px] ${t.body}`}>
                      {vehicle(c)}
                    </td>
                    <td className="px-4 py-3">
                      {c.regNumber ? (
                        <Plate value={c.regNumber} size="sm" />
                      ) : (
                        <span className={t.muted}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* phone cards */}
          <div className="grid grid-cols-1 gap-2 p-2 sm:grid-cols-2 md:hidden">
            {shown.map((c) => (
              <div key={c.id} className={`rounded-xl border-2 p-3 ${t.inner}`}>
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[14px] font-black ${t.chipNavy}`}
                  >
                    {(c.fullName || "?").charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p
                      className={`truncate text-[14px] font-black ${t.heading}`}
                    >
                      {c.fullName || "—"}
                    </p>
                    <p className={`truncate text-[12px] ${t.muted}`}>
                      {vehicle(c)}
                    </p>
                  </div>
                  <Plate value={c.regNumber} size="sm" />
                </div>
                <div
                  className={`mt-2 flex flex-wrap gap-x-3 gap-y-1 border-t-2 pt-2 text-[12px] ${t.line} ${t.body}`}
                >
                  {c.phone && (
                    <a
                      href={`tel:${c.phone}`}
                      className="inline-flex items-center gap-1 hover:underline"
                    >
                      <FiPhone size={12} /> {c.phone}
                    </a>
                  )}
                  {c.email && (
                    <a
                      href={`mailto:${c.email}`}
                      className="inline-flex min-w-0 items-center gap-1 truncate hover:underline"
                    >
                      <FiMail size={12} /> {c.email}
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>

          {pages > 1 && (
            <div
              className={`flex items-center justify-between gap-2 border-t-2 px-4 py-3 ${t.line}`}
            >
              <p className={`text-[12px] font-semibold ${t.muted}`}>
                {(cur - 1) * PAGE + 1}–{Math.min(cur * PAGE, rows.length)} of{" "}
                {rows.length}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(cur - 1)}
                  disabled={cur <= 1}
                  className={`${btnBase} h-8 border-2 px-2.5 ${t.btnGhost}`}
                >
                  <FiChevronLeft size={14} />
                </button>
                <span
                  className={`flex h-8 items-center rounded-lg px-3 text-[12px] font-black ${t.chipNavy}`}
                >
                  {cur} / {pages}
                </span>
                <button
                  onClick={() => setPage(cur + 1)}
                  disabled={cur >= pages}
                  className={`${btnBase} h-8 border-2 px-2.5 ${t.btnGhost}`}
                >
                  <FiChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}
