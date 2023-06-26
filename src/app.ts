import { Circle, Color, SVG, Svg } from "@svgdotjs/svg.js";
import { DateTime } from "luxon";
import { COPY_ICON } from "./copyIcon";
import { Entry, toEntry } from "./toEntry";

const KEY_TIMEZONES = "timezones";

let text: string = "";
let entries: Array<Entry> = [];
let timezones: Array<string> = [];
let minMs = Number.MAX_VALUE;
let maxMs = -Number.MAX_VALUE;

const textarea = document.getElementById("textarea") as HTMLTextAreaElement;
const statuses = document.getElementById("statuses") as HTMLDivElement;
const timelines = document.getElementById("timelines") as HTMLDivElement;
const svg = SVG("svg").size("100%", "100%") as Svg;
const l1 = svg.group(); // Timelines and circles
const l2 = svg.group(); // Verticle line and timestamps
const l3 = svg.group(); // Timezone labels

function colorForIndex(sortedIdx: number) {
  const h = (sortedIdx * 360) / entries.length;
  return new Color(h, 80, 65, "hsl");
}

function fillAndStroke(circle: Circle, sortedIdx: number) {
  const isMoment = sortedEntries()[sortedIdx].moment;
  if (isMoment) {
    circle.fill(colorForIndex(sortedIdx));
  } else {
    circle.fill("none").stroke({ color: colorForIndex(sortedIdx).toString() });
  }
}

