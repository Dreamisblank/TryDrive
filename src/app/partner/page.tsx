import Link from "next/link";
import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import SkyBackground from "@/components/SkyBackground";

export const metadata: Metadata = {
  title: "Partner with us — TryDrive",
  description:
    "List your rental fleet on TryDrive and reach travellers who are actively comparing prices and ready to book.",
};

export default function PartnerPage() {
  return (
    <div className="flex-1">
      <SkyBackground />
      <SiteHeader />

      <main className="mx-auto max-w-4xl px-6 pt-4 pb-24 text-center">
        <Link
          href="/"
          className="text-sm font-medium text-orange-700 hover:text-orange-800"
        >
          ← Back to TryDrive
        </Link>

        <h1 className="mt-8 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          Partner with us
        </h1>

        <p className="mt-6 leading-relaxed text-slate-600">
          TryDrive connects car rental companies with travellers who are
          already comparing prices for specific dates and locations, ready to
          book. Listing your fleet with us is a simple way to pick up extra
          reservations without running your own marketing.
        </p>

        <p className="mt-4 leading-relaxed text-slate-600">
          We only earn when you get a booking, which keeps our incentives
          lined up with yours.
        </p>

        <div className="mt-10 rounded-3xl border border-orange-900/5 bg-white/90 p-8 shadow-sm">
          <p className="text-sm font-medium text-slate-500">
            Get in contact
          </p>
          <a
            href="mailto:help@trydrive.co.uk"
            className="mt-3 inline-block rounded-full bg-orange-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-700"
          >
            help@trydrive.co.uk
          </a>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
