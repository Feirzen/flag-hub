// Night Shift widget for Scriptable (iPhone / iPad)
// Shows the night shift mode, open flags, and what's waiting on you.
// Tapping the widget opens the Flag Hub, where you change the mode.
// Setup: Scriptable > + > paste this > name it "Night Shift".
// Then long-press home screen > + > Scriptable > pick "Night Shift".

const STATUS = "https://raw.githubusercontent.com/Feirzen/flag-hub/main/status.json";
const HUB = "https://claude.ai/artifact/PGWTqtLu7cZqtf8ugUoEDs";

const MODES = {
  off:   { label: "Off",    color: "#8a948e", note: "Skipping tonight" },
  light: { label: "Light",  color: "#2fbf7a", note: "Small fixes tonight" },
  big:   { label: "Go Big", color: "#9b7bff", note: "Big builds tonight" },
};

async function load() {
  try {
    const r = new Request(STATUS + "?t=" + Date.now());
    r.timeoutInterval = 10;
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

const s = await load();
const m = MODES[(s && s.mode) || "light"] || MODES.light;
const size = config.widgetFamily || "small";

const w = new ListWidget();
w.url = HUB;
w.backgroundColor = Color.dynamic(new Color("#f1f3f1"), new Color("#151a17"));
w.setPadding(14, 14, 14, 14);
const ink = Color.dynamic(new Color("#1b211d"), new Color("#ecf1ee"));
const soft = Color.dynamic(new Color("#6f7a74"), new Color("#8d9892"));

const top = w.addStack(); top.centerAlignContent();
const flag = top.addText("⚑"); flag.font = Font.boldSystemFont(14); flag.textColor = new Color("#ff5a3c");
top.addSpacer(5);
const t = top.addText("NIGHT SHIFT"); t.font = Font.semiboldSystemFont(11); t.textColor = soft;
w.addSpacer(8);

const row = w.addStack(); row.centerAlignContent();
const dot = row.addText("●"); dot.font = Font.systemFont(16); dot.textColor = new Color(m.color);
row.addSpacer(6);
const ml = row.addText(m.label); ml.font = Font.boldRoundedSystemFont(size === "small" ? 24 : 28); ml.textColor = ink; ml.minimumScaleFactor = 0.7;
const note = w.addText(m.note); note.font = Font.systemFont(12); note.textColor = soft;
w.addSpacer();

if (!s) {
  const e = w.addText("Can't reach status right now"); e.font = Font.systemFont(11); e.textColor = soft;
} else {
  const c = w.addStack();
  const a = c.addText(`${s.openFlags ?? 0} open`); a.font = Font.semiboldSystemFont(13); a.textColor = ink;
  c.addSpacer(8);
  const b = c.addText(`${s.waiting ?? 0} waiting`); b.font = Font.semiboldSystemFont(13);
  b.textColor = (s.waiting || 0) > 0 ? new Color("#ff5a3c") : ink;
  if (size !== "small" && s.lastRun) {
    w.addSpacer(4);
    const lr = w.addText(`Last run ${ago(s.lastRun.at)}: ${s.lastRun.summary}`);
    lr.font = Font.systemFont(11); lr.textColor = soft; lr.lineLimit = 2;
  }
}

w.refreshAfterDate = new Date(Date.now() + 30 * 60 * 1000);
if (config.runsInWidget) Script.setWidget(w); else await w.presentMedium();
Script.complete();
