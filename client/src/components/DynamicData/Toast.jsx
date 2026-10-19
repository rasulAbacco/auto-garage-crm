import { useEffect } from "react";
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  X,
} from "lucide-react";

/**
 * Lightweight, non-blocking toast notifications (MotorDesk navy theme).
 *
 * Usage:
 *   const [toasts, setToasts] = useState([]);
 *   const showToast = (message, type = "info") => {
 *     const id = Date.now() + Math.random();
 *     setToasts((prev) => [...prev, { id, message, type }]);
 *   };
 *   <ToastStack toasts={toasts} onDismiss={(id) => setToasts((p) => p.filter(t => t.id !== id))} isDark={isDark} />
 */

const TYPE_STYLES = {
  success: {
    icon: CheckCircle2,
    chip: "bg-green-500/15 text-green-500",
    bar: "bg-green-500",
  },
  error: {
    icon: AlertCircle,
    chip: "bg-red-500/15 text-red-500",
    bar: "bg-red-500",
  },
  warning: {
    icon: AlertTriangle,
    chip: "bg-amber-500/15 text-amber-500",
    bar: "bg-amber-500",
  },
  info: {
    icon: Info,
    chip: "bg-blue-500/15 text-blue-500",
    bar: "bg-blue-500",
  },
};

const ToastItem = ({ toast, onDismiss, isDark }) => {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), toast.duration || 4500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast.id, toast.duration]);

  const style = TYPE_STYLES[toast.type] || TYPE_STYLES.info;
  const Icon = style.icon;

  return (
    <div
      role={toast.type === "error" ? "alert" : "status"}
      className={`pointer-events-auto relative flex w-full max-w-md items-start gap-3 overflow-hidden rounded-xl border-2 py-3 pl-4 pr-3 shadow-2xl sm:w-auto sm:min-w-[320px] ${
        isDark
          ? "border-white/10 bg-[#001F3F] text-white shadow-black/30"
          : "border-[#CBD5E1] bg-white text-[#001F3F]"
      }`}
    >
      <span className={`absolute inset-y-0 left-0 w-1 ${style.bar}`} />
      <span
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${style.chip}`}
      >
        <Icon size={14} />
      </span>
      <p className="flex-1 break-words pt-1 text-[14px] font-semibold leading-snug">
        {toast.message}
      </p>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss notification"
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition ${
          isDark
            ? "text-slate-400 hover:bg-white/10 hover:text-white"
            : "text-slate-400 hover:bg-[#F8FAFC] hover:text-[#001F3F]"
        }`}
      >
        <X size={14} />
      </button>
    </div>
  );
};

export const ToastStack = ({ toasts, onDismiss, isDark }) => {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed bottom-[calc(76px_+_env(safe-area-inset-bottom))] left-4 right-4 z-[200] flex flex-col-reverse items-stretch gap-2 sm:bottom-6 sm:left-auto sm:right-6 sm:flex-col sm:items-end"
      aria-live="polite"
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={onDismiss} isDark={isDark} />
      ))}
    </div>
  );
};

export default ToastStack;
