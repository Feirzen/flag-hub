// Flag Hub widget for Scriptable (made for the LARGE size)
// Top: night shift setting and when the cloud, PC, and polish runs last went.
// Counts: Claude in the cloud, Claude on your PC, and your own to-dos.
// Then a big red number of proposals waiting on you (cloud or PC) with the first few listed,
// and your open flags below that, priority first, then newest first.
// Tap it to open the Flag Hub.
//
// Setup: Scriptable app > open your "Flag Hub Large" script > replace everything with this > Done.
// (New? + top right > paste > tap the title and name it "Flag Hub Large" > Done. Then long-press
// the home screen > + > Scriptable > LARGE size > Add Widget > long-press it > Edit Widget > Script.)

const RAW = "https://raw.githubusercontent.com/Feirzen/flag-hub/main/";
const HUB = "https://feirzen.github.io/flag-hub/";

const MODES = {
  off:   { label: "Off",    color: "#8a948e" },
  light: { label: "Light",  color: "#2fbf7a" },
  big:   { label: "Go Big", color: "#9b7bff" },
};
const RED = "#ff3b30";
const ORANGE = "#ff5a3c";
const BLUE = "#3d8bfd";
const TEAL = "#2bb5a0";
const YELLOW = "#ffb020";
const WAIT_ROWS = 3;
const FLAG_ROWS = 6;

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
  if (h < 1) return "now";
  if (h < 24) return h + "h ago";
  return Math.round(h / 24) + "d ago";
}
function days(iso) { return iso ? Math.floor((Date.now() - new Date(iso)) / 86400000) : 0; }
function firstLine(t) { return String(t || "").split("\n").map(s => s.trim()).find(s => s) || ""; }

const status = await getJSON("status.json");
const data = await getJSON("data/flags.json");
const mode = MODES[(status && status.mode) || "light"] || MODES.light;

// ---- lanes, same rules as the Hub
const lanes = (data && data.lanes) || {};
function flagLane(f) {
  const l = f.lane || lanes[f.project];
  return l === "pc" ? "pc" : "cloud"; // a label in the idea lane counts as cloud for work flags
}
function propLane(p) {
  if (p.lane) return p.lane === "pc" ? "pc" : "cloud";
  if (p.applyOn === "pc") return "pc";
  return lanes[p.project] === "pc" ? "pc" : "cloud";
}
const open = data ? (data.flags || []).filter(f => f.status === "open" && f.kind !== "idea") : [];
const forYou = open.filter(f => f.kind === "you");
const work = open.filter(f => f.kind !== "you");
const cloud = work.filter(f => flagLane(f) === "cloud");
const pc = work.filter(f => flagLane(f) === "pc");
const waiting = data ? (data.proposals || []).filter(p => p.status === "waiting")
  .sort((a, b) => (a.created || "").localeCompare(b.created || "")) : [];

// priority first, then newest first
const sorted = open.slice().sort((a, b) =>
  ((b.priority ? 1 : 0) - (a.priority ? 1 : 0)) || (b.created || "").localeCompare(a.created || ""));

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
w.setPadding(13, 14, 11, 14);

function txt(stack, s, font, color, lines) {
  const t = stack.addText(s); t.font = font; t.textColor = color; if (lines) t.lineLimit = lines; return t;
}
function icon(stack, name, size, color) {
  const sym = SFSymbol.named(name); sym.applyFont(Font.systemFont(size));
  const im = stack.addImage(sym.image); im.imageSize = new Size(size + 3, size + 3); im.tintColor = color; return im;
}

// ---- top line: mode on the left, last runs on the right
const top = w.addStack(); top.centerAlignContent();
txt(top, "●", Font.systemFont(11), new Color(mode.color));
top.addSpacer(4);
txt(top, mode.label, Font.boldRoundedSystemFont(16), ink, 1);
top.addSpacer();
icon(top, "cloud.fill", 10, soft); top.addSpacer(3);
txt(top, ago(cloudAt), Font.mediumSystemFont(10), soft, 1);
top.addSpacer(8);
icon(top, "desktopcomputer", 10, soft); top.addSpacer(3);
txt(top, ago(pcAt), Font.mediumSystemFont(10), soft, 1);
top.addSpacer(8);
icon(top, "sparkles", 10, soft); top.addSpacer(3);
txt(top, ago(polishAt), Font.mediumSystemFont(10), soft, 1);
w.addSpacer(9);

