import { useEffect, useMemo, useState } from "react";
import {
  Database,
  Plus,
  PencilLine,
  Trash2,
  Search,
  X,
  Table2,
  Columns3,
  Check,
  Minus,
  Rows3,
  ArrowLeft,
} from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";
import ExcelUpload from "../../components/DynamicData/ExcelUpload.jsx";
import {
  getDynamicTables,
  getDynamicTableDetails,
  createDynamicTable,
  renameDynamicTable,
  deleteDynamicTable,
  createDynamicColumn,
  updateDynamicColumn,
  deleteDynamicColumn,
  createDynamicRow,
  deleteDynamicRow,
} from "../../api/dynamicApi.js";

import AddRowModal from "../../components/DynamicData/AddRowModal.jsx";
import EditRowModal from "../../components/DynamicData/EditRowModal.jsx";
import TableManager from "../../components/DynamicData/TableManager.jsx";
import ColumnManager from "../../components/DynamicData/ColumnManager.jsx";
import ToastStack from "../../components/DynamicData/Toast.jsx";
import {
  tk,
  btnBase,
  ConfirmDialog,
  PageHeading,
} from "../../components/DynamicData/DynamicUi.jsx";

/* ---------- cell display by column type ---------- */
const fmtDate = (v) => {
  const s = String(v);
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  const d = m
    ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
    : new Date(v);
  return Number.isNaN(d.getTime())
    ? s
    : d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
};

const isEmptyVal = (v) => v === null || v === undefined || v === "";

const displayText = (col, v) => {
  if (isEmptyVal(v)) return "";
  if (col.type === "BOOLEAN") return v === true || v === "true" ? "Yes" : "No";
  if (col.type === "DATE") return fmtDate(v);
  if (col.type === "NUMBER" && !Number.isNaN(Number(v)))
    return Number(v).toLocaleString("en-IN");
  return String(v);
};

