/* Claude OS: desk display for Steven's old iPhone.
   Live data comes from os/data (locked so only this phone can read it) and from Flag Hub.
   Timers, alarms and settings live on this device. */
(() => {
  const VERSION = "1.0";
  const RAW = "https://raw.githubusercontent.com/Feirzen/flag-hub/main/";
  const HUB = "https://feirzen.github.io/flag-hub/";
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const load = (k, d) => { try { const v = localStorage.getItem("cos." + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } };
  const save = (k, v) => { try { localStorage.setItem("cos." + k, JSON.stringify(v)); } catch (e) {} };
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const pad = n => String(n).padStart(2, "0");

  const S = Object.assign({ h24: false, idleAfter: 90, night: true, nightFrom: "22:00", nightTo: "06:30", nightLevel: 0.55, vol: 0.6, msgChime: true, motion: "full" }, load("settings", {}));
  const saveS = () => save("settings", S);

  /* ---------- icons ---------- */
  const I = {
    timer: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="12" cy="13.5" r="7.5"/><path d="M12 9.5v4l2.6 1.6M9.5 2.8h5M12 2.8V6"/></svg>',
    alarm: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="12" cy="13" r="7.5"/><path d="M12 9v4l-2.4 1.8M4.5 4.5l2.6-2M19.5 4.5l-2.6-2M6.5 19.5 5 21.5M17.5 19.5l1.5 2"/></svg>',
    moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10Z"/><path d="M17 3.5v3M15.5 5h3"/></svg>',
    gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    cog: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/></svg>',
  };
  const WX = {
    clear: '<svg viewBox="0 0 32 32" fill="none" stroke="#ffd36e" stroke-width="1.8" stroke-linecap="round"><circle cx="16" cy="16" r="5.5" fill="#ffd36e33"/><g class="rays"><path d="M16 3.5v3M16 25.5v3M3.5 16h3M25.5 16h3M7.2 7.2l2.1 2.1M22.7 22.7l2.1 2.1M7.2 24.8l2.1-2.1M22.7 9.3l2.1-2.1"/></g></svg>',
    night: '<svg viewBox="0 0 32 32" fill="none" stroke="#c9d4ff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M25 19.5A10 10 0 0 1 12.5 7a10 10 0 1 0 12.5 12.5Z" fill="#c9d4ff22"/></svg>',
    partly: '<svg viewBox="0 0 32 32" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><g stroke="#ffd36e"><circle cx="12" cy="12" r="4.5" fill="#ffd36e33"/><path d="M12 3.5v2M3.5 12h2M6 6l1.4 1.4M18 6l-1.4 1.4"/></g><path stroke="#e6ebff" fill="#e6ebff22" d="M10.5 26h12a4.5 4.5 0 0 0 .4-9 6 6 0 0 0-11.5 1.6A3.8 3.8 0 0 0 10.5 26Z"/></svg>',
    cloudy: '<svg viewBox="0 0 32 32" fill="none" stroke="#e6ebff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path fill="#e6ebff22" d="M9 25h14a5 5 0 0 0 .5-10A7 7 0 0 0 10 16.6 4.3 4.3 0 0 0 9 25Z"/></svg>',
    rain: '<svg viewBox="0 0 32 32" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path stroke="#e6ebff" fill="#e6ebff22" d="M9 20h14a5 5 0 0 0 .5-10A7 7 0 0 0 10 11.6 4.3 4.3 0 0 0 9 20Z"/><path stroke="#7fc8ff" d="M11 23.5l-1 3M16 23.5l-1 3M21 23.5l-1 3"/></svg>',
    storm: '<svg viewBox="0 0 32 32" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path stroke="#e6ebff" fill="#e6ebff22" d="M9 19h14a5 5 0 0 0 .5-10A7 7 0 0 0 10 10.6 4.3 4.3 0 0 0 9 19Z"/><path stroke="#ffd36e" d="M16.5 20.5 14 25h4l-2.5 4.5"/></svg>',
    snow: '<svg viewBox="0 0 32 32" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path stroke="#e6ebff" fill="#e6ebff22" d="M9 19h14a5 5 0 0 0 .5-10A7 7 0 0 0 10 10.6 4.3 4.3 0 0 0 9 19Z"/><g stroke="#ffffff"><path d="M11 23v4M9 25h4M21 23v4M19 25h4M16 25v4M14 27h4"/></g></svg>',
    fog: '<svg viewBox="0 0 32 32" fill="none" stroke="#e6ebff" stroke-width="1.8" stroke-linecap="round"><path d="M6 12h20M4 17h24M7 22h18"/></svg>',
    wind: '<svg viewBox="0 0 32 32" fill="none" stroke="#e6ebff" stroke-width="1.8" stroke-linecap="round"><path d="M4 12h15a3.5 3.5 0 1 0-3.5-3.5M4 17h21a3.5 3.5 0 1 1-3.5 3.5M4 22h9"/></svg>',
  };

  /* ---------- time helpers ---------- */
  const mins = hhmm => { const [h, m] = String(hhmm || "0:0").split(":").map(Number); return (h || 0) * 60 + (m || 0); };
  const nowMins = d => d.getHours() * 60 + d.getMinutes();
  const fmtHM = hhmm => { const m = mins(hhmm), h = Math.floor(m / 60), mm = pad(m % 60); return S.h24 ? pad(h) + ":" + mm : ((h % 12) || 12) + ":" + mm + (h < 12 ? " AM" : " PM"); };
  const fmtDur = ms => { const s = Math.max(0, Math.ceil(ms / 1000)), h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60; return h ? h + ":" + pad(m) + ":" + pad(x) : m + ":" + pad(x); };
  const ago = iso => { const m = Math.round((Date.now() - new Date(iso)) / 60000); if (m < 1) return "just now"; if (m < 60) return m + "m ago"; const h = Math.round(m / 60); return h < 24 ? h + "h ago" : Math.round(h / 24) + "d ago"; };
  const isNight = d => { if (!S.night) return false; const n = nowMins(d), a = mins(S.nightFrom), b = mins(S.nightTo); return a > b ? (n >= a || n < b) : (n >= a && n < b); };
  const dayKey = d => d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());

  /* =========================================================
     Scene: light through a glass prism, dust drifting in the beams
     ========================================================= */
  const Scene = (() => {
    const cv = $("#scene"), g = cv.getContext("2d");
    let W = 0, H = 0, dpr = 1, parts = [], dark = true, bg = "#07080f", acc = [157, 140, 255];
    let energy = 1, energyTo = 1, last = 0, raf = 0, sparks = [], tx = innerWidth * .47, ty = innerHeight * .57;
    const toRGB = c => { const t = document.createElement("canvas").getContext("2d"); t.fillStyle = "#000"; t.fillStyle = c; const h = t.fillStyle; if (h[0] === "#") return [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)); const m = h.match(/\d+(\.\d+)?/g); return m ? m.slice(0, 3).map(Number) : [157, 140, 255]; };
    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2); W = innerWidth; H = innerHeight;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); g.setTransform(dpr, 0, 0, dpr, 0, 0); seed();
    }
    function seed() {
      const n = S.motion === "calm" ? 45 : 110;
      parts = Array.from({ length: n }, () => ({ x: Math.random() * W, y: Math.random() * H, r: .5 + Math.random() * 1.7, vx: (Math.random() - .5) * 6, vy: -3 - Math.random() * 7, ph: Math.random() * 6.28 }));
    }
    function palette(p) { if (!p) return; dark = p.mode !== "light"; bg = p.vars.bg; acc = toRGB(p.vars.accent); }
    const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
    const lerp = (a, b, t) => a + (b - a) * t;

    function geometry(t) {
      const idle = document.body.classList.contains("idle");
      const portrait = H > W;
      /* awake: prism sits between the clock and the cards; screensaver: it glides to the open right side */
      tx = lerp(tx, portrait ? W * .5 : W * (idle ? .7 : .47), .012); ty = lerp(ty, portrait ? H * .62 : H * (idle ? .52 : .57), .012);
      const cx = tx, cy = ty;
      const s = Math.min(W, H) * (portrait ? .36 : .44);
      const rot = Math.sin(t * .07) * .07 + Math.sin(t * .029) * .05;
      const R = s * .58;
      const v = k => { const a = -Math.PI / 2 + rot + k * 2 * Math.PI / 3; return { x: cx + Math.cos(a) * R, y: cy + Math.sin(a) * R }; };
      const A = v(0), B = v(1), C = v(2);
      const at = (p, q, f) => ({ x: p.x + (q.x - p.x) * f, y: p.y + (q.y - p.y) * f });
      const E = at(C, A, .52 + Math.sin(t * .05) * .06);
      const X = at(A, B, .56 + Math.sin(t * .05) * .04);
      const src = { x: -W * .08, y: E.y + H * (.22 + Math.sin(t * .043) * .05) };
      return { A, B, C, E, X, src, s };
    }

    function frame(ts) {
      raf = requestAnimationFrame(frame);
      const minGap = S.motion === "calm" ? 1000 / 30 : 0;
      if (ts - last < minGap) return;
      const dt = Math.min(.05, (ts - last) / 1000 || .016); last = ts;
      const t = ts / 1000;
      energy = lerp(energy, energyTo, .02);
      const { A, B, C, E, X, src, s } = geometry(t);
      const add = dark ? "lighter" : "multiply";

      g.globalCompositeOperation = "source-over";
      g.fillStyle = bg; g.fillRect(0, 0, W, H);

      /* ambient color pools drifting slowly */
      g.globalCompositeOperation = dark ? "lighter" : "source-over";
      const pools = [
        [W * (.2 + .12 * Math.sin(t * .031)), H * (.25 + .15 * Math.cos(t * .027)), acc, dark ? .13 : .12],
        [W * (.8 + .1 * Math.cos(t * .022)), H * (.75 + .12 * Math.sin(t * .035)), hsl((t * 4) % 360), dark ? .07 : .08],
        [W * (.55 + .2 * Math.sin(t * .017)), H * (.1 + .1 * Math.sin(t * .041)), hsl((t * 4 + 160) % 360), dark ? .05 : .07],
      ];
      for (const [x, y, c, a] of pools) {
        const r = Math.max(W, H) * .7, gr = g.createRadialGradient(x, y, 0, x, y, r);
        gr.addColorStop(0, rgba(c, a * energy)); gr.addColorStop(1, rgba(c, 0));
        g.fillStyle = gr; g.fillRect(0, 0, W, H);
      }

      /* the spectrum fan */
      const base = Math.atan2(X.y - E.y, X.x - E.x) + .3;
      const spread = (.34 + Math.sin(t * .11) * .035) * (.9 + .1 * energy);
      const N = 30, L = Math.hypot(W, H) * 1.2, w = spread / (N - 1) * 1.1;
      g.globalCompositeOperation = add;
      for (let i = 0; i < N; i++) {
        const f = i / (N - 1), a = base - spread / 2 + spread * f, hue = f * 275;
        const flick = .85 + .15 * Math.sin(t * 1.3 + i * .7);
        const c = hsl(hue, 100, dark ? 62 : 55);
        const gr = g.createLinearGradient(X.x, X.y, X.x + Math.cos(a) * L * .8, X.y + Math.sin(a) * L * .8);
        const al = (dark ? .12 : .13) * flick * energy;
        gr.addColorStop(0, rgba(c, al)); gr.addColorStop(.35, rgba(c, al * .55)); gr.addColorStop(1, rgba(c, 0));
        g.fillStyle = gr; g.beginPath(); g.moveTo(X.x, X.y);
        g.lineTo(X.x + Math.cos(a - w) * L, X.y + Math.sin(a - w) * L);
        g.lineTo(X.x + Math.cos(a + w) * L, X.y + Math.sin(a + w) * L); g.closePath(); g.fill();
      }

      /* incoming white beam and its path through the glass */
      g.globalCompositeOperation = dark ? "lighter" : "source-over";
      beam(src, E, dark ? [255, 255, 255] : [255, 255, 255], 1);
      beam(E, X, [255, 255, 255], .7);

      /* dust in the light */
      const a0 = base - spread / 2, a1 = base + spread / 2;
      const segD = (p, q, x, y) => { const dx = q.x - p.x, dy = q.y - p.y, l = dx * dx + dy * dy; let u = ((x - p.x) * dx + (y - p.y) * dy) / l; u = Math.max(0, Math.min(1, u)); return Math.hypot(x - (p.x + u * dx), y - (p.y + u * dy)); };
      for (const p of parts) {
        p.x += p.vx * dt + Math.sin(t * .3 + p.ph) * .08; p.y += p.vy * dt;
        if (p.y < -10) { p.y = H + 10; p.x = Math.random() * W; } if (p.x < -10) p.x = W + 10; if (p.x > W + 10) p.x = -10;
        const tw = .6 + .4 * Math.sin(t * 1.7 + p.ph);
        const ang = Math.atan2(p.y - X.y, p.x - X.x), dist = Math.hypot(p.x - X.x, p.y - X.y);
        let col = null, al = 0, rr = p.r;
        if (p.x > X.x && ang > a0 && ang < a1) {
          const f = (ang - a0) / (a1 - a0); col = hsl(f * 275, 100, dark ? 72 : 45); al = Math.max(0, 1 - dist / (L * .75)) * tw * energy; rr = p.r * 1.6;
        } else if (segD(src, E, p.x, p.y) < 14) { col = [255, 255, 255]; al = .9 * tw; rr = p.r * 1.5; }
        if (col && al > .02) {
          g.globalCompositeOperation = dark ? "lighter" : "source-over";
          const gr = g.createRadialGradient(p.x, p.y, 0, p.x, p.y, rr * 4);
          gr.addColorStop(0, rgba(col, al)); gr.addColorStop(1, rgba(col, 0));
          g.fillStyle = gr; g.beginPath(); g.arc(p.x, p.y, rr * 4, 0, 6.283); g.fill();
        } else {
          g.globalCompositeOperation = "source-over";
          g.fillStyle = dark ? `rgba(255,255,255,${.1 * tw})` : `rgba(40,40,70,${.1 * tw})`;
          g.beginPath(); g.arc(p.x, p.y, p.r * .8, 0, 6.283); g.fill();
        }
      }

      /* the prism itself */
      g.globalCompositeOperation = "source-over";
      const mid = { x: (B.x + C.x) / 2, y: (B.y + C.y) / 2 };
      const fill = g.createLinearGradient(A.x, A.y, mid.x, mid.y);
      fill.addColorStop(0, dark ? "rgba(255,255,255,.13)" : "rgba(255,255,255,.55)");
      fill.addColorStop(1, dark ? "rgba(255,255,255,.03)" : "rgba(255,255,255,.18)");
      g.fillStyle = fill; tri(A, B, C); g.fill();
      const tint = g.createRadialGradient(X.x, X.y, 0, X.x, X.y, s * .55);
      tint.addColorStop(0, rgba(hsl((t * 12) % 360, 90, 65), dark ? .18 : .14)); tint.addColorStop(1, "rgba(0,0,0,0)");
      g.save(); tri(A, B, C); g.clip(); g.fillStyle = tint; g.fillRect(0, 0, W, H); g.restore();
      const edge = g.createLinearGradient(A.x, A.y, mid.x, mid.y);
      edge.addColorStop(0, dark ? "rgba(255,255,255,.75)" : "rgba(255,255,255,.95)");
      edge.addColorStop(1, dark ? "rgba(255,255,255,.14)" : "rgba(120,130,170,.35)");
      g.strokeStyle = edge; g.lineWidth = 1.3; tri(A, B, C); g.stroke();
      const inset = (p, k) => ({ x: p.x + (cxy(A, B, C).x - p.x) * k, y: p.y + (cxy(A, B, C).y - p.y) * k });
      g.strokeStyle = dark ? "rgba(255,255,255,.08)" : "rgba(255,255,255,.5)"; g.lineWidth = 1;
      tri(inset(A, .1), inset(B, .1), inset(C, .1)); g.stroke();
      /* a highlight sliding along the left face */
      const k = (Math.sin(t * .23) + 1) / 2, hp = { x: C.x + (A.x - C.x) * k, y: C.y + (A.y - C.y) * k };
      const hl = g.createRadialGradient(hp.x, hp.y, 0, hp.x, hp.y, s * .18);
      hl.addColorStop(0, dark ? "rgba(255,255,255,.35)" : "rgba(255,255,255,.9)"); hl.addColorStop(1, "rgba(255,255,255,0)");
      g.save(); tri(A, B, C); g.clip(); g.fillStyle = hl; g.fillRect(hp.x - s, hp.y - s, s * 2, s * 2); g.restore();

      /* glow where the light enters and leaves */
      g.globalCompositeOperation = dark ? "lighter" : "source-over";
      glow(X, s * .32, [255, 255, 255], (dark ? .32 : .55) * energy);
      glow(E, s * .12, [255, 255, 255], dark ? .3 : .5);

      /* the odd sparkle on a corner */
      if (Math.random() < dt * .25) { const vtx = [A, B, C][Math.floor(Math.random() * 3)]; sparks.push({ x: vtx.x, y: vtx.y, t0: t }); }
      sparks = sparks.filter(sp => t - sp.t0 < 1.4);
      for (const sp of sparks) { const u = (t - sp.t0) / 1.4, a = Math.sin(u * Math.PI); star(sp.x, sp.y, 14 + 10 * a, a * (dark ? .9 : .7)); }
    }
    const cxy = (A, B, C) => ({ x: (A.x + B.x + C.x) / 3, y: (A.y + B.y + C.y) / 3 });
    function tri(A, B, C) { g.beginPath(); g.moveTo(A.x, A.y); g.lineTo(B.x, B.y); g.lineTo(C.x, C.y); g.closePath(); }
    function beam(p, q, c, k) {
      for (const [lw, al] of [[22, .05], [9, .12], [3, .45], [1.2, .9]]) {
        g.strokeStyle = dark ? rgba(c, al * k) : `rgba(255,255,255,${Math.min(1, al * 1.6 * k)})`;
        g.lineWidth = lw; g.lineCap = "round"; g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(q.x, q.y); g.stroke();
      }
      if (!dark) { g.strokeStyle = "rgba(90,100,150,.12)"; g.lineWidth = 6; g.beginPath(); g.moveTo(p.x, p.y + 3); g.lineTo(q.x, q.y + 3); g.stroke(); }
    }
    function glow(p, r, c, a) { const gr = g.createRadialGradient(p.x, p.y, 0, p.x, p.y, r); gr.addColorStop(0, rgba(c, a)); gr.addColorStop(1, rgba(c, 0)); g.fillStyle = gr; g.beginPath(); g.arc(p.x, p.y, r, 0, 6.283); g.fill(); }
    function star(x, y, r, a) {
      g.fillStyle = dark ? `rgba(255,255,255,${a})` : `rgba(255,255,255,${a})`;
      g.beginPath(); g.moveTo(x, y - r); g.quadraticCurveTo(x, y, x + r * .22, y); g.quadraticCurveTo(x, y, x, y + r); g.quadraticCurveTo(x, y, x - r * .22, y); g.quadraticCurveTo(x, y, x, y - r); g.fill();
      g.beginPath(); g.moveTo(x - r * .6, y); g.quadraticCurveTo(x, y, x, y - r * .14); g.quadraticCurveTo(x, y, x + r * .6, y); g.quadraticCurveTo(x, y, x, y + r * .14); g.quadraticCurveTo(x, y, x - r * .6, y); g.fill();
      glow({ x, y }, r * 1.2, [255, 255, 255], a * .35);
    }
    function hsl(h, s = 100, l = 62) { s /= 100; l /= 100; const k = n => (n + h / 30) % 12, a = s * Math.min(l, 1 - l), f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1))); return [f(0), f(8), f(4)].map(v => Math.round(v * 255)); }

    addEventListener("resize", resize);
    document.addEventListener("visibilitychange", () => { cancelAnimationFrame(raf); if (!document.hidden) raf = requestAnimationFrame(frame); });
    resize(); raf = requestAnimationFrame(frame);
    return { palette, reseed: seed, setEnergy: e => energyTo = e };
  })();

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
    function forget() { pk = null; try { localStorage.removeItem("cos.pk"); localStorage.removeItem("cos.today"); localStorage.removeItem("cos.inbox"); } catch (e) {} }
    return { fromStore, unlock, open, forget, ready: () => !!pk };
  })();

  /* =========================================================
     Clock
     ========================================================= */
  const hm = $("#hm"), ampm = $("#ampm"), dateEl = $("#date");
  let lastMin = -1, nightOn = false;
  function tickClock(d) {
    const h = d.getHours(), m = d.getMinutes();
    if (m !== lastMin) {
      lastMin = m;
      hm.textContent = (S.h24 ? pad(h) : ((h % 12) || 12)) + ":" + pad(m);
      ampm.textContent = S.h24 ? "" : (h < 12 ? "AM" : "PM");
      dateEl.textContent = d.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
      renderToday(); drift();
    }
    const n = isNight(d);
    if (n !== nightOn || d.getSeconds() === 0) { nightOn = n; $("#dim").style.opacity = n ? (idle ? Math.min(.85, S.nightLevel + .15) : S.nightLevel) : 0; }
  }

  /* =========================================================
     Screensaver: panels fade, the clock floats to center, the light takes over
     ========================================================= */
  let idle = false, lastTouch = Date.now();
  function setIdle(on) {
    if (on === idle) return; idle = on;
    document.body.classList.toggle("idle", on);
    Scene.setEnergy(on ? 1.25 : 1);
    if (on) { Kit && Kit.hide && Kit.hide(); } else { Kit && Kit.show && Kit.show(); }
    drift(); nightOn = !nightOn; tickClock(new Date());
  }
  function drift() {
    const L = $("#left");
    if (!idle) { L.style.transform = ""; return; }
    L.style.transform = "";
    const clock = $("#clock").getBoundingClientRect();
    const portrait = innerHeight > innerWidth;
    const dy = portrait ? innerHeight * .3 - (clock.top + clock.height / 2) : 0;
    const jx = Math.random() * 22, jy = (Math.random() - .5) * 18; /* small wander so nothing burns in */
    L.style.transform = `translate(${jx}px, ${dy + jy}px)`;
  }
  ["pointerdown", "keydown"].forEach(ev => addEventListener(ev, () => {
    lastTouch = Date.now(); Sound.unlock();
    if (idle) setIdle(false);
  }, true));
  setInterval(() => { if (S.idleAfter && !idle && $("#sheetBack").hidden && $("#ring").hidden && Date.now() - lastTouch > S.idleAfter * 1000) setIdle(true); }, 1000);
  const Kit = { hide() { window.Kit && window.Kit.hide(); }, show() { window.Kit && window.Kit.show(); } };

  /* =========================================================
     Today (weather + day) and Inbox, from locked files
     ========================================================= */
  let today = load("today", null), inbox = load("inbox", []), readIds = new Set(load("read", [])), applied = new Set(load("applied", []));
  let known = new Set(inbox.map(m => m.id)), firstInbox = true, online = true;

  async function getJSON(path) {
    const r = await fetch(RAW + path + "?t=" + Date.now(), { cache: "no-store" });
    if (!r.ok) throw new Error(r.status); return r.json();
  }
  async function pullLocked() {
    if (!Vault.ready()) return;
    try {
      const env = await getJSON("os/data/today.json");
      today = await Vault.open(env); save("today", today);
      const box = await getJSON("os/data/inbox.json");
      const out = [];
      for (const it of box.items || []) {
        if (it.exp && new Date(it.exp) < new Date()) continue;
        try { out.push({ id: it.id, ...(await Vault.open(it)), at: it.at }); } catch (e) {}
      }
      const fresh = out.filter(m => !known.has(m.id));
      inbox = out; save("inbox", inbox); out.forEach(m => known.add(m.id));
      fresh.forEach(applyAction);
      if (fresh.length && !firstInbox) {
        showTab("inbox"); if (idle) setIdle(false);
        if (S.msgChime && !isNight(new Date())) Sound.play("msg", .8);
      }
      firstInbox = false; setNet(true);
    } catch (e) { setNet(false); }
    renderToday(); renderInbox();
  }
  function setNet(ok) { online = ok; $("#net").hidden = ok; }

  function applyAction(m) {
    const a = m.action; if (!a || applied.has(m.id)) return;
    applied.add(m.id); save("applied", [...applied].slice(-200));
    if (a.type === "alarm" && a.time) { alarms.push({ id: uid(), time: a.time, label: a.label || m.title, days: a.days || [], on: true, once: !(a.days && a.days.length) }); saveAlarms(); renderChips(); }
    if (a.type === "timer" && a.minutes && Date.now() - new Date(m.at) < 10 * 60000) startTimer(a.minutes * 60000, a.label || m.title);
  }

  function renderWeather() {
    const w = today && today.weather, el = $("#wx");
    if (!w) { el.hidden = true; return; }
    el.hidden = false;
    const night = isNightSky();
    const ic = (w.icon === "clear" && night) ? "night" : (WX[w.icon] ? w.icon : "partly");
    $("#wxIcon").innerHTML = WX[ic];
    $("#wxTemp").textContent = w.tempF != null ? Math.round(w.tempF) + "°" : "";
    $("#wxCond").textContent = w.condition || "";
    $("#wxHL").textContent = (w.high != null ? "H " + Math.round(w.high) + "°" : "") + (w.low != null ? "  L " + Math.round(w.low) + "°" : "") + (w.precipChance ? "  " + w.precipChance + "% rain" : "");
  }
  function isNightSky() {
    const w = today && today.weather, n = nowMins(new Date());
    if (w && w.sunrise && w.sunset) return n < mins(w.sunrise) || n > mins(w.sunset);
    return n < 6 * 60 + 30 || n > 19 * 60;
  }
  function renderToday() {
    renderWeather();
    const d = today && today.day, el = $("#pane-today");
    $("#headline").textContent = d && d.headline ? d.headline : "";
    if (!Vault.ready()) { el.innerHTML = `<div class="empty">Locked. Enter your passcode to see your day.</div>`; return; }
    if (!today) { el.innerHTML = `<div class="empty">Waiting for the first morning update.</div>`; return; }
    const n = nowMins(new Date()); let nextDone = false;
    const evs = (d && d.events || []).slice().sort((a, b) => mins(a.start) - mins(b.start)).map(e => {
      const end = e.end ? mins(e.end) : mins(e.start) + 60, past = end <= n, isNext = !past && !nextDone; if (isNext) nextDone = true;
      return `<div class="ev ${past ? "past" : ""} ${isNext ? "next" : ""}"><div class="t">${esc(fmtHM(e.start))}</div><div><div class="n">${esc(e.title)}</div>${e.where ? `<div class="w">${esc(e.where)}</div>` : ""}</div></div>`;
    }).join("");
    const allDay = (d && d.allDay || []).map(x => `<span class="tag">${esc(x)}</span>`).join("");
    const sp = today.extra && today.extra.spanish;
    const fresh = today.updatedAt && dayKey(new Date(today.updatedAt)) !== dayKey(new Date()) ? " (from yesterday)" : "";
    el.innerHTML = `
      ${d && d.summary ? `<p class="sum">${esc(d.summary)}</p>` : ""}
      ${allDay ? `<div class="tags">${allDay}</div>` : ""}
      ${evs ? `<div class="h">Schedule</div>${evs}` : `<div class="h">Schedule</div><div class="empty">Nothing on the calendar.</div>`}
      ${today.weather && today.weather.summary ? `<div class="h" style="margin-top:14px">Weather</div><div>${esc(today.weather.summary)}</div>` : ""}
      ${sp ? `<div class="palabra">Palabra del día: <b>${esc(sp.word)}</b>, ${esc(sp.meaning)}</div>` : ""}
      <div class="foot">Updated ${today.updatedAt ? new Date(today.updatedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : ""}${fresh}</div>`;
  }
  function renderInbox() {
    const el = $("#pane-inbox"), unread = inbox.filter(m => !readIds.has(m.id)).length;
    const b = $("#badge"); b.hidden = !unread; b.textContent = unread;
    if (!Vault.ready()) { el.innerHTML = `<div class="empty">Locked.</div>`; return; }
    if (!inbox.length) { el.innerHTML = `<div class="empty">No messages. Scheduled tasks will drop notes here.</div>`; return; }
    el.innerHTML = inbox.map(m => `
      <div class="msg lv-${esc(m.level || "info")} ${readIds.has(m.id) ? "read" : ""}" data-id="${esc(m.id)}">
        <div class="tt">${esc(m.title)}</div>
        ${m.body ? `<div class="bd">${esc(m.body)}</div>` : ""}
        <div class="meta">${esc(m.from || "Claude")} · ${ago(m.at)}${m.link ? ` · <a href="${esc(m.link)}" target="_blank" rel="noopener">open</a>` : ""}</div>
      </div>`).join("") + `<div class="row sp"><span></span><button class="link" id="markAll">Mark all read</button></div>`;
    el.querySelectorAll(".msg").forEach(n => n.onclick = e => {
      if (e.target.closest("a")) return;
      n.classList.toggle("open"); readIds.add(n.dataset.id); n.classList.add("read"); save("read", [...readIds].slice(-300)); renderBadge();
    });
    $("#markAll").onclick = () => { inbox.forEach(m => readIds.add(m.id)); save("read", [...readIds].slice(-300)); renderInbox(); };
  }
  function renderBadge() { const u = inbox.filter(m => !readIds.has(m.id)).length, b = $("#badge"); b.hidden = !u; b.textContent = u; }

  /* =========================================================
     Flags (public Flag Hub data)
     ========================================================= */
  let flagData = load("flags", null);
  async function pullFlags() {
    try {
      const [st, fl] = await Promise.all([getJSON("status.json"), getJSON("data/flags.json")]);
      const open = (fl.flags || []).filter(f => f.status === "open");
      open.sort((a, b) => (b.priority ? 1 : 0) - (a.priority ? 1 : 0) || String(b.created).localeCompare(String(a.created)));
      flagData = { mode: st.mode, open: open.length, waiting: (fl.proposals || []).filter(p => p.status === "waiting" || p.status === "ready").length, prio: open.filter(f => f.priority).length,
        top: open.slice(0, 12).map(f => ({ p: f.project, t: String(f.text || "").split("\n").find(s => s.trim()) || "", you: f.kind === "you", pr: !!f.priority })), at: new Date().toISOString() };
      save("flags", flagData);
    } catch (e) {}
    renderFlags();
  }
  function renderFlags() {
    const el = $("#pane-flags"), f = flagData;
    if (!f) { el.innerHTML = `<div class="empty">Loading flags…</div>`; return; }
    const modes = { off: "Off", light: "Light", big: "Go Big" };
    el.innerHTML = `
      <div class="stats"><div class="stat"><b>${f.open}</b><span>Open</span></div><div class="stat"><b>${f.waiting}</b><span>Waiting</span></div><div class="stat"><b>${modes[f.mode] || f.mode}</b><span>Night shift</span></div></div>
      ${f.top.map(x => `<div class="fl"><span class="d ${x.you ? "you" : ""}"></span><span class="x">${x.pr ? "⚡ " : ""}${esc(x.t)}</span><span class="p">${esc(x.p)}</span></div>`).join("")}
      <div class="row sp"><span class="lbl2">${f.prio} priority</span><a class="link" href="${HUB}" target="_blank" rel="noopener">Open Flag Hub</a></div>`;
  }

  /* =========================================================
     Tabs
     ========================================================= */
  function showTab(name) {
    $$("#tabs button").forEach(b => b.classList.toggle("on", b.dataset.tab === name));
    $$(".pane").forEach(p => p.classList.toggle("on", p.id === "pane-" + name));
    const b = $(`#tabs button[data-tab="${name}"]`), lens = $("#lens");
    if (b) { lens.style.width = b.offsetWidth + "px"; lens.style.transform = `translateX(${b.offsetLeft - 4}px)`; }
    save("tab", name);
  }
  $$("#tabs button").forEach(b => b.onclick = () => showTab(b.dataset.tab));
  addEventListener("resize", () => { showTab(load("tab", "today")); drift(); });

  /* =========================================================
     Timers
     ========================================================= */
  let timers = load("timers", []);
  const saveTimers = () => save("timers", timers);
  function startTimer(ms, label) { timers.push({ id: uid(), dur: ms, end: Date.now() + ms, left: null, label: label || "" }); saveTimers(); renderChips(); }
  function ringSvg(f, col) {
    const r = 14, c = 2 * Math.PI * r;
    return `<svg viewBox="0 0 34 34"><circle cx="17" cy="17" r="${r}" fill="none" stroke="currentColor" stroke-opacity=".15" stroke-width="3"/><circle cx="17" cy="17" r="${r}" fill="none" stroke="${col}" stroke-width="3" stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - f)}" transform="rotate(-90 17 17)" style="filter:drop-shadow(0 0 4px ${col})"/></svg>`;
  }
  function renderChips() {
    const now = Date.now(), el = $("#chips");
    const tchips = timers.map(t => {
      const left = t.left != null ? t.left : t.end - now, f = Math.max(0, Math.min(1, left / t.dur));
      return `<button class="chip glass ${t.left != null ? "paused" : ""}" data-t="${t.id}">${ringSvg(f, "var(--accent)")}<span><div>${fmtDur(left)}</div>${t.label ? `<div class="lbl">${esc(t.label)}</div>` : ""}</span></button>`;
    }).join("");
    const nx = nextAlarm();
    const achip = nx ? `<button class="chip glass" data-a="1"><span style="width:34px;display:grid;place-items:center;color:var(--star)">${I.alarm}</span><span><div>${esc(fmtHM(nx.time))}</div><div class="lbl">${esc(nx.label || "Alarm")}</div></span></button>` : "";
    el.innerHTML = tchips + achip;
    el.querySelectorAll("[data-t]").forEach(b => b.onclick = () => openTimer());
    el.querySelectorAll("[data-a]").forEach(b => b.onclick = () => openAlarms());
  }
  function tickTimers() {
    const now = Date.now(); let changed = false;
    for (const t of [...timers]) if (t.left == null && t.end <= now) { timers = timers.filter(x => x !== t); changed = true; ring({ kind: "timer", title: "Timer done", sub: t.label || fmtDur(t.dur) + " timer", t }); }
    if (changed) saveTimers();
    if (timers.length) renderChips();
  }

  /* =========================================================
     Alarms
     ========================================================= */
  let alarms = load("alarms", []);
  const saveAlarms = () => save("alarms", alarms);
  const DAYS = ["S", "M", "T", "W", "T", "F", "S"];
  function nextAlarm() {
    const now = new Date(); let best = null, bestIn = Infinity;
    for (const a of alarms) {
      if (!a.on) continue;
      for (let k = 0; k < 8; k++) {
        const d = new Date(now); d.setDate(d.getDate() + k); const [h, m] = a.time.split(":").map(Number); d.setHours(h, m, 0, 0);
        if (d <= now) continue; if (a.days && a.days.length && !a.days.includes(d.getDay())) continue;
        const inMs = d - now; if (inMs < bestIn) { bestIn = inMs; best = a; } break;
      }
    }
    for (const sn of load("snooze", [])) if (sn.at - now < bestIn && sn.at > now) { bestIn = sn.at - now; const d = new Date(sn.at); best = { time: pad(d.getHours()) + ":" + pad(d.getMinutes()), label: sn.label + " (snoozed)" }; }
    return bestIn < 24 * 3600e3 ? best : null;
  }
  function tickAlarms(d) {
    if (d.getSeconds() > 2) return;
    const key = dayKey(d) + " " + pad(d.getHours()) + ":" + pad(d.getMinutes());
    for (const a of alarms) {
      if (!a.on || a.time !== pad(d.getHours()) + ":" + pad(d.getMinutes()) || a.fired === key) continue;
      if (a.days && a.days.length && !a.days.includes(d.getDay())) continue;
      a.fired = key; if (a.once) a.on = false; saveAlarms();
      ring({ kind: "alarm", title: a.label || "Alarm", sub: fmtHM(a.time), a });
    }
    let sn = load("snooze", []); const due = sn.filter(s => s.at <= Date.now());
    if (due.length) { save("snooze", sn.filter(s => s.at > Date.now())); due.forEach(s => ring({ kind: "alarm", title: s.label || "Alarm", sub: "Snoozed alarm", a: { label: s.label } })); }
  }

  /* =========================================================
     Ringing screen
     ========================================================= */
  let ringLoop = null;
  function ring(o) {
    setIdle(false); $("#dim").style.opacity = 0;
    const el = $("#ring"); el.hidden = false;
    el.innerHTML = `<div><div class="orb"><i></i><i></i><i></i><b></b><em></em></div><h2>${esc(o.title)}</h2><p>${esc(o.sub || "")}</p>
      <div class="row">${o.kind === "timer" ? `<button class="btn" id="rgMore">+1 min</button>` : `<button class="btn" id="rgMore">Snooze 9 min</button>`}<button class="btn pri" id="rgStop">Stop</button></div></div>`;
    let n = 0; clearInterval(ringLoop);
    const go = () => { Sound.play(o.kind, Math.min(1, .45 + n * .08)); n++; if (n > (o.kind === "alarm" ? 70 : 25)) stopRing(); };
    go(); ringLoop = setInterval(go, 2600);
    $("#rgStop").onclick = stopRing;
    $("#rgMore").onclick = () => {
      if (o.kind === "timer") startTimer(60000, o.t && o.t.label);
      else { const sn = load("snooze", []); sn.push({ at: Date.now() + 9 * 60000, label: o.a && o.a.label || "Alarm" }); save("snooze", sn); }
      stopRing(); renderChips();
    };
  }
  function stopRing() { clearInterval(ringLoop); $("#ring").hidden = true; renderChips(); lastTouch = Date.now(); }

  /* =========================================================
     Sheets
     ========================================================= */
  function sheet(title, html, bind) {
    const back = $("#sheetBack"), s = $("#sheet");
    s.innerHTML = `<div class="sh-top"><h2>${title}</h2><button class="close" id="shX" aria-label="Close">${I.close}</button></div>${html}`;
    back.hidden = false; $("#shX").onclick = closeSheet;
    back.onclick = e => { if (e.target === back) closeSheet(); };
    bind && bind(s);
  }
  function closeSheet() { $("#sheetBack").hidden = true; $("#sheet").innerHTML = ""; renderChips(); }

  let cm = 5, cs = 0;
  function openTimer() {
    const now = Date.now();
    const list = timers.map(t => { const left = t.left != null ? t.left : t.end - now; return `<div class="item"><div class="grow"><div class="big">${fmtDur(left)}</div><div class="sub">${esc(t.label || fmtDur(t.dur) + " timer")}${t.left != null ? " · paused" : ""}</div></div><button class="btn" data-pause="${t.id}">${t.left != null ? "Resume" : "Pause"}</button><button class="btn bad" data-del="${t.id}">Cancel</button></div>`; }).join("");
    sheet("Timer", `
      <div class="grid">${[1, 3, 5, 10, 15, 20, 30, 45, 60, 90].map(m => `<button class="btn" data-q="${m}">${m < 60 ? m + " min" : m / 60 + " hr"}</button>`).join("").replace("1.5 hr", "1½ hr")}</div>
      <div class="row" style="gap:18px">
        <div class="step"><button class="btn" data-s="m-">−</button><b id="cm">${pad(cm)}</b><button class="btn" data-s="m+">+</button><span class="lbl2">min</span></div>
        <div class="step"><button class="btn" data-s="s-">−</button><b id="cs">${pad(cs)}</b><button class="btn" data-s="s+">+</button><span class="lbl2">sec</span></div>
      </div>
      <div class="row"><input class="field" id="tLabel" placeholder="Label (optional)" maxlength="40"><button class="btn pri" id="tGo">Start</button></div>
      ${list ? `<div class="h" style="margin-top:16px">Running</div>${list}` : ""}`, s => {
      s.querySelectorAll("[data-q]").forEach(b => b.onclick = () => { startTimer(+b.dataset.q * 60000, $("#tLabel").value.trim()); closeSheet(); });
      s.querySelectorAll("[data-s]").forEach(b => b.onclick = () => {
        const k = b.dataset.s; if (k === "m+") cm = Math.min(180, cm + 1); if (k === "m-") cm = Math.max(0, cm - 1); if (k === "s+") cs = (cs + 15) % 60; if (k === "s-") cs = (cs + 45) % 60;
        $("#cm").textContent = pad(cm); $("#cs").textContent = pad(cs);
      });
      $("#tGo").onclick = () => { const ms = (cm * 60 + cs) * 1000; if (ms > 0) { startTimer(ms, $("#tLabel").value.trim()); closeSheet(); } };
      s.querySelectorAll("[data-pause]").forEach(b => b.onclick = () => { const t = timers.find(x => x.id === b.dataset.pause); if (!t) return; if (t.left != null) { t.end = Date.now() + t.left; t.left = null; } else { t.left = t.end - Date.now(); } saveTimers(); openTimer(); });
      s.querySelectorAll("[data-del]").forEach(b => b.onclick = () => { timers = timers.filter(x => x.id !== b.dataset.del); saveTimers(); openTimer(); });
    });
  }

  let newDays = [];
  function openAlarms() {
    const list = alarms.slice().sort((a, b) => mins(a.time) - mins(b.time)).map(a => `
      <div class="item"><div class="grow"><div class="big" style="${a.on ? "" : "opacity:.45"}">${esc(fmtHM(a.time))}</div><div class="sub">${esc(a.label || "Alarm")} · ${a.days && a.days.length ? a.days.map(d => ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d]).join(" ") : "once"}</div></div>
      <button class="sw ${a.on ? "on" : ""}" data-tog="${a.id}" aria-label="On or off"></button><button class="btn bad" data-del="${a.id}">Delete</button></div>`).join("");
    sheet("Alarms", `
      <div class="row" style="margin-top:0"><input type="time" class="field" id="aTime" value="07:00"><input class="field" id="aLabel" placeholder="Label" maxlength="40"></div>
      <div class="row sp"><div class="days">${DAYS.map((d, i) => `<button class="day ${newDays.includes(i) ? "on" : ""}" data-d="${i}">${d}</button>`).join("")}</div><button class="btn pri" id="aAdd">Add alarm</button></div>
      <div class="lbl2" style="margin-top:8px">No days picked means it rings once.</div>
      ${list ? `<div class="h" style="margin-top:16px">Your alarms</div>${list}` : ""}`, s => {
      s.querySelectorAll("[data-d]").forEach(b => b.onclick = () => { const i = +b.dataset.d; newDays = newDays.includes(i) ? newDays.filter(x => x !== i) : [...newDays, i]; b.classList.toggle("on"); });
      $("#aAdd").onclick = () => { const t = $("#aTime").value; if (!t) return; alarms.push({ id: uid(), time: t, label: $("#aLabel").value.trim(), days: [...newDays].sort(), on: true, once: !newDays.length }); newDays = []; saveAlarms(); openAlarms(); };
      s.querySelectorAll("[data-tog]").forEach(b => b.onclick = () => { const a = alarms.find(x => x.id === b.dataset.tog); a.on = !a.on; delete a.fired; saveAlarms(); openAlarms(); });
      s.querySelectorAll("[data-del]").forEach(b => b.onclick = () => { alarms = alarms.filter(x => x.id !== b.dataset.del); saveAlarms(); openAlarms(); });
    });
  }

  function openSettings() {
    const seg = (key, opts) => `<div class="seg" data-seg="${key}">${opts.map(([v, l]) => `<button data-v="${v}" class="${String(S[key]) === String(v) ? "on" : ""}">${l}</button>`).join("")}</div>`;
    const sw = key => `<button class="sw ${S[key] ? "on" : ""}" data-sw="${key}"></button>`;
    sheet("Settings", `
      <div class="row sp" style="margin-top:0"><span>24-hour clock</span>${sw("h24")}</div>
      <div class="row sp"><span>Screensaver after</span>${seg("idleAfter", [[30, "30s"], [90, "90s"], [300, "5m"], [0, "Never"]])}</div>
      <div class="row sp"><span>Motion</span>${seg("motion", [["full", "Full"], ["calm", "Calm"]])}</div>
      <div class="row sp"><span>Dim at night</span>${sw("night")}</div>
      <div class="row"><input type="time" class="field" id="nFrom" value="${S.nightFrom}"><span class="lbl2">to</span><input type="time" class="field" id="nTo" value="${S.nightTo}"></div>
      <div class="row"><span class="lbl2">Night dimness</span><input type="range" id="nLvl" min="0.2" max="0.85" step="0.05" value="${S.nightLevel}"></div>
      <div class="row"><span class="lbl2">Volume</span><input type="range" id="vol" min="0" max="1" step="0.05" value="${S.vol}"><button class="btn" id="test">Test</button></div>
      <div class="row sp"><span>Chime for new messages</span>${sw("msgChime")}</div>
      <div class="row sp"><button class="btn" id="refresh">Refresh now</button><button class="btn bad" id="forget">Forget passcode</button></div>
      <div class="ver">Claude OS ${VERSION} · ${online ? "online" : "offline"} · Tip: Guided Access keeps the phone on this screen</div>`, s => {
      s.querySelectorAll("[data-sw]").forEach(b => b.onclick = () => { const k = b.dataset.sw; S[k] = !S[k]; saveS(); b.classList.toggle("on"); lastMin = -1; nightOn = !nightOn; tickClock(new Date()); renderChips(); });
      s.querySelectorAll("[data-seg]").forEach(g => g.querySelectorAll("button").forEach(b => b.onclick = () => {
        const k = g.dataset.seg, v = b.dataset.v; S[k] = isNaN(+v) ? v : +v; saveS();
        g.querySelectorAll("button").forEach(x => x.classList.toggle("on", x === b)); if (k === "motion") Scene.reseed();
      }));
      $("#nFrom").onchange = e => { S.nightFrom = e.target.value; saveS(); nightOn = !nightOn; };
      $("#nTo").onchange = e => { S.nightTo = e.target.value; saveS(); nightOn = !nightOn; };
      $("#nLvl").oninput = e => { S.nightLevel = +e.target.value; saveS(); nightOn = !nightOn; };
      $("#vol").oninput = e => { S.vol = +e.target.value; saveS(); };
      $("#test").onclick = () => { Sound.unlock(); Sound.play("test"); };
      $("#refresh").onclick = () => { pullLocked(); pullFlags(); closeSheet(); };
      $("#forget").onclick = () => { if (confirm("Forget the passcode on this phone? You'll need to type it again.")) { Vault.forget(); location.reload(); } };
    });
  }

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
      setTimeout(() => { if (!el.classList.contains("gone")) begin(); }, 8000); /* no tap: start anyway, sound unlocks on first touch */
      return;
    }
    el.style.background = "color-mix(in srgb, var(--bg) 30%, transparent)";
    el.innerHTML = `<form class="gate-card glass" id="gf" autocomplete="off">
      <img src="icons/icon-192.png?v=1" alt=""><h1>Claude OS</h1><p>Enter your passcode once. This phone will remember it.</p>
      <input class="field" id="gp" type="password" autocapitalize="none" autocorrect="off" spellcheck="false" placeholder="passcode" enterkeyhint="go">
      <button class="btn pri" type="submit">Unlock</button>
      <button class="btn" type="button" id="skip">Skip for now</button></form>`;
    $("#gf").onsubmit = async e => {
      e.preventDefault(); Sound.unlock();
      const card = $("#gf");
      try { await Vault.unlock($("#gp").value); el.style.background = ""; begin(); renderToday(); renderInbox(); }
      catch (err) { card.classList.remove("shake"); void card.offsetWidth; card.classList.add("shake"); $("#gp").select(); }
    };
    $("#skip").onclick = () => { el.style.background = ""; begin(); };
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
    if (window.Kit && window.Kit.theme) window.Kit.theme.onChange((theme, p) => Scene.palette(p));
  });

  $("#gear").innerHTML = I.gear;
  $("#btnTimer").innerHTML = I.timer; $("#btnTimer").onclick = openTimer;
  $("#btnAlarm").innerHTML = I.alarm; $("#btnAlarm").onclick = openAlarms;
  $("#btnSleep").innerHTML = I.moon; $("#btnSleep").onclick = e => { e.stopPropagation(); setTimeout(() => setIdle(true), 50); };
  $("#wx").onclick = () => showTab("today");
  $("#dock").style.setProperty("--gd", "1s");

  showTab(load("tab", "today"));
  renderToday(); renderInbox(); renderFlags(); renderChips();
  gate();
  pullFlags();
  setInterval(() => { const d = new Date(); tickClock(d); tickTimers(); tickAlarms(d); }, 1000);
  setInterval(pullLocked, 60 * 1000);
  setInterval(pullFlags, 4 * 60 * 1000);
  setInterval(() => { if (idle) drift(); renderChips(); }, 60 * 1000);
  tickClock(new Date());
})();
