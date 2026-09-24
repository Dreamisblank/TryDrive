"use client";

import {
  DEPOSIT_OPTIONS,
  TRANSMISSIONS,
  depositLabel,
  transmissionLabel,
  type DepositFilter,
  type Filters,
} from "@/lib/offerFilters";

function OptionRow({
  type,
  name,
  checked,
  disabled,
  label,
  count,
  onChange,
}: {
  type: "checkbox" | "radio";
  name: string;
  checked: boolean;
  disabled: boolean;
  label: string;
  count: number;
  onChange: () => void;
}) {
  return (
    <label
      className={`flex items-center justify-between gap-2 rounded-lg px-1.5 py-1.5 text-sm transition ${
        disabled
          ? "cursor-not-allowed text-slate-300 dark:text-neutral-600"
          : "cursor-pointer text-slate-700 hover:bg-orange-500/5 dark:text-neutral-200"
      }`}
    >
      <span className="flex min-w-0 items-center gap-2">
        <input
          type={type}
          name={name}
          checked={checked}
          disabled={disabled}
          onChange={onChange}
          className="h-4 w-4 shrink-0 accent-orange-600"
        />
        <span className="truncate">{label}</span>
      </span>
      <span className="shrink-0 text-xs text-slate-400 tabular-nums dark:text-neutral-500">{count}</span>
    </label>
  );
}

export default function FilterSidebar({
  filters,
  onChange,
  transmissionCounts,
  depositCounts,
  currencySymbol,
  showClear,
  onClear,
}: {
  filters: Filters;
  onChange: (next: Filters) => void;
  transmissionCounts: Record<string, number>;
  depositCounts: Record<DepositFilter, number>;
  currencySymbol: string;
  showClear: boolean;
  onClear: () => void;
}) {
  function toggleTransmission(value: string) {
    const has = filters.transmissions.includes(value);
    onChange({
      ...filters,
      transmissions: has
        ? filters.transmissions.filter((t) => t !== value)
        : [...filters.transmissions, value],
    });
  }

  return (
    <div className="rounded-2xl border border-orange-900/5 bg-white/90 p-4 shadow-sm backdrop-blur-sm dark:border-neutral-700/60 dark:bg-neutral-900/80">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-neutral-100">Filters</h2>
        {showClear && (
          <button
            type="button"
            onClick={onClear}
            className="text-xs font-medium text-orange-700 hover:text-orange-800 dark:text-orange-400 dark:hover:text-orange-300"
          >
            Clear all
          </button>
        )}
      </div>

      <fieldset className="mt-4">
        <legend className="mb-1 text-[11px] font-semibold tracking-wide text-slate-500 uppercase dark:text-neutral-400">
          Transmission
        </legend>
        {TRANSMISSIONS.map((value) => {
          const checked = filters.transmissions.includes(value);
          const count = transmissionCounts[value] ?? 0;
          return (
            <OptionRow
              key={value}
              type="checkbox"
              name="transmission"
              checked={checked}
              disabled={count === 0 && !checked}
              label={transmissionLabel(value)}
              count={count}
              onChange={() => toggleTransmission(value)}
            />
          );
        })}
      </fieldset>

      <div className="my-3 h-px bg-slate-200/80 dark:bg-neutral-700/60" />

      <fieldset>
        <legend className="mb-1 text-[11px] font-semibold tracking-wide text-slate-500 uppercase dark:text-neutral-400">
          Deposit
        </legend>
        {DEPOSIT_OPTIONS.map((value) => {
          const checked = filters.deposit === value;
          const count = depositCounts[value];
          return (
            <OptionRow
              key={value}
              type="radio"
              name="deposit"
              checked={checked}
              disabled={count === 0 && !checked}
              label={depositLabel(value, currencySymbol)}
              count={count}
              onChange={() => onChange({ ...filters, deposit: value })}
            />
          );
        })}
      </fieldset>
    </div>
  );
}
