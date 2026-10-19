import { useState } from "react";
import { Columns3, Loader2, Plus, ShieldCheck } from "lucide-react";
import {
  tk,
  btnBase,
  Modal,
  Banner,
  FieldLabel,
  ToggleRow,
  TYPES,
} from "../../pages/clients/components/clientUi";

const AddColumnModal = ({ onClose, onSave, isDark }) => {
  const t = tk(isDark);
  const [name, setName] = useState("");
  const [type, setType] = useState("TEXT");
  const [required, setRequired] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async (e) => {
    e?.preventDefault();
    if (!name.trim()) {
      setError("Give the column a name");
      return;
    }
    try {
      setLoading(true);
      setError("");
      await onSave({ name: name.trim(), type, required });
      onClose();
    } catch (err) {
      console.error("Add column failed", err);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Could not create the column",
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
      icon={Columns3}
      title="Add new column"
      subtitle="Choose a name and the kind of data it holds."
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
            form="dyn-add-col"
            disabled={loading}
            className={`${btnBase} h-10 ${t.btnPrimary}`}
          >
            {loading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Plus size={14} />
            )}
            {loading ? "Saving…" : "Create column"}
          </button>
        </div>
      }
    >
      <form
        id="dyn-add-col"
        onSubmit={handleSave}
        className="space-y-4 p-4 sm:p-5"
      >
        <div>
          <FieldLabel
            label="Column name"
            required
            isDark={isDark}
            htmlFor="dyn-col-name"
          />
          <input
            id="dyn-col-name"
            autoFocus
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError("");
            }}
            disabled={loading}
            placeholder="e.g. Phone number"
            className={`h-11 w-full rounded-xl border-2 px-3.5 text-[14px] font-semibold outline-none transition ${t.input}`}
          />
        </div>

        <div>
          <FieldLabel label="Data type" isDark={isDark} />
          <div
            className="grid grid-cols-2 gap-2"
            role="radiogroup"
            aria-label="Data type"
          >
            {TYPES.map((o) => {
              const on = type === o.value;
              const Icon = o.icon;
              return (
                <button
                  key={o.value}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  disabled={loading}
                  onClick={() => setType(o.value)}
                  className={`flex items-start gap-2 rounded-xl border-2 p-2.5 text-left transition ${
                    on
                      ? isDark
                        ? "border-white bg-white text-[#001F3F]"
                        : "border-[#001F3F] bg-[#001F3F] text-white"
                      : `${t.inner} ${t.heading}`
                  }`}
                >
                  <Icon size={14} className="mt-0.5 shrink-0" />
                  <span className="min-w-0">
                    <span className="block text-[12px] font-black uppercase tracking-wider">
                      {o.label}
                    </span>
                    <span
                      className={`block truncate text-[12px] ${on ? "opacity-70" : t.muted}`}
                    >
                      {o.hint}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
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

export default AddColumnModal;
