// client/src/components/Layout.jsx  (Car CRM)
import React, { useEffect, useMemo, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Car,
  Users,
  Wrench,
  Warehouse,
  Receipt,
  Bell,
  BarChart2,
  LayoutDashboard,
  FileText,
  IndianRupee,
  Network,
  Crown,
  UserRoundPlus,
  Wallet,
  Database,
  ListTree,
  ShoppingCart,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";
import ResponsiveShell from "./ResponsiveShell";
import { useTheme } from "../contexts/ThemeContext";
import GarageVerificationModal from "../components/GarageVerificationModal";

const API_URL = import.meta.env.VITE_API_BASE_URL;

const MENU = [
  {
    to: "/car-dashboard",
    label: "Dashboard",
    short: "Home",
    icon: LayoutDashboard,
  },
  { to: "/clients", label: "Clients", icon: Users },
  { to: "/services", label: "Services", icon: Wrench },
  { to: "/billing", label: "Billing", icon: Receipt },
  { to: "/reminders", label: "Reminders", icon: Bell },
  { to: "/inventory-management", label: "Inventory", icon: Warehouse },
  { to: "/reports", label: "Reports", icon: BarChart2 },
  { to: "/ocr-scanner", label: "OCR Scanner", icon: FileText },
  {
    label: "Shop Spare Parts",
    icon: ShoppingCart,
    shop: true,
    children: [
      { to: "/spare-parts", label: "All Products" },
      { to: "/spare-parts/vendors", label: "Vendors" },
    ],
  },
  { to: "/staff-management", label: "Staff Management", icon: UserRoundPlus },
  { to: "/salary-management", label: "Salary Management", icon: Wallet },
  { to: "/dynamic-data", label: "Data", icon: Database },
  {
    label: "Marketplace",
    icon: ListTree,
    children: [
      { to: "/marketplace/bookings", label: "Bookings" },
      { to: "/marketplace/pricing", label: "Pricing" },
      { to: "/marketplace/packages", label: "Packages" },
    ],
  },
  { to: "/plan", label: "Your Plan", icon: IndianRupee },
  { to: "/reference", label: "Reference", icon: Network },
  { to: "/upgrade", label: "Upgrade", icon: Crown },
];

const STAFF_PAGES = [
  "/car-dashboard",
  "/clients",
  "/services",
  "/billing",
  "/reminders",
  "/reports",
  "/ocr-scanner",
];

const ALLOWED_WHEN_EXPIRED = [
  "/car-dashboard",
  "/plan",
  "/reference",
  "/upgrade",
  "/spare-parts",
  "/spare-parts/vendors",
];

const BOTTOM_NAV = ["/car-dashboard", "/clients", "/services", "/billing"];

// Verification badge colours (light / dark) – MotorDesk navy theme
const BADGES = {
  NOT_ORDERED: {
    text: "Unverified garage",
    light:
      "bg-[#F8FAFC] text-[#001F3F] border-[#CBD5E1] hover:border-[#001F3F]",
    dark: "bg-white/5 text-slate-300 border-white/10 hover:bg-white/10",
    icon: ShieldAlert,
  },
  PAID_PENDING_DOCS: {
    text: "Upload verification docs",
    light: "bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100",
    dark: "bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20",
    icon: ShieldAlert,
  },
  UNDER_REVIEW: {
    text: "Verification in review",
    light: "bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100",
    dark: "bg-blue-500/10 text-blue-300 border-blue-500/30 hover:bg-blue-500/20",
    icon: ShieldAlert,
  },
  VERIFIED: {
    text: "Verified garage",
    light: "bg-green-50 text-green-700 border-green-300 cursor-default",
    dark: "bg-green-500/10 text-green-400 border-green-500/30 cursor-default",
    icon: ShieldCheck,
  },
  REJECTED: {
    text: "Verification rejected",
    light: "bg-red-50 text-red-700 border-red-300 hover:bg-red-100",
    dark: "bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20",
    icon: ShieldAlert,
  },
};

export default function Layout() {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [user, setUser] = useState({});
  const [loadingUser, setLoadingUser] = useState(true);
  const [verification, setVerification] = useState(null);
  const [showVerificationModal, setShowVerificationModal] = useState(false);

  const isStaff = user?.type === "staff";
  const userPlan = user?.plan || "BASIC";
  const canAccessStaff = ["STANDARD", "PREMIUM"].includes(userPlan);
  const canAccessSalary = userPlan === "PREMIUM";
  const isPlanExpired = Boolean(
    user?.planExpiry && new Date(user.planExpiry) < new Date(),
  );

  /* ---------- verification state ---------- */
  const fetchVerificationState = async () => {
    if (isStaff) return;
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await axios.get(`${API_URL}/api/garage-verification/state`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setVerification(res.data);
    } catch (err) {
      console.error("Verification state fetch failed:", err);
    }
  };

  /* ---------- profile (owner / staff) ---------- */
  useEffect(() => {
    const loadProfile = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoadingUser(false);
        return;
      }
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        const isStaffToken = payload.type === "staff";
        const url = isStaffToken
          ? `${API_URL}/api/staff-auth/profile`
          : `${API_URL}/api/user/profile`;

        const res = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            "ngrok-skip-browser-warning": "true",
          },
        });
        if (!res.ok) throw new Error("Profile fetch failed");

        const profile = await res.json();
        const normalizedUser = {
          ...profile,
          type: isStaffToken ? "staff" : "owner",
        };
        localStorage.setItem("user", JSON.stringify(normalizedUser));
        setUser(normalizedUser);
        window.dispatchEvent(new Event("user-updated"));
      } catch (err) {
        console.error("Profile load error:", err);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login", { replace: true });
      } finally {
        setLoadingUser(false);
      }
    };

    loadProfile();

    const handleUserUpdate = () => {
      const stored = localStorage.getItem("user");
      if (stored) setUser(JSON.parse(stored));
    };
    window.addEventListener("user-updated", handleUserUpdate);
    return () => window.removeEventListener("user-updated", handleUserUpdate);
  }, [navigate]);

  useEffect(() => {
    if (user?.type === "owner") fetchVerificationState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.type]);

  /* ---------- menu with role / plan rules ---------- */
  const menu = useMemo(() => {
    const isLocked = (to) =>
      !isStaff && isPlanExpired && !ALLOWED_WHEN_EXPIRED.includes(to);

    return MENU.filter((item) => {
      if (item.shop) return true;
      if (isStaff) return STAFF_PAGES.includes(item.to);
      if (
        (item.to === "/staff-management" || item.to === "/dynamic-data") &&
        !canAccessStaff
      )
        return false;
      if (item.to === "/salary-management" && !canAccessSalary) return false;
      return true;
    }).map((item) =>
      item.children
        ? {
            ...item,
            children: item.children.map((c) => ({
              ...c,
              locked: isLocked(c.to),
            })),
          }
        : { ...item, locked: isLocked(item.to) },
    );
  }, [isStaff, isPlanExpired, canAccessStaff, canAccessSalary]);

  const logout = () => {
    localStorage.clear();
    navigate("/login", { replace: true });
  };

  if (loadingUser) return null;

  const badge = BADGES[verification?.status] || BADGES.NOT_ORDERED;
  const verificationButton = !isStaff && (
    <button
      disabled={verification?.status === "VERIFIED"}
      onClick={() => setShowVerificationModal(true)}
      className={`inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-xl border-2 px-3 text-[12px] font-bold transition ${isDark ? badge.dark : badge.light}`}
    >
      <badge.icon size={14} className="shrink-0" />
      <span className="truncate">{badge.text}</span>
    </button>
  );

  return (
    <>
      <ResponsiveShell
        brandIcon={Car}
        brandName={user?.companyName || user?.company || "Motor Desk"}
        brandTag="Car Garage CRM"
        menu={menu}
        bottomNav={BOTTOM_NAV}
        user={{
          name: user?.username || user?.name || "User",
          email: user?.email,
          image: user?.profileImage,
        }}
        profilePath={isStaff ? null : "/profile"}
        onLogout={logout}
        headerExtra={verificationButton}
        drawerExtra={verificationButton}
        // Car pages already add their own left margin on desktop (lg:ml-16 etc.)
        offsetContent={false}
        mainClassName="px-3 py-4 sm:px-4 lg:px-6 lg:py-6"
      >
        <Outlet />
      </ResponsiveShell>

      <GarageVerificationModal
        isOpen={showVerificationModal}
        onClose={() => setShowVerificationModal(false)}
        verification={verification}
        onRefreshState={fetchVerificationState}
      />
    </>
  );
}