function statusBadge(valid: boolean, idx: number) {
  const container = document.createElement("div");
  container.className = "status-container";

  if (valid) {
    const svg = SVG().size("100%", "100%").addTo(container);
    const clipCircle = svg.circle("80%").attr("cx", "50%").attr("cy", "50%");
    const clip = svg.clip().add(clipCircle);
    fillAndStroke(
      svg
        .circle("80%")
        .attr("cx", "50%")
        .attr("cy", "50%")
        .stroke({ width: 6 })
        .clipWith(clip),
      idx
    );
  } else {
    const span = document.createElement("span");
    span.innerHTML = "!";
    span.title = "Unparseable";
    container.appendChild(span);
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
  updateStatus();
}

textarea.addEventListener("input", (ev) => {
  refresh();
});

function drawTimelines() {
  l1.clear();
  l2.clear();
  l3.clear();

  const h = timelines.clientHeight / timezones.length;
  const w = timelines.clientWidth;

  minMs = Number.MAX_VALUE;
  maxMs = -Number.MAX_VALUE;

  const timezoneTimes: Array<Array<DateTime>> = new Array(timezones.length);

  // Collect stats and create times adjusted to each timezone
  for (const [idx, tz] of timezones.entries()) {
    const y = idx * h + h / 2;

    // Main horizontal
    l1.line(0, y, w, y).stroke({ color: "#eee", width: 2 });

    // Arrows
    const arrowLen = 6;
    l1.line(0, y, arrowLen, y - arrowLen).stroke({ color: "#eee", width: 2 });
    l1.line(0, y, arrowLen, y + arrowLen).stroke({ color: "#eee", width: 2 });
    l1.line(w, y, w - arrowLen, y - arrowLen).stroke({
      color: "#eee",
      width: 2,
    });
    l1.line(w, y, w - arrowLen, y + arrowLen).stroke({
      color: "#eee",
      width: 2,
    });

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

  // Draw actual circles
  for (const [idx, tzTimes] of timezoneTimes.entries()) {
    for (const [entryIdx, t] of tzTimes.entries()) {
      const y = idx * h + h / 2;

      fillAndStroke(
        l1
          .circle(20)
          .center(
            maxMs - minMs > 0
              ? (w * (t.toMillis() - minMs)) / (maxMs - minMs)
              : w / 2,
            y
          )
          .stroke({ width: 4 })
          .attr("pointer-events", "all")
          .attr("cursor", "pointer")
          .on("click", () => {
            showModal({
              tz: timezones[idx],
              entry: entries[entryIdx],
            });
          }),
        entryIdx
      );
    }
  }

  // Write timezone labels and center times
  for (const [idx, tz] of timezones.entries()) {
    const y = idx * h + 8;
    // const timeStr = DateTime.fromMillis(minMs + range / 2, {
    //   zone: tz,
    // }).toISO();
    l3.text(tz)
      .x(w / 2)
      .y(y)
      .font({ anchor: "middle", weight: "bold" });
  }

  // Clear existing buttons
  document
    .querySelectorAll(".remove-button")
    .forEach((e) => e.parentNode!.removeChild(e));

  // Create buttons to remove timezones
  for (const [idx, tz] of timezones.entries()) {
    const y = idx * h;

    const button = document.createElement("button");
    button.innerHTML = `<span>×</span>`;
    button.className = "remove-button";
    button.style.position = "absolute";
    button.style.top = `${y}px`;
    button.style.right = "0";
    button.onclick = () => {
      removeTimezone(tz);
    };
    timelines.appendChild(button);
  }
}

function sortTimezones() {
  const now = DateTime.now();
  timezones.sort((a, b) => {
    const offseta = now.setZone(a).offset;
    const offsetb = now.setZone(b).offset;
    if (offseta !== offsetb) {
      return offsetb - offseta;
    } else {
      return a.localeCompare(b);
    }
  });
}

function refresh() {
  sortTimezones();
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

const now = DateTime.now();
textarea.value = [now.toISO(), now.toISODate()].join("\n");
refresh();

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
const select = document.querySelector(
  "#add-timezone select"
)! as HTMLSelectElement;
for (const tz of Intl.supportedValuesOf("timeZone")) {
  const option = document.createElement("option");
  option.text = tz;
  option.value = tz;
  select.appendChild(option);
}

function addTimezone(tz: string) {
  removeTimezone(tz); // Clear if it's already there
  timezones.push(tz);
  localStorage.setItem(KEY_TIMEZONES, timezones.join());
  refresh();
}

function removeTimezone(tz: string) {
  timezones = timezones.filter((t) => t != tz);
  localStorage.setItem(KEY_TIMEZONES, timezones.join());
  refresh();
}

document.getElementById("add-button")!.onclick = () => {
  addTimezone(select.value);
};

// Load previous timezones
if (localStorage.getItem(KEY_TIMEZONES)) {
  timezones = localStorage.getItem(KEY_TIMEZONES)!.split(",");
  refresh();
}
// No previous timezones -- make new ones
else {
  addTimezone("UTC");
  addTimezone(DateTime.local().zoneName);
}

let offsetX: number | undefined = undefined;
let offsetY: number | undefined = undefined;

timelines.onmouseover = (ev) => {
  offsetX = ev.offsetX;
  offsetY = ev.offsetY;
};

function updateCrosshair() {
  if (!offsetX) {
    return;
  }

  const w = timelines.clientWidth;
  const h = timelines.clientHeight / timezones.length;

  // Get all ms values for entries
  const allMs: Set<number> = new Set();
  for (const e of entries) {
    for (const tz of timezones) {
      if (e.parsed) {
        const inTz = e.parsed.setZone(tz, { keepLocalTime: !e.moment });
        allMs.add(inTz.toMillis());
      }
    }
  }

  // Get a snapped ms based on physical proximity in px to known ms value
  // Default to a value based on pixel offset
  let snappedMs = (offsetX / w) * (maxMs - minMs) + minMs;
  for (const ms of allMs) {
    const msX = ((ms - minMs) / (maxMs - minMs)) * w;
    if (Math.abs(offsetX - msX) <= 12) {
      snappedMs = ms;
      offsetX = msX;
    }
  }

  l2.clear();

  l2.line(offsetX, 0, offsetX, timelines.clientHeight).stroke({
    color: "#666",
  });

  const t = DateTime.fromMillis(snappedMs);

  const leftHalf = offsetX <= timelines.clientWidth / 2;
  for (const [idx, tz] of timezones.entries()) {
    const y = idx * h + h / 2;
    l2.text(t.setZone(tz).toISO())
      .x(offsetX + (leftHalf ? 1 : -1) * 2)
      .y(y + 19)
      .font({
        anchor: leftHalf ? "start" : "end",
      });
  }
}

timelines.onmousemove = (ev) => {
  offsetX = ev.offsetX;
  offsetY = ev.offsetY;
  updateCrosshair();
};

timelines.onmouseout = () => {
  offsetX = offsetY = undefined;
  l2.clear();
};

// Modal stuff
const backdrop = document.querySelector(".modal-backdrop")! as HTMLDivElement;
const modal = document.querySelector(".modal")! as HTMLDivElement;

enum FormatMethods {
  ISO = "toISO",
  SQL = "toSQL",
  RFC2822 = "toRFC2822",
  HTTP = "toHTTP",
  MILLIS = "toMillis",
  SECS = "toUnixInteger",
}

function formatName(method: FormatMethods) {
  switch (method) {
    case FormatMethods.HTTP:
      return "HTTP";
    case FormatMethods.ISO:
      return "ISO 8601";
    case FormatMethods.MILLIS:
      return "Unix (ms)";
    case FormatMethods.SECS:
      return "Unix (s)";
    case FormatMethods.RFC2822:
      return "RFC 2822";
    case FormatMethods.SQL:
      return "SQL";
    default:
      return "UNKNOWN";
  }
}

function showModal(
  displayInfo:
    | {
        tz: string;
        entry: Entry;
      }
    | undefined
) {
  if (displayInfo) {
    const e = displayInfo.entry;

    const left = document.createElement("div");
    const badge = statusBadge(true, e.line);
    left.appendChild(badge);

    const right = document.createElement("div");
    right.className = "modal-right";

    const title = document.createElement("div");
    title.className = "modal-title";
    title.innerText = e.text;
    right.appendChild(title);

    const tz = document.createElement("div");
    tz.innerText = displayInfo.tz;
    right.appendChild(tz);

    // Output formats
    const table = document.createElement("table");
    for (const format of Object.values(FormatMethods)) {
      const row = document.createElement("tr");

      const name = document.createElement("td");
      name.innerText = formatName(format);
      row.appendChild(name);

      const value = document.createElement("td");
      const inTz = e.parsed!.setZone(displayInfo.tz, {
        keepLocalTime: !e.moment,
      });
      const text = inTz[format]().toString();
      value.innerText = text;
      row.appendChild(value);

      const copy = document.createElement("td");
      const button = document.createElement("button");
      button.innerHTML = COPY_ICON;
      button.addEventListener("click", () => {
        navigator.clipboard.writeText(text);
      });
      copy.appendChild(button);
      row.appendChild(copy);

      table.appendChild(row);
    }
    right.appendChild(table);

    modal.replaceChildren(left, right);
  }

  const visibility = displayInfo ? "visible" : "hidden";
  backdrop.style.visibility = visibility;
  modal.style.visibility = visibility;
}

// Hide when clicking backdrop
backdrop.addEventListener("click", () => {
  showModal(undefined);
});

// Allow ESC to quit modal
document.querySelector("body")!.addEventListener("keydown", (ev) => {
  if (ev.key === "Escape") {
    showModal(undefined);
  }
});
