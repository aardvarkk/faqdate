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

  // 1699989837736
  it("treats millisecond timestamps from November 2023 as absolute", () => {
    const entry = toEntry("1699989837736", 1);

    expect(entry.parsed?.isValid).toBe(true);
    expect(entry.parsed?.toMillis()).toBe(1699989837736);
    expect(entry.moment).toBe(true);
  });

  // 2023-11-11 09:17:13
  it("treats SQL timestamps without a timezone as local wall time", () => {
    const entry = toEntry("2023-11-11 09:17:13", 1);

    expect(entry.parsed?.isValid).toBe(true);
    expect(entry.parsed?.toFormat("yyyy-MM-dd HH:mm:ss")).toBe(
      "2023-11-11 09:17:13"
    );
    expect(entry.moment).toBe(false);
  });

  // 2023-11-14 19:51:50
  it("treats later SQL timestamps without a timezone as local wall time", () => {
    const entry = toEntry("2023-11-14 19:51:50", 1);

    expect(entry.parsed?.isValid).toBe(true);
    expect(entry.parsed?.toFormat("yyyy-MM-dd HH:mm:ss")).toBe(
      "2023-11-14 19:51:50"
    );
    expect(entry.moment).toBe(false);
  });

  it("does not treat dates with a time but no timezone as absolute moments", () => {
    const entry = toEntry("Feb 14 2025 2:17 PM", 1);

    expect(entry.parsed?.isValid).toBe(true);
    expect(entry.moment).toBe(false);
  });
});
