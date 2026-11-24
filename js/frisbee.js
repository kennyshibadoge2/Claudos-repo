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
  const HAND = new V3(0.35, 1.15, 0.2), SIT = new V3(0.9, 0, 0.7);
  const LANES = [-10, -5.2, 5.2, 10];
  F.init = function () {
    scene = new THREE.Scene(); F.scene = scene; scene.background = new THREE.Color('#9fd4ff'); scene.fog = new THREE.Fog('#9fd4ff', 55, 130);
    cam = new THREE.PerspectiveCamera(50, G.aspect(), 0.1, 260); F.camera = cam;
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
  function clearRivals() { for (const r of rivals) { scene.remove(r.pet.root); scene.remove(r.person.root); scene.remove(r.disc); scene.remove(r.tag); } rivals = []; }
  function makeRivals(cls) {
    clearRivals();
    const pool = G.RIVALS.slice().sort(() => Math.random() - 0.5).slice(0, 4);
    const skill = G.CONTEST_RIVALS[cls.tier];
    pool.forEach(([owner, dog, breed], i) => {
      const x = LANES[i];
      const p = new G.Pet({ name: dog, breed, coat: U.pick(COATS[breed] || ['red']), mood: 90, acc: { collar: U.pick(['collar_blue', 'collar_red', 'collar_pink', 'collar_gold']) } }, { npc: true });
      p.pos.set(x + 0.9, 0, 0.7); p.heading = 0; p.brain = null; p.bounds = null; scene.add(p.root);
      const per = new G.Person(randLook()); per.pos.set(x, 0, 0); per.heading = 0; scene.add(per.root);
      const d = G.M.item('disc'); d.scale.setScalar(1.6); scene.add(d);
      const tag = new THREE.Sprite(new THREE.SpriteMaterial({ map: G.textTex(dog, { font: '700 44px Fredoka, sans-serif', bg: 'rgba(59,42,31,.75)', color: '#fff', pad: 12, radius: 22 }), depthTest: false })); tag.scale.set(1.0, 0.3, 1); tag.renderOrder = 15; scene.add(tag);
      rivals.push({ owner, dog, breed, x, pet: p, person: per, disc: d, tag, skill, score: 0, state: 'ready', t: U.rand(0.5, 2.2), throw: null });
    });
  }
  function updateRival(r, dt, running) {
    const p = r.pet; r.t -= dt;
    r.tag.position.copy(p.pos).setY(p.sizeH + 0.45);
    if (r.state === 'ready') {
      r.disc.position.copy(r.person.pos).add(new V3(0.3, 1.0, 0.3)); r.disc.rotation.set(0.5, 0, 0);
      p.setPose('sit'); p.moveTarget = null; p.heading = 0;
      if (running && r.t <= 0) {
        const sk = r.skill; const D = U.rand(sk.d[0], sk.d[1]); const T = 0.6 + D / 9;
        const caught = Math.random() < sk.catch; const kind = !caught ? 'miss' : Math.random() < sk.flip ? 'flip' : Math.random() < sk.jump ? 'jump' : 'ground';
        r.throw = { D, T, k: 0, land: new V3(r.x + U.rand(-1, 1), 0, D), kind, jumped: false };
        r.state = 'fly'; r.person.waveT = 0.4; if (Math.random() < 0.3) G.audio.play('whoosh');
        p.setPose('stand'); p.excite = 1;
      }
    } else if (r.state === 'fly') {
      const th = r.throw; th.k = Math.min(1, th.k + dt / th.T);
      const start = r.person.pos.clone().add(new V3(0.3, 1.1, 0.3));
      r.disc.position.copy(start).lerp(th.land, th.k); r.disc.position.y = 1.1 * (1 - th.k) + Math.sin(th.k * Math.PI) * (1 + th.D * 0.08) + (th.kind === 'miss' ? 0 : 0.5 * th.k); r.disc.rotation.y += dt * 20;
      const catchK = th.kind === 'miss' ? 1 : 0.9;
      const target = start.clone().lerp(th.land, catchK).setY(0);
      const remain = Math.max(0.1, (catchK - th.k) * th.T);
      const dist = U.d2(p.pos.x, p.pos.z, target.x, target.z);
      p.moveTarget = target; p.speedMul = U.clamp(dist / remain / p.S, 1, 9);
      if ((th.kind === 'jump' || th.kind === 'flip') && !th.jumped && th.k > catchK - 0.12) { th.jumped = true; p.jump(th.kind === 'flip' ? 4 : 3.4); p.setPose('leap', 10); th.flipT0 = G.time; }
      if (th.kind === 'flip' && th.jumped && p.airborne) p.extraPitch = -Math.PI * 2 * U.clamp((G.time - th.flipT0) / 0.75, 0, 1); else if (!p.airborne) p.extraPitch = 0;
      if (th.k >= catchK) {
        p.moveTarget = null;
        if (th.kind !== 'miss') { const mult = th.kind === 'flip' ? 3 : th.kind === 'jump' ? 2 : 1; const pts = Math.round(th.D * mult); r.score += pts; popText(p.pos.clone().setY(1.4), '+' + pts + (mult > 1 ? (mult === 3 ? ' FLIP!' : ' JUMP') : ''), mult === 3 ? '#7a5cff' : '#ee8a3c'); if (mult === 3 && Math.random() < 0.5) commentary(r.dog + ' with a flip catch!'); crowdJump(0.3 * mult, r.x); hud(); }
        else r.disc.position.y = 0.03;
        r.state = Math.random() < r.skill.wander ? 'wander' : 'back'; r.t = U.rand(2.5, 4.5);
        if (r.state === 'wander') { p.emote('note', 1.5); if (Math.random() < 0.4) commentary(r.dog + ' is taking a little detour...'); }
      }
    } else if (r.state === 'wander') {
      r.disc.position.copy(p.mouthWorld());
      if (!p.task) p.do(p.zoomies(p.pos.x, p.pos.z, 1.2, 1));
      if (r.t <= 0) { p.stop(); r.state = 'back'; }
    } else if (r.state === 'back') {
      p.extraPitch = 0;
      r.disc.position.copy(p.mouthWorld()); r.disc.rotation.set(1.2, p.heading, 0);
      p.setPose('stand'); p.moveTarget = new V3(r.x + 0.9, 0, 0.9); p.speedMul = 4.5;
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
    $('#dock').style.visibility = ''; if (boardEl) { boardEl.remove(); boardEl = null; }
    if (pet) { if (pet.carry) { pet.m.mouth.remove(pet.carry.mesh); pet.carry = null; } scene.remove(pet.root); pet.stop(); pet.extraPitch = 0; pet.gnaw = false; }
    clearRivals(); $('#contestHud').classList.add('hidden'); G.ui.hint(null); G.ui.prompts([]); st = null;
  };
  F.debug = () => ({ st, rivals, pet });
  F.dock = () => [{ label: 'Cups', icon: 'trophy', fn: () => { if (!st || st.phase === 'done' || st.phase === 'done2') { st = null; clearRivals(); classMenu(); } } }, { label: 'Leave', icon: 'door', cls: 'go', fn: () => G.go(from === 'walk' ? 'walk' : 'home', { from: 'field' }) }];
  function setTier(t) { t = Math.max(0, t); tiers.forEach((g, i) => (g.visible = i === t)); crowd.body.count = crowd.head.count = [70, 130, 220, 280, 320][t]; jumbo = tiers[t].userData.jumbo || null; }
  function* sitBrain(p) { p.lookCam = 2; yield* p.face(p.pos.x, p.pos.z + 5); p.setPose('sit'); yield* p.wait(2); }
  function classMenu() {
    $('#dock').style.visibility = ''; if (boardEl) boardEl.classList.add('hidden'); $('#contestHud').classList.add('hidden'); G.audio.track('contestIntro');
    G.ui.sheet({ title: 'Disc Cup entry', render(body) {
      G.ui.note(body, 'Throw as many times as you can before time runs out! Points = catch distance in meters. Jumping catches x2, flip catches x3. Rivals compete in the lanes beside you.');
      const sk = pet.d.disc || 0;
      G.ui.note(body, pet.name + '’s disc skill: ' + Math.round(sk) + '/100 — ' + (sk < 25 ? 'can’t jump yet, and may get distracted and chew the disc!' : sk < 60 ? 'can make jumping catches.' : 'can do flip catches!') + (discId === 'prodisc' ? ' Using the Pro Disc.' : ''));
      const l = G.ui.list(body);
      l.appendChild(G.ui.li({ icon: 'disc', title: 'Practice', sub: 'No timer, no rivals. Builds disc skill.', fn: () => { G.ui.closeSheet(true); start(null); } }));
      G.CONTESTS.forEach((c) => {
        const open = G.state.unlocked[c.id]; const best = G.state.trophies.filter((t) => t.cls === c.id).reduce((m, t) => Math.min(m, t.place), 9);
        l.appendChild(G.ui.li({ icon: 'trophy', title: c.name + (best < 9 ? ' — best: ' + ['', '1st', '2nd', '3rd'][best] : ''), sub: open ? c.time + 's round · entry ' + (c.fee ? c.fee + ' coins' : 'free') + ' · 1st prize ' + c.prize[0] : 'Locked: win the ' + G.CONTESTS.find((x) => x.id === c.need).name + ' first', lock: !open, fn: open ? () => { if (G.state.coins < c.fee) { G.ui.toast('Not enough coins for the entry fee.'); return; } G.ui.closeSheet(true); G.state.coins -= c.fee; G.ui.refresh(); start(c); } : null }));
      });
    } });
  }
  async function start(cls) {
    st = { cls, practice: !cls, phase: 'intro', score: 0, time: cls ? cls.time : 0, catches: 0, throws: 0, wind: 0, obey: 0 };
    setTier(cls ? cls.tier : 0); $('#dock').style.visibility = 'hidden'; $('#contestHud').classList.remove('hidden');
    pet.stop(); pet.pos.copy(SIT); pet.heading = 0; pet.brain = sitBrain; pet.gnaw = false;
    if (cls) {
      makeRivals(cls);
      const port = G.M.icons.person('pepper');
      await G.ui.say('MC Pepper', U.pick(['Welcome, welcome to the ' + cls.name + '!', 'Laaadies and gentlemen and GOOD DOGS! The ' + cls.name + ' is ON!']), port);
      await G.ui.say('MC Pepper', cls.time + ' seconds on the clock! Five teams, one field. In the center lane: ' + pet.name + ' the ' + G.BREEDS[pet.d.breed].name + '!', port);
      G.ui.endDialog(); if (!st) return; boardEl.classList.remove('hidden'); hud();
      if (cls.tier >= 4) fireworks(6);
      for (const n of ['3', '2', '1']) { G.ui.banner(n, null, 700); G.audio.play('blip'); await G.wait(800); if (!st) return; }
      G.ui.banner('GO!', null, 800); G.audio.play('whistle'); G.audio.track('contest'); crowdJump(0.8);
      st.wind = U.rand(-1, 1) * [0.2, 0.3, 0.6, 1.2, 1.6][cls.tier];
    } else { G.audio.track('contest'); G.ui.prompts([{ label: 'Done practicing', cls: 'orange', fn: () => { st = null; G.ui.prompts([]); disc.mesh.visible = false; classMenu(); } }]); }
    st.phase = 'ready'; disc.mesh.visible = true; hud(); drawBoard();
    G.ui.hint('Flick up to throw! Short soft flick = short throw. Long fast flick = far.', 3500);
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
  F.onDown = function (p) { if (st && st.phase === 'rogue') { const h = G.pick(p, pet.m.meshes, false)[0]; if (h) F.call(); } };
  F.onMove = function (p, down) { if (st && st.phase === 'ready' && down) HAND.x = 0.35 + (p.x / innerWidth - 0.5) * 0.4; };
  F.onUp = function (p) {
    if (!st || st.phase !== 'ready') return;
    const pw = G.throwPower(p);
    if (pw < 0.3) { if (!p.tap) G.ui.toast('Flick upward to throw!'); return; }
    const pro = discId === 'prodisc' ? 1.1 : 1;
    const s = U.clamp(3.2 + pw * 2.6, 4, 18) * pro;
    const ang = U.clamp(p.vx / Math.max(250, -p.vy) * 0.6, -0.22, 0.22);
    throwDisc(s, ang);
  };
  function simulate(s, ang, wind) {
    const pos = HAND.clone(); const vel = new V3(Math.sin(ang) * s, s * 0.06 + 1.0, Math.cos(ang) * s);
    const out = []; const dt = 1 / 60; let t = 0; const L = discId === 'prodisc' ? 9.75 : 9.6;
    while (t < 10) {
      const h = Math.hypot(vel.x, vel.z); const lift = L * Math.min(1, Math.pow(h / 7, 2));
      vel.y += (lift - 9.8) * dt; vel.y *= Math.exp(-0.6 * dt); vel.x += -wind * dt * 0.9; vel.x *= Math.exp(-0.45 * dt); vel.z *= Math.exp(-0.45 * dt);
      pos.addScaledVector(vel, dt); pos.x = U.clamp(pos.x, -3.5, 3.5); t += dt;
      out.push({ t, p: pos.clone() });
      if (pos.y <= 0.03) break;
    }
    return out;
  }
  function skillInfo() {
    const sk = pet.d.disc || 0;
    const reach = (pet.m.baseH + pet.m.dims.by + pet.m.headR) * pet.S + 0.05;
    return { sk, spd: (5.2 + sk * 0.045) * pet.S, delay: 0.32 - sk * 0.0015, reach, canJump: sk >= 25, canFlip: sk >= 60, jumpReach: reach + (sk >= 25 ? 0.35 + sk * 0.006 : 0.06) };
  }
  function throwDisc(s, ang) {
    st.phase = 'flight'; st.throws++; G.ui.hint(null);
    G.audio.play('whoosh'); G.state.stats.throws++;
    const path = simulate(s, ang, st.wind); st.path = path; st.ft = 0; disc.flying = true; disc.landed = false;
    const S = skillInfo(); let plan = null;
    for (let i = 0; i < path.length; i++) {
      const q = path[i]; if (q.p.y > S.jumpReach) continue;
      const need = U.d2(pet.pos.x, pet.pos.z, q.p.x, q.p.z) / S.spd + S.delay;
      if (need <= q.t) { const air = q.p.y > S.reach + 0.02; plan = { i, t: q.t, p: q.p.clone(), kind: !air ? 'ground' : S.canFlip && Math.random() < 0.3 + (S.sk - 60) / 60 ? 'flip' : 'jump' }; break; }
    }
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
          if (plan.kind !== 'ground' && !jumped && st.ft >= plan.t - 0.34) { jumped = true; t0 = G.time; const need = plan.p.y - S.reach; pet.jump(Math.sqrt(Math.max(0.5, 2 * 9.8 * need)) + (plan.kind === 'flip' ? 1.2 : 0.4)); pet.setPose('leap', 10); }
          if (plan.kind === 'flip' && jumped && pet.airborne) pet.extraPitch = -Math.PI * 2 * U.clamp((G.time - t0) / 0.8, 0, 1);
          if (st.ft >= plan.t - 0.001 || disc.landed) { catchIt(); break; }
        } else if (disc.landed) break;
        yield;
      }
      pet.lookTarget = null;
    })());
  }
  function grabDisc() { const m = G.M.item(discId); pet.grab({ id: discId, mesh: m, pos: new V3(), vel: new V3() }, 'toy'); }
  function catchIt() {
    const plan = st.plan; disc.flying = false; disc.mesh.visible = false; grabDisc();
    const dist = Math.max(0, plan.p.z - 1.0); const mult = plan.kind === 'flip' ? 3 : plan.kind === 'jump' ? 2 : 1; const pts = Math.round(dist * mult);
    st.catches++; G.state.stats.catches++; pet.d.catches = (pet.d.catches || 0) + 1;
    pet.d.disc = Math.min(100, (pet.d.disc || 0) + [0, 1.5, 2.5, 3][mult] * (st.practice ? 0.7 : 1));
    if (mult > 1) { G.stamp('flying'); G.audio.play('sparkle'); G.fx.spawn('confetti', plan.p.clone(), mult === 3 ? 40 : 20); G.fx.spawn('star', plan.p.clone(), 8); }
    G.audio.play('cheer'); crowdJump(0.4 * mult, 0); G.vibrate(30);
    if (!st.practice) st.score += pts;
    popText(plan.p.clone().setY(1.6), '+' + pts + (mult === 3 ? ' FLIP x3!' : mult === 2 ? ' JUMP x2' : ''), mult === 3 ? '#7a5cff' : mult === 2 ? '#e2574c' : '#ee8a3c');
    commentary(mult === 3 ? 'A FLIP CATCH! The crowd is on its feet!' : mult === 2 ? 'What a leap by ' + pet.name + '!' : U.pick(['Nice grab!', 'Clean catch!', pet.name + ' makes it look easy!']));
    if (mult === 3 && st.cls && st.cls.tier >= 4) fireworks(2);
    st.phase = 'return'; hud();
    pet.do((function* () { yield* pet.waitUntil(() => !pet.airborne, 2); pet.extraPitch = 0; afterCatch(); })());
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
      pet.setPose('sit'); pet.lookCam = 2; yield* pet.wait(0.3);
      if (pet.carry) { pet.m.mouth.remove(pet.carry.mesh); pet.carry = null; }
      pet.happy(2); pet.voice('happy');
      if (st && st.phase === 'return') { if (st.practice || st.time > 0) { st.phase = 'ready'; disc.mesh.visible = true; } else { st.phase = 'done'; finish(); } }
    })());
  }
  function goRogue() {
    st.phase = 'rogue'; st.obey = 0;
    const kind = U.pick(['chew', 'chew', 'zoom', 'sniff']);
    G.ui.prompts([{ label: 'Call ' + pet.name + '!', cls: 'pink', fn: () => F.call() }]);
    commentary(kind === 'chew' ? 'Uh oh, ' + pet.name + ' is chewing the disc!' : kind === 'zoom' ? pet.name + ' has the zoomies!' : pet.name + ' found something interesting to sniff...');
    G.ui.toast('Tap "Call" (or tap ' + pet.name + ') again and again to get them back!');
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
  F.call = function () {
    if (!st || st.phase !== 'rogue') return;
    G.audio.play('call'); const learned = (pet.d.nameLearn || 0) >= 1;
    st.obey += (learned ? 0.3 : 0.18) + (pet.d.bond || 0) * 0.002;
    pet.lookCam = 1; pet.tiltT = 0.6; pet.emote(st.obey >= 1 ? 'bang' : 'q', 0.6);
    if (st.obey >= 1) { G.ui.prompts([]); pet.gnaw = false; pet.stop(); commentary(pet.name + ' is coming back!'); pet.voice(); bringBack(); }
  };

  /* ---------------- results ---------------- */
  function finish() {
    if (!st || st.phase === 'done2') return; st.phase = 'done2';
    G.ui.prompts([]); disc.mesh.visible = false; $('#dock').style.visibility = '';
    const c = st.cls; const board = leaderboard(); const place = board.findIndex((x) => x.me) + 1;
    G.state.stats.contests++;
    const prize = place <= 3 ? c.prize[place - 1] : 15;
    if (place <= 3) { G.state.trophies.push({ cls: c.id, place, date: Date.now(), pet: pet.d.id }); pet.d.trophies = (pet.d.trophies || 0) + 1; }
    let unlockedNew = null;
    if (place === 1) { const nx = G.CONTESTS[G.CONTESTS.indexOf(c) + 1]; if (nx && !G.state.unlocked[nx.id]) { G.state.unlocked[nx.id] = true; unlockedNew = nx; } if (c.id === 'champ' && !G.state.acc.crown) G.state.acc.crown = 1; }
    G.state.coins += prize; G.checkStamps(); G.save();
    G.audio.track(place <= 3 ? 'victory' : 'contestIntro');
    if (place === 1) { G.audio.play('fanfare'); G.fx.spawn('confetti', pet.pos.clone().setY(1.5), 60); crowdJump(1.5, 0); if (c.tier >= 2) fireworks(5); } else if (place <= 3) G.audio.play('chime'); else G.audio.play('sad');
    pet.do((function* () { yield* pet.face(0, -3); if (place <= 3) { yield* pet.act('beg', 1.6, 'happy'); pet.voice(); yield* pet.trick('spin'); } yield* pet.act('sit', 2); })());
    const stats = { catches: st.catches, throws: st.throws };
    setTimeout(() => {
      G.ui.sheet({ title: place <= 3 ? ['', 'You won the ' + c.name + '!', '2nd place!', '3rd place!'][place] : 'Results', render(body) {
        board.forEach((b, i) => { const r = document.createElement('div'); r.className = 'score' + (b.me ? ' me' : ''); r.innerHTML = '<span>' + (i + 1) + '. ' + U.esc(b.dog) + ' <small style="color:#7a5c46">(' + U.esc(b.owner) + ', ' + U.esc(G.BREEDS[b.breed].name) + ')</small></span><span>' + Math.round(b.score) + '</span>'; body.appendChild(r); });
        G.ui.note(body, stats.catches + ' catches from ' + stats.throws + ' throws. Prize: ' + prize + ' coins' + (place <= 3 ? ' and a trophy!' : '. Keep practicing!') + (unlockedNew ? ' The ' + unlockedNew.name + ' is now unlocked!' : '') + (c.id === 'champ' && place === 1 ? ' You earned the Champion Crown!' : ''));
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
    const running = !!(st && st.cls && ['ready', 'flight', 'return', 'rogue'].includes(st.phase) && st.time > 0);
    if (running) {
      st.time -= dt;
      if (st.time <= 0) {
        st.time = 0; G.audio.play('whistle'); G.ui.banner('TIME!', null, 1400); crowdJump(1, 0);
        if (st.phase === 'rogue') { G.ui.prompts([]); pet.gnaw = false; pet.stop(); bringBack(); }
        else if (st.phase === 'ready') { st.phase = 'done'; finish(); }
      }
      if (Math.floor(st.time) !== st._lastSec) { st._lastSec = Math.floor(st.time); hud(); drawBoard(); if (st.time <= 5 && st.time > 0) G.audio.play('tick'); }
    }
    for (const r of rivals) updateRival(r, dt, running);
    pet.update(dt); mc.update(dt); mc.lookAt = pet.pos;
    if (st && st.phase === 'ready') { disc.pos.copy(cam.localToWorld(new V3(HAND.x - 0.1, -0.55, -1.3))); disc.mesh.position.copy(disc.pos); disc.mesh.rotation.set(0.5, G.time, 0); }
    if (st && st.phase === 'flight') st.ft += dt;
    if (st && st.phase === 'flight' && disc.flying) {
      const P = st.path; let i = 0; while (i < P.length - 1 && P[i].t < st.ft) i++;
      disc.pos.copy(P[i].p); disc.mesh.position.copy(disc.pos); disc.mesh.rotation.y += dt * 22; disc.mesh.rotation.x = 0.08;
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
    let pos = portrait ? new V3(0.5, 2.6, -5.2) : new V3(0.6, 1.8, -3.4), look = new V3(0, 0.9, 10);
    if (st && (st.phase === 'flight' || st.phase === 'return' || st.phase === 'rogue')) {
      const dz = disc.flying ? disc.pos.z : pet.pos.z;
      look = new V3(pet.pos.x * 0.6, 0.7, (pet.pos.z + Math.min(dz, pet.pos.z + 10)) / 2 + 1.5); pos = new V3(pet.pos.x * 0.4 + 0.4, portrait ? 3.6 : 2.7, Math.max(-3.4, pet.pos.z - (portrait ? 8.5 : 6.5)));
    }
    if (st && (st.phase === 'done' || st.phase === 'done2')) { look = pet.pos.clone().setY(0.4); pos = pet.pos.clone().add(new V3(1.2, 1.2, -2.6)); }
    const k = 1 - Math.exp(-2.6 * dt); cam.position.lerp(pos, k); lookV.lerp(look, k); cam.lookAt(lookV);
  };
  return F;
})();
