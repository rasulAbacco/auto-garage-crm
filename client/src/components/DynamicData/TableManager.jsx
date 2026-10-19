import { useState } from "react";
import {
  Table2,
  Plus,
  PencilLine,
  Trash2,
  Check,
  X,
  ChevronRight,
} from "lucide-react";
import { tk, btnBase, ConfirmDialog } from "./DynamicUi";

const TableManager = ({
  tables = [],
  selectedTableId,
  onSelect,
  onCreate,
  onRename,
  onDelete,
  isDark,
}) => {
  const t = tk(isDark);
  const [newTableName, setNewTableName] = useState("");
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState("");
  const [deleteTable, setDeleteTable] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const create = () => {
    const name = newTableName.trim();
    if (!name) return;
    onCreate(name);
    setNewTableName("");
  };

  const saveRename = (id) => {
    const name = editName.trim();
    if (name) onRename(id, name);
    setEditId(null);
  };

  const confirmDelete = async () => {
    if (!deleteTable) return;
    setDeleting(true);
    try {
      await onDelete(deleteTable.id);
      setDeleteTable(null);
    } finally {
      setDeleting(false);
    }
  };

  // keep the input focused when pressing Save / Cancel (stops onBlur closing the editor first)
  const keepFocus = (e) => e.preventDefault();

  const iconBtn = (danger) =>
    `flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border-2 transition ${
      danger
        ? isDark
          ? "border-white/10 text-slate-300 hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-400"
          : "border-[#CBD5E1] text-slate-500 hover:border-red-300 hover:bg-red-50 hover:text-red-600"
        : t.btnGhost
    }`;

  return (
    <section
      className={`min-w-0 overflow-hidden rounded-2xl border-2 ${t.card}`}
    >
      {/* header */}
      <div
        className={`flex items-center gap-3 border-b-2 px-3 py-3 sm:px-4 ${t.cardHead}`}
      >
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${t.chipNavy}`}
        >
          <Table2 size={14} />
        </span>
        <div className="min-w-0 flex-1">
          <h2
            className={`truncate text-[14px] font-black uppercase tracking-tight ${t.heading}`}
          >
            Your <span className="font-light lowercase italic">tables</span>
          </h2>
          <p className={`text-[12px] font-medium leading-snug ${t.muted}`}>
            Tap a table to open it
          </p>
        </div>
        <span
          className={`shrink-0 rounded-lg border px-2 py-0.5 text-[12px] font-black uppercase tracking-wider ${t.inner} ${t.body}`}
        >
          {tables.length}
          <span className="hidden min-[380px]:inline"> total</span>
        </span>
      </div>

      <div className="space-y-3 p-3 sm:p-4">
        {/* create */}
        <div className="flex min-w-0 gap-2">
          <input
            className={`h-10 min-w-0 flex-1 rounded-xl border-2 px-3.5 text-[14px] font-semibold outline-none transition ${t.input}`}
            placeholder="New table name…"
            value={newTableName}
            onChange={(e) => setNewTableName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && create()}
            aria-label="New table name"
          />
          <button
            type="button"
            onClick={create}
            disabled={!newTableName.trim()}
            aria-label="Create table"
            className={`${btnBase} h-10 shrink-0 px-3 sm:px-4 ${t.btnPrimary}`}
          >
            <Plus size={14} />{" "}
            <span className="hidden min-[380px]:inline">Create</span>
          </button>
        </div>

        {/* list */}
        <div className="space-y-2">
          {tables.map((tb) => {
            const selected = selectedTableId === tb.id;
            const editing = editId === tb.id;
            return (
              <div
                key={tb.id}
                onClick={() => !editing && onSelect(tb.id)}
                className={`group flex min-w-0 cursor-pointer items-center gap-2 rounded-xl border-2 p-2 pl-3 transition ${
                  selected
                    ? isDark
                      ? "border-white/40 bg-white/10"
                      : "border-[#001F3F] bg-[#F8FAFC]"
                    : `${t.inner} ${isDark ? "hover:border-white/20" : "hover:border-[#001F3F]/40"}`
                }`}
              >
                {editing ? (
                  <>
                    <input
                      autoFocus
                      className={`h-9 min-w-0 flex-1 rounded-lg border-2 px-3 text-[14px] font-bold outline-none ${t.input}`}
                      value={editName}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => setEditName(e.target.value)}
                      onBlur={() => setEditId(null)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveRename(tb.id);
                        if (e.key === "Escape") setEditId(null);
                      }}
                      aria-label="Table name"
                    />
                    <button
                      type="button"
                      onMouseDown={keepFocus}
                      onClick={(e) => {
                        e.stopPropagation();
                        saveRename(tb.id);
                      }}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-green-600 text-white hover:bg-green-700"
                      aria-label="Save name"
                    >
                      <Check size={14} />
                    </button>
                    <button
                      type="button"
                      onMouseDown={keepFocus}
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditId(null);
                      }}
                      className={iconBtn(false)}
                      aria-label="Cancel rename"
                    >
                      <X size={14} />
                    </button>
                  </>
                ) : (
                  <>
                    <Table2
                      size={14}
                      className={`shrink-0 ${selected ? (isDark ? "text-white" : "text-[#001F3F]") : "text-slate-400"}`}
                    />
                    <span
                      className={`min-w-0 flex-1 truncate text-[14px] font-black ${selected ? t.heading : t.body}`}
                    >
                      {tb.name}
                    </span>
                    {selected && (
                      <span
                        className={`hidden shrink-0 rounded-md px-1.5 py-px text-[12px] font-black uppercase tracking-wider sm:inline ${t.chipNavy}`}
                      >
                        Open
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditId(tb.id);
                        setEditName(tb.name);
                      }}
                      className={iconBtn(false)}
                      aria-label={`Rename ${tb.name}`}
                      title="Rename"
                    >
                      <PencilLine size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTable(tb);
                      }}
                      className={iconBtn(true)}
                      aria-label={`Delete ${tb.name}`}
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                    {!selected && (
                      <ChevronRight
                        size={14}
                        className="hidden shrink-0 text-slate-400 sm:block"
                      />
                    )}
                  </>
                )}
              </div>
            );
          })}

          {tables.length === 0 && (
            <div
              className={`rounded-xl border-2 border-dashed px-4 py-10 text-center ${t.line}`}
            >
              <p
                className={`text-[14px] font-black uppercase tracking-tight ${t.heading}`}
              >
                No tables yet
              </p>
              <p className={`mt-1 text-[14px] ${t.muted}`}>
                Type a name above and press Create.
              </p>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        isDark={isDark}
        open={Boolean(deleteTable)}
        title="Delete table?"
        message={
          deleteTable
            ? `"${deleteTable.name}" with all its columns and records will be deleted.`
            : ""
        }
        confirmText="Delete"
        busy={deleting}
        onConfirm={confirmDelete}
        onCancel={() => !deleting && setDeleteTable(null)}
      />
    </section>
  );
};

export default TableManager;
