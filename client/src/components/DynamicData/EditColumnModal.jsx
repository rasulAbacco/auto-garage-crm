import { useState } from "react";
import { PencilLine, Loader2, Save, ShieldCheck } from "lucide-react";
import {
  tk,
  btnBase,
  Modal,
  Banner,
  FieldLabel,
  ToggleRow,
  TypeBadge,
} from "../../pages/clients/components/clientUi";

const EditColumnModal = ({ column, onClose, onSave, isDark }) => {
  const t = tk(isDark);
  const [name, setName] = useState(column.name);
  const [required, setRequired] = useState(Boolean(column.required));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async (e) => {
    e?.preventDefault();
    if (!name.trim()) return;
    try {
      setLoading(true);
      setError("");
      await onSave({ ...column, name: name.trim(), required });
      onClose();
    } catch (err) {
      console.error("Edit column failed", err);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Could not update the column",
      );
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
      title="Edit column"
      subtitle="Update the name and validation."
      maxW="max-w-md"
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
            form="dyn-edit-col"
            disabled={loading || !name.trim()}
            className={`${btnBase} h-10 ${t.btnPrimary}`}
          >
            {loading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Save size={14} />
            )}
            {loading ? "Saving…" : "Update"}
          </button>
        </div>
      }
    >
      <form
        id="dyn-edit-col"
        onSubmit={handleSave}
        className="space-y-4 p-4 sm:p-5"
      >
        <div>
          <FieldLabel
            label="Column name"
            required
            isDark={isDark}
            htmlFor="dyn-edit-col-name"
          />
          <input
            id="dyn-edit-col-name"
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
            placeholder="Enter new name…"
            className={`h-11 w-full rounded-xl border-2 px-3.5 text-[14px] font-semibold outline-none transition ${t.input}`}
          />
        </div>

        <div
          className={`flex items-center justify-between gap-3 rounded-xl border-2 px-3.5 py-2.5 ${t.inner}`}
        >
          <span className="text-[12px] font-bold uppercase tracking-wider text-slate-400">
            Data type
          </span>
          <span className="flex items-center gap-2">
            <TypeBadge type={column.type} isDark={isDark} />
            <span className={`text-[12px] ${t.muted}`}>can't be changed</span>
          </span>
        </div>

        <ToggleRow
          isDark={isDark}
          icon={ShieldCheck}
          on={required}
          disabled={loading}
          onToggle={() => setRequired((v) => !v)}
          label="Required field"
          hint="Records can't be saved without it"
        />

        <Banner>{error}</Banner>
      </form>
    </Modal>
  );
};

export default EditColumnModal;
