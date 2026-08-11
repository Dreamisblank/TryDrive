export default function SkyBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden bg-gradient-to-b from-orange-50 via-white to-white">
      <div className="absolute -top-24 left-[8%] h-72 w-72 rounded-full bg-orange-200/70 blur-3xl" />
      <div className="absolute top-10 right-[12%] h-96 w-96 rounded-full bg-orange-400/50 blur-3xl" />
      <div className="absolute top-40 left-[30%] h-64 w-[36rem] rounded-full bg-orange-100 blur-3xl" />
      <div className="absolute top-64 right-[5%] h-56 w-80 rounded-full bg-orange-300/40 blur-3xl" />
      <div className="absolute top-72 left-[-5%] h-72 w-72 rounded-full bg-orange-500/30 blur-3xl" />
    </div>
  );
}
