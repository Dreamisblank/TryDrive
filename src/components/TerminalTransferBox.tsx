import { getTerminalTransferGuidance } from "@/lib/terminalTransfer";

const PICKUP_TYPE_LABELS: Record<string, string> = {
  in_terminal: "Desk in the terminal",
  shuttle_bus: "Shuttle bus to the desk",
  meet_and_greet: "Meet & greet",
  outside_of_terminal: "Desk outside the terminal",
  car_rental_center: "Car rental centre",
};

const cardClass =
  "rounded-3xl border border-orange-900/5 dark:border-neutral-700/60 bg-white/90 dark:bg-neutral-900/80 p-5 shadow-sm lg:p-6";

function Heading() {
  return (
    <h2 className="text-sm font-semibold tracking-wide text-slate-500 uppercase dark:text-neutral-400">
      Getting to your car
    </h2>
  );
}

/**
 * Prefers the rental company's own pickup directions (supplied with the
 * offer) - they're specific to this desk and they're the supplier's words,
 * not ours. Falls back to the researched per-airport guidance only when the
 * offer doesn't include any.
 */
export default function TerminalTransferBox({
  pickupLocationName,
  supplierName,
  pickupInstructions,
  pickupType,
}: {
  pickupLocationName: string;
  supplierName: string;
  pickupInstructions: string | null;
  pickupType: string | null;
}) {
  const typeLabel = pickupType ? PICKUP_TYPE_LABELS[pickupType] : undefined;

  if (pickupInstructions) {
    return (
      <div className={cardClass}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Heading />
          {typeLabel && (
            <span className="rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-orange-700 dark:bg-orange-900/40 dark:text-orange-400">
              {typeLabel}
            </span>
          )}
        </div>
        <p className="mt-2 text-sm leading-relaxed whitespace-pre-line text-slate-700 dark:text-neutral-200">
          {pickupInstructions}
        </p>
        <p className="mt-3 text-xs text-slate-400 dark:text-neutral-500">
          Directions from {supplierName}. Check your booking confirmation for any updates.
        </p>
      </div>
    );
  }

  const guidance = getTerminalTransferGuidance(pickupLocationName, supplierName);
  if (!guidance) return null;

  return (
    <div className={cardClass}>
      <Heading />
      <p className="mt-2 text-sm text-slate-700 dark:text-neutral-200">{guidance.instructions}</p>
      {guidance.source === "specific" && (
        <p className="mt-3 text-xs text-slate-400 dark:text-neutral-500">
          Pickup points can change - confirm against your booking email from {supplierName} on arrival.
        </p>
      )}
    </div>
  );
}
