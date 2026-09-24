"use client";

import { useEffect, useState } from "react";
import { getCurrency } from "@/lib/currency";

function InfoIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      className="h-3.5 w-3.5"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5" />
      <circle cx="12" cy="7.8" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

function DriversIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-3.5 w-3.5"
    >
      <circle cx="12" cy="8" r="3.2" />
      <path d="M4.5 20c1.6-4 4.3-6 7.5-6s5.9 2 7.5 6" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4.5 w-4.5"
    >
      <path d="M12 15V4" />
      <path d="m7.5 8.5 4.5-4.5 4.5 4.5" />
      <path d="M5 13v5.5A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5V13" />
    </svg>
  );
}

/**
 * Floating bar, always on screen regardless of scroll - mirrors the
 * carry-on/seat/passenger pill bar pattern from flysoar, adapted to what a
 * car rental actually has: a deposit and (optionally) extra drivers.
 *
 * Neither pill changes the price or the offer: Discover Cars' offer is a
 * fixed quote with no line-item API to reprice against, and booking itself
 * happens on their own checkout. The drivers stepper is a note-to-self for
 * the traveller, not a live selector - the caption inside its panel says so.
 */
export default function BookingBar({
  bookingUrl,
  depositAmount,
  depositCurrency,
  currency,
  shareTitle,
}: {
  bookingUrl: string;
  depositAmount: number | null;
  depositCurrency: string | null;
  currency: string;
  shareTitle: string;
}) {
  const [openPanel, setOpenPanel] = useState<"deposit" | "drivers" | null>(null);
  const [drivers, setDrivers] = useState(1);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!openPanel) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpenPanel(null);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [openPanel]);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1800);
    return () => clearTimeout(timer);
  }, [copied]);

  async function handleShare() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: shareTitle, url });
      } catch {
        // User dismissed the native share sheet - not an error.
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      // Clipboard unavailable - nothing more we can do here.
    }
  }

  const depositLabel =
    depositAmount !== null
      ? `${getCurrency(depositCurrency ?? currency).symbol}${depositAmount.toFixed(0)}`
      : "None";

  return (
    <>
      {openPanel && (
        <button
          type="button"
          aria-label="Close"
          tabIndex={-1}
          className="fixed inset-0 z-30"
          onClick={() => setOpenPanel(null)}
        />
      )}

      <div className="fixed inset-x-0 bottom-0 z-30 flex justify-center sm:bottom-6 sm:px-4">
        <div className="relative flex w-full items-center justify-between gap-1 rounded-t-3xl border border-orange-900/5 bg-white/95 px-3 pt-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom))] shadow-[0_-8px_30px_-12px_rgba(0,0,0,0.2)] backdrop-blur-xl dark:border-neutral-700/60 dark:bg-neutral-900/95 sm:w-auto sm:max-w-md sm:gap-1.5 sm:rounded-full sm:px-2 sm:py-2 sm:pb-2 sm:shadow-lg">
          <div className="flex items-center gap-1 sm:gap-1.5">
            {/* Deposit */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpenPanel(openPanel === "deposit" ? null : "deposit")}
                className="flex items-center gap-1.5 rounded-full px-2.5 py-2 text-left transition hover:bg-orange-500/5"
              >
                <span className="text-sm font-semibold whitespace-nowrap text-slate-900 dark:text-neutral-100">
                  {depositLabel}
                </span>
                <span className="hidden text-xs text-slate-500 sm:inline dark:text-neutral-400">
                  Deposit
                </span>
                <span className="text-slate-400 dark:text-neutral-500">
                  <InfoIcon />
                </span>
              </button>
              {openPanel === "deposit" && (
                <div className="absolute bottom-full left-0 z-40 mb-2 w-56 rounded-2xl border border-orange-900/5 bg-white p-3 text-xs text-slate-600 shadow-xl dark:border-neutral-700/60 dark:bg-neutral-900 dark:text-neutral-300">
                  {depositAmount !== null
                    ? `A refundable ${depositLabel} hold is taken on your card at pickup, released after the car's returned undamaged.`
                    : "No deposit hold is required for this car."}
                </div>
              )}
            </div>

            <div className="h-6 w-px shrink-0 bg-slate-200 dark:bg-neutral-700" />

            {/* Drivers */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpenPanel(openPanel === "drivers" ? null : "drivers")}
                className="flex items-center gap-1.5 rounded-full px-2.5 py-2 text-left transition hover:bg-orange-500/5"
              >
                <span className="text-slate-500 dark:text-neutral-400">
                  <DriversIcon />
                </span>
                <span className="text-sm font-semibold text-slate-900 dark:text-neutral-100">
                  {drivers}
                </span>
                <span className="hidden text-xs whitespace-nowrap text-slate-500 sm:inline dark:text-neutral-400">
                  Driver{drivers === 1 ? "" : "s"}
                </span>
              </button>
              {openPanel === "drivers" && (
                <div className="absolute bottom-full left-0 z-40 mb-2 w-64 rounded-2xl border border-orange-900/5 bg-white p-3 shadow-xl dark:border-neutral-700/60 dark:bg-neutral-900">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium text-slate-700 dark:text-neutral-200">
                      Additional drivers
                    </span>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setDrivers((d) => Math.max(1, d - 1))}
                        aria-label="Fewer drivers"
                        className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:border-orange-300 dark:border-neutral-700 dark:text-neutral-300"
                      >
                        −
                      </button>
                      <span className="w-4 text-center text-sm font-semibold text-slate-900 dark:text-neutral-100">
                        {drivers}
                      </span>
                      <button
                        type="button"
                        onClick={() => setDrivers((d) => Math.min(5, d + 1))}
                        aria-label="More drivers"
                        className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:border-orange-300 dark:border-neutral-700 dark:text-neutral-300"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-slate-400 dark:text-neutral-500">
                    Let the supplier know at pickup - extra drivers are added and priced there.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-1.5">
            {/* Share */}
            <div className="relative">
              <button
                type="button"
                onClick={handleShare}
                aria-label="Share this car"
                className="flex h-10 w-10 items-center justify-center rounded-full text-slate-500 transition hover:bg-orange-500/5 dark:text-neutral-400"
              >
                <ShareIcon />
              </button>
              {copied && (
                <div className="absolute bottom-full right-0 z-40 mb-2 rounded-lg bg-slate-900 px-2.5 py-1 text-[11px] whitespace-nowrap text-white dark:bg-neutral-100 dark:text-neutral-900">
                  Link copied
                </div>
              )}
            </div>

            {/* Book */}
            <a
              href={bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-2.5 text-sm font-semibold whitespace-nowrap text-white shadow-sm transition hover:from-orange-600 hover:to-orange-700 sm:px-6"
            >
              <span className="sm:hidden">Book</span>
              <span className="hidden sm:inline">Book Now</span>
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
