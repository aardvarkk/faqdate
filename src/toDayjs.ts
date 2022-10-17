import dayjs, { Dayjs } from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

declare namespace Intl {
  type Key =
    | "calendar"
    | "collation"
    | "currency"
    | "numberingSystem"
    | "timeZone"
    | "unit";
  function supportedValuesOf(input: Key): string[];
}

const TIMEZONES = Intl.supportedValuesOf("timeZone");

export function toDayjs(raw: string): Dayjs | undefined {
  const text = raw.trim();
  const isNumber = /^\d+([.,]\d*)?$/.test(text);

  // Number
  if (isNumber) {
    const number = parseFloat(text);
    const whole = Math.floor(number);

    // Milliseconds
    if (whole.toString().length >= 13) {
      return dayjs(number);
    }
    // Seconds
    else {
      return dayjs.unix(number);
    }
  }
  // String
  else {
    const parsed = dayjs(text);

    // Parsed without assistance
    if (parsed.isValid()) {
      console.log(dayjs.tz(text, "UTC").toISOString());
      console.log(dayjs.tz(text, "Etc/GMT+1").toISOString());
      return parsed;
    }
    // Check for a timezone as a fallback
    else {
      for (const tz of TIMEZONES) {
        if (text.includes(tz)) {
          const withoutTz = text.replace(tz, "").trim();
          return dayjs.tz(withoutTz, tz);
        }
      }
    }
  }
}
