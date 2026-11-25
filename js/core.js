'use strict';
/* =========================================================
   Shiba Days — core: utils, renderer, input, audio, fx, save
   ========================================================= */
THREE.ColorManagement.legacyMode = false;
const G = window.G = { T: THREE, scenes: {}, cur: null, pets: {}, time: 0 };
const V3 = THREE.Vector3;
const $ = (s) => document.querySelector(s);

const U = G.U = {
  clamp: (v, a, b) => (v < a ? a : v > b ? b : v),
  lerp: (a, b, t) => a + (b - a) * t,
  damp: (a, b, k, dt) => a + (b - a) * (1 - Math.exp(-k * dt)),
  rand: (a, b) => a + Math.random() * (b - a),
  randi: (a, b) => Math.floor(a + Math.random() * (b - a + 1)),
  pick: (arr) => arr[Math.floor(Math.random() * arr.length)],
  chance: (p) => Math.random() < p,
  angDiff: (a, b) => { let d = b - a; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return d; },
  smooth: (e0, e1, x) => { const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); },
  d2: (ax, az, bx, bz) => Math.hypot(ax - bx, az - bz),
  esc: (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])),
  hash: (x, y, z) => { const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453; return s - Math.floor(s); },
  noise3(x, y, z) { // value noise
    const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z);
    const fx = x - ix, fy = y - iy, fz = z - iz;
    const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy), sz = fz * fz * (3 - 2 * fz);
    const h = U.hash; const l = U.lerp;
    const a = l(l(h(ix, iy, iz), h(ix + 1, iy, iz), sx), l(h(ix, iy + 1, iz), h(ix + 1, iy + 1, iz), sx), sy);
    const b = l(l(h(ix, iy, iz + 1), h(ix + 1, iy, iz + 1), sx), l(h(ix, iy + 1, iz + 1), h(ix + 1, iy + 1, iz + 1), sx), sy);
    return l(a, b, sz);
  },
  fmtTime: (d) => { const h = d.getHours(), m = d.getMinutes(); return ((h + 11) % 12 + 1) + ':' + String(m).padStart(2, '0') + (h < 12 ? ' am' : ' pm'); },
};

/* ---------------- Save ---------------- */
G.SAVE_KEY = 'shibadays.save.v1';
G.newState = () => ({
  v: 1, coins: 300, pets: [], active: null, nextId: 1,
  inv: { kibble: 6, jerky: 3, biscuit: 3, shampoo: 3, catfood: 2 },
  toys: { ball: 1, disc: 1, squeaky: 1 },
  acc: { collar_red: 1, bandana_red: 1 },
  trophies: [], npc: {}, bowl: { food: null, amt: 0 }, water: 1,
  settings: { music: 0.45, sfx: 0.8, quality: 'auto' },
  stats: { walks: 0, throws: 0, catches: 0, contests: 0, presents: 0, treats: 0, pets: 0 },
  tut: {}, unlocked: { beginner: true }, portrait: null, day: 1, created: Date.now(), last: Date.now(), dailyBonus: '',
});
G.load = () => {
  try { const s = localStorage.getItem(G.SAVE_KEY); if (s) { const o = JSON.parse(s); const n = G.newState(); for (const k in o) n[k] = o[k]; return n; } } catch (e) { /* storage off */ }
  return null;
};
// cup progress is tracked per pet (each dog climbs the ladder on their own)
G.petCups = function (d) {
  if (!d.cups) {
    d.cups = { beginner: true };
    for (const t of (G.state && G.state.trophies) || []) {
      if (t.pet !== d.id || t.place !== 1) continue;
      if (t.kind) d.cups[t.cls + '_won'] = true;
      else { const i = (G.CONTESTS || []).findIndex((c) => c.id === t.cls); if (i >= 0) { d.cups[t.cls + '_won'] = true; const nx = G.CONTESTS[i + 1]; if (nx) d.cups[nx.id] = true; } }
    }
  }
  return d.cups;
};
G.save = () => { if (!G.state) return; try { G.state.last = Date.now(); localStorage.setItem(G.SAVE_KEY, JSON.stringify(G.state)); } catch (e) { /* full or blocked */ } };
G.wipe = () => { try { localStorage.removeItem(G.SAVE_KEY); } catch (e) { } };

/* ---------------- Renderer ---------------- */
G.QUALITY = {
  low: { name: 'Low', pr: 1, shadows: false, shadowSize: 512, grass: 0.3 },
  medium: { name: 'Medium', pr: 1.5, shadows: true, shadowSize: 1024, grass: 0.65 },
  high: { name: 'High', pr: 2, shadows: true, shadowSize: 2048, grass: 1 },
};
G.quality = function () { const q = G.state && G.state.settings.quality; return G.QUALITY[q] || (G.mobile ? G.QUALITY.medium : G.QUALITY.high); };
G.applyQuality = function () {
  const q = G.quality(); const r = G.renderer; if (!r) return;
  r.setPixelRatio(Math.min(devicePixelRatio || 1, q.pr)); const sh = r.shadowMap.enabled !== q.shadows; r.shadowMap.enabled = q.shadows;
  if (sh) for (const k in G.scenes) { const sc = G.scenes[k].scene; if (sc) sc.traverse((o) => { if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => (m.needsUpdate = true)); }); }
  G.onResize();
};
G.initRenderer = function () {
  const canvas = $('#gl');
  const mobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) || Math.min(innerWidth, innerHeight) < 600;
  G.mobile = mobile;
  const r = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  r.setPixelRatio(Math.min(devicePixelRatio || 1, G.quality().pr));
  r.outputEncoding = THREE.sRGBEncoding;
  r.toneMapping = THREE.ACESFilmicToneMapping;
  r.toneMappingExposure = 1.12;
  r.shadowMap.enabled = G.quality().shadows;
  r.shadowMap.type = THREE.PCFSoftShadowMap;
  r.setSize(innerWidth, innerHeight, false);
  G.renderer = r;
  G.raycaster = new THREE.Raycaster();
  addEventListener('resize', G.onResize);
};
G.onResize = function () {
  const w = innerWidth, h = innerHeight;
  G.renderer.setSize(w, h, false);
  if (G.cur && G.cur.camera) { G.cur.camera.aspect = w / h; G.cur.camera.updateProjectionMatrix(); }
  if (G.cur && G.cur.onResize) G.cur.onResize(w, h);
};
G.aspect = () => innerWidth / innerHeight;
// interiors: on tall (portrait) screens widen the field of view so the sides of the room aren't cut off
G.fitFov = function (cam, minH) {
  if (!cam || !minH) return; if (cam.userData.baseFov === undefined) cam.userData.baseFov = cam.fov;
  const base = cam.userData.baseFov; const need = 2 * Math.atan(Math.tan(minH * Math.PI / 360) / Math.max(0.2, cam.aspect)) * 180 / Math.PI;
  const f = Math.min(80, Math.max(base, need)); if (Math.abs(f - cam.fov) > 0.05) { cam.fov = f; cam.updateProjectionMatrix(); }
};

