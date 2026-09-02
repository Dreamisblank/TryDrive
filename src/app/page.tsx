import AtomicGlobeLoader from "@/components/AtomicGlobeLoader";
import CarSearchForm from "@/components/CarSearchForm";
import HeroHeadline from "@/components/HeroHeadline";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import SkyBackground from "@/components/SkyBackground";

export default function Home() {
  return (
    <div className="flex min-h-dvh flex-1 flex-col">
      <SkyBackground />
      <AtomicGlobeLoader />
      <SiteHeader />

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center px-6 py-24 text-center">
        <HeroHeadline />

        <div className="mt-10 w-full">
          <CarSearchForm />
        </div>
        <p className="mt-3 text-xs text-slate-500 dark:text-neutral-400">
          Demo mode — results limited to Larnaca, Cyprus
        </p>
      </main>

      <SiteFooter />
    </div>
  );
}
