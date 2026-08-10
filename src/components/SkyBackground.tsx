export default function SkyBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden bg-gradient-to-b from-[#eaf2ff] via-[#f4f8ff] to-white">
      <div className="absolute -top-24 left-[8%] h-72 w-72 rounded-full bg-white/70 blur-3xl" />
      <div className="absolute top-10 right-[12%] h-96 w-96 rounded-full bg-[#dbe7ff] blur-3xl" />
      <div className="absolute top-40 left-[30%] h-64 w-[36rem] rounded-full bg-white/80 blur-3xl" />
      <div className="absolute top-64 right-[5%] h-56 w-80 rounded-full bg-[#e6edff] blur-3xl" />
      <div className="absolute top-72 left-[-5%] h-72 w-72 rounded-full bg-[#c9dcff]/60 blur-3xl" />
    </div>
  );
}
