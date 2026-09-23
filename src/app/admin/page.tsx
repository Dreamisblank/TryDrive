import type { Metadata } from "next";
import AdminSignOutButton from "@/components/AdminSignOutButton";

export const metadata: Metadata = {
  title: "Admin — TryDrive",
  robots: { index: false, follow: false },
};

export default function AdminDashboardPage() {
  return (
    <div className="min-h-dvh bg-slate-950 text-slate-100">
      <header className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
        <h1 className="text-base font-semibold">TryDrive Admin</h1>
        <AdminSignOutButton />
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/50 p-10 text-center text-slate-500">
          No search or booking provider is connected yet - there&apos;s
          nothing to show here until one is wired in.
        </div>
      </main>
    </div>
  );
}
