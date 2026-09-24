import { getTerminalTransferGuidance } from "@/lib/terminalTransfer";

export default function TerminalTransferBox({
  pickupLocationName,
  supplierName,
}: {
  pickupLocationName: string;
  supplierName: string;
}) {
  const guidance = getTerminalTransferGuidance(pickupLocationName, supplierName);
  if (!guidance) return null;

  return (
    <div className="rounded-3xl border border-orange-900/5 dark:border-neutral-700/60 bg-white/90 dark:bg-neutral-900/80 p-5 shadow-sm lg:p-6">
      <h2 className="text-sm font-semibold tracking-wide text-slate-500 dark:text-neutral-400 uppercase">
        Getting to your car
      </h2>
      <p className="mt-2 text-sm text-slate-700 dark:text-neutral-200">{guidance.instructions}</p>
      {guidance.source === "specific" && (
        <p className="mt-3 text-xs text-slate-400 dark:text-neutral-500">
          Pickup points can change - confirm against your booking email from {supplierName} on arrival.
        </p>
      )}
    </div>
  );
}
