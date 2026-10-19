// client/src/pages/PrivacyPolicy.jsx
// Public URL: https://themotordesk.com/privacy-policy  ← use this in Play Console
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiShield,
  FiChevronLeft,
  FiUser,
  FiDatabase,
  FiSettings,
  FiShare2,
  FiClock,
  FiTrash2,
  FiLock,
  FiCheckCircle,
  FiSmartphone,
  FiUsers,
  FiRefreshCw,
  FiMail,
  FiPhone,
  FiMapPin,
  FiHeadphones,
  FiSun,
  FiMoon,
} from "react-icons/fi";
import { useTheme } from "../contexts/ThemeContext";

/* ================================================================
   COMPANY / CONTACT DETAILS
   ================================================================ */
const COMPANY = {
  appName: "MotorDesk",
  brand: "The Motor Desk",
  operator: "Abacco Technology",
  website: "https://themotordesk.com",
  contactName: "The Motor Desk Support Team",
  email: "support@themotordesk.com",
  phone: "+91 7795692753",
  phoneHref: "tel:+917795692753",
  address:
    "No 12, 13 & 12/A, Kirthan Arcade, 3rd Floor, Aditya Nagar, Bangalore - 560097, Karnataka, India",
};
const LAST_UPDATED = "19 October 2026";

/* ================================================================
   AT A GLANCE
   ================================================================ */
const HIGHLIGHTS = [
  {
    icon: FiShield,
    title: "We never sell your data",
    text: "Your business and customer data is never sold or rented.",
  },
  {
    icon: FiLock,
    title: "Encrypted & hashed",
    text: "HTTPS everywhere. Passwords are stored only as secure hashes.",
  },
  {
    icon: FiTrash2,
    title: "Delete any time",
    text: "Delete your account and data from Profile or by email.",
  },
  {
    icon: FiCheckCircle,
    title: "No ads, no tracking",
    text: "No third-party ads and no advertising IDs.",
  },
];

/* ================================================================
   SECTIONS
   ================================================================ */
