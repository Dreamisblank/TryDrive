"use client";

import { useEffect, useState } from "react";

const HEADLINES = [
  "Cheap wheels, zero hassle.",
  "Rent a car without the runaround.",
  "A cheap ride shouldn't take a detour to find.",
  "Skip the search. Score the deal.",
  "Car rentals, minus the headache.",
  "The easy way to a cheap ride.",
  "Less digging, more driving.",
  "Cheap cars. Quick search. Zero drama.",
];

export default function HeroHeadline() {
  const [headline, setHeadline] = useState(HEADLINES[0]);

  useEffect(() => {
    // Randomize only after hydration: the server always renders HEADLINES[0]
    // so client and server markup match on the first paint.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHeadline(HEADLINES[Math.floor(Math.random() * HEADLINES.length)]);
  }, []);

  return (
    <h1 className="text-4xl font-semibold tracking-tight text-slate-900 dark:text-neutral-100 sm:text-5xl">
      {headline}
    </h1>
  );
}
