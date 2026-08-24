import Link from "next/link";

export default function SiteHeader() {
  return (
    <header className="fixed top-0 left-0 z-20 p-6">
      <Link
        href="/"
        className="rounded-2xl bg-white/80 px-4 py-1.5 text-4xl font-bold tracking-tight text-slate-900 shadow-sm backdrop-blur-sm"
      >
        TryDrive
      </Link>
    </header>
  );
}
