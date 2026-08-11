import Link from "next/link";
import AnimatedLogo from "@/components/AnimatedLogo";

export default function SiteHeader() {
  return (
    <header className="fixed top-0 left-0 z-20 px-6 py-6">
      <Link
        href="/"
        className="flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-900"
      >
        TryDrive
        <AnimatedLogo />
      </Link>
    </header>
  );
}
