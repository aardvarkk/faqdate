import dayjs from "dayjs";
import { toDayjs } from "../src/toDayjs";

describe("toDayjs", () => {
  it("parses expected formats", async () => {
    expect(toDayjs("2022-10-15T22:09:36 America/Vancouver")).toEqual(
      dayjs.tz("2022-10-15T22:09:36", "America/Vancouver")
    );
    expect(toDayjs("2022-10-15T22:09:36 America/Toronto")).toEqual(
      dayjs.tz("2022-10-15T22:09:36", "America/Toronto")
    );
    expect(toDayjs("2022-10-16T04:34:59.123Z")).toEqual(
      dayjs("2022-10-16T04:34:59.123Z")
    );
    expect(toDayjs("2022-10-15T22:09:36-07:00")).toEqual(
      dayjs("2022-10-16T05:09:36Z")
    );
    expect(toDayjs("Sat 15 Oct 2022 21:21:29 PDT")).toEqual(
      dayjs("2022-10-16T04:21:29.000Z")
    );
    expect(toDayjs("1665894899123")).toEqual(dayjs("2022-10-16T04:34:59.123Z"));
    expect(toDayjs("1665894899")).toEqual(dayjs("2022-10-16T04:34:59.000Z"));
  });
});
