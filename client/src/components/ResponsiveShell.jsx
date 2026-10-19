// client/src/components/ResponsiveShell.jsx
// Shared app frame for the Car, Bike and Washing CRMs – MotorDesk navy theme.
//
//  • Desktop (≥1024px): slim icon rail on the left, expands on hover.
//  • Tablet & phone (<1024px): no sidebar. Top bar with a hamburger that opens
//    a slide-in menu, plus a bottom navigation bar for the main pages.
//
// Colours: navy #001F3F, deep navy #000814 (dark bg), slate surfaces #F8FAFC / #CBD5E1.
// Text sizes used: 12px, 14px, 16px.

import React, { useEffect, useMemo, useRef, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Menu,
  X,
  Sun,
  Moon,
  LogOut,
  ChevronDown,
  LockKeyhole,
  MoreHorizontal,
  UserRound,
} from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";
import PullToRefresh from "./PullToRefresh";

const norm = (p = "") => p.toLowerCase().replace(/\/+$/, "") || "/";

/**
 * Props
 *  brandIcon     lucide icon for the logo
 *  brandName     garage / company name
 *  brandTag      small line under the name (e.g. "Car Garage CRM")
 *  accent        kept for compatibility – every CRM now uses the navy theme
 *  menu          [{ to, label, icon, locked?, children?: [{ to, label, locked? }] }]
 *  bottomNav     up to 4 paths shown in the phone/tablet bottom bar (+ "More")
 *  user          { name, email, image }
 *  profilePath   where "Profile" goes (null hides it)
 *  onLogout      called after the user confirms logout
 *  headerExtra   node shown in the top bar on md+ (e.g. verification badge)
 *  drawerExtra   node shown at the top of the phone/tablet menu
 *  offsetContent add left padding for the desktop rail (false if pages add their own)
 *  mainClassName extra classes for <main>
 *  pullToRefresh  true (default) = pull the page down on a phone to reload it
 *  lockedPath    where locked items go (default /upgrade)
 */
