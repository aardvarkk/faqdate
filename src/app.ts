import dayjs, { Dayjs } from "dayjs";
import { toDayjs } from "./toDayjs";

type Entry = {
  text: string;
  parsed: Dayjs | undefined;
};

let text: string = "";
let entries: Array<Entry> = [];

const textarea = document.getElementById("textarea") as HTMLTextAreaElement;
const statuses = document.getElementById("statuses") as HTMLDivElement;

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
    statuses.appendChild(statusCircle(e.parsed?.isValid()));
  });
}

function parseTextArea() {
  text = textarea.value;
  entries = text.split("\n").map((t) => ({ text: t, parsed: toDayjs(t) }));
  textarea.setAttribute("rows", (entries.length + 1).toString());
  updateStatus();
}

textarea.addEventListener("input", (ev) => {
  parseTextArea();
});

function setTextArea(text: string) {
  textarea.value = text;
  textarea.dispatchEvent(new Event("input"));
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
  setTextArea(text);
});

setTextArea(dayjs().format());