/* ---------------- Raycast helpers ---------------- */
G.ray = function (p, cam) {
  G.raycaster.setFromCamera({ x: p.nx, y: p.ny }, cam || G.cur.camera);
  return G.raycaster;
};
G.pick = function (p, objs, recursive = true) {
  const rc = G.ray(p);
  return rc.intersectObjects(objs, recursive);
};
G.groundAt = function (p, y = 0, out = new V3()) {
  const rc = G.ray(p);
  const plane = new THREE.Plane(new V3(0, 1, 0), -y);
  return rc.ray.intersectPlane(plane, out);
};
G.toScreen = function (v, cam) {
  const c = v.clone().project(cam || G.cur.camera);
  return { x: (c.x * 0.5 + 0.5) * innerWidth, y: (-c.y * 0.5 + 0.5) * innerHeight, z: c.z };
};

/* ---------------- Input ---------------- */
G.input = (() => {
  const I = { down: false, x: 0, y: 0, nx: 0, ny: 0, sx: 0, sy: 0, t0: 0, moved: 0, hist: [], pointers: new Map(), pinch: 0 };
  function mk(e) {
    I.x = e.clientX; I.y = e.clientY;
    I.nx = (e.clientX / innerWidth) * 2 - 1; I.ny = -(e.clientY / innerHeight) * 2 + 1;
    const t = e.timeStamp && e.timeStamp > 1 ? e.timeStamp : performance.now();
    return { x: I.x, y: I.y, nx: I.nx, ny: I.ny, t, id: e.pointerId, type: e.pointerType };
  }
  I.velocity = function () { // px/s over the last ~110ms of movement (uses event timestamps)
    const h = I.hist; if (h.length < 2) return { vx: 0, vy: 0 };
    const last = h[h.length - 1]; let end = h.length - 1;
    while (end > 0 && h[end - 1].x === last.x && h[end - 1].y === last.y) end--;
    if (end < h.length - 1) end = Math.max(0, end);
    const e = h[end];
    if (last.t - e.t > 170) return { vx: 0, vy: 0 }; // finger rested before release
    let i = end; while (i > 0 && e.t - h[i - 1].t < 110) i--;
    if (i === end) i = Math.max(0, end - 1);
    const a = h[i]; const dt = Math.max(12, e.t - a.t) / 1000;
    return { vx: (e.x - a.x) / dt, vy: (e.y - a.y) / dt };
  };
  I.attach = function (el) {
    el.addEventListener('pointerdown', (e) => {
      G.audio.init();
      I.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (I.pointers.size === 2) { const [a, b] = [...I.pointers.values()]; I.pinch = Math.hypot(a.x - b.x, a.y - b.y); if (I.down && G.cur && G.cur.onCancel) G.cur.onCancel(); I.down = false; return; }
      if (I.pointers.size > 2) return;
      try { el.setPointerCapture(e.pointerId); } catch (_) { }
      const p = mk(e); I.down = true; I.sx = p.x; I.sy = p.y; I.t0 = p.t; I.moved = 0; I.hist = [p]; I.id = e.pointerId;
      if (G.cur && G.cur.onDown && !G.blockInput) G.cur.onDown(p);
    });
    el.addEventListener('pointermove', (e) => {
      if (I.pointers.has(e.pointerId)) I.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (I.pointers.size === 2) {
        const [a, b] = [...I.pointers.values()]; const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (I.pinch > 0 && G.cur && G.cur.onZoom) G.cur.onZoom((I.pinch - d) * 0.01);
        I.pinch = d; return;
      }
      if (I.down && e.pointerId !== I.id) return;
      const p = mk(e);
      if (I.down) { I.moved = Math.max(I.moved, Math.hypot(p.x - I.sx, p.y - I.sy)); I.hist.push(p); if (I.hist.length > 30) I.hist.shift(); }
      if (G.cur && G.cur.onMove && !G.blockInput) G.cur.onMove(p, I.down);
    });
    const up = (e) => {
      I.pointers.delete(e.pointerId);
      if (!I.down || e.pointerId !== I.id) return;
      const p = mk(e); I.hist.push(p); I.down = false;
      p.tap = I.moved < 10 && p.t - I.t0 < 450; p.dur = p.t - I.t0;
      const v = I.velocity(); p.vx = v.vx; p.vy = v.vy;
      if (G.cur && G.cur.onUp && !G.blockInput) G.cur.onUp(p);
    };
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', (e) => { I.pointers.delete(e.pointerId); if (I.down && G.cur && G.cur.onCancel) G.cur.onCancel(); I.down = false; });
    el.addEventListener('wheel', (e) => { e.preventDefault(); if (G.cur && G.cur.onZoom) G.cur.onZoom(e.deltaY * 0.0015); }, { passive: false });
    el.addEventListener('contextmenu', (e) => e.preventDefault());
    I.keys = {};
    addEventListener('keydown', (e) => { if (e.target.tagName === 'INPUT') return; I.keys[e.code] = true; if (G.cur && G.cur.onKey) G.cur.onKey(e.code, true); });
    addEventListener('keyup', (e) => { I.keys[e.code] = false; });
    addEventListener('blur', () => { I.keys = {}; });
  };
  return I;
})();

