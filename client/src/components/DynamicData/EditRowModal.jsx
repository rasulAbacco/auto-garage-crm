import { useState } from "react";
import { PencilLine, Loader2, Save } from "lucide-react";
import { updateDynamicRow } from "../../api/dynamicApi.js";
import {
  tk,
  btnBase,
  Modal,
  Banner,
  DynamicField,
  formatRowValues,
} from "./DynamicUi";

// Keeps the calendar day the user saved (no time-zone shift for IST etc.)
const toDateInputValue = (value) => {
  if (!value) return "";
  const s = String(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  if (/T00:00:00(\.000)?Z$/.test(s)) return s.slice(0, 10); // stored as UTC midnight
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const EditRowModal = ({
  row,
  columns = [],
  onClose,
  onSuccess,
  isDark,
  onNotify,
}) => {
  const t = tk(isDark);
  const [values, setValues] = useState(() => {
    const init = { ...(row.values || {}) };
    columns.forEach((c) => {
      if (c.type === "DATE" && init[c.id])
        init[c.id] = toDateInputValue(init[c.id]);
    });
    return init;
  });
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");

  const handleChange = (colId, value) => {
    setValues((prev) => ({ ...prev, [colId]: value }));
    if (fieldErrors[colId]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[colId];
        return next;
      });
    }
  };

  const handleSave = async (e) => {
    e?.preventDefault();
    setFormError("");
    const { formatted, errors } = formatRowValues(columns, values);

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setFormError("Please fix the highlighted fields before saving.");
      return;
    }

    try {
      setLoading(true);
      await updateDynamicRow(row.id, { data: formatted });
      onNotify?.("Record updated successfully", "success");
      onSuccess?.();
      onClose();
    } catch (err) {
      const message = err?.response?.data?.message || "Update failed";
      setFormError(message);
      onNotify?.(message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isDark={isDark}
      open
      onClose={loading ? () => {} : onClose}
      icon={PencilLine}
      title="Update record"
      subtitle={`Record #${String(row.id ?? "").slice(-4)} · change the values below`}
      maxW="max-w-lg"
      footer={
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className={`${btnBase} h-10 border-2 ${t.btnGhost}`}
          >
            Discard
          </button>
          <button
            type="submit"
            form="dyn-edit-row"
            disabled={loading}
            className={`${btnBase} h-10 ${t.btnPrimary}`}
          >
            {loading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Save size={14} />
            )}
            {loading ? "Updating…" : "Save changes"}
          </button>
        </div>
      }
    >
      <form
        id="dyn-edit-row"
        onSubmit={handleSave}
        className="space-y-4 p-4 sm:p-5"
      >
        <Banner>{formError}</Banner>
        {columns.map((col) => (
          <DynamicField
            key={col.id}
            isDark={isDark}
            col={col}
            value={values[col.id]}
            onChange={(v) => handleChange(col.id, v)}
            error={fieldErrors[col.id]}
            disabled={loading}
          />
        ))}
      </form>
    </Modal>
  );
};

export default EditRowModal;
