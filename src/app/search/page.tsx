import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import SkyBackground from "@/components/SkyBackground";
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

      <main className="mx-auto max-w-6xl px-6 pt-4 pb-24">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-neutral-100 sm:text-3xl">
          Search results
        </h1>
        <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-sm text-slate-600 dark:text-neutral-300 sm:grid-cols-4">
          <div>
            <dt className="font-medium text-slate-900 dark:text-neutral-100">Location</dt>
            <dd>{location || "—"}</dd>
          </div>
          <div>
            <dt className="font-medium text-slate-900 dark:text-neutral-100">Pickup</dt>
            <dd>{pickupDate || "—"}</dd>
          </div>
          <div>
            <dt className="font-medium text-slate-900 dark:text-neutral-100">Dropoff</dt>
            <dd>{dropoffDate || "—"}</dd>
          </div>
          <div>
            <dt className="font-medium text-slate-900 dark:text-neutral-100">Driver age</dt>
            <dd>{driverAge || "—"}</dd>
          </div>
        </dl>

        <p className="mt-4 text-sm text-slate-500 dark:text-neutral-400">
          &ldquo;Book&rdquo; hands off to Discover Cars to finish the
          reservation — pricing and availability are theirs to confirm at
          checkout.
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
            <div className="mt-4 flex flex-col gap-4">
              {shown.map((offer) => (
                <div
                  key={offer.offerId}
                  className="flex flex-col items-center gap-4 rounded-3xl border border-orange-900/5 dark:border-neutral-700/60 bg-white/90 dark:bg-neutral-900/80 p-4 shadow-sm backdrop-blur-sm sm:flex-row"
                >
                  <div className="flex h-20 w-28 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-orange-50 dark:bg-orange-950/30">
                    {offer.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={offer.imageUrl}
                        alt={offer.vehicleName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-xs text-orange-300 dark:text-orange-600">
                        No image
                      </span>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col items-center gap-1 text-center sm:items-start sm:text-left">
                    <span className="inline-block rounded-full bg-orange-100 dark:bg-orange-900/40 px-2.5 py-0.5 text-xs font-medium text-orange-700 dark:text-orange-400">
                      {offer.category}
                    </span>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-neutral-100">
                      {offer.vehicleName}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-neutral-400">
                      {offer.transmission} · {offer.seats} seats
                      {offer.unlimitedMileage && " · Unlimited mileage"}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-neutral-500">
                      {offer.supplierName}
                      {offer.supplierRating !== null && ` · ${offer.supplierRating.toFixed(1)}/10`}
                    </p>
                  </div>

                  <div className="flex flex-col items-center gap-2 sm:items-end">
                    <div className="text-right">
                      <div className="text-2xl font-bold text-slate-900 dark:text-neutral-100">
                        {offer.currency} {offer.totalPrice.toFixed(2)}
                      </div>
                      {offer.freeCancellation && (
                        <div className="text-xs text-green-600 dark:text-green-400">
                          Free cancellation
                        </div>
                      )}
                    </div>
                    <a
                      href={`/book/${offer.offerId}`}
                      className="rounded-full bg-orange-600 px-6 py-2 text-sm font-semibold text-white transition hover:bg-orange-700"
                    >
                      View details
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
