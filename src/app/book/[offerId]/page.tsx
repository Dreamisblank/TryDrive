import Link from "next/link";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import SkyBackground from "@/components/SkyBackground";
import { getOffer } from "@/lib/discovercars";
import { formatShortDate, formatTime, rentalDays } from "@/lib/formatDateTime";

type BookPageProps = {
  params: Promise<{ offerId: string }>;
};

export default async function BookPage({ params }: BookPageProps) {
  const { offerId } = await params;

  let offer: Awaited<ReturnType<typeof getOffer>> = null;
  let error: string | null = null;

  try {
    offer = await getOffer(offerId);
  } catch (err) {
    console.error("Offer lookup failed:", err);
    error = "Couldn't reach the search provider. Please try again.";
  }

  return (
    <div className="flex-1">
      <SkyBackground />
      <SiteHeader />

      <main className="mx-auto max-w-3xl px-6 pt-4 pb-24">
        <Link
          href="/"
          className="text-sm font-medium text-orange-700 dark:text-orange-400 hover:text-orange-800 dark:hover:text-orange-300"
        >
          ← Start a new search
        </Link>

        {error && (
          <div className="mt-8 rounded-3xl border border-dashed border-red-300 dark:border-red-900/50 bg-white/70 dark:bg-neutral-900/60 p-10 text-center text-red-600 dark:text-red-400 backdrop-blur-sm">
            {error}
          </div>
        )}

        {!error && !offer && (
          <div className="mt-8 rounded-3xl border border-dashed border-orange-300 dark:border-orange-800 bg-white/70 dark:bg-neutral-900/60 p-10 text-center text-slate-500 dark:text-neutral-400 backdrop-blur-sm">
            This offer isn&apos;t available anymore.
          </div>
        )}

        {offer && (
          <div className="mt-6 flex flex-col gap-6">
            <div className="flex flex-col gap-4 rounded-3xl border border-orange-900/5 dark:border-neutral-700/60 bg-white/90 dark:bg-neutral-900/80 p-5 shadow-sm sm:flex-row sm:items-center">
              <div className="flex h-24 w-32 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-orange-50 dark:bg-orange-950/30">
                {offer.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={offer.imageUrl}
                    alt={offer.vehicleName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-xs text-orange-300 dark:text-orange-600">No image</span>
                )}
              </div>
              <div className="flex-1">
                <span className="inline-block rounded-full bg-orange-100 dark:bg-orange-900/40 px-2.5 py-0.5 text-xs font-medium text-orange-700 dark:text-orange-400">
                  {offer.category}
                </span>
                <h1 className="mt-1 text-2xl font-bold text-slate-900 dark:text-neutral-100">
                  {offer.vehicleName}
                </h1>
                <p className="mt-0.5 text-sm text-slate-500 dark:text-neutral-400">
                  {offer.transmission} · {offer.seats} seats
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-slate-900 dark:text-neutral-100">
                  {offer.currency} {offer.totalPrice.toFixed(2)}
                </div>
                {offer.freeCancellation && (
                  <div className="text-xs text-green-600 dark:text-green-400">
                    Free cancellation
                  </div>
                )}
              </div>
            </div>

            {/* Supplier */}
            <div className="flex items-center gap-3 rounded-3xl border border-orange-900/5 dark:border-neutral-700/60 bg-white/90 dark:bg-neutral-900/80 p-5 shadow-sm">
              {offer.supplierLogo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={offer.supplierLogo}
                  alt={offer.supplierName}
                  className="h-10 w-10 shrink-0 rounded-lg border border-orange-900/5 bg-white object-contain p-1 dark:border-neutral-700/60"
                />
              ) : (
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-100 text-sm font-semibold text-orange-700 dark:bg-orange-900/40 dark:text-orange-300">
                  {offer.supplierName.slice(0, 1)}
                </span>
              )}
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-neutral-100">
                  {offer.supplierName}
                </p>
                {offer.supplierRating !== null && (
                  <p className="text-xs text-slate-500 dark:text-neutral-400">
                    {offer.supplierRating.toFixed(1)}/10
                    {offer.supplierReviewCount !== null &&
                      ` · ${offer.supplierReviewCount.toLocaleString()} reviews`}
                  </p>
                )}
              </div>
            </div>

            {/* Pickup / dropoff */}
            <div className="rounded-3xl border border-orange-900/5 dark:border-neutral-700/60 bg-white/90 dark:bg-neutral-900/80 p-5 shadow-sm">
              <h2 className="text-sm font-semibold tracking-wide text-slate-500 dark:text-neutral-400 uppercase">
                Trip details
              </h2>
              <div className="mt-3 flex items-center justify-between gap-2">
                <div>
                  <div className="text-lg font-bold text-slate-900 dark:text-neutral-100">
                    {formatTime(offer.pickupAt)}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-neutral-400">
                    {formatShortDate(offer.pickupAt)} · {offer.pickupLocationName}
                  </div>
                </div>
                <div className="flex flex-1 flex-col items-center px-2">
                  <span className="text-[11px] text-slate-400 dark:text-neutral-500">
                    {rentalDays(offer.pickupAt, offer.dropoffAt)} day
                    {rentalDays(offer.pickupAt, offer.dropoffAt) === 1 ? "" : "s"}
                  </span>
                  <div className="my-1 h-px w-full bg-slate-200 dark:bg-neutral-700" />
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-slate-900 dark:text-neutral-100">
                    {formatTime(offer.dropoffAt)}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-neutral-400">
                    {formatShortDate(offer.dropoffAt)} · {offer.dropoffLocationName}
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-1.5">
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600 dark:bg-neutral-800 dark:text-neutral-300">
                  {offer.unlimitedMileage
                    ? "Unlimited mileage"
                    : `${offer.includedMileageLimit ?? "?"} ${offer.mileageUnit}/day`}
                </span>
                {offer.depositAmount !== null && (
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600 dark:bg-neutral-800 dark:text-neutral-300">
                    {offer.depositCurrency} {offer.depositAmount.toFixed(0)} deposit
                  </span>
                )}
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600 dark:bg-neutral-800 dark:text-neutral-300">
                  {offer.freeCancellation ? "Free cancellation" : "Non-refundable"}
                </span>
              </div>
            </div>

            <div className="rounded-3xl border border-orange-900/5 dark:border-neutral-700/60 bg-white/90 dark:bg-neutral-900/80 p-6 text-center shadow-sm">
              <p className="text-sm text-slate-500 dark:text-neutral-400">
                Reservations are completed on Discover Cars&apos; own
                checkout, where they&apos;ll confirm final pricing, take
                driver details, and handle payment.
              </p>
              <a
                href={offer.bookingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-block rounded-full bg-gradient-to-r from-orange-500 to-orange-600 px-8 py-3 text-sm font-semibold text-white shadow-sm transition hover:from-orange-600 hover:to-orange-700"
              >
                Book on Discover Cars — {offer.currency} {offer.totalPrice.toFixed(2)}
              </a>
            </div>
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