function Cell({ col, value, isDark }) {
  const t = tk(isDark);
  if (isEmptyVal(value))
    return <span className={`text-[12px] italic ${t.muted}`}>—</span>;
  if (col.type === "BOOLEAN") {
    const yes = value === true || value === "true";
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[12px] font-black uppercase tracking-wider ${
          yes
            ? "border-green-500/30 bg-green-500/10 text-green-600"
            : "border-slate-500/30 bg-slate-500/10 text-slate-500"
        }`}
      >
        {yes ? <Check size={12} /> : <Minus size={12} />} {yes ? "Yes" : "No"}
      </span>
    );
  }
  return (
    <span className={col.type === "NUMBER" ? "font-mono" : ""}>
      {displayText(col, value)}
    </span>
  );
}

const DynamicData = () => {
  const { isDark } = useTheme();
  const t = tk(isDark);

  const [tables, setTables] = useState([]);
  const [selectedTableId, setSelectedTableId] = useState("");
  const [columns, setColumns] = useState([]);
  const [rows, setRows] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [loadingTable, setLoadingTable] = useState(false);
  const [importProgress, setImportProgress] = useState(null); // { current, total } | null
  const [toasts, setToasts] = useState([]);
  const [search, setSearch] = useState("");
  const [deleteRowTarget, setDeleteRowTarget] = useState(null);
  const [deletingRow, setDeletingRow] = useState(false);

  /* ---------- toasts ---------- */
  const showToast = (message, type = "info") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
  };
  const dismissToast = (id) =>
    setToasts((prev) => prev.filter((x) => x.id !== id));

  /* ---------- loaders ---------- */
  const loadTables = async () => {
    try {
      const res = await getDynamicTables();
      setTables(Array.isArray(res.data) ? res.data : res.data?.data || []);
    } catch (error) {
      showToast(
        error?.response?.data?.message || "Failed to load tables",
        "error",
      );
    }
  };

  const loadTableDetails = async (tableId) => {
    try {
      setLoadingTable(true);
      const res = await getDynamicTableDetails(tableId);
      setColumns(res.data?.columns || []);
      setRows(res.data?.rows || []);
    } catch (error) {
      showToast(
        error?.response?.data?.message || "Failed to load table details",
        "error",
      );
    } finally {
      setLoadingTable(false);
    }
  };

  useEffect(() => {
    loadTables();
  }, []);

  useEffect(() => {
    setSearch("");
    if (selectedTableId) loadTableDetails(selectedTableId);
    else {
      setColumns([]);
      setRows([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTableId]);

  /* ---------- table actions ---------- */
  const handleCreateTable = async (name) => {
    try {
      const res = await createDynamicTable(name);
      await loadTables(); // refetch so the new table always shows, whatever the response shape
      const newTable = res?.data?.data ?? res?.data ?? null;
      if (newTable?.id) setSelectedTableId(newTable.id);
      showToast(`Table "${name}" created`, "success");
    } catch (error) {
      showToast(
        error?.response?.data?.message || "Failed to create table",
        "error",
      );
    }
  };

  const handleRenameTable = async (id, name) => {
    try {
      await renameDynamicTable(id, name);
      loadTables();
      showToast("Table renamed", "success");
    } catch (error) {
      showToast(
        error?.response?.data?.message || "Failed to rename table",
        "error",
      );
    }
  };

  // TableManager already asks "Delete table?" before calling this
  const handleDeleteTable = async (id) => {
    try {
      await deleteDynamicTable(id);
      if (selectedTableId === id) setSelectedTableId("");
      loadTables();
      showToast("Table deleted", "success");
    } catch (error) {
      showToast(
        error?.response?.data?.message || "Failed to delete table",
        "error",
      );
    }
  };

  /* ---------- column actions ---------- */
  const handleAddColumn = async (column) => {
    try {
      await createDynamicColumn({
        tableId: selectedTableId,
        name: column.name,
        type: column.type,
        required: column.required,
      });
      await loadTableDetails(selectedTableId);
      showToast(`Column "${column.name}" added`, "success");
    } catch (error) {
      showToast(
        error?.response?.data?.message || "Failed to add column",
        "error",
      );
      throw error; // keeps the modal open
    }
  };

  const handleEditColumn = async (column) => {
    try {
      await updateDynamicColumn(column.id, {
        name: column.name,
        required: column.required,
      });
      await loadTableDetails(selectedTableId);
      showToast("Column updated", "success");
    } catch (error) {
      showToast(
        error?.response?.data?.message || "Failed to update column",
        "error",
      );
      throw error;
    }
  };

  // ColumnManager already asks "Delete column?" before calling this
  const handleDeleteColumn = async (columnId) => {
    try {
      await deleteDynamicColumn(columnId);
      await loadTableDetails(selectedTableId);
      showToast("Column deleted", "success");
    } catch (error) {
      showToast(
        error?.response?.data?.message || "Failed to delete column",
        "error",
      );
    }
  };

  /* ---------- row actions ---------- */
  const confirmDeleteRow = async () => {
    if (!deleteRowTarget) return;
    setDeletingRow(true);
    try {
      await deleteDynamicRow(deleteRowTarget.id);
      await loadTableDetails(selectedTableId);
      showToast("Record deleted", "success");
      setDeleteRowTarget(null);
    } catch (error) {
      showToast(
        error?.response?.data?.message || "Failed to delete record",
        "error",
      );
    } finally {
      setDeletingRow(false);
    }
  };

  /* ---------- excel import ---------- */
  const handleExcelImport = async (excelRows) => {
    if (!selectedTableId || excelRows.length === 0 || importProgress) return;

    try {
      const firstRow = excelRows[0];

      // 1. new columns only (case-insensitive, no duplicates in one batch)
      const existingNames = new Set(columns.map((c) => c.name.toLowerCase()));
      const plannedNames = new Set();
      const columnsToCreate = [];
      for (const key of Object.keys(firstRow)) {
        const lower = key.toLowerCase();
        if (!existingNames.has(lower) && !plannedNames.has(lower)) {
          plannedNames.add(lower);
          columnsToCreate.push(key);
        }
      }

      for (const key of columnsToCreate) {
        try {
          await createDynamicColumn({
            tableId: selectedTableId,
            name: key,
            type: "TEXT",
            required: false,
          });
        } catch (err) {
          if (err?.response?.status !== 409) {
            throw new Error(
              err?.response?.data?.message ||
                `Failed to create column "${key}"`,
            );
          }
        }
      }

      const updated = await getDynamicTableDetails(selectedTableId);
      const updatedColumns = updated.data.columns;

      // match Excel headers to columns case-insensitively
      const headerFor = {};
      Object.keys(firstRow).forEach((k) => {
        headerFor[k.toLowerCase()] = k;
      });

      // 2. insert rows one by one, counting failures
      let successCount = 0;
      let failCount = 0;
      setImportProgress({ current: 0, total: excelRows.length });

      for (let i = 0; i < excelRows.length; i++) {
        const row = excelRows[i];
        const data = {};
        updatedColumns.forEach((col) => {
          const key = headerFor[String(col.name).toLowerCase()] ?? col.name;
          const v = row[key];
          data[col.id] = v !== undefined && v !== "" ? String(v) : null;
        });

        try {
          await createDynamicRow({ tableId: selectedTableId, data });
          successCount++;
        } catch {
          failCount++;
        }
        setImportProgress({ current: i + 1, total: excelRows.length });
      }

      await loadTableDetails(selectedTableId);

      const done = `Imported ${successCount} row${successCount !== 1 ? "s" : ""}`;
      showToast(
        failCount === 0
          ? `${done} successfully`
          : `${done}, ${failCount} failed`,
        failCount === 0 ? "success" : "warning",
      );
    } catch (error) {
      showToast(
        error?.message ||
          "Import failed. Please check your file and try again.",
        "error",
      );
    } finally {
      setImportProgress(null);
    }
  };

  /* ---------- derived ---------- */
  const selectedTable = tables.find((x) => x.id === selectedTableId);

  const visibleRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      columns.some((c) =>
        displayText(c, r.values?.[c.id]).toLowerCase().includes(q),
      ),
    );
  }, [rows, columns, search]);

  const firstCol = columns[0];
  const restCols = columns.slice(1);
  const th =
    "whitespace-nowrap px-4 py-3 text-[12px] font-black uppercase tracking-wider text-slate-400";
  const iconBtn = (danger) =>
    `flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border-2 transition ${
      danger
        ? isDark
          ? "border-white/10 text-slate-300 hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-400"
          : "border-[#CBD5E1] text-slate-500 hover:border-red-300 hover:bg-red-50 hover:text-red-600"
        : t.btnGhost
    }`;

  return (
    <div className="min-h-screen min-w-0 overflow-x-clip lg:ml-20">
      <ToastStack toasts={toasts} onDismiss={dismissToast} isDark={isDark} />

      <div className="mx-auto w-full min-w-0 max-w-[1600px] space-y-4 sm:space-y-5">
        <PageHeading
          isDark={isDark}
          title="Custom"
          accent="tables."
          subtitle="Keep any list you need — tyre stock, insurance renewals, suppliers — with your own columns."
        />

        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] items-start gap-4 lg:grid-cols-[320px_minmax(0,1fr)] xl:grid-cols-[360px_minmax(0,1fr)]">
          {/* left: tables */}
          <div
            className={`min-w-0 lg:sticky lg:top-4 ${selectedTableId ? "hidden lg:block" : ""}`}
          >
            <TableManager
              tables={tables}
              selectedTableId={selectedTableId}
              onSelect={setSelectedTableId}
              onCreate={handleCreateTable}
              onRename={handleRenameTable}
              onDelete={handleDeleteTable}
              isDark={isDark}
            />
          </div>

          {/* right: selected table */}
          <div className="min-w-0 space-y-3 sm:space-y-4">
            {!selectedTableId ? (
              <div
                className={`hidden flex-col items-center justify-center rounded-2xl border-2 px-4 py-16 text-center lg:flex ${t.card}`}
              >
                <div
                  className={`mb-3 flex h-12 w-12 items-center justify-center rounded-2xl ${t.chipNavy}`}
                >
                  <Database size={20} />
                </div>
                <h3
                  className={`text-[14px] font-black uppercase tracking-tight ${t.heading}`}
                >
                  Pick a{" "}
                  <span className="font-light lowercase italic">table</span>
                </h3>
                <p className={`mt-1 max-w-sm text-[14px] ${t.muted}`}>
                  Choose a table, or create a new one, to add columns and
                  records.
                </p>
              </div>
            ) : (
              <>
                {/* selected table title bar */}
                <div
                  className={`flex min-w-0 items-center gap-2 rounded-2xl border-2 px-2.5 py-2.5 sm:gap-3 sm:px-4 sm:py-3 ${t.card}`}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedTableId("")}
                    aria-label="Back to all tables"
                    className={`lg:hidden ${iconBtn(false)}`}
                  >
                    <ArrowLeft size={14} />
                  </button>
                  <span
                    className={`hidden h-9 w-9 shrink-0 items-center justify-center rounded-xl sm:flex ${t.chipNavy}`}
                  >
                    <Table2 size={16} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12px] font-bold uppercase tracking-wider text-slate-400">
                      Open table
                      <span className="normal-case tracking-normal sm:hidden">
                        {" "}
                        · {columns.length} col · {rows.length} rec
                      </span>
                    </p>
                    <h2
                      className={`truncate text-[16px] font-black uppercase tracking-tight ${t.heading}`}
                    >
                      {selectedTable?.name || "Table"}
                    </h2>
                  </div>
                  <div className="hidden gap-2 sm:flex">
                    <span
                      className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[12px] font-black uppercase tracking-wider ${t.inner} ${t.body}`}
                    >
                      <Columns3 size={12} /> {columns.length}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[12px] font-black uppercase tracking-wider ${t.inner} ${t.body}`}
                    >
                      <Rows3 size={12} /> {rows.length}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedTableId("")}
                    aria-label="Close table"
                    className={`hidden lg:flex ${iconBtn(false)}`}
                  >
                    <X size={14} />
                  </button>
                </div>

                <ExcelUpload
                  isDark={isDark}
                  onProceed={handleExcelImport}
                  importProgress={importProgress}
                />

                <ColumnManager
                  columns={columns}
                  onAdd={handleAddColumn}
                  onEdit={handleEditColumn}
                  onDelete={handleDeleteColumn}
                  isDark={isDark}
                />

                {/* records */}
                {!loadingTable && columns.length === 0 ? (
                  <div
                    className={`rounded-2xl border-2 border-dashed px-4 py-10 text-center ${t.line}`}
                  >
                    <p
                      className={`text-[14px] font-black uppercase tracking-tight ${t.heading}`}
                    >
                      No columns yet
                    </p>
                    <p className={`mt-1 text-[14px] ${t.muted}`}>
                      Add at least one column above, or import an Excel file,
                      before adding records.
                    </p>
                  </div>
                ) : (
                  <section
                    className={`min-w-0 overflow-hidden rounded-2xl border-2 ${t.card}`}
                  >
                    <div
                      className={`flex min-w-0 flex-col gap-3 border-b-2 px-3 py-3 sm:flex-row sm:items-center sm:px-4 ${t.cardHead}`}
                    >
                      <div className="min-w-0 flex-1">
                        <h2
                          className={`text-[14px] font-black uppercase tracking-tight ${t.heading}`}
                        >
                          Table{" "}
                          <span className="font-light lowercase italic">
                            records
                          </span>
                        </h2>
                        <p className={`text-[12px] font-medium ${t.muted}`}>
                          {search
                            ? `${visibleRows.length} of ${rows.length}`
                            : rows.length}{" "}
                          record{rows.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                      <div className="flex min-w-0 gap-2">
                        <div className="relative min-w-0 flex-1 sm:w-56">
                          <Search
                            size={14}
                            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                          />
                          <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search records…"
                            className={`h-10 w-full rounded-xl border-2 pl-9 pr-8 text-[14px] font-semibold outline-none transition ${t.input}`}
                          />
                          {search && (
                            <button
                              type="button"
                              onClick={() => setSearch("")}
                              aria-label="Clear search"
                              className="absolute right-1.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 hover:text-red-500"
                            >
                              <X size={12} />
                            </button>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowAddModal(true)}
                          disabled={loadingTable || columns.length === 0}
                          className={`${btnBase} h-10 shrink-0 px-4 shadow-lg ${t.btnPrimary}`}
                        >
                          <Plus size={14} />{" "}
                          <span className="hidden sm:inline">Add record</span>
                          <span className="sm:hidden">Add</span>
                        </button>
                      </div>
                    </div>

                    {loadingTable ? (
                      <div className="space-y-2 p-3 sm:p-4">
                        {[0, 1, 2].map((i) => (
                          <div
                            key={i}
                            className={`h-12 animate-pulse rounded-xl ${isDark ? "bg-white/5" : "bg-[#F8FAFC]"}`}
                          />
                        ))}
                      </div>
                    ) : visibleRows.length === 0 ? (
                      <div className="px-4 py-12 text-center">
                        <p
                          className={`text-[14px] font-black uppercase tracking-tight ${t.heading}`}
                        >
                          {rows.length ? "No records match" : "No records yet"}
                        </p>
                        <p className={`mt-1 text-[14px] ${t.muted}`}>
                          {rows.length
                            ? "Try a different search."
                            : "Add a record or import an Excel file."}
                        </p>
                      </div>
                    ) : (
                      <>
                        {/* desktop / tablet grid */}
                        <div className="hidden overflow-x-auto md:block">
                          <table className="w-full border-collapse text-left">
                            <thead className={`border-b-2 ${t.cardHead}`}>
                              <tr>
                                {columns.map((col) => (
                                  <th
                                    key={col.id}
                                    className={`${th} ${col.type === "NUMBER" ? "text-right" : ""}`}
                                  >
                                    {col.name}
                                  </th>
                                ))}
                                <th
                                  className={`${th} sticky right-0 text-right ${isDark ? "bg-[#001F3F]" : "bg-[#F8FAFC]"}`}
                                >
                                  Actions
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {visibleRows.map((row) => (
                                <tr
                                  key={row.id}
                                  className={`group border-b last:border-0 ${t.line} ${isDark ? "hover:bg-white/5" : "hover:bg-[#F8FAFC]"}`}
                                >
                                  {columns.map((col) => (
                                    <td
                                      key={col.id}
                                      className={`max-w-[260px] truncate whitespace-nowrap px-4 py-3 text-[14px] font-semibold ${t.heading} ${
                                        col.type === "NUMBER"
                                          ? "text-right"
                                          : ""
                                      }`}
                                      title={displayText(
                                        col,
                                        row.values?.[col.id],
                                      )}
                                    >
                                      <Cell
                                        col={col}
                                        value={row.values?.[col.id]}
                                        isDark={isDark}
                                      />
                                    </td>
                                  ))}
                                  <td
                                    className={`sticky right-0 px-4 py-2 ${isDark ? "bg-[#001F3F]" : "bg-white"}`}
                                  >
                                    <div className="flex justify-end gap-1.5">
                                      <button
                                        type="button"
                                        onClick={() => setEditRow(row)}
                                        className={iconBtn(false)}
                                        aria-label="Edit record"
                                        title="Edit"
                                      >
                                        <PencilLine size={14} />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setDeleteRowTarget(row)}
                                        className={iconBtn(true)}
                                        aria-label="Delete record"
                                        title="Delete"
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

                        {/* phone cards */}
                        <div className="space-y-2 p-3 md:hidden">
                          {visibleRows.map((row) => (
                            <div
                              key={row.id}
                              className={`min-w-0 rounded-xl border-2 p-3 ${t.inner}`}
                            >
                              <div className="flex min-w-0 items-start gap-2">
                                <div className="min-w-0 flex-1">
                                  {firstCol && (
                                    <>
                                      <p className="text-[12px] font-bold uppercase tracking-wider text-slate-400">
                                        {firstCol.name}
                                      </p>
                                      <p
                                        className={`truncate text-[14px] font-black ${t.heading}`}
                                      >
                                        <Cell
                                          col={firstCol}
                                          value={row.values?.[firstCol.id]}
                                          isDark={isDark}
                                        />
                                      </p>
                                    </>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setEditRow(row)}
                                  className={iconBtn(false)}
                                  aria-label="Edit record"
                                >
                                  <PencilLine size={14} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeleteRowTarget(row)}
                                  className={iconBtn(true)}
                                  aria-label="Delete record"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                              {restCols.length > 0 && (
                                <dl
                                  className={`mt-2 grid grid-cols-1 gap-x-3 gap-y-2 border-t-2 pt-2 min-[360px]:grid-cols-2 ${t.line}`}
                                >
                                  {restCols.map((col) => (
                                    <div key={col.id} className="min-w-0">
                                      <dt className="truncate text-[12px] font-bold uppercase tracking-wider text-slate-400">
                                        {col.name}
                                      </dt>
                                      <dd
                                        className={`truncate text-[14px] font-semibold ${t.heading}`}
                                      >
                                        <Cell
                                          col={col}
                                          value={row.values?.[col.id]}
                                          isDark={isDark}
                                        />
                                      </dd>
                                    </div>
                                  ))}
                                </dl>
                              )}
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </section>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {showAddModal && (
        <AddRowModal
          tableId={selectedTableId}
          columns={columns}
          isDark={isDark}
          onClose={() => setShowAddModal(false)}
          onNotify={showToast}
          onSuccess={() => {
            setShowAddModal(false);
            loadTableDetails(selectedTableId);
          }}
        />
      )}

      {editRow && (
        <EditRowModal
          row={editRow}
          columns={columns}
          isDark={isDark}
          onClose={() => setEditRow(null)}
          onNotify={showToast}
          onSuccess={() => {
            setEditRow(null);
            loadTableDetails(selectedTableId);
          }}
        />
      )}

      <ConfirmDialog
        isDark={isDark}
        open={Boolean(deleteRowTarget)}
        title="Delete record?"
        message={
          deleteRowTarget && firstCol
            ? `"${displayText(firstCol, deleteRowTarget.values?.[firstCol.id]) || "This record"}" will be removed. This can't be undone.`
            : "This record will be removed. This can't be undone."
        }
        confirmText="Delete"
        busy={deletingRow}
        onConfirm={confirmDeleteRow}
        onCancel={() => !deletingRow && setDeleteRowTarget(null)}
      />
    </div>
  );
};

export default DynamicData;
