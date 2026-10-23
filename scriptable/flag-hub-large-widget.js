// Flag Hub widget for Scriptable (made for the LARGE size)
// Top: night shift setting, flag counts, and what's waiting on you.
// Below: your open flags, priority first, then newest first (first line of each).
// Orange dot = for Claude, teal dot = for you, ⚡ = priority.
// Tap it to open the Flag Hub.
//
// Setup: Scriptable app > + (top right) > paste all of this > tap the title and name it "Flag Hub Large" > Done.
// Then: long-press your home screen > + > Scriptable > swipe to the LARGE size > Add Widget.
// Long-press the new widget > Edit Widget > Script > choose "Flag Hub Large".

const RAW = "https://raw.githubusercontent.com/Feirzen/flag-hub/main/";
const HUB = "https://feirzen.github.io/flag-hub/";

const MODES = {
  off:   { label: "Off",    color: "#8a948e" },
  light: { label: "Light",  color: "#2fbf7a" },
  big:   { label: "Go Big", color: "#9b7bff" },
};
const ORANGE = "#ff5a3c";
const TEAL = "#2bb5a0";
const ROWS = 10;

async function getJSON(path) {
  try {
    const r = new Request(RAW + path + "?t=" + Date.now());
    r.timeoutInterval = 12;
    return await r.loadJSON();
  } catch (e) { return null; }
}
function ago(iso) {
  if (!iso) return "";
  const h = Math.round((Date.now() - new Date(iso)) / 3600000);
  if (h < 1) return "just now";
  if (h < 24) return h + "h ago";
  return Math.round(h / 24) + "d ago";
}
function firstLine(t) {
  const line = String(t || "").split("\n").map(s => s.trim()).find(s => s) || "";
  return line;
}

const status = await getJSON("status.json");
const data = await getJSON("data/flags.json");
const mode = MODES[(status && status.mode) || "light"] || MODES.light;
const flags = data ? (data.flags || []).filter(f => f.status === "open") : [];
const forYou = flags.filter(f => f.kind === "you");
const forClaude = flags.filter(f => f.kind !== "you" && f.kind !== "idea"); // ideas live in their own tab in the Hub
const waiting = data ? (data.proposals || []).filter(p => p.status === "waiting") : [];
const runs = data ? (data.runs || []).slice().sort((a, b) => (b.at || "").localeCompare(a.at || "")) : [];
const last = runs[0] || (status && status.lastRun);

// priority first, then newest first
const sorted = flags.slice().sort((a, b) =>
  ((b.priority ? 1 : 0) - (a.priority ? 1 : 0)) || (b.created || "").localeCompare(a.created || ""));

const ink = Color.dynamic(new Color("#1b211d"), new Color("#ecf1ee"));
const soft = Color.dynamic(new Color("#6f7a74"), new Color("#8d9892"));
const card = Color.dynamic(new Color("#ffffff"), new Color("#1d2420"));

const w = new ListWidget();
w.url = HUB;
w.backgroundColor = Color.dynamic(new Color("#f1f3f1"), new Color("#141916"));
w.setPadding(14, 15, 12, 15);

// ---- top line
const top = w.addStack(); top.centerAlignContent();
const fl = top.addText("⚑"); fl.font = Font.boldSystemFont(13); fl.textColor = new Color(ORANGE);
top.addSpacer(5);
const tt = top.addText("FLAG HUB"); tt.font = Font.semiboldSystemFont(11); tt.textColor = soft;
top.addSpacer();
if (last && last.at) { const lt = top.addText("night shift ran " + ago(last.at)); lt.font = Font.systemFont(11); lt.textColor = soft; }
w.addSpacer(8);

// ---- summary row: mode + three counts
const sum = w.addStack(); sum.centerAlignContent();
const mbox = sum.addStack(); mbox.centerAlignContent();
const dot = mbox.addText("●"); dot.font = Font.systemFont(13); dot.textColor = new Color(mode.color);
mbox.addSpacer(4);
const ml = mbox.addText(mode.label); ml.font = Font.boldRoundedSystemFont(22); ml.textColor = ink; ml.lineLimit = 1; ml.minimumScaleFactor = 0.7;
sum.addSpacer();

function pill(n, label, color) {
  const p = sum.addStack(); p.layoutVertically(); p.backgroundColor = card; p.cornerRadius = 9; p.setPadding(4, 8, 4, 8);
  const a = p.addText(String(n)); a.font = Font.boldRoundedSystemFont(15); a.textColor = n ? new Color(color) : soft;
  const b = p.addText(label); b.font = Font.mediumSystemFont(9); b.textColor = soft; b.lineLimit = 1;
}
pill(forClaude.length, "for Claude", ORANGE);
sum.addSpacer(6);
pill(forYou.length, "for you", TEAL);
sum.addSpacer(6);
pill(waiting.length, "to approve", ORANGE);

w.addSpacer(10);

// ---- the list
const list = w.addStack(); list.layoutVertically(); list.backgroundColor = card; list.cornerRadius = 12; list.setPadding(9, 10, 9, 10);
if (!data) {
  const e = list.addText("Can't reach the Hub right now"); e.font = Font.systemFont(12); e.textColor = soft;
} else if (!sorted.length) {
  const e = list.addText("No open flags. All clear."); e.font = Font.systemFont(12); e.textColor = soft;
} else {
  sorted.slice(0, ROWS).forEach((f, i) => {
    if (i) list.addSpacer(5);
    const r = list.addStack(); r.centerAlignContent();
    const d = r.addText(f.priority ? "⚡" : "●");
    d.font = Font.systemFont(f.priority ? 10 : 9);
    d.textColor = new Color(f.kind === "you" ? TEAL : ORANGE);
    r.addSpacer(6);
    const pj = r.addText(f.project || "Unsorted"); pj.font = Font.semiboldSystemFont(11); pj.textColor = soft; pj.lineLimit = 1;
    r.addSpacer(6);
    let line = firstLine(f.text);
    const pre = (f.project || "") + ":";
    if (pre.length > 1 && line.toLowerCase().startsWith(pre.toLowerCase())) line = line.slice(pre.length).trim();
    const tx = r.addText(line);tx.font = Font.systemFont(12); tx.textColor = ink; tx.lineLimit = 1;
    r.addSpacer();
  });
  if (sorted.length > ROWS) {
    list.addSpacer(5);
    const m = list.addText(`+${sorted.length - ROWS} more in the Hub`); m.font = Font.systemFont(10); m.textColor = soft;
  }
}

w.addSpacer();
w.refreshAfterDate = new Date(Date.now() + 30 * 60 * 1000);
if (config.runsInWidget) Script.setWidget(w); else await w.presentLarge();
Script.complete();
