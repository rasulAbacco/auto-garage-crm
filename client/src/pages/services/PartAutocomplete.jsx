// client/src/pages/services/PartAutocomplete.jsx
// Type-ahead for part names – searches inventory by name, item code, part number, brand or model.
// Picking an item fills name + price (onSelect). Anything else typed stays as a custom part.
import React, { useEffect, useMemo, useRef, useState } from "react";
import { FiPackage, FiPlus, FiSearch, FiLink } from "react-icons/fi";
import { tk } from "../clients/components/clientUi";

export default function PartAutocomplete({
  value,
  inventory = [],
  onTextChange, // (text) => void   — typed manually (custom part)
  onSelect, // (inventoryItem) => void — picked from inventory
  selectedCode, // itemCode of the linked inventory item, if any
  isDark,
}) {
  const t = tk(isDark);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const wrapRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const query = (value || "").trim().toLowerCase();

  const matches = useMemo(() => {
    const list = query
      ? inventory.filter((item) =>
          [
            item.itemName,
            item.itemCode,
            item.partNumber,
            item.brand,
            item.model,
          ]
            .filter(Boolean)
            .some((f) => String(f).toLowerCase().includes(query)),
        )
      : inventory;
    return list.slice(0, 8);
  }, [inventory, query]);

  const exactMatch = inventory.some(
    (i) =>
      i.itemName?.toLowerCase() === query ||
      i.itemCode?.toLowerCase() === query,
  );
  const showCustomOption = query !== "" && !exactMatch && !selectedCode;
  const optionCount = matches.length + (showCustomOption ? 1 : 0);

  const pick = (item) => {
    onSelect(item);
    setOpen(false);
  };
  const useCustom = () => {
    onTextChange((value || "").trim());
    setOpen(false);
  };

  const handleKeyDown = (e) => {
    if (!open || optionCount === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => (h + 1) % optionCount);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => (h - 1 + optionCount) % optionCount);
    } else if (e.key === "Enter") {
      e.preventDefault(); // don't submit the service form
      if (highlight < matches.length) pick(matches[highlight]);
      else useCustom();
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const activeBg = isDark ? "bg-white/10" : "bg-[#F8FAFC]";

  return (
    <div className="relative lg:ml-64" ref={wrapRef}>
      <FiSearch
        className="pointer-events-none absolute left-3 top-5 -translate-y-1/2 text-slate-400"
        size={14}
      />
      <input
        value={value}
        placeholder="Part name or item code"
        onChange={(e) => {
          onTextChange(e.target.value);
          setOpen(true);
          setHighlight(0);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        autoComplete="off"
        className={`h-10 w-full rounded-xl border-2 pl-9 pr-3 text-[14px] font-semibold outline-none transition ${t.input}`}
      />

      {value?.trim() && (
        <span
          className={`mt-1 inline-flex items-center gap-1 rounded-md border px-1.5 py-px text-[12px] font-bold ${
            selectedCode
              ? "border-green-500/30 bg-green-500/10 text-green-600"
              : isDark
                ? "border-white/10 bg-white/5 text-slate-400"
                : "border-[#CBD5E1] bg-[#F8FAFC] text-slate-500"
          }`}
        >
          {selectedCode ? <FiLink size={12} /> : <FiPlus size={12} />}
          {selectedCode ? `Inventory · ${selectedCode}` : "Custom part"}
        </span>
      )}

      {open && optionCount > 0 && (
        <div
          className={`absolute z-40 mt-1 max-h-72 w-full min-w-[280px] overflow-y-auto rounded-xl border-2 shadow-2xl ${t.menu}`}
        >
          {matches.map((item, i) => {
            const qty = Number(item.quantity || 0);
            return (
              <button
                type="button"
                key={item.id}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(item)}
                onMouseEnter={() => setHighlight(i)}
                className={`flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left ${
                  i === highlight ? activeBg : ""
                }`}
              >
                <span className="flex min-w-0 items-start gap-2">
                  <span
                    className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${t.chipNavy}`}
                  >
                    <FiPackage size={12} />
                  </span>
                  <span className="min-w-0">
                    <span
                      className={`block truncate text-[14px] font-bold ${t.heading}`}
                    >
                      {item.itemName}
                    </span>
                    <span className={`block truncate text-[12px] ${t.muted}`}>
                      {item.itemCode}
                      {item.brand ? ` · ${item.brand}` : ""}
                      {item.model ? ` · ${item.model}` : ""}
                    </span>
                  </span>
                </span>
                <span className="shrink-0 text-right">
                  <span className={`block text-[14px] font-black ${t.heading}`}>
                    ₹{Number(item.sellingPrice || 0).toFixed(2)}
                  </span>
                  <span
                    className={`block text-[12px] font-bold ${
                      qty === 0
                        ? "text-red-500"
                        : qty <= (Number(item.minimumStock) || 5)
                          ? "text-amber-500"
                          : "text-green-600"
                    }`}
                  >
                    {qty === 0
                      ? "Out of stock"
                      : `${qty} ${item.unit || "pcs"} left`}
                  </span>
                </span>
              </button>
            );
          })}

          {showCustomOption && (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={useCustom}
              onMouseEnter={() => setHighlight(matches.length)}
              className={`flex w-full items-center gap-2 border-t-2 px-3 py-2.5 text-left text-[14px] font-semibold ${t.line} ${t.heading} ${
                highlight === matches.length ? activeBg : ""
              }`}
            >
              <FiPlus className="shrink-0 text-green-500" size={14} />
              <span className="truncate">
                Use "{value.trim()}" as a custom part
              </span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
