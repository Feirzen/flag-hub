// Flag Hub widget for Scriptable (made for the MEDIUM size)
// Two looks. Pick one with STYLE below:
//   "counts" = flag counts by section, when each scheduled run last went, and anything waiting on you.
//   "focus"  = anything waiting on you, big and bright. When nothing is, it falls back to the counts.
// Tap it to open the Flag Hub.
//
// Setup: Scriptable app > open your "Night Shift" script (or + for a new one) > replace everything with this > Done.
// Then: long-press the widget > Edit Widget > Script > choose that script. Size: medium.

const STYLE = "counts"; // or "focus"

const RAW = "https://raw.githubusercontent.com/Feirzen/flag-hub/main/";
const HUB = "https://feirzen.github.io/flag-hub/";

const MODES = {
  off:   { label: "Off",    color: "#8a948e" },
  light: { label: "Light",  color: "#2fbf7a" },
  big:   { label: "Go Big", color: "#9b7bff" },
};
const ORANGE = "#ff5a3c";
const TEAL = "#2bb5a0";
const BLUE = "#3d8bfd";
const PURPLE = "#9b7bff";
const YELLOW = "#ffb020";

async function getJSON(path) {
  try {
    const r = new Request(RAW + path + "?t=" + Date.now());
    r.timeoutInterval = 12;
    return await r.loadJSON();
  } catch (e) { return null; }
}
function ago(iso) {
  if (!iso) return "never";
  const h = Math.round((Date.now() - new Date(iso)) / 3600000);
  if (h < 1) return "just now";
  if (h < 24) return h + "h ago";
  return Math.round(h / 24) + "d ago";
}
function days(iso) { return iso ? Math.floor((Date.now() - new Date(iso)) / 86400000) : 0; }

const status = await getJSON("status.json");
const data = await getJSON("data/flags.json");
const mode = MODES[(status && status.mode) || "light"] || MODES.light;

// ---- lanes, same rules as the Hub
const lanes = (data && data.lanes) || {};
function flagLane(f) {
  if (f.kind === "idea") return "idea";
  const l = f.lane || lanes[f.project];
  return l === "pc" ? "pc" : "cloud"; // a label in the idea lane counts as cloud for work flags
}
const open = data ? (data.flags || []).filter(f => f.status === "open") : [];
const forYou = open.filter(f => f.kind === "you");
const work = open.filter(f => f.kind !== "you" && f.kind !== "idea");
const cloud = work.filter(f => flagLane(f) === "cloud");
const pc = work.filter(f => flagLane(f) === "pc");
const ideas = open.filter(f => f.kind === "idea");

// ---- what's waiting on you: proposals to approve, plus your own priority to-dos
const waiting = data ? (data.proposals || []).filter(p => p.status === "waiting")
  .map(p => ({ project: p.project, text: p.title, age: days(p.created), kind: "approve" })) : [];
const urgent = forYou.filter(f => f.priority)
  .map(f => ({ project: f.project, text: String(f.text || "").split("\n")[0], age: days(f.created), kind: "todo" }));
const onYou = waiting.concat(urgent);

// ---- last run of each scheduled job
const runs = data ? (data.runs || []) : [];
function lastAt(test) { return runs.filter(test).map(r => r.at || "").sort().pop() || ""; }
const cloudAt = lastAt(r => (r.lane || "cloud") === "cloud");
const pcAt = lastAt(r => r.lane === "pc");
const polishAt = ((data && data.polish) || []).map(p => p.at || "").sort().pop() || "";

// ---- colors
const ink = Color.dynamic(new Color("#1b211d"), new Color("#ecf1ee"));
const soft = Color.dynamic(new Color("#6f7a74"), new Color("#8d9892"));
const card = Color.dynamic(new Color("#ffffff"), new Color("#1d2420"));

const w = new ListWidget();
w.url = HUB;
w.backgroundColor = Color.dynamic(new Color("#f1f3f1"), new Color("#141916"));
w.setPadding(12, 14, 11, 14);

function txt(stack, s, font, color, lines) {
  const t = stack.addText(s); t.font = font; t.textColor = color; if (lines) t.lineLimit = lines; return t;
}

