import { toEntry } from "../src/toEntry";

describe("toEntry", () => {
  // Mon Oct 17 2022 22:46:14 GMT-0700 (Pacific Daylight Saving Time)
  it("treats a JavaScript date string with an explicit timezone as absolute", () => {
    const entry = toEntry(
      "Mon Oct 17 2022 22:46:14 GMT-0700 (Pacific Daylight Saving Time)",
      1
    );

    expect(entry.parsed?.isValid).toBe(true);
    expect(entry.parsed?.toMillis()).toBe(1666071974000);
    expect(entry.moment).toBe(true);
  });

  // 1666072010828
  it("treats millisecond timestamps as absolute", () => {
    const entry = toEntry("1666072010828", 1);

    expect(entry.parsed?.isValid).toBe(true);
    expect(entry.parsed?.toMillis()).toBe(1666072010828);
    expect(entry.moment).toBe(true);
  });

  // 1666072010
  it("treats second timestamps as absolute", () => {
    const entry = toEntry("1666072010", 1);

    expect(entry.parsed?.isValid).toBe(true);
    expect(entry.parsed?.toMillis()).toBe(1666072010000);
    expect(entry.moment).toBe(true);
  });

  it("does not treat dates with a time but no timezone as absolute moments", () => {
    const entry = toEntry("Feb 14 2025 2:17 PM", 1);

    expect(entry.parsed?.isValid).toBe(true);
    expect(entry.moment).toBe(false);
  });
});