/* ---------------- Scene manager ---------------- */
G.go = function (name, opts = {}) {
  if (G.switching) return;
  G.switching = true;
  const fade = $('#fade');
  fade.classList.add('on');
  G.ui && G.ui.closeAll();
  setTimeout(() => {
    try {
      if (G.cur && G.cur.exit) G.cur.exit();
      const sc = G.scenes[name];
      if (!sc.inited) { sc.init(); sc.inited = true; }
      G.cur = sc; G.curName = name;
      G.fx.attach(sc.scene);
      sc.enter(opts);
      G.ui.setScene(name);
      G.audio.track(sc.music || name);
      G.onResize();
    } catch (err) { console.error(err); }
    setTimeout(() => { fade.classList.remove('on'); G.switching = false; }, 60);
    G.save();
  }, 380);
};

/* ---------------- Time of day ---------------- */
G.daylight = function () { // 0 = night, 1 = full day
  const d = new Date(); const h = d.getHours() + d.getMinutes() / 60;
  if (h < 5) return 0; if (h < 7.5) return (h - 5) / 2.5; if (h < 17.5) return 1; if (h < 20) return 1 - (h - 17.5) / 2.5; return 0;
};
G.season = function () { const m = new Date().getMonth(); return m < 2 || m === 11 ? 'winter' : m < 5 ? 'spring' : m < 8 ? 'summer' : 'autumn'; };

/* ---------------- Canvas textures ---------------- */
G.tex = {};
G.canvasTex = function (w, h, draw, opts = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'); draw(g, w, h);
  const t = new THREE.CanvasTexture(c);
  t.encoding = THREE.sRGBEncoding;
  if (opts.repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(opts.repeat[0], opts.repeat[1]); }
  t.anisotropy = 4;
  return t;
};
G.textTex = function (text, o = {}) {
  const font = o.font || '600 64px Fredoka, sans-serif';
  const pad = o.pad ?? 24;
  const c = document.createElement('canvas'); const g = c.getContext('2d'); g.font = font;
  const lines = String(text).split('\n');
  const w = Math.ceil(Math.max(...lines.map((l) => g.measureText(l).width)) + pad * 2);
  const lh = o.lh || parseInt(font.match(/(\d+)px/)[1], 10) * 1.15;
  const h = Math.ceil(lh * lines.length + pad * 1.4);
  c.width = o.w || w; c.height = o.h || h;
  g.font = font;
  if (o.bg) { g.fillStyle = o.bg; const r = o.radius ?? 28; g.beginPath(); g.roundRect ? g.roundRect(0, 0, c.width, c.height, r) : g.rect(0, 0, c.width, c.height); g.fill(); }
  if (o.border) { g.strokeStyle = o.border; g.lineWidth = o.borderW || 8; g.beginPath(); g.roundRect ? g.roundRect(4, 4, c.width - 8, c.height - 8, (o.radius ?? 28) - 4) : g.rect(4, 4, c.width - 8, c.height - 8); g.stroke(); }
  g.fillStyle = o.color || '#3b2a1f'; g.textAlign = 'center'; g.textBaseline = 'middle';
  if (o.stroke) { g.strokeStyle = o.stroke; g.lineWidth = o.strokeW || 10; g.lineJoin = 'round'; }
  lines.forEach((l, i) => { const y = c.height / 2 + (i - (lines.length - 1) / 2) * lh; if (o.stroke) g.strokeText(l, c.width / 2, y); g.fillText(l, c.width / 2, y); });
  const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 4;
  t.userData = { w: c.width, h: c.height };
  return t;
};

