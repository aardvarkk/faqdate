import { DateTime } from "luxon";
import { toEntry } from "../src/toEntry";

describe("toDateTime", () => {
  it("parses expected formats", async () => {
    // expect(toDateTime("2022-10-15T22:09:36-07:00").toMillis()).toEqual(
    //   "2022-10-16T05:09:36.000Z"
    // );
    // expect(toDateTime("2022-10-16T04:34:59.123Z").toMillis()).toEqual(
    //   "2022-10-16T04:34:59.123Z"
    // );
    // expect(toDateTime("2022-10-15T22:09:36-07:00")).toEqual(
    //   dayjs("2022-10-16T05:09:36Z")
    // );
    // expect(toDateTime("Sat 15 Oct 2022 21:21:29 PDT")).toEqual(
    //   dayjs("2022-10-16T04:21:29.000Z")
    // );
    // expect(toDateTime("1665894899123")).toEqual(
    //   dayjs("2022-10-16T04:34:59.123Z")
    // );
    // expect(toDateTime("1665894899")).toEqual(dayjs("2022-10-16T04:34:59.000Z"));
  });
});
