"use client";

import { useEffect, useRef, useState } from "react";
import type { CategorySummary } from "@/lib/offerFilters";
import { carImageAt } from "@/lib/carImage";

function Chevron({ direction }: { direction: "left" | "right" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
      {direction === "right" ? <path d="M5 12h14M13 6l6 6-6 6" /> : <path d="M19 12H5M11 6l-6 6 6 6" />}
    </svg>
  );
}

export default function CategoryStrip({
  summaries,
  selected,
  currencySymbol,
  onSelect,
}: {
  summaries: CategorySummary[];
  selected: string | null;
  currencySymbol: string;
  onSelect: (category: string | null) => void;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    function update() {
      if (!el) return;
      setCanScrollLeft(el.scrollLeft > 4);
      setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
    }
    // ResizeObserver also fires once on observe, which sets the initial
    // arrow state.
    const observer = new ResizeObserver(update);
    observer.observe(el);
    el.addEventListener("scroll", update, { passive: true });
    return () => {
      observer.disconnect();
      el.removeEventListener("scroll", update);
    };
  }, []);

  function scrollByPage(direction: 1 | -1) {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: "smooth" });
  }

  const arrowClass =
    "absolute top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-orange-900/5 bg-white text-slate-700 shadow-md transition hover:bg-orange-50 hover:text-orange-700 dark:border-neutral-700/60 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700";

  return (
    <div className="relative">
      <div
        ref={scrollerRef}
        role="group"
        aria-label="Car type"
        className="flex gap-3 overflow-x-auto scroll-smooth px-0.5 py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {summaries.map((summary) => {
          const active = summary.category === selected;
          const unavailable = summary.fromPrice === null && !active;
          const image = carImageAt(summary.imageUrl, 270);
          return (
            <button
              key={summary.category}
              type="button"
              aria-pressed={active}
              disabled={unavailable}
              onClick={() => onSelect(active ? null : summary.category)}
              className={`group flex w-[7.5rem] shrink-0 flex-col items-center rounded-2xl border bg-white/90 px-2 pt-3 pb-2.5 text-center shadow-sm backdrop-blur-sm transition dark:bg-neutral-900/80 ${
                active
                  ? "border-orange-400 ring-2 ring-orange-200 dark:border-orange-600 dark:ring-orange-900/50"
                  : "border-orange-900/5 hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-md dark:border-neutral-700/60 dark:hover:border-orange-800"
              } disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:shadow-sm`}
            >
              <div className="flex h-14 w-full items-center justify-center">
                {image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={image}
                    alt=""
                    className="max-h-full max-w-full object-contain drop-shadow-[0_6px_6px_rgba(15,23,42,0.14)] transition-transform duration-200 group-hover:scale-105"
                  />
                ) : null}
              </div>
              <span className="mt-2 text-sm font-semibold text-slate-900 dark:text-neutral-100">
                {summary.label}
              </span>
              <span
                className={`text-xs ${
                  active ? "font-medium text-orange-700 dark:text-orange-400" : "text-slate-500 dark:text-neutral-400"
                }`}
              >
                {summary.fromPrice !== null
                  ? `from ${currencySymbol}${summary.fromPrice.toFixed(2)}`
                  : "No matches"}
              </span>
            </button>
          );
        })}
      </div>

      {canScrollLeft && (
        <button
          type="button"
          aria-label="Scroll car types left"
          onClick={() => scrollByPage(-1)}
          className={`${arrowClass} -left-3`}
        >
          <Chevron direction="left" />
        </button>
      )}
      {canScrollRight && (
        <button
          type="button"
          aria-label="Scroll car types right"
          onClick={() => scrollByPage(1)}
          className={`${arrowClass} -right-3`}
        >
          <Chevron direction="right" />
        </button>
      )}
    </div>
  );
}
