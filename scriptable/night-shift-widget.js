// Night Shift widget for Scriptable (made for the medium size)
// Shows the night shift setting and any proposals waiting on you.
// Tap it to open the Flag Hub (that's where you change the setting or approve).
//
// Setup: Scriptable app > + (top right) > paste all of this > tap the title and name it "Night Shift" > Done.
// Then: long-press your home screen > + > Scriptable > pick the medium size > Add Widget.
// Long-press the new widget > Edit Widget > Script > choose "Night Shift".

const RAW = "https://raw.githubusercontent.com/Feirzen/flag-hub/main/";
const HUB = "https://feirzen.github.io/flag-hub/";

const MODES = {
  off:   { label: "Off",    color: "#8a948e", note: "Skipping tonight" },
  light: { label: "Light",  color: "#2fbf7a", note: "Small fixes tonight" },
  big:   { label: "Go Big", color: "#9b7bff", note: "Bigger builds tonight" },
};
const FLAG = "#ff5a3c";

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

const status = await getJSON("status.json");
const data = await getJSON("data/flags.json");
const mode = MODES[(status && status.mode) || "light"] || MODES.light;
const waiting = data ? (data.proposals || []).filter(p => p.status === "waiting") : [];
const openFlags = data ? (data.flags || []).filter(f => f.status === "open").length : (status ? status.openFlags : 0);
const runs = data ? (data.runs || []).slice().sort((a, b) => (b.at || "").localeCompare(a.at || "")) : [];
const last = runs[0] || (status && status.lastRun);
const size = config.widgetFamily || "medium";

const ink = Color.dynamic(new Color("#1b211d"), new Color("#ecf1ee"));
const soft = Color.dynamic(new Color("#6f7a74"), new Color("#8d9892"));
const card = Color.dynamic(new Color("#ffffff"), new Color("#1d2420"));

const w = new ListWidget();
w.url = HUB;
w.backgroundColor = Color.dynamic(new Color("#f1f3f1"), new Color("#141916"));
w.setPadding(14, 15, 13, 15);

// top line
const top = w.addStack(); top.centerAlignContent();
const fl = top.addText("⚑"); fl.font = Font.boldSystemFont(13); fl.textColor = new Color(FLAG);
top.addSpacer(5);
const tt = top.addText("NIGHT SHIFT"); tt.font = Font.semiboldSystemFont(11); tt.textColor = soft;
top.addSpacer();
if (last && last.at) { const lt = top.addText("ran " + ago(last.at)); lt.font = Font.systemFont(11); lt.textColor = soft; }
w.addSpacer(8);

const body = w.addStack(); body.layoutHorizontally(); body.topAlignContent();

// left: the setting
const left = body.addStack(); left.layoutVertically();
const mrow = left.addStack(); mrow.centerAlignContent();
const dot = mrow.addText("●"); dot.font = Font.systemFont(15); dot.textColor = new Color(mode.color);
mrow.addSpacer(5);
const ml = mrow.addText(mode.label); ml.font = Font.boldRoundedSystemFont(26); ml.textColor = ink; ml.minimumScaleFactor = 0.7; ml.lineLimit = 1;
const mn = left.addText(mode.note); mn.font = Font.systemFont(12); mn.textColor = soft;
left.addSpacer(8);
const cnt = left.addText(`${openFlags} open flags`); cnt.font = Font.mediumSystemFont(12); cnt.textColor = soft;

if (size !== "small") {
  body.addSpacer(12);
  // right: proposals waiting
  const right = body.addStack(); right.layoutVertically();
  right.backgroundColor = card; right.cornerRadius = 12; right.setPadding(9, 10, 9, 10);
  right.size = new Size(170, 0);
  const wh = right.addStack(); wh.centerAlignContent();
  const wn = wh.addText(waiting.length ? String(waiting.length) : "0"); wn.font = Font.boldRoundedSystemFont(15); wn.textColor = waiting.length ? new Color(FLAG) : soft;
  wh.addSpacer(5);
  const wl = wh.addText("waiting on you"); wl.font = Font.semiboldSystemFont(12); wl.textColor = ink;
  right.addSpacer(5);
  if (!data) {
    const e = right.addText("Can't reach the Hub right now"); e.font = Font.systemFont(11); e.textColor = soft;
  } else if (!waiting.length) {
    const e = right.addText("Nothing to approve. You're all caught up."); e.font = Font.systemFont(11); e.textColor = soft; e.lineLimit = 2;
  } else {
    waiting.slice(0, 3).forEach(p => {
      const t = right.addText(`${p.project}: ${p.title}`); t.font = Font.systemFont(11); t.textColor = ink; t.lineLimit = 1;
      right.addSpacer(2);
    });
    if (waiting.length > 3) { const m = right.addText(`+${waiting.length - 3} more`); m.font = Font.systemFont(10); m.textColor = soft; }
  }
}

w.addSpacer();
if (last && last.summary && size !== "small") {
  const lr = w.addText("Last run: " + last.summary); lr.font = Font.systemFont(11); lr.textColor = soft; lr.lineLimit = 1;
}

w.refreshAfterDate = new Date(Date.now() + 30 * 60 * 1000);
if (config.runsInWidget) Script.setWidget(w); else await w.presentMedium();
Script.complete();
