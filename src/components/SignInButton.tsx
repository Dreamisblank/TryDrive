"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";

function initialFor(email: string | undefined, phone: string | undefined) {
  if (email) return email[0]!.toUpperCase();
  if (phone) return phone.replace(/\D/g, "").slice(-2, -1) || "#";
  return "?";
}

export default function SignInButton() {
  const { user, configured, openSignIn, signOut } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function onPointerDown(event: MouseEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [menuOpen]);

  // Until the Supabase keys are set there's nothing to sign in to, so keep the
  // header exactly as it was rather than showing a button that can't work.
  if (!configured) return null;

  if (!user) {
    return (
      <button
        type="button"
        onClick={() => openSignIn()}
        className="rounded-full bg-orange-600 px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-orange-700"
      >
        Sign in
      </button>
    );
  }

  const label = user.email ?? user.phone ?? "Account";

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setMenuOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-600 text-sm font-semibold text-white transition hover:bg-orange-700"
      >
        {initialFor(user.email, user.phone)}
      </button>

      {menuOpen && (
        <div
          role="menu"
          className="absolute right-0 z-40 mt-2 w-60 overflow-hidden rounded-2xl border border-orange-900/5 bg-white py-1.5 shadow-xl"
        >
          <p className="truncate px-4 py-2 text-xs text-slate-400">{label}</p>
          <button
            type="button"
            role="menuitem"
            onClick={async () => {
              setMenuOpen(false);
              await signOut();
              router.refresh();
            }}
            className="w-full px-4 py-2 text-left text-sm text-slate-700 transition hover:bg-orange-50"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
