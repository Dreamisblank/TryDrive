"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { RentSystLocation } from "@/lib/rentsyst";

type Props = {
  locations: RentSystLocation[];
  value: string;
  onChange: (locationId: string) => void;
};

function matches(loc: RentSystLocation, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    loc.name.toLowerCase().includes(q) ||
    loc.address.toLowerCase().includes(q) ||
    loc.companyName.toLowerCase().includes(q)
  );
}

export default function LocationAutocomplete({
  locations,
  value,
  onChange,
}: Props) {
  const selected = useMemo(
    () => locations.find((loc) => String(loc.id) === value) ?? null,
    [locations, value],
  );

  const [query, setQuery] = useState(selected?.name ?? "");
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedId, setHighlightedId] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(
    () => locations.filter((loc) => matches(loc, query)),
    [locations, query],
  );

  const filteredByCompany = useMemo(() => {
    const groups = new Map<string, RentSystLocation[]>();
    for (const loc of filtered) {
      const group = groups.get(loc.companyName) ?? [];
      group.push(loc);
      groups.set(loc.companyName, group);
    }
    return Array.from(groups.entries());
  }, [filtered]);

  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
        // Typed text that was never picked from the list isn't a valid
        // search target - fall back to the last real selection instead of
        // silently submitting whatever's left in the box.
        setQuery(selected?.name ?? "");
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [selected]);

  function selectLocation(loc: RentSystLocation) {
    onChange(String(loc.id));
    setQuery(loc.name);
    setIsOpen(false);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!isOpen && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
      setIsOpen(true);
      return;
    }
    if (!isOpen) return;

    if (event.key === "Escape") {
      setIsOpen(false);
      setQuery(selected?.name ?? "");
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      const target =
        filtered.find((loc) => loc.id === highlightedId) ?? filtered[0];
      if (target) selectLocation(target);
      return;
    }

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (filtered.length === 0) return;
      const currentIndex = filtered.findIndex((loc) => loc.id === highlightedId);
      const nextIndex =
        event.key === "ArrowDown"
          ? (currentIndex + 1) % filtered.length
          : (currentIndex - 1 + filtered.length) % filtered.length;
      setHighlightedId(filtered[nextIndex].id);
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
          disabled={locations.length === 0}
          placeholder={locations.length === 0 ? "No locations available" : "Search locations…"}
          onFocus={() => {
            setIsOpen(true);
            setHighlightedId(selected?.id ?? null);
            inputRef.current?.select();
          }}
          onChange={(event) => {
            setQuery(event.target.value);
            setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          required
          className="w-full bg-transparent text-base font-medium text-slate-900 dark:text-neutral-100 outline-none disabled:cursor-not-allowed"
        />
      </label>

      {isOpen && locations.length > 0 && (
        <div className="absolute top-full left-0 z-30 mt-2 max-h-80 w-full min-w-[280px] overflow-y-auto rounded-2xl border border-orange-900/5 bg-white py-1.5 shadow-xl dark:border-neutral-700/60 dark:bg-neutral-900">
          {filtered.length === 0 ? (
            <p className="px-4 py-3 text-sm text-slate-500 dark:text-neutral-400">
              No locations match &ldquo;{query}&rdquo;.
            </p>
          ) : (
            filteredByCompany.map(([companyName, companyLocations]) => (
              <div key={companyName}>
                <p className="px-4 pt-2 pb-1 text-[11px] font-semibold tracking-wide text-slate-400 uppercase dark:text-neutral-500">
                  {companyName}
                </p>
                {companyLocations.map((loc) => (
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
                      loc.id === highlightedId
                        ? "bg-orange-50 dark:bg-orange-950/30"
                        : ""
                    }`}
                  >
                    <span className="text-sm font-medium text-slate-900 dark:text-neutral-100">
                      {loc.name}
                    </span>
                    <span className="truncate text-xs text-slate-500 dark:text-neutral-400">
                      {loc.address}
                    </span>
                  </button>
                ))}
              </div>
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
