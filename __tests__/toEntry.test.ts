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

  // 2026-05-01 3PM
  it("treats date strings with a meridiem time and no timezone as local wall time", () => {
    const entry = toEntry("2026-05-01 3PM", 1);

    expect(entry.parsed?.isValid).toBe(true);
    expect(entry.parsed?.toFormat("yyyy-MM-dd HH:mm:ss")).toBe(
      "2026-05-01 15:00:00"
    );
    expect(entry.moment).toBe(false);
  });

  // 3PM 2026-05-01
  it("treats swapped date and meridiem time strings as local wall time", () => {
    const entry = toEntry("3PM 2026-05-01", 1);

    expect(entry.parsed?.isValid).toBe(true);
    expect(entry.parsed?.toFormat("yyyy-MM-dd HH:mm:ss")).toBe(
      "2026-05-01 15:00:00"
    );
    expect(entry.moment).toBe(false);
  });

  // 2021-01-01 # Happy New Year's!
  it("stores hash comments on parsed datetimes", () => {
    const entry = toEntry("2021-01-01 # Happy New Year's!", 1);

    expect(entry.text).toBe("2021-01-01");
    expect(entry.parsed?.isValid).toBe(true);
    expect(entry.parsed?.comment).toBe("Happy New Year's!");
  });

  // 2021-01-01 // New Year's Day
  it("stores slash comments on parsed datetimes", () => {
    const entry = toEntry("2021-01-01 // New Year's Day", 1);

    expect(entry.text).toBe("2021-01-01");
    expect(entry.parsed?.isValid).toBe(true);
    expect(entry.parsed?.comment).toBe("New Year's Day");
  });

  // 2023-11-11 09:17:13 -- morning handoff
  it("stores sql-style comments on parsed datetimes", () => {
    const entry = toEntry("2023-11-11 09:17:13 -- morning handoff", 1);

    expect(entry.text).toBe("2023-11-11 09:17:13");
    expect(entry.parsed?.isValid).toBe(true);
    expect(entry.parsed?.comment).toBe("morning handoff");
    expect(entry.moment).toBe(false);
  });

  // 1666072010 ; release cutover
  it("stores semicolon comments on parsed datetimes", () => {
    const entry = toEntry("1666072010 ; release cutover", 1);

    expect(entry.text).toBe("1666072010");
    expect(entry.parsed?.isValid).toBe(true);
    expect(entry.parsed?.comment).toBe("release cutover");
    expect(entry.moment).toBe(true);
  });

  it("does not treat dates with a time but no timezone as absolute moments", () => {
    const entry = toEntry("Feb 14 2025 2:17 PM", 1);

    expect(entry.parsed?.isValid).toBe(true);
    expect(entry.moment).toBe(false);
  });
});
