// client/src/pages/clients/components/PersonalInfoSection.jsx
import React from "react";
import { FiUser, FiPhone, FiMail, FiMapPin, FiUsers } from "react-icons/fi";
import { SectionCard, TextField } from "./clientUi";

export default function PersonalInfoSection({
  form,
  setForm,
  isDark,
  children,
}) {
  const set = (key) => (e) => {
    const v = e.target.value;
    setForm((prev) => ({ ...prev, [key]: v }));
  };

  return (
    <SectionCard
      isDark={isDark}
      icon={FiUser}
      step="01"
      title="Personal information"
      subtitle="Customer contact details"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField
          isDark={isDark}
          icon={<FiUser size={12} />}
          label="Full name"
          required
          value={form.fullName || ""}
          onChange={set("fullName")}
          placeholder="Customer name"
          autoComplete="name"
        />
        <TextField
          isDark={isDark}
          icon={<FiPhone size={12} />}
          label="Phone number"
          required
          type="tel"
          inputMode="tel"
          value={form.phone || ""}
          onChange={set("phone")}
          placeholder="10-digit mobile"
          autoComplete="tel"
        />
        <TextField
          isDark={isDark}
          icon={<FiMail size={12} />}
          label="Email"
          type="email"
          value={form.email || ""}
          onChange={set("email")}
          placeholder="name@example.com"
          autoComplete="email"
        />
        <TextField
          isDark={isDark}
          icon={<FiUsers size={12} />}
          label="Vehicle received by"
          value={form.receiverName ?? form.staffPerson ?? ""}
          onChange={set("receiverName")}
          placeholder="Who received the vehicle"
        />
        <TextField
          isDark={isDark}
          className="sm:col-span-2"
          icon={<FiMapPin size={12} />}
          label="Address"
          value={form.address || ""}
          onChange={set("address")}
          placeholder="House, street, area, city"
          autoComplete="street-address"
        />
      </div>
      {children}
    </SectionCard>
  );
}
