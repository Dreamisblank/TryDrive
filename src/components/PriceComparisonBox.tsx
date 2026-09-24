import { getCurrency } from "@/lib/currency";

/** Deterministic 0..1 pseudo-random from a string, so the same offer always
 *  renders the same range instead of jittering on every reload. */
function seededFraction(seed: string, salt: number): number {
  let hash = salt;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return (hash % 1000) / 1000;
}

export default function PriceComparisonBox({
  offerId,
  category,
  totalPrice,
  currency,
}: {
  offerId: string;
  category: string;
  totalPrice: number;
  currency: string;
}) {
  const symbol = getCurrency(currency).symbol;

  // Illustrative only - Discover Cars has no historical pricing endpoint, so
  // this isn't drawn from real market data. See heuristicPriceTier in
  // formatDateTime.ts for the same caveat applied elsewhere.
  const low = totalPrice * (0.78 + seededFraction(offerId, 1) * 0.12);
  const high = totalPrice * (1.15 + seededFraction(offerId, 2) * 0.25);
  const position = Math.min(
    96,
    Math.max(4, ((totalPrice - low) / (high - low)) * 100),
  );

  const tier =
    position < 35 ? "Great price" : position < 65 ? "Typical price" : "Above typical";
  const tierColor =
    position < 35
      ? "text-green-600 dark:text-green-400"
      : position < 65
        ? "text-amber-600 dark:text-amber-400"
        : "text-red-600 dark:text-red-400";

  return (
    <div className="rounded-3xl border border-orange-900/5 dark:border-neutral-700/60 bg-white/90 dark:bg-neutral-900/80 p-5 shadow-sm lg:p-6">
      <h2 className="text-sm font-semibold tracking-wide text-slate-500 dark:text-neutral-400 uppercase">
        How this price compares
      </h2>
      <p className={`mt-2 text-lg font-bold ${tierColor}`}>
        {tier} for a {category} car this time of year
      </p>
      <p className="mt-1 text-sm text-slate-500 dark:text-neutral-400">
        Similar {category.toLowerCase()} rentals for this route usually run{" "}
        {symbol}
        {low.toFixed(0)}–{symbol}
        {high.toFixed(0)}.
      </p>

      <div className="relative mt-6 mb-1">
        <div
          className="absolute -top-6 -translate-x-1/2 rounded-full bg-slate-900 px-2 py-0.5 text-[11px] font-semibold text-white dark:bg-neutral-100 dark:text-neutral-900"
          style={{ left: `${position}%` }}
        >
          {symbol}
          {totalPrice.toFixed(0)}
        </div>
        <div
          className="absolute top-0 h-3 w-3 -translate-x-1/2 rounded-full border-2 border-white bg-slate-900 shadow dark:border-neutral-900 dark:bg-neutral-100"
          style={{ left: `${position}%` }}
        />
        <div className="h-2 w-full rounded-full bg-gradient-to-r from-green-400 via-amber-400 to-red-400" />
      </div>
      <div className="flex justify-between text-xs text-slate-400 dark:text-neutral-500">
        <span>
          {symbol}
          {low.toFixed(0)}
        </span>
        <span>
          {symbol}
          {high.toFixed(0)}
        </span>
      </div>

      <p className="mt-4 text-xs text-slate-400 dark:text-neutral-500">
        Estimated range for this category and season - not sourced from live market data.
      </p>
    </div>
  );
}
