/* Claude OS: the original prism background (light through one glass prism). */
window.OSPrism = (() => {
const S = window.OSSettings || { motion: "full" };
const $ = q => document.querySelector(q);
  const cv = $("#prism"), g = cv.getContext("2d");
  let W = 0, H = 0, dpr = 1, parts = [], dark = true, bg = "#07080f", acc = [157, 140, 255];
  let energy = 1, energyTo = 1, last = 0, raf = 0, sparks = [], tx = innerWidth * .47, ty = innerHeight * .57;
  const toRGB = c => { const t = document.createElement("canvas").getContext("2d"); t.fillStyle = "#000"; t.fillStyle = c; const h = t.fillStyle; if (h[0] === "#") return [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)); const m = h.match(/\d+(\.\d+)?/g); return m ? m.slice(0, 3).map(Number) : [157, 140, 255]; };
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2); W = innerWidth; H = innerHeight;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); g.setTransform(dpr, 0, 0, dpr, 0, 0); seed();
  }
  function seed() {
    const n = 36; /* a few motes of dust, not a snow globe */
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
        const f = (ang - a0) / (a1 - a0); col = hsl(f * 275, 100, dark ? 72 : 45); al = Math.max(0, 1 - dist / (L * .75)) * tw * energy * .45; rr = p.r * 1.2;
      } else if (segD(src, E, p.x, p.y) < 14) { col = [255, 255, 255]; al = .45 * tw; rr = p.r * 1.2; }
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

  let on = false;
  addEventListener("resize", () => on && resize());
  document.addEventListener("visibilitychange", () => { cancelAnimationFrame(raf); raf = 0; if (!document.hidden && on) raf = requestAnimationFrame(frame); });
  function run(v) { on = v; cv.style.display = v ? "block" : "none"; cancelAnimationFrame(raf); raf = 0; if (v) { resize(); raf = requestAnimationFrame(frame); } }
  return { palette, run, setEnergy: e => energyTo = e };
})();
