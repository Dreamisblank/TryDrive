"use client";

import { useEffect, useState } from "react";

/**
 * Shows the message /auth/callback attaches as ?auth_error= when sign-in
 * fails, then strips it from the URL. Without this, a failed sign-in
 * redirected back to the page with nothing telling the visitor - or us -
 * what happened.
 */
export default function AuthErrorBanner() {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const error = params.get("auth_error");
    if (!error) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMessage(error);

    params.delete("auth_error");
    const query = params.toString();
    window.history.replaceState(
      {},
      "",
      window.location.pathname + (query ? `?${query}` : ""),
    );
  }, []);

  if (!message) return null;

  return (
    <div className="fixed top-4 left-1/2 z-[100] w-[min(92vw,420px)] -translate-x-1/2">
      <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-white p-4 shadow-xl dark:border-red-900/40 dark:bg-slate-900">
        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-3.5 w-3.5">
            <path d="M12 8v5M12 16h.01" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
        </span>
        <div className="flex-1">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Sign-in didn&apos;t complete
          </p>
          <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-300">{message}</p>
        </div>
        <button
          type="button"
          onClick={() => setMessage(null)}
          aria-label="Dismiss"
          className="text-slate-400 transition hover:text-slate-700 dark:hover:text-slate-200"
        >
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-4 w-4">
            <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}
