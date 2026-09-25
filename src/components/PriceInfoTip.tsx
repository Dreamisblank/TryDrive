"use client";

import { useEffect, useId, useRef, useState } from "react";

/**
 * "?" that explains a price claim. Hover shows it on desktop; tap toggles it
 * on touch screens, which have no hover (and iOS doesn't focus buttons on
 * tap, so a focus-only tooltip wouldn't open there). The tooltip anchors to
 * the nearest positioned ancestor - the caller's price row - so it can line
 * up with the price instead of spilling off the edge of a phone screen.
 */
export default function PriceInfoTip({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const tooltipId = useId();

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <span ref={wrapperRef} className="group/tip inline-flex">
      <button
        type="button"
        aria-label="How is this worked out?"
        aria-describedby={tooltipId}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex h-4 w-4 items-center justify-center rounded-full border border-red-300 text-[10px] leading-none font-bold text-red-600 transition hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/40"
      >
        ?
      </button>
      <span
        id={tooltipId}
        role="tooltip"
        className={`pointer-events-none absolute top-full right-0 z-20 mt-2 w-64 max-w-[calc(100vw-4rem)] rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-xs leading-relaxed font-medium whitespace-normal text-black shadow-lg transition-opacity duration-150 ${
          open ? "opacity-100" : "opacity-0 group-hover/tip:opacity-100"
        }`}
      >
        {text}
      </span>
    </span>
  );
}
