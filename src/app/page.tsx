import CarSearchForm from "@/components/CarSearchForm";
import SiteHeader from "@/components/SiteHeader";
import SkyBackground from "@/components/SkyBackground";

export default function Home() {
  return (
    <div className="relative flex-1">
      <SkyBackground />
      <SiteHeader />

      <main className="mx-auto flex max-w-6xl flex-col items-center px-6 pt-20 pb-24 text-center sm:pt-28">
        <h1 className="text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
          Your next ride, ready when you land.
        </h1>
        <p className="mt-4 max-w-xl text-lg text-slate-600">
          Search rental cars by pickup location, dates, and driver age to see
          available options and pricing.
        </p>

        <div className="mt-10 w-full">
          <CarSearchForm />
        </div>
      </main>
    </div>
  );
}
