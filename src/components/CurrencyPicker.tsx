"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CURRENCIES,
  CURRENCY_COOKIE,
  DEFAULT_CURRENCY,
  detectCurrency,
  getCurrency,
  normalizeCurrency,
} from "@/lib/currency";

function readCurrencyCookie(): string | undefined {
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${CURRENCY_COOKIE}=([^;]*)`),
  );
  return match ? decodeURIComponent(match[1]) : undefined;
}

function writeCurrencyCookie(code: string) {
  document.cookie = `${CURRENCY_COOKIE}=${code}; path=/; max-age=31536000; SameSite=Lax`;
}

export default function CurrencyPicker() {
  const router = useRouter();
  const [current, setCurrent] = useState(DEFAULT_CURRENCY);
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Resolve the real currency only after hydration. The server has no way to
  // know it without reading cookies (which would opt every page out of static
  // rendering), so we render the default first and correct it here.
  useEffect(() => {
    const stored = readCurrencyCookie();
    // On a first visit, guess from the browser's own locale and persist it.
    const resolved = stored ? normalizeCurrency(stored) : detectCurrency();
    if (!stored) writeCurrencyCookie(resolved);

    // Reading the cookie is exactly the "subscribe to an external system"
    // case this rule exempts, and it can only run client-side — same pattern
    // as HeroHeadline.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrent(resolved);

    // Re-render server components so prices come back in the detected
    // currency rather than the default we rendered on the server.
    if (!stored && resolved !== DEFAULT_CURRENCY) {
      router.refresh();
    }
  }, [router]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function choose(code: string) {
    setOpen(false);
    if (code === current) return;
    writeCurrencyCookie(code);
    setCurrent(code);
    // Prices come from RentSyst server-side, so re-fetch rather than
    // converting in the browser.
    router.refresh();
  }

  const active = getCurrency(current);

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Currency: ${active.label}`}
        className="flex shrink-0 items-center gap-1 rounded-full px-2 py-1.5 text-sm font-medium whitespace-nowrap text-slate-700 sm:gap-1.5 sm:px-3 dark:text-neutral-200 transition hover:bg-white/70 dark:hover:bg-neutral-800/70 hover:text-slate-900 dark:hover:text-white"
      >
        <span>{active.symbol}</span>
        <span>{active.code}</span>
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-3.5 w-3.5">
          <path
            d="m6 9 6 6 6-6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute right-0 z-40 mt-2 w-56 overflow-hidden rounded-2xl border border-orange-900/5 dark:border-neutral-700/60 bg-white dark:bg-neutral-900 py-1.5 shadow-xl"
        >
          {CURRENCIES.map((currency) => (
            <li key={currency.code}>
              <button
                type="button"
                role="option"
                aria-selected={currency.code === current}
                onClick={() => choose(currency.code)}
                className={`flex w-full items-center gap-3 px-4 py-2 text-left text-sm transition hover:bg-orange-50 dark:hover:bg-orange-950/40 ${
                  currency.code === current
                    ? "font-semibold text-orange-700 dark:text-orange-400"
                    : "text-slate-700 dark:text-neutral-200"
                }`}
              >
                <span className="w-8 shrink-0">{currency.symbol}</span>
                <span className="flex-1">{currency.label}</span>
                <span className="text-xs text-slate-400 dark:text-neutral-500">{currency.code}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
