import type { Metadata } from "next";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import SkyBackground from "@/components/SkyBackground";
import MyCars from "@/components/MyCars";

export const metadata: Metadata = {
  title: "Your cars — TryDrive",
  robots: { index: false, follow: false },
};

export default function MyCarsPage() {
  return (
    <div className="flex-1">
      <SkyBackground />
      <SiteHeader />

      <main className="mx-auto max-w-4xl px-6 pt-4 pb-24">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Your cars
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Every booking you&apos;ve made through TryDrive.
        </p>

        <MyCars />
      </main>

      <SiteFooter />
    </div>
  );
}
