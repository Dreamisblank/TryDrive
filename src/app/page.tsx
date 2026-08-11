import CarSearchForm from "@/components/CarSearchForm";
import HeroHeadline from "@/components/HeroHeadline";
import SiteHeader from "@/components/SiteHeader";
import SkyBackground from "@/components/SkyBackground";

export default function Home() {
  return (
    <div className="flex min-h-dvh flex-1 flex-col">
      <SkyBackground />
      <SiteHeader />

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center px-6 py-24 text-center">
        <HeroHeadline />
        <p className="mt-4 max-w-xl text-lg text-slate-600">
          The simplest way to compare cheap rental cars — pickup location,
          dates, and driver age. That&apos;s it.
        </p>

        <div className="mt-10 w-full">
          <CarSearchForm />
        </div>
      </main>
    </div>
  );
}
