"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { formatLongDate, toIso } from "@/lib/formatDateTime";

type Props = {
  pickupDate: string;
  dropoffDate: string;
  minDate: string;
  onChange: (pickupDate: string, dropoffDate: string) => void;
};

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];
const MONTHS_SHOWN = 3;

function monthLabel(year: number, month: number) {
  const names = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  return `${names[month]} ${year}`;
}

function monthCells(year: number, month: number): (string | null)[] {
  const startOffset = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (string | null)[] = Array(startOffset).fill(null);
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push(toIso(new Date(year, month, day)));
  }
  return cells;
}

function CalendarIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
    >
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M3 10h18" />
    </svg>
  );
}

export default function DateRangePicker({
  pickupDate,
  dropoffDate,
  minDate,
  onChange,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [draftPickup, setDraftPickup] = useState(pickupDate);
  const [draftDropoff, setDraftDropoff] = useState<string | null>(dropoffDate);

  function open() {
    // Re-seed the draft from the committed value each time the picker
    // opens, so a closed-without-applying edit doesn't leak in next time.
    setDraftPickup(pickupDate);
    setDraftDropoff(dropoffDate);
    setIsOpen(true);
  }

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  const months = useMemo(() => {
    const start = new Date(`${minDate}T00:00:00`);
    return Array.from({ length: MONTHS_SHOWN }, (_, i) => {
      const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  }, [minDate]);

  function handleDayClick(iso: string) {
    if (iso < minDate) return;

    if (draftDropoff !== null || iso <= draftPickup) {
      // Either the previous range was already complete, or this date is
      // before/equal to the current start - either way, begin a fresh range.
      setDraftPickup(iso);
      setDraftDropoff(null);
    } else {
      setDraftDropoff(iso);
    }
  }

  function handleApply() {
    if (!draftDropoff) return;
    onChange(draftPickup, draftDropoff);
    setIsOpen(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={open}
        className="flex flex-1 flex-col justify-center gap-0.5 rounded-full px-5 py-2.5 text-left transition hover:bg-orange-500/5 sm:min-w-[260px]"
      >
        <span className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-neutral-400">
          <CalendarIcon />
          Dates
        </span>
        <span className="text-base font-medium text-slate-900 dark:text-neutral-100">
          {formatLongDate(pickupDate)} <span className="text-slate-400 dark:text-neutral-500">&rarr;</span>{" "}
          {formatLongDate(dropoffDate)}
        </span>
      </button>

      {isOpen && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center sm:p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-label="Select dates"
            className="relative flex h-full w-full flex-col overflow-hidden bg-white dark:bg-neutral-900 sm:h-[min(85vh,680px)] sm:max-w-md sm:rounded-3xl sm:shadow-2xl"
          >
            <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-neutral-700/60">
              <h2 className="text-base font-bold tracking-tight text-slate-900 dark:text-neutral-100">
                {draftPickup && draftDropoff
                  ? `${formatLongDate(draftPickup)} → ${formatLongDate(draftDropoff)}`
                  : draftPickup
                    ? `${formatLongDate(draftPickup)} → pick a return date`
                    : "Select dates"}
              </h2>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Close"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-neutral-800 dark:hover:text-white"
              >
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-4 w-4">
                  <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 px-5 pt-3 text-center text-xs font-medium text-slate-400 dark:text-neutral-500">
              {WEEKDAYS.map((day, i) => (
                <div key={i}>{day}</div>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto px-5 pb-3">
              {months.map(({ year, month }) => (
                <div key={`${year}-${month}`} className="mt-4">
                  <p className="mb-2 text-sm font-semibold text-slate-900 dark:text-neutral-100">
                    {monthLabel(year, month)}
                  </p>
                  <div className="grid grid-cols-7 gap-1">
                    {monthCells(year, month).map((iso, i) => {
                      if (!iso) return <div key={i} />;

                      const disabled = iso < minDate;
                      const isPickup = iso === draftPickup;
                      const isDropoff = iso === draftDropoff;
                      const inRange =
                        !!draftDropoff && iso > draftPickup && iso < draftDropoff;

                      return (
                        <button
                          key={iso}
                          type="button"
                          disabled={disabled}
                          onClick={() => handleDayClick(iso)}
                          className={`relative rounded-xl py-2.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:text-slate-300 dark:disabled:text-neutral-700 ${
                            isPickup || isDropoff
                              ? "bg-orange-600 text-white"
                              : inRange
                                ? "bg-orange-100 text-slate-900 dark:bg-orange-900/30 dark:text-neutral-100"
                                : disabled
                                  ? ""
                                  : "text-slate-800 hover:bg-orange-50 dark:text-neutral-100 dark:hover:bg-orange-950/30"
                          }`}
                        >
                          {Number(iso.slice(-2))}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="shrink-0 border-t border-slate-200 p-4 dark:border-neutral-700/60">
              <button
                type="button"
                onClick={handleApply}
                disabled={!draftDropoff}
                className="w-full rounded-full bg-gradient-to-r from-orange-500 to-orange-600 py-3 text-sm font-semibold text-white shadow-sm transition hover:from-orange-600 hover:to-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Apply
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
