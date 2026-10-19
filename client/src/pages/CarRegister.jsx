// CarRegister.jsx
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import {
  User,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Shield,
  Mail,
  Phone,
  AlertCircle,
  Loader2,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Truck,
  Car,
  KeyRound,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_BASE_URL;
const LOGO_SRC = "/Logos/transLogo.png"; // client/public/Logos/transLogo.png

/* ---------- logo on a white tile ---------- */
function BrandLogo({ compact = false }) {
  const [failed, setFailed] = useState(false);
  return (
    <span
      className={`inline-flex items-center justify-center rounded-xl bg-white shadow-lg shadow-black/20 ${compact ? "h-10 px-2.5" : "h-14 px-3.5"}`}
    >
      {failed ? (
        <span className="text-[16px] font-black uppercase tracking-tight text-[#001F3F]">
          Motor<span className="font-light lowercase italic">desk</span>
        </span>
      ) : (
        <img
          src={LOGO_SRC}
          alt="MotorDesk"
          draggable="false"
          onError={() => setFailed(true)}
          className={`w-auto object-contain ${compact ? "h-7 max-w-[130px]" : "h-10 max-w-[180px]"}`}
        />
      )}
    </span>
  );
}

/* ---------- square switch ---------- */
const Switch = ({ on }) => (
  <span
    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-lg border-2 transition-colors ${
      on ? "border-[#001F3F] bg-[#001F3F]" : "border-[#CBD5E1] bg-[#E2E8F0]"
    }`}
  >
    <span
      className={`absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-md bg-white shadow transition-all ${on ? "left-[22px]" : "left-0.5"}`}
    />
  </span>
);

const passwordHint = (p) => {
  if (!p) return null;
  if (p.length < 6)
    return {
      text: "Too short – use at least 6 characters",
      cls: "text-red-500",
    };
  const strong = p.length >= 8 && /[A-Z]/.test(p) && /[0-9]/.test(p);
  return strong
    ? { text: "Strong password", cls: "text-green-600" }
    : {
        text: "OK – add a capital letter and a number to make it stronger",
        cls: "text-amber-600",
      };
};

const CarRegister = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const paymentData = location.state?.paymentData;
  const doneRef = useRef(false); // stops the "leave page?" warnings once registration succeeds

  const [formData, setFormData] = useState({
    userId: paymentData?.userId, // REQUIRED
    username: paymentData?.formData?.name || "",
    email: paymentData?.formData?.email || "",
    phone: paymentData?.formData?.phone || "",
    password: "",
    role: "user",
    crmType: "CAR",
    pickupDrop: false,
    towingService: false,
  });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null); // { type: "success" | "error", text }
  const [showPassword, setShowPassword] = useState(false);
  const [showBackWarning, setShowBackWarning] = useState(false);

  // Redirect if no payment data
  useEffect(() => {
    if (!paymentData) navigate("/");
  }, [paymentData, navigate]);

  // Block browser back button until registration is complete
  useEffect(() => {
    let timer;
    const handlePopState = () => {
      if (doneRef.current) return;
      window.history.pushState(null, "", window.location.href);
      setShowBackWarning(true);
      clearTimeout(timer);
      timer = setTimeout(() => setShowBackWarning(false), 4000);
    };
    window.history.pushState(null, "", window.location.href);
    window.addEventListener("popstate", handlePopState);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  // Warn before closing / reloading the tab
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (doneRef.current) return undefined;
      e.preventDefault();
      e.returnValue =
        "You haven't completed your registration. Are you sure you want to leave?";
      return e.returnValue;
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  const set = (patch) => {
    setFormData((prev) => ({ ...prev, ...patch }));
    if (status?.type === "error") setStatus(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.username.trim())
      return setStatus({ type: "error", text: "Please enter a username." });
    if (formData.password.length < 6)
      return setStatus({
        type: "error",
        text: "Password must be at least 6 characters.",
      });

    setLoading(true);
    setStatus(null);
    try {
      await axios.post(`${API_URL}/api/auth/register`, {
        ...formData,
        username: formData.username.trim(),
      });
      doneRef.current = true;
      setStatus({
        type: "success",
        text: "Account created! Taking you to sign in…",
      });
      setTimeout(() => navigate("/login"), 1500);
    } catch (error) {
      setStatus({
        type: "error",
        text:
          error.response?.data?.message || "Registration failed. Try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!paymentData) return null;

  const hint = passwordHint(formData.password);
  const done = status?.type === "success";
  const inputCls =
    "h-11 w-full rounded-xl border-2 border-[#CBD5E1] bg-[#F8FAFC] pl-10 pr-3 text-[14px] font-semibold text-[#001F3F] placeholder-slate-400 outline-none transition focus:border-[#001F3F] focus:bg-white";
  const lockedCls =
    "h-11 w-full cursor-not-allowed select-none rounded-xl border-2 border-[#E2E8F0] bg-[#E2E8F0]/60 pl-10 pr-3 text-[14px] font-semibold text-slate-500";
  const label =
    "mb-1.5 flex items-center justify-between gap-2 text-[12px] font-bold uppercase tracking-wider text-[#001F3F]";

  const steps = [
    {
      title: "Payment received",
      text: "Your plan is paid and ready.",
      state: "done",
    },
    {
      title: "Create your login",
      text: "Set a username and password.",
      state: done ? "done" : "now",
    },
    {
      title: "Start using MotorDesk",
      text: "Sign in and add your first job.",
      state: done ? "now" : "next",
    },
  ];

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] text-[#001F3F]">
      {/* back-button warning */}
      {showBackWarning && (
        <div className="fixed left-1/2 top-4 z-50 w-[calc(100%-32px)] max-w-sm -translate-x-1/2">
          <div className="flex items-center gap-3 rounded-xl border-2 border-red-500/30 bg-white px-4 py-3 shadow-2xl">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-500/10 text-red-500">
              <XCircle size={16} />
            </span>
            <div>
              <p className="text-[14px] font-black text-red-600">
                Please finish first
              </p>
              <p className="text-[12px] text-slate-500">
                Create your login before leaving this page.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ---------- left navy panel (desktop) ---------- */}
      <aside className="relative hidden w-[44%] max-w-[620px] flex-col justify-between overflow-hidden bg-gradient-to-br from-[#001F3F] to-[#000814] p-10 text-white lg:flex">
        <div className="pointer-events-none absolute -right-24 top-24 h-72 w-72 rotate-12 rounded-[48px] border-2 border-white/5" />
        <div className="pointer-events-none absolute -bottom-20 left-16 h-56 w-56 rotate-45 rounded-[40px] border-2 border-white/5" />

        <div className="relative">
          <BrandLogo />
        </div>

        <div className="relative space-y-6">
          <span className="inline-flex items-center gap-2 rounded-lg border border-green-400/30 bg-green-400/10 px-2.5 py-1 text-[12px] font-black uppercase tracking-[0.2em] text-green-300">
            <CheckCircle size={12} /> Payment confirmed
          </span>
          <h1 className="text-[16px] font-black uppercase leading-snug tracking-tight">
            One last step{" "}
            <span className="block font-light lowercase italic">
              to open your garage desk.
            </span>
          </h1>
          <p className="max-w-sm text-[14px] text-white/60">
            Create the owner login for your car garage. You'll use it to sign in
            every day.
          </p>

          <ol className="space-y-2.5">
            {steps.map((s, i) => (
              <li
                key={s.title}
                className={`flex items-start gap-3 rounded-xl border-2 p-3 ${s.state === "now" ? "border-white/40 bg-white/10" : "border-white/5 bg-white/[0.03]"}`}
              >
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[12px] font-black ${
                    s.state === "done"
                      ? "bg-green-500 text-white"
                      : s.state === "now"
                        ? "bg-white text-[#001F3F]"
                        : "bg-white/10 text-white/50"
                  }`}
                >
                  {s.state === "done" ? <CheckCircle size={14} /> : i + 1}
                </span>
                <span>
                  <span
                    className={`block text-[14px] font-black ${s.state === "next" ? "text-white/50" : ""}`}
                  >
                    {s.title}
                  </span>
                  <span className="block text-[12px] text-white/50">
                    {s.text}
                  </span>
                </span>
              </li>
            ))}
          </ol>
        </div>

        <p className="relative flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-[0.2em] text-white/40">
          <Shield size={12} /> Secure, encrypted setup
        </p>
      </aside>

      {/* ---------- right: form ---------- */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between gap-3 border-b-2 border-[#CBD5E1] bg-white px-4 sm:px-6 lg:bg-transparent">
          <span className="lg:hidden">
            <BrandLogo compact />
          </span>
          <span className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-[#CBD5E1] bg-white px-2.5 py-1 text-[12px] font-black uppercase tracking-[0.15em]">
            <Car size={12} /> Car garage setup
          </span>
        </header>

        <main className="flex flex-1 items-center justify-center px-4 py-6 sm:px-6 sm:py-10">
          <div className="w-full max-w-md space-y-4">
            {/* phone: payment notice */}
            <div className="flex items-start gap-3 rounded-xl border-2 border-amber-500/30 bg-amber-500/10 p-3 lg:hidden">
              <AlertTriangle
                size={16}
                className="mt-0.5 shrink-0 text-amber-600"
              />
              <div>
                <p className="text-[14px] font-black">
                  Payment confirmed – finish setup
                </p>
                <p className="text-[12px] text-slate-600">
                  Create your login below. Don't close this page until you're
                  done.
                </p>
              </div>
            </div>

            <section className="rounded-2xl border-2 border-[#CBD5E1] bg-white p-5 shadow-sm sm:p-7">
              <div className="mb-5 flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#001F3F] text-white">
                  <KeyRound size={16} />
                </span>
                <div>
                  <h2 className="text-[16px] font-black uppercase tracking-tight">
                    Create your{" "}
                    <span className="font-light lowercase italic">login.</span>
                  </h2>
                  <p className="text-[14px] text-slate-500">
                    Owner account for your garage
                  </p>
                </div>
              </div>

              {status && (
                <div
                  role={status.type === "error" ? "alert" : "status"}
                  className={`mb-4 flex items-start gap-2 rounded-xl border-2 px-3 py-2.5 text-[14px] font-semibold ${
                    status.type === "success"
                      ? "border-green-500/30 bg-green-500/10 text-green-700"
                      : "border-red-500/30 bg-red-500/10 text-red-600"
                  }`}
                >
                  {status.type === "success" ? (
                    <CheckCircle size={16} className="mt-0.5 shrink-0" />
                  ) : (
                    <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  )}
                  {status.text}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <div>
                  <label htmlFor="reg-username" className={label}>
                    Username{" "}
                    <span className="text-[12px] font-medium normal-case tracking-normal text-slate-400">
                      you can change this
                    </span>
                  </label>
                  <div className="relative">
                    <User
                      size={14}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      id="reg-username"
                      type="text"
                      autoComplete="username"
                      value={formData.username}
                      onChange={(e) => set({ username: e.target.value })}
                      className={inputCls}
                      placeholder="e.g. Speedline Garage"
                      disabled={done}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className={label}>
                      Email{" "}
                      <span className="text-[12px] font-medium normal-case tracking-normal text-slate-400">
                        locked
                      </span>
                    </label>
                    <div className="relative">
                      <Mail
                        size={14}
                        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                      <input
                        type="email"
                        value={formData.email}
                        disabled
                        className={lockedCls}
                        aria-label="Email"
                      />
                    </div>
                  </div>
                  <div>
                    <label className={label}>
                      Phone{" "}
                      <span className="text-[12px] font-medium normal-case tracking-normal text-slate-400">
                        locked
                      </span>
                    </label>
                    <div className="relative">
                      <Phone
                        size={14}
                        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                      <input
                        type="tel"
                        value={formData.phone}
                        disabled
                        className={lockedCls}
                        aria-label="Phone"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="reg-password" className={label}>
                    Password
                  </label>
                  <div className="relative">
                    <Lock
                      size={14}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      id="reg-password"
                      type={showPassword ? "text" : "password"}
                      name="password"
                      autoComplete="new-password"
                      placeholder="Choose a password"
                      value={formData.password}
                      onChange={(e) => set({ password: e.target.value })}
                      className={`${inputCls} pr-11`}
                      disabled={done}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                      className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 hover:text-[#001F3F]"
                    >
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  {hint && (
                    <p className={`mt-1 text-[12px] font-bold ${hint.cls}`}>
                      {hint.text}
                    </p>
                  )}
                </div>

                <div className="space-y-2 border-t-2 border-[#E2E8F0] pt-4">
                  <p className="text-[12px] font-bold uppercase tracking-wider text-slate-400">
                    Services at your garage
                  </p>
                  {[
                    {
                      key: "pickupDrop",
                      label: "Pickup & drop",
                      hint: "You collect and return cars",
                      icon: Car,
                    },
                    {
                      key: "towingService",
                      label: "Towing",
                      hint: "You can tow broken-down cars",
                      icon: Truck,
                    },
                  ].map(({ key, label: l, hint: h, icon: Icon }) => {
                    const on = formData[key];
                    return (
                      <button
                        key={key}
                        type="button"
                        role="switch"
                        aria-checked={on}
                        disabled={done}
                        onClick={() => set({ [key]: !on })}
                        className={`flex w-full items-center justify-between gap-3 rounded-xl border-2 px-3 py-2.5 text-left transition ${
                          on
                            ? "border-[#001F3F] bg-[#F8FAFC]"
                            : "border-[#E2E8F0] bg-white hover:border-[#CBD5E1]"
                        }`}
                      >
                        <span className="flex items-center gap-2.5">
                          <span
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${on ? "bg-[#001F3F] text-white" : "bg-[#F8FAFC] text-slate-400"}`}
                          >
                            <Icon size={14} />
                          </span>
                          <span>
                            <span className="block text-[14px] font-black">
                              {l}
                            </span>
                            <span className="block text-[12px] text-slate-500">
                              {h}
                            </span>
                          </span>
                        </span>
                        <Switch on={on} />
                      </button>
                    );
                  })}
                </div>

                <button
                  type="submit"
                  disabled={loading || done}
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#001F3F] text-[12px] font-black uppercase tracking-[0.15em] text-white shadow-lg transition hover:bg-black active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <Loader2 size={14} className="animate-spin" /> Creating
                      account…
                    </>
                  ) : done ? (
                    <>
                      <CheckCircle size={14} /> Done
                    </>
                  ) : (
                    <>
                      Complete setup <ArrowRight size={14} />
                    </>
                  )}
                </button>
              </form>

              <p className="mt-4 text-center text-[12px] text-slate-500">
                You can change these settings later from your profile.
              </p>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
};

export default CarRegister;
