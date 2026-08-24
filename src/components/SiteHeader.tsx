import Link from "next/link";

export default function SiteHeader() {
  return (
    <header className="fixed top-0 left-0 z-20 px-6 py-6">
      <Link
        href="/"
        className="text-4xl font-bold tracking-tight text-slate-900"
      >
        TryDrive
      </Link>
    </header>
  );
}
