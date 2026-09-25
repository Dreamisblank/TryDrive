import { getTerminalTransferGuidance, toPickupSteps } from "@/lib/terminalTransfer";

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

function Steps({ steps }: { steps: string[] }) {
  return (
    <ol className="mt-3 flex flex-col gap-2.5">
      {steps.map((step, index) => (
        <li key={index} className="flex gap-3 text-sm leading-relaxed text-slate-700 dark:text-neutral-200">
          <span
            aria-hidden="true"
            className="mt-px flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-100 text-xs font-semibold text-orange-700 dark:bg-orange-900/40 dark:text-orange-300"
          >
            {index + 1}
          </span>
          {/* break-words: some directions contain long unbroken URLs. */}
          <span className="min-w-0 pt-0.5 break-words">{step}</span>
        </li>
      ))}
    </ol>
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

  const supplierSteps = pickupInstructions ? toPickupSteps(pickupInstructions) : null;

  if (pickupInstructions && supplierSteps && supplierSteps.steps.length > 0) {
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
        <Steps steps={supplierSteps.steps} />
        {supplierSteps.truncated && (
          // The steps keep the first four points; the rest (documents,
          // fuel, fees...) stays one tap away rather than being dropped.
          <details className="mt-3">
            <summary className="cursor-pointer text-xs font-medium text-orange-700 hover:text-orange-800 dark:text-orange-400 dark:hover:text-orange-300">
              See full directions from {supplierName}
            </summary>
            <p className="mt-2 text-xs leading-relaxed break-words whitespace-pre-line text-slate-500 dark:text-neutral-400">
              {pickupInstructions}
            </p>
          </details>
        )}
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
      <Steps steps={toPickupSteps(guidance.instructions).steps} />
      {guidance.source === "specific" && (
        <p className="mt-3 text-xs text-slate-400 dark:text-neutral-500">
          Pickup points can change - confirm against your booking email from {supplierName} on arrival.
        </p>
      )}
    </div>
  );
}
