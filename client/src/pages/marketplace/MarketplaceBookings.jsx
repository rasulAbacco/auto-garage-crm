import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useTheme } from "../../contexts/ThemeContext";
import { useBookingPopup } from "../../providers/BookingPopupProvider";
import {
  FiCheck,
  FiX,
  FiClock,
  FiCalendar,
  FiUser,
  FiRefreshCw,
  FiLayers,
  FiPhone,
  FiTruck,
  FiMapPin,
  FiFileText,
  FiInbox,
  FiPackage,
  FiTrendingUp,
} from "react-icons/fi";
import {
  tk,
  btnBase,
  PageHeading,
  ConfirmDialog,
  CrmChip,
  StatTile,
  ErrorBar,
  EmptyState,
  SkeletonCards,
  detectCrmType,
  pageWrap,
  inr,
  errText,
} from "./marketplaceUi";

const API_URL = import.meta.env.VITE_API_BASE_URL ?? "";

// Wording per business type
const STATS_VOCABULARY = {
  CAR: { primary: "Total bookings", queue: "Waiting for you" },
  BIKE: { primary: "Rider bookings", queue: "Waiting for you" },
  WASHING: { primary: "Wash bookings", queue: "Waiting for you" },
};

const FILTERS = [
  { key: "ALL", label: "All" },
  { key: "PENDING", label: "Pending" },
  { key: "ACCEPTED", label: "Accepted" },
  { key: "CLOSED", label: "Missed / rejected" },
];

const isAccepted = (s) => s === "ACCEPTED" || s === "CONFIRMED";
const matches = (b, f) =>
  f === "ALL" ||
  (f === "PENDING" && b.status === "PENDING") ||
  (f === "ACCEPTED" && isAccepted(b.status)) ||
  (f === "CLOSED" && (b.status === "REJECTED" || b.status === "TIMEOUT"));

const na = (v) =>
  v === null || v === undefined || v === "" ? "Not available" : v;

const vehicleLabel = (b) => {
  let label = [b.vehicleMake, b.vehicleModel].filter(Boolean).join(" ");
  if (b.vehicleYear)
    label += label ? ` (${b.vehicleYear})` : `(${b.vehicleYear})`;
  return label || "Not available";
};

