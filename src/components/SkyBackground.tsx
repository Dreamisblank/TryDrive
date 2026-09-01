// The gradient stack lives in globals.css (.sky-background) rather than an
// inline style so it can have a dark-mode variant — inline styles can't be
// targeted by the .dark class.
export default function SkyBackground() {
  return <div className="sky-background pointer-events-none fixed inset-0 -z-10" />;
}
