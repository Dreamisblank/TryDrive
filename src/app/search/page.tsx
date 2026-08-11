import SiteHeader from "@/components/SiteHeader";
import SkyBackground from "@/components/SkyBackground";

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

  return (
    <div className="relative flex-1">
      <SkyBackground />
      <SiteHeader />

      <main className="mx-auto max-w-6xl px-6 pb-24">
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

        <div className="mt-10 rounded-3xl border border-dashed border-orange-300 bg-white/70 p-10 text-center text-slate-500 backdrop-blur-sm">
          No inventory source is connected yet. Results will appear here once
          a car search API is integrated.
        </div>
      </main>
    </div>
  );
}