// ---- counts: Claude (cloud), Claude (PC), for you
const row = w.addStack(); row.centerAlignContent();
[[cloud.length, "Claude", "cloud.fill", ORANGE], [pc.length, "Claude", "desktopcomputer", BLUE], [forYou.length, "for you", null, TEAL]]
  .forEach(([n, label, sym, color], i) => {
    if (i) row.addSpacer(6);
    const p = row.addStack(); p.layoutVertically(); p.backgroundColor = card; p.cornerRadius = 10; p.setPadding(6, 9, 6, 9);
    p.size = new Size(98, 0);
    txt(p, String(n), Font.boldRoundedSystemFont(20), n ? new Color(color) : soft);
    const l = p.addStack(); l.centerAlignContent();
    txt(l, label, Font.mediumSystemFont(11), soft, 1);
    if (sym) { l.addSpacer(4); icon(l, sym, 10, n ? new Color(color) : soft); }
  });
w.addSpacer(9);

// ---- waiting on you: big red number, then the first few
const box = w.addStack(); box.layoutVertically(); box.cornerRadius = 12; box.setPadding(8, 10, 8, 10);
if (!data) {
  box.backgroundColor = card; txt(box, "Can't reach the Hub right now", Font.systemFont(12), soft);
} else {
  box.backgroundColor = waiting.length ? new Color(RED, 0.14) : card;
  const h = box.addStack(); h.centerAlignContent();
  txt(h, String(waiting.length), Font.heavyRoundedSystemFont(30), waiting.length ? new Color(RED) : soft);
  h.addSpacer(7);
  txt(h, waiting.length ? "waiting on you" : "Nothing waiting on you", Font.semiboldSystemFont(14), ink, 1);
  h.addSpacer();
  waiting.slice(0, WAIT_ROWS).forEach(p => {
    box.addSpacer(3);
    const r = box.addStack(); r.centerAlignContent();
    icon(r, propLane(p) === "pc" ? "desktopcomputer" : "cloud.fill", 10, new Color(RED));
    r.addSpacer(6);
    txt(r, `${p.project}: ${p.title}`, Font.semiboldSystemFont(12), new Color(RED), 1);
    r.addSpacer();
    const d = days(p.created);
    if (d >= 2) { r.addSpacer(4); txt(r, d + "d", Font.boldSystemFont(10), new Color(YELLOW)); }
  });
  if (waiting.length > WAIT_ROWS) { box.addSpacer(3); txt(box, `+${waiting.length - WAIT_ROWS} more in the Hub`, Font.systemFont(10), soft); }
}
w.addSpacer(9);

// ---- open flags
const list = w.addStack(); list.layoutVertically(); list.backgroundColor = card; list.cornerRadius = 12; list.setPadding(8, 10, 8, 10);
if (!data) {
  txt(list, "…", Font.systemFont(12), soft);
} else if (!sorted.length) {
  txt(list, "No open flags. All clear.", Font.systemFont(12), soft);
} else {
  sorted.slice(0, FLAG_ROWS).forEach((f, i) => {
    if (i) list.addSpacer(4);
    const r = list.addStack(); r.centerAlignContent();
    const mine = f.kind === "you";
    const color = new Color(mine ? TEAL : flagLane(f) === "pc" ? BLUE : ORANGE);
    if (f.priority) txt(r, "⚡", Font.systemFont(10), new Color(YELLOW));
    else if (mine) txt(r, "●", Font.systemFont(9), color);
    else icon(r, flagLane(f) === "pc" ? "desktopcomputer" : "cloud.fill", 9, color);
    r.addSpacer(6);
    txt(r, f.project || "Unsorted", Font.semiboldSystemFont(11), soft, 1);
    r.addSpacer(6);
    let line = firstLine(f.text);
    const pre = (f.project || "") + ":";
    if (pre.length > 1 && line.toLowerCase().startsWith(pre.toLowerCase())) line = line.slice(pre.length).trim();
    txt(r, line, Font.systemFont(12), ink, 1);
    r.addSpacer();
  });
  if (sorted.length > FLAG_ROWS) { list.addSpacer(4); txt(list, `+${sorted.length - FLAG_ROWS} more in the Hub`, Font.systemFont(10), soft); }
}

w.addSpacer();
w.refreshAfterDate = new Date(Date.now() + 30 * 60 * 1000);
if (config.runsInWidget) Script.setWidget(w); else await w.presentLarge();
Script.complete();