function drawHeart(g, cx, cy, s, col) {
  g.fillStyle = col; g.beginPath();
  g.moveTo(cx, cy + s * 0.35);
  g.bezierCurveTo(cx - s * 1.0, cy - s * 0.35, cx - s * 0.45, cy - s * 1.05, cx, cy - s * 0.45);
  g.bezierCurveTo(cx + s * 0.45, cy - s * 1.05, cx + s * 1.0, cy - s * 0.35, cx, cy + s * 0.35);
  g.fill();
}
G.drawHeart = drawHeart;
G.makeFxTextures = function () {
  const T = G.tex;
  T.heart = G.canvasTex(64, 64, (g) => { drawHeart(g, 32, 38, 30, '#ff5c8a'); g.fillStyle = 'rgba(255,255,255,.7)'; g.beginPath(); g.ellipse(21, 24, 6, 4, -0.6, 0, 7); g.fill(); });
  T.sparkle = G.canvasTex(64, 64, (g) => {
    const grd = g.createRadialGradient(32, 32, 0, 32, 32, 30); grd.addColorStop(0, 'rgba(255,255,255,1)'); grd.addColorStop(0.3, 'rgba(255,240,170,.9)'); grd.addColorStop(1, 'rgba(255,220,120,0)');
    g.fillStyle = grd; g.beginPath(); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, r = i % 2 ? 9 : 31; g.lineTo(32 + Math.cos(a) * r, 32 + Math.sin(a) * r); } g.fill();
  });
  T.note = G.canvasTex(64, 64, (g) => { g.fillStyle = '#7a5cff'; g.beginPath(); g.ellipse(24, 46, 11, 8, -0.4, 0, 7); g.fill(); g.fillRect(31, 10, 5, 36); g.beginPath(); g.moveTo(36, 10); g.quadraticCurveTo(52, 16, 50, 30); g.quadraticCurveTo(46, 20, 36, 20); g.fill(); });
  T.zzz = G.canvasTex(64, 64, (g) => { g.font = '700 50px Fredoka, sans-serif'; g.fillStyle = '#6aa0e8'; g.strokeStyle = '#fff'; g.lineWidth = 6; g.textAlign = 'center'; g.textBaseline = 'middle'; g.strokeText('z', 32, 34); g.fillText('z', 32, 34); });
  T.bubble = G.canvasTex(64, 64, (g) => { const grd = g.createRadialGradient(24, 22, 2, 32, 32, 30); grd.addColorStop(0, 'rgba(255,255,255,.95)'); grd.addColorStop(0.6, 'rgba(210,235,255,.35)'); grd.addColorStop(0.92, 'rgba(180,215,255,.7)'); grd.addColorStop(1, 'rgba(180,215,255,0)'); g.fillStyle = grd; g.beginPath(); g.arc(32, 32, 30, 0, 7); g.fill(); });
  T.drop = G.canvasTex(64, 64, (g) => { g.fillStyle = '#5bb6ff'; g.beginPath(); g.moveTo(32, 6); g.quadraticCurveTo(54, 36, 46, 48); g.arc(32, 44, 15, 0.3, Math.PI - 0.3); g.quadraticCurveTo(10, 36, 32, 6); g.fill(); g.fillStyle = 'rgba(255,255,255,.7)'; g.beginPath(); g.ellipse(26, 40, 4, 7, 0.3, 0, 7); g.fill(); });
  T.puff = G.canvasTex(64, 64, (g) => { const grd = g.createRadialGradient(32, 32, 2, 32, 32, 30); grd.addColorStop(0, 'rgba(255,250,240,.9)'); grd.addColorStop(1, 'rgba(255,250,240,0)'); g.fillStyle = grd; g.beginPath(); g.arc(32, 32, 30, 0, 7); g.fill(); });
  T.square = G.canvasTex(16, 16, (g) => { g.fillStyle = '#fff'; g.fillRect(0, 0, 16, 16); });
  T.leaf = G.canvasTex(64, 64, (g) => { g.fillStyle = '#fff'; g.beginPath(); g.moveTo(32, 4); g.quadraticCurveTo(60, 30, 32, 60); g.quadraticCurveTo(4, 30, 32, 4); g.fill(); g.strokeStyle = 'rgba(0,0,0,.15)'; g.lineWidth = 3; g.beginPath(); g.moveTo(32, 8); g.lineTo(32, 58); g.stroke(); });
  T.petal = G.canvasTex(64, 64, (g) => { g.fillStyle = '#ffd1df'; g.beginPath(); g.ellipse(32, 32, 16, 26, 0, 0, 7); g.fill(); g.fillStyle = '#fff0f5'; g.beginPath(); g.ellipse(28, 26, 6, 10, 0, 0, 7); g.fill(); });
  T.snow = G.canvasTex(64, 64, (g) => { const grd = g.createRadialGradient(32, 32, 0, 32, 32, 28); grd.addColorStop(0, 'rgba(255,255,255,1)'); grd.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = grd; g.beginPath(); g.arc(32, 32, 28, 0, 7); g.fill(); });
  T.ring = G.canvasTex(128, 128, (g) => { g.strokeStyle = '#fff'; g.lineWidth = 10; g.beginPath(); g.arc(64, 64, 52, 0, 7); g.stroke(); });
  T.shadow = G.canvasTex(128, 128, (g) => { const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64); grd.addColorStop(0, 'rgba(0,0,0,.45)'); grd.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = grd; g.fillRect(0, 0, 128, 128); });
  // emotes
  const emo = (draw) => G.canvasTex(128, 128, (g) => {
    g.fillStyle = '#fff'; g.strokeStyle = 'rgba(80,50,30,.25)'; g.lineWidth = 5;
    g.beginPath(); g.arc(64, 58, 48, 0, 7); g.fill(); g.stroke();
    g.beginPath(); g.moveTo(50, 98); g.lineTo(64, 122); g.lineTo(72, 98); g.fill();
    draw(g);
  });
  T.emo = {
    heart: emo((g) => drawHeart(g, 64, 66, 34, '#ff5c8a')),
    note: emo((g) => { g.fillStyle = '#7a5cff'; g.beginPath(); g.ellipse(54, 78, 14, 10, -0.4, 0, 7); g.fill(); g.fillRect(63, 30, 7, 48); g.fillRect(63, 30, 22, 8); }),
    bang: emo((g) => { g.fillStyle = '#ff7a2f'; g.font = '800 76px Fredoka, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('!', 64, 62); }),
    q: emo((g) => { g.fillStyle = '#4aa6e0'; g.font = '700 70px Fredoka, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('?', 64, 62); }),
    zzz: emo((g) => { g.fillStyle = '#6aa0e8'; g.font = '700 46px Fredoka, sans-serif'; g.textAlign = 'center'; g.fillText('z', 48, 80); g.font = '700 34px Fredoka'; g.fillText('z', 72, 56); g.font = '700 24px Fredoka'; g.fillText('z', 88, 38); }),
    hungry: emo((g) => { g.fillStyle = '#c87a3a'; g.beginPath(); g.ellipse(64, 70, 34, 16, 0, 0, Math.PI); g.fill(); g.fillStyle = '#e8a660'; g.fillRect(30, 62, 68, 8); g.fillStyle = '#7a4a24'; for (let i = 0; i < 5; i++) { g.beginPath(); g.arc(44 + i * 10, 60 - (i % 2) * 4, 6, 0, 7); g.fill(); } }),
    thirsty: emo((g) => { g.fillStyle = '#5bb6ff'; g.beginPath(); g.moveTo(64, 26); g.quadraticCurveTo(92, 66, 82, 78); g.arc(64, 74, 20, 0.3, Math.PI - 0.3); g.quadraticCurveTo(36, 66, 64, 26); g.fill(); }),
    anger: emo((g) => { g.strokeStyle = '#e2574c'; g.lineWidth = 9; g.lineCap = 'round'; for (let i = 0; i < 4; i++) { g.save(); g.translate(64, 58); g.rotate(i * Math.PI / 2 + 0.78); g.beginPath(); g.moveTo(8, 8); g.quadraticCurveTo(24, 10, 26, 26); g.stroke(); g.restore(); } }),
    sweat: emo((g) => { g.fillStyle = '#7fc8ff'; g.beginPath(); g.moveTo(70, 26); g.quadraticCurveTo(96, 66, 84, 80); g.arc(70, 74, 18, 0.2, Math.PI - 0.2); g.quadraticCurveTo(44, 66, 70, 26); g.fill(); }),
    sparkle: emo((g) => { g.fillStyle = '#f2c24b'; g.beginPath(); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, r = i % 2 ? 12 : 38; g.lineTo(64 + Math.cos(a) * r, 58 + Math.sin(a) * r); } g.fill(); }),
    ball: emo((g) => { g.fillStyle = '#c8e04a'; g.beginPath(); g.arc(64, 60, 28, 0, 7); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 5; g.beginPath(); g.arc(34, 60, 24, -1, 1); g.stroke(); g.beginPath(); g.arc(94, 60, 24, 2.1, 4.2); g.stroke(); }),
    dots: emo((g) => { g.fillStyle = '#7a5c46'; [42, 64, 86].forEach((x) => { g.beginPath(); g.arc(x, 60, 8, 0, 7); g.fill(); }); }),
    walk: emo((g) => { g.fillStyle = '#ee8a3c'; g.beginPath(); g.ellipse(64, 72, 18, 15, 0, 0, 7); g.fill(); [[40, 50], [54, 36], [74, 36], [88, 50]].forEach(([x, y]) => { g.beginPath(); g.ellipse(x, y, 8, 10, 0, 0, 7); g.fill(); }); }),
    dirty: emo((g) => { g.fillStyle = '#9b7a55'; [[46, 50, 12], [74, 44, 9], [80, 72, 13], [52, 76, 8]].forEach(([x, y, r]) => { g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); }); }),
  };
};

/* ---------------- FX particles ---------------- */
G.fx = (() => {
  const F = { group: new THREE.Group(), live: [], pool: [] };
  F.group.name = 'fx';
  F.attach = (scene) => { scene.add(F.group); F.clear(); };
  F.clear = () => { for (const p of F.live) { p.s.visible = false; F.pool.push(p); } F.live.length = 0; };
  function get(tex) {
    let p = F.pool.pop();
    if (!p) { const m = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }); p = { s: new THREE.Sprite(m) }; F.group.add(p.s); }
    p.s.material.map = tex; p.s.material.color.set(0xffffff); p.s.material.opacity = 1; p.s.material.rotation = 0; p.s.visible = true;
    return p;
  }
  F.spawn = function (type, pos, n = 1, o = {}) {
    const T = G.tex;
    for (let i = 0; i < n; i++) {
      let tex = T[type] || T.sparkle;
      const p = get(tex);
      p.s.position.copy(pos);
      p.vel = new V3(); p.grav = 0; p.life = 1; p.age = 0; p.s0 = 0.12; p.s1 = 0.16; p.spin = 0; p.drag = 0; p.fadeIn = 0.1;
      switch (type) {
        case 'heart': p.vel.set(U.rand(-0.25, 0.25), U.rand(0.5, 0.8), U.rand(-0.25, 0.25)); p.life = U.rand(1.0, 1.5); p.s0 = 0.08; p.s1 = 0.16; break;
        case 'sparkle': { const a = Math.random() * 6.28; p.vel.set(Math.cos(a) * 0.6, U.rand(0.2, 0.9), Math.sin(a) * 0.6); p.life = U.rand(0.5, 0.9); p.s0 = 0.14; p.s1 = 0.02; p.drag = 2; break; }
        case 'note': p.vel.set(U.rand(-0.3, 0.3), U.rand(0.4, 0.6), 0); p.life = 1.6; p.s0 = 0.1; p.s1 = 0.15; break;
        case 'zzz': p.vel.set(0.15, 0.25, 0); p.life = 2.0; p.s0 = 0.05; p.s1 = 0.16; break;
        case 'bubble': p.vel.set(U.rand(-0.2, 0.2), U.rand(0.1, 0.5), U.rand(-0.2, 0.2)); p.life = U.rand(1, 2); p.s0 = U.rand(0.05, 0.12); p.s1 = p.s0 * 1.3; break;
        case 'drop': { const a = Math.random() * 6.28, sp = U.rand(0.8, 2.2); p.vel.set(Math.cos(a) * sp, U.rand(0.5, 2), Math.sin(a) * sp); p.grav = 7; p.life = 0.8; p.s0 = 0.05; p.s1 = 0.03; break; }
        case 'puff': p.vel.set(U.rand(-0.3, 0.3), U.rand(0.05, 0.3), U.rand(-0.3, 0.3)); p.life = 0.6; p.s0 = 0.1; p.s1 = 0.35; p.fadeIn = 0; break;
        case 'confetti': { p.s.material.map = T.square; p.s.material.color.setHSL(Math.random(), 0.85, 0.6); const a = Math.random() * 6.28; p.vel.set(Math.cos(a) * 2, U.rand(3, 6), Math.sin(a) * 2); p.grav = 4; p.drag = 1.2; p.life = 2.5; p.s0 = p.s1 = 0.08; p.spin = U.rand(-8, 8); break; }
        case 'star': p.s.material.map = T.sparkle; p.vel.set(U.rand(-1, 1), U.rand(1, 2.5), U.rand(-1, 1)); p.grav = 3; p.life = 1; p.s0 = 0.25; p.s1 = 0.05; break;
        default: break;
      }
      if (o.color) p.s.material.color.set(o.color);
      if (o.scale) { p.s0 *= o.scale; p.s1 *= o.scale; }
      if (o.vel) p.vel.add(o.vel);
      if (o.life) p.life = o.life;
      p.s.scale.setScalar(p.s0);
      F.live.push(p);
    }
  };
  F.update = function (dt) {
    for (let i = F.live.length - 1; i >= 0; i--) {
      const p = F.live[i]; p.age += dt;
      const t = p.age / p.life;
      if (t >= 1) { p.s.visible = false; F.pool.push(p); F.live.splice(i, 1); continue; }
      p.vel.y -= p.grav * dt;
      if (p.drag) p.vel.multiplyScalar(Math.exp(-p.drag * dt));
      p.s.position.addScaledVector(p.vel, dt);
      p.s.scale.setScalar(U.lerp(p.s0, p.s1, t));
      p.s.material.rotation += p.spin * dt;
      p.s.material.opacity = Math.min(p.fadeIn ? t / p.fadeIn : 1, t > 0.7 ? (1 - t) / 0.3 : 1);
    }
  };
  return F;
})();

