function SeatIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="h-3 w-3" aria-hidden="true">
      <circle cx="12" cy="7" r="3.5" />
      <path d="M5 21c1.2-4 3.9-6 7-6s5.8 2 7 6" />
    </svg>
  );
}

function BagIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3" aria-hidden="true">
      <rect x="5" y="7" width="14" height="13" rx="2" />
      <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}

function GearIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="h-3 w-3" aria-hidden="true">
      <circle cx="6" cy="5" r="1.6" />
      <circle cx="12" cy="5" r="1.6" />
      <circle cx="18" cy="5" r="1.6" />
      <circle cx="6" cy="19" r="1.6" />
      <circle cx="12" cy="19" r="1.6" />
      <path d="M6 6.6v10.8M12 6.6v10.8M18 6.6V12H6" />
    </svg>
  );
}

export default function OfferFeatureChips({
  seats,
  bags,
  transmission,
}: {
  seats: number;
  bags: number;
  transmission: string;
}) {
  const isAutomatic = transmission.toLowerCase().startsWith("auto");
  const chips = [
    { key: "seats", icon: <SeatIcon />, text: String(seats), tip: `${seats} seats` },
    {
      key: "bags",
      icon: <BagIcon />,
      text: String(bags),
      tip: `Fits ${bags} large bag${bags === 1 ? "" : "s"}`,
    },
    {
      key: "transmission",
      icon: <GearIcon />,
      text: isAutomatic ? "Auto" : "Manual",
      tip: isAutomatic ? "Automatic transmission" : "Manual transmission",
    },
  ];

  return (
    <div className="mt-1.5 flex flex-wrap gap-1">
      {chips.map((chip) => (
        <span
          key={chip.key}
          className="group/chip relative inline-flex cursor-default items-center gap-1 rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-600 dark:bg-neutral-800 dark:text-neutral-300"
        >
          {chip.icon}
          <span aria-hidden="true">{chip.text}</span>
          <span className="sr-only">{chip.tip}</span>
          <span
            aria-hidden="true"
            className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1.5 -translate-x-1/2 rounded-md bg-slate-900 px-2 py-1 text-[11px] font-medium whitespace-nowrap text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover/chip:opacity-100 dark:bg-neutral-100 dark:text-neutral-900"
          >
            {chip.tip}
          </span>
        </span>
      ))}
    </div>
  );
}