export default function ResponsiveShell({
  brandIcon: BrandIcon,
  brandName,
  brandTag = "CRM Console",
  menu = [],
  bottomNav = [],
  user = {},
  profilePath,
  onLogout,
  headerExtra,
  drawerExtra,
  offsetContent = true,
  mainClassName = "",
  pullToRefresh = true,
  lockedPath = "/upgrade",
  children,
}) {
  const { isDark, toggleTheme } = useTheme();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [railExpanded, setRailExpanded] = useState(false);
  const [openGroups, setOpenGroups] = useState({});
  const [profileOpen, setProfileOpen] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const profileRef = useRef(null);

  /* ---------- active route (longest matching path wins) ---------- */
  const allLinks = useMemo(
    () =>
      menu.flatMap((m) =>
        m.children
          ? m.children.map((c) => ({ ...c, parent: m.label, icon: m.icon }))
          : [m],
      ),
    [menu],
  );

  const activeLink = useMemo(() => {
    const p = norm(pathname);
    let best = null;
    allLinks.forEach((l) => {
      const to = norm(l.to);
      if (
        (p === to || p.startsWith(`${to}/`)) &&
        (!best || to.length > norm(best.to).length)
      )
        best = l;
    });
    return best;
  }, [pathname, allLinks]);

  const isActive = (to) => activeLink && norm(to) === norm(activeLink.to);
  const activeParent = activeLink?.parent;

  // Open the group that contains the current page
  useEffect(() => {
    if (activeParent) setOpenGroups((g) => ({ ...g, [activeParent]: true }));
  }, [activeParent]);

  /* ---------- close things on navigation / Escape ---------- */
  useEffect(() => {
    setDrawerOpen(false);
    setProfileOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        setDrawerOpen(false);
        setProfileOpen(false);
        setConfirmLogout(false);
      }
    };
    const onClick = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target))
        setProfileOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, []);

  // Lock page scroll while the phone menu is open
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  /* ---------- theme tokens ---------- */
  const t = isDark
    ? {
        page: "bg-[#000814] text-white",
        panel: "bg-[#001F3F] border-white/5",
        bar: "bg-[#000814]/90 border-white/5",
        line: "border-white/5",
        heading: "text-white",
        muted: "text-slate-400",
        item: "text-slate-400 hover:bg-white/5 hover:text-white",
        active: "bg-white text-[#001F3F] shadow-lg shadow-black/30",
        activeText: "text-white",
        soft: "bg-white/10 text-white",
        logo: "bg-white text-[#001F3F]",
        iconBtn: "border-white/10 text-slate-300 hover:bg-white/5",
        card: "bg-[#001F3F] border-white/10",
        hover: "hover:bg-white/5",
      }
    : {
        page: "bg-[#F8FAFC] text-[#001F3F]",
        panel: "bg-white border-[#CBD5E1]",
        bar: "bg-white/90 border-[#CBD5E1]",
        line: "border-[#CBD5E1]",
        heading: "text-[#001F3F]",
        muted: "text-slate-500",
        item: "text-slate-500 hover:bg-[#F8FAFC] hover:text-[#001F3F]",
        active: "bg-[#001F3F] text-white shadow-lg shadow-[#001F3F]/20",
        activeText: "text-[#001F3F]",
        soft: "bg-[#001F3F]/10 text-[#001F3F]",
        logo: "bg-[#001F3F] text-white",
        iconBtn: "border-[#CBD5E1] text-[#001F3F] hover:bg-[#F8FAFC]",
        card: "bg-white border-[#CBD5E1]",
        hover: "hover:bg-[#F8FAFC]",
      };

  const target = (item) => (item.locked ? lockedPath : item.to);

  /* ---------- menu list (used by rail and drawer) ---------- */
  const renderMenu = (compact) => (
    <nav className="flex-1 space-y-1 overflow-y-auto overflow-x-hidden px-3 py-3">
      <p
        className={`mb-2 px-3 text-[12px] font-black uppercase tracking-[0.25em] text-slate-400 transition-opacity ${
          compact ? "opacity-0" : "opacity-100"
        }`}
      >
        Menu
      </p>
      {menu.map((item) => {
        const Icon = item.icon;

        if (item.children) {
          const open = !!openGroups[item.label];
          const groupActive = activeParent === item.label;
          return (
            <div key={item.label}>
              <button
                type="button"
                onClick={() =>
                  setOpenGroups((g) => ({ ...g, [item.label]: !g[item.label] }))
                }
                title={compact ? item.label : undefined}
                className={`flex h-10 w-full items-center gap-3 rounded-xl px-3 text-[14px] font-semibold transition ${
                  groupActive ? t.soft : t.item
                }`}
              >
                <Icon size={18} className="shrink-0" />
                <span
                  className={`flex-1 truncate text-left transition-opacity ${compact ? "opacity-0" : "opacity-100"}`}
                >
                  {item.label}
                </span>
                {!compact && (
                  <ChevronDown
                    size={14}
                    className={`shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
                  />
                )}
              </button>
              {open && !compact && (
                <div
                  className={`ml-[21px] mt-1 space-y-0.5 border-l-2 pl-3 ${t.line}`}
                >
                  {item.children.map((child) => {
                    const on = isActive(child.to);
                    return (
                      <NavLink
                        key={child.to}
                        to={target(child)}
                        className={`flex h-8 items-center gap-2 rounded-lg px-2.5 text-[14px] transition ${
                          on ? `${t.activeText} font-black` : t.item
                        } ${child.locked ? "opacity-60" : ""}`}
                      >
                        <span
                          className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                            on
                              ? isDark
                                ? "bg-white"
                                : "bg-[#001F3F]"
                              : "bg-slate-400/40"
                          }`}
                        />
                        <span className="truncate">{child.label}</span>
                        {child.locked && (
                          <LockKeyhole size={12} className="shrink-0" />
                        )}
                      </NavLink>
                    );
                  })}
                </div>
              )}
            </div>
          );
        }

        const active = isActive(item.to);
        return (
          <NavLink
            key={item.to}
            to={target(item)}
            title={compact ? item.label : undefined}
            className={`flex h-10 items-center gap-3 rounded-xl px-3 text-[14px] font-semibold transition ${
              active ? t.active : t.item
            } ${item.locked ? "opacity-60" : ""}`}
          >
            <Icon size={18} className="shrink-0" />
            <span
              className={`flex-1 truncate transition-opacity ${compact ? "opacity-0" : "opacity-100"}`}
            >
              {item.label}
            </span>
            {item.locked && !compact && (
              <LockKeyhole size={12} className="shrink-0" />
            )}
          </NavLink>
        );
      })}
    </nav>
  );

  const renderLogo = (showName = true) => (
    <div className="flex min-w-0 items-center gap-3">
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl shadow-lg ${t.logo}`}
      >
        {BrandIcon && <BrandIcon size={18} />}
      </div>
      {showName && (
        <div className="min-w-0 leading-tight">
          <p
            className={`truncate text-[14px] font-black uppercase tracking-tight ${t.heading}`}
          >
            {brandName}
          </p>
          <p className="truncate text-[12px] font-semibold italic text-slate-400">
            {brandTag}
          </p>
        </div>
      )}
    </div>
  );

  const renderAvatar = (size = "h-8 w-8") =>
    user.image ? (
      <img
        src={user.image}
        alt=""
        className={`${size} shrink-0 rounded-xl border-2 object-cover ${isDark ? "border-white/10" : "border-[#CBD5E1]"}`}
      />
    ) : (
      <div
        className={`${size} flex shrink-0 items-center justify-center rounded-xl text-[12px] font-black ${t.logo}`}
      >
        {(user.name || "U").charAt(0).toUpperCase()}
      </div>
    );

  /* ---------- bottom nav ---------- */
  const bottomItems = bottomNav
    .map((to) => allLinks.find((l) => norm(l.to) === norm(to)))
    .filter(Boolean)
    .slice(0, 4);
  const moreActive = !bottomItems.some((b) => isActive(b.to));

  return (
    <div className={`min-h-screen transition-colors duration-500 ${t.page}`}>
      {/* ================= DESKTOP RAIL ================= */}
      <aside
        onMouseEnter={() => setRailExpanded(true)}
        onMouseLeave={() => setRailExpanded(false)}
        className={`fixed inset-y-0 left-0 z-40 hidden flex-col border-r-2 transition-[width] duration-200 lg:flex ${t.panel} ${
          railExpanded ? "w-64 shadow-2xl" : "w-[72px]"
        }`}
      >
        <div
          className={`flex h-16 shrink-0 items-center border-b-2 px-[16px] ${t.line}`}
        >
          {renderLogo(railExpanded)}
        </div>

        {renderMenu(!railExpanded)}

        <div className={`shrink-0 space-y-1 border-t-2 p-3 ${t.line}`}>
          {profilePath && (
            <button
              onClick={() => navigate(profilePath)}
              title="Profile"
              className={`flex h-10 w-full items-center gap-3 rounded-xl px-1.5 text-[14px] font-semibold transition ${t.item}`}
            >
              {renderAvatar("h-7 w-7")}
              <span
                className={`min-w-0 flex-1 text-left transition-opacity ${railExpanded ? "opacity-100" : "opacity-0"}`}
              >
                <span
                  className={`block truncate text-[14px] font-bold ${t.heading}`}
                >
                  {user.name || "User"}
                </span>
              </span>
            </button>
          )}
          <button
            onClick={() => setConfirmLogout(true)}
            title="Logout"
            className={`flex h-10 w-full items-center gap-3 rounded-xl px-3 text-[14px] font-semibold text-red-500 transition ${
              isDark ? "hover:bg-red-500/10" : "hover:bg-red-50"
            }`}
          >
            <LogOut size={18} className="shrink-0" />
            <span
              className={`truncate transition-opacity ${railExpanded ? "opacity-100" : "opacity-0"}`}
            >
              Logout
            </span>
          </button>
        </div>
      </aside>

      {/* ================= PHONE / TABLET DRAWER ================= */}
      <div
        className={`fixed inset-0 z-50 bg-[#000814]/60 backdrop-blur-sm transition-opacity lg:hidden ${
          drawerOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setDrawerOpen(false)}
        aria-hidden="true"
      />
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col border-r-2 shadow-2xl transition-transform duration-200 lg:hidden ${t.panel} ${
          drawerOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label="Menu"
      >
        <div
          className={`flex h-16 shrink-0 items-center justify-between gap-2 border-b-2 px-4 ${t.line}`}
        >
          {renderLogo()}
          <button
            onClick={() => setDrawerOpen(false)}
            className={`flex h-9 w-9 items-center justify-center rounded-xl border-2 ${t.iconBtn}`}
            aria-label="Close menu"
          >
            <X size={16} />
          </button>
        </div>

        {/* user card */}
        <div className="px-4 pt-3">
          <div
            className={`flex items-center gap-3 rounded-2xl border-2 p-3 ${
              isDark
                ? "border-white/10 bg-white/5"
                : "border-[#CBD5E1] bg-[#F8FAFC]"
            }`}
          >
            {renderAvatar("h-9 w-9")}
            <div className="min-w-0 flex-1">
              <p className={`truncate text-[14px] font-bold ${t.heading}`}>
                {user.name || "User"}
              </p>
              {user.email && (
                <p className={`truncate text-[12px] ${t.muted}`}>
                  {user.email}
                </p>
              )}
            </div>
            {profilePath && (
              <button
                onClick={() => navigate(profilePath)}
                className={`shrink-0 rounded-lg px-2.5 py-1 text-[12px] font-black uppercase tracking-wider ${t.logo}`}
              >
                Profile
              </button>
            )}
          </div>
        </div>
        {drawerExtra && <div className="px-4 pt-3">{drawerExtra}</div>}

        {renderMenu(false)}

        <div className={`shrink-0 border-t-2 p-3 ${t.line}`}>
          <button
            onClick={() => setConfirmLogout(true)}
            className={`flex h-10 w-full items-center gap-3 rounded-xl px-3 text-[14px] font-semibold text-red-500 ${
              isDark ? "hover:bg-red-500/10" : "hover:bg-red-50"
            }`}
          >
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      {/* ================= CONTENT COLUMN ================= */}
      <div className="flex min-h-screen min-w-0 flex-col">
        {/* Top bar */}
        <header
          className={`sticky top-0 z-30 border-b-2 backdrop-blur lg:pl-[72px] ${t.bar}`}
        >
          <div className="flex h-14 items-center justify-between gap-2 px-3 sm:px-4 lg:h-16 lg:px-6">
            <div className="flex min-w-0 items-center gap-2">
              <button
                onClick={() => setDrawerOpen(true)}
                className={`flex h-9 w-9 items-center justify-center rounded-xl border-2 lg:hidden ${t.iconBtn}`}
                aria-label="Open menu"
              >
                <Menu size={18} />
              </button>
              <div className="min-w-0 lg:hidden">{renderLogo()}</div>

              {/* current page – desktop */}
              <div className="hidden min-w-0 items-center gap-3 lg:flex">
                <span
                  className={`h-5 w-1 rounded-full ${isDark ? "bg-white" : "bg-[#001F3F]"}`}
                />
                <div className="min-w-0 leading-tight">
                  {activeParent && (
                    <p className="truncate text-[12px] font-bold uppercase tracking-[0.2em] text-slate-400">
                      {activeParent}
                    </p>
                  )}
                  <p
                    className={`truncate text-[16px] font-black uppercase tracking-tight ${t.heading}`}
                  >
                    {activeLink?.label || brandName}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {headerExtra && (
                <div className="hidden md:block">{headerExtra}</div>
              )}

              <button
                onClick={toggleTheme}
                className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border-2 transition ${t.iconBtn}`}
                aria-label="Toggle theme"
                title={isDark ? "Light mode" : "Dark mode"}
              >
                {isDark ? (
                  <Sun size={16} className="text-amber-400" />
                ) : (
                  <Moon size={16} />
                )}
              </button>

              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setProfileOpen((o) => !o)}
                  className={`flex items-center gap-2 rounded-xl border-2 border-transparent p-1 pr-1.5 transition ${t.hover}`}
                  aria-label="Account"
                >
                  {renderAvatar()}
                  <div className="hidden max-w-[160px] text-left md:block">
                    <p
                      className={`truncate text-[14px] font-bold leading-tight ${t.heading}`}
                    >
                      {user.name || "User"}
                    </p>
                    {user.email && (
                      <p
                        className={`truncate text-[12px] leading-tight ${t.muted}`}
                      >
                        {user.email}
                      </p>
                    )}
                  </div>
                  <ChevronDown
                    size={14}
                    className={`hidden md:block ${t.muted}`}
                  />
                </button>

                {profileOpen && (
                  <div
                    className={`absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl border-2 shadow-2xl ${t.card}`}
                  >
                    <div className={`border-b-2 px-3 py-2.5 ${t.line}`}>
                      <p
                        className={`truncate text-[14px] font-bold ${t.heading}`}
                      >
                        {user.name || "User"}
                      </p>
                      {user.email && (
                        <p className={`truncate text-[12px] ${t.muted}`}>
                          {user.email}
                        </p>
                      )}
                    </div>
                    <div className="p-1.5">
                      {profilePath && (
                        <button
                          onClick={() => navigate(profilePath)}
                          className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[14px] font-semibold ${t.item}`}
                        >
                          <UserRound size={15} /> Profile
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setProfileOpen(false);
                          setConfirmLogout(true);
                        }}
                        className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[14px] font-semibold text-red-500 ${
                          isDark ? "hover:bg-red-500/10" : "hover:bg-red-50"
                        }`}
                      >
                        <LogOut size={15} /> Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page */}
        <main
          className={`min-w-0 flex-1 pb-[calc(72px+env(safe-area-inset-bottom))] lg:pb-0 ${
            offsetContent ? "lg:pl-[72px]" : "lg:pl-2"
          } ${mainClassName}`}
        >
          <PullToRefresh disabled={!pullToRefresh}>{children}</PullToRefresh>
        </main>
      </div>

      {/* ================= BOTTOM NAV (phone / tablet) ================= */}
      {bottomItems.length > 0 && (
        <nav
          className={`fixed inset-x-0 bottom-0 z-40 border-t-2 backdrop-blur lg:hidden ${t.bar}`}
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
          aria-label="Quick navigation"
        >
          <div
            className="mx-auto grid h-16 max-w-xl px-1"
            style={{
              gridTemplateColumns: `repeat(${bottomItems.length + 1}, minmax(0, 1fr))`,
            }}
          >
            {bottomItems.map((item) => {
              const Icon = item.icon || MoreHorizontal;
              const active = isActive(item.to);
              return (
                <NavLink
                  key={item.to}
                  to={target(item)}
                  className={`flex flex-col items-center justify-center gap-1 text-[12px] font-bold transition ${
                    active ? t.activeText : t.muted
                  }`}
                >
                  <span
                    className={`flex h-7 w-11 items-center justify-center rounded-xl transition ${
                      active ? t.active : ""
                    }`}
                  >
                    <Icon size={17} />
                  </span>
                  <span className="max-w-full truncate px-1">
                    {item.short || item.label}
                  </span>
                </NavLink>
              );
            })}
            <button
              onClick={() => setDrawerOpen(true)}
              className={`flex flex-col items-center justify-center gap-1 text-[12px] font-bold ${
                moreActive ? t.activeText : t.muted
              }`}
            >
              <span
                className={`flex h-7 w-11 items-center justify-center rounded-xl ${moreActive ? t.active : ""}`}
              >
                <MoreHorizontal size={17} />
              </span>
              More
            </button>
          </div>
        </nav>
      )}

      {/* ================= LOGOUT CONFIRM ================= */}
      {confirmLogout && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#000814]/60 p-4 backdrop-blur-sm"
          onClick={() => setConfirmLogout(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-sm overflow-hidden rounded-2xl border-2 shadow-2xl ${t.card}`}
            role="dialog"
            aria-modal="true"
          >
            <div className="p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 text-red-500">
                  <LogOut size={18} />
                </div>
                <div>
                  <h2
                    className={`text-[16px] font-black uppercase tracking-tight ${t.heading}`}
                  >
                    Log{" "}
                    <span className="font-light lowercase italic">out?</span>
                  </h2>
                  <p className={`text-[12px] font-medium ${t.muted}`}>
                    You'll need to sign in again to continue.
                  </p>
                </div>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-2">
                <button
                  onClick={() => setConfirmLogout(false)}
                  className={`h-10 rounded-xl border-2 text-[12px] font-black uppercase tracking-[0.2em] transition ${t.iconBtn}`}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setConfirmLogout(false);
                    onLogout?.();
                  }}
                  className="h-10 rounded-xl bg-red-600 text-[12px] font-black uppercase tracking-[0.2em] text-white transition hover:bg-red-700 active:scale-95"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
