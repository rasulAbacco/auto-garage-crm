// client/src/pages/details/components/OCRHistory.jsx
import React, { useState } from "react";
import {
  FiFileText,
  FiTrash2,
  FiDownload,
  FiChevronDown,
  FiInbox,
} from "react-icons/fi";
import {
  Plate,
  ConfirmDialog,
  tk,
  btnBase,
} from "../../clients/components/clientUi";

const parse = (p) => {
  if (!p) return {};
  if (typeof p === "string") {
    try {
      return JSON.parse(p) || {};
    } catch {
      return {};
    }
  }
  return p;
};

const OCRHistory = ({ isDark, historyData = [], onDelete, onClear }) => {
  const t = tk(isDark);
  const [open, setOpen] = useState(true);
  const [confirm, setConfirm] = useState(null); // { type: "one", id } | { type: "all" }
  const [busy, setBusy] = useState(false);

  const download = (item, regNo) => {
    const blob = new Blob(
      [
        JSON.stringify(
          { ...item, parsedData: parse(item.parsedData) },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rc_${regNo || item.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const runConfirm = async () => {
    try {
      setBusy(true);
      if (confirm?.type === "all") await onClear?.();
      else if (confirm?.id) await onDelete?.(confirm.id);
    } finally {
      setBusy(false);
      setConfirm(null);
    }
  };

  const sorted = [...historyData].sort(
    (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
  );

  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className={`inline-flex items-center gap-2 text-[12px] font-black uppercase tracking-[0.15em] ${t.heading}`}
        >
          <FiChevronDown
            size={14}
            className={`transition-transform ${open ? "rotate-180" : ""}`}
          />
          {open ? "Hide" : "Show"} saved scans ({historyData.length})
        </button>
        {historyData.length > 0 && (
          <button
            type="button"
            onClick={() => setConfirm({ type: "all" })}
            className={`${btnBase} h-8 border-2 border-red-500/30 px-3 text-red-500 hover:bg-red-500/10`}
          >
            <FiTrash2 size={12} /> Clear all
          </button>
        )}
      </div>

      {open && (
        <div className="mt-3">
          {sorted.length === 0 ? (
            <div className="py-8 text-center">
              <div
                className={`mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-2xl ${isDark ? "bg-white/5 text-slate-500" : "bg-[#F8FAFC] text-slate-400"}`}
              >
                <FiInbox size={16} />
              </div>
              <p className={`text-[14px] ${t.muted}`}>
                No saved scans for this client yet.
              </p>
            </div>
          ) : (
            <div className="grid max-h-[460px] grid-cols-1 gap-2 overflow-y-auto pr-1 md:grid-cols-2">
              {sorted.map((item) => {
                const p = parse(item.parsedData);
                const owner = p.ownerName || p.name || "Unknown owner";
                const regNo = p.regNo || p.registrationNo || "";
                const conf =
                  typeof item.confidence === "number"
                    ? `${item.confidence.toFixed(0)}%`
                    : "—";
                const date = item.createdAt || item.savedDate;
                return (
                  <div
                    key={item.id}
                    className={`flex items-center gap-3 rounded-xl border-2 p-3 ${t.inner}`}
                  >
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${t.chipNavy}`}
                    >
                      <FiFileText size={14} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p
                        className={`truncate text-[14px] font-bold ${t.heading}`}
                      >
                        {owner}
                      </p>
                      <div className="mt-0.5 flex flex-wrap items-center gap-2">
                        {regNo && <Plate value={regNo} size="sm" />}
                        <span className={`text-[12px] ${t.muted}`}>
                          {conf} ·{" "}
                          {date
                            ? new Date(date).toLocaleString("en-IN", {
                                day: "2-digit",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "—"}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => download(item, regNo)}
                      title="Download JSON"
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border-2 ${t.btnGhost}`}
                    >
                      <FiDownload size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirm({ type: "one", id: item.id })}
                      title="Delete"
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border-2 border-red-500/30 text-red-500 hover:bg-red-500/10"
                    >
                      <FiTrash2 size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        isDark={isDark}
        open={!!confirm}
        title={
          confirm?.type === "all" ? "Clear all scans?" : "Delete this scan?"
        }
        message={
          confirm?.type === "all"
            ? `All ${historyData.length} saved scans for this client will be deleted.`
            : "This saved scan will be removed permanently."
        }
        confirmText={confirm?.type === "all" ? "Clear all" : "Delete"}
        busy={busy}
        onCancel={() => setConfirm(null)}
        onConfirm={runConfirm}
      />
    </div>
  );
};

export default OCRHistory;
