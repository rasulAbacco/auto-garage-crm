// client/src/pages/reports/ReportsList.jsx  (recent invoices + services)
import React, { useState, useMemo } from "react";
import {
  FiFileText,
  FiTool,
  FiChevronRight,
  FiLoader,
  FiSearch,
  FiUser,
  FiTruck,
  FiCalendar,
} from "react-icons/fi";
import {
  Plate,
  Modal,
  tk,
  btnBase,
  fmtDate,
  statusClass,
} from "../clients/components/clientUi";

const money = (v) =>
  `₹${(Number(v) || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const STEP = 10;

export default function ReportsList({ invoices = [], services = [], isDark }) {
  const t = tk(isDark);
  const base = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001";

  const [q, setQ] = useState("");
  const [invLimit, setInvLimit] = useState(STEP);
  const [srvLimit, setSrvLimit] = useState(STEP);
  const [selected, setSelected] = useState(null);
  const [details, setDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [detailsError, setDetailsError] = useState("");

  const term = q.trim().toLowerCase();
  const match = (vals) =>
    !term ||
    vals.filter(Boolean).some((v) => String(v).toLowerCase().includes(term));

  const invList = useMemo(
    () =>
      [...invoices]
        .sort(
          (a, b) =>
            new Date(b.date || b.createdAt || 0) -
            new Date(a.date || a.createdAt || 0),
        )
        .filter((i) =>
          match([
            i.invoiceNumber,
            i.id,
            i.client?.fullName,
            i.client?.regNumber,
            i.status,
          ]),
        ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [invoices, term],
  );
  const srvList = useMemo(
    () =>
      [...services]
        .sort(
          (a, b) =>
            new Date(b.date || b.serviceInDate || 0) -
            new Date(a.date || a.serviceInDate || 0),
        )
        .filter((s) =>
          match([s.type, s.client?.fullName, s.client?.regNumber, s.status]),
        ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [services, term],
  );

  const openInvoice = async (inv) => {
    setSelected(inv);
    setDetails(null);
    setDetailsError("");
    setLoadingDetails(true);
    try {
      const res = await fetch(`${base}/api/reports/invoice/${inv.id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok)
        throw new Error(data.message || "Couldn't load invoice details");
      setDetails(data);
    } catch (e) {
      setDetailsError(e.message);
    } finally {
      setLoadingDetails(false);
    }
  };

  const close = () => {
    setSelected(null);
    setDetails(null);
  };
  const d = details || {};
  const cl = d.client || selected?.client || {};

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="relative">
        <FiSearch
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          size={16}
        />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search invoice no, client, reg number, status…"
          className={`h-11 w-full rounded-xl border-2 pl-10 pr-3 text-[14px] font-semibold outline-none transition ${t.input}`}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:gap-5 xl:grid-cols-2">
        {/* invoices */}
        <ListCard
          isDark={isDark}
          icon={FiFileText}
          title="Recent invoices"
          subtitle="Tap an invoice for details"
          count={invList.length}
        >
          {invList.length === 0 ? (
            <Empty
              isDark={isDark}
              text={term ? "No invoices match your search" : "No invoices yet"}
            />
          ) : (
            <>
              <div className="space-y-2">
                {invList.slice(0, invLimit).map((inv) => (
                  <button
                    key={inv.id}
                    onClick={() => openInvoice(inv)}
                    className={`flex w-full items-center gap-3 rounded-xl border-2 p-3 text-left transition ${t.inner} ${t.hoverRow}`}
                  >
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${t.chipNavy}`}
                    >
                      <FiFileText size={14} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p
                        className={`truncate font-mono text-[14px] font-bold ${t.heading}`}
                      >
                        {inv.invoiceNumber || `#${inv.id}`}
                      </p>
                      <p className={`truncate text-[12px] ${t.muted}`}>
                        {inv.client?.fullName || `Client #${inv.clientId}`} ·{" "}
                        {fmtDate(inv.date || inv.createdAt)}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className={`text-[14px] font-black ${t.heading}`}>
                        {money(inv.grandTotal)}
                      </p>
                      <span
                        className={`rounded-full border px-2 py-px text-[12px] font-bold ${statusClass(inv.status)}`}
                      >
                        {inv.status || "—"}
                      </span>
                    </div>
                    <FiChevronRight
                      size={14}
                      className="shrink-0 text-slate-400"
                    />
                  </button>
                ))}
              </div>
              {invList.length > invLimit && (
                <button
                  onClick={() => setInvLimit((n) => n + STEP)}
                  className={`${btnBase} mt-3 h-9 w-full border-2 ${t.btnGhost}`}
                >
                  Show more ({invList.length - invLimit} left)
                </button>
              )}
            </>
          )}
        </ListCard>

        {/* services */}
        <ListCard
          isDark={isDark}
          icon={FiTool}
          title="Recent services"
          subtitle="Latest jobs"
          count={srvList.length}
        >
          {srvList.length === 0 ? (
            <Empty
              isDark={isDark}
              text={term ? "No services match your search" : "No services yet"}
            />
          ) : (
            <>
              <div className="space-y-2">
                {srvList.slice(0, srvLimit).map((srv) => (
                  <div
                    key={srv.id}
                    className={`flex items-center gap-3 rounded-xl border-2 p-3 ${t.inner}`}
                  >
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${t.chipNavy}`}
                    >
                      <FiTool size={14} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p
                        className={`truncate text-[14px] font-bold ${t.heading}`}
                      >
                        {srv.type || "Service"}
                      </p>
                      <div
                        className={`flex flex-wrap items-center gap-x-2 text-[12px] ${t.muted}`}
                      >
                        <span className="truncate">
                          {srv.client?.fullName || "No client"}
                        </span>
                        {srv.client?.regNumber && (
                          <Plate value={srv.client.regNumber} size="sm" />
                        )}
                        <span>{fmtDate(srv.date || srv.serviceInDate)}</span>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className={`text-[14px] font-black ${t.heading}`}>
                        {money(srv.cost)}
                      </p>
                      <span
                        className={`rounded-full border px-2 py-px text-[12px] font-bold ${statusClass(srv.status)}`}
                      >
                        {srv.status || "—"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              {srvList.length > srvLimit && (
                <button
                  onClick={() => setSrvLimit((n) => n + STEP)}
                  className={`${btnBase} mt-3 h-9 w-full border-2 ${t.btnGhost}`}
                >
                  Show more ({srvList.length - srvLimit} left)
                </button>
              )}
            </>
          )}
        </ListCard>
      </div>

      {/* invoice details */}
      <Modal
        isDark={isDark}
        open={!!selected}
        onClose={close}
        icon={FiFileText}
        title={`Invoice ${d.invoiceNumber || selected?.invoiceNumber || `#${selected?.id || ""}`}`}
        subtitle={d.status || selected?.status}
        maxW="max-w-3xl"
      >
        {loadingDetails ? (
          <div className="flex items-center justify-center gap-2 py-16">
            <FiLoader className={`animate-spin ${t.heading}`} size={16} />
            <span className={`text-[14px] ${t.muted}`}>Loading details…</span>
          </div>
        ) : detailsError ? (
          <p className="m-4 rounded-xl border-2 border-red-500/30 bg-red-500/10 p-4 text-[14px] font-semibold text-red-500">
            {detailsError}
          </p>
        ) : (
          details && (
            <div className="space-y-4 p-4 sm:p-5">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                <KV
                  isDark={isDark}
                  icon={FiCalendar}
                  label="Issued"
                  value={
                    d.issuedAt || d.createdAt
                      ? fmtDate(d.issuedAt || d.createdAt)
                      : "—"
                  }
                />
                <KV
                  isDark={isDark}
                  icon={FiCalendar}
                  label="Due"
                  value={d.dueDate ? fmtDate(d.dueDate) : "—"}
                />
                <div
                  className={`col-span-2 rounded-xl border-2 p-3 sm:col-span-1 ${t.inner}`}
                >
                  <p className="text-[12px] font-bold uppercase tracking-wider text-slate-400">
                    Status
                  </p>
                  <span
                    className={`mt-1 inline-block rounded-full border px-2.5 py-0.5 text-[12px] font-bold ${statusClass(d.status)}`}
                  >
                    {d.status || "—"}
                  </span>
                </div>
              </div>

              <Group isDark={isDark} icon={FiUser} title="Client">
                <KV isDark={isDark} label="Name" value={cl.fullName} />
                <KV isDark={isDark} label="Phone" value={cl.phone} />
                <KV isDark={isDark} label="Email" value={cl.email} />
                <KV isDark={isDark} label="Address" value={cl.address} />
              </Group>

              <Group isDark={isDark} icon={FiTruck} title="Vehicle">
                <KV
                  isDark={isDark}
                  label="Make / model"
                  value={[cl.vehicleMake, cl.vehicleModel]
                    .filter(Boolean)
                    .join(" ")}
                />
                <KV isDark={isDark} label="Year" value={cl.vehicleYear} />
                <div className={`rounded-xl border-2 p-3 ${t.inner}`}>
                  <p className="text-[12px] font-bold uppercase tracking-wider text-slate-400">
                    Reg no
                  </p>
                  <div className="mt-1">
                    {cl.regNumber ? (
                      <Plate value={cl.regNumber} size="sm" />
                    ) : (
                      <span className={t.muted}>—</span>
                    )}
                  </div>
                </div>
                <KV isDark={isDark} label="VIN" value={cl.vin} mono />
              </Group>

              <div>
                <SectionTitle isDark={isDark} icon={FiTool} title="Services" />
                {!d.services?.length ? (
                  <Empty
                    isDark={isDark}
                    text="No services linked to this invoice"
                  />
                ) : (
                  <div className="space-y-2">
                    {d.services.map((srv) => (
                      <div
                        key={srv.id}
                        className={`rounded-xl border-2 p-3 ${t.inner}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-[14px] font-bold ${t.heading}`}>
                            {srv.type || "Service"}
                          </p>
                          <p
                            className={`shrink-0 text-[14px] font-black ${t.heading}`}
                          >
                            {money(srv.cost)}
                          </p>
                        </div>
                        {srv.description && (
                          <p className={`mt-1 text-[12px] ${t.body}`}>
                            {srv.description}
                          </p>
                        )}
                        <div className="mt-1.5 flex items-center gap-2 text-[12px]">
                          <span className={t.muted}>{fmtDate(srv.date)}</span>
                          <span
                            className={`rounded-full border px-2 py-px font-bold ${statusClass(srv.status)}`}
                          >
                            {srv.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className={`space-y-1.5 rounded-xl border-2 p-3 ${t.inner}`}>
                {[
                  ["Subtotal", d.totalAmount],
                  ["Tax", d.tax],
                  ["Discount", d.discount],
                ].map(([l, v]) => (
                  <div key={l} className="flex justify-between text-[14px]">
                    <span className={t.muted}>{l}</span>
                    <span className={`font-bold ${t.heading}`}>{money(v)}</span>
                  </div>
                ))}
                <div
                  className={`flex items-end justify-between border-t-2 pt-2 ${t.line}`}
                >
                  <span className="text-[12px] font-black uppercase tracking-[0.2em] text-slate-400">
                    Grand total
                  </span>
                  <span className={`text-[16px] font-black ${t.heading}`}>
                    {money(d.grandTotal)}
                  </span>
                </div>
              </div>
            </div>
          )
        )}
      </Modal>
    </div>
  );
}

/* ───────── pieces ───────── */

function ListCard({ isDark, icon: Icon, title, subtitle, count, children }) {
  const t = tk(isDark);
  return (
    <section className={`overflow-hidden rounded-2xl border-2 ${t.card}`}>
      <div
        className={`flex items-center gap-3 border-b-2 px-4 py-3 ${t.cardHead}`}
      >
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${t.chipNavy}`}
        >
          <Icon size={14} />
        </div>
        <div className="min-w-0 flex-1">
          <h3
            className={`truncate text-[14px] font-black uppercase tracking-tight ${t.heading}`}
          >
            {title}
          </h3>
          <p className={`truncate text-[12px] ${t.muted}`}>{subtitle}</p>
        </div>
        <span
          className={`rounded-md border px-2 py-0.5 text-[12px] font-black ${t.inner} ${t.heading}`}
        >
          {count}
        </span>
      </div>
      <div className="p-3">{children}</div>
    </section>
  );
}

function SectionTitle({ isDark, icon: Icon, title }) {
  const t = tk(isDark);
  return (
    <div className="mb-2 flex items-center gap-2">
      <Icon size={12} className={t.heading} />
      <h4
        className={`text-[12px] font-black uppercase tracking-[0.2em] ${t.heading}`}
      >
        {title}
      </h4>
      <div
        className={`h-px flex-1 ${isDark ? "bg-white/10" : "bg-[#CBD5E1]"}`}
      />
    </div>
  );
}

function Group({ isDark, icon, title, children }) {
  return (
    <div>
      <SectionTitle isDark={isDark} icon={icon} title={title} />
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">{children}</div>
    </div>
  );
}

function KV({ isDark, icon: Icon, label, value, mono }) {
  const t = tk(isDark);
  return (
    <div className={`rounded-xl border-2 p-3 ${t.inner}`}>
      <p className="flex items-center gap-1 text-[12px] font-bold uppercase tracking-wider text-slate-400">
        {Icon && <Icon size={12} />} {label}
      </p>
      <p
        className={`mt-0.5 break-words text-[14px] font-bold ${t.heading} ${mono ? "font-mono" : ""}`}
      >
        {value || "—"}
      </p>
    </div>
  );
}

function Empty({ isDark, text }) {
  const t = tk(isDark);
  return (
    <p
      className={`rounded-xl border-2 border-dashed py-8 text-center text-[14px] ${t.inner} ${t.muted}`}
    >
      {text}
    </p>
  );
}
