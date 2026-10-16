import { afterEach, describe, expect, it, vi } from "vitest";
import { expectQuarantineActive } from "./quarantine.js";

const QUARANTINE = { sourceId: "PT_EXAMPLE", eligibleAfter: "2026-10-16T00:00:00.000Z" } as const;
const EXPIRY = Date.parse(QUARANTINE.eligibleAfter);
const NOTE =
  "PT_EXAMPLE cleared its quarantine at 2026-10-16T00:00:00.000Z; vendor it and remove this quarantine";

function recorder() {
  const notes: string[] = [];
  return { notes, context: { skip: (note: string) => void notes.push(note) } };
}

describe("expectQuarantineActive", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  for (const mode of [undefined, "enforce"]) {
    it(`passes before eligibleAfter (MOSS_QUARANTINE_EXPIRY=${mode ?? "unset"})`, () => {
      vi.stubEnv("MOSS_QUARANTINE_EXPIRY", mode);
      const { notes, context } = recorder();
      expectQuarantineActive(context, QUARANTINE, EXPIRY - 1);
      expect(notes).toEqual([]);
    });
  }

  for (const mode of [undefined, "", "warn"]) {
    it(`skips with a note once expired (MOSS_QUARANTINE_EXPIRY=${mode ?? "unset"})`, () => {
      vi.stubEnv("MOSS_QUARANTINE_EXPIRY", mode);
      const { notes, context } = recorder();
      expectQuarantineActive(context, QUARANTINE, EXPIRY);
      expect(notes).toEqual([NOTE]);
    });
  }

  it("fails once expired under MOSS_QUARANTINE_EXPIRY=enforce", () => {
    vi.stubEnv("MOSS_QUARANTINE_EXPIRY", "enforce");
    const { notes, context } = recorder();
    expect(() => expectQuarantineActive(context, QUARANTINE, EXPIRY)).toThrow(NOTE);
    expect(notes).toEqual([]);
  });

  for (const mode of [undefined, "enforce"]) {
    it(`rejects an unparseable eligibleAfter (MOSS_QUARANTINE_EXPIRY=${mode ?? "unset"})`, () => {
      vi.stubEnv("MOSS_QUARANTINE_EXPIRY", mode);
      const { context } = recorder();
      expect(() =>
        expectQuarantineActive(context, { sourceId: "BAD", eligibleAfter: "soon" }, 0),
      ).toThrow("BAD: eligibleAfter is not a date");
    });
  }

  it("accepts the vitest test context", (context) => {
    expectQuarantineActive(context, QUARANTINE, EXPIRY - 1);
  });
});
