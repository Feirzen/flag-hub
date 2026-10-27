/* Claude OS backgrounds: light through glass, drawn on the GPU.
   Shards, Caustics and Silk are shaders; Prism is the original drawing. */
window.OSBG = (() => {
  const COMMON = `precision highp float; uniform vec2 R; uniform float T; uniform vec3 K; uniform float C; uniform float LM; uniform float B;
vec3 spec(float x){ return .5+.5*cos(6.28318*(x+vec3(0.,.33,.67))); }
vec3 pal(float x){ vec3 s=spec(x); return mix(s, K*(.35+.9*spec(x*.7).g), C); }
vec2 h2(vec2 p){ p=vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3))); return fract(sin(p)*43758.5453); }
float h1(vec2 p){ return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453); }
float nz(vec2 p){ vec2 i=floor(p),f=fract(p); f=f*f*(3.-2.*f); return mix(mix(h1(i),h1(i+vec2(1,0)),f.x),mix(h1(i+vec2(0,1)),h1(i+vec2(1,1)),f.x),f.y); }
float fbm(vec2 p){ float v=0.,a=.5; for(int i=0;i<5;i++){ v+=a*nz(p); p=p*2.03+vec2(1.7,9.2); a*=.5; } return v; }
vec3 rays(vec2 uv){ vec3 s=vec3(0.); for(int i=0;i<6;i++){ float fi=float(i); float a=fi*1.05+T*.025*(mod(fi,2.)*2.-1.); vec2 d=vec2(cos(a),sin(a));
  vec2 o=vec2(sin(fi*2.3+T*.05),cos(fi*1.7+T*.04))*.45; float dd=dot(uv-o,vec2(-d.y,d.x)); s+=pal(fi/6.+T*.01)*exp(-dd*dd*70.)*(.07+.05*sin(T*.3+fi)); } return s; }
vec3 finish(vec3 c, vec2 uv){ c*=B*(1.-.35*dot(uv,uv)); c=1.-exp(-c*1.6); c=pow(c,vec3(.95));
  /* light looks: the same light, but as color washes on pearl glass instead of glow on black */
  float m=max(max(c.r,c.g),c.b); vec3 hue=c/(m+.001);
  vec3 lt=mix(vec3(.92,.925,.95), hue*.78+.12, clamp(m*1.5,0.,.85)) - vec3(.05)*dot(uv,uv);
  return mix(c, lt, LM); }
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
    fluted: { scale: .5, src: `
vec3 scene(vec2 q){ float f=fbm(q*.8+vec2(T*.02,-T*.015)); vec3 c=pal(f*2.6+dot(q,vec2(.3,.18))+T*.015)*(.16+.42*f);
  float s=pow(.5+.5*sin(dot(q,vec2(.8,.6))*3.-T*.3+f*2.),8.); return c+s*.32*mix(vec3(1.),pal(f+.3),.45); }
void main(){ vec2 uv=(gl_FragCoord.xy-.5*R)/R.y; float k=uv.x*46.+sin(uv.y*1.5+T*.05)*.6;
  float fl=sin(k), sh=.5+.5*cos(k); vec2 o=vec2(fl*.045,0.);
  vec3 c=vec3(scene(uv+o*1.15).r,scene(uv+o).g,scene(uv+o*.85).b);
  c*=.7+.45*sh; c+=pow(sh,24.)*.06*vec3(1.); c+=vec3(.012,.013,.03)+rays(uv)*.2;
  gl_FragColor=vec4(finish(c,uv),1.); }` },
    pond: { scale: .5, src: `
float caus(vec2 p,float tt){ vec2 i=p; float c=1.,inten=.005; for(int n=0;n<5;n++){ float t2=tt*(1.-(3.5/float(n+1)));
  i=p+vec2(cos(t2-i.x)+sin(t2+i.y),sin(t2-i.y)+cos(t2+i.x)); c+=1./length(vec2(p.x/(sin(i.x+t2)/inten),p.y/(cos(i.y+t2)/inten))); }
  c/=5.; c=1.17-pow(c,1.4); return pow(abs(c),8.); }
void main(){ vec2 uv=(gl_FragCoord.xy-.5*R)/R.y; vec2 w=vec2(0.);
  for(int i=0;i<7;i++){ float fi=float(i); float ph=T*.2+h1(vec2(fi,3.)); float cyc=floor(ph), t=fract(ph);
    vec2 c=(h2(vec2(fi,cyc))-.5)*vec2(1.9,1.); vec2 d=uv-c; float r=length(d), e=r-t*.55;
    w+=d/(r+.001)*sin(e*70.)*exp(-e*e*80.)*(1.-t)*.014; }
  vec2 p=(uv+w)*3.-vec2(250.); float tt=T*.18+23.; vec2 dd=vec2(.03,.01);
  vec3 c=clamp(vec3(caus(p+dd,tt),caus(p,tt),caus(p-dd,tt)),0.,1.2);
  vec3 water=mix(vec3(.0,.03,.055),vec3(.01,.09,.13),uv.y+.5);
  float shafts=pow(.5+.5*sin(uv.x*6.+fbm(vec2(uv.x*2.,T*.05))*4.),6.)*smoothstep(-.6,.5,uv.y)*.22;
  vec3 col=water+c*mix(vec3(.55,.85,1.),pal(uv.x*.3+T*.02)*1.3,.35)*.55+shafts*mix(vec3(.6,.9,1.),pal(T*.02),.3)+length(w)*20.*vec3(.55,.85,1.)*.18;
  gl_FragColor=vec4(finish(col,uv),1.); }` },
    snow: { scale: .6, src: `
float flake(vec2 p,float s,float rot){ float r=length(p); float a=atan(p.y,p.x)+rot; float arm=abs(cos(3.*a));
  float body=smoothstep(s*(.3+.7*pow(arm,8.)),s*(.2+.5*pow(arm,8.)),r); float core=smoothstep(s*.28,s*.12,r);
  float ray=exp(-abs(sin(3.*a))*r/s*16.)*smoothstep(s,0.,r); return max(body*.45,max(core*.5,ray)); }
void main(){ vec2 uv=(gl_FragCoord.xy-.5*R)/R.y; vec3 col=mix(vec3(.01,.015,.035),vec3(.02,.035,.07),uv.y+.5)+rays(uv)*.2;
  float la=T*.05; vec2 L=normalize(vec2(cos(la),sin(la)+.5));        /* the light slowly moving around the room */
  vec2 span=vec2(R.x/R.y+.4,1.4);
  for(int i=0;i<90;i++){ float fi=float(i); vec2 hh=h2(vec2(fi,4.1)), hg=h2(vec2(fi,9.7));
    float depth=.35+.65*hg.x;
    vec2 vel=vec2((hh.x-.5)*.05,-(.01+.016*hh.y))*depth;              /* each flake its own slow path */
    vec2 drift=vec2(sin(T*(.12+hg.y*.18)+fi)*.07,cos(T*(.09+hh.x*.12)+fi*1.7)*.035);
    vec2 pos=mod(hh*span+vel*T+drift+span*.5,span)-span*.5;
    vec2 p=uv-pos; float s=(.018+.03*hg.y)*(.6+depth);
    if(dot(p,p)>s*s*1.3) continue;
    float rot=T*(.08+hh.y*.25)*(hg.x>.5?1.:-1.)+fi;
    float v=flake(p,s,rot);
    float a=atan(p.y,p.x)+rot, facet=pow(abs(cos(3.*a)),2.);
    float glint=pow(max(0.,dot(normalize(p+1e-5),L)),3.)*facet;      /* the arm facing the light catches it */
    float flash=pow(.5+.5*sin(rot*2.3+fi),14.);                       /* now and then the whole flake turns into the light */
    col+=v*(vec3(.72,.83,1.)*(.3+.35*depth)+vec3(1.)*(glint*1.1+flash*.9)); }
  gl_FragColor=vec4(finish(col,uv),1.); }` },
    orbs: { scale: .6, src: `
vec3 field(vec2 q){ float f=fbm(q*.9+T*.02); return pal(f*1.6+q.x*.2+T*.01)*(.04+.12*f); }
vec3 lasers(vec2 q){ vec3 c=vec3(0.); for(int i=0;i<5;i++){ float fi=float(i); float a=fi*.9+sin(T*.05+fi)*.35; vec2 d=vec2(cos(a),sin(a));
  vec2 o=vec2(sin(fi*1.3+T*.04),cos(fi*2.1+T*.03))*.3; float k=dot(q-o,vec2(-d.y,d.x));
  c+=pal(fi*.2+T*.02)*(exp(-k*k*9000.)*.5+exp(-k*k*400.)*.035); } return c; }
void main(){ vec2 uv=(gl_FragCoord.xy-.5*R)/R.y; vec2 q=uv; float rim=0., inside=0., spec=0., halo=0.;
  for(int i=0;i<6;i++){ float fi=float(i); vec2 c=vec2(sin(T*.04*(1.+fi*.15)+fi*2.4),cos(T*.035*(1.+fi*.1)+fi*1.9))*vec2(.55,.25);
    float r=.13+.09*h1(vec2(fi,7.)); vec2 p=uv-c; float d=length(p);
    if(d<r){ float z=sqrt(1.-d*d/(r*r)); q-=p*(1.-z)*1.5; rim+=pow(1.-z,2.5); inside+=1.;
      vec2 hl=p/r-vec2(-.35,.42); spec+=exp(-dot(hl,hl)*40.)*.9+exp(-dot(hl,hl)*5.)*.07; }
    else halo+=exp(-(d-r)*45.)*.12; }
  float disp=.003+rim*.018;
  vec3 bg=vec3(field(q+vec2(disp,0.)).r,field(q).g,field(q-vec2(disp,0.)).b);
  vec3 las=vec3(lasers(q+vec2(disp,0.)).r,lasers(q).g,lasers(q-vec2(disp,0.)).b);
  float hit=dot(lasers(uv),vec3(.33));
  vec3 col=bg*(1.+inside*1.4)+las*(.4+inside*1.1)+rim*.4*vec3(.85,.92,1.)+spec+hit*rim*pal(rim*2.+T*.05)*2.+halo*vec3(.7,.8,1.)+vec3(.01,.012,.03);
  gl_FragColor=vec4(finish(col,uv),1.); }` },
  };
  const NAMES = { shards: "Shards", caustics: "Caustics", silk: "Silk", fluted: "Fluted glass", pond: "Rain on the pond", snow: "Glass snow", orbs: "Glass orbs", prism: "Prism" };

  const cv = document.getElementById("gl");
  const gl = cv.getContext("webgl", { antialias: false, premultipliedAlpha: false, preserveDrawingBuffer: false });
  let spd = 1, spdTo = 1, bri = 1, briTo = 1, clock = 40 + Math.random() * 400, paused = false;
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
    const u = {}; ["R", "T", "K", "C", "LM", "B"].forEach(k => u[k] = gl.getUniformLocation(p, k));
    return progs[name] = { p, u, a: gl.getAttribLocation(p, "a") };
  }
  function size() {
    if (!gl || !cur || !FX[cur]) return;
    const d = Math.min(window.devicePixelRatio || 1, 2) * FX[cur].scale;
    cv.width = Math.round(innerWidth * d); cv.height = Math.round(innerHeight * d); gl.viewport(0, 0, cv.width, cv.height);
  }
  function frame(ts) {
    raf = requestAnimationFrame(frame);
    if (ts - last < 1000 / fps - 2) return;
    const dt = Math.min(.1, (ts - (last || ts)) / 1000); last = ts;
    C += (Cto - C) * .04; LM += (LMto - LM) * .06; spd += (spdTo - spd) * .02; bri += (briTo - bri) * .02; clock += dt * spd;
    if (!prog) return;
    gl.uniform2f(U.R, cv.width, cv.height); gl.uniform1f(U.T, clock); gl.uniform1f(U.B, bri); gl.uniform3f(U.K, K[0], K[1], K[2]);
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
    size(); if (!raf && !paused) raf = requestAnimationFrame(frame);
  }
  /* crossfade: dim the canvas, swap, bring it back */
  function show(name) {
    if (name === cur) return;
    document.body.classList.add("bg-swap");
    setTimeout(() => { use(name); setTimeout(() => document.body.classList.remove("bg-swap"), 60); }, 650);
  }
  addEventListener("resize", size);
  document.addEventListener("visibilitychange", () => { if (document.hidden) { cancelAnimationFrame(raf); raf = 0; } else if (prog && !raf && !paused) raf = requestAnimationFrame(frame); });
  const toRGB = c => { const t = document.createElement("canvas").getContext("2d"); t.fillStyle = "#000"; t.fillStyle = c; const h = t.fillStyle; if (h[0] === "#") return [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255); const m = h.match(/\d+(\.\d+)?/g); return m ? m.slice(0, 3).map(v => +v / 255) : [.6, .5, 1]; };
  function palette(theme, p) {
    if (!p) return;
    LMto = p.mode === "light" ? 1 : 0;
    if (theme === "chameleon") { K = toRGB(p.vars.accent); Cto = 1; } else Cto = 0;
    if (window.OSPrism) window.OSPrism.palette(p);
  }
  /* mood: speed and brightness (focus slows and dims, breaks brighten); pause stops drawing (night mode) */
  function mood(speed, bright) { spdTo = speed; briTo = bright; }
  function pause(v) { paused = v; cv.style.visibility = v ? "hidden" : ""; if (v) { cancelAnimationFrame(raf); raf = 0; } else if (prog && !raf) raf = requestAnimationFrame(frame); if (window.OSPrism) window.OSPrism.run(!v && cur === "prism"); }
  return { show, use, palette, mood, pause, names: NAMES, list: ["shards", "caustics", "silk", "fluted", "orbs", "pond", "snow", "prism"], get: () => cur, setFps: f => fps = f, hasGL: !!gl };
})();
