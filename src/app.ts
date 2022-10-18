import { DateTime } from "luxon";
import { Entry, toEntry } from "./toEntry";
import { Svg, SVG, Color } from "@svgdotjs/svg.js";

let text: string = "";
let entries: Array<Entry> = [];
let timezones: Array<string>;

const textarea = document.getElementById("textarea") as HTMLTextAreaElement;
const statuses = document.getElementById("statuses") as HTMLDivElement;
const timelineSvg = document.getElementById("timeline-svg")!;
const timelines = SVG("#timeline-svg").size("100%", "100%") as Svg;

function colorForIndex(idx: number) {
  const h = (idx * 360) / entries.length;
  return new Color(h, 80, 50, "hsl");
}

function statusCircle(valid: boolean, idx: number) {
  const container = document.createElement("div");
  container.className = "status-container";

  const span = document.createElement("span");
  span.innerHTML = valid ? "&nbsp;" : "!";
  span.title = "Hello";
  container.appendChild(span);

  if (valid) {
    const circle = document.createElement("div");
    circle.className = "status-circle";
    circle.style.backgroundColor = colorForIndex(idx).toString();
    container.appendChild(circle);
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
      statusCircle(
        e.parsed?.isValid === true,
        sorted.findIndex((s) => s.line === idx)
      )
    );
  });
}

function parseTextArea() {
  text = textarea.value;
  entries = text.split("\n").map(toEntry);
  console.log({ entries });
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

  console.log(
    "SORTED",
    sortedEntries().map((s) => s.parsed!.toISO())
  );

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
      console.log(inTz.toISO());
      console.log({ timezoneTimes });

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
      timelines
        .circle(20)
        .center((w * (t.toMillis() - minMs)) / (maxMs - minMs), y)
        .fill(colorForIndex(entryIdx));
    }
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

timezones = [DateTime.local().zoneName, "UTC"];
console.log({ timezones });
textarea.value = `${DateTime.now().toISO()}\n2022-10-16`;
refresh();
