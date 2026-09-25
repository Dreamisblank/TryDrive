import "server-only";
import { cache } from "react";
import { searchOffers } from "./discovercars";
import { searchDateTime } from "./formatDateTime";

/**
 * The search an offer came from - carried from the results page to the
 * offer page so its price can be compared against the other cars actually
 * available for the same dates, location and driver age. Driver age matters:
 * the API bakes young-driver surcharges into every price (a 21-year-old's
 * quotes all came back higher than a 30-year-old's for the same cars), so
 * comparing against another age's prices would be wrong.
 */
export type SearchContext = {
  pickupDate: string;
  dropoffDate: string;
  driverAge: number;
  residence: string;
  iata?: string;
  latitude?: number;
  longitude?: number;
};

type RawParams = Record<string, string | string[] | undefined>;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function single(value: string | string[] | undefined): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

/** Validates untrusted query params - these feed a server-side API call. */
export function parseSearchContext(params: RawParams): SearchContext | null {
  const pickupDate = single(params.pickupDate);
  const dropoffDate = single(params.dropoffDate);
  if (!pickupDate || !dropoffDate || !DATE_RE.test(pickupDate) || !DATE_RE.test(dropoffDate)) {
    return null;
  }

  const driverAge = Number(single(params.driverAge));
  if (!Number.isInteger(driverAge) || driverAge < 18 || driverAge > 99) return null;

  const residence = single(params.residence)?.toUpperCase();
  if (!residence || !/^[A-Z]{2}$/.test(residence)) return null;

  const base = { pickupDate, dropoffDate, driverAge, residence };

  const iata = single(params.iata)?.toUpperCase();
  if (iata) {
    return /^[A-Z]{3}$/.test(iata) ? { ...base, iata } : null;
  }

  const rawLat = single(params.lat);
  const rawLng = single(params.lng);
  const latitude = Number(rawLat);
  const longitude = Number(rawLng);
  if (
    rawLat === undefined ||
    rawLng === undefined ||
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    Math.abs(latitude) > 90 ||
    Math.abs(longitude) > 180
  ) {
    return null;
  }
  return { ...base, latitude, longitude };
}

export function searchContextQuery(context: SearchContext): string {
  const params = new URLSearchParams({
    pickupDate: context.pickupDate,
    dropoffDate: context.dropoffDate,
    driverAge: String(context.driverAge),
    residence: context.residence,
  });
  if (context.iata) {
    params.set("iata", context.iata);
  } else {
    params.set("lat", String(context.latitude));
    params.set("lng", String(context.longitude));
  }
  return params.toString();
}

export type CategoryPriceStats = {
  /** Number of offers in the category the figures are based on. */
  count: number;
  mean: number;
  p10: number;
  p25: number;
  median: number;
  p75: number;
  p90: number;
};

// Below this, a "typical price" isn't meaningful enough to show.
const MIN_POOL = 5;

function percentile(sorted: number[], p: number): number {
  const index = (sorted.length - 1) * p;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);
}

// One live search per request, shared by everything on the offer page that
// needs it (React.cache dedupes by argument, hence the string key). Always
// fresh rather than cached across requests: price comparisons have to
// reflect what's actually available now.
const offerPricesForSearch = cache(async (contextKey: string, currency: string) => {
  const context = JSON.parse(contextKey) as SearchContext;
  const offers = await searchOffers({
    location: { iata: context.iata, latitude: context.latitude, longitude: context.longitude },
    pickupAt: searchDateTime(context.pickupDate),
    dropoffAt: searchDateTime(context.dropoffDate),
    driverAge: context.driverAge,
    driverResidence: context.residence,
    currency,
  });
  return offers.map((offer) => ({ category: offer.category, price: offer.totalPrice }));
});

/** Real price spread for a category in this search, or null if it can't be
 *  worked out (search failed, or too few cars to say what's typical). */
export async function getCategoryPriceStats(
  context: SearchContext,
  currency: string,
  category: string,
): Promise<CategoryPriceStats | null> {
  try {
    const offers = await offerPricesForSearch(JSON.stringify(context), currency);
    const prices = offers
      .filter((offer) => offer.category === category)
      .map((offer) => offer.price)
      .sort((a, b) => a - b);
    if (prices.length < MIN_POOL) return null;
    return {
      count: prices.length,
      mean: prices.reduce((sum, price) => sum + price, 0) / prices.length,
      p10: percentile(prices, 0.1),
      p25: percentile(prices, 0.25),
      median: percentile(prices, 0.5),
      p75: percentile(prices, 0.75),
      p90: percentile(prices, 0.9),
    };
  } catch (err) {
    console.error("Price comparison search failed:", err);
    return null;
  }
}
