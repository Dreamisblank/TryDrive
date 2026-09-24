import type { ResultOffer } from "@/lib/offerFilters";
import { formatTime, rentalDays } from "@/lib/formatDateTime";
import { getCurrency } from "@/lib/currency";
import { carImageAt } from "@/lib/carImage";
import OfferFeatureChips from "./OfferFeatureChips";

function SupplierLogo({ offer, size }: { offer: ResultOffer; size: "sm" | "md" }) {
  const box = size === "sm" ? "h-8 w-8" : "h-9 w-9";
  return offer.supplierLogo ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={offer.supplierLogo}
      alt={offer.supplierName}
      className={`${box} shrink-0 rounded-lg border border-orange-900/5 bg-white object-contain p-1 dark:border-neutral-700/60`}
    />
  ) : (
    <span
      className={`${box} flex shrink-0 items-center justify-center rounded-lg bg-orange-100 text-xs font-semibold text-orange-700 dark:bg-orange-900/40 dark:text-orange-300`}
    >
      {offer.supplierName.slice(0, 1)}
    </span>
  );
}

function CancellationLabel({ free }: { free: boolean }) {
  return (
    <span
      className={`text-center text-[11px] leading-tight font-medium ${
        free ? "text-green-600 dark:text-green-400" : "text-slate-400 dark:text-neutral-500"
      }`}
    >
      {free ? "Free cancellation" : "Non-refundable"}
    </span>
  );
}

export default function OfferCard({
  offer,
  isBest,
  eagerImage = false,
}: {
  offer: ResultOffer;
  isBest: boolean;
  /** Only the first few results should load eagerly - the rest are below
   *  the fold and lazy-load as they scroll into view. */
  eagerImage?: boolean;
}) {
  const days = rentalDays(offer.pickupAt, offer.dropoffAt);
  const imageUrl = carImageAt(offer.imageUrl, 200);
  const price = `${getCurrency(offer.currency).symbol}${offer.totalPrice.toFixed(2)}`;
  const loading = eagerImage ? "eager" : "lazy";

  return (
    <>
      {/* Mobile / narrow card */}
      <div
        className={`relative rounded-3xl border bg-white/90 p-4 shadow-sm backdrop-blur-sm dark:bg-neutral-900/80 desktop:hidden ${
          isBest
            ? "border-orange-300 ring-1 ring-orange-200 dark:border-orange-700 dark:ring-orange-900/40"
            : "border-orange-900/5 dark:border-neutral-700/60"
        }`}
      >
        {isBest && (
          <span className="absolute -top-2.5 left-4 rounded-full bg-orange-600 px-2.5 py-0.5 text-[11px] font-semibold text-white shadow-sm">
            Best price
          </span>
        )}

        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-2.5">
            <SupplierLogo offer={offer} size="sm" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900 dark:text-neutral-100">
                {offer.supplierName}
              </p>
              {offer.supplierRating !== null && (
                <p className="text-xs text-slate-500 dark:text-neutral-400">
                  {offer.supplierRating.toFixed(1)}/10
                  {offer.supplierReviewCount !== null &&
                    ` · ${offer.supplierReviewCount.toLocaleString()} reviews`}
                </p>
              )}
              <OfferFeatureChips
                seats={offer.seats}
                bags={offer.bags}
                transmission={offer.transmission}
              />
            </div>
          </div>

          <div className="shrink-0 text-right">
            <div className="text-2xl font-bold text-slate-900 dark:text-neutral-100">{price}</div>
            <div className="text-xs text-slate-500 dark:text-neutral-400">
              for {days} day{days === 1 ? "" : "s"}
            </div>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-3">
          <div className="flex h-16 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-orange-50 p-1.5 dark:bg-orange-950/30">
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageUrl}
                alt={offer.vehicleName}
                loading={loading}
                className="h-full w-full object-contain"
              />
            ) : (
              <span className="text-[10px] text-orange-300 dark:text-orange-600">No image</span>
            )}
          </div>
          <div className="min-w-0">
            <span className="inline-block rounded-full bg-orange-100 px-2 py-0.5 text-[11px] font-medium text-orange-700 dark:bg-orange-900/40 dark:text-orange-400">
              {offer.category}
            </span>
            <h3 className="truncate text-base font-semibold text-slate-900 dark:text-neutral-100">
              {offer.vehicleName}
            </h3>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between gap-2 border-t border-orange-900/5 pt-3 dark:border-neutral-700/60">
          <div className="text-left">
            <div className="text-base font-bold text-slate-900 dark:text-neutral-100">
              {formatTime(offer.pickupAt)}
            </div>
            <div className="max-w-[110px] truncate text-xs text-slate-500 dark:text-neutral-400">
              {offer.pickupLocationName}
            </div>
          </div>

          <div className="flex min-w-0 flex-1 flex-col items-center px-2">
            <span className="text-[11px] text-slate-400 dark:text-neutral-500">
              {days} day{days === 1 ? "" : "s"}
            </span>
            <div className="my-1 h-px w-full bg-slate-200 dark:bg-neutral-700" />
            <CancellationLabel free={offer.freeCancellation} />
          </div>

          <div className="text-right">
            <div className="text-base font-bold text-slate-900 dark:text-neutral-100">
              {formatTime(offer.dropoffAt)}
            </div>
            <div className="max-w-[110px] truncate text-xs text-slate-500 dark:text-neutral-400">
              {offer.dropoffLocationName}
            </div>
          </div>
        </div>

        {/* Deposit is deliberately left out of the list: it's a large
            refundable hold, not part of the price, and reads as alarming
            next to the headline total - it shows on the offer's own page. */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] text-slate-600 dark:bg-neutral-800 dark:text-neutral-300">
            {offer.unlimitedMileage
              ? "Unlimited mileage"
              : `${offer.includedMileageLimit ?? "?"} ${offer.mileageUnit}/day`}
          </span>
        </div>

        <a
          href={`/book/${offer.offerId}`}
          className="mt-4 block w-full rounded-full bg-gradient-to-r from-orange-500 to-orange-600 py-3 text-center text-sm font-semibold text-white shadow-sm transition hover:from-orange-600 hover:to-orange-700"
        >
          View
        </a>
      </div>

      <OfferRow offer={offer} isBest={isBest} days={days} price={price} imageUrl={imageUrl} loading={loading} />
    </>
  );
}