// top line: mode on the left, last runs on the right
function header() {
  const top = w.addStack(); top.centerAlignContent();
  txt(top, "●", Font.systemFont(11), new Color(mode.color));
  top.addSpacer(4);
  txt(top, mode.label, Font.boldRoundedSystemFont(15), ink, 1);
  top.addSpacer();
  const rr = top.addStack(); rr.centerAlignContent();
  txt(rr, `Cloud ${ago(cloudAt)} · PC ${ago(pcAt)} · Polish ${ago(polishAt)}`, Font.mediumSystemFont(10), soft, 1).minimumScaleFactor = 0.7;
}

function tiles() {
  const row = w.addStack(); row.centerAlignContent();
  const list = [[cloud.length, "Claude · cloud", ORANGE], [pc.length, "Claude · PC", BLUE], [forYou.length, "for you", TEAL], [ideas.length, "ideas", PURPLE]];
  list.forEach(([n, label, color], i) => {
    if (i) row.addSpacer(5);
    const p = row.addStack(); p.layoutVertically(); p.backgroundColor = card; p.cornerRadius = 9; p.setPadding(5, 7, 5, 7);
    p.size = new Size(72, 0);
    txt(p, String(n), Font.boldRoundedSystemFont(17), n ? new Color(color) : soft);
    txt(p, label, Font.mediumSystemFont(9), soft, 1).minimumScaleFactor = 0.8;
  });
}

function waitingBox(max, big) {
  const box = w.addStack(); box.layoutVertically(); box.cornerRadius = 11; box.setPadding(big ? 8 : 6, 10, big ? 8 : 6, 10);
  if (!data) { box.backgroundColor = card; txt(box, "Can't reach the Hub right now", Font.systemFont(11), soft); return; }
  if (!onYou.length) { box.backgroundColor = card; txt(box, "Nothing waiting on you. All caught up.", Font.systemFont(11), soft, 1); return; }
  box.backgroundColor = new Color(ORANGE, 0.16);
  onYou.slice(0, max).forEach((it, i) => {
    if (i) box.addSpacer(big ? 4 : 2);
    const r = box.addStack(); r.centerAlignContent();
    txt(r, it.kind === "approve" ? "⚑" : "⚡", Font.boldSystemFont(big ? 13 : 11), new Color(it.kind === "approve" ? ORANGE : YELLOW));
    r.addSpacer(6);
    txt(r, `${it.project}: ${it.text}`, (big ? Font.semiboldSystemFont(13) : Font.semiboldSystemFont(11)), new Color(ORANGE), 1);
    r.addSpacer();
    if (it.age >= 2) { r.addSpacer(4); txt(r, it.age + "d", Font.boldSystemFont(10), new Color(YELLOW)); }
  });
  if (onYou.length > max) { box.addSpacer(2); txt(box, `+${onYou.length - max} more waiting on you`, Font.systemFont(10), soft); }
}

if (STYLE === "focus" && onYou.length) {
  header();
  w.addSpacer(7);
  const h = w.addStack(); h.centerAlignContent();
  txt(h, String(onYou.length), Font.boldRoundedSystemFont(22), new Color(ORANGE));
  h.addSpacer(6);
  txt(h, "waiting on you", Font.semiboldSystemFont(13), ink);
  h.addSpacer();
  txt(h, `${cloud.length + pc.length} for Claude · ${forYou.length} for you`, Font.mediumSystemFont(10), soft, 1);
  w.addSpacer(6);
  waitingBox(3, true);
} else {
  header();
  w.addSpacer(8);
  tiles();
  w.addSpacer(7);
  waitingBox(2, false);
}

w.addSpacer();
const last = runs.slice().sort((a, b) => (b.at || "").localeCompare(a.at || ""))[0] || (status && status.lastRun);
if (last && last.summary) txt(w, "Last run: " + last.summary, Font.systemFont(10), soft, 1);
w.refreshAfterDate = new Date(Date.now() + 30 * 60 * 1000);
if (config.runsInWidget) Script.setWidget(w); else await w.presentMedium();
Script.complete();
