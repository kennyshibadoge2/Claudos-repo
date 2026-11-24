'use strict';
/* =========================================================
   Shiba Days — Disc Cup: timed rounds, live rivals in lanes,
   disobedient pups, skill tiers, tiered stadiums
   ========================================================= */
G.CONTESTS.forEach((c, i) => { c.time = [60, 60, 60, 70, 80][i]; c.tier = i; c.dis = [1, 0.8, 0.55, 0.35, 0.25][i]; });
G.CONTEST_RIVALS = [
  { d: [4, 9], jump: 0, flip: 0, catch: 0.6, wander: 0.18 },
  { d: [6, 12], jump: 0.25, flip: 0, catch: 0.7, wander: 0.1 },
  { d: [8, 15], jump: 0.45, flip: 0.05, catch: 0.75, wander: 0.05 },
  { d: [10, 18], jump: 0.6, flip: 0.18, catch: 0.8, wander: 0.02 },
  { d: [12, 20], jump: 0.55, flip: 0.38, catch: 0.86, wander: 0 },
];

G.scenes.frisbee = (() => {
  const F = { music: 'contest', hideNeeds: true };
  let scene, cam, pet, mc, crowd, crowdData = [], disc, discId = 'disc', from = 'home', lookV = new V3(0, 0.8, 10);
  let boardCtx, boardTex, st = null, tiers = [], rivals = [], balloons = [], blimp = null, shibaBalloon = null, jumbo = null, jumboCam = null, jumboRT = null, frame = 0, boardEl = null;
  const SIT = new V3(0.9, 0, 0.7);
  const LANES = [-10.5, -6, 6];
  let introFocus = null;
  F.init = function () {
    scene = new THREE.Scene(); F.scene = scene; scene.background = new THREE.Color('#9fd4ff'); scene.fog = new THREE.Fog('#9fd4ff', 55, 130);
    cam = new THREE.PerspectiveCamera(50, G.aspect(), 0.1, 260); F.camera = cam; F.hand = new G.DiscHand(scene, cam);
    const L = G.outdoorLights(scene, { shadow: 30 }); L.sun.position.set(-10, 25, 15); L.sun.target.position.set(0, 0, 25); F.L = L;
    build();
  };
  /* ---------------- stadium ---------------- */
  function build() {
    const M = G.M; const s = new THREE.Group();
    const g = new THREE.Mesh(new THREE.PlaneGeometry(260, 260), M.mat('#fff', { map: G.grassTex('summer', 60), r: 1 })); g.rotation.x = -Math.PI / 2; g.receiveShadow = true; scene.add(g);
    const stripe = G.canvasTex(64, 64, (c) => { c.fillStyle = '#8fd06a'; c.fillRect(0, 0, 64, 64); c.fillStyle = '#7cc25a'; c.fillRect(0, 0, 64, 32); }, { repeat: [1, 8] });
    const field = new THREE.Mesh(new THREE.PlaneGeometry(24, 72), M.mat('#fff', { map: stripe, r: 1 })); field.rotation.x = -Math.PI / 2; field.position.set(0, 0.01, 34); field.receiveShadow = true; scene.add(field);
    const lineM = M.mat('#ffffff', { r: 1 });
    for (let z = 0; z <= 70; z += 5) {
      const l = new THREE.Mesh(new THREE.PlaneGeometry(24, z % 10 === 0 ? 0.14 : 0.06), lineM); l.rotation.x = -Math.PI / 2; l.position.set(0, 0.02, z); scene.add(l);
      if (z % 10 === 0 && z > 0) { const tex = G.textTex(z + 'm', { font: '700 72px Fredoka, sans-serif', color: '#ffffff', pad: 10 }); const lab = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.4 * tex.userData.h / tex.userData.w), M.basic('#fff', { map: tex, op: 0.85, dw: false })); lab.rotation.set(-Math.PI / 2, 0, Math.PI); lab.position.set(-2.4, 0.03, z - 0.7); scene.add(lab); }
    }
    for (const x of [-7.6, -2.6, 2.6, 7.6]) { const ln = new THREE.Mesh(new THREE.PlaneGeometry(0.06, 70), M.mat('#e8f7d8', { r: 1 })); ln.rotation.x = -Math.PI / 2; ln.position.set(x, 0.021, 35); scene.add(ln); }
    const throwLine = new THREE.Mesh(new THREE.PlaneGeometry(24, 0.2), M.mat('#e2574c')); throwLine.rotation.x = -Math.PI / 2; throwLine.position.set(0, 0.025, 1.0); scene.add(throwLine);
    for (let i = 0; i < 14; i++) { const t = M.tree('summer', 'round'); t.position.set(U.rand(-60, 60), 0, U.rand(95, 125)); t.scale.setScalar(U.rand(1.4, 2.2)); s.add(t); }
    for (let i = 0; i < 12; i++) { const t = M.tree('summer', i % 3 ? 'round' : 'pine'); t.position.set((i % 2 ? 1 : -1) * U.rand(34, 46), 0, U.rand(-10, 80)); t.scale.setScalar(U.rand(1.3, 1.9)); s.add(t); }
    scene.add(G.M.bake(s));
    const n = 320; const bodyG = new THREE.CapsuleGeometry(0.22, 0.35, 4, 8); const headG = new THREE.SphereGeometry(0.2, 10, 8);
    crowd = { body: new THREE.InstancedMesh(bodyG, M.mat('#ffffff', { r: 0.8 }), n), head: new THREE.InstancedMesh(headG, M.mat('#f0c7a6', { r: 0.7 }), n) };
    const col = new THREE.Color();
    for (let i = 0; i < n; i++) { const side = i % 2 ? 1 : -1; const r = Math.floor(U.hash(i, 3, 1) * (i < 120 ? 3 : 6)); const z = U.rand(6, 60); crowdData.push({ x: side * (13.5 + r * 1.2), y: 0.5 + r * 0.5, z, r, ph: Math.random() * 6, jump: 0, wave: Math.random() < 0.15 }); crowd.body.setColorAt(i, col.setHSL(Math.random(), 0.6, 0.6)); crowd.head.setColorAt(i, col.set(U.pick(['#f6d2b8', '#e6b894', '#c99a76', '#8a5a3a', '#f3d0b5']))); }
    crowd.body.castShadow = true; scene.add(crowd.body); scene.add(crowd.head);
    const bc = document.createElement('canvas'); bc.width = 512; bc.height = 256; boardCtx = bc.getContext('2d'); boardTex = new THREE.CanvasTexture(bc); boardTex.encoding = THREE.sRGBEncoding;
    const board = new THREE.Mesh(new THREE.PlaneGeometry(8, 4), new THREE.MeshBasicMaterial({ map: boardTex, toneMapped: false })); board.position.set(-7, 6.5, 74); board.rotation.y = Math.PI; scene.add(board);
    const bframe = new THREE.Mesh(new THREE.BoxGeometry(8.4, 4.4, 0.3), M.mat('#3b2a1f')); bframe.position.set(-7, 6.5, 74.2); scene.add(bframe);
    for (const sd of [-1, 1]) { const leg = new THREE.Mesh(new THREE.BoxGeometry(0.3, 4.5, 0.3), M.mat('#3b2a1f')); leg.position.set(-7 + sd * 3.5, 2.25, 74.2); scene.add(leg); }
    mc = new G.Person('pepper', { key: 'pepper' }); mc.pos.set(-3.2, 0, 1.6); mc.heading = 0.7; scene.add(mc.root);
    const mic = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.02, 0.2, 8), M.mat('#222')); mic.position.set(0.05, -0.2, 0.05); mc.m.arms[1].add(mic);
    for (let t = 0; t < 5; t++) { const grp = new THREE.Group(); grp.visible = false; scene.add(grp); tiers.push(grp); buildTier(t, grp); }
  }
  function stands(grp, rows, colA, colB) {
    for (const side of [-1, 1]) for (let r = 0; r < rows; r++) { const b = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.5 + r * 0.5, 56), G.M.mat(r % 2 ? colA : colB, { r: 0.7 })); b.position.set(side * (13.5 + r * 1.2), (0.5 + r * 0.5) / 2, 33); b.castShadow = true; b.receiveShadow = true; grp.add(b); }
  }
  function buildTier(t, grp) {
    const M = G.M;
    if (t === 0) { stands(grp, 3, '#d8c4a4', '#fff7ea'); for (let z = 8; z < 66; z += 9) for (const sd of [-1, 1]) { const f = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.4), M.mat('#ee8a3c', { side: THREE.DoubleSide })); f.position.set(sd * 12.4, 1.4, z); f.rotation.y = Math.PI / 2; grp.add(f); const p = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.6, 6), M.mat('#fff')); p.position.set(sd * 12.4 - sd * 0.3, 0.8, z); grp.add(p); } }
    if (t >= 1) {
      stands(grp, t >= 2 ? 6 : 3, ['#4aa6e0', '#79b25a', '#e2574c', '#7a5cff', '#f2c24b'][t], '#fff7ea');
      for (let z = 6; z < 66; z += 6) for (const sd of [-1, 1]) { const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.6, 6), M.mat('#ffffff')); pole.position.set(sd * 12.4, 1.3, z); grp.add(pole); }
      for (let k = 0; k < 6; k++) for (let i = 0; i < 16; i++) { const fl = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.3, 3), M.mat(['#e2574c', '#f2c24b', '#4aa6e0', '#79b25a'][i % 4], { side: THREE.DoubleSide })); fl.rotation.z = Math.PI; fl.scale.z = 0.2; fl.position.set(-12 + i * 1.6, 2.5 - Math.sin(i / 15 * Math.PI) * 0.5, 10 + k * 10); grp.add(fl); }
      const stall = (x, z, name, colr) => { const g2 = new THREE.Group(); g2.position.set(x, 0, z); g2.rotation.y = x > 0 ? -Math.PI / 2 : Math.PI / 2; const cnt = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.0, 1.0), M.mat('#fff7ea')); cnt.position.y = 0.5; g2.add(cnt); const roof = new THREE.Mesh(new THREE.ConeGeometry(1.8, 0.8, 4, 1, true), M.mat(colr, { side: THREE.DoubleSide })); roof.rotation.y = Math.PI / 4; roof.position.y = 2.4; g2.add(roof); for (const a of [-1, 1]) for (const b of [-1, 1]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.0, 6), M.mat('#fff')); p.position.set(a * 1.05, 1.0, b * 0.45); g2.add(p); } const sg = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.45), M.mat('#fff', { map: G.textTex(name, { font: '700 52px Fredoka, sans-serif', bg: colr, color: '#fff', pad: 12 }) })); sg.position.set(0, 1.75, 0.52); g2.add(sg); g2.traverse((o) => { if (o.isMesh) o.castShadow = true; }); grp.add(g2); };
      stall(-22, 14, 'Takoyaki', '#e2574c'); stall(-22, 30, 'Pup Treats', '#79b25a'); stall(22, 18, 'Lemonade', '#f2c24b'); stall(22, 36, 'Disc Shop', '#4aa6e0');
    }
    if (t >= 2) {
      for (let i = 0; i < 24; i++) { const b = new THREE.Group(); const sp = new THREE.Mesh(new THREE.SphereGeometry(0.35, 14, 10), M.mat(U.pick(['#e2574c', '#f2c24b', '#4aa6e0', '#79b25a', '#f39bb0', '#7a5cff']), { r: 0.25 })); sp.scale.y = 1.15; b.add(sp); const str = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 1.6, 4), M.mat('#ffffff')); str.position.y = -1.1; b.add(str); b.position.set((i % 2 ? 1 : -1) * U.rand(12.5, 14), U.rand(4, 6.5), U.rand(5, 64)); b.userData.y0 = b.position.y; b.userData.ph = Math.random() * 6; grp.add(b); balloons.push(b); }
      { const big = G.M.pet({ breed: 'shiba', coat: t === 4 ? 'cream' : 'red' }); big.rig.scale.multiplyScalar(14); big.root.position.set(-30, 0, 44); big.root.rotation.y = 1.2; big.root.traverse((o) => { if (o.isMesh) o.castShadow = true; }); grp.add(big.root); grp.userData.big = big; }
      const arch = new THREE.Group(); arch.position.set(0, 0, 66); arch.rotation.y = Math.PI; grp.add(arch);
      for (let i = 0; i < 26; i++) { const a = i / 25 * Math.PI; const b = new THREE.Mesh(new THREE.SphereGeometry(0.4, 10, 8), M.mat(['#e2574c', '#fff7ea', '#f2c24b'][i % 3], { r: 0.3 })); b.position.set(Math.cos(a) * 7, Math.sin(a) * 6, 0); arch.add(b); }
    }
    if (t >= 3) {
      for (const [x, z] of [[-17, 4], [17, 4], [-17, 62], [17, 62]]) { const tw = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.4, 16, 8), M.mat('#9aa2ac', { m: 0.6, r: 0.4 })); tw.position.set(x, 8, z); tw.castShadow = true; grp.add(tw); const lb = new THREE.Mesh(new THREE.BoxGeometry(3, 1.6, 0.4), M.mat('#33302f')); lb.position.set(x, 16.5, z); lb.lookAt(0, 0, 33); grp.add(lb); const glow = new THREE.Mesh(new THREE.PlaneGeometry(2.7, 1.3), new THREE.MeshBasicMaterial({ color: '#fff8e0', toneMapped: false })); glow.position.copy(lb.position); glow.lookAt(0, 0, 33); glow.translateZ(0.22); grp.add(glow); }
      if (!jumboRT) { jumboRT = new THREE.WebGLRenderTarget(320, 180); jumboRT.texture.encoding = THREE.sRGBEncoding; jumboCam = new THREE.PerspectiveCamera(40, 16 / 9, 0.1, 200); }
      const jf = new THREE.Mesh(new THREE.BoxGeometry(10.6, 6.4, 0.4), M.mat('#1d1a1b')); jf.position.set(6, 9, 74.3); grp.add(jf);
      const jm = new THREE.Mesh(new THREE.PlaneGeometry(10, 5.6), new THREE.MeshBasicMaterial({ map: jumboRT.texture, toneMapped: false })); jm.position.set(6, 9, 74.05); jm.rotation.y = Math.PI; grp.add(jm); grp.userData.jumbo = jm;
      for (const sd of [-1, 1]) { const leg = new THREE.Mesh(new THREE.BoxGeometry(0.4, 6.5, 0.4), M.mat('#1d1a1b')); leg.position.set(6 + sd * 4.5, 3.2, 74.3); grp.add(leg); }
    }
    if (t >= 4) {
      const carpet = new THREE.Mesh(new THREE.PlaneGeometry(2, 12), M.mat('#c8322a', { r: 0.9 })); carpet.rotation.x = -Math.PI / 2; carpet.position.set(-3, 0.03, -5); grp.add(carpet);
      const b = new THREE.Group(); const hull = new THREE.Mesh(new THREE.CapsuleGeometry(2.2, 8, 8, 16), M.mat('#fff7ea', { r: 0.5 })); hull.rotation.z = Math.PI / 2; b.add(hull);
      for (const s2 of [-1, 1]) { const fin = new THREE.Mesh(new THREE.BoxGeometry(0.15, 2.2, 1.6), M.mat('#e2574c')); fin.position.set(-5.5, s2 * 1.2, 0); b.add(fin); const fin2 = new THREE.Mesh(new THREE.BoxGeometry(0.15, 1.6, 2.2), M.mat('#e2574c')); fin2.rotation.x = Math.PI / 2; fin2.position.set(-5.5, 0, s2 * 1.2); b.add(fin2); }
      const bt = G.textTex('MAPLE HILL CHAMPIONS', { font: '700 64px Fredoka, sans-serif', color: '#e2574c', pad: 20 }); for (const s2 of [-1, 1]) { const tp = new THREE.Mesh(new THREE.PlaneGeometry(7, 1.2), M.mat('#fff', { map: bt, side: THREE.DoubleSide })); tp.position.set(0, 0, s2 * 2.25); if (s2 < 0) tp.rotation.y = Math.PI; b.add(tp); }
      const gond = new THREE.Mesh(new THREE.BoxGeometry(2, 0.7, 0.9), M.mat('#3b2a1f')); gond.position.y = -2.4; b.add(gond);
      grp.add(b); blimp = b;
      for (let i = 0; i < 8; i++) { const can = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.32, 0.9, 12), M.mat('#f2c24b', { m: 0.7, r: 0.3 })); can.position.set((i % 2 ? 1 : -1) * 12.2, 0.45, 8 + i * 7); can.rotation.z = (i % 2 ? 1 : -1) * 0.4; grp.add(can); }
    }
  }
  function drawBoard() {
    const g = boardCtx; g.fillStyle = '#1d2a24'; g.fillRect(0, 0, 512, 256);
    g.fillStyle = '#f2c24b'; g.font = '700 32px Fredoka, sans-serif'; g.textAlign = 'center';
    g.fillText(st && st.cls ? st.cls.name : st ? 'Practice' : 'Disc Cup', 256, 42);
    g.font = '600 26px Fredoka, sans-serif';
    if (st && st.cls) {
      g.fillStyle = '#fff'; g.fillText('TIME ' + Math.max(0, Math.ceil(st.time)), 256, 78);
      leaderboard().slice(0, 5).forEach((r, i) => { g.textAlign = 'left'; g.fillStyle = r.me ? '#f2c24b' : '#fff'; g.fillText((i + 1) + '. ' + r.dog, 60, 116 + i * 28); g.textAlign = 'right'; g.fillText(String(Math.round(r.score)), 452, 116 + i * 28); });
    } else { g.fillStyle = '#fff'; g.fillText('Welcome!', 256, 140); }
    boardTex.needsUpdate = true;
  }

  /* ---------------- rivals ---------------- */
  const COATS = { shiba: ['red', 'sesame', 'cream', 'blacktan'], mame: ['red', 'cream'], corgi: ['corgi'], husky: ['husky'], golden: ['golden'], dachshund: ['dachs'], pug: ['pug'] };
  function randLook() { return { skin: U.pick(['#f6d2b8', '#e6b894', '#c99a76', '#8a5a3a', '#f3d0b5']), hair: U.pick(['#2a1d18', '#5a3a26', '#c4622a', '#e8d2a8', '#3b2420', '#7a5cff']), style: U.pick(['short', 'bob', 'pony', 'bun', 'messy']), top: U.pick(['#e2574c', '#4aa6e0', '#79b25a', '#f2c24b', '#7a5cff', '#f39bb0', '#33415c']), bottom: U.pick(['#3b4a6a', '#3a3a3a', '#5a4a3a', '#2c2c3a']), h: U.rand(0.92, 1.05), extra: U.chance(0.3) ? ['cap'] : U.chance(0.2) ? ['band'] : [] }; }
  /* ---------- field features: sand traps (slow you down) and glowing bonus zones ---------- */
  let fieldGrp = null;
  const sandTex = () => G.canvasTex(128, 128, (c) => { const g = c.createRadialGradient(64, 64, 20, 64, 64, 64); g.addColorStop(0, 'rgba(230,200,140,1)'); g.addColorStop(0.75, 'rgba(222,190,128,1)'); g.addColorStop(1, 'rgba(222,190,128,0)'); c.fillStyle = g; c.fillRect(0, 0, 128, 128); for (let i = 0; i < 500; i++) { c.fillStyle = Math.random() < 0.5 ? 'rgba(170,135,80,.35)' : 'rgba(255,240,200,.4)'; const a = Math.random() * 6.28, r = Math.random() * 50; c.fillRect(64 + Math.cos(a) * r, 64 + Math.sin(a) * r, 2, 2); } });
  const zoneTex = () => G.canvasTex(128, 128, (c) => { const g = c.createRadialGradient(64, 64, 10, 64, 64, 64); g.addColorStop(0, 'rgba(255,240,120,.15)'); g.addColorStop(0.78, 'rgba(255,214,60,.45)'); g.addColorStop(0.86, 'rgba(255,255,220,.95)'); g.addColorStop(1, 'rgba(255,214,60,0)'); c.fillStyle = g; c.fillRect(0, 0, 128, 128); c.fillStyle = 'rgba(255,255,255,.9)'; c.font = '700 30px Fredoka, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('BONUS', 64, 64); });
  const laneXs = () => [0, ...rivals.map((r) => r.x)];
  function setupField(cls) {
    clearField(); fieldGrp = new THREE.Group(); scene.add(fieldGrp);
    st.sand = []; st.zones = [];
    const nSand = [0, 0, 2, 3, 4][cls.tier], nZone = [0, 1, 2, 2, 3][cls.tier];
    const st1 = sandTex();
    for (let i = 0; i < nSand; i++) {
      const dx = U.rand(-1.4, 1.4), z = U.rand(8 + i * 7, 14 + i * 9), r = U.rand(1.1, 1.8);
      for (const lx of laneXs()) { const half = lx === 0 ? 3.4 : 2; const x = U.clamp(lx + dx, lx - half + 0.6, lx + half - 0.6); st.sand.push({ x, z, r }); const m = new THREE.Mesh(new THREE.CircleGeometry(r * 1.15, 28), M.basic('#fff', { map: st1, op: 1, dw: false })); m.rotation.x = -Math.PI / 2; m.position.set(x, 0.015, z); m.scale.set(1, U.rand(0.8, 1.15), 1); m.renderOrder = 2; fieldGrp.add(m); }
    }
    for (let i = 0; i < nZone; i++) st.zones.push(newZone(i));
  }
  function newZone(i) {
    const zn = { dx: U.rand(-1.3, 1.3), z: U.rand(9, 30 + (st.cls ? st.cls.tier * 4 : 0)), r: U.rand(1.0, 1.5), life: U.rand(10, 18), t: 0, pts: [0, 10, 15, 20, 25][st.cls ? st.cls.tier : 1], meshes: [] };
    const tx = zoneTex();
    const beamTex = G.canvasTex(8, 64, (c) => { const g = c.createLinearGradient(0, 0, 0, 64); g.addColorStop(0, 'rgba(255,230,120,0)'); g.addColorStop(1, 'rgba(255,220,90,.75)'); c.fillStyle = g; c.fillRect(0, 0, 8, 64); });
    const lab = G.textTex('+' + zn.pts, { font: '800 60px Fredoka, sans-serif', color: '#ffcf33', stroke: '#fff', strokeW: 10, pad: 10 });
    for (const lx of laneXs()) {
      const half = lx === 0 ? 3.4 : 2; const x = U.clamp(lx + zn.dx, lx - half + 0.7, lx + half - 0.7);
      const m = new THREE.Mesh(new THREE.CircleGeometry(zn.r, 32), new THREE.MeshBasicMaterial({ map: tx, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, color: '#ffe680' })); m.rotation.x = -Math.PI / 2; m.position.set(x, 0.04, zn.z); m.renderOrder = 3; m.userData.lx = lx; fieldGrp.add(m); zn.meshes.push(m);
      const bm = new THREE.Mesh(new THREE.CylinderGeometry(zn.r * 0.95, zn.r * 0.95, 1.4, 32, 1, true), new THREE.MeshBasicMaterial({ map: beamTex, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending })); bm.position.set(x, 0.7, zn.z); bm.userData.beam = true; fieldGrp.add(bm); zn.fx = zn.fx || []; zn.fx.push(bm);
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: lab, transparent: true, opacity: 0, depthTest: false })); sp.scale.set(0.5 * lab.userData.w / lab.userData.h, 0.5, 1); sp.position.set(x, 1.7, zn.z); sp.renderOrder = 12; fieldGrp.add(sp); zn.fx.push(sp);
    }
    return zn;
  }
  function clearField() { if (fieldGrp) { scene.remove(fieldGrp); fieldGrp.traverse((o) => { if (o.material) { if (o.material.map) o.material.map.dispose(); o.material.dispose(); } if (o.geometry) o.geometry.dispose(); }); fieldGrp = null; } }
  function terrainAt(x, z) { if (!st || !st.sand) return 1; for (const s of st.sand) if ((x - s.x) ** 2 + (z - s.z) ** 2 < s.r * s.r) return 0.42; return 1; }
  function zoneBonus(p) { if (!st || !st.zones) return 0; for (const zn of st.zones) { if (zn.t > zn.life - 0.6) continue; for (const m of zn.meshes) if ((p.x - m.position.x) ** 2 + (p.z - m.position.z) ** 2 < zn.r * zn.r) return zn.pts; } return 0; }
  function updateField(dt) {
    if (!st || !st.zones) return;
    st.zones.forEach((zn, i) => {
      zn.t += dt; const fade = Math.min(1, zn.t * 1.5, (zn.life - zn.t) * 1.5); const pulse = 0.75 + Math.sin(G.time * 4 + i) * 0.25;
      for (const m of zn.meshes) { m.material.opacity = Math.max(0, fade) * pulse; m.scale.setScalar(1 + Math.sin(G.time * 3 + i) * 0.04); }
      for (const f of zn.fx || []) { f.material.opacity = Math.max(0, fade) * (f.isSprite ? 1 : 0.55 * pulse); if (f.isSprite) f.position.y = 1.7 + Math.sin(G.time * 2.5 + i) * 0.12; else f.rotation.y += dt * 0.5; }
      if (zn.t >= zn.life) { for (const m of zn.meshes.concat(zn.fx || [])) { fieldGrp.remove(m); if (m.material.map && !m.isSprite) m.material.map.dispose(); m.material.dispose(); m.geometry && !m.isSprite && m.geometry.dispose(); } st.zones[i] = newZone(i); if (Math.random() < 0.5) commentary('The bonus zone moved!'); }
    });
    const dusty = (p) => { p.terrainMul = terrainAt(p.pos.x, p.pos.z); if (p.terrainMul < 1 && p.vel > 0.6 && Math.random() < dt * 14) G.fx.spawn('puff', p.pos.clone().setY(0.06), 1, { color: '#e2c48a' }); };
    dusty(pet); for (const r of rivals) dusty(r.pet);
  }
  function clearRivals() { for (const r of rivals) { scene.remove(r.pet.root); scene.remove(r.person.root); scene.remove(r.disc); scene.remove(r.tag); } rivals = []; }
  const RIVAL_SKILL = [8, 28, 48, 68, 88], RIVAL_F = [[4.5, 9], [6, 11], [7.5, 13], [9, 15], [10, 17]];
  function makeRivals(cls) {
    clearRivals();
    const pool = G.RIVALS.slice().sort(() => Math.random() - 0.5).slice(0, 3);
    const skill = G.CONTEST_RIVALS[cls.tier];
    pool.forEach(([owner, dog, breed], i) => {
      const x = LANES[i];
      const p = new G.Pet({ name: dog, breed, coat: U.pick(COATS[breed] || ['red']), mood: 90, disc: Math.max(0, RIVAL_SKILL[cls.tier] + U.rand(-6, 6)), acc: { collar: U.pick(['collar_blue', 'collar_red', 'collar_pink', 'collar_gold']) } }, { npc: true });
      p.pos.set(x + 0.9, 0, 0.7); p.heading = 0; p.brain = null; p.bounds = (q) => { q.pos.x = U.clamp(q.pos.x, x - 2, x + 2); q.pos.z = U.clamp(q.pos.z, -0.5, 70); }; scene.add(p.root);
      const per = new G.Person(randLook()); per.pos.set(x, 0, 0); per.heading = 0; scene.add(per.root);
      const d = G.M.item('disc'); d.scale.setScalar(1.6); scene.add(d);
      const tag = new THREE.Sprite(new THREE.SpriteMaterial({ map: G.textTex(dog, { font: '700 44px Fredoka, sans-serif', bg: 'rgba(59,42,31,.75)', color: '#fff', pad: 12, radius: 22 }), depthTest: false })); tag.scale.set(1.0, 0.3, 1); tag.renderOrder = 15; scene.add(tag);
      rivals.push({ owner, dog, breed, x, pet: p, person: per, disc: d, tag, skill, tier: cls.tier, score: 0, state: 'ready', t: U.rand(0.8, 2.4), fl: null });
    });
  }
  function updateRival(r, dt, running) {
    const p = r.pet; r.t -= dt;
    r.tag.position.copy(p.pos).setY(p.sizeH + 0.45);
    if (r.state === 'ready') {
      const hand = r.person.m.arms[1].localToWorld(new V3(0, -0.3, 0.05)); r.disc.position.copy(hand); r.disc.rotation.set(0.4 + (r.wind || 0) * 0.5, 0, 0.3);
      r.person.holding = true; r.person.lookAt = null;
      p.setPose('sit'); p.moveTarget = null; p.heading = 0; p.extraPitch = 0;
      if (running && r.t <= 0.55 && !r.winding) { r.winding = true; r.person.throwT = 0.55; }
      if (running && r.t <= 0) {
        r.winding = false; r.person.holding = false;
        const fr = RIVAL_F[r.tier]; const f = U.rand(fr[0], fr[1]);
        const pos = r.disc.position.clone(); const vel = new V3(U.rand(-0.4, 0.4), U.rand(1.8, 2.8) + f * 0.1, f);
        const path = G.discSim(pos, vel, { wind: st ? st.wind * 0.7 : 0, bounds: { x0: r.x - 2, x1: r.x + 2, z0: 0.2, z1: 70 } });
        let plan = null;
        if (Math.random() < r.skill.catch) {
          plan = G.discPlan(p, path, { terrain: terrainAt });
          if (!plan) { // trained dogs sprint for a low catch just before it lands
            let gi = path.findIndex((q) => q.ground); gi = Math.max(1, (gi < 0 ? path.length : gi) - 2);
            const q = path[gi]; const S0 = G.discSkill(p); const dist = U.d2(p.pos.x, p.pos.z, q.p.x, q.p.z);
            plan = { i: gi, t: q.t, p: q.p.clone(), kind: 'ground', S: Object.assign({}, S0, { spd: Math.max(S0.spd, dist / Math.max(0.3, q.t - S0.delay)) }) };
          }
        }
        r.fl = { path, t: 0, i: 0, plan, jumped: false };
        r.state = 'fly'; r.person.lookAt = path[path.length - 1].p; if (Math.random() < 0.3) G.audio.play('whoosh');
        p.setPose('stand'); p.excite = 1;
      }
    } else if (r.state === 'fly') {
      const F2 = r.fl; F2.t += dt; const P = F2.path; while (F2.i < P.length - 1 && P[F2.i].t < F2.t) F2.i++;
      r.disc.position.copy(P[F2.i].p); r.disc.rotation.y += dt * 20; r.disc.rotation.z = P[F2.i].bank || 0;
      const plan = F2.plan; const S = plan ? plan.S : G.discSkill(p);
      const tgt = plan ? plan.p : P[P.length - 1].p;
      if (F2.t > S.delay) { if (U.d2(p.pos.x, p.pos.z, tgt.x, tgt.z) > 0.25) { p.moveTarget = new V3(tgt.x, 0, tgt.z); p.speedMul = S.spd / p.S; } else p.moveTarget = null; }
      if (plan && plan.kind !== 'ground' && !F2.jumped && F2.t >= plan.t - 0.34) F2.jumped = G.discLeap(p, plan);
      G.discFlip(p, F2.jumped);
      if (plan && F2.t >= plan.t && U.d2(p.pos.x, p.pos.z, plan.p.x, plan.p.z) > 0.5 * p.S + 1.0) { F2.plan = null; }
      else if (plan && F2.t >= plan.t) {
        const mult = plan.kind === 'flip' ? 3 : plan.kind === 'jump' ? 2 : 1; const zb = zoneBonus(plan.p); const pts = Math.round(Math.max(1, plan.p.z - 1) * mult) + zb; r.score += pts; r.person.cheerT = mult > 1 || zb ? 1.6 : 0; if (!r.person.cheerT) r.person.clapT = 0.9;
        popText(p.pos.clone().setY(1.4), '+' + pts + (zb ? ' ZONE' : mult > 1 ? (mult === 3 ? ' FLIP!' : ' JUMP') : ''), mult === 3 ? '#7a5cff' : '#ee8a3c');
        if (mult >= 2 && Math.random() < 0.5) commentary(r.dog + (mult === 3 ? ' with a flip catch!' : ' leaps for it!')); crowdJump(0.3 * mult, r.x); hud();
        r.state = 'got'; p.moveTarget = null;
      } else if (!plan && (F2.i >= P.length - 1 && (U.d2(p.pos.x, p.pos.z, tgt.x, tgt.z) < 0.6 || F2.t > P[P.length - 1].t + 4))) { r.state = 'got'; p.moveTarget = null; if (Math.random() < 0.3) commentary('Ooh, ' + r.dog + ' misses that one!'); r.person.lookAt = null; }
    } else if (r.state === 'got') {
      r.disc.position.copy(p.mouthWorld());
      if (!p.airborne && !p.flipL) { p.extraPitch = 0; r.state = Math.random() < r.skill.wander ? 'wander' : 'back'; r.t = U.rand(2.5, 4.5); if (r.state === 'wander') { p.emote('note', 1.5); if (Math.random() < 0.4) commentary(r.dog + ' is taking a little detour...'); } }
    } else if (r.state === 'wander') {
      r.disc.position.copy(p.mouthWorld());
      if (!p.task) p.do(p.zoomies(p.pos.x, p.pos.z, 1.2, 1));
      if (r.t <= 0) { p.stop(); r.state = 'back'; }
    } else if (r.state === 'back') {
      p.extraPitch = 0;
      r.disc.position.copy(p.mouthWorld()); r.disc.rotation.set(1.2, p.heading, 0);
      p.setPose('stand'); p.moveTarget = new V3(r.x + 0.9, 0, 0.9); p.speedMul = 4.5; r.person.lookAt = p.pos; if (Math.random() < dt * 0.5) r.person.waveT = 0.6;
      if (U.d2(p.pos.x, p.pos.z, r.x + 0.9, 0.9) < 0.4) { r.state = 'ready'; r.t = U.rand(0.6, 1.6); p.moveTarget = null; }
    }
    p.update(dt); r.person.update(dt);
  }
  function popText(pos, txt, color) {
    const tex = G.textTex(txt, { font: '800 64px Fredoka, sans-serif', color, stroke: '#fff', strokeW: 12, pad: 12 });
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false })); sp.renderOrder = 18;
    sp.scale.set(0.5 * tex.userData.w / tex.userData.h, 0.5, 1); sp.position.copy(pos); scene.add(sp);
    const t0 = G.time; const step = () => { const k = (G.time - t0) / 1.4; if (k >= 1 || !sp.parent) { scene.remove(sp); tex.dispose(); return; } sp.position.y = pos.y + k * 1.2; sp.material.opacity = 1 - Math.max(0, k - 0.6) / 0.4; requestAnimationFrame(step); }; requestAnimationFrame(step);
  }
  let comT = 0;
  function commentary(txt) { if (G.time - comT < 2.5) return; comT = G.time; G.ui.hint('MC Pepper: “' + txt + '”', 2600); mc.talking = 1.5; }

  /* ---------------- enter / menus ---------------- */
  F.enter = function (opts = {}) {
    from = opts.from || 'home';
    pet = G.activePet(); if (!pet || pet.cat) { setTimeout(() => G.go('home'), 50); return; }
    scene.add(pet.root); pet.stop(); pet.ctl = null; pet.baseY = 0; pet.extraPitch = 0; pet.bounds = (p) => { p.pos.x = U.clamp(p.pos.x, -11.5, 11.5); p.pos.z = U.clamp(p.pos.z, -1, 70); };
    pet.pos.copy(SIT); pet.heading = 0; pet.brain = sitBrain;
    discId = G.state.toys.prodisc ? 'prodisc' : 'disc';
    if (disc) scene.remove(disc.mesh);
    disc = { mesh: G.M.item(discId), pos: new V3() }; disc.mesh.scale.setScalar(1.6); disc.mesh.visible = false; scene.add(disc.mesh);
    st = null; clearRivals(); setTier(0); drawBoard();
    boardEl = document.createElement('div'); boardEl.id = 'board'; boardEl.className = 'hidden'; $('#hud').appendChild(boardEl);
    cam.position.set(0.6, 1.8, -3.4); lookV.set(0, 0.9, 10);
    setTimeout(classMenu, 450);
  };
  F.exit = function () {
    $('#dock').style.visibility = ''; F.hand.hide(); if (boardEl) { boardEl.remove(); boardEl = null; }
    if (pet) { if (pet.carry) { pet.m.mouth.remove(pet.carry.mesh); pet.carry = null; } scene.remove(pet.root); pet.stop(); pet.extraPitch = 0; pet.gnaw = false; }
    G.voice.done(); clearRivals(); clearField(); pet && (pet.terrainMul = 1); $('#contestHud').classList.add('hidden'); G.ui.hint(null); G.ui.prompts([]); st = null;
  };
  F.debug = () => ({ st, rivals, pet, start, bringBack, throwDisc });
  F.dock = () => [{ label: 'Cups', icon: 'trophy', fn: () => { if (!st || st.phase === 'done' || st.phase === 'done2') { st = null; clearRivals(); classMenu(); } } }, { label: 'Leave', icon: 'door', cls: 'go', fn: () => G.go(from === 'walk' ? 'walk' : 'home', { from: 'field' }) }];
  function setTier(t) { t = Math.max(0, t); tiers.forEach((g, i) => (g.visible = i === t)); crowd.body.count = crowd.head.count = [70, 130, 220, 280, 320][t]; jumbo = tiers[t].userData.jumbo || null; }
  function* sitBrain(p) { p.lookCam = 2; yield* p.face(p.pos.x, p.pos.z + 5); p.setPose('sit'); yield* p.wait(2); }
  function classMenu() {
    $('#dock').style.visibility = ''; if (boardEl) boardEl.classList.add('hidden'); $('#contestHud').classList.add('hidden'); G.audio.track('contestIntro');
    G.ui.sheet({ title: 'Disc Cup entry', render(body) {
      G.ui.note(body, 'Throw as many times as you can before time runs out! Points = catch distance in meters. Jumping catches x2, flip catches x3. Rivals compete in the lanes beside you.');
      const sk = pet.d.disc || 0;
      G.ui.note(body, 'Want to practice? Throw the disc at home, or at the Dog Park on your walk.');
      G.ui.note(body, pet.name + '’s disc skill: ' + Math.round(sk) + '/100 — ' + (sk < 25 ? 'can’t jump yet, may get distracted and chew the disc, and might not let go of it!' : sk < 60 ? 'can make jumping catches.' : 'can do flip catches!') + (discId === 'prodisc' ? ' Using the Pro Disc.' : ''));
      const l = G.ui.list(body);
      G.CONTESTS.forEach((c) => {
        const open = G.petCups(pet.d)[c.id]; const best = G.state.trophies.filter((t) => t.cls === c.id && t.pet === pet.d.id).reduce((m, t) => Math.min(m, t.place), 9);
        l.appendChild(G.ui.li({ icon: 'trophy', title: c.name + (best < 9 ? ' — best: ' + ['', '1st', '2nd', '3rd'][best] : ''), sub: open ? c.time + 's round · entry ' + (c.fee ? c.fee + ' coins' : 'free') + ' · 1st prize ' + c.prize[0] : 'Locked: win the ' + G.CONTESTS.find((x) => x.id === c.need).name + ' first', lock: !open, fn: open ? () => { if (G.state.coins < c.fee) { G.ui.toast('Not enough coins for the entry fee.'); return; } G.ui.closeSheet(true); G.state.coins -= c.fee; G.ui.refresh(); start(c); } : null }));
      });
    } });
  }
  async function start(cls) {
    st = { cls, practice: !cls, phase: 'intro', score: 0, time: cls ? cls.time : 0, catches: 0, throws: 0, wind: 0, obey: 0 };
    setTier(cls ? cls.tier : 0); $('#dock').style.visibility = 'hidden'; $('#contestHud').classList.remove('hidden');
    pet.stop(); pet.pos.copy(SIT); pet.heading = 0; pet.brain = sitBrain; pet.gnaw = false;
    if (cls) {
      makeRivals(cls); setupField(cls);
      const port = G.M.icons.person('pepper');
      await G.ui.say('MC Pepper', U.pick(['Welcome, welcome to the ' + cls.name + '!', 'Laaadies and gentlemen and GOOD DOGS! The ' + cls.name + ' is ON!']), port);
      await G.ui.say('MC Pepper', 'Four teams, one field! Let\u2019s meet our competitors!', port); if (!st) return;
      for (const r of rivals) { introFocus = r.pet.pos; await G.ui.say('MC Pepper', U.pick(['In lane ', 'Over in lane ', 'Lane ']) + (LANES.indexOf(r.x) + 1) + ': ' + r.owner + ' and ' + r.dog + ' the ' + G.BREEDS[r.breed].name + '! ' + U.pick(['A crowd favorite!', 'Watch those jumps!', 'They trained all winter!', 'First time at this level!', 'Last year\u2019s runner-up!']), port); if (!st) { introFocus = null; return; } r.pet.voiceCd = 0; r.pet.voice(); }
      introFocus = pet.pos;
      if (cls.tier >= 1) await G.ui.say('MC Pepper', 'Catch inside a glowing BONUS zone for +' + [0, 10, 15, 20, 25][cls.tier] + ' points! Zones move around, so watch closely.' + (cls.tier >= 2 ? ' And mind the SAND TRAPS \u2014 they really slow a pup down!' : ''), port);
      if (!st) { introFocus = null; return; }
      await G.ui.say('MC Pepper', 'And in the center lane: YOU and ' + pet.name + ' the ' + G.BREEDS[pet.d.breed].name + '! ' + cls.time + ' seconds on the clock. Most points wins!', port);
      introFocus = null;
      G.ui.endDialog(); if (!st) return; boardEl.classList.remove('hidden'); hud();
      if (cls.tier >= 4) fireworks(6);
      for (const n of ['3', '2', '1']) { G.ui.banner(n, null, 700); G.audio.play('blip'); await G.wait(800); if (!st) return; }
      G.ui.banner('GO!', null, 800); G.audio.play('whistle'); G.audio.track('contest'); crowdJump(0.8);
      st.wind = U.rand(-1, 1) * [0.2, 0.3, 0.6, 1.2, 1.6][cls.tier];
    } else { G.audio.track('contest'); G.ui.prompts([{ label: 'Done practicing', cls: 'orange', fn: () => { st = null; G.ui.prompts([]); disc.mesh.visible = false; classMenu(); } }]); }
    st.phase = 'ready'; F.hand.show(discId); hud(); drawBoard();
    G.ui.hint('Grab the disc, swing it upward and let go to throw. Gentle swing = short toss.', 4000);
  }
  function leaderboard() {
    const rows = rivals.map((r) => ({ dog: r.dog, breed: r.breed, owner: r.owner, score: r.score }));
    rows.push({ dog: pet.name, breed: pet.d.breed, owner: 'You', score: st ? st.score : 0, me: true });
    return rows.sort((a, b) => b.score - a.score);
  }
  function hud() {
    if (!st) return;
    const w = st.wind; const arrow = Math.abs(w) < 0.15 ? 'calm' : (w > 0 ? '← ' : '') + Math.abs(w).toFixed(1) + (w < 0 ? ' →' : '');
    $('#contestHud').innerHTML = st.practice ? 'Practice <span>Skill ' + Math.round(pet.d.disc || 0) + '</span>' : 'Time <span>' + Math.max(0, Math.ceil(st.time)) + 's</span> Score <span>' + Math.round(st.score) + '</span> Wind <span>' + arrow + '</span>';
    if (boardEl && st.cls) boardEl.innerHTML = leaderboard().map((r, i) => '<div class="' + (r.me ? 'me' : '') + '"><span>' + (i + 1) + '. ' + U.esc(r.dog) + '</span><b>' + Math.round(r.score) + '</b></div>').join('');
  }

  /* ---------------- player throwing ---------------- */
  F.onDown = function (p) { if (st && st.phase === 'tug' && st.tug) { st.tug.ly = p.y; return; } if (st && st.phase === 'rogue') { const h = G.pick(p, pet.m.meshes, false)[0]; if (h) F.call(); return; } if (st && st.phase === 'ready') F.hand.down(p); };
  F.onMove = function (p, down) { if (st && st.phase === 'ready' && down) F.hand.move(p); const tg = st && st.phase === 'tug' && st.tug; if (tg && down) { if (tg.ly == null) tg.ly = p.y; const dy = p.y - tg.ly; tg.ly = p.y; if (dy > 0) { tg.prog = Math.min(1, tg.prog + dy / innerHeight * (tg.resist < 0.45 ? 2.2 : 0.6) * (1 + (pet.d.disc || 0) / 40)); if (Math.random() < 0.15) G.audio.play('tick'); } } };
  F.onUp = function (p) { if (!st || st.phase !== 'ready') return; const r = F.hand.up(p); if (r) throwDisc(r); };
  function skillInfo() { return G.discSkill(pet); }
  function throwDisc(r) {
    st.phase = 'flight'; st.throws++; G.ui.hint(null);
    if (r.power > 4) G.audio.play('whoosh'); G.state.stats.throws++;
    const path = G.discSim(r.pos, r.vel, { wind: st.wind, pro: discId === 'prodisc', bounds: { x0: -3.4, x1: 3.4, z0: 0.4, z1: 72 } }); st.path = path; st.ft = 0; disc.flying = true; disc.landed = false; disc.mesh.visible = true; disc.pos.copy(path[0].p); disc.mesh.position.copy(disc.pos);
    const plan = G.discPlan(pet, path, { terrain: terrainAt }); const S = plan ? plan.S : G.discSkill(pet);
    st.plan = plan; st.landing = path[path.length - 1].p.clone();
    pet.stop(); pet.brain = null; pet.excite = 1;
    pet.do((function* () {
      yield* pet.wait(Math.max(0.05, S.delay - 0.1)); pet.voice();
      const tgt = plan ? plan.p : st.landing;
      pet.setPose('stand'); pet.moveTarget = new V3(tgt.x, 0, tgt.z); pet.speedMul = S.spd / pet.S;
      let jumped = false, t0 = 0;
      while (st && st.phase === 'flight') {
        if (plan) {
          if (U.d2(pet.pos.x, pet.pos.z, plan.p.x, plan.p.z) < 0.3) { pet.moveTarget = null; pet.lookTarget = disc.pos; }
          if (plan.kind !== 'ground' && !jumped && st.ft >= plan.t - 0.34) jumped = G.discLeap(pet, plan);
          G.discFlip(pet, jumped);
          if (st.ft >= plan.t - 0.001 || disc.landed) {
            if (U.d2(pet.pos.x, pet.pos.z, plan.p.x, plan.p.z) < 0.5 * pet.S + 1.0) { catchIt(); break; }
            // got slowed down (sand!) and arrived too late
            st.plan = null; if (disc.landed) { missed(); break; } pet.moveTarget = new V3(st.landing.x, 0, st.landing.z);
            yield* (function* () { while (st && st.phase === 'flight' && !disc.landed) yield; })(); break;
          }
        } else if (disc.landed) break;
        yield;
      }
      pet.lookTarget = null;
    })());
  }
  function grabDisc() { const m = G.M.item(discId); pet.grab({ id: discId, mesh: m, pos: new V3(), vel: new V3() }, 'toy'); }
  function catchIt() {
    const plan = st.plan; disc.flying = false; disc.mesh.visible = false; grabDisc();
    const dist = Math.max(0, plan.p.z - 1.0); const mult = plan.kind === 'flip' ? 3 : plan.kind === 'jump' ? 2 : 1; const zb = zoneBonus(plan.p); const pts = Math.round(dist * mult) + zb;
    if (zb) { G.audio.play('chime'); G.fx.spawn('sparkle', plan.p.clone().setY(0.4), 16); setTimeout(() => popText(plan.p.clone().setY(2.1), 'ZONE +' + zb, '#e0a400'), 250); }
    st.catches++; G.state.stats.catches++; pet.d.catches = (pet.d.catches || 0) + 1;
    pet.d.disc = Math.min(100, (pet.d.disc || 0) + [0, 1.5, 2.5, 3][mult] * (st.practice ? 0.7 : 1));
    if (mult > 1) { G.stamp('flying'); G.audio.play('sparkle'); G.fx.spawn('confetti', plan.p.clone(), mult === 3 ? 40 : 20); G.fx.spawn('star', plan.p.clone(), 8); }
    G.audio.play('cheer'); crowdJump(0.4 * mult, 0); G.vibrate(30);
    if (!st.practice) st.score += pts;
    popText(plan.p.clone().setY(1.6), '+' + pts + (mult === 3 ? ' FLIP x3!' : mult === 2 ? ' JUMP x2' : ''), mult === 3 ? '#7a5cff' : mult === 2 ? '#e2574c' : '#ee8a3c');
    commentary(zb ? 'Right in the bonus zone! +' + zb + '!' : mult === 3 ? 'A FLIP CATCH! The crowd is on its feet!' : mult === 2 ? 'What a leap by ' + pet.name + '!' : U.pick(['Nice grab!', 'Clean catch!', pet.name + ' makes it look easy!']));
    if (mult === 3 && st.cls && st.cls.tier >= 4) fireworks(2);
    st.phase = 'return'; hud();
    pet.do((function* () { yield* pet.waitUntil(() => !pet.airborne && !pet.flipL, 2); pet.extraPitch = 0; afterCatch(); })());
  }
  function missed() {
    st.phase = 'return'; G.audio.play('aww'); commentary(U.pick(['Ooh, just out of reach!', 'A little too far that time!', 'The disc wins this round!']));
    pet.stop(); pet.extraPitch = 0; pet.do((function* () {
      yield* pet.goto(disc.pos.x, disc.pos.z, { speed: skillInfo().spd / pet.S, near: 0.3 });
      disc.mesh.visible = false; grabDisc(); pet.emote('sweat');
      afterCatch();
    })());
  }
  function afterCatch() {
    if (!st) return;
    const c = st.cls; const sk = pet.d.disc || 0; const bond = pet.d.bond || 0;
    const p = Math.max(0, 0.55 - sk * 0.008 - bond * 0.004 - ((pet.d.nameLearn || 0) >= 1 ? 0.08 : 0)) * (c ? c.dis : 0.6);
    if (Math.random() < p) goRogue(); else bringBack();
  }
  function bringBack() {
    st.phase = 'return';
    pet.do((function* () {
      yield* pet.wait(0.25);
      yield* pet.goto(SIT.x, SIT.z + 0.3, { speed: 4.5 + (pet.d.disc || 0) * 0.02, timeout: 20 }); yield* pet.face(0, -3);
      const tugP = st && st.cls && st.time > 3 && pet.carry ? Math.max(0, 0.45 - (pet.d.disc || 0) * 0.006 - (pet.d.bond || 0) * 0.003) * st.cls.dis : 0;
      if (st && (st.forceTug || Math.random() < tugP)) { st.forceTug = false; yield* tugOfWar(); if (!st) return; }
      pet.setPose('sit'); pet.lookCam = 2; yield* pet.wait(0.3);
      if (pet.carry) { pet.m.mouth.remove(pet.carry.mesh); pet.carry = null; }
      pet.happy(2); pet.voice('happy');
      if (st && st.phase === 'return') { if (st.practice || st.time > 0) { st.phase = 'ready'; F.hand.show(discId); } else { st.phase = 'done'; finish(); } }
    })());
  }
  function* tugOfWar() {
    st.phase = 'tug'; st.tug = { prog: 0, t: 0, resist: 1, ly: null };
    commentary(pet.name + ' won\u2019t let go! Pull it away!'); G.audio.play('growl');
    G.ui.hint('TUG OF WAR! Drag DOWN on the screen to pull the disc away \u2014 pull hardest when ' + pet.name + ' relaxes!', 4500);
    pet.moveTarget = null; pet.lookCam = 1;
    const base = pet.pos.clone();
    while (st && st.phase === 'tug') {
      const tg = st.tug; tg.t += pet.dt; tg.resist = 0.5 + 0.5 * Math.sin(tg.t * 3.2);
      pet.setPose('tug'); pet.excite = 1; pet.heading = Math.PI; pet.lookTarget = new V3(base.x + Math.sin(tg.t * 13) * 1.4, 0.35, base.z - 2.5);
      pet.pos.x = base.x + Math.sin(tg.t * 9) * 0.04; pet.pos.z = base.z + 0.2 * tg.resist - tg.prog * 0.35;
      if (tg.prog >= 1) break;
      tg.prog = Math.max(0, tg.prog - pet.dt * 0.07);
      if (Math.random() < pet.dt * 0.7) G.audio.play('growl');
      $('#contestHud').innerHTML = 'TUG! <span class="tugbar"><i style="width:' + Math.round(tg.prog * 100) + '%;background:' + (tg.resist < 0.45 ? '#79b25a' : '#e2574c') + '"></i></span> Time <span>' + Math.max(0, Math.ceil(st.time)) + 's</span>';
      if (st.time <= 0) break;
      yield;
    }
    if (!st) return;
    pet.lookTarget = null; pet.pos.copy(base); G.audio.play('pop'); G.audio.play('cheer'); crowdJump(0.6, 0); pet.emote('sweat', 1);
    commentary('Got it! ' + pet.name + ' finally lets go!'); G.stamp('tug'); st.phase = 'return'; st.tug = null; hud();
  }
  function goRogue() {
    st.phase = 'rogue'; st.obey = 0;
    const kind = U.pick(['chew', 'chew', 'zoom', 'sniff']);
    G.ui.prompts([{ label: 'Call ' + pet.name + '!', cls: 'pink', fn: () => F.call() }]); G.voice.listenFor('Say "' + pet.name + '"!', 20, null, true);
    commentary(kind === 'chew' ? 'Uh oh, ' + pet.name + ' is chewing the disc!' : kind === 'zoom' ? pet.name + ' has the zoomies!' : pet.name + ' found something interesting to sniff...');
    G.ui.toast(G.voice.supported() && !G.voice.denied ? 'Say "' + pet.name + '" to call them back, or tap Call a few times!' : 'Tap Call (or tap ' + pet.name + ') a few times to get them back!');
    pet.do((function* () {
      const spot = new V3(U.clamp(pet.pos.x + U.rand(-4, 4), -3, 3), 0, U.clamp(pet.pos.z + U.rand(-2, 4), 3, 40));
      yield* pet.goto(spot.x, spot.z, { speed: 2.2, timeout: 3 });
      while (st && st.phase === 'rogue') {
        if (kind === 'chew') { pet.setPose('lie'); pet.gnaw = true; pet.chewT = 0.5; if (Math.random() < pet.dt * 1.5) G.audio.play('munch'); if (Math.random() < pet.dt * 0.4) pet.emote('note', 1); }
        else if (kind === 'zoom') { if (!pet.moveTarget || U.d2(pet.pos.x, pet.pos.z, pet.moveTarget.x, pet.moveTarget.z) < 0.5) { pet.setPose('stand'); pet.moveTarget = new V3(U.rand(-3, 3), 0, U.rand(3, 25)); pet.speedMul = 3.5; } }
        else { if (!pet.moveTarget || U.d2(pet.pos.x, pet.pos.z, pet.moveTarget.x, pet.moveTarget.z) < 0.3) { pet.setPose('sniff'); pet.moveTarget = new V3(pet.pos.x + U.rand(-1.5, 1.5), 0, pet.pos.z + U.rand(-1.5, 1.5)); pet.speedMul = 0.5; } }
        yield;
      }
      pet.gnaw = false; pet.moveTarget = null;
    })());
  }
  F.onVoice = function (kind) { if (kind === 'name' && st && st.phase === 'rogue') { F.call(true); return true; } if (kind === 'name') { pet.emote('bang', 0.8); pet.lookCam = 2; return true; } return true; };
  F.call = function (voiced) {
    if (!st || st.phase !== 'rogue') return;
    G.audio.play('call'); const learned = (pet.d.nameLearn || 0) >= 1;
    st.obey += voiced ? 1 : (learned ? 0.36 : 0.26) + (pet.d.bond || 0) * 0.002;
    pet.lookCam = 1; pet.tiltT = 0.6; pet.emote(st.obey >= 1 ? 'bang' : 'q', 0.6);
    if (st.obey >= 1) { G.voice.done(); G.ui.prompts([]); pet.gnaw = false; pet.stop(); commentary(pet.name + ' is coming back!'); pet.voice(); bringBack(); }
  };

  /* ---------------- results ---------------- */
  function finish() {
    if (!st || st.phase === 'done2') return; st.phase = 'done2';
    G.ui.prompts([]); disc.mesh.visible = false; F.hand.hide(); $('#dock').style.visibility = '';
    const c = st.cls; const board = leaderboard(); const place = board.findIndex((x) => x.me) + 1;
    G.state.stats.contests++;
    const prize = place <= 3 ? c.prize[place - 1] : 15;
    if (place <= 3) { G.state.trophies.push({ cls: c.id, place, date: Date.now(), pet: pet.d.id }); pet.d.trophies = (pet.d.trophies || 0) + 1; }
    let unlockedNew = null;
    let prizeAcc = [];
    if (place === 1) { const cups = G.petCups(pet.d); cups[c.id + '_won'] = true; const nx = G.CONTESTS[G.CONTESTS.indexOf(c) + 1]; if (nx && !cups[nx.id]) { cups[nx.id] = true; unlockedNew = nx; } if (c.id === 'champ') prizeAcc = G.givePrize(['crown', 'cape']); }
    G.state.coins += prize; G.checkStamps(); G.save();
    G.audio.track(place <= 3 ? 'victory' : 'contestIntro');
    if (place === 1) { G.audio.play('fanfare'); G.fx.spawn('confetti', pet.pos.clone().setY(1.5), 60); crowdJump(1.5, 0); if (c.tier >= 2) fireworks(5); } else if (place <= 3) G.audio.play('chime'); else G.audio.play('sad');
    pet.do((function* () { yield* pet.face(0, -3); if (place <= 3) { yield* pet.act('beg', 1.6, 'happy'); pet.voice(); yield* pet.trick('spin'); } yield* pet.act('sit', 2); })());
    const stats = { catches: st.catches, throws: st.throws };
    setTimeout(() => {
      G.ui.sheet({ title: place <= 3 ? ['', 'You won the ' + c.name + '!', '2nd place!', '3rd place!'][place] : 'Results', render(body) {
        board.forEach((b, i) => { const r = document.createElement('div'); r.className = 'score' + (b.me ? ' me' : ''); r.innerHTML = '<span>' + (i + 1) + '. ' + U.esc(b.dog) + ' <small style="color:#7a5c46">(' + U.esc(b.owner) + ', ' + U.esc(G.BREEDS[b.breed].name) + ')</small></span><span>' + Math.round(b.score) + '</span>'; body.appendChild(r); });
        G.ui.note(body, stats.catches + ' catches from ' + stats.throws + ' throws. Prize: ' + prize + ' coins' + (place <= 3 ? ' and a trophy!' : '. Keep practicing!') + (unlockedNew ? ' The ' + unlockedNew.name + ' is now unlocked!' : '') + '');
        if (c.id === 'champ' && place === 1) G.ui.prizeBox(body, prizeAcc, ['crown', 'cape'], pet);
        const r = document.createElement('div'); r.className = 'mrow';
        const again = document.createElement('button'); again.className = 'btn ghost'; again.textContent = 'Enter another cup'; again.onclick = () => { G.ui.closeSheet(true); st = null; clearRivals(); classMenu(); };
        const back = document.createElement('button'); back.className = 'btn orange'; back.textContent = from === 'walk' ? 'Back to town' : 'Go home'; back.onclick = () => G.go(from === 'walk' ? 'walk' : 'home', { from: 'field' });
        r.append(again, back); body.appendChild(r);
      } });
      G.ui.refresh();
    }, 2400);
  }
  function crowdJump(a, x) { for (const c of crowdData) c.jump = Math.max(c.jump, a * U.rand(0.4, 1) * (x === undefined ? 1 : 1 - Math.min(0.6, Math.abs(c.x - x) / 30))); }
  function fireworks(n) {
    for (let k = 0; k < n; k++) setTimeout(() => {
      if (!st) return; const c = new V3(U.rand(-20, 20), U.rand(16, 26), U.rand(50, 80)); const col = U.pick(['#ff6f91', '#f2c24b', '#4aa6e0', '#9fe08a', '#c39bf3']);
      G.audio.play('thud'); for (let i = 0; i < 26; i++) { const a = Math.random() * 6.28, b = Math.random() * 3.14; G.fx.spawn('sparkle', c, 1, { color: col, scale: 3, life: 1.4, vel: new V3(Math.cos(a) * Math.sin(b) * 9, Math.cos(b) * 9, Math.sin(a) * Math.sin(b) * 9) }); }
    }, k * 380);
  }

  /* ---------------- update ---------------- */
  F.update = function (dt) {
    if (!pet) return;
    frame++;
    const running = !!(st && st.cls && ['ready', 'flight', 'return', 'rogue', 'tug'].includes(st.phase) && st.time > 0);
    if (running) {
      st.time -= dt;
      if (st.time <= 0) {
        st.time = 0; G.audio.play('whistle'); G.ui.banner('TIME!', null, 1400); crowdJump(1, 0);
        if (st.phase === 'rogue') { G.ui.prompts([]); pet.gnaw = false; pet.stop(); bringBack(); }
        else if (st.phase === 'ready') { st.phase = 'done'; finish(); }
      }
      if (Math.floor(st.time) !== st._lastSec) { st._lastSec = Math.floor(st.time); hud(); drawBoard(); if (st.time <= 5 && st.time > 0) G.audio.play('tick'); }
    }
    updateField(dt);
    for (const r of rivals) updateRival(r, dt, running);
    pet.update(dt); mc.update(dt); mc.lookAt = pet.pos;
    if (st && st.phase === 'ready') F.hand.update(dt);
    if (st && st.phase === 'flight') st.ft += dt;
    if (st && st.phase === 'flight' && disc.flying) {
      const P = st.path; let i = 0; while (i < P.length - 1 && P[i].t < st.ft) i++;
      disc.pos.copy(P[i].p); disc.mesh.position.copy(disc.pos); if (!P[i].ground) { disc.mesh.rotation.y += dt * 22; disc.mesh.rotation.x = 0.06; disc.mesh.rotation.z = P[i].bank; } else { disc.mesh.rotation.x = 0; disc.mesh.rotation.z = 0; }
      if (i >= P.length - 1) { disc.flying = false; disc.landed = true; G.audio.play('thud'); if (!st.plan) missed(); }
    }
    const m4 = new THREE.Matrix4(); const q = new THREE.Quaternion(); const one = new V3(1, 1, 1);
    for (let i = 0; i < crowd.body.count; i++) { const c = crowdData[i]; c.ph += dt * 3; c.jump = Math.max(0, c.jump - dt * 0.6); const wave = c.wave && st && st.cls ? Math.max(0, Math.sin(G.time * 2 - c.z * 0.15)) * 0.25 : 0; const y = c.y + 0.4 + Math.abs(Math.sin(c.ph)) * (0.04 + c.jump * 0.3) + wave; m4.compose(new V3(c.x, y, c.z), q, one); crowd.body.setMatrixAt(i, m4); m4.compose(new V3(c.x, y + 0.5, c.z), q, one); crowd.head.setMatrixAt(i, m4); }
    crowd.body.instanceMatrix.needsUpdate = true; crowd.head.instanceMatrix.needsUpdate = true;
    for (const b of balloons) { if (!b.parent.visible) continue; b.userData.ph += dt; b.position.y = b.userData.y0 + Math.sin(b.userData.ph) * 0.2; b.rotation.z = Math.sin(b.userData.ph * 0.7) * 0.1; }
    shibaBalloon = tiers.find((g) => g.visible) && tiers.find((g) => g.visible).userData.big;
    if (shibaBalloon) { shibaBalloon.root.rotation.z = Math.sin(G.time * 0.6) * 0.03; shibaBalloon.tail.rotation.z = Math.sin(G.time * 2) * 0.4; shibaBalloon.head.rotation.y = Math.sin(G.time * 0.4) * 0.3; }
    if (blimp && blimp.parent.visible) { const a = G.time * 0.05; blimp.position.set(Math.cos(a) * 40, 32, 40 + Math.sin(a) * 30); blimp.rotation.y = -a + Math.PI; }
    if (jumbo && jumbo.parent.visible && frame % 3 === 0) { jumboCam.position.copy(pet.pos).add(new V3(2.2, 1.4, 2.8)); jumboCam.lookAt(pet.pos.clone().setY(0.5)); jumbo.visible = false; G.renderer.setRenderTarget(jumboRT); G.renderer.render(scene, jumboCam); G.renderer.setRenderTarget(null); jumbo.visible = true; }
    const portrait = G.aspect() < 0.9;
    let pos = portrait ? new V3(0.5, 3.2, -6.6) : new V3(0.6, 2.2, -4.4), look = new V3(0, 0.7, 11);
    if (introFocus) { look = introFocus.clone().setY(0.5); pos = look.clone().add(new V3(introFocus.x > 0.5 ? -1.6 : introFocus.x < -0.5 ? 1.6 : 0.4, 1.5, -3.6)); }
    if (st && (st.phase === 'flight' || st.phase === 'return' || st.phase === 'rogue')) {
      const dz = disc.flying ? disc.pos.z : pet.pos.z;
      look = new V3(pet.pos.x * 0.6, 0.7, (pet.pos.z + Math.min(dz, pet.pos.z + 10)) / 2 + 1.5); pos = new V3(pet.pos.x * 0.4 + 0.4, portrait ? 3.6 : 2.7, Math.max(-3.4, pet.pos.z - (portrait ? 8.5 : 6.5)));
    }
    if (st && st.phase === 'tug') { look = pet.pos.clone().setY(0.35); pos = pet.pos.clone().add(new V3(0.5, 1.3, -2.4)); }
    if (st && (st.phase === 'done' || st.phase === 'done2')) { look = pet.pos.clone().setY(0.4); pos = pet.pos.clone().add(new V3(1.2, 1.2, -2.6)); }
    const k = 1 - Math.exp(-2.6 * dt); cam.position.lerp(pos, k); lookV.lerp(look, k); cam.lookAt(lookV);
  };
  return F;
})();
