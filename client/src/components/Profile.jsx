// client/src/pages/Profile.jsx
import React, { useState, useEffect } from "react";
import {
  Camera,
  Save,
  Mail,
  User,
  Phone,
  Building2,
  Lock,
  MapPin,
  Trash2,
  Loader2,
  Landmark,
  FileUp,
  CheckCircle2,
  ChevronDown,
  PlayCircle,
  ShieldCheck,
  AlertTriangle,
  Clock,
  KeyRound,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";
import CompanyLocationMap from "../components/CompanyLocationMap";
import {
  tk,
  btnBase,
  PageHeading,
  SectionCard,
  TextField,
} from "../pages/clients/components/clientUi";
import { PasswordField } from "../components/Car/staffUi";

const API_URL = import.meta.env.VITE_API_BASE_URL;

// which "has…" flag each upload field turns on
const DOC_FLAG = {
  panDocument: "hasPanDocument",
  bankProofDocument: "hasBankProof",
  aadharDocument: "hasAadharDocument",
  gstDocument: "hasGstDocument",
  incorporationDocument: "hasIncorporationDocument",
};

const KYC_DOCS = [
  { field: "panDocument", label: "PAN card" },
  { field: "bankProofDocument", label: "Bank proof (cheque / passbook)" },
  { field: "aadharDocument", label: "Aadhaar card" },
  { field: "gstDocument", label: "GST certificate" },
  { field: "incorporationDocument", label: "Incorporation certificate" },
];

const KYC_STATUS = {
  VERIFIED: {
    cls: "border-green-500/30 bg-green-500/10 text-green-600",
    icon: ShieldCheck,
    label: "Verified",
  },
  PENDING: {
    cls: "border-amber-500/30 bg-amber-500/10 text-amber-600",
    icon: Clock,
    label: "Under review",
  },
  REJECTED: {
    cls: "border-red-500/30 bg-red-500/10 text-red-500",
    icon: AlertTriangle,
    label: "Rejected",
  },
  NOT_SUBMITTED: {
    cls: "border-slate-500/30 bg-slate-500/10 text-slate-500",
    icon: AlertTriangle,
    label: "Not submitted",
  },
};

const initials = (s = "") =>
  String(s || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "U";

export default function Profile() {
  const { isDark } = useTheme();
  const t = tk(isDark);
  const navigate = useNavigate();

  const [user, setUser] = useState({});
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingKyc, setSavingKyc] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(null);
  const [showHelp, setShowHelp] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    newPassword: "",
    phone: "",
    companyName: "",
    companyAddress: "",
    companyLatitude: "",
    companyLongitude: "",
  });

  const [kycData, setKycData] = useState({
    upiId: "",
    panNumber: "",
    bankAccount: "",
    accountName: "",
    bankName: "",
    branch: "",
    ifscCode: "",
    aadharNumber: "",
    gstNumber: "",
    incorporationNumber: "",
    kycStatus: "NOT_SUBMITTED",
    hasPanDocument: false,
    hasBankProof: false,
    hasAadharDocument: false,
    hasGstDocument: false,
    hasIncorporationDocument: false,
  });

  /* ---------- load ---------- */
  useEffect(() => {
    let storedUser = {};
    try {
      storedUser = JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      storedUser = {};
    }
    setUser(storedUser);
    setFormData({
      username: storedUser?.username || "",
      email: storedUser?.email || "",
      password: "",
      newPassword: "",
      phone: storedUser?.phone || "",
      companyName: storedUser?.companyName || "",
      companyAddress: storedUser?.companyAddress || "",
      companyLatitude: storedUser?.companyLatitude || "",
      companyLongitude: storedUser?.companyLongitude || "",
    });

    if (storedUser?.profileImage) {
      setImagePreview(
        storedUser.profileImage.startsWith("data:image")
          ? storedUser.profileImage
          : `data:image/png;base64,${storedUser.profileImage}`,
      );
    }

    const fetchKyc = async () => {
      try {
        const res = await fetch(`${API_URL}/api/profile/kyc`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        if (res.ok) {
          const data = await res.json();
          setKycData({
            upiId: data.upiId || "",
            panNumber: data.panNumber || "",
            bankAccount: data.bankAccount || "",
            accountName: data.accountName || "",
            bankName: data.bankName || "",
            branch: data.branch || "",
            ifscCode: data.ifscCode || "",
            aadharNumber: data.aadharNumber || "",
            gstNumber: data.gstNumber || "",
            incorporationNumber: data.incorporationNumber || "",
            kycStatus: data.kycStatus || "NOT_SUBMITTED",
            hasPanDocument: data.hasPanDocument || false,
            hasBankProof: data.hasBankProof || false,
            hasAadharDocument: data.hasAadharDocument || false,
            hasGstDocument: data.hasGstDocument || false,
            hasIncorporationDocument: data.hasIncorporationDocument || false,
          });
        }
      } catch (err) {
        console.error("KYC fetch error:", err);
      }
    };
    fetchKyc();
  }, []);

  /* ---------- handlers ---------- */
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    name in formData
      ? setFormData((p) => ({ ...p, [name]: value }))
      : setKycData((p) => ({ ...p, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
      uploadImage(reader.result);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const uploadImage = async (base64Image) => {
    setUploadingImg(true);
    try {
      const res = await fetch(`${API_URL}/api/user/upload-image`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ image: base64Image }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        localStorage.setItem("user", JSON.stringify(data.user));
        setUser(data.user);
        toast.success("Photo updated");
      } else {
        toast.error(data.message || "Photo upload failed");
      }
    } catch (err) {
      console.error(err);
      toast.error("Photo upload failed");
    } finally {
      setUploadingImg(false);
    }
  };

  const handleSaveProfile = async () => {
    if (formData.newPassword && !formData.password) {
      toast.error("Enter your current password to set a new one");
      return;
    }
    setSavingProfile(true);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_URL}/api/user/update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.message || "Update failed");
        return;
      }
      localStorage.setItem("user", JSON.stringify(data.user));
      setUser(data.user);

      if (formData.password && formData.newPassword) {
        const passRes = await fetch(`${API_URL}/api/user/change-password`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            currentPassword: formData.password,
            newPassword: formData.newPassword,
          }),
        });
        if (!passRes.ok) {
          const pd = await passRes.json().catch(() => ({}));
          toast.error(
            pd.message || "Profile saved, but the password was not changed",
          );
          return;
        }
      }

      toast.success("Profile updated");
      setTimeout(() => navigate("/car-dashboard"), 700);
    } catch (err) {
      console.error(err);
      toast.error("Could not reach the server");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSaveKyc = async () => {
    setSavingKyc(true);
    try {
      const res = await fetch(`${API_URL}/api/profile/kyc`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(kycData),
      });
      if (res.ok) {
        toast.success("KYC details sent for review");
        setKycData((p) => ({ ...p, kycStatus: "PENDING" }));
      } else {
        const d = await res.json().catch(() => ({}));
        toast.error(d.message || "Could not save KYC details");
      }
    } catch (err) {
      console.error(err);
      toast.error("Could not reach the server");
    } finally {
      setSavingKyc(false);
    }
  };

  const handleDocumentUpload = async (e, field) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const fd = new FormData();
    fd.append(field, file);
    setUploadingDoc(field);
    try {
      const res = await fetch(`${API_URL}/api/profile/kyc/documents`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: fd,
      });
      if (res.ok) {
        toast.success(`${file.name} uploaded`);
        setKycData((p) => ({ ...p, [DOC_FLAG[field]]: true }));
      } else {
        toast.error("Document upload failed");
      }
    } catch (err) {
      console.error(err);
      toast.error("Document upload failed");
    } finally {
      setUploadingDoc(null);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/delete`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (res.ok) {
        localStorage.clear();
        navigate("/");
      } else {
        toast.error("Could not delete the account");
      }
    } catch (err) {
      console.error(err);
      toast.error("Could not reach the server");
    } finally {
      setDeleting(false);
    }
  };

  /* ---------- ui ---------- */
  const field = (name, label, icon, props = {}) => (
    <TextField
      isDark={isDark}
      label={label}
      icon={icon}
      name={name}
      value={(name in formData ? formData[name] : kycData[name]) ?? ""}
      onChange={handleInputChange}
      {...props}
    />
  );

  const ks = KYC_STATUS[kycData.kycStatus] || KYC_STATUS.NOT_SUBMITTED;
  const KsIcon = ks.icon;
  const docsDone = KYC_DOCS.filter((d) => kycData[DOC_FLAG[d.field]]).length;
  const hasCoords = formData.companyLatitude && formData.companyLongitude;

  return (
    <div className="min-h-screen lg:ml-16">
      <Toaster
        position="top-right"
        toastOptions={{ style: { fontSize: 14 } }}
      />
      <div className="mx-auto max-w-[1100px] space-y-4 sm:space-y-5">
        <PageHeading
          isDark={isDark}
          title="Profile"
          accent="settings."
          subtitle="Your account, garage details, payout KYC and security."
        />

        {/* identity hero */}
        <section className="relative overflow-hidden rounded-2xl border-2 border-white/5 bg-gradient-to-br from-[#001F3F] to-[#000814] p-4 text-white shadow-2xl shadow-black/20 sm:p-5">
          <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rotate-12 rounded-3xl border-2 border-white/5" />
          <div className="relative flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
            <div className="relative shrink-0">
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Profile"
                  className="h-20 w-20 rounded-2xl border-2 border-white/20 object-cover"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white text-[16px] font-black text-[#001F3F]">
                  {initials(formData.username || formData.companyName)}
                </div>
              )}
              <label
                className="absolute -bottom-2 -right-2 flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl border-2 border-[#001F3F] bg-white text-[#001F3F] shadow-lg transition hover:bg-blue-50"
                title="Change photo"
              >
                {uploadingImg ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Camera size={14} />
                )}
                <input
                  type="file"
                  className="hidden"
                  onChange={handleImageChange}
                  accept="image/*"
                  disabled={uploadingImg}
                />
              </label>
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-[16px] font-black uppercase tracking-tight">
                {formData.companyName || formData.username || "Your garage"}
              </h2>
              <p className="truncate text-[14px] text-white/60">
                {formData.username}
                {formData.email ? ` · ${formData.email}` : ""}
              </p>
              <div className="mt-2 flex flex-wrap justify-center gap-1.5 sm:justify-start">
                <span className="inline-flex items-center gap-1 rounded-lg border border-white/15 bg-white/10 px-2 py-0.5 text-[12px] font-black uppercase tracking-wider">
                  <KsIcon size={12} /> KYC {ks.label}
                </span>
                {user?.plan && (
                  <span className="inline-flex items-center gap-1 rounded-lg border border-white/15 bg-white/10 px-2 py-0.5 text-[12px] font-black uppercase tracking-wider">
                    {user.plan} plan
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* account & garage */}
        <SectionCard
          isDark={isDark}
          icon={User}
          step="01"
          title="Account & garage"
          subtitle="Shown on invoices, payslips and the MotorDesk app"
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {field("username", "Username", <User size={12} />)}
            {field("email", "Email address", <Mail size={12} />, {
              type: "email",
            })}
            {field("phone", "Phone number", <Phone size={12} />, {
              type: "tel",
              inputMode: "tel",
            })}
            {field("companyName", "Garage name", <Building2 size={12} />)}
            {field("companyAddress", "Garage address", <MapPin size={12} />, {
              className: "md:col-span-2",
              placeholder: "Shop no, street, area, city, PIN",
            })}
          </div>
        </SectionCard>

        {/* location */}
        <SectionCard
          isDark={isDark}
          icon={MapPin}
          step="02"
          title="Garage location"
          subtitle="So customers find you in the app"
          right={
            hasCoords ? (
              <span className="hidden items-center gap-1 rounded-lg border border-green-500/30 bg-green-500/10 px-2 py-0.5 text-[12px] font-black uppercase tracking-wider text-green-600 sm:inline-flex">
                <CheckCircle2 size={12} /> Set
              </span>
            ) : null
          }
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {field("companyLatitude", "Latitude", null, {
                placeholder: "13.0623",
                inputMode: "decimal",
                inputClassName: "font-mono",
              })}
              {field("companyLongitude", "Longitude", null, {
                placeholder: "77.5612",
                inputMode: "decimal",
                inputClassName: "font-mono",
              })}
            </div>

            <div className={`overflow-hidden rounded-xl border-2 ${t.inner}`}>
              <button
                type="button"
                onClick={() => setShowHelp((v) => !v)}
                aria-expanded={showHelp}
                className={`flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-[14px] font-black ${t.heading}`}
              >
                How do I find latitude & longitude?
                <ChevronDown
                  size={16}
                  className={`shrink-0 text-slate-400 transition-transform ${showHelp ? "rotate-180" : ""}`}
                />
              </button>
              {showHelp && (
                <div
                  className={`space-y-3 border-t-2 px-3 py-3 text-[14px] ${t.line} ${t.body}`}
                >
                  <p>
                    <b className={t.heading}>On a computer:</b> open Google
                    Maps, find your garage, right-click the exact spot and click
                    the numbers at the top to copy them.
                  </p>
                  <p>
                    <b className={t.heading}>On a phone:</b> open Google Maps,
                    press and hold on your garage to drop a pin. The numbers
                    appear in the search bar.
                  </p>
                  <p
                    className={`rounded-lg border px-2.5 py-2 font-mono text-[12px] ${t.inner}`}
                  >
                    12.9716, 77.5946 → first = Latitude, second = Longitude
                  </p>
                  <a
                    href="https://www.youtube.com/watch?v=GUenyBF9C5I"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${btnBase} h-9 border-2 px-3 ${t.btnGhost}`}
                  >
                    <PlayCircle size={14} className="text-red-500" /> Watch
                    tutorial
                  </a>
                </div>
              )}
            </div>

            <div className={`overflow-hidden rounded-xl border-2 ${t.line}`}>
              <CompanyLocationMap
                latitude={formData.companyLatitude}
                longitude={formData.companyLongitude}
                companyName={formData.companyName}
              />
            </div>
          </div>
        </SectionCard>

        {/* password */}
        <SectionCard
          isDark={isDark}
          icon={KeyRound}
          step="03"
          title="Change password"
          subtitle="Leave both empty to keep your current password"
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <PasswordField
              isDark={isDark}
              label="Current password"
              icon={<Lock size={12} />}
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Current password"
              autoComplete="current-password"
            />
            <PasswordField
              isDark={isDark}
              label="New password"
              icon={<Lock size={12} />}
              name="newPassword"
              value={formData.newPassword}
              onChange={handleInputChange}
              placeholder="New password"
              autoComplete="new-password"
            />
          </div>
        </SectionCard>

        {/* save bar */}
        <div
          className={`sticky z-20 flex items-center justify-between gap-3 rounded-2xl border-2 p-3 shadow-xl lg:static lg:shadow-none ${t.card}`}
          style={{ bottom: "calc(66px + env(safe-area-inset-bottom))" }}
        >
          <p className={`hidden text-[14px] sm:block ${t.muted}`}>
            Saves account, location and password.
          </p>
          <button
            type="button"
            onClick={handleSaveProfile}
            disabled={savingProfile}
            className={`${btnBase} h-11 w-full px-6 shadow-lg sm:w-auto ${t.btnPrimary}`}
          >
            {savingProfile ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Save size={14} />
            )}
            {savingProfile ? "Saving…" : "Save changes"}
          </button>
        </div>

        {/* KYC */}
        <SectionCard
          isDark={isDark}
          icon={Landmark}
          step="04"
          title="Payout KYC"
          subtitle="Bank details for marketplace payouts"
          right={
            <span
              className={`inline-flex shrink-0 items-center gap-1 rounded-lg border px-2 py-0.5 text-[12px] font-black uppercase tracking-wider ${ks.cls}`}
            >
              <KsIcon size={12} />{" "}
              <span className="hidden sm:inline">{ks.label}</span>
            </span>
          }
        >
          <div className="space-y-5">
            <div>
              <p className="mb-2 text-[12px] font-bold uppercase tracking-wider text-slate-400">
                Bank account
              </p>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {field("accountName", "Account holder name", null, {
                  placeholder: "As printed on passbook",
                })}
                {field("bankAccount", "Account number", null, {
                  placeholder: "1234567890",
                  inputMode: "numeric",
                  inputClassName: "font-mono",
                })}
                {field("bankName", "Bank name", null, {
                  placeholder: "HDFC Bank",
                })}
                {field("branch", "Branch", null, {
                  placeholder: "Indiranagar",
                })}
                {field("ifscCode", "IFSC code", null, {
                  placeholder: "HDFC0001234",
                  inputClassName: "font-mono uppercase",
                })}
                {field("upiId", "UPI ID", null, { placeholder: "name@upi" })}
              </div>
            </div>

            <div>
              <p className="mb-2 text-[12px] font-bold uppercase tracking-wider text-slate-400">
                Identity & business
              </p>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {field("panNumber", "PAN number", null, {
                  placeholder: "ABCDE1234F",
                  inputClassName: "font-mono uppercase",
                })}
                {field("aadharNumber", "Aadhaar number", null, {
                  placeholder: "0000 0000 0000",
                  inputMode: "numeric",
                  inputClassName: "font-mono",
                })}
                {field("gstNumber", "GST number", null, {
                  placeholder: "22AAAAA0000A1Z5",
                  inputClassName: "font-mono uppercase",
                })}
                {field(
                  "incorporationNumber",
                  "Incorporation certificate no.",
                  null,
                  {
                    placeholder: "U12345KA2026PTC000000",
                    inputClassName: "font-mono uppercase",
                  },
                )}
              </div>
            </div>

            <div>
              <p className="mb-2 text-[12px] font-bold uppercase tracking-wider text-slate-400">
                Documents · {docsDone}/{KYC_DOCS.length} uploaded
              </p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {KYC_DOCS.map((d) => {
                  const done = kycData[DOC_FLAG[d.field]];
                  const busy = uploadingDoc === d.field;
                  return (
                    <label
                      key={d.field}
                      className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 p-2.5 transition ${
                        done
                          ? "border-green-500/40 bg-green-500/5"
                          : `${t.inner} ${isDark ? "hover:border-white/30" : "hover:border-[#001F3F]/40"}`
                      } ${busy ? "pointer-events-none opacity-70" : ""}`}
                    >
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${done ? "bg-green-500/10 text-green-600" : t.chipNavy}`}
                      >
                        {busy ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : done ? (
                          <CheckCircle2 size={14} />
                        ) : (
                          <FileUp size={14} />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span
                          className={`block truncate text-[14px] font-black ${t.heading}`}
                        >
                          {d.label}
                        </span>
                        <span
                          className={`block text-[12px] ${done ? "text-green-600" : t.muted}`}
                        >
                          {busy
                            ? "Uploading…"
                            : done
                              ? "Uploaded · tap to replace"
                              : "Tap to upload"}
                        </span>
                      </span>
                      <input
                        type="file"
                        className="hidden"
                        accept=".jpg,.jpeg,.png,.pdf"
                        onChange={(e) => handleDocumentUpload(e, d.field)}
                      />
                    </label>
                  );
                })}
              </div>
            </div>

            <button
              type="button"
              onClick={handleSaveKyc}
              disabled={savingKyc}
              className={`${btnBase} h-11 w-full px-6 sm:w-auto ${t.btnPrimary}`}
            >
              {savingKyc ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <ShieldCheck size={14} />
              )}
              {savingKyc ? "Saving…" : "Save KYC details"}
            </button>
          </div>
        </SectionCard>

        {/* danger zone */}
        <section className="overflow-hidden rounded-2xl border-2 border-red-500/30">
          <div className="flex items-center gap-3 border-b-2 border-red-500/20 bg-red-500/10 px-4 py-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-600 text-white">
              <Trash2 size={14} />
            </span>
            <div>
              <h2 className="text-[14px] font-black uppercase tracking-tight text-red-600">
                Delete account
              </h2>
              <p className={`text-[12px] ${t.muted}`}>
                Your account and all garage data will be removed for good.
              </p>
            </div>
          </div>
          <div
            className={`flex flex-col gap-2 p-4 sm:flex-row ${isDark ? "bg-[#001F3F]" : "bg-white"}`}
          >
            <input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Type DELETE to confirm"
              aria-label="Type DELETE to confirm"
              className={`h-11 min-w-0 flex-1 rounded-xl border-2 px-3.5 font-mono text-[14px] font-semibold outline-none transition ${t.input}`}
            />
            <button
              type="button"
              onClick={handleDeleteAccount}
              disabled={confirmText.trim() !== "DELETE" || deleting}
              className={`${btnBase} h-11 bg-red-600 px-5 text-white hover:bg-red-700`}
            >
              {deleting ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Trash2 size={14} />
              )}
              {deleting ? "Deleting…" : "Delete my account"}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
