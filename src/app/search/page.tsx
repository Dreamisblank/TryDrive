import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import SkyBackground from "@/components/SkyBackground";
import SearchResults from "@/components/SearchResults";
import { searchVehicles } from "@/lib/rentsyst";
import { getSelectedCurrency } from "@/lib/currencyServer";

type SearchPageProps = {
  searchParams: Promise<{
    location?: string;
    locationId?: string;
    lat?: string;
    lng?: string;
    pickupDate?: string;
    dropoffDate?: string;
    driverAge?: string;
  }>;
};

export default async function SearchResultsPage({
  searchParams,
}: SearchPageProps) {
  const { location, locationId, lat, lng, pickupDate, dropoffDate, driverAge } =
    await searchParams;
  const parsedAge = Number(driverAge);
  const parsedLocationId = Number(locationId);
  const parsedLat = Number(lat);
  const parsedLng = Number(lng);
  const hasValidParams =
    pickupDate &&
    dropoffDate &&
    Number.isFinite(parsedAge) &&
    parsedAge > 0 &&
    Number.isFinite(parsedLocationId) &&
    Number.isFinite(parsedLat) &&
    Number.isFinite(parsedLng);

  let results: Awaited<ReturnType<typeof searchVehicles>> | null = null;
  let error: string | null = null;

  if (hasValidParams) {
    try {
      results = await searchVehicles({
        pickupDate: pickupDate!,
        dropoffDate: dropoffDate!,
        driverAge: parsedAge,
        location: { id: parsedLocationId, latitude: parsedLat, longitude: parsedLng },
        currency: await getSelectedCurrency(),
      });
    } catch (err) {
      console.error("RentSyst search failed:", err);
      const message = err instanceof Error ? err.message : "";
      error = message.startsWith("RentSyst")
        ? message
        : "Couldn't reach the RentSyst API. Please try again.";
    }
  }

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
          Insurance prices are flat (not age-based); where a young-driver fee
          applies to your age, it&apos;s added to the total and shown on the
          card.
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

        {results && (
          <>
            {results.excludedForMinAge > 0 && (
              <p className="mt-6 text-sm text-slate-500 dark:text-neutral-400">
                {results.excludedForMinAge} vehicle
                {results.excludedForMinAge === 1 ? "" : "s"} hidden — driver
                age {parsedAge} is below the minimum age required.
              </p>
            )}

            {results.vehicles.length === 0 ? (
              <div className="mt-10 rounded-3xl border border-dashed border-orange-300 dark:border-orange-800 bg-white/70 dark:bg-neutral-900/60 p-10 text-center text-slate-500 dark:text-neutral-400 backdrop-blur-sm">
                No vehicles available for these dates at this location.
              </div>
            ) : (
              <div className="mt-8">
                <SearchResults
                  vehicles={results.vehicles}
                  categories={results.categories}
                  driverAge={parsedAge}
                  pickupDate={pickupDate!}
                  dropoffDate={dropoffDate!}
                  location={{
                    id: parsedLocationId,
                    name: location ?? "",
                    lat: parsedLat,
                    lng: parsedLng,
                  }}
                />
              </div>
            )}
          </>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
