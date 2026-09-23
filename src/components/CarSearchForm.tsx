"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { PickupLocation } from "@/lib/locations";
import { detectResidenceCountry } from "@/lib/currency";
import { addDays, earliestPickupIso } from "@/lib/formatDateTime";
import LocationAutocomplete from "./LocationAutocomplete";
import DateRangePicker from "./DateRangePicker";

function UserIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c1.5-4 5-6 8-6s6.5 2 8 6" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

export default function CarSearchForm() {
  const router = useRouter();
  const [pickupDate, setPickupDate] = useState(earliestPickupIso());
  const [dropoffDate, setDropoffDate] = useState(addDays(earliestPickupIso(), 3));
  const [driverAge, setDriverAge] = useState("25");
  const [location, setLocation] = useState<PickupLocation | null>(null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!location) return;

    const params = new URLSearchParams({
      location: location.name,
      pickupDate,
      dropoffDate,
      driverAge,
      residence: detectResidenceCountry(),
      ...(location.iata ? { iata: location.iata } : {}),
      ...(location.latitude != null ? { lat: String(location.latitude) } : {}),
      ...(location.longitude != null ? { lng: String(location.longitude) } : {}),
    });
    const destination = `/search?${params.toString()}`;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefersReducedMotion || location.latitude == null || location.longitude == null) {
      router.push(destination);
      return;
    }

    // Let the background globe zoom into the search location before
    // navigating, rather than cutting away mid-animation.
    window.dispatchEvent(
      new CustomEvent("trydrive:zoom-search", {
        detail: { lat: location.latitude, lng: location.longitude },
      }),
    );
    setTimeout(() => router.push(destination), 650);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto w-full max-w-4xl rounded-[28px] border border-orange-900/5 dark:border-neutral-700/60 bg-white/90 dark:bg-neutral-900/80 p-2 shadow-[0_20px_60px_-15px_rgba(234,88,12,0.35)] backdrop-blur-xl sm:rounded-full"
    >
      <div className="flex flex-col divide-y divide-slate-900/10 sm:flex-row sm:items-stretch sm:divide-x sm:divide-y-0">
        <LocationAutocomplete value={location} onChange={setLocation} />

        <DateRangePicker
          pickupDate={pickupDate}
          dropoffDate={dropoffDate}
          minDate={earliestPickupIso()}
          onChange={(nextPickup, nextDropoff) => {
            setPickupDate(nextPickup);
            setDropoffDate(nextDropoff);
          }}
        />

        <label className="flex flex-1 cursor-text flex-col justify-center gap-0.5 rounded-full px-5 py-2.5 text-left transition hover:bg-orange-500/5 sm:max-w-[160px]">
          <span className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-neutral-400">
            <UserIcon />
            Driver age
          </span>
          <input
            id="driverAge"
            name="driverAge"
            type="number"
            required
            min={18}
            max={99}
            value={driverAge}
            onChange={(event) => setDriverAge(event.target.value)}
            className="bg-transparent text-base font-medium text-slate-900 dark:text-neutral-100 outline-none"
          />
        </label>

        <div className="flex items-center justify-center p-1.5 sm:pl-1.5">
          <button
            type="submit"
            disabled={!location}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:from-orange-600 hover:to-orange-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            <SearchIcon />
            Search
          </button>
        </div>
      </div>
    </form>
  );
}
