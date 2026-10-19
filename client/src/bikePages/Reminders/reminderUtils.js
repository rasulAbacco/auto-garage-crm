// bikePages/Reminders/reminderUtils.js
// Shared date helpers for the bike reminder screens

export const startOfDay = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

export const daysFromToday = (date) =>
  Math.round((startOfDay(date) - startOfDay(new Date())) / 86400000);

// "past" | "today" | "tomorrow" | "week" | "later"
export const bucketOf = (date) => {
  const d = daysFromToday(date);
  if (d < 0) return "past";
  if (d === 0) return "today";
  if (d === 1) return "tomorrow";
  if (d <= 7) return "week";
  return "later";
};

export const relativeLabel = (date) => {
  const d = daysFromToday(date);
  if (d === 0) return "Today";
  if (d === 1) return "Tomorrow";
  if (d === -1) return "Yesterday";
  if (d < 0) return `${Math.abs(d)} days ago`;
  if (d < 30) return `In ${d} days`;
  const months = Math.round(d / 30);
  return `In ~${months} month${months > 1 ? "s" : ""}`;
};

export const formatDate = (date) =>
  new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

export const formatTime = (date) => {
  const d = new Date(date);
  if (d.getHours() === 0 && d.getMinutes() === 0) return ""; // no time chosen
  return d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
};

// Local "YYYY-MM-DD" and "HH:mm" for date/time inputs
const pad = (n) => String(n).padStart(2, "0");
export const toDateInput = (date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
export const toTimeInput = (date) => {
  const d = new Date(date);
  if (d.getHours() === 0 && d.getMinutes() === 0) return "";
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

// Combine local date + optional time into an ISO string for the API
export const toISO = (dateStr, timeStr) =>
  new Date(`${dateStr}T${timeStr || "00:00"}`).toISOString();

export const addMonths = (months) => {
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return toDateInput(d);
};

export const alertDatesFor = (serviceDate) => {
  const d15 = new Date(serviceDate);
  d15.setDate(d15.getDate() - 15);
  const d7 = new Date(serviceDate);
  d7.setDate(d7.getDate() - 7);
  return { d15, d7 };
};

export const BUCKET_STYLE = {
  past: {
    label: "Overdue",
    light: "bg-rose-50 text-rose-700 ring-rose-600/20",
    dark: "bg-rose-500/10 text-rose-300 ring-rose-400/20",
  },
  today: {
    label: "Today",
    light: "bg-amber-50 text-amber-700 ring-amber-600/20",
    dark: "bg-amber-500/10 text-amber-300 ring-amber-400/20",
  },
  tomorrow: {
    label: "Tomorrow",
    light: "bg-blue-50 text-blue-700 ring-blue-600/20",
    dark: "bg-blue-500/10 text-blue-300 ring-blue-400/20",
  },
  week: {
    label: "This week",
    light: "bg-indigo-50 text-indigo-700 ring-indigo-600/20",
    dark: "bg-indigo-500/10 text-indigo-300 ring-indigo-400/20",
  },
  later: {
    label: "Upcoming",
    light: "bg-slate-100 text-slate-700 ring-slate-500/20",
    dark: "bg-white/5 text-slate-300 ring-white/10",
  },
};
