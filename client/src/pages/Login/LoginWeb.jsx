// client/src/pages/Login/Login.jsx
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiUser,
  FiLock,
  FiEye,
  FiEyeOff,
  FiLogIn,
  FiActivity,
  FiShield,
  FiCpu,
  FiTruck,
  FiBox,
  FiChevronLeft,
  FiLoader,
  FiAlertCircle,
  FiCheck,
  FiSun,
  FiMoon,
} from "react-icons/fi";
import { useTheme } from "../../contexts/ThemeContext";
import {
  API_URL,
  isNativeApp,
  getDashboardPath,
} from "../../utils/authStorage";

const API = API_URL;
const LOGO_SRC = "/Logos/transLogo.png"; // client/public/Logos/transLogo.png

const CRM_CONFIG = {
  car: {
    label: "Car Garage",
    short: "Car",
    icon: FiTruck,
    register: "/car-register",
  },
  bike: {
    label: "Bike Workshop",
    short: "Bike",
    icon: FiActivity,
    register: "/bike-register",
  },
  wash: {
    label: "Wash Center",
    short: "Wash",
    icon: FiBox,
    register: "/washing-register",
  },
  puncher: {
    label: "Puncher Shop",
    short: "Puncher",
    icon: FiCpu,
    register: "/puncher-register",
  },
};

const FEATURES = [
  "Job cards, billing & GST invoices",
  "Inventory, staff and salary in one place",
  "WhatsApp approvals & service reminders",
];

/* ---------- logo on a white tile (readable on navy and in dark mode) ---------- */
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

