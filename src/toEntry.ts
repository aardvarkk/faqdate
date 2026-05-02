import { DateTime, DateTimeOptions } from "luxon";

export type ParsedDateTime = DateTime & {
  comment?: string;
};

export type Entry = {
  line: number;
  raw: string;
  text: string;
  parsed: ParsedDateTime | undefined;
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

function extractComment(raw: string) {
  const matches = [...raw.matchAll(/(^|\s)(#|\/\/|--|;)(?=\s|$)/g)];
  if (matches.length === 0) {
    return {
      text: raw.trim(),
      comment: undefined,
    };
  }

  const match = matches[0];
  const markerIdx = match.index! + match[1].length;
  const text = raw.slice(0, markerIdx).trim();
  const comment = raw.slice(markerIdx + match[2].length).trim();
  return {
    text,
    comment: comment.length > 0 ? comment : undefined,
  };
}

function withComment(parsed: DateTime, comment: string | undefined) {
  return Object.assign(parsed, { comment }) as ParsedDateTime;
}

export function toEntry(raw: string, line: number): Entry {
  const { text, comment } = extractComment(raw);

  const isNumber = /^\d+([.,]\d*)?$/.test(text);

  // Number
  if (isNumber) {
    const number = parseFloat(text);
    const whole = Math.floor(number);

    // Milliseconds
    if (whole.toString().length >= 13) {
      return {
        line,
        raw,
        text,
        parsed: withComment(DateTime.fromMillis(number), comment),
        moment: true,
      };
    }
    // Seconds
    else {
      return {
        line,
        raw,
        text,
        parsed: withComment(DateTime.fromSeconds(number), comment),
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
        raw,
        text,
        parsed: withComment(fromISO, comment),
        moment: isMoment(DateTime.fromISO, text),
      };
    } else if (fromHTTP.isValid) {
      return {
        line,
        raw,
        text,
        parsed: withComment(fromHTTP, comment),
        moment: isMoment(DateTime.fromHTTP, text),
      };
    } else if (fromRFC2822.isValid) {
      return {
        line,
        raw,
        text,
        parsed: withComment(fromRFC2822, comment),
        moment: isMoment(DateTime.fromRFC2822, text),
      };
    } else if (fromSQL.isValid) {
      return {
        line,
        raw,
        text,
        parsed: withComment(fromSQL, comment),
        moment: isMoment(DateTime.fromSQL, text),
      };
    } else if (fromCustom?.isValid) {
      return {
        line,
        raw,
        text,
        parsed: withComment(fromCustom, comment),
        moment: false,
      };
    } else if (fromDate.toString() !== "Invalid Date") {
      return {
        line,
        raw,
        text,
        parsed: withComment(DateTime.fromJSDate(fromDate), comment),
        moment: !hasClockTime(text) || hasExplicitTimezone(text),
      };
    } else {
      return {
        line,
        raw,
        text,
        parsed: undefined,
        moment: false,
      };
    }
  }
}
