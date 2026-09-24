"use client";

import { useEffect, useState } from "react";
import {
  DEPOSIT_OPTIONS,
  TRANSMISSIONS,
  depositLabel,
  transmissionLabel,
  type CategorySummary,
  type DepositFilter,
  type Filters,
} from "@/lib/offerFilters";
import { carImageAt } from "@/lib/carImage";

type Panel = "category" | "transmission" | "deposit";

function ChevronDown({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`}
      aria-hidden="true"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-orange-600 dark:text-orange-400" aria-hidden="true">
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </svg>
  );
}

function OptionButton({
  selected,
  disabled = false,
  onClick,
  children,
  trailing,
}: {
  selected: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  trailing?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      disabled={disabled}
      onClick={onClick}
      className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-3 text-left text-[15px] transition active:bg-orange-100/70 disabled:opacity-40 dark:active:bg-neutral-800 ${
        selected
          ? "bg-orange-50 font-semibold text-orange-800 dark:bg-orange-950/40 dark:text-orange-300"
          : "text-slate-800 dark:text-neutral-100"
      }`}
    >
      <span className="flex min-w-0 items-center gap-3">{children}</span>
      <span className="flex shrink-0 items-center gap-2 text-sm font-normal text-slate-500 dark:text-neutral-400">
        {trailing}
        {selected && <CheckIcon />}
      </span>
    </button>
  );
}

export default function MobileFilterBar({
  filters,
  onChange,
  summaries,
  transmissionCounts,
  depositCounts,
  currencySymbol,
  showClear,
  onClear,
}: {
  filters: Filters;
  onChange: (next: Filters) => void;
  summaries: CategorySummary[];
  transmissionCounts: Record<string, number>;
  depositCounts: Record<DepositFilter, number>;
  currencySymbol: string;
  showClear: boolean;
  onClear: () => void;
}) {
  const [open, setOpen] = useState<Panel | null>(null);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(null);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  function choose(next: Filters) {
    onChange(next);
    setOpen(null);
  }

  const singleTransmission =
    filters.transmissions.length === 1 ? filters.transmissions[0] : null;

  const pills: { panel: Panel; label: string; active: boolean }[] = [
    {
      // Always "Car Type" - the orange active state (and the check in the
      // open list) shows which type is chosen.
      panel: "category",
      label: "Car Type",
      active: filters.category !== null,
    },
    {
      panel: "transmission",
      label: singleTransmission ? transmissionLabel(singleTransmission) : "Transmission",
      active: singleTransmission !== null,
    },
    {
      panel: "deposit",
      label: filters.deposit === "any" ? "Deposit" : depositLabel(filters.deposit, currencySymbol),
      active: filters.deposit !== "any",
    },
  ];

  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="Close filters"
          tabIndex={-1}
          className="fixed inset-0 z-20 cursor-default desktop:hidden"
          onClick={() => setOpen(null)}
        />
      )}

      <div className="sticky top-0 z-30 mt-2 py-2.5 desktop:hidden">
        {/* Bleeds to the screen edges (-mx-6/px-6) so pills scroll off the
            side naturally instead of being clipped inside the page gutter. */}
        <div className="-mx-6 flex gap-2 overflow-x-auto px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {pills.map((pill) => (
            <button
              key={pill.panel}
              type="button"
              aria-expanded={open === pill.panel}
              aria-haspopup="listbox"
              onClick={() => setOpen(open === pill.panel ? null : pill.panel)}
              className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium whitespace-nowrap transition ${
                pill.active
                  ? "border-orange-600 bg-orange-600 text-white"
                  : "border-slate-200 bg-white text-slate-800 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
              }`}
            >
              {pill.label}
              <ChevronDown open={open === pill.panel} />
            </button>
          ))}
          {showClear && (
            <button
              type="button"
              onClick={() => {
                onClear();
                setOpen(null);
              }}
              className="shrink-0 rounded-full px-3 py-2 text-sm font-medium whitespace-nowrap text-orange-700 dark:text-orange-400"
            >
              Clear
            </button>
          )}
        </div>

        {open && (
          <div
            role="listbox"
            aria-label={open === "category" ? "Car Type" : open === "transmission" ? "Transmission" : "Deposit"}
            className="absolute inset-x-0 top-full z-30 max-h-[60vh] overflow-y-auto rounded-2xl border border-orange-900/5 bg-white p-1.5 shadow-xl dark:border-neutral-700/60 dark:bg-neutral-900"
          >
            {open === "category" && (
              <>
                <OptionButton
                  selected={filters.category === null}
                  onClick={() => choose({ ...filters, category: null })}
                >
                  All car types
                </OptionButton>
                {summaries.map((summary) => {
                  const image = carImageAt(summary.imageUrl, 200);
                  const selected = filters.category === summary.category;
                  return (
                    <OptionButton
                      key={summary.category}
                      selected={selected}
                      disabled={summary.fromPrice === null && !selected}
                      onClick={() => choose({ ...filters, category: summary.category })}
                      trailing={
                        summary.fromPrice !== null
                          ? `from ${currencySymbol}${summary.fromPrice.toFixed(2)}`
                          : "No matches"
                      }
                    >
                      <span className="flex h-8 w-12 shrink-0 items-center justify-center">
                        {image && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={image} alt="" className="max-h-full max-w-full object-contain" />
                        )}
                      </span>
                      {summary.label}
                    </OptionButton>
                  );
                })}
              </>
            )}

            {open === "transmission" && (
              <>
                <OptionButton
                  selected={filters.transmissions.length !== 1}
                  onClick={() => choose({ ...filters, transmissions: [] })}
                >
                  Any transmission
                </OptionButton>
                {TRANSMISSIONS.map((value) => {
                  const count = transmissionCounts[value] ?? 0;
                  const selected = singleTransmission === value;
                  return (
                    <OptionButton
                      key={value}
                      selected={selected}
                      disabled={count === 0 && !selected}
                      onClick={() => choose({ ...filters, transmissions: [value] })}
                      trailing={count}
                    >
                      {transmissionLabel(value)}
                    </OptionButton>
                  );
                })}
              </>
            )}

            {open === "deposit" &&
              DEPOSIT_OPTIONS.map((value) => {
                const count = depositCounts[value];
                const selected = filters.deposit === value;
                return (
                  <OptionButton
                    key={value}
                    selected={selected}
                    disabled={count === 0 && !selected}
                    onClick={() => choose({ ...filters, deposit: value })}
                    trailing={count}
                  >
                    {depositLabel(value, currencySymbol)}
                  </OptionButton>
                );
              })}
          </div>
        )}
      </div>
    </>
  );
}