/* ---------------- Audio (all synthesized) ---------------- */
G.audio = (() => {
  const A = { ctx: null };
  let master, sfx, mus, noiseBuf, delay, musicTimer, track = null, nextT = 0, step = 0;
  A.init = function () {
    if (A.ctx) { if (A.ctx.state === 'suspended') A.ctx.resume(); return; }
    try { A.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
    const c = A.ctx;
    master = c.createGain(); master.gain.value = 0.9;
    const comp = c.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 3;
    master.connect(comp); comp.connect(c.destination);
    sfx = c.createGain(); sfx.connect(master);
    mus = c.createGain(); mus.connect(master);
    delay = c.createDelay(1); delay.delayTime.value = 0.36; const fb = c.createGain(); fb.gain.value = 0.28; const dl = c.createGain(); dl.gain.value = 0.35;
    delay.connect(fb); fb.connect(delay); delay.connect(dl); dl.connect(mus);
    noiseBuf = c.createBuffer(1, c.sampleRate, c.sampleRate);
    const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    A.applyVolumes();
    musicTimer = setInterval(schedule, 60);
    if (A.pendingTrack) A.track(A.pendingTrack);
  };
  A.applyVolumes = function () { if (!A.ctx) return; const s = G.state ? G.state.settings : { sfx: 0.8, music: 0.45 }; sfx.gain.value = s.sfx; mus.gain.value = s.music * 0.5; };
  const now = () => A.ctx.currentTime;
  function env(g, t, a, peak, d) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d); }
  function tone(type, f0, f1, dur, vol, when = 0, dest = sfx, a = 0.008) {
    const t = now() + when; const o = A.ctx.createOscillator(); o.type = type;
    o.frequency.setValueAtTime(f0, t); if (f1 && f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    const g = A.ctx.createGain(); env(g, t, a, vol, dur); o.connect(g); g.connect(dest); o.start(t); o.stop(t + a + dur + 0.05); return o;
  }
  function noise(dur, vol, type = 'bandpass', freq = 1000, q = 1, when = 0, dest = sfx, a = 0.005) {
    const t = now() + when; const s = A.ctx.createBufferSource(); s.buffer = noiseBuf; s.loop = true;
    const f = A.ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
    const g = A.ctx.createGain(); env(g, t, a, vol, dur); s.connect(f); f.connect(g); g.connect(dest); s.start(t, Math.random()); s.stop(t + a + dur + 0.05); return f;
  }
  const S = {
    bark(p = 1, when = 0) {
      const t = now() + when, c = A.ctx;
      const o = c.createOscillator(); o.type = 'sawtooth';
      o.frequency.setValueAtTime(480 * p, t); o.frequency.linearRampToValueAtTime(820 * p, t + 0.035); o.frequency.exponentialRampToValueAtTime(300 * p, t + 0.17);
      const o2 = c.createOscillator(); o2.type = 'square'; o2.frequency.setValueAtTime(240 * p, t); o2.frequency.exponentialRampToValueAtTime(150 * p, t + 0.17);
      const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.setValueAtTime(1300 * p, t); bp.frequency.exponentialRampToValueAtTime(700 * p, t + 0.17); bp.Q.value = 1.6;
      const g = c.createGain(); env(g, t, 0.012, 0.55, 0.17);
      const g2 = c.createGain(); g2.gain.value = 0.25;
      o.connect(bp); o2.connect(g2); g2.connect(bp); bp.connect(g); g.connect(sfx);
      o.start(t); o2.start(t); o.stop(t + 0.25); o2.stop(t + 0.25);
      noise(0.07, 0.18, 'bandpass', 2200 * p, 1.2, when);
    },
    yip(p = 1) { S.bark(p * 1.45); },
    barks(p = 1, n = 2) { for (let i = 0; i < n; i++) S.bark(p * U.rand(0.95, 1.08), i * 0.2); },
    whine(p = 1) {
      const t = now(), c = A.ctx; const o = c.createOscillator(); o.type = 'triangle';
      o.frequency.setValueAtTime(800 * p, t); o.frequency.linearRampToValueAtTime(1250 * p, t + 0.25); o.frequency.linearRampToValueAtTime(900 * p, t + 0.6);
      const lfo = c.createOscillator(); lfo.frequency.value = 9; const lg = c.createGain(); lg.gain.value = 25; lfo.connect(lg); lg.connect(o.frequency);
      const g = c.createGain(); env(g, t, 0.05, 0.18, 0.6); o.connect(g); g.connect(sfx); o.start(t); lfo.start(t); o.stop(t + 0.75); lfo.stop(t + 0.75);
    },
    happy(p = 1) { tone('triangle', 700 * p, 1100 * p, 0.12, 0.15); tone('triangle', 900 * p, 1400 * p, 0.12, 0.13, 0.13); },
    growl(p = 1) { const f = noise(0.5, 0.18, 'lowpass', 220 * p, 4); const t = now(); const l = A.ctx.createOscillator(); l.frequency.value = 28; const lg = A.ctx.createGain(); lg.gain.value = 90; l.connect(lg); lg.connect(f.frequency); l.start(t); l.stop(t + 0.6); },
    howl(p = 1) {
      const t = now(), c = A.ctx; const o = c.createOscillator(); o.type = 'sawtooth';
      o.frequency.setValueAtTime(420 * p, t); o.frequency.linearRampToValueAtTime(700 * p, t + 0.4); o.frequency.linearRampToValueAtTime(640 * p, t + 1.2); o.frequency.linearRampToValueAtTime(460 * p, t + 1.6);
      const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 900 * p; bp.Q.value = 3;
      const lfo = c.createOscillator(); lfo.frequency.value = 6; const lg = c.createGain(); lg.gain.value = 12; lfo.connect(lg); lg.connect(o.frequency);
      const g = c.createGain(); env(g, t, 0.2, 0.4, 1.4); o.connect(bp); bp.connect(g); g.connect(sfx); o.start(t); lfo.start(t); o.stop(t + 1.7); lfo.stop(t + 1.7);
    },
    meow(p = 1) {
      const t = now(), c = A.ctx; const o = c.createOscillator(); o.type = 'sawtooth';
      o.frequency.setValueAtTime(520 * p, t); o.frequency.linearRampToValueAtTime(820 * p, t + 0.18); o.frequency.exponentialRampToValueAtTime(480 * p, t + 0.55);
      const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 4; bp.frequency.setValueAtTime(700, t); bp.frequency.linearRampToValueAtTime(1600, t + 0.2); bp.frequency.linearRampToValueAtTime(900, t + 0.55);
      const g = c.createGain(); env(g, t, 0.04, 0.45, 0.5); o.connect(bp); bp.connect(g); g.connect(sfx); o.start(t); o.stop(t + 0.62);
    },
    purr(dur = 1.4) { const f = noise(dur, 0.22, 'lowpass', 160, 2, 0, sfx, 0.15); const t = now(); const l = A.ctx.createOscillator(); l.frequency.value = 24; const lg = A.ctx.createGain(); lg.gain.value = 110; l.connect(lg); lg.connect(f.frequency); l.start(t); l.stop(t + dur + 0.2); },
    hiss() { noise(0.5, 0.25, 'highpass', 3000, 0.7); },
    squeak() { tone('square', 1300, 2300, 0.07, 0.12); tone('square', 2300, 1400, 0.08, 0.1, 0.07); },
    munch() { for (let i = 0; i < 3; i++) noise(0.05, 0.3, 'bandpass', U.rand(600, 1400), 2, i * 0.13); },
    lap() { for (let i = 0; i < 4; i++) { tone('sine', 380, 700, 0.05, 0.15, i * 0.16); noise(0.03, 0.08, 'bandpass', 2500, 3, i * 0.16); } },
    pour() { noise(0.8, 0.2, 'bandpass', 1800, 0.8, 0, sfx, 0.08); },
    kibble() { for (let i = 0; i < 10; i++) noise(0.02, 0.2, 'bandpass', U.rand(2500, 5000), 4, i * 0.04 + Math.random() * 0.02); },
    pop() { tone('sine', 520, 980, 0.08, 0.2); },
    tick() { tone('triangle', 1400, 1200, 0.03, 0.08); },
    back() { tone('sine', 700, 420, 0.08, 0.15); },
    coin() { tone('square', 988, 988, 0.07, 0.07); tone('square', 1319, 1319, 0.22, 0.07, 0.07); },
    chime() { [523, 659, 784, 1047].forEach((f, i) => tone('triangle', f, f, 0.28, 0.14, i * 0.08)); },
    fanfare() { [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone('square', f, f, i === 5 ? 0.6 : 0.14, 0.07, [0, .12, .24, .36, .55, .67][i])); },
    sad() { [440, 415, 392].forEach((f, i) => tone('triangle', f, f * 0.98, 0.25, 0.12, i * 0.22)); },
    whoosh() { const f = noise(0.35, 0.22, 'bandpass', 600, 1, 0, sfx, 0.08); f.frequency.exponentialRampToValueAtTime(2400, now() + 0.35); },
    thud() { tone('sine', 160, 60, 0.12, 0.3); noise(0.05, 0.12, 'lowpass', 600, 1); },
    bounce() { tone('sine', 300, 180, 0.08, 0.18); },
    splash() { noise(0.4, 0.3, 'bandpass', 1200, 0.6); noise(0.25, 0.2, 'highpass', 4000, 0.5, 0.05); },
    scrub() { noise(0.12, 0.12, 'bandpass', U.rand(2500, 4500), 2); },
    sparkle() { [1568, 2093, 2637].forEach((f, i) => tone('sine', f, f, 0.18, 0.06, i * 0.05)); },
    cheer() { noise(1.6, 0.25, 'bandpass', 1400, 0.4, 0, sfx, 0.3); for (let i = 0; i < 6; i++) tone('triangle', U.rand(900, 1600), U.rand(1200, 2000), 0.12, 0.03, U.rand(0, 1)); },
    aww() { noise(1.0, 0.12, 'bandpass', 900, 0.8, 0, sfx, 0.2); },
    whistle() { tone('sine', 1800, 2600, 0.15, 0.12); tone('sine', 2200, 1600, 0.25, 0.12, 0.16); },
    sniff() { for (let i = 0; i < 3; i++) noise(0.06, 0.12, 'highpass', 2000, 1, i * 0.1); },
    dig() { for (let i = 0; i < 4; i++) noise(0.06, 0.18, 'lowpass', 900, 1, i * 0.12); },
    shake() { for (let i = 0; i < 8; i++) noise(0.05, 0.12, 'bandpass', 1800, 1, i * 0.06); },
    bell() { tone('sine', 1760, 1760, 0.5, 0.12); tone('sine', 2640, 2640, 0.4, 0.06); },
    door() { tone('sine', 1320, 1320, 0.3, 0.1); tone('sine', 990, 990, 0.5, 0.1, 0.18); },
    gift() { [784, 988, 1175, 1568].forEach((f, i) => tone('triangle', f, f, 0.18, 0.12, i * 0.07)); },
    yawn(p = 1) { const t = now(), c = A.ctx; const o = c.createOscillator(); o.type = 'triangle'; o.frequency.setValueAtTime(700 * p, t); o.frequency.linearRampToValueAtTime(950 * p, t + 0.3); o.frequency.linearRampToValueAtTime(500 * p, t + 0.9); const g = c.createGain(); env(g, t, 0.15, 0.12, 0.8); o.connect(g); g.connect(sfx); o.start(t); o.stop(t + 1); },
  };
  A.bus = () => ({ mus, delay, master });
  A.S = S; A.tone = (...a) => tone(...a); A.noise = (...a) => noise(...a); A.now = () => now(); A.sfx = () => sfx;
  A.loop = function (on) { // gentle rain ambience
    if (!A.ctx) return;
    if (on && !A._rain) { const s = A.ctx.createBufferSource(); s.buffer = noiseBuf; s.loop = true; const f = A.ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 1400; const g = A.ctx.createGain(); g.gain.value = 0.06; s.connect(f); f.connect(g); g.connect(sfx); s.start(); A._rain = { s, g }; }
    if (!on && A._rain) { try { A._rain.s.stop(); } catch (e) { } A._rain = null; }
  };
  A.play = function (name, ...args) { if (!A.ctx || !G.state || G.state.settings.sfx <= 0) return; try { S[name](...args); } catch (e) { /* ignore */ } };

  /* ---- generative music ---- */
  const TRACKS = {
    home: { bpm: 80, prog: [[60, 64, 67, 71], [57, 60, 64, 67], [62, 65, 69, 72], [55, 59, 62, 65]], lead: 'triangle', dens: 0.45, oct: 12 },
    walk: { bpm: 104, prog: [[60, 64, 67], [65, 69, 72], [57, 60, 64], [67, 71, 74]], lead: 'square', dens: 0.6, oct: 12, bounce: true },
    cafe: { bpm: 86, prog: [[62, 65, 69, 72], [55, 59, 62, 65], [60, 64, 67, 71], [57, 61, 64, 67]], lead: 'sine', dens: 0.55, oct: 12, swing: true },
    contest: { bpm: 126, prog: [[60, 64, 67], [67, 71, 74], [69, 72, 76], [65, 69, 72]], lead: 'square', dens: 0.7, oct: 12, bounce: true },
    kennel: { bpm: 92, prog: [[65, 69, 72], [60, 64, 67], [62, 65, 69], [67, 71, 74]], lead: 'triangle', dens: 0.5, oct: 12 },
    title: { bpm: 76, prog: [[60, 64, 67, 72], [65, 69, 72, 76], [57, 60, 64, 69], [67, 71, 74, 79]], lead: 'triangle', dens: 0.35, oct: 12 },
  };
  const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
  function mnote(type, m, t, dur, vol, toDelay) {
    const c = A.ctx; const o = c.createOscillator(); o.type = type; o.frequency.value = mtof(m);
    const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(mus); if (toDelay) g.connect(delay); o.start(t); o.stop(t + dur + 0.05);
  }
  let lastLead = 72;
  function schedule() {
    if (!A.ctx || !track) return;
    const tr = TRACKS[track]; if (!tr) return;
    const spb = 60 / tr.bpm / 2; // eighth notes
    if (nextT < now()) nextT = now() + 0.05;
    while (nextT < now() + 0.25) {
      const bar = Math.floor(step / 8) % tr.prog.length, beat = step % 8;
      const ch = tr.prog[bar];
      const t = nextT + (tr.swing && beat % 2 ? spb * 0.25 : 0);
      if (beat === 0 || beat === 4) mnote('sine', ch[0] - 24, t, spb * 3.5, 0.22);
      if (tr.bounce && (beat === 2 || beat === 6)) mnote('sine', ch[2] - 24, t, spb * 1.5, 0.12);
      if (beat === 0) ch.forEach((m) => mnote('triangle', m - 12, t, spb * 7.5, 0.035));
      if (tr.bounce && beat % 2 === 1) mnote('triangle', ch[1], t, spb * 0.6, 0.03);
      if (Math.random() < tr.dens) {
        const pent = ch.concat(ch.map((m) => m + 12)).concat([ch[0] + 2 + 12, ch[0] + 9]);
        let best = pent[0], bd = 99;
        for (let i = 0; i < 3; i++) { const c = U.pick(pent) + tr.oct - 12 + 12; const d = Math.abs(c - lastLead); if (d < bd && d > 0) { bd = d; best = c; } }
        lastLead = best;
        mnote(tr.lead, best, t, spb * (Math.random() < 0.3 ? 2.2 : 0.9), tr.lead === 'square' ? 0.025 : 0.06, true);
      }
      nextT += spb; step++;
    }
  }
  A.track = function (name) {
    if (!A.ctx) { A.pendingTrack = name; return; }
    if (track === name) return; track = name; step = 0; nextT = now() + 0.3;
  };
  return A;
})();

/* ---------------- throw power: speed AND distance, gentle curve ---------------- */
G.throwPower = function (p) {
  const up = -p.vy / innerHeight; const dist = (G.input.sy - p.y) / innerHeight;
  if (up < 0.45 || dist < 0.025 || p.dur > 1600) return 0;
  return U.clamp(up * 0.45 + dist * 3.2, 0, 6);
};
/* ---------------- misc ---------------- */
G.vibrate = (ms) => { try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) { } };
G.wait = (ms) => new Promise((r) => setTimeout(r, ms));
