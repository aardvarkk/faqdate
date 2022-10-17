import { DateTime } from "luxon";
import { Entry, toEntry } from "./toEntry";
import { Svg, SVG } from "@svgdotjs/svg.js";

let text: string = "";
let entries: Array<Entry> = [];
let timezones: Array<string>;

const textarea = document.getElementById("textarea") as HTMLTextAreaElement;
const statuses = document.getElementById("statuses") as HTMLDivElement;
const timelineSvg = document.getElementById("timeline-svg")!;
const timelines = SVG("#timeline-svg").size("100%", "100%") as Svg;

function statusCircle(valid: boolean) {
  const container = document.createElement("div");
  container.className = "status-container";
  const span = document.createElement("span");
  span.innerHTML = valid ? "&nbsp;" : "!";
  span.title = "Hello";
  container.appendChild(span);

  if (valid) {
    const circle = document.createElement("div");
    circle.className = "status-circle";
    circle.style.backgroundColor = "red";
    container.appendChild(circle);
  }

  return container;
}

function updateStatus() {
  statuses.innerHTML = "";
  entries.forEach((e) => {
    statuses.appendChild(statusCircle(e.parsed?.isValid));
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
  parseTextArea();
});

function drawTimelines() {
  const h = timelineSvg.clientHeight / timezones.length;
  const w = timelineSvg.clientWidth;
  for (const [idx, tz] of timezones.entries()) {
    const y = idx * h + h / 2;
    timelines.line(0, y, w, y).stroke({ color: "gray" });
  }
}

function refresh(text: string) {
  textarea.value = text;
  textarea.dispatchEvent(new Event("input"));
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
  text += (ev as ClipboardEvent).clipboardData.getData("text");
  refresh(text);
});

timezones = [DateTime.local().zoneName, "UTC"];
console.log({ timezones });
refresh(`${DateTime.now().toISO()}\n2022-10-16`);