export default function ModernLogin() {
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ identifier: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [crmType, setCrmType] = useState(() => {
    try {
      const saved = localStorage.getItem("lastCrmType");
      return CRM_CONFIG[saved] ? saved : "car";
    } catch {
      return "car";
    }
  });
  const [loginMode, setLoginMode] = useState("owner");

  const staffAllowed = crmType !== "puncher"; // Puncher Shop: owner login only
  const isStaff = loginMode === "staff" && staffAllowed;

  useEffect(() => {
    if (!staffAllowed && loginMode === "staff") setLoginMode("owner");
  }, [staffAllowed, loginMode]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
  };

  const pickCrm = (key) => {
    setCrmType(key);
    setError("");
    try {
      localStorage.setItem("lastCrmType", key);
    } catch {
      /* ignore */
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.identifier.trim() || !formData.password) {
      setError("Please enter your login details and password.");
      return;
    }
    if (isStaff && !formData.identifier.includes("@")) {
      setError("Staff accounts sign in with their email address.");
      return;
    }

    setIsLoading(true);
    try {
      let loginUrl = "";
      let payload = {};

      if (isStaff) {
        const email = formData.identifier.trim().toLowerCase();
        if (crmType === "wash") {
          loginUrl = `${API}/api/teams/wash-staff/login`;
          payload = { email, password: formData.password };
        } else if (crmType === "car") {
          loginUrl = `${API}/api/staff-auth/login`;
          payload = { email, password: formData.password, crmType: "CAR" };
        } else {
          loginUrl = `${API}/api/bikes-team/login`;
          payload = {
            email,
            password: formData.password,
            crmType: crmType.toUpperCase(),
          };
        }
      } else {
        loginUrl = `${API}/api/auth/login`;
        payload = {
          identifier: formData.identifier.trim(),
          password: formData.password,
          crmType,
        };
      }

      const response = await fetch(loginUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "ngrok-skip-browser-warning": "true",
          "X-Client": isNativeApp() ? "mobile" : "web",
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(data.message || "Incorrect login details. Please try again.");
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("crmType", crmType);
      if (data.user?.id != null) localStorage.setItem("userId", data.user.id);

      navigate(getDashboardPath(), { replace: true });
    } catch (err) {
      console.error("Login error:", err);
      setError("Can't reach the server. Check your internet and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  /* ---------- theme ---------- */
  const t = isDark
    ? {
        page: "bg-[#000814] text-white",
        card: "bg-[#001F3F] border-white/5 shadow-2xl shadow-black/30",
        heading: "text-white",
        muted: "text-slate-400",
        seg: "bg-white/5 border-white/10",
        segIdle: "text-slate-400 hover:text-white hover:bg-white/5",
        segOn: "bg-white text-[#001F3F] shadow-sm",
        input:
          "bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-white/40 focus:bg-white/10",
        divider: "border-white/10",
        ghost: "border-white/10 text-slate-200 hover:bg-white/5",
        primary: "bg-white text-[#001F3F] hover:bg-blue-50",
        link: "text-white underline-offset-4 hover:underline",
      }
    : {
        page: "bg-[#F8FAFC] text-[#001F3F]",
        card: "bg-white border-[#CBD5E1] shadow-sm",
        heading: "text-[#001F3F]",
        muted: "text-slate-500",
        seg: "bg-[#F8FAFC] border-[#CBD5E1]",
        segIdle: "text-slate-500 hover:text-[#001F3F] hover:bg-white",
        segOn: "bg-[#001F3F] text-white shadow-sm",
        input:
          "bg-[#F8FAFC] border-[#CBD5E1] text-[#001F3F] placeholder:text-slate-400 focus:border-[#001F3F] focus:bg-white",
        divider: "border-[#CBD5E1]",
        ghost: "border-[#CBD5E1] text-[#001F3F] hover:bg-white",
        primary: "bg-[#001F3F] text-white hover:bg-black",
        link: "text-[#001F3F] underline-offset-4 hover:underline",
      };

  const selected = CRM_CONFIG[crmType];
  const SelIcon = selected.icon;

  return (
    <div className={`flex min-h-screen ${t.page}`}>
      {/* ---------- left: navy brand panel (desktop) ---------- */}
      <aside className="relative hidden w-[44%] max-w-[620px] flex-col justify-between overflow-hidden bg-gradient-to-br from-[#001F3F] to-[#000814] p-10 text-white lg:flex">
        <div className="pointer-events-none absolute -right-24 top-24 h-72 w-72 rotate-12 rounded-[48px] border-2 border-white/5" />
        <div className="pointer-events-none absolute -bottom-20 left-16 h-56 w-56 rotate-45 rounded-[40px] border-2 border-white/5" />

        <div className="relative">
          <BrandLogo />
        </div>

        <div className="relative space-y-6">
          <span className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[12px] font-black uppercase tracking-[0.2em]">
            <FiShield size={12} /> Garage management CRM
          </span>
          <h1 className="text-[16px] font-black uppercase leading-snug tracking-tight">
            Run your whole workshop{" "}
            <span className="block font-light lowercase italic">
              from one desk.
            </span>
          </h1>
          <p className="max-w-sm text-[14px] text-white/60">
            Sign in to manage customers, services, billing and stock for your
            garage.
          </p>
          <ul className="space-y-2.5">
            {FEATURES.map((f) => (
              <li
                key={f}
                className="flex items-center gap-3 text-[14px] font-semibold"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white text-[#001F3F]">
                  <FiCheck size={14} strokeWidth={3} />
                </span>
                {f}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-[12px] font-bold uppercase tracking-[0.2em] text-white/40">
          © {new Date().getFullYear()} MotorDesk
        </p>
      </aside>

      {/* ---------- right: form ---------- */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header
          className={`flex h-14 items-center justify-between gap-3 border-b-2 px-4 sm:px-6 ${t.divider}`}
        >
          <button
            type="button"
            onClick={() => navigate("/")}
            className={`inline-flex h-9 items-center gap-1.5 rounded-xl border-2 px-3 text-[12px] font-black uppercase tracking-[0.15em] transition ${t.ghost}`}
          >
            <FiChevronLeft size={14} /> Home
          </button>
          <span className="lg:hidden">
            <BrandLogo compact />
          </span>
          <button
            type="button"
            onClick={toggleTheme}
            className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border-2 transition ${t.ghost}`}
            aria-label="Toggle theme"
          >
            {isDark ? (
              <FiSun size={14} className="text-amber-400" />
            ) : (
              <FiMoon size={14} />
            )}
          </button>
        </header>

        <main className="flex flex-1 items-center justify-center px-4 py-6 sm:px-6 sm:py-10">
          <section
            className={`w-full max-w-md rounded-2xl border-2 p-5 sm:p-7 ${t.card}`}
          >
            <div className="mb-5">
              <h2
                className={`text-[16px] font-black uppercase tracking-tight ${t.heading}`}
              >
                Welcome{" "}
                <span className="font-light lowercase italic">back.</span>
              </h2>
              <p className={`text-[14px] ${t.muted}`}>
                Sign in to your MotorDesk account.
              </p>
            </div>

            {/* business type */}
            <p
              className={`mb-1.5 text-[12px] font-bold uppercase tracking-wider ${t.muted}`}
            >
              Business type
            </p>
            <div
              className={`mb-4 grid grid-cols-4 gap-1 rounded-xl border-2 p-1 ${t.seg}`}
              role="radiogroup"
              aria-label="Business type"
            >
              {Object.entries(CRM_CONFIG).map(([key, cfg]) => {
                const Icon = cfg.icon;
                const active = crmType === key;
                return (
                  <button
                    key={key}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => pickCrm(key)}
                    title={cfg.label}
                    className={`flex flex-col items-center justify-center gap-1 rounded-lg px-1 py-2 text-[12px] font-black uppercase tracking-wider transition ${
                      active ? t.segOn : t.segIdle
                    }`}
                  >
                    <Icon size={16} />
                    <span className="truncate">{cfg.short}</span>
                  </button>
                );
              })}
            </div>

            {/* owner / staff */}
            {staffAllowed ? (
              <div
                className={`mb-5 grid grid-cols-2 gap-1 rounded-xl border-2 p-1 ${t.seg}`}
                role="radiogroup"
                aria-label="Account type"
              >
                {["owner", "staff"].map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    role="radio"
                    aria-checked={loginMode === mode}
                    onClick={() => {
                      setLoginMode(mode);
                      setError("");
                    }}
                    className={`h-9 rounded-lg text-[12px] font-black uppercase tracking-[0.15em] transition ${loginMode === mode ? t.segOn : t.segIdle}`}
                  >
                    {mode === "owner" ? "Owner" : "Staff"}
                  </button>
                ))}
              </div>
            ) : (
              <p
                className={`mb-5 rounded-xl border-2 px-3 py-2 text-[12px] font-semibold ${t.seg} ${t.muted}`}
              >
                {selected.label} accounts sign in as owner.
              </p>
            )}

            {error && (
              <div
                role="alert"
                className="mb-4 flex items-start gap-2 rounded-xl border-2 border-red-500/30 bg-red-500/10 px-3 py-2.5 text-[14px] font-semibold text-red-500"
              >
                <FiAlertCircle className="mt-0.5 shrink-0" size={14} /> {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div>
                <label
                  htmlFor="identifier"
                  className={`mb-1.5 block text-[12px] font-bold uppercase tracking-wider ${t.heading}`}
                >
                  {isStaff ? "Staff email" : "Email or username"}
                </label>
                <div className="relative">
                  <FiUser
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    size={14}
                  />
                  <input
                    id="identifier"
                    name="identifier"
                    type={isStaff ? "email" : "text"}
                    inputMode={isStaff ? "email" : "text"}
                    autoComplete="username"
                    autoCapitalize="none"
                    spellCheck={false}
                    value={formData.identifier}
                    onChange={handleInputChange}
                    placeholder={
                      isStaff ? "staff@yourgarage.com" : "you@example.com"
                    }
                    className={`h-11 w-full rounded-xl border-2 pl-10 pr-3 text-[14px] font-semibold outline-none transition ${t.input}`}
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className={`mb-1.5 block text-[12px] font-bold uppercase tracking-wider ${t.heading}`}
                >
                  Password
                </label>
                <div className="relative">
                  <FiLock
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    size={14}
                  />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={formData.password}
                    onChange={handleInputChange}
                    onKeyUp={(e) =>
                      setCapsLock(e.getModifierState?.("CapsLock"))
                    }
                    placeholder="Your password"
                    className={`h-11 w-full rounded-xl border-2 pl-10 pr-11 text-[14px] font-semibold outline-none transition ${t.input}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-1.5 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:text-slate-200"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? (
                      <FiEyeOff size={14} />
                    ) : (
                      <FiEye size={14} />
                    )}
                  </button>
                </div>
                {capsLock && (
                  <p className="mt-1 text-[12px] font-bold text-amber-500">
                    Caps Lock is on
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl text-[12px] font-black uppercase tracking-[0.15em] shadow-lg transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 ${t.primary}`}
              >
                {isLoading ? (
                  <>
                    <FiLoader className="animate-spin" size={14} /> Signing in…
                  </>
                ) : (
                  <>
                    <SelIcon size={14} /> Sign in to {selected.label}{" "}
                    <FiLogIn size={14} />
                  </>
                )}
              </button>
            </form>

            <div
              className={`mt-5 space-y-2 border-t-2 pt-4 text-center ${t.divider}`}
            >
              {isStaff ? (
                <p className={`text-[12px] ${t.muted}`}>
                  Staff logins are created by the garage owner.
                </p>
              ) : (
                <p className={`text-[14px] ${t.muted}`}>
                  New to MotorDesk?{" "}
                  <Link
                    to={selected.register}
                    className={`font-black ${t.link}`}
                  >
                    Create a {selected.label.toLowerCase()} account
                  </Link>
                </p>
              )}
              <p
                className={`flex items-center justify-center gap-1.5 text-[12px] ${t.muted}`}
              >
                <FiShield className="text-green-500" size={12} /> Secure,
                encrypted sign-in
              </p>
              <p className={`text-[12px] ${t.muted}`}>
                <Link to="/privacy-policy" className={`font-bold ${t.link}`}>
                  Privacy Policy
                </Link>
                {" · "}
                <Link to="/terms" className={`font-bold ${t.link}`}>
                  Terms
                </Link>
              </p>
            </div>
          </section>
        </main>

        <footer
          className={`px-4 pb-5 text-center text-[12px] lg:hidden ${t.muted}`}
        >
          © {new Date().getFullYear()} MotorDesk
        </footer>
      </div>
    </div>
  );
}
