import Link from "next/link";
import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import SkyBackground from "@/components/SkyBackground";

export const metadata: Metadata = {
  title: "Privacy Policy — TryDrive",
  description: "How TryDrive collects, uses, and protects your data.",
};

function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mt-8 text-lg font-semibold text-slate-900 dark:text-neutral-100">{children}</h2>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="mt-3 leading-relaxed text-slate-600 dark:text-neutral-300">{children}</p>;
}

function UL({ children }: { children: React.ReactNode }) {
  return (
    <ul className="mt-3 list-disc space-y-1.5 pl-5 leading-relaxed text-slate-600 dark:text-neutral-300">
      {children}
    </ul>
  );
}

export default function PrivacyPolicyPage() {
  return (
    <div className="flex-1">
      <SkyBackground />
      <SiteHeader />

      <main className="mx-auto max-w-3xl px-6 pt-4 pb-24">
        <Link
          href="/"
          className="text-sm font-medium text-orange-700 dark:text-orange-400 hover:text-orange-800 dark:hover:text-orange-300"
        >
          ← Back to TryDrive
        </Link>

        <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 dark:text-neutral-100">
          Privacy Policy
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-neutral-400">Last updated: 17/08/2026</p>

        <P>
          TryDrive is operated by Refine Labs Ltd (&ldquo;we&rdquo;,
          &ldquo;us&rdquo;, &ldquo;our&rdquo;). This policy explains what data
          we collect, why, and how it&apos;s handled.
        </P>

        <H2>1. What We Collect</H2>
        <P>When you use TryDrive, we may collect:</P>
        <UL>
          <li>
            <strong>Search data:</strong> pickup location, rental dates, and
            driver age entered into our search form.
          </li>
          <li>
            <strong>Usage data:</strong> pages visited, clicks, general
            device/browser information, and approximate location (via IP),
            collected through analytics tools.
          </li>
          <li>
            <strong>Cookies:</strong> used for basic site functionality and to
            track affiliate referrals when you click through to a Partner
            (see Section 4).
          </li>
        </UL>
        <P>
          We do not collect or store payment information, passport details,
          or driving licence details. All booking-related personal and
          payment data is collected directly by the third-party rental
          company or platform (&ldquo;Partner&rdquo;) you book with, subject
          to their own privacy policy.
        </P>

        <H2>2. How We Use Your Data</H2>
        <P>We use the information above to:</P>
        <UL>
          <li>Run your search and display relevant results.</li>
          <li>Understand how our site is used, to improve it.</li>
          <li>
            Track affiliate referrals so Partners can attribute bookings to
            TryDrive (this is how we earn commission — see our Terms of Use).
          </li>
        </UL>
        <P>We do not sell your personal data to third parties.</P>

        <H2>3. Legal Basis for Processing (UK GDPR)</H2>
        <P>Where applicable, we process your data on the basis of:</P>
        <UL>
          <li>
            <strong>Legitimate interests</strong> — to operate and improve
            the site, and to track affiliate referrals.
          </li>
          <li>
            <strong>Consent</strong> — for non-essential cookies and
            analytics, where required (see Section 5).
          </li>
        </UL>

        <H2>4. Sharing Your Data</H2>
        <P>We may share limited data with:</P>
        <UL>
          <li>
            <strong>Affiliate networks and Partners,</strong> to attribute a
            booking or click to TryDrive for commission purposes. This
            typically involves a referral ID and click timestamp, not
            personal details, unless you proceed to book directly with the
            Partner (at which point their own privacy policy applies).
          </li>
          <li>
            <strong>Analytics providers,</strong> to understand site usage.
          </li>
        </UL>
        <P>
          We do not share your data with third parties for their own
          independent marketing purposes.
        </P>

        <H2>5. Cookies</H2>
        <P>TryDrive uses cookies for:</P>
        <UL>
          <li>Essential site functionality.</li>
          <li>
            Affiliate tracking — so that a Partner can recognise a booking
            originated from TryDrive.
          </li>
          <li>Analytics — to understand how visitors use the site.</li>
        </UL>
        <P>
          You can control or disable cookies through your browser settings.
          Disabling cookies may affect site functionality, including our
          ability to track affiliate referrals correctly.
        </P>

        <H2>6. Third-Party Sites</H2>
        <P>
          TryDrive links out to third-party rental companies and booking
          platforms. Once you leave our site, your data is subject to that
          third party&apos;s own privacy policy, not this one. We encourage
          you to review their policy before booking or submitting personal
          information.
        </P>

        <H2>7. Data Retention</H2>
        <P>
          We retain search and usage data only as long as necessary for the
          purposes described above, or as required by law.
        </P>

        <H2>8. Your Rights (UK GDPR)</H2>
        <P>If you are in the UK or EU, you have the right to:</P>
        <UL>
          <li>Request access to the personal data we hold about you.</li>
          <li>Request correction or deletion of your data.</li>
          <li>Object to or restrict certain processing.</li>
          <li>
            Withdraw consent at any time, where processing is based on
            consent.
          </li>
        </UL>
        <P>
          To exercise these rights, contact us at{" "}
          <a
            href="mailto:help@trydrive.co.uk"
            className="text-orange-700 dark:text-orange-400 hover:text-orange-800 dark:hover:text-orange-300"
          >
            help@trydrive.co.uk
          </a>
          . You also have the right to complain to the UK Information
          Commissioner&apos;s Office (ICO) at{" "}
          <a
            href="https://ico.org.uk"
            className="text-orange-700 dark:text-orange-400 hover:text-orange-800 dark:hover:text-orange-300"
          >
            ico.org.uk
          </a>
          .
        </P>

        <H2>9. Children&apos;s Privacy</H2>
        <P>
          TryDrive is not directed at children, and we do not knowingly
          collect data from anyone under 18.
        </P>

        <H2>10. Changes to This Policy</H2>
        <P>
          We may update this policy from time to time. Material changes will
          be reflected by an updated &ldquo;Last updated&rdquo; date above.
        </P>

        <H2>11. Contact</H2>
        <P>
          For any questions about this Privacy Policy or how your data is
          handled, contact:{" "}
          <a
            href="mailto:help@trydrive.co.uk"
            className="text-orange-700 dark:text-orange-400 hover:text-orange-800 dark:hover:text-orange-300"
          >
            help@trydrive.co.uk
          </a>
        </P>
        <P>Data Controller: Refine Labs Ltd</P>
      </main>

      <SiteFooter />
    </div>
  );
}
