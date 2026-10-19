// client/src/components/WashingLayout.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import {
  Truck,
  Users,
  Wrench,
  Receipt,
  BarChart2,
  LayoutDashboard,
  IndianRupee,
  Network,
  Crown,
  MessageSquare,
  Layers,
  Wallet,
  UsersRound,
} from "lucide-react";
import ResponsiveShell from "./ResponsiveShell";

const MENU = [
  {
    to: "/wash-dashboard",
    label: "Dashboard",
    short: "Home",
    icon: LayoutDashboard,
    roles: ["user", "team"],
  },
  {
    to: "/washing-clients",
    label: "Clients",
    icon: Users,
    roles: ["user", "team"],
  },
  {
    to: "/washing-services",
    label: "Services",
    icon: Wrench,
    roles: ["user", "team"],
  },
  {
    to: "/washing-billing",
    label: "Billing",
    icon: Receipt,
    roles: ["user", "team"],
  },
  {
    to: "/washing-alerts",
    label: "Alerts",
    icon: MessageSquare,
    roles: ["user", "team"],
  },
  {
    to: "/washing-reports",
    label: "Reports",
    icon: BarChart2,
    roles: ["user", "team"],
  },
  {
    label: "Marketplace",
    icon: Layers,
    roles: ["user", "team"],
    children: [
      { to: "/washing-marketplace/bookings", label: "Bookings" },
      { to: "/washing-marketplace/pricing", label: "Pricing" },
      { to: "/washing-marketplace/packages", label: "Packages" },
    ],
  },
  // 🔒 Owner / admin only
  {
    to: "/washing-salary-management",
    label: "Salary Management",
    icon: Wallet,
    roles: ["user"],
  },
  { to: "/teams", label: "Team", icon: UsersRound, roles: ["user"] },
  {
    to: "/washing-plan",
    label: "Your Plan",
    icon: IndianRupee,
    roles: ["user"],
  },
  {
    to: "/washing-reference",
    label: "Reference",
    icon: Network,
    roles: ["user"],
  },
  { to: "/washing-upgrade", label: "Upgrade", icon: Crown, roles: ["user"] },
];

const BOTTOM_NAV = [
  "/wash-dashboard",
  "/washing-clients",
  "/washing-services",
  "/washing-billing",
];

export default function WashingLayoutPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState({
    username: "Demo Washer",
    email: "demo@washgarage.com",
    companyName: "Wash Garage Pro",
  });

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) return;
    try {
      setUser(JSON.parse(stored));
    } catch {
      console.error("Failed to parse user data");
    }
  }, []);

  const menu = useMemo(
    () => MENU.filter((item) => item.roles.includes(user?.role)),
    [user?.role],
  );

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("crmType");
    navigate("/login", { replace: true });
  };

  return (
    <ResponsiveShell
      brandIcon={Truck}
      brandName={user?.companyName || "Wash Garage"}
      brandTag="Washing Center CRM"
      menu={menu}
      bottomNav={BOTTOM_NAV}
      user={{
        name: user?.username || "User",
        email: user?.email || "",
        image: user?.profileImage,
      }}
      profilePath="/washProfile"
      onLogout={logout}
    >
      <Outlet />
    </ResponsiveShell>
  );
}