const SECTIONS = [
  {
    id: "who-we-are",
    icon: FiUser,
    title: "Who we are",
    body: (
      <>
        <p>
          {COMPANY.brand} ("{COMPANY.appName}", "we", "us", "our") is a garage
          management software (CRM) operated by {COMPANY.operator}, Bangalore,
          India. It is available at {COMPANY.website} and as mobile apps for
          Android and iOS (together, the "Service").
        </p>
        <p>
          This Privacy Policy explains what personal data we collect, how we use
          it, who we share it with, and the choices and rights you have. It
          applies to garage owners, their staff, and the vehicle owners
          (customers) whose details garages enter into the Service.
        </p>
      </>
    ),
  },
  {
    id: "information-we-collect",
    icon: FiDatabase,
    title: "Information we collect",
    body: (
      <div className="grid gap-3 sm:grid-cols-2">
        <InfoCard title="Account information">
          Name, username, email, phone number and password (stored only as a
          secure hash). Business name, address, GST number, business location,
          subscription plan and profile image.
        </InfoCard>
        <InfoCard title="Verification & payouts (optional)">
          Only if you request garage verification or referral payouts: PAN,
          Aadhaar, GST and registration details, bank account / IFSC / UPI ID
          and copies of related documents.
        </InfoCard>
        <InfoCard title="Staff information">
          Staff name, role, phone, email, joining date, salary, leave and
          payroll records, and staff login credentials you create.
        </InfoCard>
        <InfoCard title="Customer & vehicle data">
          Details garages enter about their customers: name, phone, email,
          address, vehicle make/model/year, registration number, VIN, photos,
          service history, estimates, invoices and reminders. The garage
          controls this data; we process it on the garage's behalf.
        </InfoCard>
        <InfoCard title="Payments">
          Processed by Razorpay. We receive payment ID, order ID, amount, status
          and billing details. We never collect or store card numbers, UPI PIN
          or net-banking passwords.
        </InfoCard>
        <InfoCard title="Photos & camera">
          With your permission, the camera / gallery is used for vehicle and
          damage photos, documents, and scanning number plates or RC details
          (OCR) — only when you choose to.
        </InfoCard>
        <InfoCard title="Marketplace bookings">
          Booking requests from our partner customer app: customer name, phone,
          vehicle details, pickup/drop address, notes and selected services.
        </InfoCard>
        <InfoCard title="WhatsApp messages">
          Approvals, invoices, reminders and review requests sent to opted-in
          customers via the WhatsApp Business Platform, with delivery status and
          customer replies.
        </InfoCard>
        <InfoCard title="Technical data" wide>
          Device type, OS, app version, IP address, logs and error data, and a
          sign-in token stored on your device so you stay logged in.
        </InfoCard>
      </div>
    ),
  },
  {
    id: "how-we-use",
    icon: FiSettings,
    title: "How we use your information",
    body: (
      <ul>
        <li>Create and manage your account and keep you signed in securely.</li>
        <li>
          Provide the Service: job cards, billing, GST invoices, inventory,
          staff & salary, reports and reminders.
        </li>
        <li>Process subscription payments and issue payment invoices.</li>
        <li>Deliver marketplace bookings and real-time booking alerts.</li>
        <li>Send the WhatsApp, SMS and email messages you request.</li>
        <li>Verify garages and process referral payouts.</li>
        <li>
          Provide support, prevent fraud and misuse, and keep the Service
          secure.
        </li>
        <li>Comply with legal, tax and accounting obligations.</li>
      </ul>
    ),
  },
  {
    id: "sharing",
    icon: FiShare2,
    title: "How we share information",
    body: (
      <>
        <p>
          We <strong>do not sell</strong> your personal data. We share it only
          as needed to run the Service:
        </p>
        <ul>
          <li>
            <strong>Razorpay</strong> — to process payments.
          </li>
          <li>
            <strong>WhatsApp Business Platform (Meta) & email providers</strong>{" "}
            — to deliver messages you send.
          </li>
          <li>
            <strong>Cloud hosting & storage</strong> (e.g. Cloudflare R2) — to
            store your data securely.
          </li>
          <li>
            <strong>Marketplace customers</strong> — booking status and your
            garage name, address and phone are shared with the customer who
            booked.
          </li>
          <li>
            <strong>Referral partners</strong> — only that you registered or
            paid using their referral code.
          </li>
          <li>
            <strong>Authorities</strong> — when required by law, court order or
            to protect users' safety.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "retention",
    icon: FiClock,
    title: "Data retention",
    body: (
      <p>
        We keep your data while your account is active. When you delete your
        account, your account and business data (customers, services, invoices,
        staff and related records) are removed from our active systems. Limited
        records such as payment and tax invoices may be kept for the period
        required by Indian law, then deleted.
      </p>
    ),
  },
  {
    id: "deletion",
    icon: FiTrash2,
    title: "Account & data deletion",
    body: (
      <>
        <p>You can delete your account and associated data at any time:</p>
        <ul>
          <li>
            <strong>In the app / website:</strong> Profile → Delete Account.
          </li>
          <li>
            <strong>By email:</strong> write to{" "}
            <a href={`mailto:${COMPANY.email}?subject=Delete%20my%20account`}>
              {COMPANY.email}
            </a>{" "}
            from your registered email with the subject "Delete my account". We
            process requests within 30 days.
          </li>
        </ul>
        <p>
          Customers of a garage who want their details removed can contact that
          garage, or contact us and we will help.
        </p>
      </>
    ),
  },
  {
    id: "security",
    icon: FiLock,
    title: "Security",
    body: (
      <p>
        All data is sent over encrypted connections (HTTPS/TLS). Passwords are
        stored using one-way hashing, access is protected by signed login
        tokens, and data is visible only to your account and the staff you
        authorise. No system is 100% secure, but we follow reasonable industry
        practices to protect your data.
      </p>
    ),
  },
  {
    id: "your-rights",
    icon: FiCheckCircle,
    title: "Your rights",
    body: (
      <p>
        Under applicable law, including India's Digital Personal Data Protection
        Act, 2023, you can access, correct or update your data, request
        deletion, withdraw consent (for example, for WhatsApp messages) and
        raise a grievance. Most details can be edited directly in your Profile;
        for anything else, contact us below.
      </p>
    ),
  },
  {
    id: "permissions",
    icon: FiSmartphone,
    title: "App permissions",
    body: (
      <ul>
        <li>
          <strong>Camera</strong> — vehicle / damage photos and document or
          number-plate scanning.
        </li>
        <li>
          <strong>Photos / storage</strong> — upload images and save invoices
          you download.
        </li>
        <li>
          <strong>Internet</strong> — sync your data with our servers.
        </li>
        <li>
          <strong>Notifications / sound</strong> — alert you about new
          marketplace bookings.
        </li>
      </ul>
    ),
  },
  {
    id: "children",
    icon: FiUsers,
    title: "Children",
    body: (
      <p>
        The Service is meant for businesses and is not directed to anyone under
        18. We do not knowingly collect personal data from children.
      </p>
    ),
  },
  {
    id: "changes",
    icon: FiRefreshCw,
    title: "Changes to this policy",
    body: (
      <p>
        We may update this policy from time to time. The latest version is
        always on this page with its "Last updated" date. For significant
        changes we will notify you in the app or by email.
      </p>
    ),
  },
];

/* ================================================================
   SMALL COMPONENTS
   ================================================================ */
function InfoCard({ title, children, wide }) {
  return (
    <div
      className={`rounded-xl border p-4 border-[color:var(--pp-line)] bg-[color:var(--pp-soft)] ${
        wide ? "sm:col-span-2" : ""
      }`}
    >
      <p className="mb-1 text-[11px] font-black uppercase tracking-[0.15em] text-[color:var(--pp-head)]">
        {title}
      </p>
      <p className="!mt-0 text-[14px] leading-relaxed">{children}</p>
    </div>
  );
}

function ContactTile({ icon: Icon, label, value, href }) {
  const content = (
    <>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white">
        <Icon size={18} />
      </span>
      <span className="min-w-0">
        <span className="block text-[10px] font-black uppercase tracking-[0.2em] text-sky-300">
          {label}
        </span>
        <span className="mt-1 block break-words text-[14px] font-semibold text-white">
          {value}
        </span>
      </span>
    </>
  );
  const cls =
    "flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:bg-white/10";
  return href ? (
    <a href={href} className={cls}>
      {content}
    </a>
  ) : (
    <div className={cls}>{content}</div>
  );
}

/* ================================================================
   PAGE
   ================================================================ */
export default function PrivacyPolicy() {
  const { isDark, toggleTheme } = useTheme() || {};
  const navigate = useNavigate();
  const [active, setActive] = useState(SECTIONS[0].id);

  useEffect(() => {
    document.title = `Privacy Policy | ${COMPANY.brand}`;
    window.scrollTo(0, 0);
  }, []);

  // Highlight the section currently on screen in the sidebar
  useEffect(() => {
    const ids = [...SECTIONS.map((s) => s.id), "contact"];
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length) setActive(visible[0].target.id);
      },
      { rootMargin: "-20% 0px -70% 0px" },
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, []);

  const vars = isDark
    ? {
        "--pp-bg": "#000814",
        "--pp-card": "#001F3F",
        "--pp-soft": "rgba(255,255,255,0.04)",
        "--pp-line": "rgba(255,255,255,0.10)",
        "--pp-head": "#FFFFFF",
        "--pp-text": "#CBD5E1",
        "--pp-muted": "#94A3B8",
        "--pp-accent": "#7DD3FC",
      }
    : {
        "--pp-bg": "#F8FAFC",
        "--pp-card": "#FFFFFF",
        "--pp-soft": "#F8FAFC",
        "--pp-line": "#E2E8F0",
        "--pp-head": "#001F3F",
        "--pp-text": "#334155",
        "--pp-muted": "#64748B",
        "--pp-accent": "#1D4ED8",
      };

  const goBack = () =>
    window.history.length > 1 ? navigate(-1) : navigate("/");

  return (
    <div
      style={vars}
      className="min-h-screen bg-[color:var(--pp-bg)] text-[color:var(--pp-text)] transition-colors duration-500"
    >
      {/* ---------------- HERO ---------------- */}
      <header className="relative overflow-hidden bg-gradient-to-br from-[#001F3F] to-[#000814] text-white">
        <div className="pointer-events-none absolute -right-20 -top-10 h-72 w-72 rotate-12 rounded-[48px] border-2 border-white/5" />
        <div className="pointer-events-none absolute -bottom-24 left-10 h-56 w-56 rotate-45 rounded-[40px] border-2 border-white/5" />

        <div className="relative mx-auto max-w-6xl px-4 pb-14 pt-6 sm:px-6 sm:pb-20">
          <div className="mb-10 flex items-center justify-between">
            <button
              type="button"
              onClick={goBack}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border-2 border-white/10 px-3 text-[11px] font-black uppercase tracking-[0.15em] text-slate-200 transition hover:bg-white/5"
            >
              <FiChevronLeft size={14} /> Back
            </button>
            {toggleTheme && (
              <button
                type="button"
                onClick={toggleTheme}
                aria-label="Toggle theme"
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border-2 border-white/10 transition hover:bg-white/5"
              >
                {isDark ? (
                  <FiSun size={14} className="text-amber-400" />
                ) : (
                  <FiMoon size={14} />
                )}
              </button>
            )}
          </div>

          <span className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.2em]">
            <FiShield size={12} /> Legal · Privacy
          </span>
          <h1 className="mt-4 text-3xl font-black uppercase tracking-tight sm:text-5xl">
            Privacy <span className="font-light lowercase italic">policy.</span>
          </h1>
          <p className="mt-4 max-w-2xl text-[15px] text-white/70">
            How {COMPANY.brand} collects, uses and protects the data of garage
            owners, staff and their customers.
          </p>
          <p className="mt-6 text-[11px] font-bold uppercase tracking-[0.2em] text-white/50">
            Last updated · {LAST_UPDATED}
          </p>
        </div>
      </header>

      {/* ---------------- AT A GLANCE ---------------- */}
      <section className="relative mx-auto -mt-8 max-w-6xl px-4 sm:-mt-10 sm:px-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {HIGHLIGHTS.map(({ icon: Icon, title, text }) => (
            <div
              key={title}
              className="rounded-2xl border-2 border-[color:var(--pp-line)] bg-[color:var(--pp-card)] p-4 shadow-lg shadow-black/5"
            >
              <span className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-[#001F3F] text-white">
                <Icon size={16} />
              </span>
              <p className="text-[12px] font-black uppercase tracking-[0.12em] text-[color:var(--pp-head)]">
                {title}
              </p>
              <p className="mt-1 text-[13px] text-[color:var(--pp-muted)]">
                {text}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------------- BODY ---------------- */}
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[240px_1fr]">
        {/* Sidebar contents */}
        <aside className="hidden lg:block">
          <nav className="sticky top-6" aria-label="Contents">
            <p className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-[color:var(--pp-muted)]">
              On this page
            </p>
            <ol className="space-y-1 border-l-2 border-[color:var(--pp-line)]">
              {[...SECTIONS, { id: "contact", title: "Contact us" }].map(
                (s, i) => (
                  <li key={s.id}>
                    <a
                      href={`#${s.id}`}
                      className={`-ml-0.5 block border-l-2 py-1.5 pl-4 text-[13px] transition ${
                        active === s.id
                          ? "border-[color:var(--pp-accent)] font-bold text-[color:var(--pp-head)]"
                          : "border-transparent text-[color:var(--pp-muted)] hover:text-[color:var(--pp-head)]"
                      }`}
                    >
                      {String(i + 1).padStart(2, "0")} · {s.title}
                    </a>
                  </li>
                ),
              )}
            </ol>
          </nav>
        </aside>

        {/* Sections */}
        <main className="min-w-0 space-y-5">
          {SECTIONS.map(({ id, icon: Icon, title, body }, i) => (
            <section
              key={id}
              id={id}
              className="scroll-mt-6 rounded-2xl border-2 border-[color:var(--pp-line)] bg-[color:var(--pp-card)] p-5 sm:p-7"
            >
              <div className="mb-4 flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#001F3F] text-white">
                  <Icon size={18} />
                </span>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[color:var(--pp-muted)]">
                    Section {String(i + 1).padStart(2, "0")}
                  </p>
                  <h2 className="text-lg font-black uppercase tracking-tight text-[color:var(--pp-head)] sm:text-xl">
                    {title}
                  </h2>
                </div>
              </div>
              <div
                className="text-[15px] leading-relaxed
                  [&_a]:font-semibold [&_a]:text-[color:var(--pp-accent)] [&_a]:underline [&_a]:underline-offset-4
                  [&_li]:pl-1 [&_p+p]:mt-3 [&_p+ul]:mt-3 [&_strong]:text-[color:var(--pp-head)]
                  [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5 [&_ul+p]:mt-3"
              >
                {body}
              </div>
            </section>
          ))}

          {/* ---------------- CONTACT ---------------- */}
          <section
            id="contact"
            className="relative scroll-mt-6 overflow-hidden rounded-2xl bg-gradient-to-br from-[#001F3F] to-[#000814] p-5 text-white sm:p-8"
          >
            <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rotate-12 rounded-[40px] border-2 border-white/5" />
            <div className="relative">
              <div className="mb-6 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#001F3F]">
                  <FiHeadphones size={18} />
                </span>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">
                    Contact us · Grievance Officer
                  </p>
                  <h2 className="text-lg font-black uppercase tracking-tight sm:text-xl">
                    {COMPANY.contactName}
                  </h2>
                </div>
              </div>

              <p className="mb-6 max-w-2xl text-[14px] text-white/70">
                For any question, request or complaint about your data or this
                policy, reach out to us. We respond to privacy requests within
                30 days.
              </p>

              <div className="grid gap-3 sm:grid-cols-2">
                <ContactTile
                  icon={FiPhone}
                  label="Operational Phone"
                  value={COMPANY.phone}
                  href={COMPANY.phoneHref}
                />
                <ContactTile
                  icon={FiMail}
                  label="System Support"
                  value={COMPANY.email}
                  href={`mailto:${COMPANY.email}`}
                />
                <div className="sm:col-span-2">
                  <ContactTile
                    icon={FiMapPin}
                    label="Physical Infrastructure"
                    value={COMPANY.address}
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(COMPANY.address)}`}
                  />
                </div>
              </div>
            </div>
          </section>

          <p className="pt-4 text-center text-[11px] font-bold uppercase tracking-[0.2em] text-[color:var(--pp-muted)]">
            © {new Date().getFullYear()} {COMPANY.brand} · {COMPANY.operator}
          </p>
        </main>
      </div>
    </div>
  );
}
