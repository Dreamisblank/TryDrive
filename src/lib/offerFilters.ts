import type { NormalizedOffer } from "./discovercars";

/** What the results page actually needs per offer - the booking URL and
 *  pickup instructions (the longest fields, only used on the detail page)
 *  are dropped so the full offer list stays cheap to hand to the client for
 *  instant filtering. */
export type ResultOffer = Omit<
  NormalizedOffer,
  "bookingUrl" | "fuel" | "pickupInstructions" | "pickupType"
>;

export function toResultOffer(offer: NormalizedOffer): ResultOffer {
  return {
    offerId: offer.offerId,
    vehicleName: offer.vehicleName,
    category: offer.category,
    transmission: offer.transmission,
    seats: offer.seats,
    bags: offer.bags,
    imageUrl: offer.imageUrl,
    supplierName: offer.supplierName,
    supplierLogo: offer.supplierLogo,
    supplierRating: offer.supplierRating,
    supplierReviewCount: offer.supplierReviewCount,
    pickupAt: offer.pickupAt,
    pickupLocationName: offer.pickupLocationName,
    dropoffAt: offer.dropoffAt,
    dropoffLocationName: offer.dropoffLocationName,
    totalPrice: offer.totalPrice,
    currency: offer.currency,
    freeCancellation: offer.freeCancellation,
    unlimitedMileage: offer.unlimitedMileage,
    includedMileageLimit: offer.includedMileageLimit,
    mileageUnit: offer.mileageUnit,
    depositAmount: offer.depositAmount,
    depositMax: offer.depositMax,
    depositCurrency: offer.depositCurrency,
  };
}

// Discover Cars reports deposits as an amount only (no credit/debit-card
// "type"), so the deposit filter is by how much is held.
export type DepositFilter = "any" | "none" | "250" | "500" | "1000";

export type Filters = {
  category: string | null;
  /** Empty = any transmission. */
  transmissions: string[];
  deposit: DepositFilter;
};

export const EMPTY_FILTERS: Filters = { category: null, transmissions: [], deposit: "any" };

const DEFAULT_CATEGORY = "small";

/** What a fresh search opens on: Small cars, any transmission, any deposit.
 *  Falls back to every car type if this search has no Small cars at all,
 *  rather than opening on an empty list. */
export function defaultFilters(offers: ResultOffer[]): Filters {
  const hasDefault = offers.some((offer) => offer.category === DEFAULT_CATEGORY);
  return { ...EMPTY_FILTERS, category: hasDefault ? DEFAULT_CATEGORY : null };
}

export const FILTER_STORAGE_PREFIX = "trydrive_filters:";

/** Called when a new search is submitted, so it opens on the defaults
 *  instead of restoring filters picked on an earlier visit to the same
 *  search. Saved filters are only meant to survive going into an offer
 *  and back. */
export function clearStoredFilters(): void {
  try {
    for (let i = sessionStorage.length - 1; i >= 0; i--) {
      const key = sessionStorage.key(i);
      if (key?.startsWith(FILTER_STORAGE_PREFIX)) sessionStorage.removeItem(key);
    }
  } catch {
    // Storage unavailable - nothing was saved to clear.
  }
}

export const TRANSMISSIONS = ["automatic", "manual"] as const;

export const DEPOSIT_OPTIONS: DepositFilter[] = ["any", "none", "250", "500", "1000"];

export function depositLabel(value: DepositFilter, symbol: string): string {
  switch (value) {
    case "any":
      return "Any deposit";
    case "none":
      return "No deposit";
    case "1000":
      return `Up to ${symbol}1,000`;
    default:
      return `Up to ${symbol}${value}`;
  }
}