const fmtWhen = (d) => {
  const dt = d ? new Date(d) : null;
  if (!dt || Number.isNaN(dt.getTime())) return "Not scheduled";
  return dt.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const STATUS = {
  PENDING: {
    cls: "border-amber-500/30 bg-amber-500/10 text-amber-600",
    label: "Pending",
    icon: FiClock,
  },
  ACCEPTED: {
    cls: "border-green-500/30 bg-green-500/10 text-green-600",
    label: "Accepted",
    icon: FiCheck,
  },
  CONFIRMED: {
    cls: "border-green-500/30 bg-green-500/10 text-green-600",
    label: "Confirmed",
    icon: FiCheck,
  },
  TIMEOUT: {
    cls: "border-orange-500/30 bg-orange-500/10 text-orange-500",
    label: "Missed",
    icon: FiClock,
  },
  REJECTED: {
    cls: "border-red-500/30 bg-red-500/10 text-red-500",
    label: "Rejected",
    icon: FiX,
  },
};
const statusMeta = (s) =>
  STATUS[s] || {
    cls: "border-slate-500/30 bg-slate-500/10 text-slate-500",
    label: s || "Unknown",
    icon: FiClock,
  };

export default function MarketplaceDashboard() {
  const { isDark } = useTheme();
  const t = tk(isDark);
  const { onBookingAction } = useBookingPopup();

  const currentCrmType = useMemo(() => detectCrmType(), []);
  const labels = STATS_VOCABULARY[currentCrmType] || STATS_VOCABULARY.CAR;

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [actionError, setActionError] = useState(null);
  const [actioningId, setActioningId] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);

  const fetchBookings = useCallback(
    async (quiet = false) => {
      quiet ? setRefreshing(true) : setLoading(true);
      setLoadError("");
      try {
        const res = await axios.get(`${API_URL}/api/marketplace/bookings`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          params: { vehicleType: currentCrmType.toLowerCase() },
        });
        setBookings(Array.isArray(res.data?.data) ? res.data.data : []);
      } catch (err) {
        console.error("Bookings load failed:", err);
        setLoadError(errText(err, "Could not load bookings"));
        if (!quiet) setBookings([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [currentCrmType],
  );

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // refresh when a booking is accepted / rejected from the live popup
  useEffect(() => {
    const unsubscribe = onBookingAction(() => fetchBookings(true));
    return unsubscribe;
  }, [onBookingAction, fetchBookings]);

  const handleAction = async (id, type) => {
    setActionError(null);
    setActioningId(id);
    try {
      await axios.post(
        `${API_URL}/api/marketplace/booking/${id}/${type}`,
        {},
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      );
      setRejectTarget(null);
      fetchBookings(true);
    } catch (e) {
      const serverMessage = e?.response?.data?.message;
      console.error("Action rejected:", serverMessage || e.message, e);
      setActionError(
        `Booking #${id}: ${serverMessage || e.message || "Action failed"}`,
      );
      setRejectTarget(null);
      // status may still have changed on the server (e.g. "already processed")
      fetchBookings(true);
    } finally {
      setActioningId(null);
    }
  };

  const filteredBookings = useMemo(
    () => bookings.filter((b) => matches(b, filter)),
    [bookings, filter],
  );
  const counts = useMemo(
    () =>
      Object.fromEntries(
        FILTERS.map((f) => [
          f.key,
          bookings.filter((b) => matches(b, f.key)).length,
        ]),
      ),
    [bookings],
  );

  const stats = useMemo(
    () => ({
      total: bookings.length,
      pending: bookings.filter((b) => b.status === "PENDING").length,
      accepted: bookings.filter((b) => isAccepted(b.status)).length,
      revenue: bookings
        .filter((b) => isAccepted(b.status))
        .reduce((acc, b) => acc + (Number(b.price) || 0), 0),
    }),
    [bookings],
  );

  const Meta = ({ icon: Icon, children, href }) => (
    <span
      className={`flex min-w-0 items-center gap-1.5 text-[12px] font-semibold ${t.body}`}
    >
      <Icon size={12} className="shrink-0 text-slate-400" />
      {href ? (
        <a
          href={href}
          className={`truncate font-bold hover:underline ${t.heading}`}
        >
          {children}
        </a>
      ) : (
        <span className="truncate">{children}</span>
      )}
    </span>
  );

  return (
    <div className={pageWrap(currentCrmType)}>
      <div className="mx-auto max-w-[1600px] space-y-4 sm:space-y-5">
        <PageHeading
          isDark={isDark}
          title="Marketplace"
          accent="bookings."
          subtitle="Bookings from the MotorDesk app. Accept them fast before they time out."
          right={
            <>
              <CrmChip crmType={currentCrmType} isDark={isDark} />
              <button
                type="button"
                onClick={() => fetchBookings(true)}
                aria-label="Refresh"
                title="Refresh"
                className={`${btnBase} h-10 w-10 border-2 ${t.btnGhost}`}
              >
                <FiRefreshCw
                  size={14}
                  className={refreshing ? "animate-spin" : ""}
                />
              </button>
            </>
          }
        />

        {/* stats */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatTile
            isDark={isDark}
            title={labels.primary}
            value={stats.total}
            icon={FiLayers}
            onClick={() => setFilter("ALL")}
            active={filter === "ALL"}
          />
          <StatTile
            isDark={isDark}
            title={labels.queue}
            value={stats.pending}
            icon={FiClock}
            chip="bg-amber-500/10 text-amber-600"
            onClick={() => setFilter("PENDING")}
            active={filter === "PENDING"}
          />
          <StatTile
            isDark={isDark}
            title="Accepted"
            value={stats.accepted}
            icon={FiCheck}
            chip="bg-green-500/10 text-green-600"
            onClick={() => setFilter("ACCEPTED")}
            active={filter === "ACCEPTED"}
          />
          <StatTile
            isDark={isDark}
            title="Marketplace earnings"
            value={inr(stats.revenue)}
            icon={FiTrendingUp}
            chip="bg-blue-500/10 text-blue-500"
          />
        </div>

        <ErrorBar
          message={actionError}
          onDismiss={() => setActionError(null)}
        />
        <ErrorBar message={loadError} onRetry={() => fetchBookings()} />

        {/* filter chips */}
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-0.5">
          {FILTERS.map((f) => {
            const on = filter === f.key;
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={`flex h-8 shrink-0 items-center gap-1.5 rounded-lg border-2 px-3 text-[12px] font-black uppercase tracking-wider transition ${
                  on
                    ? isDark
                      ? "border-white bg-white text-[#001F3F]"
                      : "border-[#001F3F] bg-[#001F3F] text-white"
                    : t.btnGhost
                }`}
              >
                {f.label}
                <span
                  className={`rounded px-1 ${on ? (isDark ? "bg-[#001F3F]/10" : "bg-white/20") : isDark ? "bg-white/10" : "bg-slate-100"}`}
                >
                  {counts[f.key] ?? 0}
                </span>
              </button>
            );
          })}
        </div>

        {/* list */}
        {loading ? (
          <SkeletonCards isDark={isDark} rows={3} h="h-36" />
        ) : filteredBookings.length === 0 ? (
          <EmptyState
            isDark={isDark}
            icon={FiInbox}
            title={bookings.length ? "Nothing in this view" : "No bookings yet"}
            text={
              bookings.length
                ? "Try another filter."
                : "New bookings from the MotorDesk app will show up here."
            }
          />
        ) : (
          <div className="space-y-3">
            {filteredBookings.map((b) => {
              const st = statusMeta(b.status);
              const StIcon = st.icon;
              const busy = actioningId === b.id;
              const services = String(b.serviceName || "")
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean);

              return (
                <article
                  key={b.id}
                  className={`overflow-hidden rounded-2xl border-2 ${t.card}`}
                >
                  <div className="flex flex-col lg:flex-row">
                    {/* info */}
                    <div className="min-w-0 flex-1 space-y-3 p-3 sm:p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-lg px-2 py-0.5 font-mono text-[12px] font-black tracking-wider ${t.chipNavy}`}
                        >
                          #{String(b.id).slice(-4)}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[12px] font-black uppercase tracking-wider ${st.cls}`}
                        >
                          <StIcon size={12} /> {st.label}
                        </span>
                        <span
                          className={`ml-auto flex items-center gap-1.5 text-[12px] font-bold ${t.heading}`}
                        >
                          <FiCalendar size={12} className="text-slate-400" />{" "}
                          {fmtWhen(b.scheduledAt)}
                        </span>
                      </div>

                      {services.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {services.map((svc, i) => (
                            <span
                              key={i}
                              className={`rounded-lg border px-2 py-1 text-[12px] font-bold ${t.inner} ${t.heading}`}
                            >
                              {svc}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="grid grid-cols-1 gap-x-4 gap-y-1.5 sm:grid-cols-2 xl:grid-cols-4">
                        <Meta icon={FiUser}>{na(b.clientName)}</Meta>
                        <Meta
                          icon={FiPhone}
                          href={
                            b.clientPhone ? `tel:${b.clientPhone}` : undefined
                          }
                        >
                          {na(b.clientPhone)}
                        </Meta>
                        <Meta icon={FiTruck}>{vehicleLabel(b)}</Meta>
                        <span className="flex flex-wrap items-center gap-1.5">
                          {b.vehicleRegNumber ? (
                            <span className="inline-flex items-center rounded-md border-2 border-[#001F3F] bg-white px-1.5 py-px font-mono text-[12px] font-black uppercase tracking-wider text-[#001F3F]">
                              {b.vehicleRegNumber}
                            </span>
                          ) : (
                            <span className={`text-[12px] ${t.muted}`}>
                              Reg: not available
                            </span>
                          )}
                          {b.carType && (
                            <span
                              className={`rounded-md border px-1.5 py-px text-[12px] font-bold uppercase ${t.inner} ${t.muted}`}
                            >
                              {String(b.carType).replace(/_/g, " ")}
                            </span>
                          )}
                        </span>
                      </div>

                      {(b.packageName || b.notes || b.pickupRequired) && (
                        <div
                          className={`space-y-1.5 rounded-xl border-2 p-2.5 ${t.inner}`}
                        >
                          {b.packageName && (
                            <Meta icon={FiPackage}>
                              Package: {b.packageName}
                            </Meta>
                          )}
                          {b.notes && (
                            <p
                              className={`flex items-start gap-1.5 text-[12px] font-semibold ${t.body}`}
                            >
                              <FiFileText
                                size={12}
                                className="mt-0.5 shrink-0 text-slate-400"
                              />
                              <span className="break-words">
                                Note: {b.notes}
                              </span>
                            </p>
                          )}
                          {b.pickupRequired && (
                            <p
                              className={`flex items-start gap-1.5 text-[12px] font-semibold ${t.body}`}
                            >
                              <FiMapPin
                                size={12}
                                className="mt-0.5 shrink-0 text-red-500"
                              />
                              <span className="break-words">
                                Pickup: {na(b.pickupAddress)} → Drop:{" "}
                                {na(b.dropAddress)}
                              </span>
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* value + actions */}
                    <div
                      className={`flex items-center justify-between gap-3 border-t-2 p-3 sm:p-4 lg:w-60 lg:flex-col lg:items-stretch lg:justify-center lg:border-l-2 lg:border-t-0 ${t.line} ${t.cardHead}`}
                    >
                      <div className="lg:text-center">
                        <p className="text-[12px] font-bold uppercase tracking-wider text-slate-400">
                          Booking value
                        </p>
                        <p
                          className={`font-mono text-[16px] font-black ${t.heading}`}
                        >
                          {inr(b.price)}
                        </p>
                      </div>

                      {b.status === "PENDING" ? (
                        <div className="flex gap-2 lg:w-full">
                          <button
                            type="button"
                            onClick={() => setRejectTarget(b)}
                            disabled={busy}
                            aria-label="Reject booking"
                            title="Reject"
                            className={`${btnBase} h-10 w-10 shrink-0 border-2 ${
                              isDark
                                ? "border-red-500/30 text-red-400 hover:bg-red-500/10"
                                : "border-red-200 text-red-600 hover:bg-red-50"
                            }`}
                          >
                            <FiX size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAction(b.id, "accept")}
                            disabled={busy}
                            className={`${btnBase} h-10 flex-1 px-5 shadow-lg ${t.btnPrimary}`}
                          >
                            {busy ? (
                              <FiRefreshCw size={14} className="animate-spin" />
                            ) : (
                              <FiCheck size={14} />
                            )}
                            {busy ? "Working…" : "Accept"}
                          </button>
                        </div>
                      ) : (
                        <span
                          className={`inline-flex h-10 items-center justify-center rounded-xl border-2 px-4 text-[12px] font-black uppercase tracking-wider ${st.cls}`}
                        >
                          {st.label}
                        </span>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      <ConfirmDialog
        isDark={isDark}
        open={Boolean(rejectTarget)}
        title="Reject booking?"
        message={
          rejectTarget
            ? `${na(rejectTarget.clientName)} · ${inr(rejectTarget.price)}. This can't be undone.`
            : ""
        }
        confirmText="Reject"
        busy={Boolean(rejectTarget && actioningId === rejectTarget.id)}
        onConfirm={() => handleAction(rejectTarget.id, "reject")}
        onCancel={() => !actioningId && setRejectTarget(null)}
      />
    </div>
  );
}
