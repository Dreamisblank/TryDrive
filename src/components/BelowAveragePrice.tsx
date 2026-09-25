import { getCurrency } from "@/lib/currency";
import { categoryNoun } from "@/lib/offerFilters";
import { getCategoryPriceStats, type SearchContext } from "@/lib/priceComparison";
import PriceInfoTip from "./PriceInfoTip";

/**
 * "£X below average" next to the headline price: how far this car's price
 * is below the average (mean) price of the same car type in the same live
 * search - same dates, location and driver age, so young-driver fees are on
 * both sides of the comparison.
 *
 * Worded as a comparison, not a saving: UK advertising rules (CAP Code
 * 3.39/3.40, ASA guidance on savings claims) don't accept a market average
 * as the reference price for "£X saved". A comparison is fine as long as it's
 * accurate and its basis is clear - the tooltip states the basis.
 */
export default async function BelowAveragePrice({
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

  const below = stats.mean - price;
  // Skip trivial differences - "£1 below average" on a £90 car is noise.
  if (Math.floor(below) < 1 || below / stats.mean < 0.02) return null;

  const symbol = getCurrency(currency).symbol;
  const tip = `${symbol}${below.toFixed(2)} below the average price of the ${stats.count} ${categoryNoun(
    category,
    true,
  )} available right now for your dates and driver age.`;

  return (
    <span className="inline-flex items-center gap-1.5 text-sm font-semibold whitespace-nowrap text-red-600 dark:text-red-400">
      {symbol}
      {Math.floor(below)} below average
      <PriceInfoTip text={tip} />
    </span>
  );
}
