/** "£1248", or "£31–£196" when the rental company quotes a range - showing
 *  only the lower figure would understate the hold. */
export function formatDeposit(min: number, max: number | null, symbol: string): string {
  const highest = max ?? min;
  return highest > min
    ? `${symbol}${Math.round(min)}–${symbol}${Math.round(highest)}`
    : `${symbol}${Math.round(min)}`;
}

/** True only when the offer quotes a deposit of zero across its range. */
export function hasNoDeposit(min: number | null, max: number | null): boolean {
  return min !== null && (max ?? min) === 0;
}
