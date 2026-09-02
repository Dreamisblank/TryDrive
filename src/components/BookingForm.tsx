"use client";

import { useMemo, useState } from "react";
import type { NormalizedVehicle } from "@/lib/rentsyst";
import { useAuth } from "./AuthProvider";

type BookingResult = { bookingId: string; totalPrice: number };
type DriverInfo = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  birthdate: string;
};

const inputClass =
  "w-full rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-slate-900 dark:text-neutral-100 outline-none focus:border-orange-400";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

// Deterministic, locale/timezone-independent formatting: this component is
// server-rendered for its initial HTML, so anything relying on the
// runtime's locale or local timezone (toLocaleDateString, or parsing
// "YYYY-MM-DD" as local time) can produce different text on the server vs.
// the browser and break hydration.
function formatDate(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  const weekday = WEEKDAYS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()];
  return `${weekday}, ${day} ${MONTHS[month - 1]} ${year}`;
}

export default function BookingForm({
  vehicle,
  driverAge,
  pickupDate,
  dropoffDate,
}: {
  vehicle: NormalizedVehicle;
  driverAge: number;
  pickupDate: string;
  dropoffDate: string;
}) {
  const c = vehicle.currencySymbol;
  const days = Math.max(
    1,
    Math.round(
      (new Date(`${dropoffDate}T00:00:00`).getTime() -
        new Date(`${pickupDate}T00:00:00`).getTime()) /
        86400000,
    ),
  );

  const [selectedInsuranceIndex, setSelectedInsuranceIndex] = useState(() => {
    const cheapestPrice = Math.min(
      ...vehicle.insuranceOptions.map((i) => i.price),
      Infinity,
    );
    const idx = vehicle.insuranceOptions.findIndex(
      (i) => i.price === cheapestPrice,
    );
    return idx === -1 ? null : idx;
  });

  const { user, configured, openSignIn } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [bookingResult, setBookingResult] = useState<BookingResult | null>(
    null,
  );
  const [driverInfo, setDriverInfo] = useState<DriverInfo | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);

  const selectedInsurance =
    selectedInsuranceIndex !== null
      ? vehicle.insuranceOptions[selectedInsuranceIndex]
      : null;

  const total = useMemo(
    () =>
      vehicle.rentalPrice +
      (selectedInsurance?.price ?? 0) +
      (vehicle.ageSurcharge?.price ?? 0),
    [vehicle.rentalPrice, vehicle.ageSurcharge, selectedInsurance],
  );

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBookingError(null);

    const form = new FormData(event.currentTarget);
    const birthdate = String(form.get("birthdate") || "");
    const comment = String(form.get("comment") || "");
    const driver: DriverInfo = {
      firstName: String(form.get("firstName") || ""),
      lastName: String(form.get("lastName") || ""),
      email: String(form.get("email") || ""),
      phone: String(form.get("phone") || ""),
      birthdate,
    };

    // Booking requires an account. If sign-in isn't configured yet, fall
    // through so the site keeps working exactly as it did before.
    if (configured && !user) {
      openSignIn(() => {
        void submitBooking(driver, comment);
      });
      return;
    }

    void submitBooking(driver, comment);
  }

  async function submitBooking(driver: DriverInfo, comment: string) {
    setSubmitting(true);
    setBookingError(null);

    try {
      const response = await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicleId: vehicle.id,
          pickupLocationId: vehicle.pickupLocationId,
          returnLocationId: vehicle.returnLocationId,
          pickupDatetime: `${pickupDate} 10:00:00`,
          returnDatetime: `${dropoffDate} 10:00:00`,
          insuranceId: selectedInsurance?.id,
          insuranceName: selectedInsurance?.name,
          pickupLocation: "Larnaca, Cyprus (Demo)",
          vehicleName: vehicle.name,
          totalPrice: total,
          currencySymbol: c,
          driver: { ...driver, birthdate: driver.birthdate || undefined },
          comment: comment || undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Couldn't create the booking.");
      }

      setDriverInfo(driver);
      setBookingResult({
        bookingId: data.bookingId,
        totalPrice: typeof data.totalPrice === "number" ? data.totalPrice : total,
      });
    } catch (err) {
      setBookingError(
        err instanceof Error ? err.message : "Couldn't create the booking.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (bookingResult && driverInfo) {
    const rows: [string, string][] = [
      ["Reference", bookingResult.bookingId],
      ["Vehicle", vehicle.name],
      ["Pickup", `${formatDate(pickupDate)} · Larnaca, Cyprus (Demo)`],
      ["Return", `${formatDate(dropoffDate)} · Larnaca, Cyprus (Demo)`],
      ["Driver", `${driverInfo.firstName} ${driverInfo.lastName}`],
      ["Email", driverInfo.email],
      ["Phone", driverInfo.phone],
      ...(selectedInsurance ? ([["Insurance", selectedInsurance.name]] as [string, string][]) : []),
      ["Total", `${c}${bookingResult.totalPrice.toFixed(2)}`],
    ];

    return (
      <div className="mt-8 rounded-3xl border border-green-200 dark:border-green-900/40 bg-green-50 dark:bg-green-950/25 p-8">
        <h2 className="text-xl font-semibold text-green-900 dark:text-green-200">
          Booking confirmed
        </h2>
        <dl className="mt-5 divide-y divide-green-200/70 dark:divide-green-900/40">
          {rows.map(([label, value]) => (
            <div
              key={label}
              className="flex justify-between gap-4 py-2.5 text-sm"
            >
              <dt className="text-green-700 dark:text-green-400">{label}</dt>
              <dd className="text-right font-medium text-green-900 dark:text-green-200">
                {value}
              </dd>
            </div>
          ))}
        </dl>
        {Math.abs(bookingResult.totalPrice - total) > 0.01 && (
          <p className="mt-4 text-xs text-green-800 dark:text-green-300">
            The total above reflects the final amount confirmed by the
            rental company, including any taxes or fees not shown in the
            earlier estimate.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="mt-6">
      {/* Summary card */}
      <div className="flex flex-col gap-4 rounded-3xl border border-orange-900/5 dark:border-neutral-700/60 bg-white/90 dark:bg-neutral-900/80 p-5 shadow-sm sm:flex-row sm:items-center">
        <div className="flex h-24 w-32 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-orange-50 dark:bg-orange-950/30">
          {vehicle.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={vehicle.image}
              alt={vehicle.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-xs text-orange-300 dark:text-orange-600">No image</span>
          )}
        </div>
        <div className="flex-1">
          <span className="inline-block rounded-full bg-orange-100 dark:bg-orange-900/40 px-2.5 py-0.5 text-xs font-medium text-orange-700 dark:text-orange-400">
            {vehicle.category}
          </span>
          <h1 className="mt-1 text-2xl font-bold text-slate-900 dark:text-neutral-100">
            {vehicle.name}
          </h1>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-neutral-400">
            {vehicle.transmission} · {vehicle.seats} seats · {vehicle.fuel} ·{" "}
            {vehicle.company}
          </p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-slate-900 dark:text-neutral-100">
            {c}
            {total.toFixed(2)}
          </div>
          <div className="text-xs text-slate-500 dark:text-neutral-400">
            Total for {days} day{days === 1 ? "" : "s"}
          </div>
        </div>
      </div>

      {/* Trip details */}
      <div className="mt-6 rounded-3xl border border-orange-900/5 dark:border-neutral-700/60 bg-white/90 dark:bg-neutral-900/80 p-5 shadow-sm">
        <h2 className="text-sm font-semibold tracking-wide text-slate-500 dark:text-neutral-400 uppercase">
          Trip details
        </h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <div>
            <div className="text-xs font-medium text-slate-400 dark:text-neutral-500">Pickup</div>
            <div className="text-sm font-medium text-slate-900 dark:text-neutral-100">
              {formatDate(pickupDate)}
            </div>
            <div className="text-sm text-slate-600 dark:text-neutral-300">Larnaca, Cyprus (Demo)</div>
          </div>
          <div>
            <div className="text-xs font-medium text-slate-400 dark:text-neutral-500">Return</div>
            <div className="text-sm font-medium text-slate-900 dark:text-neutral-100">
              {formatDate(dropoffDate)}
            </div>
            <div className="text-sm text-slate-600 dark:text-neutral-300">Larnaca, Cyprus (Demo)</div>
          </div>
        </div>
        {vehicle.minDriverAge !== null && (
          <p className="mt-3 text-xs text-slate-500 dark:text-neutral-400">
            Minimum driver age: {vehicle.minDriverAge}+ (searched: {driverAge})
          </p>
        )}
      </div>

      {/* Price breakdown */}
      <div className="mt-6 rounded-3xl border border-orange-900/5 dark:border-neutral-700/60 bg-white/90 dark:bg-neutral-900/80 p-5 shadow-sm">
        <h2 className="text-sm font-semibold tracking-wide text-slate-500 dark:text-neutral-400 uppercase">
          Price breakdown
        </h2>

        <div className="mt-3 flex justify-between text-sm text-slate-700 dark:text-neutral-200">
          <span>Base rental ({days} day{days === 1 ? "" : "s"})</span>
          <span className="font-medium">
            {c}
            {vehicle.rentalPrice.toFixed(2)}
          </span>
        </div>

        {vehicle.ageSurcharge && (
          <div className="mt-2 flex justify-between text-sm text-amber-700 dark:text-amber-400">
            <span>{vehicle.ageSurcharge.name} fee</span>
            <span className="font-medium">
              +{c}
              {vehicle.ageSurcharge.price.toFixed(2)}
            </span>
          </div>
        )}

        {vehicle.insuranceOptions.length > 0 && (
          <fieldset className="mt-4">
            <legend className="text-xs font-medium text-slate-500 dark:text-neutral-400">
              Insurance
            </legend>
            <div className="mt-2 space-y-2">
              {vehicle.insuranceOptions.map((ins, idx) => (
                <label
                  key={ins.name}
                  className={`flex cursor-pointer items-start justify-between gap-3 rounded-xl border px-3 py-2 text-sm transition ${
                    selectedInsuranceIndex === idx
                      ? "border-orange-400 dark:border-orange-500 bg-orange-50 dark:bg-orange-950/30"
                      : "border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 hover:border-orange-200 dark:hover:border-orange-800"
                  }`}
                >
                  <span className="flex items-start gap-2">
                    <input
                      type="radio"
                      name="insurance"
                      checked={selectedInsuranceIndex === idx}
                      onChange={() => setSelectedInsuranceIndex(idx)}
                      className="mt-1"
                    />
                    <span>
                      <span className="block font-medium text-slate-900 dark:text-neutral-100">
                        {ins.name}
                      </span>
                      <span className="block text-xs text-slate-500 dark:text-neutral-400">
                        {ins.description}
                      </span>
                    </span>
                  </span>
                  <span className="font-medium text-slate-900 dark:text-neutral-100">
                    {ins.price === 0 ? "Free" : `${c}${ins.price.toFixed(2)}`}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        )}

        <div className="mt-4 flex justify-between border-t border-slate-200 dark:border-neutral-700 pt-3 text-base font-semibold text-slate-900 dark:text-neutral-100">
          <span>Total</span>
          <span>
            {c}
            {total.toFixed(2)}
          </span>
        </div>
        <p className="mt-2 text-xs text-slate-400 dark:text-neutral-500">
          Estimated total. The rental company may confirm a different final
          amount, including taxes or fees, once your booking is created.
        </p>
      </div>

      {/* Driver details + submit */}
      <form
        onSubmit={handleSubmit}
        className="mt-6 rounded-3xl border border-orange-900/5 dark:border-neutral-700/60 bg-white/90 dark:bg-neutral-900/80 p-5 shadow-sm"
      >
        <h2 className="text-sm font-semibold tracking-wide text-slate-500 dark:text-neutral-400 uppercase">
          Driver details
        </h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <input
            name="firstName"
            required
            placeholder="First name"
            className={inputClass}
          />
          <input
            name="lastName"
            required
            placeholder="Last name"
            className={inputClass}
          />
          <input
            name="email"
            type="email"
            required
            placeholder="Email"
            className={inputClass}
          />
          <input
            name="phone"
            type="tel"
            required
            placeholder="Phone"
            className={inputClass}
          />
          <label className="flex flex-col gap-1 text-xs text-slate-500 dark:text-neutral-400">
            Date of birth
            <input
              name="birthdate"
              type="date"
              required
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-slate-500 dark:text-neutral-400 sm:col-span-2">
            Notes for the rental company (optional)
            <input
              name="comment"
              placeholder="e.g. arriving on a late flight"
              className={inputClass}
            />
          </label>
        </div>

        {bookingError && (
          <p className="mt-3 text-sm text-red-600 dark:text-red-400">{bookingError}</p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="mt-4 w-full rounded-full bg-orange-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-orange-700 disabled:opacity-60 sm:w-auto"
        >
          {submitting
            ? "Booking…"
            : configured && !user
              ? `Sign in to book — ${c}${total.toFixed(2)}`
              : `Confirm booking — ${c}${total.toFixed(2)}`}
        </button>
      </form>
    </div>
  );
}
