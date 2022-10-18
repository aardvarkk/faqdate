import { DateTime } from "luxon";
import { Entry, toEntry } from "./toEntry";
import { Svg, SVG, Color, Circle } from "@svgdotjs/svg.js";

let text: string = "";
let entries: Array<Entry> = [];
let timezones: Array<string>;

const textarea = document.getElementById("textarea") as HTMLTextAreaElement;
const statuses = document.getElementById("statuses") as HTMLDivElement;
const timelineSvg = document.getElementById("timeline-svg")!;
const timelines = SVG("#timeline-svg").size("100%", "100%") as Svg;

function colorForIndex(sortedIdx: number) {
  const h = (sortedIdx * 360) / entries.length;
  return new Color(h, 80, 50, "hsl");
}

function fillAndStroke(circle: Circle, sortedIdx: number) {
  const isMoment = sortedEntries()[sortedIdx].moment;
  if (isMoment) {
    circle.fill(colorForIndex(sortedIdx));
  } else {
    circle.fill("#fff").stroke({ color: colorForIndex(sortedIdx).toString() });
  }
}

function statusBadge(valid: boolean, idx: number) {
  const container = document.createElement("div");
  container.className = "status-container";

  const span = document.createElement("span");
  span.innerHTML = valid ? "&nbsp;" : "!";
  span.title = "Unparseable";
  container.appendChild(span);

  if (valid) {
    const svg = SVG().size("100%", "100%").addTo(container);
    const clipCircle = svg.circle("80%");
    const clip = svg.clip().add(clipCircle);
    fillAndStroke(svg.circle("80%").stroke({ width: 6 }).clipWith(clip), idx);
  }

  return container;
}

function sortedEntries(): Entry[] {
  return [...entries].sort((a, b) => {
    if (!b.parsed?.isValid) {
      return -1;
    }
    if (!a.parsed?.isValid) {
      return 1;
    }
    return b.parsed.toMillis() - a.parsed.toMillis();
  });
}

function updateStatus() {
  statuses.innerHTML = "";

  const sorted = sortedEntries();
  entries.forEach((e, idx) => {
    statuses.appendChild(
      statusBadge(
        e.parsed?.isValid === true,
        sorted.findIndex((s) => s.line === idx)
      )
    );
  });
}

function parseTextArea() {
  text = textarea.value;
  entries = text.split("\n").map(toEntry);
  textarea.setAttribute("rows", (entries.length + 1).toString());
  updateStatus();
}

textarea.addEventListener("input", (ev) => {
  refresh();
});

function drawTimelines() {
  timelines.clear();

  const h = timelineSvg.clientHeight / timezones.length;
  const w = timelineSvg.clientWidth;

  let minMs = Number.MAX_VALUE;
  let maxMs = -Number.MAX_VALUE;

  const timezoneTimes: Array<Array<DateTime>> = new Array(timezones.length);

  // Collect stats and create times adjusted to each timezone
  for (const [idx, tz] of timezones.entries()) {
    const y = idx * h + h / 2;
    timelines
      .line(0, y, w, y)
      .stroke({ color: "#ddd", width: 2, dasharray: "16,16" });

    timezoneTimes[idx] = [];
    for (const e of sortedEntries()) {
      if (!e.parsed) {
        continue;
      }

      const inTz = e.parsed.setZone(tz, { keepLocalTime: !e.moment });
      timezoneTimes[idx].push(inTz);

      minMs = Math.min(minMs, inTz.toMillis());
      maxMs = Math.max(maxMs, inTz.toMillis());
    }
  }

  // Add padding
  const range = maxMs - minMs;
  minMs -= range * 0.1;
  maxMs += range * 0.1;

  for (const [idx, tzTimes] of timezoneTimes.entries()) {
    for (const [entryIdx, t] of tzTimes.entries()) {
      const y = idx * h + h / 2;

      fillAndStroke(
        timelines
          .circle(20)
          .center(
            range > 0 ? (w * (t.toMillis() - minMs)) / (maxMs - minMs) : w / 2,
            y
          )
          .stroke({ width: 4 }),
        entryIdx
      );
    }
  }

  // Write top and bottom timezone labels and center times
  for (const [idx, tz] of timezones.entries()) {
    const y = idx * h;
    // const timeStr = DateTime.fromMillis(minMs + range / 2, {
    //   zone: tz,
    // }).toISO();
    timelines
      .text(tz)
      .x(w / 2)
      .y(y)
      .font({ anchor: "middle", alignmentBaseline: "top" });
  }
}

function refresh() {
  parseTextArea();
  drawTimelines();
}

addEventListener("paste", (ev) => {
  // Prevent 'input' event from also firing
  // if we're pasting inside the input
  ev.preventDefault();
  let text = textarea.value;
  if (!text.endsWith("\n")) {
    text += "\n";
  }
  text += (ev as ClipboardEvent).clipboardData!.getData("text");
  textarea.value = text;
  refresh();
});

document.querySelector("body")!.onresize = refresh;

timezones = [DateTime.local().zoneName, "UTC"];
textarea.value = [
  DateTime.now().toISO(),
  "2022-10-16",
  "Mon Oct 17 2022 22:44:09 GMT-0700",
].join("\n");
refresh();
