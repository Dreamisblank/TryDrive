import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import SkyBackground from "@/components/SkyBackground";
import CarSearchForm from "@/components/CarSearchForm";
import SearchResults from "@/components/SearchResults";
import { searchOffers } from "@/lib/discovercars";
import { getSelectedCurrency } from "@/lib/currencyServer";
import { getCurrency } from "@/lib/currency";
import { FILTER_STORAGE_PREFIX, toResultOffer } from "@/lib/offerFilters";
import { searchDateTime } from "@/lib/formatDateTime";
import { parseSearchContext, searchContextQuery } from "@/lib/priceComparison";
import type { PickupLocation } from "@/lib/locations";

type SearchPageProps = {
  searchParams: Promise<{
    location?: string;
    pickupDate?: string;
    dropoffDate?: string;
    driverAge?: string;
    residence?: string;
    iata?: string;
    lat?: string;
    lng?: string;
  }>;
};

export default async function SearchResultsPage({
  searchParams,
}: SearchPageProps) {
  const rawParams = await searchParams;
  const {
    location,
    pickupDate,
    dropoffDate,
    driverAge,
    residence,
    iata,
    lat,
    lng,
  } = rawParams;
  const parsedAge = Number(driverAge);
  const parsedLat = lat ? Number(lat) : undefined;
  const parsedLng = lng ? Number(lng) : undefined;
  const hasValidParams =
    pickupDate &&
    dropoffDate &&
    residence &&
    Number.isFinite(parsedAge) &&
    parsedAge > 0 &&
    (iata || (parsedLat !== undefined && parsedLng !== undefined));

  const currency = await getSelectedCurrency();
  let offers: Awaited<ReturnType<typeof searchOffers>> | null = null;
  let error: string | null = null;

  if (hasValidParams) {
    try {
      offers = await searchOffers({
        location: { iata, latitude: parsedLat, longitude: parsedLng },
        pickupAt: searchDateTime(pickupDate!),
        dropoffAt: searchDateTime(dropoffDate!),
        driverAge: parsedAge,
        driverResidence: residence!,
        currency,
      });
    } catch (err) {
      console.error("Discover Cars offer search failed:", err);
      error = "Couldn't reach the search provider. Please try again.";
    }
  }

  // Only meaningful when hasValidParams is true - reflects the query that
  // actually produced these results, so the sticky desktop search bar never
  // shows something out of sync with what's on screen.
  const initialSearch =
    hasValidParams && location
      ? {
          location: {
            id: iata ?? `${parsedLat},${parsedLng}`,
            name: location,
            iata,
            latitude: parsedLat,
            longitude: parsedLng,
          } satisfies PickupLocation,
          pickupDate: pickupDate!,
          dropoffDate: dropoffDate!,
          driverAge: driverAge!,
        }
      : undefined;

  const filterStorageKey = `${FILTER_STORAGE_PREFIX}${iata ?? `${parsedLat},${parsedLng}`}:${pickupDate}:${dropoffDate}:${driverAge}`;

  // Carried onto each offer's page so its price can be compared against the
  // same search (same dates, location and driver age).
  const searchContext = parseSearchContext(rawParams);
  const offerQuery = searchContext ? searchContextQuery(searchContext) : "";

  return (
    <div className="flex-1">
      <SkyBackground />
      <SiteHeader />

      {/* Desktop only: mobile keeps "Start a new search" via the header/back
          nav instead of a pinned form eating scroll space. */}
      {initialSearch && (
        <div className="sticky top-0 z-20 hidden py-4 desktop:block">
          <div className="mx-auto max-w-5xl px-6">
            <CarSearchForm initial={initialSearch} />
          </div>
        </div>
      )}

      <main className="mx-auto max-w-3xl px-6 pt-4 pb-24 desktop:max-w-5xl">
        {/* The search bar above already shows all of this on desktop. */}
        <div className="desktop:hidden">
          <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-neutral-100 sm:text-2xl">
            {location || "Search results"}
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-neutral-400">
            {pickupDate} → {dropoffDate} · Driver age {driverAge}
          </p>
        </div>

        {!hasValidParams && (
          <div className="mt-10 rounded-3xl border border-dashed border-orange-300 dark:border-orange-800 bg-white/70 dark:bg-neutral-900/60 p-10 text-center text-slate-500 dark:text-neutral-400 backdrop-blur-sm">
            Run a search from the homepage to see live results.
          </div>
        )}

        {hasValidParams && error && (
          <div className="mt-10 rounded-3xl border border-dashed border-red-300 dark:border-red-900/50 bg-white/70 dark:bg-neutral-900/60 p-10 text-center text-red-600 dark:text-red-400 backdrop-blur-sm">
            {error}
          </div>
        )}

        {offers && offers.length === 0 && (
          <div className="mt-10 rounded-3xl border border-dashed border-orange-300 dark:border-orange-800 bg-white/70 dark:bg-neutral-900/60 p-10 text-center text-slate-500 dark:text-neutral-400 backdrop-blur-sm">
            No vehicles available for these dates at this location.
          </div>
        )}

        {offers && offers.length > 0 && (
          // Keyed by the search: a new search from the sticky bar reuses
          // this page, and without a new key it would keep the previous
          // search's filters instead of opening on the defaults.
          <SearchResults
            key={filterStorageKey}
            offers={offers.map(toResultOffer)}
            currencySymbol={getCurrency(currency).symbol}
            storageKey={filterStorageKey}
            offerQuery={offerQuery}
          />
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
