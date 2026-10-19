import { useState } from "react";
import { FilePlus2, Loader2, Save, Columns3 } from "lucide-react";
import { createDynamicRow } from "../../api/dynamicApi.js";
import {
  tk,
  btnBase,
  Modal,
  Banner,
  DynamicField,
  formatRowValues,
} from "../../pages/clients/components/clientUi";

const AddRowModal = ({
  tableId,
  columns = [],
  onClose,
  onSuccess,
  isDark,
  onNotify,
}) => {
  const t = tk(isDark);
  const [values, setValues] = useState({});
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");

  const handleChange = (columnId, value) => {
    setValues((prev) => ({ ...prev, [columnId]: value }));
    if (fieldErrors[columnId]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[columnId];
        return next;
      });
    }
  };

  const handleSubmit = async (e) => {
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
      await createDynamicRow({ tableId, data: formatted });
      onNotify?.("Record added successfully", "success");
      onSuccess?.();
      onClose();
    } catch (error) {
      const message = error?.response?.data?.message || "Failed to add row";
      setFormError(message);
      onNotify?.(message, "error");
    } finally {
      setLoading(false);
    }
  };

  const requiredCount = columns.filter((c) => c.required).length;

  return (
    <Modal
      isDark={isDark}
      open
      onClose={loading ? () => {} : onClose}
      icon={FilePlus2}
      title="Add new record"
      subtitle={
        requiredCount
          ? `Fill in the details · ${requiredCount} required`
          : "Fill in the details for the new record."
      }
      maxW="max-w-lg"
      footer={
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className={`${btnBase} h-10 border-2 ${t.btnGhost}`}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="dyn-add-row"
            disabled={loading || columns.length === 0}
            className={`${btnBase} h-10 ${t.btnPrimary}`}
          >
            {loading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Save size={14} />
            )}
            {loading ? "Saving…" : "Save record"}
          </button>
        </div>
      }
    >
      <form
        id="dyn-add-row"
        onSubmit={handleSubmit}
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

        {columns.length === 0 && (
          <div className="flex flex-col items-center py-8 text-center">
            <div
              className={`mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border-2 text-slate-400 ${t.inner}`}
            >
              <Columns3 size={20} />
            </div>
            <p
              className={`text-[14px] font-black uppercase tracking-tight ${t.heading}`}
            >
              No columns yet
            </p>
            <p className={`mt-1 text-[14px] ${t.muted}`}>
              Add a column to this table first.
            </p>
          </div>
        )}
      </form>
    </Modal>
  );
};

export default AddRowModal;