/**
 * One-line desktop row (vehicle, pickup/return timeline, price + CTA). Sized
 * to sit beside the 11rem filter sidebar from the `desktop` breakpoint
 * (832px) up: at that width the row has ~548px inside its padding, split as
 * vehicle 224 + price 96 + gaps 32, leaving ~196px for the times-only
 * timeline. Pickup/return location names only join the timeline from lg,
 * where there's room for them.
 */
function OfferRow({
  offer,
  isBest,
  days,
  price,
  imageUrl,
  loading,
}: {
  offer: ResultOffer;
  isBest: boolean;
  days: number;
  price: string;
  imageUrl: string | null;
  loading: "eager" | "lazy";
}) {
  return (
    <div
      className={`relative hidden items-center gap-4 rounded-2xl border bg-white/90 px-5 py-4 shadow-sm backdrop-blur-sm transition-shadow hover:shadow-md dark:bg-neutral-900/80 desktop:flex ${
        isBest
          ? "border-orange-300 ring-1 ring-orange-200 dark:border-orange-700 dark:ring-orange-900/40"
          : "border-orange-900/5 dark:border-neutral-700/60"
      }`}
    >
      {isBest && (
        <span className="absolute -top-2.5 left-5 rounded-full bg-orange-600 px-2.5 py-0.5 text-[11px] font-semibold text-white shadow-sm">
          Best price
        </span>
      )}

      <div className="flex w-56 shrink-0 items-center gap-3 lg:w-64">
        <div className="flex h-12 w-16 shrink-0 items-center justify-center lg:h-14 lg:w-24">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt={offer.vehicleName}
              loading={loading}
              className="max-h-full max-w-full object-contain drop-shadow-[0_6px_6px_rgba(15,23,42,0.12)]"
            />
          ) : (
            <span className="text-[9px] text-orange-300 dark:text-orange-600">No image</span>
          )}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate text-sm font-semibold text-slate-900 dark:text-neutral-100">
              {offer.vehicleName}
            </h3>
            <span className="shrink-0 rounded-full bg-orange-100 px-1.5 py-0.5 text-[10px] font-medium text-orange-700 dark:bg-orange-900/40 dark:text-orange-400">
              {offer.category}
            </span>
          </div>
          <p className="truncate text-xs text-slate-500 dark:text-neutral-400">
            {offer.supplierName}
            {offer.supplierRating !== null && ` · ${offer.supplierRating.toFixed(1)}/10`}
          </p>
          <OfferFeatureChips
            seats={offer.seats}
            bags={offer.bags}
            transmission={offer.transmission}
          />
        </div>
      </div>

      <div className="flex min-w-0 flex-1 items-center justify-center gap-3">
        <div className="shrink-0 text-left">
          <div className="text-base font-bold text-slate-900 dark:text-neutral-100">
            {formatTime(offer.pickupAt)}
          </div>
          <div className="hidden max-w-[120px] truncate text-xs text-slate-500 lg:block dark:text-neutral-400">
            {offer.pickupLocationName}
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col items-center">
          <span className="text-[11px] text-slate-400 dark:text-neutral-500">
            {days} day{days === 1 ? "" : "s"}
          </span>
          <div className="my-1 h-px w-full bg-slate-200 dark:bg-neutral-700" />
          <CancellationLabel free={offer.freeCancellation} />
        </div>

        <div className="shrink-0 text-right">
          <div className="text-base font-bold text-slate-900 dark:text-neutral-100">
            {formatTime(offer.dropoffAt)}
          </div>
          <div className="hidden max-w-[120px] truncate text-xs text-slate-500 lg:block dark:text-neutral-400">
            {offer.dropoffLocationName}
          </div>
        </div>
      </div>

      <div className="flex w-24 shrink-0 flex-col items-end gap-2">
        <div className="text-right">
          <div className="text-lg font-bold whitespace-nowrap text-slate-900 dark:text-neutral-100">
            {price}
          </div>
          <div className="text-xs whitespace-nowrap text-slate-500 dark:text-neutral-400">
            for {days} day{days === 1 ? "" : "s"}
          </div>
        </div>
        <a
          href={`/book/${offer.offerId}`}
          className="block w-full rounded-full bg-gradient-to-r from-orange-500 to-orange-600 py-2 text-center text-sm font-semibold text-white shadow-sm transition hover:from-orange-600 hover:to-orange-700"
        >
          View
        </a>
      </div>
    </div>
  );
}
