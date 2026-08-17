import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="fixed bottom-0 left-0 z-20 w-full px-6 py-3 text-center sm:text-left">
      <p className="text-[11px] text-slate-400">
        <Link href="/privacy" className="hover:text-slate-600">
          Privacy Policy
        </Link>
        <span className="mx-1.5">·</span>
        <Link href="/terms" className="hover:text-slate-600">
          Terms of Service
        </Link>
      </p>
    </footer>
  );
}
