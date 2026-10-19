// client/src/components/BikeLayoutPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import {
  Bike,
  Users,
  Wrench,
  Receipt,
  Bell,
  BarChart2,
  LayoutDashboard,
  FileText,
  Package,
  IndianRupee,
  Network,
  Crown,
  ListTree,
  ShoppingCart,
  Boxes,
  UsersRound,
} from "lucide-react";
import ResponsiveShell from "./ResponsiveShell";

const MENU = [
  {
    to: "/bike-dashboard",
    label: "Dashboard",
    short: "Home",
    icon: LayoutDashboard,
    roles: ["owner", "bike_team"],
  },
  {
    to: "/bike-clients",
    label: "Clients",
    icon: Users,
    roles: ["owner", "bike_team"],
  },
  {
    to: "/bike-services",
    label: "Services",
    icon: Wrench,
    roles: ["owner", "bike_team"],
  },
  {
    to: "/bike-billing",
    label: "Billing",
    icon: Receipt,
    roles: ["owner", "bike_team"],
  },
  {
    to: "/bike-inventory",
    label: "Inventory",
    icon: Boxes,
    roles: ["owner", "bike_team"],
  },
  {
    to: "/bike-reminders",
    label: "Reminders",
    icon: Bell,
    roles: ["owner", "bike_team"],
  },
  {
    to: "/bike-reports",
    label: "Reports",
    icon: BarChart2,
    roles: ["owner", "bike_team"],
  },
  {
    to: "/bike-ocr-scanner",
    label: "OCR Scanner",
    icon: FileText,
    roles: ["owner", "bike_team"],
  },
  {
    label: "Shop Spare Parts",
    icon: ShoppingCart,
    roles: ["owner", "bike_team"],
    children: [
      { to: "/bike-spare-parts", label: "All Products" },
      { to: "/bike-spare-parts/vendors", label: "Vendors" },
    ],
  },
  {
    label: "Marketplace",
    icon: ListTree,
    roles: ["owner", "bike_team"],
    children: [
      { to: "/bike-marketplace/bookings", label: "Bookings" },
      { to: "/bike-marketplace/pricing", label: "Pricing" },
      { to: "/bike-marketplace/packages", label: "Packages" },
    ],
  },
  // 🔒 Owner only
  {
    to: "/salary-manage",
    label: "Staff Management",
    icon: Package,
    roles: ["owner"],
  },
  {
    to: "/team-register",
    label: "Team Accounts",
    icon: UsersRound,
    roles: ["owner"],
  },
  { to: "/bike-plan", label: "Your Plan", icon: IndianRupee, roles: ["owner"] },
  {
    to: "/bike-reference",
    label: "Reference",
    icon: Network,
    roles: ["owner"],
  },
  { to: "/bike-plans", label: "Upgrade", icon: Crown, roles: ["owner"] },
];

const BOTTOM_NAV = [
  "/bike-dashboard",
  "/bike-clients",
  "/bike-services",
  "/bike-billing",
];

export default function BikeLayoutPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    if (!storedUser || !token) {
      navigate("/login", { replace: true });
      return;
    }
    try {
      setUser(JSON.parse(storedUser));
    } catch {
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  const menu = useMemo(
    () => MENU.filter((item) => item.roles.includes(user?.type)),
    [user?.type],
  );

  const logout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("auth");
    navigate("/login", { replace: true });
  };

  if (!user) return null;

  return (
    <ResponsiveShell
      brandIcon={Bike}
      brandName={user.companyName || "Bike Garage"}
      brandTag="Bike Garage CRM"
      menu={menu}
      bottomNav={BOTTOM_NAV}
      user={{
        name: user.displayName || user.username || "User",
        email: user.email || (user.type === "bike_team" ? "Team member" : ""),
        image: user.profileImage || "/Logos/logo3.png",
      }}
      profilePath={user.type === "owner" ? "/bike-profile" : null}
      onLogout={logout}
    >
      <Outlet />
    </ResponsiveShell>
  );
}
