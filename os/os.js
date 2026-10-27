/* Claude OS: desk display for Steven's old iPhone.
   Swipe through panels (it loops forever). Live data comes from os/data (locked so only this
   phone can read it) and from Flag Hub. Timers, alarms and settings live on this device. */
(() => {
  const VERSION = "2.5"; /* bump together with os/version.json so the desk phone reloads */
  const RAW = "https://raw.githubusercontent.com/Feirzen/flag-hub/main/";
  const HUB = "https://feirzen.github.io/flag-hub/";
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const load = (k, d) => { try { const v = localStorage.getItem("cos." + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } };
  const save = (k, v) => { try { localStorage.setItem("cos." + k, JSON.stringify(v)); } catch (e) {} };
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const pad = n => String(n).padStart(2, "0");
  const setAll = (sel, html) => $$(sel).forEach(n => { if (n.innerHTML !== html) n.innerHTML = html; });

  const S = Object.assign({
    h24: false, idleAfter: 90, night: true, nightFrom: "22:00", nightTo: "06:30", nightLevel: 0.55, vol: 0.6, msgChime: true, motion: "full",
    bg: "rotate", bgEvery: 30, calView: 3, moods: true, seasonal: true,
    nightMode: true, nmFrom: "00:00", nmTo: "06:00", idleDim: 60, focusPlan: "25/5",
    panels: { today: true, calendar: true, focus: true, inbox: true, flags: true, music: true },
    glance: { next: true, inbox: true, flags: true, blueprints: false, music: false, study: true, workout: true },
    music: [],
  }, load("settings", {}));
  if (!S.v23) { S.glance = Object.assign({}, S.glance, { blueprints: true }); S.v23 = true; }
  ["panels", "glance"].forEach(k => S[k] = Object.assign(k === "panels" ? { focus: true } : { focus: false, study: true, workout: true }, S[k]));
  const saveS = () => save("settings", S);
  window.OSSettings = S;

  /* ---------- icons ---------- */
  const I = {
    clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="12" cy="13" r="7.5"/><path d="M12 9v4l2.6 1.6M4.5 5.5l2-2M19.5 5.5l-2-2"/></svg>',
    timer: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="12" cy="13.5" r="7.5"/><path d="M12 9.5v4l2.6 1.6M9.5 2.8h5M12 2.8V6"/></svg>',
    alarm: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="12" cy="13" r="7.5"/><path d="M12 9v4l-2.4 1.8M4.5 4.5l2.6-2M19.5 4.5l-2.6-2"/></svg>',
    moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10Z"/><path d="M17 3.5v3M15.5 5h3"/></svg>',
    spark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><path d="M12 3c.6 4.2 2.8 6.4 7 7-4.2.6-6.4 2.8-7 7-.6-4.2-2.8-6.4-7-7 4.2-.6 6.4-2.8 7-7Z"/><path d="M19 16c.3 1.5 1 2.2 2.5 2.5-1.5.3-2.2 1-2.5 2.5-.3-1.5-1-2.2-2.5-2.5 1.5-.3 2.2-1 2.5-2.5Z"/></svg>',
    gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  };
  const WX = {
    clear: '<svg viewBox="0 0 32 32" fill="none" stroke="#ffd36e" stroke-width="1.8" stroke-linecap="round"><circle cx="16" cy="16" r="5.5" fill="#ffd36e33"/><path d="M16 3.5v3M16 25.5v3M3.5 16h3M25.5 16h3M7.2 7.2l2.1 2.1M22.7 22.7l2.1 2.1M7.2 24.8l2.1-2.1M22.7 9.3l2.1-2.1"/></svg>',
    night: '<svg viewBox="0 0 32 32" fill="none" stroke="#c9d4ff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M25 19.5A10 10 0 0 1 12.5 7a10 10 0 1 0 12.5 12.5Z" fill="#c9d4ff22"/></svg>',
    partly: '<svg viewBox="0 0 32 32" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><g stroke="#ffd36e"><circle cx="12" cy="12" r="4.5" fill="#ffd36e33"/><path d="M12 3.5v2M3.5 12h2M6 6l1.4 1.4M18 6l-1.4 1.4"/></g><path stroke="#e6ebff" fill="#e6ebff22" d="M10.5 26h12a4.5 4.5 0 0 0 .4-9 6 6 0 0 0-11.5 1.6A3.8 3.8 0 0 0 10.5 26Z"/></svg>',
    cloudy: '<svg viewBox="0 0 32 32" fill="none" stroke="#e6ebff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path fill="#e6ebff22" d="M9 25h14a5 5 0 0 0 .5-10A7 7 0 0 0 10 16.6 4.3 4.3 0 0 0 9 25Z"/></svg>',
    rain: '<svg viewBox="0 0 32 32" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path stroke="#e6ebff" fill="#e6ebff22" d="M9 20h14a5 5 0 0 0 .5-10A7 7 0 0 0 10 11.6 4.3 4.3 0 0 0 9 20Z"/><path stroke="#7fc8ff" d="M11 23.5l-1 3M16 23.5l-1 3M21 23.5l-1 3"/></svg>',
    storm: '<svg viewBox="0 0 32 32" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path stroke="#e6ebff" fill="#e6ebff22" d="M9 19h14a5 5 0 0 0 .5-10A7 7 0 0 0 10 10.6 4.3 4.3 0 0 0 9 19Z"/><path stroke="#ffd36e" d="M16.5 20.5 14 25h4l-2.5 4.5"/></svg>',
    snow: '<svg viewBox="0 0 32 32" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path stroke="#e6ebff" fill="#e6ebff22" d="M9 19h14a5 5 0 0 0 .5-10A7 7 0 0 0 10 10.6 4.3 4.3 0 0 0 9 19Z"/><g stroke="#ffffff"><path d="M11 23v4M9 25h4M21 23v4M19 25h4M16 25v4M14 27h4"/></g></svg>',
    fog: '<svg viewBox="0 0 32 32" fill="none" stroke="#e6ebff" stroke-width="1.8" stroke-linecap="round"><path d="M6 12h20M4 17h24M7 22h18"/></svg>',
    wind: '<svg viewBox="0 0 32 32" fill="none" stroke="#e6ebff" stroke-width="1.8" stroke-linecap="round"><path d="M4 12h15a3.5 3.5 0 1 0-3.5-3.5M4 17h21a3.5 3.5 0 1 1-3.5 3.5M4 22h9"/></svg>',
  };
  const wxIcon = (k, night) => WX[(k === "clear" && night) ? "night" : (WX[k] ? k : "partly")];

  /* ---------- time helpers ---------- */
  const mins = hhmm => { const [h, m] = String(hhmm || "0:0").split(":").map(Number); return (h || 0) * 60 + (m || 0); };
  const nowMins = d => d.getHours() * 60 + d.getMinutes();
  const fmtHM = hhmm => { const m = mins(hhmm), h = Math.floor(m / 60) % 24, mm = pad(m % 60); return S.h24 ? pad(h) + ":" + mm : ((h % 12) || 12) + ":" + mm + (h < 12 ? " AM" : " PM"); };
  const fmtShort = hhmm => { const m = mins(hhmm), h = Math.floor(m / 60) % 24, mm = m % 60; return S.h24 ? pad(h) + ":" + pad(mm) : ((h % 12) || 12) + (mm ? ":" + pad(mm) : "") + (h < 12 ? "a" : "p"); };
  const fmtDur = ms => { const s = Math.max(0, Math.ceil(ms / 1000)), h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60; return h ? h + ":" + pad(m) + ":" + pad(x) : m + ":" + pad(x); };
  const ago = iso => { const m = Math.round((Date.now() - new Date(iso)) / 60000); if (m < 1) return "just now"; if (m < 60) return m + "m ago"; const h = Math.round(m / 60); return h < 24 ? h + "h ago" : Math.round(h / 24) + "d ago"; };
  const isNight = d => { if (!S.night) return false; const n = nowMins(d), a = mins(S.nightFrom), b = mins(S.nightTo); return a > b ? (n >= a || n < b) : (n >= a && n < b); };
  const dayKey = d => d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  const parseDay = s => { const [y, m, d] = String(s).split("-").map(Number); return new Date(y, (m || 1) - 1, d || 1); };

  /* =========================================================
     Sound: soft synthesized bells (needs one tap to unlock on iPhone)
     ========================================================= */
  const Sound = (() => {
    let ctx = null, master = null;
    function unlock() {
      try { if (navigator.audioSession) navigator.audioSession.type = "playback"; } catch (e) {} /* play even when the ringer switch is on silent */
      try {
        if (!ctx) {
          ctx = new (window.AudioContext || window.webkitAudioContext)();
          master = ctx.createGain(); const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 5200;
          master.connect(lp); lp.connect(ctx.destination);
        }
        if (ctx.state === "suspended") ctx.resume();
        const b = ctx.createBuffer(1, 1, 22050), s = ctx.createBufferSource(); s.buffer = b; s.connect(ctx.destination); s.start(0);
      } catch (e) {}
    }
    function bell(f, when, len, gain) {
      [[1, .6], [2.01, .22], [2.76, .14], [5.4, .05]].forEach(([r, gm]) => {
        const o = ctx.createOscillator(), v = ctx.createGain();
        o.type = "sine"; o.frequency.value = f * r;
        v.gain.setValueAtTime(0, when); v.gain.linearRampToValueAtTime(gain * gm, when + .012); v.gain.exponentialRampToValueAtTime(.0001, when + len / r ** .3);
        o.connect(v); v.connect(master); o.start(when); o.stop(when + len + .1);
      });
    }
    function play(kind, loud = 1) {
      if (!ctx || ctx.state !== "running") return;
      master.gain.value = Math.max(0, Math.min(1, S.vol)) * .7;
      const t = ctx.currentTime + .03;
      const tunes = { msg: [[880, 0], [1318.5, .16]], timer: [[1046.5, 0], [1318.5, .18], [1568, .36]], alarm: [[784, 0], [987.8, .22], [1174.7, .44], [1568, .66]], test: [[1046.5, 0], [1568, .2]] };
      (tunes[kind] || tunes.test).forEach(([f, d]) => bell(f, t + d, 2.4, .5 * loud));
    }
    return { unlock, play, ready: () => !!ctx && ctx.state === "running" };
  })();

  /* keep the screen awake while open */
  let lock = null;
  async function wake() { try { if ("wakeLock" in navigator && !document.hidden) { lock = await navigator.wakeLock.request("screen"); } } catch (e) {} }
  document.addEventListener("visibilitychange", () => { if (!document.hidden) wake(); });

  /* =========================================================
     Locked data: only this device (with the passcode) can read it
     ========================================================= */
  const Vault = (() => {
    const sub = crypto.subtle; const ub = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
    let pk = null;
    async function fromStore() {
      const jwk = load("pk", null); if (!jwk) return false;
      try { pk = await sub.importKey("jwk", jwk, { name: "ECDH", namedCurve: "P-256" }, false, ["deriveKey"]); return true; } catch (e) { return false; }
    }
    async function unlock(pass) {
      const r = await fetch("data/key.json?t=" + Date.now(), { cache: "no-store" }).catch(() => fetch(RAW + "os/data/key.json?t=" + Date.now()));
      const k = await r.json();
      const base = await sub.importKey("raw", new TextEncoder().encode(String(pass).toLowerCase().replace(/\s+/g, "")), "PBKDF2", false, ["deriveKey"]);
      const w = await sub.deriveKey({ name: "PBKDF2", salt: ub(k.wrapped.salt), iterations: k.wrapped.iter, hash: "SHA-256" }, base, { name: "AES-GCM", length: 256 }, false, ["decrypt"]);
      const jwk = JSON.parse(new TextDecoder().decode(await sub.decrypt({ name: "AES-GCM", iv: ub(k.wrapped.iv) }, w, ub(k.wrapped.ct))));
      pk = await sub.importKey("jwk", jwk, { name: "ECDH", namedCurve: "P-256" }, false, ["deriveKey"]);
      save("pk", jwk);
    }
    async function open(env) {
      const epk = await sub.importKey("jwk", { kty: "EC", crv: "P-256", x: env.epk.x, y: env.epk.y }, { name: "ECDH", namedCurve: "P-256" }, false, []);
      const key = await sub.deriveKey({ name: "ECDH", public: epk }, pk, { name: "AES-GCM", length: 256 }, false, ["decrypt"]);
      return JSON.parse(new TextDecoder().decode(await sub.decrypt({ name: "AES-GCM", iv: ub(env.iv) }, key, ub(env.ct))));
    }
    function forget() { pk = null; try { localStorage.removeItem("cos.pk"); localStorage.removeItem("cos.today"); localStorage.removeItem("cos.inbox"); localStorage.removeItem("cos.bp"); } catch (e) {} }
    return { fromStore, unlock, open, forget, ready: () => !!pk };
  })();

  /* =========================================================
     Panels: built from settings, with a copy of the last panel in front and the
     first panel at the end, so swiping past either end loops around seamlessly.
     ========================================================= */
  const PANELS = {
    home: () => `
      <div class="hl">
        <div class="clock"><span class="hm js-hm">--:--</span><span class="ampm js-ampm"></span></div>
        <div class="date js-date"></div>
        <button class="wx glass pill js-wx" data-go="today" hidden></button>
        <div class="headline js-headline"></div>
      </div>
      <div class="glance js-glance"></div>
      <div class="dock">
        <button class="glass round" data-act="clock" aria-label="Timers and alarms">${I.clock}</button>
        <button class="glass round" data-act="sleep" aria-label="Screensaver">${I.moon}</button>
        <button class="glass round" data-act="bg" aria-label="Next background">${I.spark}</button>
        <div class="chips js-chips"></div>
      </div>`,
    today: () => `<div class="card glass js-today-main"></div><div class="card glass js-today-wx"></div>`,
    calendar: () => `<div class="card glass calcard"><div class="calhead"><div class="h js-calrange"></div>
        <div class="seg"><button data-calv="3">3 days</button><button data-calv="7">Week</button></div></div>
        <div class="calbody js-cal"></div></div>`,
    inbox: () => `<div class="rowhead"><div class="h">Inbox</div><button class="link" data-act="readall">Mark all read</button></div><div class="inboxgrid js-inbox"></div>`,
    flags: () => `<div class="rowhead"><div class="seg glass"><button data-fv="flags">Flags</button><button data-fv="bp">Blueprints</button></div><a class="link" href="${HUB}" target="_blank" rel="noopener">Flag Hub</a></div><div class="card glass js-flags"></div>`,
    focus: () => `<div class="focus">
        <div class="fring js-fring"><svg viewBox="0 0 200 200"><circle cx="100" cy="100" r="92" class="ftrack"/><circle cx="100" cy="100" r="92" class="fprog js-fprog"/></svg>
          <div class="orb"><i></i><i></i><i></i><b></b><em></em></div><div class="ftime js-ftime">25:00</div></div>
        <div class="fside"><div class="fstate js-fstate">Focus</div><div class="mut js-fcount"></div>
          <div class="seg js-fplan"><button data-fplan="25/5">25 / 5</button><button data-fplan="50/10">50 / 10</button><button data-fplan="15/3">15 / 3</button></div>
          <div class="row"><button class="btn pri js-fgo" data-act="fgo">Start</button><button class="btn" data-act="fskip">Skip</button><button class="btn" data-act="freset">Reset</button></div></div>
      </div>`,
    music: () => `<div class="card glass music"><div class="mtabs js-mtabs"></div><div class="player js-player"></div></div>`,
  };
  const ORDER = ["home", "today", "calendar", "focus", "inbox", "flags", "music"];
  const deck = $("#deck");
  let keys = [], n = 0, here = 0, flagView = load("flagView", "flags"), settleT = 0;

  function buildDeck() {
    keys = ORDER.filter(k => k === "home" || S.panels[k]);
    n = keys.length;
    const page = (k, clone) => `<section class="page ${k === "home" ? "home" : "read " + k}${clone ? " clone" : ""}" data-key="${k}">${clone && k === "music" ? `<div class="card glass music"><div class="h">Music</div></div>` : PANELS[k]()}</section>`;
    deck.innerHTML = (n > 1 ? page(keys[n - 1], true) : "") + keys.map(k => page(k)).join("") + (n > 1 ? page(keys[0], true) : "");
    $("#dots").innerHTML = n > 1 ? keys.map(() => "<i></i>").join("") : "";
    musicShown = null;
    renderAll(); jump(here = Math.min(here, n - 1)); chrome();
  }
  const W = () => deck.clientWidth || innerWidth;
  const pos = i => (n > 1 ? i + 1 : 0);
  function jump(i) { deck.classList.add("nosnap"); deck.scrollLeft = pos(i) * W(); void deck.offsetWidth; deck.classList.remove("nosnap"); }
  function goTo(key, smooth = true) {
    const i = keys.indexOf(key); if (i < 0) return;
    if (!smooth) { here = i; jump(i); chrome(); return; }
    deck.scrollTo({ left: pos(i) * W(), behavior: "smooth" });
  }
  function settle() {
    if (n < 2) return;
    const p = Math.round(deck.scrollLeft / W());
    if (p <= 0) jump(n - 1); else if (p >= n + 1) jump(0);
    here = ((Math.round(deck.scrollLeft / W()) - 1) % n + n) % n; chrome();
  }
  function chrome() {
    const p = n > 1 ? ((Math.round(deck.scrollLeft / W()) - 1) % n + n) % n : 0;
    [...$("#dots").children].forEach((d, k) => d.classList.toggle("on", k === p));
    document.body.classList.toggle("reading", keys[p] !== "home");
    save("panel", keys[p]);
  }
  deck.addEventListener("scroll", () => { chrome(); clearTimeout(settleT); settleT = setTimeout(settle, 140); }, { passive: true });
  addEventListener("resize", () => { jump(here); drift(); });
  /* keep the copies at each end looking like the panels they stand in for */
  function syncClones() {
    if (n < 2) return;
    const cl = $$("#deck .clone");
    [[cl[0], keys[n - 1]], [cl[1], keys[0]]].forEach(([c, k]) => {
      if (!c || k === "music") return;
      const real = deck.querySelector(`.page:not(.clone)[data-key="${k}"]`);
      if (real && c.innerHTML !== real.innerHTML) c.innerHTML = real.innerHTML;
    });
  }

  /* =========================================================
     Clock
     ========================================================= */
  let lastMin = -1, nightOn = null;
  function tickClock(d) {
    const h = d.getHours(), m = d.getMinutes();
    if (m !== lastMin) {
      lastMin = m;
      setAll(".js-hm", (S.h24 ? pad(h) : ((h % 12) || 12)) + ":" + pad(m));
      setAll(".js-ampm", S.h24 ? "" : (h < 12 ? "AM" : "PM"));
      setAll(".js-date", d.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" }));
      $("#mini").innerHTML = `${(S.h24 ? pad(h) : ((h % 12) || 12)) + ":" + pad(m)}<small>${S.h24 ? "" : (h < 12 ? "AM" : "PM")} · ${d.toLocaleDateString(undefined, { weekday: "short" })}</small>`;
      renderToday(); renderGlance(); renderCal(); drift(); syncClones();
    }
    nightOn = isNight(d);
    const nm = S.nightMode && inWin(d, S.nmFrom, S.nmTo) && Date.now() > nmWake && $("#ring").hidden;
    if (nm !== nmOn) { nmOn = nm; document.body.classList.toggle("nightmode", nm); window.OSBG.pause(nm); if (nm) setIdle(true); }
    dimNow();
  }
  /* night mode: everything off but a dim warm clock (saves the screen); a tap wakes it for 2 minutes */
  let nmOn = false, nmWake = 0;
  const inWin = (d, a, b) => { const n = nowMins(d), x = mins(a), y = mins(b); return x > y ? (n >= x || n < y) : (n >= x && n < y); };
  function dimNow() {
    const quiet = S.idleDim && Date.now() - lastTouch > S.idleDim * 60000 && !F.run;
    const v = nmOn ? 0 : Math.max(nightOn ? (idle ? Math.min(.85, S.nightLevel + .15) : S.nightLevel) : 0, quiet ? .6 : 0);
    const el = $("#dim"); if (el.style.opacity !== String(v)) el.style.opacity = v;
  }

  /* =========================================================
     Screensaver: back to Home, cards fade, the clock wanders a little, the light takes over
     ========================================================= */
  let idle = false, lastTouch = Date.now();
  function setIdle(on) {
    if (on === idle) return; idle = on;
    if (on && !F.run) goTo("home", false);
    document.body.classList.toggle("idle", on);
    window.OSPrism && window.OSPrism.setEnergy(on ? 1.25 : 1);
    if (window.Kit) on ? window.Kit.hide() : window.Kit.show();
    drift(); dimNow();
  }
  function drift() {
    const L = $(".page.home:not(.clone) .hl"); if (!L) return;
    if (!idle) { L.style.transform = ""; return; }
    L.style.transform = `translate(${Math.random() * 22}px, ${(Math.random() - .5) * 18}px)`;
  }
  ["pointerdown", "keydown"].forEach(ev => addEventListener(ev, () => { lastTouch = Date.now(); Sound.unlock(); if (nmOn) nmWake = Date.now() + 120000; if (idle) setIdle(false); }, true));
  setInterval(() => {
    const quiet = Date.now() - lastTouch, free = $("#sheetBack").hidden && $("#ring").hidden;
    if (S.idleAfter && !idle && free && quiet > S.idleAfter * 1000) setIdle(true);
    else if (!S.idleAfter && free && quiet > 120000 && keys[here] !== "home") goTo("home");
  }, 1000);

  /* =========================================================
     Locked data: Today (weather, day, calendar), Inbox, Blueprints
     ========================================================= */
  let today = load("today", null), inbox = load("inbox", []), bp = load("bp", null);
  let readIds = new Set(load("read", [])), applied = new Set(load("applied", []));
  let known = new Set(inbox.map(m => m.id)), firstInbox = true, online = true;
  async function getJSON(path) {
    const r = await fetch(RAW + path + "?t=" + Date.now(), { cache: "no-store" });
    if (!r.ok) throw new Error(r.status); return r.json();
  }
  async function pullLocked() {
    if (!Vault.ready()) return;
    try {
      today = await Vault.open(await getJSON("os/data/today.json")); save("today", today);
      const box = await getJSON("os/data/inbox.json"), out = [];
      for (const it of box.items || []) {
        if (it.exp && new Date(it.exp) < new Date()) continue;
        try { out.push({ id: it.id, ...(await Vault.open(it)), at: it.at }); } catch (e) {}
      }
      const fresh = out.filter(m => !known.has(m.id));
      inbox = out; save("inbox", inbox); out.forEach(m => known.add(m.id));
      fresh.forEach(applyAction);
      if (fresh.length && !firstInbox) {
        if (idle) setIdle(false); if (keys.includes("inbox")) goTo("inbox");
        if (S.msgChime && !isNight(new Date())) Sound.play("msg", .8);
      }
      firstInbox = false; setNet(true);
    } catch (e) { setNet(false); }
    try { bp = await Vault.open(await getJSON("os/data/blueprints.json")); save("bp", bp); } catch (e) {}
    renderAll(); pickBg(false);
  }
  function setNet(ok) { online = ok; $("#net").hidden = ok; }
  function applyAction(m) {
    const a = m.action; if (!a || applied.has(m.id)) return;
    applied.add(m.id); save("applied", [...applied].slice(-200));
    if (a.type === "alarm" && a.time) { alarms.push({ id: uid(), time: a.time, label: a.label || m.title, days: a.days || [], on: true, once: !(a.days && a.days.length) }); saveAlarms(); renderChips(); }
    if (a.type === "timer" && a.minutes && Date.now() - new Date(m.at) < 10 * 60000) startTimer(a.minutes * 60000, a.label || m.title);
  }

  function isNightSky() {
    const w = today && today.weather, nn = nowMins(new Date());
    if (w && w.sunrise && w.sunset) return nn < mins(w.sunrise) || nn > mins(w.sunset);
    return nn < 6 * 60 + 30 || nn > 19 * 60;
  }
  /* notable events left today (routine stuff like classes, shifts, sleep stays out) */
  function upcoming() {
    const d = today && today.day; if (!d || !today.updatedAt || dayKey(new Date(today.updatedAt)) !== dayKey(new Date())) return [];
    const nn = nowMins(new Date());
    return (d.events || []).filter(e => (e.end ? mins(e.end) : mins(e.start) + 60) > nn).sort((a, b) => mins(a.start) - mins(b.start));
  }

  /* next exam on the calendar (from the morning update) */
  function nextExam() {
    const cal = today && today.calendar, tk = dayKey(new Date()); if (!cal) return null;
    for (const d of cal.days || []) { if (d.date < tk) continue; const e = (d.events || []).find(e => /\b(exam|midterm|final|quiz|test)\b/i.test(e.title)); if (e) return { title: e.title, date: d.date }; }
    return null;
  }
  const daysTo = ds => Math.round((parseDay(ds) - parseDay(dayKey(new Date()))) / 864e5);
  /* workout schedule from Bulk Manager (public config) */
  let sched = load("sched", null);
  async function pullSched() { try { const r = await fetch("https://raw.githubusercontent.com/Feirzen/bulk-manager/main/config.json?t=" + Date.now(), { cache: "no-store" }); const j = await r.json(); sched = j.schedule || null; save("sched", sched); renderGlance(); } catch (e) {} }
  function workoutToday() {
    const DN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"], d = new Date(), dn = DN[d.getDay()];
    const kind = Object.keys(sched).find(k => Array.isArray(sched[k]) && sched[k].includes(dn));
    if (kind === "lift") return "Lift day · just show up";
    const nxt = [1, 2, 3, 4, 5, 6].map(k => DN[(d.getDay() + k) % 7]).find(x => (sched.lift || []).includes(x));
    return ({ walk: "Walk day", flex: "Flex day", rest: "Rest day" }[kind] || "Off day") + (nxt ? ` · next lift ${nxt}` : "");
  }

  function renderAll() { renderFocus(); renderToday(); renderGlance(); renderCal(); renderInbox(); renderFlags(); renderMusic(); renderChips(); syncClones(); }

  function renderToday() {
    const w = today && today.weather, d = today && today.day;
    setAll(".js-headline", esc(d && d.headline || ""));
    $$(".js-wx").forEach(el => { el.hidden = !w; });
    if (w) setAll(".js-wx", `<span class="wi">${wxIcon(w.icon, isNightSky())}</span><b>${w.tempF != null ? Math.round(w.tempF) + "°" : ""}</b><span class="dim">${esc(w.condition || "")}</span><span class="mut">${w.high != null ? "H " + Math.round(w.high) + "°" : ""}${w.low != null ? "  L " + Math.round(w.low) + "°" : ""}</span>`);
    if (!Vault.ready()) { setAll(".js-today-main", `<div class="empty">Locked. Enter your passcode to see your day.</div>`); setAll(".js-today-wx", ""); return; }
    if (!today) { setAll(".js-today-main", `<div class="empty">Waiting for the first morning update.</div>`); setAll(".js-today-wx", ""); return; }
    const stale = today.updatedAt && dayKey(new Date(today.updatedAt)) !== dayKey(new Date());
    const nn = nowMins(new Date()); let nextDone = false;
    const evs = (d && d.events || []).slice().sort((a, b) => mins(a.start) - mins(b.start)).map(e => {
      const end = e.end ? mins(e.end) : mins(e.start) + 60, past = !stale && end <= nn, nx = !stale && !past && !nextDone; if (nx) nextDone = true;
      return `<div class="ev ${past ? "past" : ""} ${nx ? "next" : ""}"><div class="t">${esc(fmtHM(e.start))}</div><div><div class="n">${esc(e.title)}</div>${e.where ? `<div class="w">${esc(e.where)}</div>` : ""}</div></div>`;
    }).join("");
    const tags = [...(d && d.tags || []), ...(d && d.allDay || [])].map(x => `<span class="tag">${esc(x)}</span>`).join("");
    setAll(".js-today-main", `
      <div class="h">${d && d.date && d.date !== dayKey(new Date()) ? esc(parseDay(d.date).toLocaleDateString(undefined, { weekday: "long" })) + " · not today" : "Today" + (stale ? " · from yesterday" : "")}</div>
      ${d && d.summary ? `<p class="sum">${esc(d.summary)}</p>` : ""}
      ${tags ? `<div class="tags">${tags}</div>` : ""}
      <div class="h" style="margin-top:12px">What makes today different</div>
      ${evs || `<div class="empty sm">Nothing out of the ordinary.</div>`}`);
    if (!w) { setAll(".js-today-wx", ""); return; }
    const days = (w.days || []).slice(0, 4).map(x => `<div class="fc"><span>${esc(x.day || (x.date ? parseDay(x.date).toLocaleDateString(undefined, { weekday: "short" }) : ""))}</span><span class="fi">${wxIcon(x.icon)}</span><span class="mut">${x.precip ? x.precip + "%" : ""}</span><span>${x.high != null ? Math.round(x.high) + "°" : ""} <span class="mut">${x.low != null ? Math.round(x.low) + "°" : ""}</span></span></div>`).join("");
    const sp = today.extra && today.extra.spanish;
    setAll(".js-today-wx", `
      <div class="h">${esc(w.place || "Weather")}</div>
      <div class="wxbig"><span class="wi">${wxIcon(w.icon, isNightSky())}</span><b>${w.tempF != null ? Math.round(w.tempF) + "°" : ""}</b><span><div>${esc(w.condition || "")}</div><div class="mut">${w.high != null ? "H " + Math.round(w.high) + "°  L " + Math.round(w.low) + "°" : ""}</div></span></div>
      ${w.summary ? `<div class="dim" style="margin:6px 0 8px">${esc(w.summary)}</div>` : ""}
      ${days}
      ${w.sunrise && w.sunset ? `<div class="mut" style="font-size:12.5px;margin-top:6px">Sunrise ${esc(fmtHM(w.sunrise))} · Sunset ${esc(fmtHM(w.sunset))}</div>` : ""}
      ${sp ? `<div class="palabra">Palabra del día: <b>${esc(sp.word)}</b>, ${esc(sp.meaning)}</div>` : ""}`);
  }

  /* ---------- Home glance cards ---------- */
  function renderGlance() {
    const cards = [];
    const unread = inbox.filter(m => !readIds.has(m.id));
    if (S.glance.next) {
      const up = upcoming(), d = today && today.day;
      const v = up.length ? `${esc(up[0].title)} <span class="mut">${esc(fmtHM(up[0].start))}</span>` : (d && d.tags && d.tags.length ? esc(d.tags.join(" · ")) : "Nothing else today");
      cards.push(`<button class="g glass" data-go="${keys.includes("calendar") ? "today" : "today"}"><div><div class="k">Next up</div><div class="v">${v}</div></div>${up.length > 1 ? `<span class="n soft">+${up.length - 1}</span>` : ""}</button>`);
    }
    if (S.glance.inbox) cards.push(`<button class="g glass" data-go="inbox"><div><div class="k">Inbox</div><div class="v">${unread.length ? esc(unread[0].title) : "All caught up"}</div></div>${unread.length ? `<span class="n">${unread.length}</span>` : ""}</button>`);
    if (S.glance.flags && flagData && flagData.waiting) cards.push(`<button class="g glass" data-go="flags" data-fv="flags"><div><div class="k">Flags</div><div class="v">${flagData.waiting ? flagData.waiting + (flagData.waiting > 1 ? " proposals need" : " proposal needs") + " your OK" : `<span class="mut">${flagData.open} open for Claude · nothing on you</span>`}</div></div>${flagData.waiting ? `<span class="n">${flagData.waiting}</span>` : ""}</button>`);
    if (S.glance.focus || F.run) cards.unshift(`<button class="g glass" data-go="focus"><div><div class="k">Focus</div><div class="v">${F.run || F.left != null ? `${F.mode === "focus" ? "Focusing" : "Break"} · <span class="js-ftime2">${fmtDur(fLeft())}</span>` : "Start a focus session"}</div></div></button>`);
    if (S.glance.blueprints && bp) { const mine = (bp.flags || []).filter(f => f.status === "needs-ok" || f.status === "quote"), fu = bp.followups || [];
      if (mine.length || fu.length) cards.push(`<button class="g glass" data-go="flags" data-fv="bp"><div><div class="k">Blueprints</div><div class="v">${[mine.length ? mine.length + (mine.length > 1 ? " site changes need" : " site change needs") + " your OK" : "", fu.length ? fu.length + " follow-up" + (fu.length > 1 ? "s" : "") + " due" : ""].filter(Boolean).join(" · ")}</div></div><span class="n teal">${mine.length + fu.length}</span></button>`); }
    if (S.glance.music) { const it = sp.st && sp.st.item, m = S.music[load("track", 0)] || S.music[0];
      const imgs = it && it.album && it.album.images || [], art = imgs.length ? imgs[imgs.length - 1].url : "";
      cards.push(`<button class="g glass gm" data-go="music">${it ? `<span class="gart">${art ? `<img src="${esc(art)}" alt="">` : ""}</span>` : ""}<div><div class="k">${it ? (sp.st.is_playing ? "Now playing" : "Paused") : "Music"}</div><div class="v">${it ? `${esc(it.name)} <span class="mut">${esc((it.artists || []).map(a => a.name).join(", "))}</span>` : m ? esc(m.name) : Spot.on() ? "Nothing playing" : "Connect Spotify in Settings"}</div>${it ? `<div class="spbar gbar"><i class="js-spbar" style="width:${spPos() * 100}%"></i></div>` : ""}</div></button>`); }
    if (S.glance.study) { const ex = nextExam(), dd = ex ? daysTo(ex.date) : 0;
      cards.push(`<button class="g glass" data-go="calendar"><div><div class="k">Study</div><div class="v">${ex ? `${esc(ex.title)} <span class="mut">${dd === 0 ? "today" : dd === 1 ? "tomorrow" : "in " + dd + " days"}</span>` : `<span class="mut">No exams in the next week</span>`}</div></div>${ex && dd <= 2 ? `<span class="n">${dd === 0 ? "!" : dd + "d"}</span>` : ""}</button>`); }
    if (S.glance.workout && sched) { const w = workoutToday();
      cards.push(`<button class="g glass" data-go="today"><div><div class="k">Workout</div><div class="v">${esc(w)}</div></div></button>`); }
    setAll(".js-glance", cards.join(""));
    $$(".js-glance").forEach(el => el.dataset.count = cards.length);
  }

  /* ---------- Calendar (timetable, like the iPhone calendar) ---------- */
  const H0 = 6, H1 = 24;
  function renderCal() {
    const cal = today && today.calendar;
    $$(".page [data-calv]").forEach(b => b.classList.toggle("on", +b.dataset.calv === S.calView));
    if (!Vault.ready() || !cal || !(cal.days || []).length) { setAll(".js-cal", `<div class="empty">Your calendar shows up after the next morning update.</div>`); setAll(".js-calrange", "Calendar"); return; }
    const todayK = dayKey(new Date());
    let days = cal.days.filter(x => x.date >= todayK);
    if (!days.length) days = cal.days.slice(-1);
    days = days.slice(0, S.calView);
    const first = parseDay(days[0].date), lastD = parseDay(days[days.length - 1].date);
    setAll(".js-calrange", first.toLocaleDateString(undefined, { month: "short", day: "numeric" }) + (days.length > 1 ? " – " + lastD.toLocaleDateString(undefined, { month: "short", day: "numeric" }) : ""));
    const hp = S.calView === 7 ? 30 : 34, total = (H1 - H0) * hp;
    const head = days.map(x => { const dt = parseDay(x.date); return `<div class="cdh ${x.date === todayK ? "on" : ""}"><span>${dt.toLocaleDateString(undefined, { weekday: "short" })}</span><b>${dt.getDate()}</b></div>`; }).join("");
    const allDay = days.map(x => `<div class="cad">${(x.events || []).filter(e => e.allDay).map(e => `<span class="ce-ad ${esc(e.kind || "")}">${esc(e.title)}</span>`).join("")}</div>`).join("");
    const hasAllDay = days.some(x => (x.events || []).some(e => e.allDay));
    const gutter = Array.from({ length: H1 - H0 }, (_, i) => `<div class="hr" style="top:${i * hp}px">${i ? fmtShort(pad(H0 + i) + ":00") : ""}</div>`).join("");
    const cols = days.map(x => {
      const evs = (x.events || []).filter(e => !e.allDay && e.start).map(e => ({ ...e, a: Math.max(mins(e.start), H0 * 60), b: Math.min(Math.max(e.end ? mins(e.end) : mins(e.start) + 60, mins(e.start) + 15), H1 * 60) })).filter(e => e.b > H0 * 60).sort((p, q) => p.a - q.a || q.b - p.b);
      /* side by side when events overlap */
      let group = [], groupEnd = -1; const out = [];
      const flush = () => { const lanes = []; group.forEach(e => { let l = lanes.findIndex(end => end <= e.a); if (l < 0) { l = lanes.length; lanes.push(0); } lanes[l] = e.b; e.lane = l; }); group.forEach(e => { e.lanes = lanes.length; out.push(e); }); group = []; };
      evs.forEach(e => { if (e.a >= groupEnd && group.length) flush(); group.push(e); groupEnd = Math.max(groupEnd, e.b); }); if (group.length) flush();
      const blocks = out.map(e => { const top = (e.a - H0 * 60) / 60 * hp, h = Math.max(14, (e.b - e.a) / 60 * hp - 2), w = 100 / e.lanes;
        return `<div class="ce ${esc(e.kind || "normal")}" style="top:${top}px;height:${h}px;left:calc(${e.lane * w}% + 1px);width:calc(${w}% - 3px)"><b>${esc(e.title)}</b>${h > 30 ? `<span>${esc(fmtShort(e.start))}${e.end ? "–" + esc(fmtShort(e.end)) : ""}</span>` : ""}</div>`; }).join("");
      const nn = nowMins(new Date()), nowLine = x.date === todayK && nn >= H0 * 60 ? `<div class="now" style="top:${(nn - H0 * 60) / 60 * hp}px"></div>` : "";
      return `<div class="ccol ${x.date === todayK ? "on" : ""}">${blocks}${nowLine}</div>`;
    }).join("");
    const grid = `<div class="cgrid" style="--n:${days.length}"><div></div>${head}</div>
      ${hasAllDay ? `<div class="cgrid ad" style="--n:${days.length}"><div class="mut" style="font-size:10px;padding-top:3px">all day</div>${allDay}</div>` : ""}
      <div class="cscroll"><div class="cgrid body" style="--n:${days.length};height:${total}px;--hp:${hp}px"><div class="gut">${gutter}</div>${cols}</div></div>`;
    $$(".js-cal").forEach(el => {
      const sc = el.querySelector(".cscroll"), keep = sc ? sc.scrollTop : null;
      if (el.dataset.sig === grid) return;
      el.innerHTML = grid; el.dataset.sig = grid;
      const s2 = el.querySelector(".cscroll");
      s2.scrollTop = keep != null && el.dataset.placed ? keep : Math.max(0, (nowMins(new Date()) / 60 - H0 - 1.5) * hp); el.dataset.placed = 1;
    });
  }

  /* ---------- Inbox ---------- */
  function renderInbox() {
    const unread = inbox.filter(m => !readIds.has(m.id)).length;
    $("#tabBadge") && ($("#tabBadge").textContent = unread);
    if (!Vault.ready()) { setAll(".js-inbox", `<div class="empty">Locked.</div>`); return; }
    if (!inbox.length) { setAll(".js-inbox", `<div class="empty">No messages. Scheduled tasks will drop notes here.</div>`); return; }
    setAll(".js-inbox", inbox.map(m => `
      <div class="msg glass lv-${esc(m.level || "info")} ${readIds.has(m.id) ? "read" : ""}" data-msg="${esc(m.id)}">
        <div class="tt">${esc(m.title)}</div>${m.body ? `<div class="bd">${esc(m.body)}</div>` : ""}
        <div class="meta">${esc(m.from || "Claude")} · ${ago(m.at)}${m.link ? ` · <a href="${esc(m.link)}" target="_blank" rel="noopener">open</a>` : ""}</div>
      </div>`).join(""));
  }

  /* ---------- Flags + Blueprints ---------- */
  let flagData = load("flags", null);
  async function pullFlags() {
    try {
      const [st, fl] = await Promise.all([getJSON("status.json"), getJSON("data/flags.json")]);
      const open = (fl.flags || []).filter(f => f.status === "open");
      open.sort((a, b) => (b.priority ? 1 : 0) - (a.priority ? 1 : 0) || String(b.created).localeCompare(String(a.created)));
      flagData = { mode: st.mode, open: open.length, waiting: (fl.proposals || []).filter(p => p.status === "waiting" || p.status === "ready").length, prio: open.filter(f => f.priority).length,
        top: open.slice(0, 20).map(f => ({ p: f.project, t: String(f.text || "").split("\n").find(s => s.trim()) || "", you: f.kind === "you", pr: !!f.priority })) };
      save("flags", flagData);
    } catch (e) {}
    renderFlags(); renderGlance(); syncClones();
  }
  function renderFlags() {
    $$(".page [data-fv]").forEach(b => b.classList.toggle("on", b.dataset.fv === flagView));
    if (flagView === "bp") {
      if (!Vault.ready()) { setAll(".js-flags", `<div class="empty">Locked.</div>`); return; }
      if (!bp) { setAll(".js-flags", `<div class="empty">Blueprints syncs with the morning update.</div>`); return; }
      const fu = (bp.followups || []).map(a => `<div class="fl"><span class="d teal"></span><span class="x">${esc(a.business)}${a.stage ? ` <span class="mut">· ${esc(a.stage)}</span>` : ""}</span><span class="p">${esc(a.due || "")}</span></div>`).join("");
      const fl = (bp.flags || []).map(f => `<div class="fl"><span class="d"></span><span class="x">${esc(f.note)}</span><span class="p">${esc(f.site || "")} · ${esc(f.status || "")}</span></div>`).join("");
      setAll(".js-flags", `
        <div class="stats"><div class="stat"><b>${(bp.flags || []).length}</b><span>Site flags</span></div><div class="stat"><b>${(bp.followups || []).length}</b><span>Follow-ups</span></div><div class="stat"><b>${bp.newLeads || 0}</b><span>New leads</span></div><div class="stat"><b>${bp.clients || 0}</b><span>Clients</span></div></div>
        ${fu ? `<div class="h">Follow-ups due</div>${fu}` : ""}${fl ? `<div class="h" style="margin-top:10px">Site flags</div>${fl}` : ""}
        ${!fu && !fl ? `<div class="empty sm">Nothing waiting on you.</div>` : ""}
        <div class="mut" style="font-size:12px;margin-top:8px">Synced ${bp.updatedAt ? ago(bp.updatedAt) : ""}</div>`);
      return;
    }
    const f = flagData;
    if (!f) { setAll(".js-flags", `<div class="empty">Loading flags…</div>`); return; }
    const modes = { off: "Off", light: "Light", big: "Go Big" };
    setAll(".js-flags", `
      <div class="stats"><div class="stat"><b>${f.open}</b><span>Open</span></div><div class="stat"><b>${f.prio}</b><span>Priority</span></div><div class="stat"><b>${f.waiting}</b><span>Waiting</span></div><div class="stat"><b>${modes[f.mode] || f.mode}</b><span>Night shift</span></div></div>
      ${f.top.map(x => `<div class="fl"><span class="d ${x.you ? "teal" : ""}"></span><span class="x">${x.pr ? "⚡ " : ""}${esc(x.t)}</span><span class="p">${esc(x.p)}</span></div>`).join("")}`);
  }

  /* ---------- Music: a remote for Spotify on any of your devices (needs Premium) ---------- */
  const SP_ID = "f64eab8b137e41d8ab3eae8ba4a1446c";   /* Steven's Spotify developer app (a Client ID is public, not a password) */
  const SP_SCOPES = "user-read-playback-state user-modify-playback-state user-read-currently-playing playlist-read-private";
  const spRedirect = () => location.origin + location.pathname.replace(/index\.html$/, "");
  const b64url = buf => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const Spot = {
    tok: () => load("sp.tok", null),
    on() { return !!this.tok(); },
    async login() {
      const ver = b64url(crypto.getRandomValues(new Uint8Array(48))), st = b64url(crypto.getRandomValues(new Uint8Array(12)));
      const ch = b64url(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(ver)));
      save("sp.ver", ver); save("sp.state", st);
      location.href = "https://accounts.spotify.com/authorize?" + new URLSearchParams({ response_type: "code", client_id: SP_ID, scope: SP_SCOPES, redirect_uri: spRedirect(), code_challenge_method: "S256", code_challenge: ch, state: st });
    },
    /* Spotify sends you back here with ?code=… */
    async finish() {
      const p = new URLSearchParams(location.search); if (!p.has("code") && !p.has("error")) return;
      history.replaceState(null, "", spRedirect());
      if (p.get("error") || p.get("state") !== load("sp.state", "")) { setTimeout(() => toast("Spotify didn't connect. Try again from Settings."), 1500); return; }
      try { await this.tokenCall({ grant_type: "authorization_code", code: p.get("code"), redirect_uri: spRedirect(), client_id: SP_ID, code_verifier: load("sp.ver", "") }); setTimeout(() => toast("Spotify connected"), 1500); }
      catch (e) { setTimeout(() => toast(e.message), 1500); }
    },
    async tokenCall(form) {
      const r = await fetch("https://accounts.spotify.com/api/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams(form) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) { if (form.grant_type === "refresh_token") save("sp.tok", null); throw new Error(j.error_description ? "Spotify: " + j.error_description : "Spotify login failed"); }
      const old = this.tok() || {};
      save("sp.tok", { access: j.access_token, refresh: j.refresh_token || old.refresh, exp: Date.now() + (j.expires_in - 60) * 1000 });
    },
    async access() { const t = this.tok(); if (!t) throw new Error("Connect Spotify in Settings"); if (Date.now() < t.exp) return t.access; await this.tokenCall({ grant_type: "refresh_token", refresh_token: t.refresh, client_id: SP_ID }); return this.tok().access; },
    async api(method, path, body, retry = true) {
      const r = await fetch("https://api.spotify.com/v1" + path, { method, headers: { Authorization: "Bearer " + await this.access(), ...(body ? { "Content-Type": "application/json" } : {}) }, body: body ? JSON.stringify(body) : undefined });
      if (r.status === 401 && retry) { const t = this.tok(); if (t) { t.exp = 0; save("sp.tok", t); } return this.api(method, path, body, false); }
      if (r.status === 204 || r.status === 202) return null;
      const j = await r.json().catch(() => null);
      if (!r.ok) { const e = new Error((j && j.error && j.error.message) || "Spotify said " + r.status); e.status = r.status; e.reason = j && j.error && j.error.reason; throw e; }
      return j;
    },
  };
  let sp = { st: null, at: 0, lists: load("sp.lists", []), devs: [], noDev: false }, musicShown = null;
  const SPI = {
    prev: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 5h2v14H6zM20 5v14L9.5 12z"/></svg>',
    next: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 5h2v14h-2zM4 5v14l10.5-7z"/></svg>',
    play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 4.5v15l12.5-7.5z"/></svg>',
    pause: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6.5 4.5h4v15h-4zM13.5 4.5h4v15h-4z"/></svg>',
    vol: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/></svg>',
  };
  async function pullSpotify() {
    if (!Spot.on()) return;
    try { sp.st = await Spot.api("GET", "/me/player"); sp.at = Date.now(); sp.devs = ((await Spot.api("GET", "/me/player/devices")) || {}).devices || []; if (sp.devs.length) sp.noDev = false; }
    catch (e) { if (!Spot.on()) toast("Spotify disconnected. Connect again in Settings."); }
    if (!sp.lists.length) pullLists();
    renderMusic(); renderGlance(); syncClones();
  }
  async function pullLists() { try { const j = await Spot.api("GET", "/me/playlists?limit=24"); sp.lists = (j.items || []).filter(Boolean).map(x => ({ name: x.name, uri: x.uri, img: (x.images && x.images.length && x.images[x.images.length - 1].url) || "" })); save("sp.lists", sp.lists); renderMusic(); } catch (e) {} }
  async function spDo(act, arg) {
    try {
      const live = sp.st && sp.st.device && sp.st.device.id;
      if (act === "toggle" && sp.st && sp.st.is_playing) await Spot.api("PUT", "/me/player/pause");
      else if (act === "toggle" || act === "play") {
        /* nothing awake and playing? pick a device: the one he used last, then any active one, then a phone, then anything */
        const id = live || await spTarget();
        if (!id) { sp.noDev = true; musicShown = null; renderMusic(); return; }
        sp.noDev = false; save("sp.dev", id);
        await Spot.api("PUT", "/me/player/play?device_id=" + id, act === "play" ? (/^spotify:(track|episode):/.test(arg) ? { uris: [arg] } : { context_uri: arg }) : undefined);
      }
      if (act === "next") await Spot.api("POST", "/me/player/next");
      if (act === "prev") await Spot.api("POST", "/me/player/previous");
      if (act === "vol") await Spot.api("PUT", "/me/player/volume?volume_percent=" + Math.round(arg));
      if (act === "device") { save("sp.dev", arg); sp.noDev = false; await Spot.api("PUT", "/me/player", { device_ids: [arg], play: true }); }
      if (sp.st && act === "toggle") sp.st.is_playing = !sp.st.is_playing;
    } catch (e) { if (e.status === 404) { sp.noDev = true; musicShown = null; } else toast(e.reason === "PREMIUM_REQUIRED" ? "That needs Spotify Premium" : e.message); }
    renderMusic(); setTimeout(pullSpotify, 700);
  }
  async function spTarget() {
    sp.devs = ((await Spot.api("GET", "/me/player/devices")) || {}).devices || [];
    const pref = load("sp.dev", null), d = sp.devs.find(x => x.id === pref) || sp.devs.find(x => x.is_active) || sp.devs.find(x => x.type === "Smartphone") || sp.devs[0];
    return d ? d.id : null;
  }
  const spPos = () => { const st = sp.st; if (!st || !st.item) return 0; const p = st.progress_ms + (st.is_playing ? Date.now() - sp.at : 0); return Math.min(1, p / st.item.duration_ms); };
  function tickMusic() { const f = spPos() * 100 + "%"; $$(".js-spbar").forEach(el => el.style.width = f); }
  const embedURL = link => { const m = String(link).match(/open\.spotify\.com\/(?:intl-[a-z]+\/)?(playlist|album|artist|track|show|episode)\/([A-Za-z0-9]+)/); return m ? `https://open.spotify.com/embed/${m[1]}/${m[2]}?utm_source=generator&theme=0` : null; };
  const linkURI = link => { const m = String(link).match(/open\.spotify\.com\/(?:intl-[a-z]+\/)?(playlist|album|artist|show)\/([A-Za-z0-9]+)/); return m ? `spotify:${m[1]}:${m[2]}` : null; };
  function renderMusic() {
    const el = deck.querySelector('.page:not(.clone)[data-key="music"]'); if (!el) return;
    if (!Spot.on()) {
      const cur = Math.min(load("track", 0), Math.max(0, S.music.length - 1)), sig = "embed" + JSON.stringify([S.music, cur]);
      if (sig === musicShown) return; musicShown = sig;
      el.querySelector(".js-mtabs").innerHTML = `${S.music.length > 1 ? S.music.map((m, i) => `<button class="mt ${i === cur ? "on" : ""}" data-track="${i}">${esc(m.name)}</button>`).join("") : `<div class="h">Music</div>`}<button class="mt connect" data-spconnect="1">Connect Spotify for full control</button>`;
      const m = S.music[cur], url = m && embedURL(m.link);
      el.querySelector(".js-player").innerHTML = url ? `<iframe src="${url}" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy" title="Spotify"></iframe>`
        : `<div class="empty">Connect Spotify (button above) to control your music from here.</div>`;
      return;
    }
    const st = sp.st, it = st && st.item;
    const saved = S.music.map(m => ({ name: m.name, uri: linkURI(m.link), img: "" })).filter(x => x.uri);
    const lists = [...saved, ...sp.lists.filter(l => !saved.some(x => x.uri === l.uri))].slice(0, 24);
    const sig = "remote" + JSON.stringify([it && it.id, st && st.is_playing, st && st.device && st.device.volume_percent, st && st.device && st.device.name, sp.devs.map(d => d.id + d.is_active), lists.map(l => l.uri), sp.noDev]);
    if (sig === musicShown) return; musicShown = sig;
    const tabs = el.querySelector(".js-mtabs");
    if (!tabs.querySelector(".js-spq")) tabs.innerHTML = `<div class="spsearch"><input class="field js-spq" type="search" placeholder="Search songs, artists, albums, playlists" autocomplete="off" autocorrect="off" enterkeyhint="search"><button class="mt" data-sp="clear" hidden>Clear</button></div><div class="spres js-spres"></div>`;
    const art = it && it.album && it.album.images && it.album.images[0] ? it.album.images[0].url : "";
    const now = it ? `
      <div class="np">
        <div class="art glass">${art ? `<img src="${esc(art)}" alt="">` : ""}</div>
        <div class="npi">
          <div class="h">${st.is_playing ? "Now playing" : "Paused"} · ${esc(st.device ? st.device.name : "")}</div>
          <div class="sptt">${esc(it.name)}</div><div class="mut">${esc((it.artists || []).map(a => a.name).join(", ") || (it.show && it.show.name) || "")}</div>
          <div class="spbar"><i class="js-spbar" style="width:${spPos() * 100}%"></i></div>
          <div class="ctrl"><button class="glass round" data-sp="prev" aria-label="Previous">${SPI.prev}</button><button class="glass round big" data-sp="toggle" aria-label="Play or pause">${st.is_playing ? SPI.pause : SPI.play}</button><button class="glass round" data-sp="next" aria-label="Next">${SPI.next}</button></div>
          ${st.device && st.device.volume_percent != null ? `<div class="vol">${SPI.vol}<input type="range" min="0" max="100" step="2" value="${st.device.volume_percent}" data-spvol="1"></div>` : ""}
        </div>
      </div>`
      : `<div class="np idle"><div class="npi"><div class="h">Nothing playing</div>
          ${sp.devs.length ? `<div class="mut" style="margin-bottom:8px">Tap a playlist below, or start one of these:</div>` : `<div class="nodev">No Spotify app is awake right now, so there's nothing to play on. Open Spotify on this phone, your PC or a speaker, then tap a playlist here. <button class="link" data-sp="refresh">Check again</button></div>`}</div></div>`;
    const devRow = sp.devs.length ? `<div class="devs" style="margin-top:10px"><span class="lbl2">Play on</span>${sp.devs.map(d => `<button class="mt ${d.is_active ? "on" : ""}" data-spdev="${esc(d.id)}">${esc(d.name)}</button>`).join("")}</div>` : "";
    el.querySelector(".js-player").innerHTML = now + devRow + (lists.length ? `<div class="h" style="margin-top:12px">Play a playlist</div><div class="plist">${lists.map(l => `<button class="pl" data-spplay="${esc(l.uri)}">${l.img ? `<img src="${esc(l.img)}" alt="">` : `<span class="noimg"></span>`}<span>${esc(l.name)}</span></button>`).join("")}</div>` : "");
  }
  deck.addEventListener("change", e => { if (e.target.dataset && e.target.dataset.spvol) spDo("vol", +e.target.value); });
  /* search Spotify as you type */
  let spQT = 0, spQN = 0;
  deck.addEventListener("input", e => { if (!e.target.classList.contains("js-spq")) return; clearTimeout(spQT); const v = e.target.value; spQT = setTimeout(() => spSearch(v), 350); });
  deck.addEventListener("keydown", e => { if (e.key === "Enter" && e.target.classList.contains("js-spq")) { clearTimeout(spQT); spSearch(e.target.value); e.target.blur(); } });
  async function spSearch(q) {
    const box = deck.querySelector('.page:not(.clone)[data-key="music"] .js-spres'), clr = deck.querySelector('.page:not(.clone)[data-key="music"] [data-sp="clear"]'); if (!box) return;
    q = q.trim(); if (clr) clr.hidden = !q;
    if (!q) { box.innerHTML = ""; return; }
    const my = ++spQN;
    try {
      const j = await Spot.api("GET", "/search?" + new URLSearchParams({ q, type: "track,playlist,album,artist", limit: 6 }));
      if (my !== spQN) return;
      const img = a => { const x = (a || []).filter(Boolean); return x.length ? x[x.length - 1].url : ""; };
      const row = (uri, pic, name, sub, round) => `<button class="sr" data-spplay="${esc(uri)}">${pic ? `<img src="${esc(pic)}" alt=""${round ? ' class="rd"' : ""}>` : `<span class="noimg${round ? " rd" : ""}"></span>`}<span class="srt"><b>${esc(name)}</b><span class="mut">${esc(sub)}</span></span></button>`;
      const g = (title, items) => items.length ? `<div class="h">${title}</div><div class="srg">${items.join("")}</div>` : "";
      const tr = ((j.tracks || {}).items || []).filter(Boolean).slice(0, 6).map(t => row(t.uri, img(t.album && t.album.images), t.name, (t.artists || []).map(a => a.name).join(", "), false));
      const pl = ((j.playlists || {}).items || []).filter(Boolean).slice(0, 4).map(x => row(x.uri, img(x.images), x.name, "Playlist" + (x.owner && x.owner.display_name ? " · " + x.owner.display_name : ""), false));
      const al = ((j.albums || {}).items || []).filter(Boolean).slice(0, 4).map(x => row(x.uri, img(x.images), x.name, "Album · " + (x.artists || []).map(a => a.name).join(", "), false));
      const ar = ((j.artists || {}).items || []).filter(Boolean).slice(0, 4).map(x => row(x.uri, img(x.images), x.name, "Artist", true));
      box.innerHTML = (g("Songs", tr) + g("Artists", ar) + g("Playlists", pl) + g("Albums", al)) || `<div class="empty sm">Nothing found for "${esc(q)}".</div>`;
    } catch (e) { if (my === spQN) box.innerHTML = `<div class="empty sm">${esc(e.message)}</div>`; }
  }

  /* =========================================================
     Focus (Pomodoro): the light slows and dims while you work, brightens on breaks
     ========================================================= */
  let F = Object.assign({ mode: "focus", run: false, end: 0, left: null, round: 1 }, load("focus", {}));
  const plan = () => String(S.focusPlan || "25/5").split("/").map(Number);
  const fDur = () => (F.mode === "focus" ? plan()[0] : (F.round % 4 === 0 ? plan()[1] * 3 : plan()[1])) * 60000;
  const fLeft = () => F.run ? Math.max(0, F.end - Date.now()) : (F.left != null ? F.left : fDur());
  const fSave = () => save("focus", F);
  function fMood() { const B = window.OSBG; if (!F.run) B.mood(1, 1); else if (F.mode === "focus") B.mood(.3, .55); else B.mood(1.7, 1.12); }
  function fStart() {
    if (F.run) { F.left = F.end - Date.now(); F.run = false; }
    else { F.end = Date.now() + (F.left != null ? F.left : fDur()); F.left = null; F.run = true; }
    fSave(); fMood(); renderFocus(); renderGlance(); syncClones();
  }
  function fNext(auto) {
    if (F.mode === "focus") F.mode = "break"; else { F.mode = "focus"; F.round++; }
    F.left = null; F.end = Date.now() + fDur(); F.run = true; fSave(); fMood();
    if (auto) { Sound.play(F.mode === "focus" ? "timer" : "msg"); if (idle) setIdle(false); }
    toast(F.mode === "focus" ? "Back to focus" : (F.round % 4 === 0 ? "Long break" : "Break time"));
    renderFocus(); renderGlance(); syncClones();
  }
  function fReset() { F = { mode: "focus", run: false, end: 0, left: null, round: 1 }; fSave(); fMood(); renderFocus(); renderGlance(); syncClones(); }
  function fRing() { const c = 2 * Math.PI * 92, f = Math.min(1, 1 - fLeft() / fDur()); $$(".js-fprog").forEach(el => { el.style.strokeDasharray = c; el.style.strokeDashoffset = c * (1 - f); }); }
  function renderFocus() {
    setAll(".js-ftime", fmtDur(fLeft())); setAll(".js-ftime2", fmtDur(fLeft()));
    setAll(".js-fstate", F.mode === "focus" ? "Focus" : (F.round % 4 === 0 ? "Long break" : "Break"));
    setAll(".js-fcount", `Round ${F.round} · ${plan()[0]} min focus, ${plan()[1]} min breaks`);
    setAll(".js-fgo", F.run ? "Pause" : (F.left != null ? "Resume" : "Start"));
    $$(".js-fring").forEach(el => { el.classList.toggle("run", F.run); el.classList.toggle("brk", F.mode === "break"); });
    $$("[data-fplan]").forEach(b => b.classList.toggle("on", b.dataset.fplan === S.focusPlan));
    fRing();
  }
  function tickFocus() {
    if (F.run && Date.now() >= F.end) fNext(true);
    if (F.run) { setAll(".js-ftime", fmtDur(fLeft())); setAll(".js-ftime2", fmtDur(fLeft())); fRing(); }
  }

  /* =========================================================
     Timers + Alarms (one button, one sheet)
     ========================================================= */
  let timers = load("timers", []), alarms = load("alarms", []);
  const saveTimers = () => save("timers", timers), saveAlarms = () => save("alarms", alarms);
  const DAYS = ["S", "M", "T", "W", "T", "F", "S"];
  function startTimer(ms, label) { timers.push({ id: uid(), dur: ms, end: Date.now() + ms, left: null, label: label || "" }); saveTimers(); renderChips(); }
  function ringSvg(f, col) {
    const r = 14, c = 2 * Math.PI * r;
    return `<svg viewBox="0 0 34 34"><circle cx="17" cy="17" r="${r}" fill="none" stroke="currentColor" stroke-opacity=".15" stroke-width="3"/><circle cx="17" cy="17" r="${r}" fill="none" stroke="${col}" stroke-width="3" stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - f)}" transform="rotate(-90 17 17)" style="filter:drop-shadow(0 0 4px ${col})"/></svg>`;
  }
  function nextAlarm() {
    const now = new Date(); let best = null, bestIn = Infinity;
    for (const a of alarms) {
      if (!a.on) continue;
      for (let k = 0; k < 8; k++) {
        const d = new Date(now); d.setDate(d.getDate() + k); const [h, m] = a.time.split(":").map(Number); d.setHours(h, m, 0, 0);
        if (d <= now) continue; if (a.days && a.days.length && !a.days.includes(d.getDay())) continue;
        if (d - now < bestIn) { bestIn = d - now; best = a; } break;
      }
    }
    for (const sn of load("snooze", [])) if (sn.at > now && sn.at - now < bestIn) { bestIn = sn.at - now; const d = new Date(sn.at); best = { time: pad(d.getHours()) + ":" + pad(d.getMinutes()), label: sn.label + " (snoozed)" }; }
    return bestIn < 24 * 3600e3 ? best : null;
  }
  function renderChips() {
    const now = Date.now();
    const t = timers.map(x => { const left = x.left != null ? x.left : x.end - now, f = Math.max(0, Math.min(1, left / x.dur));
      return `<button class="chip glass ${x.left != null ? "paused" : ""}" data-act="timer">${ringSvg(f, "var(--accent)")}<span><div>${fmtDur(left)}</div>${x.label ? `<div class="lbl">${esc(x.label)}</div>` : ""}</span></button>`; }).join("");
    const nx = nextAlarm();
    const a = nx ? `<button class="chip glass" data-act="alarms"><span class="ai">${I.alarm}</span><span><div>${esc(fmtHM(nx.time))}</div><div class="lbl">${esc(nx.label || "Alarm")}</div></span></button>` : "";
    setAll(".js-chips", t + a);
  }
  function tickTimers() {
    const now = Date.now(); let changed = false;
    for (const t of [...timers]) if (t.left == null && t.end <= now) { timers = timers.filter(x => x !== t); changed = true; ring({ kind: "timer", title: "Timer done", sub: t.label || fmtDur(t.dur) + " timer", t }); }
    if (changed) saveTimers();
    if (timers.length || changed) renderChips();
  }
  function tickAlarms(d) {
    if (d.getSeconds() > 2) return;
    const hm = pad(d.getHours()) + ":" + pad(d.getMinutes()), key = dayKey(d) + " " + hm;
    for (const a of alarms) {
      if (!a.on || a.time !== hm || a.fired === key) continue;
      if (a.days && a.days.length && !a.days.includes(d.getDay())) continue;
      a.fired = key; if (a.once) a.on = false; saveAlarms();
      ring({ kind: "alarm", title: a.label || "Alarm", sub: fmtHM(a.time), a });
    }
    const sn = load("snooze", []), due = sn.filter(s => s.at <= Date.now());
    if (due.length) { save("snooze", sn.filter(s => s.at > Date.now())); due.forEach(s => ring({ kind: "alarm", title: s.label || "Alarm", sub: "Snoozed alarm", a: { label: s.label } })); }
  }
  let ringLoop = null;
  function ring(o) {
    setIdle(false); $("#dim").style.opacity = 0;
    const el = $("#ring"); el.hidden = false;
    el.innerHTML = `<div><div class="orb"><i></i><i></i><i></i><b></b><em></em></div><h2>${esc(o.title)}</h2><p>${esc(o.sub || "")}</p>
      <div class="row center"><button class="btn" id="rgMore">${o.kind === "timer" ? "+1 min" : "Snooze 9 min"}</button><button class="btn pri" id="rgStop">Stop</button></div></div>`;
    let k = 0; clearInterval(ringLoop);
    const go = () => { Sound.play(o.kind, Math.min(1, .45 + k * .08)); k++; if (k > (o.kind === "alarm" ? 70 : 25)) stopRing(); };
    go(); ringLoop = setInterval(go, 2600);
    $("#rgStop").onclick = stopRing;
    $("#rgMore").onclick = () => {
      if (o.kind === "timer") startTimer(60000, o.t && o.t.label);
      else { const sn = load("snooze", []); sn.push({ at: Date.now() + 9 * 60000, label: o.a && o.a.label || "Alarm" }); save("snooze", sn); }
      stopRing();
    };
  }
  function stopRing() { clearInterval(ringLoop); $("#ring").hidden = true; renderChips(); lastTouch = Date.now(); nightOn = null; }

  /* ---------- sheets ---------- */
  function sheet(title, html, bind) {
    const back = $("#sheetBack"), s = $("#sheet");
    s.innerHTML = `<div class="sh-top"><h2>${title}</h2><button class="close" id="shX" aria-label="Close">${I.close}</button></div>${html}`;
    back.hidden = false; $("#shX").onclick = closeSheet;
    back.onclick = e => { if (e.target === back) closeSheet(); };
    bind && bind(s);
  }
  function closeSheet() { $("#sheetBack").hidden = true; $("#sheet").innerHTML = ""; renderChips(); }

  let cm = 5, cs = 0, newDays = [];
  function openClock(tab = load("clockTab", "timer")) {
    save("clockTab", tab);
    const seg = `<div class="seg" style="margin-bottom:14px"><button data-ct="timer" class="${tab === "timer" ? "on" : ""}">Timer</button><button data-ct="alarms" class="${tab === "alarms" ? "on" : ""}">Alarms</button></div>`;
    if (tab === "timer") {
      const now = Date.now();
      const list = timers.map(t => { const left = t.left != null ? t.left : t.end - now; return `<div class="item"><div class="grow"><div class="big">${fmtDur(left)}</div><div class="sub">${esc(t.label || fmtDur(t.dur) + " timer")}${t.left != null ? " · paused" : ""}</div></div><button class="btn" data-pause="${t.id}">${t.left != null ? "Resume" : "Pause"}</button><button class="btn bad" data-del="${t.id}">Cancel</button></div>`; }).join("");
      sheet("Clock", `${seg}
        <div class="grid">${[1, 3, 5, 10, 15, 20, 30, 45, 60, 90].map(m => `<button class="btn" data-q="${m}">${m < 60 ? m + " min" : (m === 90 ? "1½ hr" : "1 hr")}</button>`).join("")}</div>
        <div class="row" style="gap:18px">
          <div class="step"><button class="btn" data-s="m-">−</button><b id="cm">${pad(cm)}</b><button class="btn" data-s="m+">+</button><span class="lbl2">min</span></div>
          <div class="step"><button class="btn" data-s="s-">−</button><b id="cs">${pad(cs)}</b><button class="btn" data-s="s+">+</button><span class="lbl2">sec</span></div>
        </div>
        <div class="row"><input class="field" id="tLabel" placeholder="Label (optional)" maxlength="40"><button class="btn pri" id="tGo">Start</button></div>
        ${list ? `<div class="h" style="margin-top:16px">Running</div>${list}` : ""}`, s => {
        s.querySelectorAll("[data-ct]").forEach(b => b.onclick = () => openClock(b.dataset.ct));
        s.querySelectorAll("[data-q]").forEach(b => b.onclick = () => { startTimer(+b.dataset.q * 60000, $("#tLabel").value.trim()); closeSheet(); });
        s.querySelectorAll("[data-s]").forEach(b => b.onclick = () => {
          const k = b.dataset.s; if (k === "m+") cm = Math.min(180, cm + 1); if (k === "m-") cm = Math.max(0, cm - 1); if (k === "s+") cs = (cs + 15) % 60; if (k === "s-") cs = (cs + 45) % 60;
          $("#cm").textContent = pad(cm); $("#cs").textContent = pad(cs);
        });
        $("#tGo").onclick = () => { const ms = (cm * 60 + cs) * 1000; if (ms > 0) { startTimer(ms, $("#tLabel").value.trim()); closeSheet(); } };
        s.querySelectorAll("[data-pause]").forEach(b => b.onclick = () => { const t = timers.find(x => x.id === b.dataset.pause); if (!t) return; if (t.left != null) { t.end = Date.now() + t.left; t.left = null; } else { t.left = t.end - Date.now(); } saveTimers(); openClock("timer"); });
        s.querySelectorAll("[data-del]").forEach(b => b.onclick = () => { timers = timers.filter(x => x.id !== b.dataset.del); saveTimers(); openClock("timer"); });
      });
      return;
    }
    const list = alarms.slice().sort((a, b) => mins(a.time) - mins(b.time)).map(a => `
      <div class="item"><div class="grow"><div class="big" style="${a.on ? "" : "opacity:.45"}">${esc(fmtHM(a.time))}</div><div class="sub">${esc(a.label || "Alarm")} · ${a.days && a.days.length ? a.days.map(d => ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d]).join(" ") : "once"}</div></div>
      <button class="sw ${a.on ? "on" : ""}" data-tog="${a.id}" aria-label="On or off"></button><button class="btn bad" data-del="${a.id}">Delete</button></div>`).join("");
    sheet("Clock", `${seg}
      <div class="row" style="margin-top:0"><input type="time" class="field" id="aTime" value="07:00"><input class="field" id="aLabel" placeholder="Label" maxlength="40"></div>
      <div class="row sp"><div class="days">${DAYS.map((d, i) => `<button class="day ${newDays.includes(i) ? "on" : ""}" data-d="${i}">${d}</button>`).join("")}</div><button class="btn pri" id="aAdd">Add alarm</button></div>
      <div class="lbl2" style="margin-top:8px">No days picked means it rings once.</div>
      ${list ? `<div class="h" style="margin-top:16px">Your alarms</div>${list}` : ""}`, s => {
      s.querySelectorAll("[data-ct]").forEach(b => b.onclick = () => openClock(b.dataset.ct));
      s.querySelectorAll("[data-d]").forEach(b => b.onclick = () => { const i = +b.dataset.d; newDays = newDays.includes(i) ? newDays.filter(x => x !== i) : [...newDays, i]; b.classList.toggle("on"); });
      $("#aAdd").onclick = () => { const t = $("#aTime").value; if (!t) return; alarms.push({ id: uid(), time: t, label: $("#aLabel").value.trim(), days: [...newDays].sort(), on: true, once: !newDays.length }); newDays = []; saveAlarms(); openClock("alarms"); };
      s.querySelectorAll("[data-tog]").forEach(b => b.onclick = () => { const a = alarms.find(x => x.id === b.dataset.tog); a.on = !a.on; delete a.fired; saveAlarms(); openClock("alarms"); });
      s.querySelectorAll("[data-del]").forEach(b => b.onclick = () => { alarms = alarms.filter(x => x.id !== b.dataset.del); saveAlarms(); openClock("alarms"); });
    });
  }

  function openSettings() {
    const seg = (key, opts) => `<div class="seg" data-seg="${key}">${opts.map(([v, l]) => `<button data-v="${v}" class="${String(S[key]) === String(v) ? "on" : ""}">${l}</button>`).join("")}</div>`;
    const sw = (key, obj = S) => `<button class="sw ${obj[key] ? "on" : ""}" data-sw="${key}" data-in="${obj === S ? "" : obj === S.panels ? "panels" : "glance"}"></button>`;
    const PN = { today: "Today", calendar: "Calendar", focus: "Focus", inbox: "Inbox", flags: "Flags + Blueprints", music: "Music" };
    const GN = { next: "Next up", inbox: "Inbox", flags: "Flags (only when waiting on you)", blueprints: "Blueprints (only when waiting on you)", music: "Music", focus: "Focus", study: "Study (next exam)", workout: "Workout" };
    sheet("Settings", `
      <div class="h">Panels</div>
      <div class="tog">${Object.keys(PN).map(k => `<div class="row sp tight"><span>${PN[k]}</span>${sw(k, S.panels)}</div>`).join("")}</div>
      <div class="h" style="margin-top:14px">Home cards <span class="mut">(3 fit best)</span></div>
      <div class="tog">${Object.keys(GN).map(k => `<div class="row sp tight"><span>${GN[k]}</span>${sw(k, S.glance)}</div>`).join("")}</div>
      <div class="h" style="margin-top:14px">Background</div>
      <div class="row" style="margin-top:4px">${seg("bg", [["rotate", "Rotate"], ["shards", "Shards"], ["caustics", "Caustics"], ["silk", "Silk"], ["fluted", "Fluted"], ["prism", "Prism"]])}</div>
      <div class="tog"><div class="row sp tight"><span>Weather moods</span>${sw("moods")}</div></div>
      <div class="row sp"><span>Rotate every</span>${seg("bgEvery", [[10, "10m"], [30, "30m"], [60, "1h"], [180, "3h"]])}</div>
      <div class="row sp"><span>Motion</span>${seg("motion", [["full", "Smooth"], ["calm", "Battery saver"]])}</div>
      <div class="h" style="margin-top:14px">Music</div>
      <div class="row sp tight"><span>Spotify remote ${Spot.on() ? `<span class="mut">· connected</span>` : `<span class="mut">· needs Premium</span>`}</span>${Spot.on() ? `<button class="btn bad" id="spOut">Disconnect</button>` : `<button class="btn pri" id="spIn">Connect</button>`}</div>
      <div class="lbl2" style="margin-top:6px">Saved links below show first in the playlist list.</div>
      ${S.music.map((m, i) => `<div class="row sp tight"><span>${esc(m.name)}</span><button class="btn bad" data-mdel="${i}">Remove</button></div>`).join("")}
      <div class="row"><input class="field" id="mName" placeholder="Name (like Focus)" maxlength="24" style="max-width:150px"><input class="field" id="mLink" placeholder="Spotify link"><button class="btn pri" id="mAdd">Add</button></div>
      <div class="h" style="margin-top:14px">Clock and screen</div>
      <div class="row sp tight"><span>24-hour clock</span>${sw("h24")}</div>
      <div class="row sp"><span>Screensaver after</span>${seg("idleAfter", [[30, "30s"], [90, "90s"], [300, "5m"], [0, "Never"]])}</div>
      <div class="row sp tight"><span>Night mode <span class="mut">(just a dim clock)</span></span>${sw("nightMode")}</div>
      <div class="row"><input type="time" class="field" id="nmFrom" value="${S.nmFrom}"><span class="lbl2">to</span><input type="time" class="field" id="nmTo" value="${S.nmTo}"></div>
      <div class="row sp"><span>Dim when untouched</span>${seg("idleDim", [[30, "30m"], [60, "1h"], [0, "Never"]])}</div>
      <div class="row sp tight"><span>Dim at night</span>${sw("night")}</div>
      <div class="row"><input type="time" class="field" id="nFrom" value="${S.nightFrom}"><span class="lbl2">to</span><input type="time" class="field" id="nTo" value="${S.nightTo}"></div>
      <div class="row"><span class="lbl2">Night dimness</span><input type="range" id="nLvl" min="0.2" max="0.85" step="0.05" value="${S.nightLevel}"></div>
      <div class="row"><span class="lbl2">Volume</span><input type="range" id="vol" min="0" max="1" step="0.05" value="${S.vol}"><button class="btn" id="test">Test</button></div>
      <div class="row sp tight"><span>Chime for new messages</span>${sw("msgChime")}</div>
      <div class="row sp"><button class="btn" id="refresh">Refresh now</button><button class="btn bad" id="forget">Forget passcode</button></div>
      <div class="ver">Claude OS ${VERSION} · ${online ? "online" : "offline"}</div>`, s => {
      s.querySelectorAll("[data-sw]").forEach(b => b.onclick = () => {
        const obj = b.dataset.in === "panels" ? S.panels : b.dataset.in === "glance" ? S.glance : S, k = b.dataset.sw;
        obj[k] = !obj[k]; saveS(); b.classList.toggle("on");
        if (k === "moods") { save("moodSkip", null); pickBg(true); } if (b.dataset.in === "panels") buildDeck(); else { lastMin = -1; nightOn = null; tickClock(new Date()); renderGlance(); renderChips(); syncClones(); }
      });
      s.querySelectorAll("[data-seg]").forEach(g => g.querySelectorAll("button").forEach(b => b.onclick = () => {
        const k = g.dataset.seg, v = b.dataset.v; S[k] = isNaN(+v) ? v : +v; saveS();
        g.querySelectorAll("button").forEach(x => x.classList.toggle("on", x === b));
        if (k === "bg" || k === "bgEvery") pickBg(true); if (k === "motion") window.OSBG.setFps(S.motion === "calm" ? 30 : 60);
      }));
      s.querySelectorAll("[data-mdel]").forEach(b => b.onclick = () => { S.music.splice(+b.dataset.mdel, 1); saveS(); renderMusic(); renderGlance(); openSettings(); });
      if ($("#spIn")) $("#spIn").onclick = () => Spot.login();
      if ($("#spOut")) $("#spOut").onclick = () => { save("sp.tok", null); sp.st = null; musicShown = null; renderMusic(); openSettings(); };
      $("#mAdd").onclick = () => { const link = $("#mLink").value.trim(); if (!embedURL(link)) { $("#mLink").classList.add("shake"); setTimeout(() => $("#mLink").classList.remove("shake"), 500); return; }
        S.music.push({ name: $("#mName").value.trim() || "Playlist " + (S.music.length + 1), link }); saveS(); renderMusic(); renderGlance(); openSettings(); };
      $("#nmFrom").onchange = e => { S.nmFrom = e.target.value; saveS(); };
      $("#nmTo").onchange = e => { S.nmTo = e.target.value; saveS(); };
      $("#nFrom").onchange = e => { S.nightFrom = e.target.value; saveS(); nightOn = null; };
      $("#nTo").onchange = e => { S.nightTo = e.target.value; saveS(); nightOn = null; };
      $("#nLvl").oninput = e => { S.nightLevel = +e.target.value; saveS(); nightOn = null; };
      $("#vol").oninput = e => { S.vol = +e.target.value; saveS(); };
      $("#test").onclick = () => { Sound.unlock(); Sound.play("test"); };
      $("#refresh").onclick = () => { pullLocked(); pullFlags(); closeSheet(); };
      $("#forget").onclick = () => { if (confirm("Forget the passcode on this phone? You'll need to type it again.")) { Vault.forget(); location.reload(); } };
    });
  }

  /* ---------- background choice (rotate through the favorites) ---------- */
  const ROTATE = ["shards", "caustics", "silk", "fluted", "orbs"];
  /* weather moods: rain and storms show the pond, snow shows glass snow. It stays put while the weather lasts.
     If he swipes past it on purpose (the sparkle button), that choice sticks for the rest of the day. */
  function weatherMood() { const ic = today && today.weather && today.weather.icon; return ic === "rain" || ic === "storm" ? "pond" : ic === "snow" ? "snow" : null; }
  function moodBg() {
    if (!S.moods) return null; const m = weatherMood(); if (!m) return null;
    const skip = load("moodSkip", null); if (skip && skip.mood === m && skip.day === dayKey(new Date())) return null;
    return m;
  }
  const rotation = () => ROTATE;
  let bgSince = load("bgSince", 0);
  function pickBg(force) {
    const mb = moodBg(); if (mb) { window.OSBG.show(mb); return; }
    if (S.bg !== "rotate") { window.OSBG.show(S.bg); return; }
    const list = rotation(), curBg = load("bgCur", "shards");
    if (force || !list.includes(window.OSBG.get())) { window.OSBG.show(list.includes(curBg) ? curBg : list[0]); if (!bgSince) { bgSince = Date.now(); save("bgSince", bgSince); } }
    if (Date.now() - bgSince > S.bgEvery * 60000) nextBg();
  }
  function nextBg() {
    const m = moodBg(); if (m && window.OSBG.get() === m) save("moodSkip", { mood: m, day: dayKey(new Date()) });
    const list = S.bg === "rotate" ? rotation() : window.OSBG.list;
    const i = list.indexOf(window.OSBG.get()), nx = list[(i + 1) % list.length];
    if (S.bg !== "rotate") { S.bg = nx; saveS(); }
    save("bgCur", nx); bgSince = Date.now(); save("bgSince", bgSince); window.OSBG.show(nx);
    toast(window.OSBG.names[nx]);
  }
  let toastT = 0;
  function toast(t) { const el = $("#toast"); el.textContent = t; el.classList.add("on"); clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove("on"), 1600); }

  /* ---------- taps anywhere on the panels ---------- */
  deck.addEventListener("click", e => {
    const t = e.target.closest("[data-go],[data-act],[data-msg],[data-fv],[data-calv],[data-track],[data-fplan],[data-sp],[data-spplay],[data-spdev],[data-spconnect]"); if (!t) return;
    if (t.dataset.sp === "clear") { const q = t.parentNode.querySelector(".js-spq"); q.value = ""; spSearch(""); return; }
    if (t.dataset.sp === "refresh") { pullSpotify(); toast("Checking…"); return; } if (t.dataset.sp) { spDo(t.dataset.sp); return; } if (t.dataset.spplay) { spDo("play", t.dataset.spplay); return; } if (t.dataset.spdev) { spDo("device", t.dataset.spdev); return; } if (t.dataset.spconnect) { Spot.login(); return; }
    if (t.dataset.fplan) { S.focusPlan = t.dataset.fplan; saveS(); if (!F.run) F.left = null; renderFocus(); return; }
    if (t.dataset.fv && !t.dataset.go) { flagView = t.dataset.fv; save("flagView", flagView); renderFlags(); syncClones(); return; }
    if (t.dataset.go) { if (t.dataset.fv) { flagView = t.dataset.fv; save("flagView", flagView); renderFlags(); } goTo(t.dataset.go); return; }
    if (t.dataset.calv) { S.calView = +t.dataset.calv; saveS(); renderCal(); return; }
    if (t.dataset.track) { save("track", +t.dataset.track); renderMusic(); renderGlance(); return; }
    if (t.dataset.msg) { if (e.target.closest("a")) return; t.classList.toggle("open"); readIds.add(t.dataset.msg); t.classList.add("read"); save("read", [...readIds].slice(-300)); renderGlance(); syncClones(); return; }
    const a = t.dataset.act;
    if (a === "clock") openClock(); else if (a === "timer") openClock("timer"); else if (a === "alarms") openClock("alarms");
    else if (a === "sleep") setTimeout(() => setIdle(true), 50);
    else if (a === "bg") nextBg();
    else if (a === "fgo") fStart(); else if (a === "fskip") fNext(false); else if (a === "freset") fReset();
    else if (a === "readall") { inbox.forEach(m => readIds.add(m.id)); save("read", [...readIds].slice(-300)); renderInbox(); renderGlance(); syncClones(); }
  });

  /* =========================================================
     Gate: passcode the first time, then just "tap to begin" (unlocks sound)
     ========================================================= */
  async function gate() {
    const el = $("#gate");
    const has = await Vault.fromStore();
    const begin = () => { Sound.unlock(); wake(); el.classList.add("gone"); setTimeout(() => el.hidden = true, 1300); lastTouch = Date.now(); pullLocked(); };
    if (has) {
      el.innerHTML = `<div class="tapper">Tap to begin</div>`;
      el.onclick = begin;
      setTimeout(() => { if (!el.classList.contains("gone")) begin(); }, 8000);
      return;
    }
    el.classList.add("lock");
    el.innerHTML = `<form class="gate-card glass" id="gf" autocomplete="off">
      <img src="icons/icon-192.png?v=1" alt=""><h1>Claude OS</h1><p>Enter your passcode once. This phone will remember it.</p>
      <input class="field" id="gp" type="password" autocapitalize="none" autocorrect="off" spellcheck="false" placeholder="passcode" enterkeyhint="go">
      <button class="btn pri" type="submit">Unlock</button>
      <button class="btn" type="button" id="skip">Skip for now</button></form>`;
    $("#gf").onsubmit = async e => {
      e.preventDefault(); Sound.unlock();
      const card = $("#gf");
      try { await Vault.unlock($("#gp").value); el.classList.remove("lock"); begin(); renderAll(); }
      catch (err) { card.classList.remove("shake"); void card.offsetWidth; card.classList.add("shake"); $("#gp").select(); }
    };
    $("#skip").onclick = () => { el.classList.remove("lock"); begin(); };
  }

  /* =========================================================
     Kit wiring (theme + gear) and startup
     ========================================================= */
  window.KitConfig = {
    gear: "#gear",
    tray: [{ id: "sleep", icon: I.moon, label: "Screensaver", onClick: () => { window.Kit && window.Kit.hide(); setIdle(true); } }],
    more: () => openSettings(),
  };
  addEventListener("DOMContentLoaded", () => {
    if (window.Kit && window.Kit.theme) window.Kit.theme.onChange((theme, p) => window.OSBG.palette(theme, p));
  });

  $("#gear").innerHTML = I.gear;
  $("#mini").onclick = () => goTo("home");
  window.OSBG.setFps(S.motion === "calm" ? 30 : 60);
  pickBg(true); fMood();
  here = Math.max(0, ORDER.filter(k => k === "home" || S.panels[k]).indexOf(load("panel", "home")));
  buildDeck();
  Spot.finish().then(() => { pullSpotify(); });
  gate();
  pullFlags(); pullSched();
  setInterval(() => { if (Spot.on() && !nmOn && (keys[here] === "music" || S.glance.music)) pullSpotify(); }, 8000);
  setInterval(() => { if (Spot.on()) pullLists(); }, 30 * 60 * 1000);
  setInterval(() => { const d = new Date(); tickClock(d); tickTimers(); tickAlarms(d); tickFocus(); tickMusic(); }, 1000);
  setInterval(pullLocked, 60 * 1000);
  setInterval(pullFlags, 4 * 60 * 1000);
  setInterval(pullSched, 60 * 60 * 1000);
  /* new version shipped? reload quietly so the desk phone never needs a hand refresh */
  setInterval(async () => { try { const v = (await getJSON("os/version.json")).v; if (v && v !== VERSION && $("#ring").hidden && $("#sheetBack").hidden) location.reload(); } catch (e) {} }, 5 * 60 * 1000);
  setInterval(() => { if (idle) drift(); renderChips(); pickBg(false); }, 60 * 1000);
  tickClock(new Date());
})();
