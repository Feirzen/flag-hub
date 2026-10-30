/* =========================================================
   Feirzen kit: one shared file every app loads.
   - Settings gear (top right) that rolls out a tray
   - Look panel: Light / Dark / Sepia / Chameleon
   - Gecko token (top bar) when Chameleon is on: tap = new colors, lock = freeze
   - Flags: plant a flag on anything, or send general feedback

   Add to any app, right before </body>:
   <script src="https://cdn.jsdelivr.net/gh/Feirzen/flag-hub@main/kit/kit.js"
           data-app="study-decks" data-name="Study Decks" defer></script>

   Apps style themselves with these CSS variables:
   --bg --surface --surface2 --border --border2 --text --dim --muted
   --accent --accBg --ok --bad --star --scrim --shadow
   Optional hooks: Kit.tray.add({...}), Kit.theme.reroll(), Kit.theme.onChange(fn)
   ========================================================= */
(function () {
  if (window.Kit) return;
  const me = document.currentScript || document.querySelector('script[src*="kit.js"]');
  const APP = (me && me.dataset.app) || location.pathname.split("/").filter(Boolean)[0] || location.hostname;
  const NAME = (me && me.dataset.name) || document.title || APP;
  const REPO = "Feirzen/flag-hub";
  /* Flags-only mode for apps that already have their own look:
     data-look="off"  -> never touches the app's colors, no Look panel
     data-gear="off"  -> no gear; a small flag button sits bottom-left instead
                         (data-button="off" hides it when the app has its own flag entry)
     data-longpress   -> "on" brings back long-press (phone) and right-click (computer) to plant a flag.
                         Off by default: Plant a flag and Aim in the gear do the job without getting in the way. */
  const opt = k => (me && me.dataset[k]) || "";
  const LOOK = opt("look") !== "off";
  const GEAR = opt("gear") !== "off";
  const FLOATBTN = !GEAR && opt("button") !== "off";
  const LONGPRESS = opt("longpress") === "on";
  /* window.KitConfig (set by the app before this file runs) lets an app wire the kit into itself:
       gear: "#gear"        use the app's own settings button instead of adding a second one
       look: { get, set, tone, lock, reroll }   the app paints its own looks; the kit is just the controls
       tray: [items]        extra tray buttons; an item can be { id, icon, label, onClick } or a slider:
                            { id, icon, label, slider: { min, max, step, get, set }, toggle: { label, get, set } }
       more: fn             adds a "..." button that opens the app's full settings page
     The tray shows 5 buttons at most; past that, a "..." button holds the rest. */
  const CFG = window.KitConfig || {};
  const ADAPT = CFG.look && typeof CFG.look.get === "function" ? CFG.look : null;
  const ANCHOR_SEL = CFG.gear || (/^[#.]/.test(opt("gear")) ? opt("gear") : "");
  let anchor = null;
  const HIDE_WHEN = CFG.hideWhen || opt("hideWhen");   /* data-hide-when=".game-screen" hides the gear while that exists on the page */
  const KEY = "fk.look";

  /* ---------- Flag Hub store ----------
     Flags live in Feirzen/flag-hub data/flags.json. The Hub saves a GitHub token on
     this device once (localStorage, never in any repo). Every app on feirzen.github.io
     shares that storage, so with it saved, flags send in one tap. Without it, flags
     open a filled-in GitHub page instead. */
  const API = "https://api.github.com/repos/" + REPO + "/contents/";
  const TKEY = "fh.token";
  const b64e = str => { const b = new TextEncoder().encode(str); let s = ""; b.forEach(c => s += String.fromCharCode(c)); return btoa(s); };
  const b64d = b64 => new TextDecoder().decode(Uint8Array.from(atob(b64.replace(/\n/g, "")), c => c.charCodeAt(0)));
  const store = {
    token() { try { return localStorage.getItem(TKEY) || ""; } catch (e) { return ""; } },
    setToken(t) { try { t ? localStorage.setItem(TKEY, t.trim()) : localStorage.removeItem(TKEY); } catch (e) {} },
    async read(path) {
      const t = store.token();
      if (!t) {
        const r = await fetch("https://raw.githubusercontent.com/" + REPO + "/main/" + path + "?t=" + Date.now());
        if (!r.ok) throw new Error("read " + r.status);
        return { data: await r.json(), sha: null };
      }
      const r = await fetch(API + path + "?ref=main&t=" + Date.now(), { headers: { Authorization: "Bearer " + t, Accept: "application/vnd.github+json" }, cache: "no-store" });
      if (r.status === 401 || r.status === 403) { const e = new Error("token"); e.code = "token"; throw e; }
      if (!r.ok) throw new Error("read " + r.status);
      const j = await r.json();
      return { data: JSON.parse(b64d(j.content)), sha: j.sha };
    },
    /* read, change, save; retries if something else saved first */
    async change(path, fn, message) {
      const t = store.token();
      if (!t) { const e = new Error("token"); e.code = "token"; throw e; }
      for (let i = 0; i < 4; i++) {
        const { data, sha } = await store.read(path);
        const next = fn(data) || data;
        const r = await fetch(API + path, { method: "PUT", headers: { Authorization: "Bearer " + t, Accept: "application/vnd.github+json", "Content-Type": "application/json" },
          body: JSON.stringify({ message, content: b64e(JSON.stringify(next, null, 1) + "\n"), sha, branch: "main" }) });
        if (r.ok) return next;
        if (r.status === 401 || r.status === 403) { const e = new Error("token"); e.code = "token"; throw e; }
        if (r.status !== 409 && r.status !== 422) throw new Error("save " + r.status);
        await new Promise(res => setTimeout(res, 400 + i * 500));
      }
      throw new Error("busy");
    },
  };

  /* ---------- palettes ---------- */
  const FIXED = {
    light: { mode: "light", vars: { bg: "#f6f3ec", surface: "#ffffff", surface2: "#efebe2", border: "#e2ddd2", border2: "#c9c2b4", text: "#1f1d1a", dim: "#4a463f", muted: "#7a746a", accent: "#2f6fdf", accBg: "rgba(47,111,223,.10)", ok: "#16855b", bad: "#c23b3b", star: "#b8650f", scrim: "rgba(246,243,236,.82)", shadow: "rgba(40,35,20,.16)" } },
    dark: { mode: "dark", vars: { bg: "#0f0f13", surface: "#18181f", surface2: "#131318", border: "#26262f", border2: "#3a3a46", text: "#ececf1", dim: "#b9b9c4", muted: "#7d7d89", accent: "#7c8cff", accBg: "rgba(124,140,255,.14)", ok: "#4fd1a0", bad: "#f37b7b", star: "#f2b544", scrim: "rgba(15,15,19,.82)", shadow: "rgba(0,0,0,.5)" } },
    sepia: { mode: "dark", vars: { bg: "#2a211a", surface: "#352a21", surface2: "#2f251d", border: "#463829", border2: "#5e4c39", text: "#efe2cf", dim: "#d5c3a8", muted: "#a8957a", accent: "#e0a458", accBg: "rgba(224,164,88,.15)", ok: "#8fcf9a", bad: "#ef8b7a", star: "#f0c060", scrim: "rgba(42,33,26,.82)", shadow: "rgba(0,0,0,.45)" } },
  };
  const VARS = Object.keys(FIXED.dark.vars);
  function makeCham(tone) {
    const h = Math.floor(Math.random() * 360);
    const a = (h + 120 + Math.floor(Math.random() * 110)) % 360;
    const light = tone === "light" ? true : tone === "dark" ? false : Math.random() < 0.28;
    const H = (x, s, l, al) => `hsl(${x} ${s}% ${l}%${al ? " / " + al + "%" : ""})`;
    if (light) return { mode: "light", vars: { bg: H(h, 32, 95), surface: H(h, 42, 99), surface2: H(h, 26, 91), border: H(h, 22, 83), border2: H(h, 20, 66), text: H(h, 38, 11), dim: H(h, 18, 33), muted: H(h, 14, 50), accent: H(a, 66, 37), accBg: H(a, 66, 45, 11), ok: "hsl(158 72% 29%)", bad: "hsl(0 72% 44%)", star: "hsl(32 88% 34%)", scrim: H(h, 32, 95, 82), shadow: "rgba(40,35,20,.16)" } };
    return { mode: "dark", vars: { bg: H(h, 26, 7), surface: H(h, 22, 12), surface2: H(h, 26, 9), border: H(h, 18, 21), border2: H(h, 18, 33), text: H(h, 26, 95), dim: H(h, 14, 74), muted: H(h, 12, 50), accent: H(a, 74, 63), accBg: H(a, 74, 63, 14), ok: "hsl(158 66% 56%)", bad: "hsl(0 82% 73%)", star: "hsl(38 92% 55%)", scrim: H(h, 26, 7, 82), shadow: "rgba(0,0,0,.5)" } };
  }

  /* ---------- saved look ---------- */
  let look = { theme: "dark", tone: "any", lock: null };
  try { Object.assign(look, JSON.parse(localStorage.getItem(KEY) || "{}")); } catch (e) {}
  if (!FIXED[look.theme] && look.theme !== "chameleon") look.theme = "dark";
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(look)); } catch (e) {} };
  let current = null;
  const listeners = [];

  function paint(p) {
    current = p;
    const r = document.documentElement;
    VARS.forEach(v => r.style.setProperty("--" + v, p.vars[v]));
    r.dataset.theme = look.theme;
    r.dataset.mode = p.mode;
    r.style.colorScheme = p.mode;
    let m = document.querySelector('meta[name="theme-color"]');
    if (!m) { m = document.createElement("meta"); m.name = "theme-color"; document.head.appendChild(m); }
    m.content = p.vars.bg;
    listeners.forEach(fn => { try { fn(look.theme, p); } catch (e) {} });
  }
  const cur = () => {
    if (ADAPT) { try { const c = ADAPT.get() || {}; return { theme: c.theme || "dark", tone: c.tone || "any", locked: !!c.locked }; } catch (e) { return { theme: "dark", tone: "any", locked: false }; } }
    return { theme: look.theme, tone: look.tone, locked: !!look.lock };
  };
  function apply() {
    if (ADAPT) { syncUI(); return; }
    if (!LOOK) return;
    if (look.theme === "chameleon") paint(look.lock || makeCham(look.tone));
    else paint(FIXED[look.theme]);
    syncUI();
  }
  function reroll() {
    if (ADAPT) { if (cur().theme === "chameleon" && !cur().locked && ADAPT.reroll) ADAPT.reroll(); return; }
    if (!LOOK) return;
    if (look.theme !== "chameleon" || look.lock) return;
    paint(makeCham(look.tone));
  }
  function setTheme(t) { if (ADAPT) { ADAPT.set(t); syncUI(); return; } look.theme = t; look.lock = null; save(); apply(); }
  function setTone(t) { if (ADAPT) { ADAPT.tone && ADAPT.tone(t); syncUI(); return; } const was = !!look.lock; look.tone = t; paint(makeCham(t)); look.lock = was ? current : null; save(); syncUI(); }
  function toggleLock() { if (ADAPT) { ADAPT.lock && ADAPT.lock(!cur().locked); syncUI(); return; } look.lock = look.lock ? null : current; save(); syncUI(); }
  function newColors() { if (ADAPT) { if (cur().locked && ADAPT.lock) ADAPT.lock(false); ADAPT.reroll && ADAPT.reroll(); syncUI(); return; } if (look.lock) { look.lock = null; save(); } paint(makeCham(look.tone)); syncUI(); }

  /* paint before anything shows (no flash) */
  if (LOOK && !ADAPT) { if (look.theme === "chameleon") paint(look.lock || makeCham(look.tone)); else paint(FIXED[look.theme]); }

  /* ---------- icons ---------- */
  const SV = (d, w) => `<svg width="${w || 18}" height="${w || 18}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const IC = {
    gear: SV('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>', 19),
    paint: SV('<circle cx="13.5" cy="6.5" r="1.2"/><circle cx="17.5" cy="10.5" r="1.2"/><circle cx="8.5" cy="7.5" r="1.2"/><circle cx="6.5" cy="12.5" r="1.2"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.9 0 1.6-.7 1.6-1.6 0-.4-.2-.8-.4-1.1-.3-.3-.4-.7-.4-1.1 0-.9.7-1.6 1.6-1.6H16c3.1 0 5.6-2.5 5.6-5.6C21.6 6 17.3 2 12 2z"/>'),
    flag: SV('<path d="M4 22V4"/><path d="M4 4h12l-2 4 2 4H4"/>'),
    lock: SV('<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>', 12),
    unlock: SV('<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 7.5-2"/>', 12),
    more: SV('<circle cx="5" cy="12" r="1.6" fill="currentColor"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/><circle cx="19" cy="12" r="1.6" fill="currentColor"/>'),
    x: SV('<path d="M18 6 6 18M6 6l12 12"/>'),
    shuffle: SV('<path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/>', 15),
    pin: SV('<path d="M12 21s-6-5.3-6-10a6 6 0 0 1 12 0c0 4.7-6 10-6 10z"/><circle cx="12" cy="11" r="2"/>', 16),
    chat: SV('<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.4A8 8 0 1 1 21 12z"/>', 16),
  };
  const GECKO = w => `<svg width="${w}" height="${w}" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><g transform="rotate(-38 12 12) translate(0 -.4)"><path stroke="none" d="M12 .6c1.4.3 2.4 2 2.4 3.6 0 1-.4 1.8-.9 2.4.7 1.1 1.1 2.6 1.1 4.3 0 1.9-.4 3.4-1 4.5h-3.2c-.6-1.1-1-2.6-1-4.5 0-1.7.4-3.2 1.1-4.3-.5-.6-.9-1.4-.9-2.4 0-1.6 1-3.3 2.4-3.6z"/><path fill="none" stroke-width="2.6" d="M12 14.8c0 1.6 0 2.8.3 3.9"/><path fill="none" stroke-width="1.9" d="M12.3 18.7c.4 1.3 1.2 2.3 2.4 2.6"/><path fill="none" stroke-width="1.3" d="M14.7 21.3c1.4.3 2.6-.6 2.5-1.8-.1-.9-.9-1.4-1.6-1.1"/><path fill="none" stroke-width="1.7" d="M10.8 8.8L8.2 8.2 7.4 6.2M13.2 8.8l2.6-.6.8-2M10.7 13.4l-2.4 1.1-.5 2.1M13.3 13.4l2.4 1.1.5 2.1"/><g stroke="none"><circle cx="7.3" cy="5.8" r="1.15"/><circle cx="16.7" cy="5.8" r="1.15"/><circle cx="7.7" cy="17" r="1.15"/><circle cx="16.3" cy="17" r="1.15"/></g></g></svg>`;

  /* ---------- styles ---------- */
  const CSS = `
.fk,.fk *{box-sizing:border-box;font-family:inherit}
.fk-bar{position:fixed;top:0;right:0;z-index:2147483000;display:flex;flex-direction:column;align-items:flex-end;gap:7px;padding:calc(10px + env(safe-area-inset-top)) calc(12px + env(safe-area-inset-right)) 10px 10px;pointer-events:none}
.fk-bar>*{pointer-events:auto}
.fk-row{display:flex;gap:8px;align-items:center}
.fk-btn{width:38px;height:38px;border-radius:11px;background:var(--surface);border:1px solid var(--border);color:var(--dim);display:flex;align-items:center;justify-content:center;cursor:pointer;padding:0;transition:border-color .2s,color .2s,transform .12s,background .4s}
.fk-btn:active{transform:scale(.93)}
.fk-btn.on{color:var(--accent);border-color:var(--accent)}
.fk-gear svg{transition:transform .55s cubic-bezier(.175,.885,.32,1.275)}
.fk-bar.open .fk-gear{color:var(--accent);border-color:var(--accent)}
.fk-bar.open .fk-gear svg{transform:rotate(180deg)}
.fk-tray{display:flex;flex-direction:column;align-items:flex-end;gap:7px;pointer-events:none}
.fk-ti{opacity:0;visibility:hidden;transform:translateY(calc(-45px * (var(--i) + 1))) rotate(-1turn) scale(.45);transition:transform .34s cubic-bezier(.2,.8,.2,1) calc(var(--r) * 35ms),opacity .2s ease calc(var(--r) * 35ms),visibility 0s linear calc(.34s + var(--r) * 35ms)}
.fk-bar.open .fk-ti{opacity:1;visibility:visible;transform:none;pointer-events:auto;transition:transform .42s cubic-bezier(.175,.885,.32,1.275) calc(var(--i) * 55ms),opacity .18s ease calc(var(--i) * 55ms),visibility 0s}
.fk-hidden{opacity:0!important;visibility:hidden!important;pointer-events:none!important;transition:opacity .25s,visibility 0s .25s!important}
.fk-bar.fk-anchored{padding:0;position:fixed}
.fk-anchor svg{transition:transform .55s cubic-bezier(.175,.885,.32,1.275)}
.fk-anchor.fk-open svg{transform:rotate(180deg)}
.fk-tok.fk-tok-float{position:fixed;z-index:2147483000;height:34px}
.fk-aimbar{gap:8px}
.fk-aimbar .fk-aimgo{background:#ff5a3c;color:#fff;border-radius:16px;padding:6px 14px;font-weight:600;font-size:14px}
.fk-range{width:100%;accent-color:var(--accent);height:28px}
.fk-slider .fk-pill{justify-content:center}
.fk-float{position:fixed;left:calc(12px + env(safe-area-inset-left));bottom:calc(14px + env(safe-area-inset-bottom));z-index:2147482980;width:34px;height:34px;border-radius:50%;opacity:.55;transition:opacity .2s,transform .12s}
.fk-float:hover,.fk-float:focus-visible{opacity:1}
.fk-panel.fk-solo{top:auto;right:auto;left:50%;bottom:calc(64px + env(safe-area-inset-bottom));transform-origin:bottom center;translate:-50% 0}
.fk-tok{display:none;align-items:center;height:38px;border-radius:19px;background:#f4f4f1;border:1px solid rgba(0,0,0,.12);color:#111;padding:0 4px 0 4px;gap:0;box-shadow:0 2px 10px var(--shadow);transform-origin:right center;animation:fk-slide .42s cubic-bezier(.175,.885,.32,1.275)}
@keyframes fk-slide{from{opacity:0;transform:translateX(26px) scale(.55)}to{opacity:1;transform:none}}
.fk-tok.show{display:flex}
.fk-tok button{background:none;border:0;color:#111;height:32px;display:flex;align-items:center;justify-content:center;cursor:pointer;border-radius:16px;padding:0 6px}
.fk-tok .g svg{transition:transform .45s cubic-bezier(.175,.885,.32,1.275)}
.fk-tok .g.spin svg{transform:rotate(360deg)}
.fk-tok .l{width:28px;padding:0;color:#555}
.fk-tok .l.on{background:#111;color:#fff}
@keyframes fk-pop{from{transform:scale(.4);opacity:0}to{transform:none;opacity:1}}
.fk-panel{position:fixed;top:calc(58px + env(safe-area-inset-top));right:calc(62px + env(safe-area-inset-right));z-index:2147483001;width:min(300px,calc(100vw - 80px));background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:14px;color:var(--text);box-shadow:0 12px 40px var(--shadow);transform-origin:top right;animation:fk-in .28s cubic-bezier(.175,.885,.32,1.275)}
@keyframes fk-in{from{opacity:0;transform:scale(.85) translateY(-6px)}to{opacity:1;transform:none}}
.fk-h{display:flex;justify-content:space-between;align-items:center;font-size:15px;font-weight:600;margin:0 0 10px}
.fk-x{background:none;border:0;color:var(--muted);cursor:pointer;padding:4px;display:flex}
.fk-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.fk-tile{border:1px solid var(--border);background:var(--surface2);color:var(--text);border-radius:12px;padding:12px 6px 9px;display:flex;flex-direction:column;align-items:center;gap:6px;font-size:13px;cursor:pointer;transition:border-color .2s,transform .12s}
.fk-tile:active{transform:scale(.96)}
.fk-tile.on{border:2px solid var(--accent);padding:11px 5px 8px}
.fk-sw{width:30px;height:30px;border-radius:50%;border:1px solid rgba(128,128,128,.35)}
.fk-gk{color:#22a35a;height:30px;display:flex;align-items:center}
.fk-sub{font-size:12px;color:var(--muted);margin:12px 0 6px}
.fk-seg{display:flex;border:1px solid var(--border);border-radius:10px;overflow:hidden}
.fk-seg button{flex:1;border:0;background:transparent;color:var(--dim);font-size:13px;padding:8px 2px;cursor:pointer;transition:background .2s,color .2s}
.fk-seg button.on{background:var(--accent);color:var(--bg)}
.fk-pills{display:flex;gap:8px;margin-top:8px}
.fk-pill{flex:1;border:1px solid var(--border);background:transparent;color:var(--text);border-radius:10px;font-size:13px;padding:8px 6px;display:flex;align-items:center;justify-content:center;gap:6px;cursor:pointer}
.fk-pill.on{background:var(--accent);color:var(--bg);border-color:var(--accent)}
.fk-cham{overflow:hidden;transition:max-height .35s ease,opacity .25s ease;max-height:0;opacity:0}
.fk-cham.show{max-height:200px;opacity:1}
.fk-xtras{margin-top:12px;display:grid;gap:6px}
.fk-xt{display:flex;align-items:center;gap:10px;width:100%;text-align:left;border:1px solid var(--border);background:transparent;color:var(--text);border-radius:12px;padding:9px 11px;font-size:13.5px;cursor:pointer}
.fk-xt .fk-xi{font-size:18px;line-height:1}.fk-xt b{flex:1;font-weight:600}.fk-xt small{display:block;font-weight:400;color:var(--muted);font-size:11.5px;margin-top:1px}
.fk-sw2{flex:0 0 36px;height:21px;border-radius:11px;background:var(--border);position:relative;transition:background .22s ease}
.fk-sw2::after{content:"";position:absolute;top:2.5px;left:2.5px;width:16px;height:16px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.25);transition:transform .22s cubic-bezier(.2,.9,.3,1.3)}
.fk-xt.on .fk-sw2{background:var(--accent)}.fk-xt.on .fk-sw2::after{transform:translateX(15px)}
.fk-hint{font-size:12px;color:var(--muted);margin:8px 2px 0;line-height:1.45}
.fk-menu>button{width:100%;display:flex;align-items:center;gap:10px;border:1px solid var(--border);background:var(--surface2);color:var(--text);border-radius:12px;padding:12px;margin-bottom:8px;font-size:14px;text-align:left;cursor:pointer}
.fk-menu>button small{display:block;color:var(--muted);font-size:12px;margin-top:2px}
.fk-dim{position:fixed;inset:0;z-index:2147482990;background:rgba(0,0,0,.45);cursor:crosshair;animation:fk-fade .3s ease}
@keyframes fk-fade{from{opacity:0}to{opacity:1}}
.fk-tip{white-space:nowrap;position:fixed;left:50%;bottom:calc(24px + env(safe-area-inset-bottom));transform:translateX(-50%);z-index:2147483002;background:var(--surface);color:var(--text);border:1px solid var(--border);border-radius:24px;padding:10px 16px;font-size:14px;display:flex;gap:10px;align-items:center;box-shadow:0 8px 30px rgba(0,0,0,.35)}
.fk-tip button{background:none;border:0;color:var(--muted);cursor:pointer;font-size:13px}
.fk-hl{position:fixed;z-index:2147482995;border:2px solid #ff5a4f;border-radius:8px;background:rgba(255,90,79,.12);pointer-events:none;transition:all .12s ease}
.fk-pin{position:fixed;z-index:2147482996;color:#ff5a4f;pointer-events:none;animation:fk-drop .45s cubic-bezier(.175,.885,.32,1.275)}
@keyframes fk-drop{from{transform:translateY(-30px) scale(.5);opacity:0}to{transform:none;opacity:1}}
.fk-sheet{position:fixed;left:50%;bottom:calc(16px + env(safe-area-inset-bottom));transform:translateX(-50%);z-index:2147483003;width:min(420px,calc(100vw - 24px));background:var(--surface);color:var(--text);border:1px solid var(--border);border-radius:18px;padding:16px;box-shadow:0 16px 50px rgba(0,0,0,.4);animation:fk-up .32s cubic-bezier(.175,.885,.32,1.275)}
@keyframes fk-up{from{opacity:0;transform:translate(-50%,30px)}to{opacity:1;transform:translateX(-50%)}}
.fk-sheet textarea{width:100%;min-height:90px;border-radius:12px;border:1px solid var(--border);background:var(--surface2);color:var(--text);padding:10px;font-size:15px;resize:vertical;outline:none}
.fk-sheet textarea:focus{border-color:var(--accent)}
.fk-what{font-size:12px;color:var(--muted);margin:0 0 8px;word-break:break-word}
.fk-err{color:var(--bad);font-size:12px;margin:6px 2px 0;min-height:1em}
.fk-go{width:100%;margin-top:8px;border:0;background:var(--accent);color:var(--bg);border-radius:12px;padding:12px;font-size:15px;font-weight:600;cursor:pointer}
.fk-note{font-size:11px;color:var(--muted);margin:8px 2px 0;text-align:center}
@media (prefers-reduced-motion:reduce){.fk *,.fk-ti,.fk-panel,.fk-sheet,.fk-pin{animation:none!important;transition:none!important}}
`;

  /* ---------- tray + UI ---------- */
  const extra = [];
  let bar, tok, panel = null, mode = null;

  function el(html) { const d = document.createElement("div"); d.innerHTML = html.trim(); return d.firstChild; }

  function buildBar() {
    const st = document.createElement("style");
    st.textContent = CSS + (LOOK ? "" : ".fk{" + Object.entries(FIXED.dark.vars).map(([k, v]) => "--" + k + ":" + v).join(";") + ";color-scheme:dark}");
    document.head.appendChild(st);
    if (!GEAR) {
      if (FLOATBTN) {
        const fb = el(`<button class="fk fk-btn fk-float" aria-label="Raise a flag" title="Raise a flag">${IC.flag}</button>`);
        const off = parseInt(opt("offset"), 10);   /* data-offset="60" lifts it above a bottom tab bar */
        if (off > 0) fb.style.bottom = `calc(${off}px + env(safe-area-inset-bottom))`;
        fb.onclick = e => { e.stopPropagation(); openPanel("flag"); };
        document.body.appendChild(fb);
      }
      return;
    }
    anchor = ANCHOR_SEL ? document.querySelector(ANCHOR_SEL) : null;
    if (anchor) {
      /* use the app's own gear: the tray rolls out under it, and while it's open
         (and Chameleon is on) the gecko rolls out to its left. Nothing sits in the app's header. */
      bar = el(`<div class="fk fk-bar fk-anchored"><div class="fk-tray"></div></div>`);
      tok = el(`<div class="fk fk-tok fk-tok-float"><button class="g" aria-label="New colors" title="New colors">${GECKO(20)}</button><button class="l" aria-label="Freeze colors" title="Freeze colors">${IC.unlock}</button></div>`);
      document.body.appendChild(bar);
      document.body.appendChild(tok);
      anchor.classList.add("fk-anchor");
      anchor.setAttribute("aria-expanded", "false");
      anchor.addEventListener("click", e => { e.preventDefault(); toggleTray(); });
      addEventListener("resize", placeTray);
      addEventListener("scroll", placeTray, { passive: true });
    } else {
    bar = el(`<div class="fk fk-bar"><div class="fk-row">
      <div class="fk-tok"><button class="g" aria-label="New colors" title="New colors">${GECKO(22)}</button><button class="l" aria-label="Freeze colors" title="Freeze colors">${IC.unlock}</button></div>
      <button class="fk-btn fk-gear" aria-label="Settings" aria-expanded="false" title="Settings">${IC.gear}</button></div>
      <div class="fk-tray"></div></div>`);
    document.body.appendChild(bar);
    tok = bar.querySelector(".fk-tok");
    bar.querySelector(".fk-gear").onclick = () => toggleTray();
    }
    tok.querySelector(".g").onclick = () => {
      const g = tok.querySelector(".g");
      if (cur().locked) { g.animate([{ transform: "translateX(-3px)" }, { transform: "translateX(3px)" }, { transform: "none" }], { duration: 220 }); return; }
      g.classList.toggle("spin"); reroll();
    };
    tok.querySelector(".l").onclick = () => toggleLock();
    renderTray();
    syncUI();
    if (HIDE_WHEN) {
      let was = null; /* only act on a real change, or the observer re-triggers itself forever */
      const check = () => { const on = !!document.querySelector(HIDE_WHEN); if (on !== was) { was = on; setHidden("auto", on); } };
      new MutationObserver(check).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["class", "hidden"] });
      check();
    }
  }
  const hiddenBy = new Set();
  function setHidden(who, on) {
    on ? hiddenBy.add(who) : hiddenBy.delete(who);
    const h = hiddenBy.size > 0;
    document.querySelectorAll(".fk-bar,.fk-float,.fk-tok-float").forEach(n => n.classList.toggle("fk-hidden", h));
    if (h) { closePanel(); if (bar) { bar.classList.remove("open"); } }
  }
  function trayItems() {
    const all = [
      ...(LOOK ? [{ id: "look", icon: IC.paint, label: "Look", onClick: () => openPanel("look") }] : []),
      { id: "flag", icon: IC.flag, label: "Flag", onClick: () => openPanel("flag") },
      ...(CFG.tray || []),
      ...extra,
    ].map((it, i) => it.slider ? { ...it, id: it.id || "s" + i, onClick: () => openPanel("slider", it) } : it);
    const moreFn = CFG.more;
    if (!moreFn && all.length <= 5) return all;
    const keep = all.slice(0, 4), over = all.slice(4);
    return [...keep, { id: "more", icon: IC.more, label: moreFn ? "All settings" : "More",
      onClick: () => { if (moreFn) { closeAll(); setTimeout(moreFn, 0); } else openPanel("more", over); } }];
  }
  function renderTray() {
    if (!bar) return;
    const tray = bar.querySelector(".fk-tray");
    const items = trayItems(); const n = items.length;
    tray.innerHTML = "";
    items.forEach((it, i) => {
      const w = el(`<div class="fk-ti" style="--i:${i};--r:${n - 1 - i}"><button class="fk-btn" aria-label="${it.label}" title="${it.label}">${it.icon}</button></div>`);
      w.firstChild.onclick = e => { e.stopPropagation(); it.onClick(); };
      w.firstChild.dataset.id = it.id || "";
      tray.appendChild(w);
    });
  }
  function placeTray() {
    if (!anchor || !bar) return;
    const r = anchor.getBoundingClientRect();
    bar.style.top = r.bottom + 6 + "px";
    bar.style.right = Math.max(4, innerWidth - r.right) + "px";
    if (tok) { tok.style.top = (r.top + r.height / 2 - 17) + "px"; tok.style.right = Math.max(4, innerWidth - r.left + 6) + "px"; }
    if (panel && !panel.classList.contains("fk-solo")) { panel.style.top = r.bottom + 6 + "px"; panel.style.right = Math.max(8, innerWidth - r.right + 50) + "px"; }
  }
  function toggleTray(force) {
    const open = force === undefined ? !bar.classList.contains("open") : force;
    if (open) placeTray();
    bar.classList.toggle("open", open);
    const g = anchor || bar.querySelector(".fk-gear");
    if (g) { g.setAttribute("aria-expanded", open); g.classList.toggle("fk-open", open); }
    if (!open) closePanel();
    syncUI();
  }
  function closeAll() { closePanel(); if (bar && bar.classList.contains("open")) toggleTray(false); }
  function closePanel() { if (panel) { panel.remove(); panel = null; } bar && bar.querySelectorAll(".fk-tray .fk-btn").forEach(b => b.classList.remove("on")); }

  function openPanel(which, arg) {
    const key = which + (arg && arg.id ? ":" + arg.id : "");
    const was = panel && panel.dataset.which;
    closePanel();
    if (was === key) return;
    panel = which === "look" ? lookPanel() : which === "slider" ? sliderPanel(arg) : which === "more" ? morePanel(arg) : flagMenu();
    panel.dataset.which = key;
    document.body.appendChild(panel);
    if (!bar) { panel.classList.add("fk-solo"); return; }
    placeTray();
    if (which === "slider" && arg) { const b0 = bar.querySelector(`.fk-tray [data-id="${arg.id}"]`); if (b0) b0.classList.add("on"); }
    const b = bar.querySelector(`.fk-tray [data-id="${which}"]`); if (b) b.classList.add("on");
    syncUI();
  }

  function sliderPanel(it) {
    const sl = it.slider, tg = it.toggle;
    const p = el(`<div class="fk fk-panel fk-slider" role="dialog" aria-label="${esc(it.label)}">
      <div class="fk-h"><span>${esc(it.label)}</span><button class="fk-x" aria-label="Close">${IC.x}</button></div>
      ${tg ? `<button class="fk-pill fk-tg" style="width:100%;margin:0 0 10px"></button>` : ""}
      <input type="range" class="fk-range" min="${sl.min ?? 0}" max="${sl.max ?? 1}" step="${sl.step ?? 0.05}" aria-label="${esc(it.label)}">
      <div class="fk-hint fk-val"></div></div>`);
    const rg = p.querySelector(".fk-range"), val = p.querySelector(".fk-val");
    const show = () => {
      const v = Number(sl.get()); rg.value = v;
      const pct = Math.round(((v - (sl.min ?? 0)) / ((sl.max ?? 1) - (sl.min ?? 0))) * 100);
      val.textContent = sl.format ? sl.format(v) : pct + "%";
      if (tg) { const on = !!tg.get(); const b = p.querySelector(".fk-tg"); b.classList.toggle("on", on); b.textContent = (tg.label || "On") + (on ? ": on" : ": off"); rg.disabled = !on; rg.style.opacity = on ? 1 : .45; }
    };
    rg.addEventListener("input", () => { sl.set(Number(rg.value)); show(); });
    if (tg) p.querySelector(".fk-tg").onclick = () => { tg.set(!tg.get()); show(); };
    p.querySelector(".fk-x").onclick = closePanel;
    show();
    return p;
  }
  function morePanel(items) {
    const p = el(`<div class="fk fk-panel fk-menu" role="dialog" aria-label="More">
      <div class="fk-h"><span>More</span><button class="fk-x" aria-label="Close">${IC.x}</button></div></div>`);
    (items || []).forEach(it => {
      const b = el(`<button>${it.icon}<span>${esc(it.label)}</span></button>`);
      b.onclick = () => { if (it.slider) openPanel("slider", it); else { closePanel(); it.onClick(); } };
      p.appendChild(b);
    });
    p.querySelector(".fk-x").onclick = closePanel;
    return p;
  }
  function lookPanel() {
    const t = (k, label, sw) => `<button class="fk-tile" data-t="${k}">${sw}<span>${esc((ADAPT && ADAPT.labels && ADAPT.labels[k]) || label)}</span></button>`;
    const p = el(`<div class="fk fk-panel" role="dialog" aria-label="Look">
      <div class="fk-h"><span>Look</span><button class="fk-x" aria-label="Close">${IC.x}</button></div>
      <div class="fk-grid">
        ${t("light", "Light", '<span class="fk-sw" style="background:#f6f3ec"></span>')}
        ${t("dark", "Dark", '<span class="fk-sw" style="background:#0f0f13"></span>')}
        ${t("sepia", "Sepia", '<span class="fk-sw" style="background:#2a211a"></span>')}
        ${t("chameleon", "Chameleon", `<span class="fk-gk">${GECKO(30)}</span>`)}
      </div>
      <div class="fk-cham">
        <div class="fk-sub">Chameleon tone</div>
        <div class="fk-seg"><button data-tone="any">Any</button><button data-tone="light">Light</button><button data-tone="dark">Dark</button></div>
        <div class="fk-pills"><button class="fk-pill" data-a="lock"></button><button class="fk-pill" data-a="new">${IC.shuffle}New colors</button></div>
        <p class="fk-hint">New colors every screen. While settings are open, the gecko next to the gear does the same: tap it to shuffle, tap its lock to freeze.</p>
      </div>${xtras()}</div>`);
    p.querySelector(".fk-x").onclick = closePanel;
    p.querySelectorAll("[data-t]").forEach(b => b.onclick = () => setTheme(b.dataset.t));
    p.querySelectorAll("[data-tone]").forEach(b => b.onclick = () => setTone(b.dataset.tone));
    p.querySelector('[data-a="lock"]').onclick = toggleLock;
    p.querySelector('[data-a="new"]').onclick = newColors;
    p.querySelectorAll("[data-x]").forEach(b => b.onclick = () => {
      const x = (ADAPT.extras || [])[+b.dataset.x]; if (!x) return;
      try { x.set(!x.get()); } catch (e) {}
      b.classList.toggle("on", !!x.get());
    });
    return p;
  }
  /* optional app toggles under the tiles: KitConfig.look.extras = [{ label, sub, icon, get(), set(on) }] */
  function xtras() {
    const xs = (ADAPT && Array.isArray(ADAPT.extras)) ? ADAPT.extras : [];
    if (!xs.length) return "";
    return `<div class="fk-xtras">${xs.map((x, i) => { let on = false; try { on = !!x.get(); } catch (e) {}
      return `<button class="fk-xt ${on ? "on" : ""}" data-x="${i}"><span class="fk-xi">${x.icon || ""}</span><b>${esc(x.label || "")}${x.sub ? `<small>${esc(x.sub)}</small>` : ""}</b><span class="fk-sw2"></span></button>`; }).join("")}</div>`;
  }

  function syncUI() {
    if (!bar) return;
    const c = cur();
    const isC = c.theme === "chameleon";
    tok.classList.toggle("show", isC && bar.classList.contains("open"));
    const l = tok.querySelector(".l");
    l.classList.toggle("on", c.locked); l.innerHTML = c.locked ? IC.lock : IC.unlock;
    l.title = c.locked ? "Colors frozen (tap to unfreeze)" : "Freeze colors";
    if (panel && panel.dataset.which === "look") {
      panel.querySelectorAll("[data-t]").forEach(b => b.classList.toggle("on", b.dataset.t === c.theme));
      panel.querySelector(".fk-cham").classList.toggle("show", isC);
      panel.querySelectorAll("[data-tone]").forEach(b => b.classList.toggle("on", b.dataset.tone === c.tone));
      const lk = panel.querySelector('[data-a="lock"]');
      lk.classList.toggle("on", c.locked);
      lk.innerHTML = (c.locked ? IC.lock : IC.unlock) + (c.locked ? "Frozen" : "Changing");
    }
  }

  /* ---------- flags ---------- */
  function flagMenu() {
    const p = el(`<div class="fk fk-panel fk-menu" role="dialog" aria-label="Flags">
      <div class="fk-h"><span>Raise a flag</span><button class="fk-x" aria-label="Close">${IC.x}</button></div>
      <button data-a="plant">${IC.pin}<span>Plant a flag<small>Tap the exact thing you mean</small></span></button>
      <button data-a="general">${IC.chat}<span>General feedback<small>About ${esc(NAME)} as a whole</small></span></button>
      ${LONGPRESS ? `<p class="fk-hint" style="margin-top:0">Tip: long-press anything (or right-click on a computer) to plant a flag right there.</p>` : ""}</div>`);
    p.querySelector(".fk-x").onclick = closePanel;
    p.querySelector('[data-a="plant"]').onclick = () => { closeAll(); startPlant(); };
    p.querySelector('[data-a="general"]').onclick = () => { closeAll(); openSheet(null); };
    return p;
  }

  let dim = null, hl = null, tip = null, pin = null, sheet = null, planting = false;
  /* the gear and tray sit above the dimmer, so catch taps on them while planting */
  function plantKitClick(e) {
    if (!planting) return;
    const t = e.target.closest && e.target.closest(".fk-bar button,.fk-bar .fk-tok,.fk-float");
    if (!t) return;
    e.preventDefault(); e.stopPropagation();
    place(t, e.clientX, e.clientY);
  }
  function plantKitHover(e) {
    if (!planting) return;
    const t = e.target.closest && e.target.closest(".fk-bar button,.fk-float");
    if (t) box(t);
  }
  function clearFlagUI() { document.removeEventListener("click", plantKitClick, true); document.removeEventListener("mousemove", plantKitHover, true); planting = false; [dim, hl, tip, pin, sheet].forEach(n => n && n.remove()); dim = hl = tip = pin = sheet = null; document.removeEventListener("keydown", onEsc); }
  function onEsc(e) { if (e.key === "Escape") clearFlagUI(); }

  function under(x, y) {
    if (dim) dim.style.pointerEvents = "none";
    let t = document.elementFromPoint(x, y);
    if (dim) dim.style.pointerEvents = "";
    if (t && t.closest && t.closest(".fk") && !t.closest(".fk-bar,.fk-float")) t = null;
    return t;
  }
  function box(t) {
    if (!t) { if (hl) hl.style.opacity = 0; return; }
    const r = t.getBoundingClientRect();
    if (!hl) { hl = el('<div class="fk-hl"></div>'); document.body.appendChild(hl); }
    Object.assign(hl.style, { opacity: 1, left: r.left - 3 + "px", top: r.top - 3 + "px", width: r.width + 6 + "px", height: r.height + 6 + "px" });
  }
  let aimBar = null;
  function startPlant() {
    clearFlagUI();
    if (aimBar) aimBar.remove();
    aimBar = el(`<div class="fk fk-tip fk-aimbar" role="status">${IC.flag}<span>Go to the spot, then tap Aim</span><button class="fk-aimgo">Aim</button><button class="fk-aimx">Cancel</button></div>`);
    aimBar.querySelector(".fk-aimgo").onclick = e => { e.stopPropagation(); aimBar.remove(); aimBar = null; startAim(); };
    aimBar.querySelector(".fk-aimx").onclick = e => { e.stopPropagation(); aimBar.remove(); aimBar = null; };
    document.body.appendChild(aimBar);
  }
  function startAim() {
    clearFlagUI();
    dim = el('<div class="fk-dim" aria-hidden="true"></div>');
    tip = el(`<div class="fk fk-tip">${IC.flag}<span>Tap what you want to flag</span><button>Cancel</button></div>`);
    tip.querySelector("button").onclick = clearFlagUI;
    document.body.append(dim, tip);
    planting = true;
    document.addEventListener("keydown", onEsc);
    document.addEventListener("click", plantKitClick, true);
    document.addEventListener("mousemove", plantKitHover, true);
    dim.addEventListener("mousemove", e => { if (planting) box(under(e.clientX, e.clientY)); });
    dim.addEventListener("click", e => { if (!planting) return; const t = under(e.clientX, e.clientY); if (t) place(t, e.clientX, e.clientY); });
  }
  function place(t, x, y) {
    planting = false;
    document.removeEventListener("click", plantKitClick, true);
    document.removeEventListener("mousemove", plantKitHover, true);
    if (!dim) { dim = el('<div class="fk-dim" aria-hidden="true"></div>'); document.body.appendChild(dim); }
    if (tip) { tip.remove(); tip = null; }
    box(t);
    pin = el(`<div class="fk-pin" style="left:${x - 4}px;top:${y - 26}px">${SV('<path d="M4 22V4"/><path d="M4 4h12l-2 4 2 4H4" fill="currentColor"/>', 28)}</div>`);
    document.body.appendChild(pin);
    dim.onclick = null;
    setTimeout(() => openSheet(t), 250);
  }

  function describe(t) {
    if (!t) return null;
    const path = [];
    let n = t;
    while (n && n.nodeType === 1 && n !== document.body && path.length < 6) {
      let s = n.tagName.toLowerCase();
      if (n.id) { s += "#" + n.id; path.unshift(s); break; }
      const cls = [...n.classList].filter(c => !c.startsWith("fk")).slice(0, 2);
      if (cls.length) s += "." + cls.join(".");
      const sib = n.parentElement ? [...n.parentElement.children].filter(c => c.tagName === n.tagName) : [];
      if (sib.length > 1) s += `:nth-of-type(${sib.indexOf(n) + 1})`;
      path.unshift(s); n = n.parentElement;
    }
    if (t.closest(".fk-bar,.fk-float")) { const b = t.closest("button") || t; return { selector: "kit: " + (b.getAttribute("aria-label") || "settings gear"), text: "Settings gear menu (shared kit)", kit: true }; }
    const text = (t.innerText || t.getAttribute("aria-label") || t.getAttribute("alt") || "").replace(/\s+/g, " ").trim().slice(0, 120);
    return { selector: path.join(" > "), text };
  }

  function openSheet(t) {
    const d = describe(t);
    if (!dim) { dim = el('<div class="fk-dim" aria-hidden="true"></div>'); document.body.appendChild(dim); }
    dim.onclick = clearFlagUI; document.addEventListener("keydown", onEsc);
    sheet = el(`<div class="fk fk-sheet" role="dialog" aria-label="Flag">
      <div class="fk-h"><span>${d ? "Flag this spot" : "General feedback"}</span><button class="fk-x" aria-label="Close">${IC.x}</button></div>
      <p class="fk-what">${d ? (d.text ? "“" + esc(d.text) + "”" : esc(d.selector)) : esc(NAME) + " overall"}</p>
      <textarea placeholder="${d ? "What looks off, or what's your idea?" : "What would make this better?"}"></textarea>
      <div class="fk-err"></div>
      <button class="fk-go">Send flag</button>
      <p class="fk-note">Opens GitHub with everything filled in. Tap Submit there.</p></div>`);
    document.body.appendChild(sheet);
    const ta = sheet.querySelector("textarea"), err = sheet.querySelector(".fk-err");
    setTimeout(() => ta.focus(), 50);
    ta.oninput = () => { err.textContent = ""; };
    sheet.querySelector(".fk-x").onclick = clearFlagUI;
    if (store.token()) sheet.querySelector(".fk-note").textContent = "Goes straight to your Flag Hub.";
    sheet.querySelector(".fk-go").onclick = async () => {
      const note = ta.value.trim();
      if (!note) { err.textContent = "Type a quick note first."; ta.focus(); return; }
      if (store.token()) {
        const go = sheet.querySelector(".fk-go"); go.disabled = true; go.textContent = "Sending…";
        const flag = { id: "f" + Date.now().toString(36), project: d && d.kit ? "Flag Hub" : NAME, text: note, kind: "fix", status: "open", source: "app", created: new Date().toISOString(),
          where: { app: APP, page: location.href, element: d ? d.selector : null, says: d ? d.text : null,
            screen: innerWidth + "x" + innerHeight + (/Mobi|iPhone|Android/.test(navigator.userAgent) ? " phone" : " computer"), look: cur().theme } };
        try {
          await store.change("data/flags.json", data => { data.flags = data.flags || []; data.flags.unshift(flag); }, "Flag: " + NAME);
          clearFlagUI(); toast("Flag sent to your Hub.");
          return;
        } catch (e) { go.disabled = false; go.textContent = "Send flag"; if (e.code !== "token") { err.textContent = "Couldn't reach the Hub. Opening GitHub instead."; } }
      }
      window.open(issueURL(note, d), "_blank", "noopener");
      clearFlagUI();
      toast("Flag ready. Tap Submit on GitHub.");
    };
  }

  function issueURL(note, d) {
    const short = note.replace(/\s+/g, " ").slice(0, 60) + (note.length > 60 ? "…" : "");
    const title = `[${d && d.kit ? "flag-hub" : APP}] ${d ? "" : "(general) "}${short}`;
    const lines = [
      note, "", "---",
      `**App:** ${NAME} (\`${APP}\`)`,
      `**Type:** ${d ? "planted flag" : "general feedback"}`,
      `**Page:** ${location.href}`,
    ];
    if (d) { lines.push(`**Element:** \`${d.selector}\``); if (d.text) lines.push(`**Says:** ${d.text}`); }
    lines.push(`**Screen:** ${innerWidth}×${innerHeight}, ${/Mobi|iPhone|Android/.test(navigator.userAgent) ? "phone" : "computer"}`);
    lines.push(`**Look:** ${cur().theme}${cur().theme === "chameleon" ? " (" + cur().tone + ")" : ""}`);
    lines.push(`**When:** ${new Date().toLocaleString()}`);
    lines.push("", "<!-- flag-kit v1 -->");
    const q = new URLSearchParams({ title, body: lines.join("\n"), labels: "flag" });
    return `https://github.com/${REPO}/issues/new?${q.toString()}`;
  }

  function toast(msg) {
    const t = el(`<div class="fk fk-tip">${IC.flag}<span>${esc(msg)}</span></div>`);
    document.body.appendChild(t);
    setTimeout(() => { t.style.transition = "opacity .4s"; t.style.opacity = 0; setTimeout(() => t.remove(), 450); }, 2600);
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }

  /* long-press (phone) and right-click (computer) plant a flag right there */
  let lp = null, lpXY = null;
  function cancelLP() { clearTimeout(lp); lp = null; }
  document.addEventListener("touchstart", e => {
    if (!LONGPRESS) return;
    if (e.touches.length !== 1 || e.target.closest(".fk") || e.target.closest("input,textarea,select,[contenteditable]")) return;
    const p = e.touches[0]; lpXY = [p.clientX, p.clientY];
    lp = setTimeout(() => { lp = null; const t = under(lpXY[0], lpXY[1]); if (t) { if (navigator.vibrate) navigator.vibrate(15); place(t, lpXY[0], lpXY[1]); } }, 650);
  }, { passive: true });
  document.addEventListener("touchmove", e => { if (lp && lpXY) { const p = e.touches[0]; if (Math.hypot(p.clientX - lpXY[0], p.clientY - lpXY[1]) > 10) cancelLP(); } }, { passive: true });
  document.addEventListener("touchend", cancelLP, { passive: true });
  document.addEventListener("contextmenu", e => {
    if (!LONGPRESS) return; /* the normal right-click and long-press menus stay untouched */
    if (e.target.closest(".fk") || e.target.closest("input,textarea,select,[contenteditable]") || e.shiftKey) return;
    if ("ontouchstart" in window && matchMedia("(pointer:coarse)").matches) { e.preventDefault(); return; }
    e.preventDefault(); place(e.target, e.clientX, e.clientY);
  });

  /* close the tray when tapping elsewhere */
  document.addEventListener("click", e => {
    const path = e.composedPath();
    if (path.some(n => n.classList && n.classList.contains("fk")) || (anchor && path.includes(anchor))) return;
    if (panel) closePanel(); else if (bar && bar.classList.contains("open")) toggleTray(false);
  });

  /* chameleon: new colors when the screen changes */
  addEventListener("hashchange", reroll);
  addEventListener("popstate", reroll);

  window.Kit = {
    app: APP,
    store,
    theme: {
      get: () => ({ ...cur(), palette: current }),
      refresh: () => syncUI(),
      set: setTheme, reroll,
      onChange: fn => { listeners.push(fn); if (current) fn(look.theme, current); },
    },
    tray: { add: item => { extra.push(item); renderTray(); } },
    hide: () => setHidden("app", true),
    show: () => setHidden("app", false),
    flag: { plant: startPlant, general: () => openSheet(null), menu: () => setTimeout(() => openPanel("flag"), 0) },
  };

  if (document.body) buildBar(); else document.addEventListener("DOMContentLoaded", buildBar);
})();
