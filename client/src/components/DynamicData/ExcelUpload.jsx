import { useRef, useState } from "react";
import * as XLSX from "xlsx";
import {
  FileSpreadsheet,
  Upload,
  X,
  ArrowRight,
  Loader2,
  Info,
} from "lucide-react";
import { tk, btnBase } from "../../pages/clients/components/clientUi";

const MAX_ROWS = 500;

const Banner = ({ tone = "warning", children }) => {
  if (!children) return null;

  const styles = {
    warning: "border-amber-500/30 bg-amber-500/10 text-amber-600",
    error: "border-red-500/30 bg-red-500/10 text-red-600",
    success: "border-green-500/30 bg-green-500/10 text-green-600",
    info: "border-blue-500/30 bg-blue-500/10 text-blue-600",
  };

  return (
    <div
      role="alert"
      className={`rounded-xl border px-3 py-2 text-[12px] font-semibold ${
        styles[tone] || styles.warning
      }`}
    >
      {children}
    </div>
  );
};

const ExcelUpload = ({ onProceed, isDark, importProgress }) => {
  const t = tk(isDark);
  const [parsedData, setParsedData] = useState([]);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const inputRef = useRef(null);

  const isImporting = !!importProgress;

  const resetState = () => {
    setParsedData([]);
    setFileName("");
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  };

  const processFile = (file) => {
    if (!file) return;

    if (!/\.(xlsx|xls)$/i.test(file.name)) {
      setError("Please upload a valid Excel file (.xlsx or .xls).");
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    setError("");
    setIsParsing(true);
    setFileName(file.name);

    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const workbook = XLSX.read(new Uint8Array(evt.target.result), {
          type: "array",
        });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(sheet, { defval: "" });

        if (json.length === 0) {
          setError("This file doesn't contain any rows to import.");
          setParsedData([]);
          return;
        }

        if (json.length > MAX_ROWS) {
          setError(
            `This file has ${json.length} rows. Only the first ${MAX_ROWS} will be imported (max ${MAX_ROWS} rows per import).`,
          );
          setParsedData(json.slice(0, MAX_ROWS));
        } else {
          setParsedData(json);
        }
      } catch (err) {
        console.error("Excel parse failed", err);
        setError(
          "Couldn't read this file. Please check it's a valid Excel spreadsheet.",
        );
        setParsedData([]);
      } finally {
        setIsParsing(false);
        if (inputRef.current) inputRef.current.value = ""; // allow picking the same file again
      }
    };

    reader.onerror = () => {
      setError("Failed to read the file. Please try again.");
      setIsParsing(false);
    };

    reader.readAsArrayBuffer(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (isImporting || isParsing) return;
    processFile(e.dataTransfer.files?.[0]);
  };

  const handleProceed = () => {
    if (parsedData.length === 0 || isImporting) return;
    onProceed(parsedData);
  };

  const allColumns = parsedData.length > 0 ? Object.keys(parsedData[0]) : [];
  const previewColumns = allColumns.slice(0, 4);
  const pct =
    isImporting && importProgress.total
      ? Math.min(
          100,
          Math.round((importProgress.current / importProgress.total) * 100),
        )
      : 0;

  return (
    <div className="space-y-3">
      {/* drop zone */}
      {parsedData.length === 0 && (
        <label
          onDragOver={(e) => {
            e.preventDefault();
            if (!isImporting) setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-4 py-6 text-center transition sm:flex-row sm:text-left ${
            isImporting || isParsing
              ? "pointer-events-none opacity-60"
              : "cursor-pointer"
          } ${
            isDragging
              ? isDark
                ? "border-white bg-white/10"
                : "border-[#001F3F] bg-[#F8FAFC]"
              : isDark
                ? "border-white/15 bg-white/5 hover:border-white/40"
                : "border-[#CBD5E1] bg-[#F8FAFC] hover:border-[#001F3F]"
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={(e) => processFile(e.target.files?.[0])}
            className="hidden"
            disabled={isImporting || isParsing}
          />
          <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${t.chipNavy}`}
          >
            {isParsing ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Upload size={16} />
            )}
          </span>
          <span className="min-w-0">
            <span
              className={`block text-[14px] font-black uppercase tracking-tight ${t.heading}`}
            >
              {isParsing ? (
                "Reading file…"
              ) : (
                <>
                  Import{" "}
                  <span className="font-light lowercase italic">excel</span>
                </>
              )}
            </span>
            <span className={`block text-[12px] font-medium ${t.muted}`}>
              Drag & drop a .xlsx / .xls file, or tap to browse · max {MAX_ROWS}{" "}
              rows
            </span>
          </span>
        </label>
      )}

      <Banner tone="warning">{error}</Banner>

      {/* parsed file */}
      {parsedData.length > 0 && (
        <div className={`rounded-2xl border-2 p-3 sm:p-4 ${t.inner}`}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-500/10 text-green-600">
                <FileSpreadsheet size={16} />
              </span>
              <div className="min-w-0">
                <p className={`truncate text-[14px] font-black ${t.heading}`}>
                  {fileName}
                </p>
                <p className={`truncate text-[12px] font-medium ${t.muted}`}>
                  <span className="font-black uppercase tracking-wider text-green-600">
                    {parsedData.length} record
                    {parsedData.length !== 1 ? "s" : ""} ready
                  </span>
                  {previewColumns.length > 0 && (
                    <>
                      {" "}
                      · {previewColumns.join(", ")}
                      {allColumns.length > 4
                        ? ` +${allColumns.length - 4} more`
                        : ""}
                    </>
                  )}
                </p>
              </div>
            </div>

            <div className="grid shrink-0 grid-cols-2 gap-2 sm:flex">
              <button
                type="button"
                onClick={resetState}
                disabled={isImporting}
                className={`${btnBase} h-10 border-2 px-4 ${t.btnGhost}`}
              >
                <X size={14} /> Cancel
              </button>
              <button
                type="button"
                onClick={handleProceed}
                disabled={isImporting}
                className={`${btnBase} h-10 px-4 ${t.btnPrimary}`}
              >
                {isImporting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    {importProgress.current}/{importProgress.total}
                  </>
                ) : (
                  <>
                    Import <ArrowRight size={14} />
                  </>
                )}
              </button>
            </div>
          </div>

          {isImporting && (
            <div className="mt-3">
              <div
                className={`h-2 w-full overflow-hidden rounded-md ${isDark ? "bg-white/10" : "bg-[#E2E8F0]"}`}
              >
                <div
                  className={`h-full transition-all duration-200 ${isDark ? "bg-white" : "bg-[#001F3F]"}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className={`mt-1 text-right text-[12px] font-bold ${t.muted}`}>
                {pct}% imported
              </p>
            </div>
          )}
        </div>
      )}

      {parsedData.length === 0 && !error && (
        <p
          className={`flex items-center gap-1.5 text-[12px] font-medium ${t.muted}`}
        >
          <Info size={12} className="shrink-0" /> New columns from the file are
          created automatically as Text fields.
        </p>
      )}
    </div>
  );
};

export default ExcelUpload;