export function transmissionLabel(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

// Everyday sizes first, then specialist types - anything the API adds later
// that isn't listed here just goes on the end.
const CATEGORY_ORDER = [
  "small",
  "medium",
  "large",
  "estate",
  "suv",
  "premium",
  "convertible",
  "vans",
  "recreational",
];

const CATEGORY_LABELS: Record<string, string> = {
  suv: "SUV",
  vans: "Van",
};

export function categoryLabel(category: string): string {
  return CATEGORY_LABELS[category] ?? category.charAt(0).toUpperCase() + category.slice(1);
}

const CATEGORY_NOUNS: Record<string, [singular: string, plural: string]> = {
  suv: ["SUV", "SUVs"],
  vans: ["van", "vans"],
  convertible: ["convertible", "convertibles"],
  recreational: ["recreational vehicle", "recreational vehicles"],
};

/** For running text: "small car" / "small cars", "SUV" / "SUVs". */
export function categoryNoun(category: string, plural: boolean): string {
  const nouns = CATEGORY_NOUNS[category];
  if (nouns) return plural ? nouns[1] : nouns[0];
  return `${category} car${plural ? "s" : ""}`;
}

function matchesDeposit(offer: ResultOffer, deposit: DepositFilter): boolean {
  if (deposit === "any") return true;
  // No deposit info at all isn't the same as "no deposit" - leave it out of
  // every specific bucket rather than guess.
  if (offer.depositAmount === null) return false;
  // Judge by the top of a quoted range: "Up to £250" has to mean the hold
  // can't be more than £250.
  const highest = offer.depositMax ?? offer.depositAmount;
  if (deposit === "none") return highest === 0;
  return highest <= Number(deposit);
}

/** `ignore` skips one filter - used for faceted counts/prices, so e.g. the
 *  transmission counts reflect the chosen car type and deposit, but not the
 *  transmission choice itself. */
export function matchesFilters(
  offer: ResultOffer,
  filters: Filters,
  ignore?: keyof Filters,
): boolean {
  if (ignore !== "category" && filters.category && offer.category !== filters.category) {
    return false;
  }
  if (
    ignore !== "transmissions" &&
    filters.transmissions.length > 0 &&
    !filters.transmissions.includes(offer.transmission)
  ) {
    return false;
  }
  if (ignore !== "deposit" && !matchesDeposit(offer, filters.deposit)) {
    return false;
  }
  return true;
}

export function hasActiveFilters(filters: Filters): boolean {
  return (
    filters.category !== null || filters.transmissions.length > 0 || filters.deposit !== "any"
  );
}

export type CategorySummary = {
  category: string;
  label: string;
  imageUrl: string | null;
  /** Cheapest total under the other active filters; null when none match. */
  fromPrice: number | null;
};

export function categorySummaries(offers: ResultOffer[], filters: Filters): CategorySummary[] {
  const byCategory = new Map<string, ResultOffer[]>();
  for (const offer of offers) {
    const list = byCategory.get(offer.category);
    if (list) list.push(offer);
    else byCategory.set(offer.category, [offer]);
  }

  const categories = [...byCategory.keys()].sort((a, b) => {
    const ai = CATEGORY_ORDER.indexOf(a);
    const bi = CATEGORY_ORDER.indexOf(b);
    return (ai === -1 ? Infinity : ai) - (bi === -1 ? Infinity : bi) || a.localeCompare(b);
  });

  return categories.map((category) => {
    const inCategory = byCategory.get(category)!;
    // Image comes from the category's cheapest car overall (not the
    // filtered pool) so the picture doesn't jump around as filters change.
    const imageUrl = inCategory.reduce<ResultOffer | null>(
      (best, offer) =>
        offer.imageUrl && (!best || offer.totalPrice < best.totalPrice) ? offer : best,
      null,
    )?.imageUrl ?? null;

    let fromPrice: number | null = null;
    for (const offer of inCategory) {
      if (!matchesFilters(offer, filters, "category")) continue;
      if (fromPrice === null || offer.totalPrice < fromPrice) fromPrice = offer.totalPrice;
    }

    return { category, label: categoryLabel(category), imageUrl, fromPrice };
  });
}

export function transmissionCounts(
  offers: ResultOffer[],
  filters: Filters,
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const offer of offers) {
    if (!matchesFilters(offer, filters, "transmissions")) continue;
    counts[offer.transmission] = (counts[offer.transmission] ?? 0) + 1;
  }
  return counts;
}

export function depositCounts(
  offers: ResultOffer[],
  filters: Filters,
): Record<DepositFilter, number> {
  const counts = { any: 0, none: 0, "250": 0, "500": 0, "1000": 0 } as Record<
    DepositFilter,
    number
  >;
  for (const offer of offers) {
    if (!matchesFilters(offer, filters, "deposit")) continue;
    for (const option of DEPOSIT_OPTIONS) {
      if (matchesDeposit(offer, option)) counts[option] += 1;
    }
  }
  return counts;
}
