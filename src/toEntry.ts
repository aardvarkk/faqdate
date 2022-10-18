import { DateTime, DateTimeOptions } from "luxon";

export type Entry = {
  line: number;
  text: string;
  parsed: DateTime | undefined;
  moment: boolean; // True if it's an "absolute" time, false if it depends on offset/timezone
};

function isMoment(
  parseFn: (text: string, opts: DateTimeOptions) => DateTime,
  text: string
) {
  const a = parseFn(text, {
    zone: "Etc/UTC",
    setZone: true,
  });
  const b = parseFn(text, {
    zone: "Etc/UTC+1",
    setZone: true,
  });
  return a.toMillis() === b.toMillis();
}

export function toEntry(raw: string, line: number): Entry {
  const text = raw.trim();

  const isNumber = /^\d+([.,]\d*)?$/.test(text);

  // Number
  if (isNumber) {
    const number = parseFloat(text);
    const whole = Math.floor(number);

    // Milliseconds
    if (whole.toString().length >= 13) {
      return {
        line,
        text,
        parsed: DateTime.fromMillis(number),
        moment: true,
      };
    }
    // Seconds
    else {
      return {
        line,
        text,
        parsed: DateTime.fromSeconds(number),
        moment: true,
      };
    }
  }
  // String
  else {
    const fromHTTP = DateTime.fromHTTP(text);
    const fromISO = DateTime.fromISO(text);
    const fromRFC2822 = DateTime.fromRFC2822(text);
    const fromSQL = DateTime.fromSQL(text);

    if (fromISO.isValid) {
      return {
        line,
        text,
        parsed: fromISO,
        moment: isMoment(DateTime.fromISO, text),
      };
    } else if (fromHTTP.isValid) {
      return {
        line,
        text,
        parsed: fromHTTP,
        moment: isMoment(DateTime.fromHTTP, text),
      };
    } else if (fromRFC2822.isValid) {
      return {
        line,
        text,
        parsed: fromRFC2822,
        moment: isMoment(DateTime.fromRFC2822, text),
      };
    } else if (fromSQL.isValid) {
      return {
        line,
        text,
        parsed: fromSQL,
        moment: isMoment(DateTime.fromSQL, text),
      };
    } else {
      return {
        line,
        text,
        parsed: undefined,
        moment: false,
      };
    }
  }
}
