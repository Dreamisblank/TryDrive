"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const DEMO_LOCATION_LABEL = "Larnaca, Cyprus (Demo)";

// Local calendar date (not toISOString, which shifts to UTC and can land
// on the wrong day depending on the browser's timezone offset).
function toIso(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(iso: string, days: number) {
  const date = new Date(`${iso}T00:00:00`);
  date.setDate(date.getDate() + days);
  return toIso(date);
}

// RentSyst evaluates the submitted date/time server-side without a
// timezone, so a same-timezone "tomorrow" can still land in the past
// there. A 2-day buffer comfortably clears that skew.
function earliestPickupIso() {
  return addDays(toIso(new Date()), 2);
}

function PinIcon() {
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
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function CalendarIcon() {
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
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M3 10h18" />
    </svg>
  );
}

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

  function handlePickupDateChange(nextPickupDate: string) {
    setPickupDate(nextPickupDate);
    // Keep dropoff strictly after pickup instead of leaving a stale/invalid gap.
    if (dropoffDate <= nextPickupDate) {
      setDropoffDate(addDays(nextPickupDate, 1));
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const params = new URLSearchParams({
      location: DEMO_LOCATION_LABEL,
      pickupDate,
      dropoffDate,
      driverAge,
    });
    const destination = `/search?${params.toString()}`;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefersReducedMotion) {
      router.push(destination);
      return;
    }

    // Let the background globe zoom into the search location before
    // navigating, rather than cutting away mid-animation.
    window.dispatchEvent(new CustomEvent("trydrive:zoom-search"));
    setTimeout(() => router.push(destination), 650);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto w-full max-w-4xl rounded-[28px] border border-orange-900/5 bg-white/90 p-2 shadow-[0_20px_60px_-15px_rgba(234,88,12,0.35)] backdrop-blur-xl sm:rounded-full"
    >
      <div className="flex flex-col divide-y divide-slate-900/10 sm:flex-row sm:items-stretch sm:divide-x sm:divide-y-0">
        <label className="flex flex-1 cursor-pointer flex-col justify-center gap-0.5 rounded-full px-5 py-2.5 text-left transition hover:bg-orange-500/5 sm:min-w-[220px]">
          <span className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
            <PinIcon />
            Pickup location
          </span>
          <select
            id="pickupLocation"
            name="pickupLocation"
            defaultValue={DEMO_LOCATION_LABEL}
            className="cursor-pointer appearance-none bg-transparent text-base font-medium text-slate-900 outline-none"
          >
            <option value={DEMO_LOCATION_LABEL}>{DEMO_LOCATION_LABEL}</option>
          </select>
        </label>

        <div className="flex flex-1 flex-col justify-center gap-0.5 rounded-full px-5 py-2.5 sm:min-w-[260px]">
          <span className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
            <CalendarIcon />
            Dates
          </span>
          <div className="flex items-center gap-2 text-base font-medium text-slate-900">
            <div className="relative">
              <input
                id="pickupDate"
                name="pickupDate"
                type="date"
                required
                min={earliestPickupIso()}
                value={pickupDate}
                onChange={(event) => handlePickupDateChange(event.target.value)}
                className="w-[104px] bg-transparent outline-none [color-scheme:light]"
              />
            </div>
            <span className="text-slate-400">&rarr;</span>
            <div className="relative">
              <input
                id="dropoffDate"
                name="dropoffDate"
                type="date"
                required
                min={addDays(pickupDate, 1)}
                value={dropoffDate}
                onChange={(event) => setDropoffDate(event.target.value)}
                className="w-[104px] bg-transparent outline-none [color-scheme:light]"
              />
            </div>
          </div>
        </div>

        <label className="flex flex-1 cursor-text flex-col justify-center gap-0.5 rounded-full px-5 py-2.5 text-left transition hover:bg-orange-500/5 sm:max-w-[160px]">
          <span className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
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
            className="bg-transparent text-base font-medium text-slate-900 outline-none"
          />
        </label>

        <div className="flex items-center justify-center p-1.5 sm:pl-1.5">
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:from-orange-600 hover:to-orange-700 sm:w-auto"
          >
            <SearchIcon />
            Search
          </button>
        </div>
      </div>
    </form>
  );
}
