/**
 * The API only returns each car photo at 140px wide, which looks soft on
 * high-DPI screens at the sizes the results page shows. Discover Cars serves
 * the same `/images/car/<id>/<width>.png` photo at other fixed widths - 200
 * and 270 were confirmed to exist for every car in a live search. An
 * unsupported width returns a generic grey silhouette (not an error, so an
 * onError fallback can't catch it), hence only these known widths are
 * offered. Other URL shapes the API returns are left untouched.
 */
export function carImageAt(url: string | null, width: 200 | 270): string | null {
  if (!url) return null;
  return url.replace(/(\/images\/car\/\d+\/)140\.png$/, `$1${width}.png`);
}
