"use client";

import { useState } from "react";
import type { NormalizedVehicle } from "@/lib/rentsyst";
import VehicleCard from "@/components/VehicleCard";

export default function SearchResults({
  vehicles,
  categories,
  driverAge,
}: {
  vehicles: NormalizedVehicle[];
  categories: string[];
  driverAge: number;
}) {
  const [activeCategory, setActiveCategory] = useState<string | "all">("all");

  const filtered =
    activeCategory === "all"
      ? vehicles
      : vehicles.filter((v) => v.category === activeCategory);

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setActiveCategory("all")}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
            activeCategory === "all"
              ? "bg-orange-600 text-white"
              : "bg-white/80 text-slate-700 hover:bg-orange-100"
          }`}
        >
          All categories
        </button>
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => setActiveCategory(category)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              activeCategory === category
                ? "bg-orange-600 text-white"
                : "bg-white/80 text-slate-700 hover:bg-orange-100"
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="mt-6 rounded-3xl border border-dashed border-orange-300 bg-white/70 p-10 text-center text-slate-500 backdrop-blur-sm">
          No vehicles in this category for your search.
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-4">
          {filtered.map((vehicle) => (
            <VehicleCard
              key={vehicle.id}
              vehicle={vehicle}
              driverAge={driverAge}
            />
          ))}
        </div>
      )}
    </div>
  );
}
