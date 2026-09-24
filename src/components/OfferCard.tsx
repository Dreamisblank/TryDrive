import type { NormalizedOffer } from "@/lib/discovercars";
import { formatTime, rentalDays } from "@/lib/formatDateTime";
import { getCurrency } from "@/lib/currency";

export default function OfferCard({
  offer,
  isBest,
}: {
  offer: NormalizedOffer;
  isBest: boolean;
}) {
  const days = rentalDays(offer.pickupAt, offer.dropoffAt);

  return (
    <>
      <div
        className={`relative rounded-3xl border bg-white/90 p-4 shadow-sm backdrop-blur-sm dark:bg-neutral-900/80 lg:hidden ${
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

        {/* Header: supplier logo + name, price top-right - mirrors an
            airline-logo-led flight result row. */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            {offer.supplierLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={offer.supplierLogo}
                alt={offer.supplierName}
                className="h-8 w-8 shrink-0 rounded-lg border border-orange-900/5 bg-white object-contain p-1 dark:border-neutral-700/60"
              />
            ) : (
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-100 text-xs font-semibold text-orange-700 dark:bg-orange-900/40 dark:text-orange-300">
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

          <div className="text-right">
            <div className="text-2xl font-bold text-slate-900 dark:text-neutral-100">
              {getCurrency(offer.currency).symbol}
              {offer.totalPrice.toFixed(2)}
            </div>
            <div className="text-xs text-slate-500 dark:text-neutral-400">
              for {days} day{days === 1 ? "" : "s"}
            </div>
          </div>
        </div>

        {/* Vehicle */}
        <div className="mt-3 flex items-center gap-3">
          <div className="flex h-16 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-orange-50 p-1.5 dark:bg-orange-950/30">
            {offer.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={offer.imageUrl}
                alt={offer.vehicleName}
                className="h-full w-full object-contain"
              />
            ) : (
              <span className="text-[10px] text-orange-300 dark:text-orange-600">No image</span>
            )}
          </div>
          <div>
            <span className="inline-block rounded-full bg-orange-100 dark:bg-orange-900/40 px-2 py-0.5 text-[11px] font-medium text-orange-700 dark:text-orange-400">
              {offer.category}
            </span>
            <h3 className="text-base font-semibold text-slate-900 dark:text-neutral-100">
              {offer.vehicleName}
            </h3>
            <p className="text-xs text-slate-500 dark:text-neutral-400">
              {offer.transmission} · {offer.seats} seats
            </p>
          </div>
        </div>

        {/* Pickup -> dropoff "timeline", mirroring a flight's
            departure -> duration -> arrival row. */}
        <div className="mt-3 flex items-center justify-between gap-2 border-t border-orange-900/5 pt-3 dark:border-neutral-700/60">
          <div className="text-left">
            <div className="text-base font-bold text-slate-900 dark:text-neutral-100">
              {formatTime(offer.pickupAt)}
            </div>
            <div className="max-w-[110px] truncate text-xs text-slate-500 dark:text-neutral-400">
              {offer.pickupLocationName}
            </div>
          </div>

          <div className="flex flex-1 flex-col items-center px-2">
            <span className="text-[11px] text-slate-400 dark:text-neutral-500">
              {days} day{days === 1 ? "" : "s"}
            </span>
            <div className="my-1 h-px w-full bg-slate-200 dark:bg-neutral-700" />
            <span
              className={`text-[11px] font-medium ${
                offer.freeCancellation
                  ? "text-green-600 dark:text-green-400"
                  : "text-slate-400 dark:text-neutral-500"
              }`}
            >
              {offer.freeCancellation ? "Free cancellation" : "Non-refundable"}
            </span>
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

        {/* Compact feature badges - the extra comparison detail a car rental
            needs that a flight doesn't. Deposit is deliberately left out here:
            it's a large refundable hold, not part of the price, and reads as
            alarming/confusing next to the headline total in a scannable list -
            it only shows once someone opens the offer's own details. */}
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
      <OfferRow offer={offer} isBest={isBest} />
    </>
  );
}

/** Long, thin desktop row - mirrors a flight-search result layout (identity,
 *  route/timeline, price + CTA all on one line) while keeping the mobile
 *  card above untouched below the lg breakpoint. Column widths are kept
 *  deliberately narrow and summed against the lg-breakpoint container width
 *  so nothing wraps or clips at 1024px. */
function OfferRow({ offer, isBest }: { offer: NormalizedOffer; isBest: boolean }) {
  const days = rentalDays(offer.pickupAt, offer.dropoffAt);

  return (
    <div
      className={`relative hidden items-center gap-5 rounded-2xl border bg-white/90 px-5 py-4 shadow-sm backdrop-blur-sm dark:bg-neutral-900/80 lg:flex ${
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

      {/* Vehicle identity - thumbnail + name carries the row, the way an
          airline logo + name does in a flight row; supplier and specs fold
          into one subtitle line underneath instead of their own column. */}
      <div className="flex w-64 shrink-0 items-center gap-3">
        <div className="flex h-12 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-orange-50 p-1 dark:bg-orange-950/30">
          {offer.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={offer.imageUrl}
              alt={offer.vehicleName}
              className="h-full w-full object-contain"
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
            <span className="shrink-0 rounded-full bg-orange-100 dark:bg-orange-900/40 px-1.5 py-0.5 text-[10px] font-medium text-orange-700 dark:text-orange-400">
              {offer.category}
            </span>
          </div>
          <p className="truncate text-xs text-slate-500 dark:text-neutral-400">
            {offer.supplierName}
            {offer.supplierRating !== null && ` · ${offer.supplierRating.toFixed(1)}/10`}
          </p>
        </div>
      </div>

      {/* Timeline - takes the remaining space, like a flight row's times/route column. */}
      <div className="flex min-w-0 flex-1 items-center justify-center gap-4">
        <div className="text-left">
          <div className="text-base font-bold text-slate-900 dark:text-neutral-100">
            {formatTime(offer.pickupAt)}
          </div>
          <div className="max-w-[140px] truncate text-xs text-slate-500 dark:text-neutral-400">
            {offer.pickupLocationName}
          </div>
        </div>

        <div className="flex flex-1 flex-col items-center px-2">
          <span className="text-[11px] text-slate-400 dark:text-neutral-500">
            {days} day{days === 1 ? "" : "s"}
          </span>
          <div className="my-1 h-px w-full bg-slate-200 dark:bg-neutral-700" />
          <span
            className={`text-[11px] font-medium ${
              offer.freeCancellation
                ? "text-green-600 dark:text-green-400"
                : "text-slate-400 dark:text-neutral-500"
            }`}
          >
            {offer.freeCancellation ? "Free cancellation" : "Non-refundable"}
          </span>
        </div>

        <div className="text-right">
          <div className="text-base font-bold text-slate-900 dark:text-neutral-100">
            {formatTime(offer.dropoffAt)}
          </div>
          <div className="max-w-[140px] truncate text-xs text-slate-500 dark:text-neutral-400">
            {offer.dropoffLocationName}
          </div>
        </div>
      </div>

      {/* Price + CTA - same top-right position as the mobile card, just
          stacked at the end of the row instead. */}
      <div className="flex w-32 shrink-0 flex-col items-end gap-2">
        <div className="text-right">
          <div className="text-lg font-bold whitespace-nowrap text-slate-900 dark:text-neutral-100">
            {getCurrency(offer.currency).symbol}
            {offer.totalPrice.toFixed(2)}
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
