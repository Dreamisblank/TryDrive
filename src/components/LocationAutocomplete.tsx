"use client";

import { useEffect, useRef, useState } from "react";
import type { PickupLocation } from "@/lib/locations";

type Props = {
  value: PickupLocation | null;
  onChange: (location: PickupLocation | null) => void;
};

const DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 2;

export default function LocationAutocomplete({ value, onChange }: Props) {
  const [query, setQuery] = useState(value?.name ?? "");
  const [results, setResults] = useState<PickupLocation[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const trimmed = query.trim();
    if (trimmed.length < MIN_QUERY_LENGTH) {
      // Clearing state because the query that would have populated it is
      // gone - the case this rule exempts.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResults([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    debounceRef.current = setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const response = await fetch(
          `/api/locations?q=${encodeURIComponent(trimmed)}`,
          { signal: controller.signal },
        );
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Search failed.");
        setResults(data.locations ?? []);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        setError("Couldn't search locations.");
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
        // Typed text that was never picked from the list isn't a valid
        // search target - fall back to the last real selection instead of
        // silently submitting whatever's left in the box.
        setQuery(value?.name ?? "");
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [value]);

  function selectLocation(loc: PickupLocation) {
    onChange(loc);
    setQuery(loc.name);
    setIsOpen(false);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!isOpen) return;

    if (event.key === "Escape") {
      setIsOpen(false);
      setQuery(value?.name ?? "");
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      const target =
        results.find((loc) => loc.id === highlightedId) ?? results[0];
      if (target) selectLocation(target);
      return;
    }

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (results.length === 0) return;
      const currentIndex = results.findIndex((loc) => loc.id === highlightedId);
      const nextIndex =
        event.key === "ArrowDown"
          ? (currentIndex + 1) % results.length
          : (currentIndex - 1 + results.length) % results.length;
      setHighlightedId(results[nextIndex].id);
    }
  }

  return (
    <div ref={containerRef} className="relative flex-1 sm:min-w-[220px]">
      <label
        htmlFor="pickupLocation"
        className="flex cursor-text flex-col justify-center gap-0.5 rounded-full px-5 py-2.5 text-left transition hover:bg-orange-500/5"
      >
        <span className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-neutral-400">
          <PinIcon />
          Pickup location
        </span>
        <input
          ref={inputRef}
          id="pickupLocation"
          name="pickupLocation"
          type="text"
          autoComplete="off"
          value={query}
          placeholder="Search locations…"
          onFocus={() => {
            setIsOpen(true);
            setHighlightedId(value?.id ?? null);
            inputRef.current?.select();
          }}
          onChange={(event) => {
            setQuery(event.target.value);
            onChange(null);
            setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          required
          className="w-full bg-transparent text-base font-medium text-slate-900 dark:text-neutral-100 outline-none"
        />
      </label>

      {isOpen && query.trim().length >= MIN_QUERY_LENGTH && (
        <div className="absolute top-full left-0 z-30 mt-2 max-h-80 w-full min-w-[280px] overflow-y-auto rounded-2xl border border-orange-900/5 bg-white py-1.5 shadow-xl dark:border-neutral-700/60 dark:bg-neutral-900">
          {isLoading ? (
            <p className="px-4 py-3 text-sm text-slate-500 dark:text-neutral-400">
              Searching…
            </p>
          ) : error ? (
            <p className="px-4 py-3 text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          ) : results.length === 0 ? (
            <p className="px-4 py-3 text-sm text-slate-500 dark:text-neutral-400">
              No locations match &ldquo;{query}&rdquo;.
            </p>
          ) : (
            results.map((loc) => (
              <button
                key={loc.id}
                type="button"
                // Fires before the input's blur/click-outside handler,
                // so the selection lands before this list unmounts.
                onMouseDown={(event) => {
                  event.preventDefault();
                  selectLocation(loc);
                }}
                onMouseEnter={() => setHighlightedId(loc.id)}
                className={`flex w-full flex-col px-4 py-2 text-left transition ${
                  loc.id === highlightedId ? "bg-orange-50 dark:bg-orange-950/30" : ""
                }`}
              >
                <span className="text-sm font-medium text-slate-900 dark:text-neutral-100">
                  {loc.name}
                </span>
                {loc.subtitle && (
                  <span className="truncate text-xs text-slate-500 dark:text-neutral-400">
                    {loc.subtitle}
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function PinIcon() {
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
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}
