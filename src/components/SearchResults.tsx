"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  DEPOSIT_OPTIONS,
  EMPTY_FILTERS,
  TRANSMISSIONS,
  categorySummaries,
  defaultFilters,
  depositCounts,
  hasActiveFilters,
  matchesFilters,
  transmissionCounts,
  type Filters,
  type ResultOffer,
} from "@/lib/offerFilters";
import OfferCard from "./OfferCard";
import CategoryStrip from "./CategoryStrip";
import FilterSidebar from "./FilterSidebar";
import MobileFilterBar from "./MobileFilterBar";

const MAX_RESULTS_SHOWN = 40;
const EAGER_IMAGES = 4;

function readStoredFilters(key: string, categories: Set<string>): Filters | null {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Filters>;
    const category =
      typeof parsed.category === "string" && categories.has(parsed.category)
        ? parsed.category
        : null;
    const transmissions = Array.isArray(parsed.transmissions)
      ? parsed.transmissions.filter((t): t is string =>
          (TRANSMISSIONS as readonly string[]).includes(t as string),
        )
      : [];
    const deposit = DEPOSIT_OPTIONS.includes(parsed.deposit as Filters["deposit"])
      ? (parsed.deposit as Filters["deposit"])
      : "any";
    return { category, transmissions, deposit };
  } catch {
    return null;
  }
}

export default function SearchResults({
  offers,
  currencySymbol,
  storageKey,
}: {
  /** Every offer for the search, cheapest first. */
  offers: ResultOffer[];
  currencySymbol: string;
  /** Identifies this search, so filters survive going into an offer and
   *  back (the page remounts on back navigation) without leaking into a
   *  different search. */
  storageKey: string;
}) {
  const [filters, setFilters] = useState<Filters>(() => defaultFilters(offers));
  const topRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // sessionStorage isn't available during SSR, so restoring has to wait
    // for mount.
    const stored = readStoredFilters(storageKey, new Set(offers.map((o) => o.category)));
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (stored) setFilters(stored);
  }, [storageKey, offers]);

  function updateFilters(next: Filters) {
    setFilters(next);
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(next));
    } catch {
      // Storage unavailable - filters just won't survive a back navigation.
    }
    // If the user is scrolled down the list, bring the top of the results
    // back into view so the (now different) list starts from its best price.
    const el = topRef.current;
    if (el && el.getBoundingClientRect().top < parseFloat(getComputedStyle(el).scrollMarginTop)) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  const clearFilters = () => updateFilters(EMPTY_FILTERS);
  const active = hasActiveFilters(filters);

  const summaries = useMemo(() => categorySummaries(offers, filters), [offers, filters]);
  const tCounts = useMemo(() => transmissionCounts(offers, filters), [offers, filters]);
  const dCounts = useMemo(() => depositCounts(offers, filters), [offers, filters]);
  const filtered = useMemo(
    () => offers.filter((offer) => matchesFilters(offer, filters)),
    [offers, filters],
  );
  const shown = filtered.slice(0, MAX_RESULTS_SHOWN);

  const noun = active ? "matching car" : "car";
  const summary =
    filtered.length > shown.length
      ? `Showing the cheapest ${shown.length} of ${filtered.length} ${noun}s`
      : `${filtered.length} ${noun}${filtered.length === 1 ? "" : "s"}`;

  return (
    <>
      <div ref={topRef} className="scroll-mt-2 desktop:scroll-mt-36" />

      <div className="mt-2 hidden desktop:block">
        <CategoryStrip
          summaries={summaries}
          selected={filters.category}
          currencySymbol={currencySymbol}
          onSelect={(category) => updateFilters({ ...filters, category })}
        />
      </div>

      {/* Rendered straight into <main> (no wrapper) - it's sticky, and a
          sticky element only sticks within its parent's height. */}
      <MobileFilterBar
        filters={filters}
        onChange={updateFilters}
        summaries={summaries}
        transmissionCounts={tCounts}
        depositCounts={dCounts}
        currencySymbol={currencySymbol}
        showClear={active}
        onClear={clearFilters}
      />

      <div className="desktop:mt-6 desktop:grid desktop:grid-cols-[11rem_minmax(0,1fr)] desktop:items-start desktop:gap-5">
        <aside className="hidden desktop:sticky desktop:top-36 desktop:block">
          <FilterSidebar
            filters={filters}
            onChange={updateFilters}
            transmissionCounts={tCounts}
            depositCounts={dCounts}
            currencySymbol={currencySymbol}
            showClear={active}
            onClear={clearFilters}
          />
        </aside>

        <div className="min-w-0">
          <p className="mt-2 text-sm text-slate-500 desktop:mt-0 dark:text-neutral-400" aria-live="polite">
            {summary}
          </p>

          {shown.length === 0 ? (
            <div className="mt-4 rounded-3xl border border-dashed border-orange-300 bg-white/70 p-10 text-center text-slate-500 backdrop-blur-sm dark:border-orange-800 dark:bg-neutral-900/60 dark:text-neutral-400">
              No cars match these filters.
              <button
                type="button"
                onClick={clearFilters}
                className="mt-3 block w-full text-sm font-semibold text-orange-700 hover:text-orange-800 dark:text-orange-400 dark:hover:text-orange-300"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="mt-4 flex flex-col gap-5 desktop:gap-4">
              {shown.map((offer, index) => (
                <OfferCard
                  key={offer.offerId}
                  offer={offer}
                  isBest={index === 0}
                  eagerImage={index < EAGER_IMAGES}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
