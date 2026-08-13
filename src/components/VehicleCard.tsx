"use client";

import { useState } from "react";
import type { NormalizedVehicle } from "@/lib/rentsyst";

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export default function VehicleCard({
  vehicle,
  driverAge,
}: {
  vehicle: NormalizedVehicle;
  driverAge: number;
}) {
  const [open, setOpen] = useState(false);
  const c = vehicle.currencySymbol;

  return (
    <div className="overflow-hidden rounded-3xl border border-orange-900/5 bg-white/90 shadow-sm backdrop-blur-sm">
      <div className="flex flex-col gap-4 p-5 sm:flex-row">
        <div className="flex h-32 w-full items-center justify-center overflow-hidden rounded-2xl bg-orange-50 sm:w-44">
          {vehicle.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={vehicle.image}
              alt={vehicle.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-sm text-orange-300">No image</span>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-2">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <span className="inline-block rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-orange-700">
                {vehicle.category}
              </span>
              <h3 className="mt-1 text-lg font-semibold text-slate-900">
                {vehicle.name}
              </h3>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-slate-900">
                {c}
                {vehicle.totalPrice.toFixed(2)}
              </div>
              <div className="text-xs text-slate-500">
                {vehicle.cheapestInsurance
                  ? "Total price incl. insurance"
                  : "Total price (no insurance offered)"}
              </div>
            </div>
          </div>

          <dl className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
            <div className="flex items-center gap-1">
              <dt className="sr-only">Transmission</dt>
              <dd>{vehicle.transmission}</dd>
            </div>
            <div className="flex items-center gap-1">
              <dt className="sr-only">Seats</dt>
              <dd>{vehicle.seats} seats</dd>
            </div>
            <div className="flex items-center gap-1">
              <dt className="sr-only">Fuel</dt>
              <dd>{vehicle.fuel}</dd>
            </div>
            {vehicle.minDriverAge !== null && (
              <div className="flex items-center gap-1">
                <dt className="sr-only">Minimum driver age</dt>
                <dd>Min. age {vehicle.minDriverAge}+</dd>
              </div>
            )}
          </dl>

          {vehicle.ageSurcharge && (
            <p className="text-xs text-amber-700">
              Includes {vehicle.ageSurcharge.name} fee: +{c}
              {vehicle.ageSurcharge.price.toFixed(2)} for driver age{" "}
              {driverAge}
            </p>
          )}

          <div className="mt-auto flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="flex items-center gap-1 text-sm font-medium text-orange-700 hover:text-orange-800"
            >
              View details
              <ChevronIcon open={open} />
            </button>
            <span className="rounded-full bg-slate-900/5 px-3 py-1 text-xs text-slate-500">
              {vehicle.company}
            </span>
          </div>
        </div>
      </div>

      {open && (
        <div className="border-t border-orange-900/5 bg-orange-50/40 px-5 py-4 text-sm text-slate-700">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <div className="font-medium text-slate-900">Base rental price</div>
              <div>
                {c}
                {vehicle.rentalPrice.toFixed(2)} for the selected dates
              </div>
            </div>
            {vehicle.cheapestInsurance && (
              <div>
                <div className="font-medium text-slate-900">
                  Cheapest insurance applied
                </div>
                <div>
                  {vehicle.cheapestInsurance.name} — {c}
                  {vehicle.cheapestInsurance.price.toFixed(2)}
                </div>
              </div>
            )}
          </div>

          {vehicle.insuranceOptions.length > 0 && (
            <div className="mt-4">
              <div className="font-medium text-slate-900">
                All insurance options for this vehicle
              </div>
              <ul className="mt-1 space-y-1">
                {vehicle.insuranceOptions.map((ins) => (
                  <li key={ins.name} className="flex justify-between gap-4">
                    <span>{ins.name}</span>
                    <span className="font-medium">
                      {c}
                      {ins.price.toFixed(2)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
