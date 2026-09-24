"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "./AuthProvider";
import { displayNameFor } from "@/lib/profile";

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

function personalizedHeadlines(firstName: string): string[] {
  return [
    `Cheap wheels are calling, ${firstName}.`,
    `${firstName}, your next ride is one search away.`,
    `Score a deal, ${firstName}.`,
    `${firstName}, skip the search - score the deal.`,
    `Less digging, more driving, ${firstName}.`,
    `Welcome back, ${firstName} - let's find you a ride.`,
    `${firstName}, cheap wheels ahead.`,
  ];
}

const LOADING_TEXT = "Finding you the best deal...";
const TYPE_INTERVAL_MS = 70;

export default function HeroHeadline() {
  const { user, profile, loading, configured } = useAuth();
  const [headline, setHeadline] = useState(HEADLINES[0]);
  // Picks exactly once, after auth has had a chance to resolve - keeps the
  // headline from re-randomizing on every unrelated re-render, and from
  // picking a "signed out" one a beat before the signed-in state arrives.
  const pickedRef = useRef(false);

  // Swaps the headline out for a typed-out "searching" line the moment a
  // search is submitted - the globe is spinning behind it at the same
  // instant, so this reads as one "working on it" cue rather than two.
  const [isSearching, setIsSearching] = useState(false);
  const [typedLength, setTypedLength] = useState(0);

  useEffect(() => {
    if (pickedRef.current) return;
    if (configured && loading) return;
    pickedRef.current = true;

    const rawName = user ? displayNameFor(user, profile).trim().split(/\s+/)[0] : "";
    const firstName = rawName ? rawName[0].toUpperCase() + rawName.slice(1) : "";
    const pool = firstName ? personalizedHeadlines(firstName) : HEADLINES;
    // Randomize only after hydration: the server always renders HEADLINES[0]
    // so client and server markup match on the first paint.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHeadline(pool[Math.floor(Math.random() * pool.length)]);
  }, [configured, loading, user, profile]);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    function onSearchLoading() {
      setIsSearching(true);
      // Reduced motion still gets the updated heading, just not animated
      // letter-by-letter.
      setTypedLength(prefersReducedMotion ? LOADING_TEXT.length : 0);
    }
    window.addEventListener("trydrive:search-loading", onSearchLoading);
    return () => window.removeEventListener("trydrive:search-loading", onSearchLoading);
  }, []);

  useEffect(() => {
    if (!isSearching || typedLength >= LOADING_TEXT.length) return;
    const timer = setTimeout(() => setTypedLength((n) => n + 1), TYPE_INTERVAL_MS);
    return () => clearTimeout(timer);
  }, [isSearching, typedLength]);

  return (
    <h1
      aria-live={isSearching ? "polite" : undefined}
      className="text-4xl font-semibold tracking-tight text-slate-900 dark:text-neutral-100 sm:text-5xl"
    >
      {isSearching ? (
        <>
          {LOADING_TEXT.slice(0, typedLength)}
          <span aria-hidden="true" className="animate-pulse">
            |
          </span>
        </>
      ) : (
        headline
      )}
    </h1>
  );
}
