import { getCurrency } from "@/lib/currency";
import { categoryNoun } from "@/lib/offerFilters";
import { getCategoryPriceStats, type SearchContext } from "@/lib/priceComparison";

const cardClass =
  "rounded-3xl border border-orange-900/5 dark:border-neutral-700/60 bg-white/90 dark:bg-neutral-900/80 p-5 shadow-sm lg:p-6";

function Heading() {
  return (
    <h2 className="text-sm font-semibold tracking-wide text-slate-500 uppercase dark:text-neutral-400">
      How this price compares
    </h2>
  );
}

/** Shown while the live comparison search runs - same card, so the page
 *  doesn't jump when the real figures arrive. */
export function PriceComparisonSkeleton() {
  return (
    <div className={cardClass} aria-hidden="true">
      <Heading />
      <div className="mt-3 h-5 w-2/3 animate-pulse rounded-full bg-slate-200/80 dark:bg-neutral-800" />
      <div className="mt-2.5 h-4 w-1/2 animate-pulse rounded-full bg-slate-200/60 dark:bg-neutral-800/70" />
      <div className="mt-9 h-2 w-full animate-pulse rounded-full bg-slate-200/80 dark:bg-neutral-800" />
      <div className="mt-6 h-3 w-3/4 animate-pulse rounded-full bg-slate-200/60 dark:bg-neutral-800/70" />
    </div>
  );
}

/**
 * Compares this car's price with every other car of the same type available
 * right now for the same dates, location and driver age - one live search,
 * no estimates. Because the search is for the traveller's own age, young
 * driver surcharges are already in every price being compared.
 */
export default async function PriceComparisonBox({
  context,
  currency,
  category,
  price,
}: {
  context: SearchContext;
  currency: string;
  category: string;
  price: number;
}) {
  const stats = await getCategoryPriceStats(context, currency, category);
  if (!stats) return null;

  const symbol = getCurrency(currency).symbol;
  const money = (value: number) => `${symbol}${Math.round(value)}`;
  const singular = categoryNoun(category, false);
  const plural = categoryNoun(category, true);

  // "an SUV" (said "ess-you-vee"), "an estate car", "a small car".
  const withArticle = `${/^(suv|[aeiou])/i.test(singular) ? "an" : "a"} ${singular}`;

  const tier =
    price <= stats.p25
      ? {
          headline: `Great price for ${withArticle} on these dates`,
          color: "text-green-600 dark:text-green-400",
        }
      : price <= stats.p75
        ? {
            headline: `Typical price for ${withArticle} on these dates`,
            color: "text-amber-600 dark:text-amber-400",
          }
        : {
            headline: `Higher than most ${plural} on these dates`,
            color: "text-red-600 dark:text-red-400",
          };

  const typicalLow = money(stats.p25);
  const typicalHigh = money(stats.p75);
  const typicalRange =
    typicalLow === typicalHigh ? `around ${typicalLow}` : `${typicalLow}–${typicalHigh}`;

  // The bar runs from the 10th to the 90th percentile; prices outside it
  // pin to an end and say so, rather than looking like they're on the scale.
  const span = stats.p90 - stats.p10;
  const position = span > 0 ? Math.min(97, Math.max(3, ((price - stats.p10) / span) * 100)) : 50;
  const markerLabel = `${money(price)}${
    price < stats.p10 ? " · among the cheapest" : price > stats.p90 ? " · among the priciest" : ""
  }`;
  // Near an end, align the label to that end so it can't run off the card.
  const labelStyle =
    position < 15
      ? { left: 0 }
      : position > 85
        ? { right: 0 }
        : { left: `${position}%`, transform: "translateX(-50%)" };

  const youngDriver = context.driverAge < 25;

  return (
    <div className={cardClass}>
      <Heading />
      <p className={`mt-2 text-lg font-bold ${tier.color}`}>{tier.headline}</p>
      <p className="mt-1 text-sm text-slate-500 dark:text-neutral-400">
        Similar {plural} for your dates usually cost {typicalRange}.
      </p>

      <div className="relative mt-7 mb-1" aria-hidden="true">
        <div
          className="absolute -top-6 rounded-full bg-slate-900 px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap text-white dark:bg-neutral-100 dark:text-neutral-900"
          style={labelStyle}
        >
          {markerLabel}
        </div>
        <div
          className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-slate-900 shadow dark:border-neutral-900 dark:bg-neutral-100"
          style={{ left: `${position}%` }}
        />
        <div className="h-2 w-full rounded-full bg-gradient-to-r from-green-400 via-amber-400 to-red-400" />
      </div>
      <div className="flex justify-between text-xs text-slate-400 dark:text-neutral-500" aria-hidden="true">
        <span>{money(stats.p10)}</span>
        <span>{money(stats.p90)}</span>
      </div>

      <p className="mt-4 text-xs text-slate-400 dark:text-neutral-500">
        Based on the {stats.count} {plural} available right now for your dates
        {youngDriver
          ? `, priced for a ${context.driverAge}-year-old driver - young driver fees are included.`
          : "."}
      </p>
    </div>
  );
}
