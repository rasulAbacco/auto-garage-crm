import React, { useEffect, useState, useMemo } from "react";
import {
  Copy,
  CheckCircle,
  Users,
  Trophy,
  Wallet,
  ArrowUpRight,
  Share2,
  Calendar,
  Clock,
  MessageCircle,
} from "lucide-react";
import axios from "axios";
import { useTheme } from "../contexts/ThemeContext";
import { tk, btnBase, PageHeading } from "./clients/components/clientUi";

const API_URL = import.meta.env.VITE_API_BASE_URL;

const fmtDate = (d) => {
  if (!d) return "—";
  const dt = new Date(d);
  return Number.isNaN(dt.getTime())
    ? "—"
    : dt.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
};
const inr = (v) => `₹${(Number(v) || 0).toLocaleString("en-IN")}`;

const Reference = () => {
  const { isDark } = useTheme();
  const t = tk(isDark);
  const [referralCode, setReferralCode] = useState("");
  const [referrals, setReferrals] = useState([]);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchReferralData();
  }, []);

  const fetchReferralData = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/api/referral/my-referrals`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setReferralCode(res.data.referralCode || "");
      setReferrals(Array.isArray(res.data.referrals) ? res.data.referrals : []);
    } catch (err) {
      console.error("Referral fetch error:", err);
      setError(err?.response?.data?.message || "Could not load your referrals");
    } finally {
      setLoading(false);
    }
  };

  const copyCode = async () => {
    if (!referralCode) return;
    try {
      await navigator.clipboard.writeText(referralCode);
    } catch {
      // fallback for older browsers / http
      const ta = document.createElement("textarea");
      ta.value = referralCode;
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
      } catch {
        /* ignore */
      }
      ta.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareText = `I run my garage on MotorDesk. Sign up with my code ${referralCode} — ${window.location.origin}`;
  const waLink = `https://wa.me/?text=${encodeURIComponent(shareText)}`;

  const stats = useMemo(() => {
    const paid = referrals.filter((r) => r.paidAt);
    return {
      count: referrals.length,
      paid: paid.length,
      earnings: referrals.reduce((acc, r) => acc + (Number(r.amount) || 0), 0),
    };
  }, [referrals]);

  const th =
    "whitespace-nowrap px-4 py-3 text-[12px] font-black uppercase tracking-wider text-slate-400";

  const StatusPill = ({ paid }) =>
    paid ? (
      <span className="inline-flex items-center gap-1 rounded-lg border border-green-500/30 bg-green-500/10 px-2 py-0.5 text-[12px] font-black uppercase tracking-wider text-green-600">
        <CheckCircle size={12} /> Paid
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[12px] font-black uppercase tracking-wider text-amber-600">
        <Clock size={12} /> Pending
      </span>
    );

  const Avatar = ({ name }) => (
    <div
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[14px] font-black ${t.chipNavy}`}
    >
      {(
        String(name || "?")
          .trim()
          .charAt(0) || "?"
      ).toUpperCase()}
    </div>
  );

  return (
    <div className="min-h-screen lg:ml-20">
      <div className="mx-auto max-w-[1600px] space-y-4 sm:space-y-5">
        <PageHeading
          isDark={isDark}
          title="Referral"
          accent="program."
          subtitle="Invite other garages and earn a reward when they subscribe."
        />

        {error && (
          <p className="rounded-xl border-2 border-red-500/30 bg-red-500/10 px-4 py-3 text-[14px] font-semibold text-red-500">
            {error}
          </p>
        )}

        <div className="grid gap-3 lg:grid-cols-3">
          {/* code card */}
          <section className="relative overflow-hidden rounded-2xl border-2 border-white/5 bg-gradient-to-br from-[#001F3F] to-[#000814] p-4 text-white shadow-2xl shadow-black/20 sm:p-5 lg:col-span-2">
            <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rotate-12 rounded-3xl border-2 border-white/5" />
            <div className="pointer-events-none absolute -bottom-12 right-24 h-32 w-32 rotate-45 rounded-3xl border-2 border-white/5" />

            <div className="relative space-y-4">
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[12px] font-black uppercase tracking-[0.2em]">
                <Share2 size={12} /> Your code
              </span>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="min-w-0">
                  <p className="break-all font-mono text-[16px] font-black tracking-[0.3em] sm:tracking-[0.4em]">
                    {loading ? "– – – – – –" : referralCode || "—"}
                  </p>
                  <p className="mt-1 max-w-md text-[14px] text-white/60">
                    Share it with other garage owners. You earn for every one
                    that subscribes.
                  </p>
                </div>
                <div className="grid shrink-0 grid-cols-2 gap-2 sm:flex">
                  <button
                    type="button"
                    onClick={copyCode}
                    disabled={!referralCode}
                    className={`${btnBase} h-10 bg-white px-4 text-[#001F3F] hover:bg-blue-50`}
                  >
                    {copied ? (
                      <CheckCircle size={14} className="text-green-600" />
                    ) : (
                      <Copy size={14} />
                    )}
                    {copied ? "Copied" : "Copy code"}
                  </button>
                  <a
                    href={referralCode ? waLink : undefined}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-disabled={!referralCode}
                    className={`${btnBase} h-10 border-2 border-white/15 px-4 text-white hover:bg-white/10 ${referralCode ? "" : "pointer-events-none opacity-50"}`}
                  >
                    <MessageCircle size={14} /> WhatsApp
                  </a>
                </div>
              </div>
            </div>
          </section>

          {/* stats */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
            {[
              {
                title: "Garages referred",
                value: `${stats.count}`,
                sub: `${stats.paid} subscribed`,
                icon: Users,
                chip: t.chipNavy,
              },
              {
                title: "Total earnings",
                value: inr(stats.earnings),
                sub: "From paid referrals",
                icon: Wallet,
                chip: "bg-green-500/10 text-green-600",
              },
            ].map(({ title, value, sub, icon: Icon, chip }) => (
              <div
                key={title}
                className={`rounded-2xl border-2 p-3 sm:p-4 ${t.card}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[12px] font-bold uppercase leading-tight tracking-wider text-slate-400">
                    {title}
                  </p>
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${chip}`}
                  >
                    <Icon size={14} />
                  </div>
                </div>
                <p
                  className={`mt-2 truncate text-[16px] font-black tracking-tight ${t.heading}`}
                >
                  {value}
                </p>
                <p className={`text-[12px] ${t.muted}`}>{sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* history */}
        <section className={`overflow-hidden rounded-2xl border-2 ${t.card}`}>
          <div
            className={`flex items-center gap-3 border-b-2 px-3 py-3 sm:px-4 ${t.cardHead}`}
          >
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-xl ${t.chipNavy}`}
            >
              <Trophy size={14} />
            </div>
            <h2
              className={`text-[14px] font-black uppercase tracking-tight ${t.heading}`}
            >
              Referral{" "}
              <span className="font-light lowercase italic">history</span>
            </h2>
          </div>

          {loading ? (
            <div className="space-y-2 p-3 sm:p-4">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className={`h-12 animate-pulse rounded-xl ${isDark ? "bg-white/5" : "bg-[#F8FAFC]"}`}
                />
              ))}
            </div>
          ) : referrals.length === 0 ? (
            <div className="flex flex-col items-center px-4 py-12 text-center">
              <div
                className={`mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border-2 text-slate-400 ${t.inner}`}
              >
                <Users size={20} />
              </div>
              <p
                className={`text-[14px] font-black uppercase tracking-tight ${t.heading}`}
              >
                No referrals yet
              </p>
              <p className={`mt-1 text-[14px] ${t.muted}`}>
                Share your code to get started.
              </p>
            </div>
          ) : (
            <>
              {/* desktop */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full border-collapse text-left">
                  <thead className={`border-b-2 ${t.cardHead}`}>
                    <tr>
                      <th className={th}>Garage</th>
                      <th className={th}>Plan</th>
                      <th className={`${th} text-right`}>Reward</th>
                      <th className={th}>Status</th>
                      <th className={th}>Joined</th>
                      <th className={th}>Paid on</th>
                    </tr>
                  </thead>
                  <tbody>
                    {referrals.map((u, idx) => (
                      <tr
                        key={u.id || u.email || idx}
                        className={`border-b last:border-0 ${t.line} ${isDark ? "hover:bg-white/5" : "hover:bg-[#F8FAFC]"}`}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar name={u.name} />
                            <div className="min-w-0">
                              <p
                                className={`truncate text-[14px] font-black ${t.heading}`}
                              >
                                {u.name || "—"}
                              </p>
                              <p className={`truncate text-[12px] ${t.muted}`}>
                                {u.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`whitespace-nowrap rounded-lg border px-2 py-0.5 text-[12px] font-bold ${t.inner} ${t.body}`}
                          >
                            {[u.plan, u.billing].filter(Boolean).join(" · ") ||
                              "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span
                            className={`inline-flex items-center gap-1 font-mono text-[14px] font-black ${isDark ? "text-green-400" : "text-green-700"}`}
                          >
                            {inr(u.amount)} <ArrowUpRight size={12} />
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <StatusPill paid={Boolean(u.paidAt)} />
                        </td>
                        <td
                          className={`whitespace-nowrap px-4 py-3 text-[14px] ${t.body}`}
                        >
                          {fmtDate(u.joiningDate)}
                        </td>
                        <td
                          className={`whitespace-nowrap px-4 py-3 text-[14px] ${t.body}`}
                        >
                          {u.paidAt ? (
                            <span className="inline-flex items-center gap-1.5">
                              <Calendar size={12} className="text-slate-400" />{" "}
                              {fmtDate(u.paidAt)}
                            </span>
                          ) : (
                            <span className={t.muted}>—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* phone */}
              <div className="space-y-2 p-3 md:hidden">
                {referrals.map((u, idx) => (
                  <div
                    key={u.id || u.email || idx}
                    className={`rounded-xl border-2 p-3 ${t.inner}`}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar name={u.name} />
                      <div className="min-w-0 flex-1">
                        <p
                          className={`truncate text-[14px] font-black ${t.heading}`}
                        >
                          {u.name || "—"}
                        </p>
                        <p className={`truncate text-[12px] ${t.muted}`}>
                          {[u.plan, u.billing].filter(Boolean).join(" · ")}
                        </p>
                      </div>
                      <span
                        className={`font-mono text-[14px] font-black ${isDark ? "text-green-400" : "text-green-700"}`}
                      >
                        {inr(u.amount)}
                      </span>
                    </div>
                    <div
                      className={`mt-2 flex items-center justify-between gap-2 border-t-2 pt-2 ${t.line}`}
                    >
                      <StatusPill paid={Boolean(u.paidAt)} />
                      <span className={`text-[12px] ${t.muted}`}>
                        Joined {fmtDate(u.joiningDate)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
};

export default Reference;
