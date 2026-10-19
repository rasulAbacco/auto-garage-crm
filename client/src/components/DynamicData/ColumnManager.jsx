import { useState } from "react";
import { ChevronDown, Columns3, Plus, PencilLine, Trash2 } from "lucide-react";
import AddColumnModal from "./AddColumnModal";
import EditColumnModal from "./EditColumnModal";
import {
  tk,
  btnBase,
  ConfirmDialog,
  TypeBadge,
  RequiredTag,
} from "../../pages/clients/components/clientUi";

const ColumnManager = ({ columns = [], onAdd, onEdit, onDelete, isDark }) => {
  const t = tk(isDark);
  const [showAdd, setShowAdd] = useState(false);
  const [editCol, setEditCol] = useState(null);
  const [isExpanded, setIsExpanded] = useState(true);
  const [deleteCol, setDeleteCol] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const confirmDelete = async () => {
    if (!deleteCol) return;
    setDeleting(true);
    try {
      await onDelete(deleteCol.id);
      setDeleteCol(null);
    } finally {
      setDeleting(false);
    }
  };

  const iconBtn = (danger) =>
    `flex h-8 w-8 items-center justify-center rounded-xl border-2 transition ${
      danger
        ? isDark
          ? "border-white/10 text-slate-300 hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-400"
          : "border-[#CBD5E1] text-slate-500 hover:border-red-300 hover:bg-red-50 hover:text-red-600"
        : t.btnGhost
    }`;

  const th =
    "px-4 py-3 text-[12px] font-black uppercase tracking-wider text-slate-400";

  return (
    <section className={`overflow-hidden rounded-2xl border-2 ${t.card}`}>
      {/* header */}
      <div
        className={`flex items-center gap-3 px-3 py-3 sm:px-4 ${isExpanded ? `border-b-2 ${t.cardHead}` : ""}`}
      >
        <button
          type="button"
          onClick={() => setIsExpanded((v) => !v)}
          aria-expanded={isExpanded}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
          title={isExpanded ? "Collapse" : "Expand"}
        >
          <span
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${t.chipNavy}`}
          >
            <Columns3 size={14} />
          </span>
          <span className="min-w-0">
            <span
              className={`block truncate text-[14px] font-black uppercase tracking-tight ${t.heading}`}
            >
              Column{" "}
              <span className="font-light lowercase italic">structure</span>
            </span>
            <span
              className={`block truncate text-[12px] font-medium ${t.muted}`}
            >
              {columns.length} column{columns.length === 1 ? "" : "s"} · data
              types & rules
            </span>
          </span>
          <ChevronDown
            size={16}
            className={`ml-auto shrink-0 text-slate-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
          />
        </button>
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className={`${btnBase} h-9 shrink-0 px-3 sm:px-4 ${t.btnPrimary}`}
        >
          <Plus size={14} />{" "}
          <span className="hidden sm:inline">Add column</span>
          <span className="sm:hidden">Add</span>
        </button>
      </div>

      {isExpanded && (
        <>
          {columns.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <p
                className={`text-[14px] font-black uppercase tracking-tight ${t.heading}`}
              >
                No columns yet
              </p>
              <p className={`mt-1 text-[14px] ${t.muted}`}>
                Add columns like Name, Phone or Due date to start entering
                records.
              </p>
            </div>
          ) : (
            <>
              {/* desktop / tablet table */}
              <div className="hidden overflow-x-auto sm:block">
                <table className="w-full border-collapse text-left">
                  <thead className={`border-b-2 ${t.cardHead}`}>
                    <tr>
                      <th className={th}>Name</th>
                      <th className={th}>Type</th>
                      <th className={th}>Validation</th>
                      <th className={`${th} text-right`}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {columns.map((c) => (
                      <tr
                        key={c.id}
                        className={`border-b last:border-0 ${t.line} ${isDark ? "hover:bg-white/5" : "hover:bg-[#F8FAFC]"}`}
                      >
                        <td
                          className={`px-4 py-3 text-[14px] font-black ${t.heading}`}
                        >
                          {c.name}
                        </td>
                        <td className="px-4 py-3">
                          <TypeBadge type={c.type} isDark={isDark} />
                        </td>
                        <td className="px-4 py-3">
                          {c.required ? (
                            <RequiredTag />
                          ) : (
                            <span
                              className={`text-[12px] font-bold uppercase tracking-wider ${t.muted}`}
                            >
                              Optional
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-1.5">
                            <button
                              type="button"
                              className={iconBtn(false)}
                              onClick={() => setEditCol(c)}
                              title="Edit column"
                              aria-label={`Edit ${c.name}`}
                            >
                              <PencilLine size={14} />
                            </button>
                            <button
                              type="button"
                              className={iconBtn(true)}
                              onClick={() => setDeleteCol(c)}
                              title="Delete column"
                              aria-label={`Delete ${c.name}`}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* phone list */}
              <div className="space-y-2 p-3 sm:hidden">
                {columns.map((c) => (
                  <div
                    key={c.id}
                    className={`flex items-center gap-3 rounded-xl border-2 p-2.5 ${t.inner}`}
                  >
                    <div className="min-w-0 flex-1">
                      <p
                        className={`truncate text-[14px] font-black ${t.heading}`}
                      >
                        {c.name}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        <TypeBadge type={c.type} isDark={isDark} />
                        {c.required && <RequiredTag />}
                      </div>
                    </div>
                    <button
                      type="button"
                      className={iconBtn(false)}
                      onClick={() => setEditCol(c)}
                      aria-label={`Edit ${c.name}`}
                    >
                      <PencilLine size={14} />
                    </button>
                    <button
                      type="button"
                      className={iconBtn(true)}
                      onClick={() => setDeleteCol(c)}
                      aria-label={`Delete ${c.name}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {showAdd && (
        <AddColumnModal
          isDark={isDark}
          onClose={() => setShowAdd(false)}
          onSave={onAdd}
        />
      )}
      {editCol && (
        <EditColumnModal
          column={editCol}
          isDark={isDark}
          onClose={() => setEditCol(null)}
          onSave={onEdit}
        />
      )}

      <ConfirmDialog
        isDark={isDark}
        open={Boolean(deleteCol)}
        title="Delete column?"
        message={
          deleteCol
            ? `"${deleteCol.name}" and the values stored in it will be removed from every record.`
            : ""
        }
        confirmText="Delete"
        busy={deleting}
        onConfirm={confirmDelete}
        onCancel={() => !deleting && setDeleteCol(null)}
      />
    </section>
  );
};

export default ColumnManager;
