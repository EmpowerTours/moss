/**
 * A test-only quarantine (for example a reserve whose address-book release is
 * still inside ADR 0007's age guard) expires on the wall clock, not on a diff
 * (#195). Once it expires, pull request CI skips the check with a note instead
 * of turning every unrelated pull request red. The scheduled
 * `quarantine-expiry` workflow sets `MOSS_QUARANTINE_EXPIRY=enforce`, where an
 * expired quarantine fails so maintainers vendor it.
 *
 * Call it outside the `MOSS_SKIP_E2E` live block: the scheduled run is offline.
 */
export interface Quarantine {
  readonly sourceId: string;
  readonly eligibleAfter: string;
}

export function expectQuarantineActive(
  context: { skip(note: string): void },
  { sourceId, eligibleAfter }: Quarantine,
  now: number = Date.now(),
): void {
  const expiry = Date.parse(eligibleAfter);
  if (Number.isNaN(expiry)) throw new Error(`${sourceId}: eligibleAfter is not a date`);
  if (now < expiry) return;
  const note = `${sourceId} cleared its quarantine at ${eligibleAfter}; vendor it and remove this quarantine`;
  if (process.env.MOSS_QUARANTINE_EXPIRY === "enforce") throw new Error(note);
  context.skip(note);
}
