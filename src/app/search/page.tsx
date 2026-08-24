import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import SkyBackground from "@/components/SkyBackground";
import SearchResults from "@/components/SearchResults";
import { searchVehicles } from "@/lib/rentsyst";

type SearchPageProps = {
  searchParams: Promise<{
    location?: string;
    pickupDate?: string;
    dropoffDate?: string;
    driverAge?: string;
  }>;
};

export default async function SearchResultsPage({
  searchParams,
}: SearchPageProps) {
  const { location, pickupDate, dropoffDate, driverAge } = await searchParams;
  const parsedAge = Number(driverAge);
  const hasValidParams =
    pickupDate && dropoffDate && Number.isFinite(parsedAge) && parsedAge > 0;

  let results: Awaited<ReturnType<typeof searchVehicles>> | null = null;
  let error: string | null = null;

  if (hasValidParams) {
    try {
      results = await searchVehicles({
        pickupDate: pickupDate!,
        dropoffDate: dropoffDate!,
        driverAge: parsedAge,
      });
    } catch (err) {
      console.error("RentSyst search failed:", err);
      const message = err instanceof Error ? err.message : "";
      error = message.startsWith("RentSyst")
        ? message
        : "Couldn't reach the RentSyst demo API. Please try again.";
    }
  }

  return (
    <div className="flex-1">
      <SkyBackground />
      <SiteHeader />

      <main className="mx-auto max-w-6xl px-6 pt-4 pb-24">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
          Search results
        </h1>
        <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-sm text-slate-600 sm:grid-cols-4">
          <div>
            <dt className="font-medium text-slate-900">Location</dt>
            <dd>{location || "—"}</dd>
          </div>
          <div>
            <dt className="font-medium text-slate-900">Pickup</dt>
            <dd>{pickupDate || "—"}</dd>
          </div>
          <div>
            <dt className="font-medium text-slate-900">Dropoff</dt>
            <dd>{dropoffDate || "—"}</dd>
          </div>
          <div>
            <dt className="font-medium text-slate-900">Driver age</dt>
            <dd>{driverAge || "—"}</dd>
          </div>
        </dl>

        <p className="mt-4 text-sm text-slate-500">
          Demo mode — results limited to Larnaca, Cyprus regardless of the
          pickup location entered. Insurance prices are flat (not age-based);
          where a young-driver fee applies to your age, it&apos;s added to the
          total and shown on the card.
        </p>

        {!hasValidParams && (
          <div className="mt-10 rounded-3xl border border-dashed border-orange-300 bg-white/70 p-10 text-center text-slate-500 backdrop-blur-sm">
            Run a search from the homepage to see live results.
          </div>
        )}

        {hasValidParams && error && (
          <div className="mt-10 rounded-3xl border border-dashed border-red-300 bg-white/70 p-10 text-center text-red-600 backdrop-blur-sm">
            {error}
          </div>
        )}

        {results && (
          <>
            {results.excludedForMinAge > 0 && (
              <p className="mt-6 text-sm text-slate-500">
                {results.excludedForMinAge} vehicle
                {results.excludedForMinAge === 1 ? "" : "s"} hidden — driver
                age {parsedAge} is below the minimum age required.
              </p>
            )}

            {results.vehicles.length === 0 ? (
              <div className="mt-10 rounded-3xl border border-dashed border-orange-300 bg-white/70 p-10 text-center text-slate-500 backdrop-blur-sm">
                No vehicles available for these dates in the demo inventory.
              </div>
            ) : (
              <div className="mt-8">
                <SearchResults
                  vehicles={results.vehicles}
                  categories={results.categories}
                  driverAge={parsedAge}
                  pickupDate={pickupDate!}
                  dropoffDate={dropoffDate!}
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
