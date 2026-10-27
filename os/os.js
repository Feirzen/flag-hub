/* Claude OS: desk display for Steven's old iPhone.
   Swipe through panels (it loops forever). Live data comes from os/data (locked so only this
   phone can read it) and from Flag Hub. Timers, alarms and settings live on this device. */
(() => {
  const VERSION = "2.0";
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
    bg: "rotate", bgEvery: 30, calView: 3,
    panels: { today: true, calendar: true, inbox: true, flags: true, music: true },
    glance: { next: true, inbox: true, flags: true, blueprints: false, music: false },
    music: [],
  }, load("settings", {}));
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
    music: () => `<div class="card glass music"><div class="mtabs js-mtabs"></div><div class="player js-player"></div></div>`,
  };
  const ORDER = ["home", "today", "calendar", "inbox", "flags", "music"];
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
    const nn = isNight(d);
    if (nn !== nightOn) { nightOn = nn; dimNow(); }
  }
  function dimNow() { $("#dim").style.opacity = nightOn ? (idle ? Math.min(.85, S.nightLevel + .15) : S.nightLevel) : 0; }

  /* =========================================================
     Screensaver: back to Home, cards fade, the clock wanders a little, the light takes over
     ========================================================= */
  let idle = false, lastTouch = Date.now();
  function setIdle(on) {
    if (on === idle) return; idle = on;
    if (on) goTo("home", false);
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
  ["pointerdown", "keydown"].forEach(ev => addEventListener(ev, () => { lastTouch = Date.now(); Sound.unlock(); if (idle) setIdle(false); }, true));
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
    renderAll();
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

  function renderAll() { renderToday(); renderGlance(); renderCal(); renderInbox(); renderFlags(); renderMusic(); renderChips(); syncClones(); }

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
      <div class="h">Today${stale ? " · from yesterday" : ""}</div>
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
    if (S.glance.flags && flagData) cards.push(`<button class="g glass" data-go="flags" data-fv="flags"><div><div class="k">Flags</div><div class="v">${flagData.top[0] ? (flagData.top[0].pr ? "⚡ " : "") + esc(flagData.top[0].t) : "No open flags"}</div></div><span class="n red">${flagData.open}</span></button>`);
    if (S.glance.blueprints) { const b = bp || {}; cards.push(`<button class="g glass" data-go="flags" data-fv="bp"><div><div class="k">Blueprints</div><div class="v">${bp ? `${b.followups && b.followups.length ? b.followups.length + " follow-ups due" : "No follow-ups due"}${b.newLeads ? " · " + b.newLeads + " new leads" : ""}` : "Waiting on first sync"}</div></div>${b.flags && b.flags.length ? `<span class="n teal">${b.flags.length}</span>` : ""}</button>`); }
    if (S.glance.music) { const m = S.music[load("track", 0)] || S.music[0]; cards.push(`<button class="g glass" data-go="music"><div><div class="k">Music</div><div class="v">${m ? esc(m.name) : "Add a playlist in Settings"}</div></div></button>`); }
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

  /* ---------- Music (Spotify players) ---------- */
  let musicShown = null;
  const embedURL = link => { const m = String(link).match(/open\.spotify\.com\/(?:intl-[a-z]+\/)?(playlist|album|artist|track|show|episode)\/([A-Za-z0-9]+)/); return m ? `https://open.spotify.com/embed/${m[1]}/${m[2]}?utm_source=generator&theme=0` : null; };
  function renderMusic() {
    const el = deck.querySelector('.page:not(.clone)[data-key="music"]'); if (!el) return;
    const cur = Math.min(load("track", 0), Math.max(0, S.music.length - 1));
    const sig = JSON.stringify([S.music, cur]);
    if (sig === musicShown) return; musicShown = sig;
    el.querySelector(".js-mtabs").innerHTML = S.music.length > 1 ? S.music.map((m, i) => `<button class="mt ${i === cur ? "on" : ""}" data-track="${i}">${esc(m.name)}</button>`).join("") : `<div class="h">Music</div>`;
    const m = S.music[cur], url = m && embedURL(m.link);
    el.querySelector(".js-player").innerHTML = url
      ? `<iframe src="${url}" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy" title="Spotify"></iframe>`
      : `<div class="empty">Add a Spotify playlist or album in Settings (gear, then …).<br><span class="mut">In the Spotify app: Share, then Copy link.</span></div>`;
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
    const PN = { today: "Today", calendar: "Calendar", inbox: "Inbox", flags: "Flags + Blueprints", music: "Music" };
    const GN = { next: "Next up", inbox: "Inbox", flags: "Flags", blueprints: "Blueprints", music: "Music" };
    sheet("Settings", `
      <div class="h">Panels</div>
      <div class="tog">${Object.keys(PN).map(k => `<div class="row sp tight"><span>${PN[k]}</span>${sw(k, S.panels)}</div>`).join("")}</div>
      <div class="h" style="margin-top:14px">Home cards <span class="mut">(3 fit best)</span></div>
      <div class="tog">${Object.keys(GN).map(k => `<div class="row sp tight"><span>${GN[k]}</span>${sw(k, S.glance)}</div>`).join("")}</div>
      <div class="h" style="margin-top:14px">Background</div>
      <div class="row" style="margin-top:4px">${seg("bg", [["rotate", "Rotate"], ["shards", "Shards"], ["caustics", "Caustics"], ["silk", "Silk"], ["prism", "Prism"]])}</div>
      <div class="row sp"><span>Rotate every</span>${seg("bgEvery", [[10, "10m"], [30, "30m"], [60, "1h"], [180, "3h"]])}</div>
      <div class="row sp"><span>Motion</span>${seg("motion", [["full", "Smooth"], ["calm", "Battery saver"]])}</div>
      <div class="h" style="margin-top:14px">Music</div>
      ${S.music.map((m, i) => `<div class="row sp tight"><span>${esc(m.name)}</span><button class="btn bad" data-mdel="${i}">Remove</button></div>`).join("")}
      <div class="row"><input class="field" id="mName" placeholder="Name (like Focus)" maxlength="24" style="max-width:150px"><input class="field" id="mLink" placeholder="Spotify link"><button class="btn pri" id="mAdd">Add</button></div>
      <div class="h" style="margin-top:14px">Clock and screen</div>
      <div class="row sp tight"><span>24-hour clock</span>${sw("h24")}</div>
      <div class="row sp"><span>Screensaver after</span>${seg("idleAfter", [[30, "30s"], [90, "90s"], [300, "5m"], [0, "Never"]])}</div>
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
        if (b.dataset.in === "panels") buildDeck(); else { lastMin = -1; nightOn = null; tickClock(new Date()); renderGlance(); renderChips(); syncClones(); }
      });
      s.querySelectorAll("[data-seg]").forEach(g => g.querySelectorAll("button").forEach(b => b.onclick = () => {
        const k = g.dataset.seg, v = b.dataset.v; S[k] = isNaN(+v) ? v : +v; saveS();
        g.querySelectorAll("button").forEach(x => x.classList.toggle("on", x === b));
        if (k === "bg" || k === "bgEvery") pickBg(true); if (k === "motion") window.OSBG.setFps(S.motion === "calm" ? 30 : 60);
      }));
      s.querySelectorAll("[data-mdel]").forEach(b => b.onclick = () => { S.music.splice(+b.dataset.mdel, 1); saveS(); renderMusic(); renderGlance(); openSettings(); });
      $("#mAdd").onclick = () => { const link = $("#mLink").value.trim(); if (!embedURL(link)) { $("#mLink").classList.add("shake"); setTimeout(() => $("#mLink").classList.remove("shake"), 500); return; }
        S.music.push({ name: $("#mName").value.trim() || "Playlist " + (S.music.length + 1), link }); saveS(); renderMusic(); renderGlance(); openSettings(); };
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
  const ROTATE = ["shards", "caustics", "silk"];
  let bgSince = load("bgSince", 0);
  function pickBg(force) {
    if (S.bg !== "rotate") { window.OSBG.show(S.bg); return; }
    const curBg = load("bgCur", "shards");
    if (force || !window.OSBG.get()) { window.OSBG.show(ROTATE.includes(curBg) ? curBg : "shards"); if (!bgSince) { bgSince = Date.now(); save("bgSince", bgSince); } }
    if (Date.now() - bgSince > S.bgEvery * 60000) nextBg();
  }
  function nextBg() {
    const list = S.bg === "rotate" ? ROTATE : window.OSBG.list;
    const i = list.indexOf(window.OSBG.get()), nx = list[(i + 1) % list.length];
    if (S.bg !== "rotate") { S.bg = nx; saveS(); }
    save("bgCur", nx); bgSince = Date.now(); save("bgSince", bgSince); window.OSBG.show(nx);
    toast(window.OSBG.names[nx]);
  }
  let toastT = 0;
  function toast(t) { const el = $("#toast"); el.textContent = t; el.classList.add("on"); clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove("on"), 1600); }

  /* ---------- taps anywhere on the panels ---------- */
  deck.addEventListener("click", e => {
    const t = e.target.closest("[data-go],[data-act],[data-msg],[data-fv],[data-calv],[data-track]"); if (!t) return;
    if (t.dataset.fv && !t.dataset.go) { flagView = t.dataset.fv; save("flagView", flagView); renderFlags(); syncClones(); return; }
    if (t.dataset.go) { if (t.dataset.fv) { flagView = t.dataset.fv; save("flagView", flagView); renderFlags(); } goTo(t.dataset.go); return; }
    if (t.dataset.calv) { S.calView = +t.dataset.calv; saveS(); renderCal(); return; }
    if (t.dataset.track) { save("track", +t.dataset.track); renderMusic(); renderGlance(); return; }
    if (t.dataset.msg) { if (e.target.closest("a")) return; t.classList.toggle("open"); readIds.add(t.dataset.msg); t.classList.add("read"); save("read", [...readIds].slice(-300)); renderGlance(); syncClones(); return; }
    const a = t.dataset.act;
    if (a === "clock") openClock(); else if (a === "timer") openClock("timer"); else if (a === "alarms") openClock("alarms");
    else if (a === "sleep") setTimeout(() => setIdle(true), 50);
    else if (a === "bg") nextBg();
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
  window.OSBG.setFps(S.motion === "calm" ? 30 : 60);
  pickBg(true);
  here = Math.max(0, ORDER.filter(k => k === "home" || S.panels[k]).indexOf(load("panel", "home")));
  buildDeck();
  gate();
  pullFlags();
  setInterval(() => { const d = new Date(); tickClock(d); tickTimers(); tickAlarms(d); }, 1000);
  setInterval(pullLocked, 60 * 1000);
  setInterval(pullFlags, 4 * 60 * 1000);
  /* new version shipped? reload quietly so the desk phone never needs a hand refresh */
  setInterval(async () => { try { const v = (await getJSON("os/version.json")).v; if (v && v !== VERSION && $("#ring").hidden && $("#sheetBack").hidden) location.reload(); } catch (e) {} }, 5 * 60 * 1000);
  setInterval(() => { if (idle) drift(); renderChips(); pickBg(false); }, 60 * 1000);
  tickClock(new Date());
})();
