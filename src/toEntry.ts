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

// Matches clock times like "2:17 PM", "09:17", or "19:51:50".
function hasClockTime(text: string) {
  return /\b\d{1,2}:\d{2}(?::\d{2})?(?:\s?[AP]M)?\b/i.test(text);
}

// Matches explicit timezone markers like "UTC", "GMT-0700", "-08:00", or "PDT".
function hasExplicitTimezone(text: string) {
  return /\b(?:UTC|GMT)(?:[+-]\d{1,2}(?::?\d{2})?)?\b|[+-]\d{2}:?\d{2}\b|\b(?!AM\b|PM\b)[A-Z]{2,4}\b/.test(
    text
  );
}

function fromCustomFormat(text: string) {
  const formats = [
    "yyyy-MM-dd ha",
    "yyyy-MM-dd h a",
    "ha yyyy-MM-dd",
    "h a yyyy-MM-dd",
  ];

  for (const format of formats) {
    const parsed = DateTime.fromFormat(text, format);
    if (parsed.isValid) {
      return parsed;
    }
  }

  return undefined;
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
    const fromCustom = fromCustomFormat(text);
    const fromDate = new Date(text);

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
    } else if (fromCustom?.isValid) {
      return {
        line,
        text,
        parsed: fromCustom,
        moment: false,
      };
    } else if (fromDate.toString() !== "Invalid Date") {
      return {
        line,
        text,
        parsed: DateTime.fromJSDate(fromDate),
        moment: !hasClockTime(text) || hasExplicitTimezone(text),
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
