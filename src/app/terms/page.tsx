import Link from "next/link";
import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import SkyBackground from "@/components/SkyBackground";

export const metadata: Metadata = {
  title: "Terms of Service — TryDrive",
  description: "The terms that govern your use of TryDrive.",
};

function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mt-8 text-lg font-semibold text-slate-900">{children}</h2>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="mt-3 leading-relaxed text-slate-600">{children}</p>;
}

function UL({ children }: { children: React.ReactNode }) {
  return (
    <ul className="mt-3 list-disc space-y-1.5 pl-5 leading-relaxed text-slate-600">
      {children}
    </ul>
  );
}

export default function TermsOfServicePage() {
  return (
    <div className="flex-1">
      <SkyBackground />
      <SiteHeader />

      <main className="mx-auto max-w-3xl px-6 pt-28 pb-24">
        <Link
          href="/"
          className="text-sm font-medium text-orange-700 hover:text-orange-800"
        >
          ← Back to TryDrive
        </Link>

        <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900">
          Terms of Service
        </h1>
        <p className="mt-2 text-sm text-slate-500">Last updated: 17/08/2026</p>

        <H2>1. About TryDrive</H2>
        <P>
          TryDrive (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) is
          operated by Refine Labs Ltd, a company registered in England and
          Wales. TryDrive is a car rental search and comparison service. We
          do not own, operate, manage, or control any vehicles, rental
          fleets, or rental locations.
        </P>

        <H2>2. What TryDrive Does</H2>
        <P>
          TryDrive allows users to search for car rental options based on
          location, dates, and driver age, and displays results sourced from
          third-party car rental companies and platforms
          (&ldquo;Partners&rdquo;). When you select a result, you will be
          directed to a Partner&apos;s website or platform to view full
          pricing, terms, and to complete any booking.
        </P>
        <P>
          TryDrive does not process bookings, take payments, or act as a
          party to any rental agreement. All bookings are made directly
          between you and the relevant Partner, subject to that
          Partner&apos;s own terms and conditions.
        </P>

        <H2>3. No Guarantee of Pricing or Availability</H2>
        <P>
          We make reasonable efforts to display accurate and up-to-date
          information, but:
        </P>
        <UL>
          <li>
            We do not guarantee that results shown are the lowest price
            available, the best value, or a complete representation of every
            car rental option available at your search location.
          </li>
          <li>
            Prices, availability, and vehicle details are supplied by third
            parties and may change, be inaccurate, or become unavailable
            without notice.
          </li>
          <li>
            We do not independently verify pricing, insurance terms, vehicle
            condition, or the accuracy of any Partner&apos;s listing.
          </li>
          <li>
            Any comparison, ranking, or filtering shown (including by price,
            insurance, or vehicle category) reflects the data available to
            us at the time of your search and should not be relied upon as
            exhaustive or definitive.
          </li>
        </UL>
        <P>
          You are responsible for reviewing full terms, pricing, and
          insurance details on the Partner&apos;s own site before booking.
        </P>

        <H2>4. Affiliate Relationships and How We Make Money</H2>
        <P>
          TryDrive participates in affiliate and referral partnerships with
          car rental companies and booking platforms. We may earn a
          commission when you click through to, or complete a booking with,
          a Partner via our site. This does not affect the price you pay.
          Our commercial relationships with Partners may influence which
          options are displayed or how they are ordered.
        </P>

        <H2>5. Driver Age and Eligibility</H2>
        <P>
          Minimum driver age, young-driver surcharges, and eligibility
          requirements are set entirely by the rental company you book with,
          not by TryDrive. Information shown about driver age is provided as
          a guide only. You must confirm eligibility, required
          documentation, and any surcharges directly with the Partner before
          booking.
        </P>

        <H2>6. No Liability for Third-Party Bookings</H2>
        <P>
          To the fullest extent permitted by law, we accept no liability
          for:
        </P>
        <UL>
          <li>
            Any loss, cost, or damage arising from a booking made with a
            Partner, including cancellations, disputes, vehicle condition,
            insurance claims, or customer service issues.
          </li>
          <li>
            Inaccurate, outdated, or misleading information supplied by a
            Partner and displayed on our site.
          </li>
          <li>Any acts, omissions, or terms of any third-party rental company.</li>
        </UL>
        <P>
          Any complaint or claim regarding a specific rental must be directed
          to the rental company or platform you booked with.
        </P>

        <H2>7. Use of the Site</H2>
        <P>
          You agree not to misuse TryDrive, including by attempting to
          scrape, reverse-engineer, or interfere with the site&apos;s
          operation, or by submitting false information in a search.
        </P>

        <H2>8. Limitation of Liability</H2>
        <P>
          To the fullest extent permitted by law, TryDrive and Refine Labs
          Ltd shall not be liable for any indirect, incidental, or
          consequential loss arising from your use of the site. Our total
          liability for any claim arising from your use of TryDrive is
          limited to £100.
        </P>

        <H2>9. Changes to These Terms</H2>
        <P>
          We may update these Terms from time to time. Continued use of the
          site after changes are posted constitutes acceptance of the
          updated Terms.
        </P>

        <H2>10. Governing Law</H2>
        <P>
          These Terms are governed by the laws of England and Wales. Any
          disputes shall be subject to the exclusive jurisdiction of the
          courts of England and Wales.
        </P>

        <H2>11. Contact</H2>
        <P>
          For questions about these Terms, contact:{" "}
          <a
            href="mailto:help@trydrive.co.uk"
            className="text-orange-700 hover:text-orange-800"
          >
            help@trydrive.co.uk
          </a>
        </P>
      </main>

      <SiteFooter />
    </div>
  );
}
