import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import SkyBackground from "@/components/SkyBackground";
import OfferCard from "@/components/OfferCard";
import { searchOffers } from "@/lib/discovercars";
import { getSelectedCurrency } from "@/lib/currencyServer";

const MAX_RESULTS_SHOWN = 40;

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
  const {
    location,
    pickupDate,
    dropoffDate,
    driverAge,
    residence,
    iata,
    lat,
    lng,
  } = await searchParams;
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

  let offers: Awaited<ReturnType<typeof searchOffers>> | null = null;
  let error: string | null = null;

  if (hasValidParams) {
    try {
      offers = await searchOffers({
        location: { iata, latitude: parsedLat, longitude: parsedLng },
        pickupAt: `${pickupDate}T10:00:00`,
        dropoffAt: `${dropoffDate}T10:00:00`,
        driverAge: parsedAge,
        driverResidence: residence!,
        currency: await getSelectedCurrency(),
      });
    } catch (err) {
      console.error("Discover Cars offer search failed:", err);
      error = "Couldn't reach the search provider. Please try again.";
    }
  }

  const shown = offers?.slice(0, MAX_RESULTS_SHOWN) ?? null;

  return (
    <div className="flex-1">
      <SkyBackground />
      <SiteHeader />

      <main className="mx-auto max-w-3xl px-6 pt-4 pb-24">
        <div className="flex items-baseline justify-between gap-3">
          <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-neutral-100 sm:text-2xl">
            {location || "Search results"}
          </h1>
          {offers && (
            <span className="shrink-0 text-sm text-slate-500 dark:text-neutral-400">
              {offers.length} car{offers.length === 1 ? "" : "s"}
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-slate-500 dark:text-neutral-400">
          {pickupDate} → {dropoffDate} · Driver age {driverAge}
        </p>

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

        {offers && offers.length > 0 && shown && (
          <>
            {offers.length > shown.length && (
              <p className="mt-6 text-sm text-slate-500 dark:text-neutral-400">
                Showing the cheapest {shown.length} of {offers.length} vehicles.
              </p>
            )}
            <div className="mt-4 flex flex-col gap-5">
              {shown.map((offer, index) => (
                <OfferCard key={offer.offerId} offer={offer} isBest={index === 0} />
              ))}
            </div>
          </>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
