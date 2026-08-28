import Link from "next/link";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import SkyBackground from "@/components/SkyBackground";
import BookingForm from "@/components/BookingForm";
import { getVehicleDetails } from "@/lib/rentsyst";
import { getSelectedCurrency } from "@/lib/currencyServer";

type BookPageProps = {
  params: Promise<{ vehicleId: string }>;
  searchParams: Promise<{
    pickupDate?: string;
    dropoffDate?: string;
    driverAge?: string;
  }>;
};

export default async function BookPage({ params, searchParams }: BookPageProps) {
  const { vehicleId } = await params;
  const { pickupDate, dropoffDate, driverAge } = await searchParams;
  const parsedAge = Number(driverAge);
  const parsedVehicleId = Number(vehicleId);

  const hasValidParams =
    Number.isFinite(parsedVehicleId) &&
    pickupDate &&
    dropoffDate &&
    Number.isFinite(parsedAge) &&
    parsedAge > 0;

  const backToResultsHref = `/search?${new URLSearchParams({
    location: "Larnaca, Cyprus (Demo)",
    pickupDate: pickupDate ?? "",
    dropoffDate: dropoffDate ?? "",
    driverAge: driverAge ?? "",
  }).toString()}`;

  let result: Awaited<ReturnType<typeof getVehicleDetails>> = null;
  let error: string | null = null;

  if (hasValidParams) {
    try {
      result = await getVehicleDetails(parsedVehicleId, {
        pickupDate: pickupDate!,
        dropoffDate: dropoffDate!,
        driverAge: parsedAge,
        currency: await getSelectedCurrency(),
      });
    } catch (err) {
      console.error("Vehicle lookup failed:", err);
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

      <main className="mx-auto max-w-3xl px-6 pt-4 pb-24">
        <Link
          href={backToResultsHref}
          className="text-sm font-medium text-orange-700 hover:text-orange-800"
        >
          ← Back to results
        </Link>

        {!hasValidParams && (
          <div className="mt-8 rounded-3xl border border-dashed border-orange-300 bg-white/70 p-10 text-center text-slate-500 backdrop-blur-sm">
            Missing search details.{" "}
            <Link href="/" className="text-orange-700 hover:text-orange-800">
              Start a new search
            </Link>
            .
          </div>
        )}

        {hasValidParams && error && (
          <div className="mt-8 rounded-3xl border border-dashed border-red-300 bg-white/70 p-10 text-center text-red-600 backdrop-blur-sm">
            {error}
          </div>
        )}

        {hasValidParams && !error && !result && (
          <div className="mt-8 rounded-3xl border border-dashed border-orange-300 bg-white/70 p-10 text-center text-slate-500 backdrop-blur-sm">
            This vehicle isn&apos;t available for these dates anymore.
          </div>
        )}

        {hasValidParams && !error && result && !result.eligible && (
          <div className="mt-8 rounded-3xl border border-dashed border-red-300 bg-white/70 p-10 text-center text-red-600 backdrop-blur-sm">
            Driver age {parsedAge} is below the minimum age (
            {result.vehicle.minDriverAge}+) required for this vehicle.
          </div>
        )}

        {hasValidParams && !error && result && result.eligible && (
          <BookingForm
            vehicle={result.vehicle}
            driverAge={parsedAge}
            pickupDate={pickupDate!}
            dropoffDate={dropoffDate!}
          />
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
