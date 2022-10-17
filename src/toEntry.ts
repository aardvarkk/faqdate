import { DateTime } from "luxon";

export type Entry = {
  text: string;
  parsed: DateTime | undefined;
  moment: boolean; // True if it's an "absolute" time, false if it depends on offset/timezone
};

export function toEntry(raw: string): Entry | undefined {
  const text = raw.trim();

  const isNumber = /^\d+([.,]\d*)?$/.test(text);

  // Number
  if (isNumber) {
    const number = parseFloat(text);
    const whole = Math.floor(number);

    // Milliseconds
    if (whole.toString().length >= 13) {
      return {
        text,
        parsed: DateTime.fromMillis(number),
        moment: true,
      };
    }
    // Seconds
    else {
      return {
        text,
        parsed: DateTime.fromSeconds(number),
        moment: true,
      };
    }
  } else {
    const fromHTTP = DateTime.fromHTTP(text);
    const fromISO = DateTime.fromISO(text);
    const fromRFC2822 = DateTime.fromRFC2822(text);
    const fromSQL = DateTime.fromSQL(text);

    if (fromISO.isValid) {
      const a = DateTime.fromISO(text, {
        zone: "Etc/UTC",
        setZone: true,
      });
      const b = DateTime.fromISO(text, {
        zone: "Etc/UTC+1",
        setZone: true,
      });
      return {
        text,
        parsed: fromISO,
        moment: a.toMillis() === b.toMillis(),
      };
    } else {
      return {
        text,
        parsed: undefined,
        moment: false,
      };
    }
  }
}
