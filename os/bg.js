/* Claude OS backgrounds: light through glass, drawn on the GPU.
   Shards, Caustics and Silk are shaders; Prism is the original drawing. */
window.OSBG = (() => {
  const COMMON = `precision highp float; uniform vec2 R; uniform float T; uniform vec3 K; uniform float C; uniform float LM;
vec3 spec(float x){ return .5+.5*cos(6.28318*(x+vec3(0.,.33,.67))); }
vec3 pal(float x){ vec3 s=spec(x); return mix(s, K*(.35+.9*spec(x*.7).g), C); }
vec2 h2(vec2 p){ p=vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3))); return fract(sin(p)*43758.5453); }
float h1(vec2 p){ return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453); }
float nz(vec2 p){ vec2 i=floor(p),f=fract(p); f=f*f*(3.-2.*f); return mix(mix(h1(i),h1(i+vec2(1,0)),f.x),mix(h1(i+vec2(0,1)),h1(i+vec2(1,1)),f.x),f.y); }
float fbm(vec2 p){ float v=0.,a=.5; for(int i=0;i<5;i++){ v+=a*nz(p); p=p*2.03+vec2(1.7,9.2); a*=.5; } return v; }
vec3 rays(vec2 uv){ vec3 s=vec3(0.); for(int i=0;i<6;i++){ float fi=float(i); float a=fi*1.05+T*.025*(mod(fi,2.)*2.-1.); vec2 d=vec2(cos(a),sin(a));
  vec2 o=vec2(sin(fi*2.3+T*.05),cos(fi*1.7+T*.04))*.45; float dd=dot(uv-o,vec2(-d.y,d.x)); s+=pal(fi/6.+T*.01)*exp(-dd*dd*70.)*(.07+.05*sin(T*.3+fi)); } return s; }
vec3 finish(vec3 c, vec2 uv){ c*=1.-.35*dot(uv,uv); c=1.-exp(-c*1.6); c=pow(c,vec3(.95));
  return mix(c, vec3(.93,.93,.96)*(1.-c*.45)+c*.38, LM); }
`;
  const FX = {
    shards: { scale: .8, src: `
vec3 vor(vec2 x){ vec2 n=floor(x),f=fract(x),mg=vec2(0.),mr=vec2(0.); float md=8.;
  for(int j=-1;j<=1;j++) for(int i=-1;i<=1;i++){ vec2 g=vec2(float(i),float(j)); vec2 o=h2(n+g); o=.5+.4*sin(T*.1+6.2831*o); vec2 r=g+o-f; float d=dot(r,r); if(d<md){md=d;mr=r;mg=g;} }
  md=8.; for(int j=-2;j<=2;j++) for(int i=-2;i<=2;i++){ vec2 g=mg+vec2(float(i),float(j)); vec2 o=h2(n+g); o=.5+.4*sin(T*.1+6.2831*o); vec2 r=g+o-f;
    if(dot(mr-r,mr-r)>.00001) md=min(md,dot(.5*(mr+r),normalize(r-mr))); }
  return vec3(md,h2(n+mg)); }
vec3 shard(vec2 uv,vec2 L){ vec3 v=vor(uv*2.6); float ang=v.y*6.2831+T*.04; vec2 nr=vec2(cos(ang),sin(ang));
  float face=pow(max(0.,dot(nr,L)),5.); float sweep=.5+.5*sin(dot(uv,L)*2.5-T*.5+v.z*6.);
  float soft=smoothstep(.0,.09,v.x);             /* light fades toward each shard's edge, so no hard steps */
  float edge=exp(-v.x*v.x*900.);                 /* thin, soft glint along the cracks */
  float g=face*(.3+.7*sweep)*soft;
  return pal(v.y+v.z*.4+T*.012)*g*1.15+edge*(.07+face*.5)*vec3(1.)+vec3(.015,.02,.04)*soft; }
void main(){ vec2 uv=(gl_FragCoord.xy-.5*R)/R.y; float la=T*.06; vec2 L=vec2(cos(la),sin(la)); vec2 o=vec2(-L.y,L.x)*.012;
  vec3 c=vec3(shard(uv+o,L).r,shard(uv,L).g,shard(uv-o,L).b)+rays(uv); gl_FragColor=vec4(finish(c,uv),1.); }` },
    caustics: { scale: .5, src: `
float caus(vec2 p,float tt){ vec2 i=p; float c=1.,inten=.005; for(int n=0;n<5;n++){ float t2=tt*(1.-(3.5/float(n+1)));
  i=p+vec2(cos(t2-i.x)+sin(t2+i.y),sin(t2-i.y)+cos(t2+i.x)); c+=1./length(vec2(p.x/(sin(i.x+t2)/inten),p.y/(cos(i.y+t2)/inten))); }
  c/=5.; c=1.17-pow(c,1.4); return pow(abs(c),8.); }
void main(){ vec2 uv=(gl_FragCoord.xy-.5*R)/R.y; vec2 p=uv*3.4-vec2(250.); float tt=T*.22+23.; vec2 d=vec2(.035,.01);
  vec3 c=vec3(caus(p+d,tt),caus(p,tt),caus(p-d,tt)); vec3 tint=pal(uv.x*.25+uv.y*.15+T*.02);
  vec3 col=vec3(.01,.015,.035)+clamp(c,0.,1.2)*mix(vec3(.9),tint*1.5,.6)*.7+tint*.05+rays(uv)*.6; gl_FragColor=vec4(finish(col,uv),1.); }` },
    silk: { scale: .5, src: `
void main(){ vec2 uv=(gl_FragCoord.xy-.5*R)/R.y; vec2 q=uv*1.3; float w=fbm(q+vec2(T*.03,-T*.02)); float v=fbm(q*1.2+w*1.9+T*.015);
  float b=sin(v*26.+T*.35); float lines=pow(1.-abs(b),22.)*.9+pow(1.-abs(b),4.)*.1;
  vec3 c=pal(v*1.3+T*.02+uv.x*.12)*lines*(.35+v*1.1)+vec3(.012,.014,.03)+pal(v+.5)*.04*v+rays(uv)*.5; gl_FragColor=vec4(finish(c,uv),1.); }` },
  };
  const NAMES = { shards: "Shards", caustics: "Caustics", silk: "Silk", prism: "Prism" };

  const cv = document.getElementById("gl");
  const gl = cv.getContext("webgl", { antialias: false, premultipliedAlpha: false, preserveDrawingBuffer: false });
  let prog = null, U = {}, cur = null, K = [.6, .5, 1], C = 0, Cto = 0, LM = 0, LMto = 0, raf = 0, last = 0, fps = 60;
  if (gl) {
    const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  }
  const progs = {};
  function compile(name) {
    if (progs[name]) return progs[name];
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) console.error(name, gl.getShaderInfoLog(s)); return s; };
    const p = gl.createProgram();
    gl.attachShader(p, sh(gl.VERTEX_SHADER, "attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}"));
    gl.attachShader(p, sh(gl.FRAGMENT_SHADER, COMMON + FX[name].src)); gl.linkProgram(p);
    const u = {}; ["R", "T", "K", "C", "LM"].forEach(k => u[k] = gl.getUniformLocation(p, k));
    return progs[name] = { p, u, a: gl.getAttribLocation(p, "a") };
  }
  function size() {
    if (!gl || !cur || !FX[cur]) return;
    const d = Math.min(window.devicePixelRatio || 1, 2) * FX[cur].scale;
    cv.width = Math.round(innerWidth * d); cv.height = Math.round(innerHeight * d); gl.viewport(0, 0, cv.width, cv.height);
  }
  function frame(ts) {
    raf = requestAnimationFrame(frame);
    if (ts - last < 1000 / fps - 2) return; last = ts;
    C += (Cto - C) * .04; LM += (LMto - LM) * .06;
    if (!prog) return;
    gl.uniform2f(U.R, cv.width, cv.height); gl.uniform1f(U.T, ts / 1000 + 40); gl.uniform3f(U.K, K[0], K[1], K[2]);
    gl.uniform1f(U.C, C); gl.uniform1f(U.LM, LM); gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  function use(name) {
    if (name === cur) return; cur = name;
    const isGL = !!FX[name] && !!gl;
    document.body.dataset.bg = name;
    if (window.OSPrism) window.OSPrism.run(name === "prism" || (!gl && name !== "prism"));
    if (!isGL) { cancelAnimationFrame(raf); raf = 0; prog = null; return; }
    const P = compile(name); prog = P.p; U = P.u; gl.useProgram(prog);
    gl.enableVertexAttribArray(P.a); gl.vertexAttribPointer(P.a, 2, gl.FLOAT, false, 0, 0);
    size(); if (!raf) raf = requestAnimationFrame(frame);
  }
  /* crossfade: dim the canvas, swap, bring it back */
  function show(name) {
    if (name === cur) return;
    document.body.classList.add("bg-swap");
    setTimeout(() => { use(name); setTimeout(() => document.body.classList.remove("bg-swap"), 60); }, 650);
  }
  addEventListener("resize", size);
  document.addEventListener("visibilitychange", () => { if (document.hidden) { cancelAnimationFrame(raf); raf = 0; } else if (prog && !raf) raf = requestAnimationFrame(frame); });
  const toRGB = c => { const t = document.createElement("canvas").getContext("2d"); t.fillStyle = "#000"; t.fillStyle = c; const h = t.fillStyle; if (h[0] === "#") return [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255); const m = h.match(/\d+(\.\d+)?/g); return m ? m.slice(0, 3).map(v => +v / 255) : [.6, .5, 1]; };
  function palette(theme, p) {
    if (!p) return;
    LMto = p.mode === "light" ? 1 : 0;
    if (theme === "chameleon") { K = toRGB(p.vars.accent); Cto = 1; } else Cto = 0;
    if (window.OSPrism) window.OSPrism.palette(p);
  }
  return { show, use, palette, names: NAMES, list: ["shards", "caustics", "silk", "prism"], get: () => cur, setFps: f => fps = f, hasGL: !!gl };
})();
