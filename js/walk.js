'use strict';
/* =========================================================
   Shiba Days — Walk around Maple Hill
   ========================================================= */
G.scenes.walk = (() => {
  const W = { music: 'walk' };
  let scene, cam, L, curve, curveLen, pet = null, npcs = [], npcDogs = [], presents = [], colliders = [], doors = [], steer = null;
  let camYaw = 0, lookV = new V3(), leashMesh = null, ambient = [], talkBusy = false, race = null, walkT = 0, nori = null, noriSpots = [], noriSpot = 0;
  let greeted = new Set(), pendingTap = null, promptKey = '', bulbMats = [], winMat = null, season, skyMat, fountainPos, oakPos, pondPos, idleT = 0, keyActive = false;
  const RX = 24, RZ = 19;

  W.init = function () {
    season = G.season();
    scene = new THREE.Scene(); W.scene = scene;
    scene.background = new THREE.Color('#bfe4ff'); scene.fog = new THREE.Fog('#bfe4ff', 30, 80);
    cam = new THREE.PerspectiveCamera(48, G.aspect(), 0.1, 200); W.camera = cam;
    L = G.outdoorLights(scene, { shadow: 14 });
    build();
  };
  function curvePt(t, out = new V3()) { return curve.getPointAt(((t % 1) + 1) % 1, out); }
  function outward(t) { const T = curve.getTangentAt(((t % 1) + 1) % 1); const n = new V3(T.z, 0, -T.x).normalize(); const p = curvePt(t); if (n.dot(p) < 0) n.negate(); return n; }

  function build() {
    const M = G.M; const st = new THREE.Group(); // static (baked)
    // sky dome
    const skyG = new THREE.SphereGeometry(150, 24, 12); skyMat = new THREE.MeshBasicMaterial({ side: THREE.BackSide, vertexColors: true, fog: false });
    M.paint(skyG, (c, x, y) => { const t = U.clamp(y / 150, 0, 1); c.set('#ffffff'); });
    const sky = new THREE.Mesh(skyG, skyMat); scene.add(sky); W.sky = sky;
    // ground
    const g = new THREE.Mesh(new THREE.PlaneGeometry(220, 220), M.mat('#ffffff', { map: G.grassTex(season, 55), r: 1 })); g.rotation.x = -Math.PI / 2; g.receiveShadow = true; scene.add(g);
    // path ring
    const pts = []; for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; const r = 1 + 0.06 * Math.sin(3 * a + 0.5); pts.push(new V3(Math.cos(a) * RX * r, 0, Math.sin(a) * RZ * r)); }
    curve = new THREE.CatmullRomCurve3(pts, true); curveLen = curve.getLength();
    const pathTex = G.canvasTex(128, 128, (c) => { c.fillStyle = '#e8d2a8'; c.fillRect(0, 0, 128, 128); for (let i = 0; i < 220; i++) { c.fillStyle = U.pick(['#d9bf92', '#f0dfbd', '#cdb085', '#e2c99c']); c.beginPath(); c.ellipse(Math.random() * 128, Math.random() * 128, U.rand(2, 6), U.rand(2, 5), Math.random() * 3, 0, 7); c.fill(); } c.fillStyle = 'rgba(120,150,70,.6)'; c.fillRect(0, 0, 6, 128); c.fillRect(122, 0, 6, 128); }, { repeat: [1, 1] });
    pathTex.wrapS = pathTex.wrapT = THREE.RepeatWrapping;
    const N = 420, w = 2.8; const pos = [], uv = [], idx = [];
    for (let i = 0; i <= N; i++) { const t = i / N; const p = curve.getPointAt(t % 1); const T = curve.getTangentAt(t % 1); const n = new V3(T.z, 0, -T.x).normalize(); pos.push(p.x + n.x * w / 2, 0.025, p.z + n.z * w / 2, p.x - n.x * w / 2, 0.025, p.z - n.z * w / 2); uv.push(0, t * curveLen / 3, 1, t * curveLen / 3); if (i < N) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } }
    const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); pg.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); pg.setIndex(idx); pg.computeVertexNormals();
    const path = new THREE.Mesh(pg, M.mat('#ffffff', { map: pathTex, r: 1, side: THREE.DoubleSide })); path.receiveShadow = true; scene.add(path);
    // pond
    pondPos = new V3(-7, 0, 3);
    const pond = new THREE.Mesh(new THREE.CircleGeometry(4.2, 48), M.mat('#5fb4e6', { r: 0.08, m: 0.1 })); pond.rotation.x = -Math.PI / 2; pond.position.set(pondPos.x, 0.04, pondPos.z); scene.add(pond);
    const pondEdge = new THREE.Mesh(new THREE.RingGeometry(4.15, 4.6, 48), M.mat('#c9b48a', { r: 1 })); pondEdge.rotation.x = -Math.PI / 2; pondEdge.position.set(pondPos.x, 0.035, pondPos.z); pondEdge.receiveShadow = true; scene.add(pondEdge);
    for (let i = 0; i < 46; i++) { const a = i / 46 * Math.PI * 2; const s = new THREE.Mesh(new THREE.IcosahedronGeometry(U.rand(0.18, 0.32), 0), M.mat(U.pick(['#9a948a', '#b5ada0', '#857f76']), { r: 0.9, flat: true })); s.position.set(pondPos.x + Math.cos(a) * 4.5, 0.08, pondPos.z + Math.sin(a) * 4.5); s.rotation.set(Math.random() * 3, Math.random() * 3, 0); s.castShadow = true; st.add(s); }
    for (let i = 0; i < 7; i++) { const lp = new THREE.Mesh(new THREE.CircleGeometry(U.rand(0.25, 0.4), 16, 0.3, Math.PI * 1.8), M.mat('#5e9e44', { r: 0.8 })); lp.rotation.x = -Math.PI / 2; const a = Math.random() * 6.28, d = U.rand(1, 3.4); lp.position.set(pondPos.x + Math.cos(a) * d, 0.05, pondPos.z + Math.sin(a) * d); scene.add(lp); }
    W.ducks = [];
    for (let i = 0; i < 2; i++) { const d = M.item('duck'); d.scale.setScalar(2.2); scene.add(d); W.ducks.push({ m: d, a: Math.random() * 6, r: U.rand(1.5, 2.8), s: U.rand(0.15, 0.3) }); }
    colliders.push({ x: pondPos.x, z: pondPos.z, r: 4.7 });
    // fountain
    fountainPos = new V3(8, 0, -3);
    const stone = M.mat('#d8d0c4', { r: 0.8 });
    const f1 = new THREE.Mesh(new THREE.CylinderGeometry(1.7, 1.8, 0.5, 32), stone); f1.position.set(fountainPos.x, 0.25, fountainPos.z); f1.castShadow = true; f1.receiveShadow = true; st.add(f1);
    const fw = new THREE.Mesh(new THREE.CircleGeometry(1.5, 32), M.mat('#7cc8f0', { r: 0.05 })); fw.rotation.x = -Math.PI / 2; fw.position.set(fountainPos.x, 0.51, fountainPos.z); scene.add(fw);
    const f2 = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.25, 1.2, 12), stone); f2.position.set(fountainPos.x, 1.0, fountainPos.z); st.add(f2);
    const f3 = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.3, 0.25, 24), stone); f3.position.set(fountainPos.x, 1.6, fountainPos.z); f3.castShadow = true; st.add(f3);
    colliders.push({ x: fountainPos.x, z: fountainPos.z, r: 1.95 });
    // big oak (race goal)
    oakPos = new V3(0, 0, -9);
    const oak = M.tree(season, 'round', mulberry(7)); oak.scale.setScalar(1.8); oak.position.copy(oakPos); st.add(oak); colliders.push({ x: oakPos.x, z: oakPos.z, r: 0.6 });
    // benches
    [[-7, -2.2, pondPos], [-2.3, 4.0, pondPos], [4.8, 2.6, fountainPos], [11, -6.2, fountainPos], [-12.2, 6.5, pondPos]].forEach(([x, z, look]) => { const b = M.bench(); b.position.set(x, 0, z); b.rotation.y = Math.atan2(look.x - x, look.z - z); st.add(b); colliders.push({ x, z, r: 0.75 }); });
    // flowers & bushes
    [[3, -5, 1.4], [-3, -6, 1.1], [12, 2, 1.3], [-14, -4, 1.2], [6, 8, 1.4], [-2, 9.5, 1]].forEach(([x, z, r]) => { const f = M.flowers(Math.round(r * 30), r, mulberry(x * 7 + z)); f.position.set(x, 0, z); st.add(f); });
    // buildings
    const rnd = mulberry(42);
    const BLD = [
      { t: 0.0, kind: 'cafe', name: 'Paw & Bean Café', o: { w: 5.2, d: 4, h: 3, wall: '#fff2dc', roof: '#7a4a24', sign: 'Paw & Bean', signCol: '#7a4a24', awning: '#7a4a24', door: '#7a4a24' } },
      { t: 0.09, kind: 'shop', name: 'Maple Pets', o: { w: 5, d: 4, h: 3, wall: '#eef7e4', roof: '#4a8a3a', sign: 'Maple Pets', signCol: '#3f7a32', awning: '#79b25a' } },
      { t: 0.25, kind: 'field', name: 'Disc Cup Field' },
      { t: 0.5, kind: 'kennel', name: 'Maple Kennel', o: { w: 3.6, d: 2.8, h: 2.2, wall: '#fff2dc', roof: '#e2574c', sign: 'Maple Kennel', signCol: '#e2574c', windows: [[-1.1, 1.3]] } },
      { t: 0.75, kind: 'home', name: 'Home', o: { w: 4.6, d: 3.8, h: 2.7, wall: '#fff7ea', roof: '#ee8a3c', door: '#c8622a', sign: 'Home', signCol: '#c8622a' } },
    ];
    const pal = [['#fde3e3', '#c84a4a'], ['#e3eefd', '#3b5ba8'], ['#fff3d6', '#c8922a'], ['#e9f6e9', '#4a8a5a'], ['#f2e6fa', '#7a5c9a'], ['#fff0e6', '#b35a3a']];
    [0.17, 0.33, 0.41, 0.59, 0.66, 0.84, 0.92].forEach((t, i) => BLD.push({ t, kind: 'house', o: { w: U.lerp(3.6, 4.6, rnd()), d: 3.4, h: U.lerp(2.4, 3.1, rnd()), wall: pal[i % pal.length][0], roof: pal[i % pal.length][1] } }));
    for (const b of BLD) {
      const P = curvePt(b.t), n = outward(b.t);
      if (b.kind === 'field') {
        const gate = new THREE.Group(); const gp = P.clone().addScaledVector(n, 3.2); gate.position.copy(gp); gate.rotation.y = Math.atan2(-n.x, -n.z); st.add(gate);
        const pm = M.mat('#ffffff', { r: 0.6 });
        for (const s of [-1, 1]) { const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 3.2, 12), pm); pole.position.set(s * 2.2, 1.6, 0); pole.castShadow = true; gate.add(pole); const ball = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 10), M.mat('#ee8a3c')); ball.position.set(s * 2.2, 3.3, 0); gate.add(ball); }
        const tex = G.textTex('Disc Cup Field', { font: '700 64px Fredoka, sans-serif', bg: '#ee8a3c', color: '#fff', pad: 30 });
        const ban = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 4.2 * tex.userData.h / tex.userData.w), M.mat('#fff', { map: tex, side: THREE.DoubleSide })); ban.position.set(0, 2.7, 0.02); gate.add(ban);
        for (let i = 0; i < 9; i++) { const fl = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.32, 3), M.mat(['#e2574c', '#f2c24b', '#4aa6e0', '#79b25a'][i % 4], { side: THREE.DoubleSide })); fl.rotation.z = Math.PI; fl.position.set(-2 + i * 0.5, 3.05 - Math.sin(i / 8 * Math.PI) * 0.25, 0); gate.add(fl); }
        const fieldG = new THREE.Mesh(new THREE.PlaneGeometry(14, 10), M.mat('#9fd27a', { r: 1 })); fieldG.rotation.x = -Math.PI / 2; fieldG.position.copy(P.clone().addScaledVector(n, 9)).setY(0.015); fieldG.rotation.z = Math.atan2(-n.x, -n.z); fieldG.receiveShadow = true; scene.add(fieldG);
        doors.push({ kind: b.kind, name: b.name, p: P.clone().addScaledVector(n, 2.0) });
        continue;
      }
      const h = M.house(b.o); const cpos = P.clone().addScaledVector(n, b.o.d / 2 + 2.4); h.position.copy(cpos); h.rotation.y = Math.atan2(-n.x, -n.z); st.add(h);
      colliders.push({ x: cpos.x, z: cpos.z, r: Math.max(b.o.w, b.o.d) * 0.55 });
      if (b.kind !== 'house') doors.push({ kind: b.kind, name: b.name, p: P.clone().addScaledVector(n, 1.7) });
      if (b.kind === 'cafe') { for (const s of [-1, 1]) { const tb = new THREE.Group(); const tp = P.clone().addScaledVector(n, 1.4 + 0.2).add(curve.getTangentAt(b.t).multiplyScalar(s * 3.4)); tb.position.copy(tp); st.add(tb); const top = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.05, 20), M.mat('#fff7ea')); top.position.y = 0.75; tb.add(top); const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.75, 8), M.mat('#3b2a1f')); leg.position.y = 0.37; tb.add(leg); const um = new THREE.Mesh(new THREE.ConeGeometry(1.0, 0.45, 8), M.mat('#e2574c', { side: THREE.DoubleSide })); um.position.y = 2.1; tb.add(um); const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.4, 6), M.mat('#3b2a1f')); pole.position.y = 1.4; tb.add(pole); tb.traverse((o) => { if (o.isMesh) o.castShadow = true; }); colliders.push({ x: tp.x, z: tp.z, r: 0.5 }); } }
    }
    winMat = M.mat('#bfe4ff', { r: 0.2, em: '#ffd98a', ei: 0 });
    // lamps along the path
    for (let i = 0; i < 14; i++) { const t = i / 14 + 0.03; const P = curvePt(t), n = outward(t); const lp = M.lamp(); lp.position.copy(P).addScaledVector(n, 1.9); st.add(lp); colliders.push({ x: lp.position.x, z: lp.position.z, r: 0.2 }); }
    bulbMats = [M.mat('#fff2c4', { em: '#ffd98a', ei: 0.2 })];
    // trees: inside + outside
    const rt = mulberry(99); let placed = 0, tries = 0;
    const okSpot = (x, z, r) => colliders.every((c) => U.d2(x, z, c.x, c.z) > c.r + r) && distToPath(x, z) > 2.4 + r;
    while (placed < 26 && tries < 600) { tries++; const a = rt() * 6.28, d = Math.sqrt(rt()) * 0.78; const x = Math.cos(a) * RX * d, z = Math.sin(a) * RZ * d; if (!okSpot(x, z, 1.4)) continue; const t = M.tree(season, rt() < 0.2 ? 'pine' : 'round', rt); t.position.set(x, 0, z); t.scale.setScalar(U.lerp(0.8, 1.2, rt())); st.add(t); colliders.push({ x, z, r: 0.45 }); placed++; }
    placed = 0; tries = 0;
    while (placed < 60 && tries < 900) { tries++; const a = rt() * 6.28, d = U.lerp(1.25, 2.1, rt()); const x = Math.cos(a) * RX * d, z = Math.sin(a) * RZ * d; if (!okSpot(x, z, 1.6)) continue; const t = M.tree(season, rt() < 0.3 ? 'pine' : 'round', rt); t.position.set(x, 0, z); t.scale.setScalar(U.lerp(0.9, 1.5, rt())); st.add(t); colliders.push({ x, z, r: 0.5 }); placed++; }
    for (let i = 0; i < 40; i++) { const t = rt(); const P = curvePt(t), n = outward(t); const side = rt() < 0.5 ? 1 : -1; const pp = P.clone().addScaledVector(n, side * U.lerp(2.2, 3.2, rt())); if (!colliders.every((c) => U.d2(pp.x, pp.z, c.x, c.z) > c.r + 0.6)) continue; const b = M.bush(season === 'autumn' ? U.pick(['#7a9a3a', '#b5862f']) : season === 'winter' ? '#dfe8ee' : U.pick(['#5e9e44', '#6aae4f']), U.lerp(0.7, 1.1, rt())); b.position.copy(pp); st.add(b); }
    // distant hills
    for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; const h = new THREE.Mesh(new THREE.SphereGeometry(U.lerp(18, 30, rt()), 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), M.mat(season === 'winter' ? '#e8f0f6' : season === 'autumn' ? '#c9a45a' : '#8fc46a', { r: 1 })); h.scale.y = U.lerp(0.25, 0.45, rt()); h.position.set(Math.cos(a) * 85, -1, Math.sin(a) * 85); st.add(h); }
    // stone walls for the street cat
    noriSpots = [0.46, 0.555, 0.38].map((t) => { const P = curvePt(t), n = outward(t); const p = P.clone().addScaledVector(n, 1.65); const wall = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.55, 0.45), M.mat('#b5ada0', { r: 0.95 })); wall.position.copy(p).setY(0.275); wall.rotation.y = Math.atan2(n.x, n.z); wall.castShadow = true; wall.receiveShadow = true; st.add(wall); colliders.push({ x: p.x, z: p.z, r: 0.5 }); return p; });
    scene.add(M.bake(st));
    // NPCs
    addNPC('hana', new V3(5.5, 0, -7.2));
    addNPC('ogawa', new V3(-7, 0, -2.2), { sit: true, heading: Math.atan2(pondPos.x + 7, pondPos.z + 2.2) });
    const kids = addNPC('kids', new V3(1.6, 0, -6.8));
    const aki = new G.Person('aki'); aki.pos.set(2.3, 0, -6.6); scene.add(aki.root); kids.extra = aki;
    addNPC('rina', curvePt(0.3), { mode: 'loop', s: 0.3, speed: 2.3 });
    { const P = curvePt(0.035), n = outward(0.035); addNPC('kenji', P.clone().addScaledVector(n, 1.2), { playing: true, heading: Math.atan2(-n.x, -n.z) }); }
    addNPC('pip', curvePt(0.62), { mode: 'loop', s: 0.62, speed: -1.0 });
    addNPC('sora', new V3(-11.8, 0, 3.2), { heading: Math.atan2(pondPos.x + 11.8, pondPos.z - 3.2) });
    addNPC('kato', curvePt(0.85), { mode: 'loop', s: 0.85, speed: 0.55 });
    // Sora's easel
    const es = new THREE.Group(); es.position.set(-11.0, 0, 3.6); es.rotation.y = 1.2; scene.add(es);
    for (const s of [-1, 1]) { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.5, 6), M.mat('#8a5a3a')); l.position.set(s * 0.25, 0.72, 0); l.rotation.z = s * 0.12; es.add(l); }
    const cv = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.55, 0.03), M.mat('#fff7ea')); cv.position.set(0, 1.15, 0.05); cv.rotation.x = -0.1; es.add(cv);
    // Nori the street cat
    nori = new G.Pet({ name: 'Nori', breed: 'cat', coat: 'black', mood: 70, acc: {} }, { npc: true });
    nori.pos.copy(noriSpots[0]); nori.baseY = 0.55; scene.add(nori.root);
    nori.brain = (p) => (function* () { const r = Math.random(); if (r < 0.4) yield* p.act('sit', 3); else if (r < 0.7) yield* p.act('lie', 4); else yield* p.groom(); })();
    nori.bounds = null;
    // ambient particles
    const atex = season === 'spring' ? G.tex.petal : season === 'winter' ? G.tex.snow : season === 'autumn' ? G.tex.leaf : G.tex.sparkle;
    for (let i = 0; i < 70; i++) { const m = new THREE.SpriteMaterial({ map: atex, transparent: true, depthWrite: false, opacity: 0.9 }); if (season === 'autumn') m.color.set(U.pick(['#e8823a', '#d9592f', '#f2b04b', '#c94a2a'])); if (season === 'summer') m.color.set('#fff4a0'); const s = new THREE.Sprite(m); s.scale.setScalar(season === 'winter' ? 0.12 : 0.16); s.userData = { ph: Math.random() * 6, sp: U.rand(0.4, 1) }; scene.add(s); ambient.push(s); }
  }
  function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function distToPath(x, z) { let best = 1e9; for (let i = 0; i < 80; i++) { const p = curvePt(i / 80); best = Math.min(best, U.d2(x, z, p.x, p.z)); } return best; }
  function addNPC(key, pos, o = {}) {
    const look = G.NPCS[key].look || key;
    const person = new G.Person(look, Object.assign({ key }, o)); person.pos.copy(pos); scene.add(person.root);
    const N = { key, person, home: pos.clone(), mode: o.mode || 'idle', s: o.s || 0, speed: o.speed || 0, dogs: [], waved: false };
    [G.NPCS[key].dog, G.NPCS[key].dog2].filter(Boolean).forEach((dg, i) => {
      const p = new G.Pet({ name: dg.name, breed: dg.breed, coat: dg.coat, acc: { collar: ['collar_blue', 'collar_pink', 'collar_gold'][i % 3] }, mood: 85, old: dg.old }, { npc: true });
      p.pos.copy(pos).add(new V3(0.9 + i * 0.5, 0, 0.6)); p.brain = G.npcDogBrain(person, 1.7); p.bounds = bounds; scene.add(p.root); N.dogs.push(p); npcDogs.push(p); p.owner = N;
    });
    npcs.push(N); return N;
  }
  function bounds(p) {
    for (const c of colliders) { const dx = p.pos.x - c.x, dz = p.pos.z - c.z, d = Math.hypot(dx, dz); const r = c.r + 0.15 * p.S; if (d < r && d > 0.0001) { p.pos.x = c.x + dx / d * r; p.pos.z = c.z + dz / d * r; } }
    const d = Math.hypot(p.pos.x / 46, p.pos.z / 40); if (d > 1) { p.pos.x /= d; p.pos.z /= d; }
  }

  /* ---------------- enter / exit ---------------- */
  W.enter = function (opts = {}) {
    pet = G.activePet();
    if (!pet || pet.cat) { setTimeout(() => G.go('home'), 50); return; }
    G.walkSession = (G.walkSession || 0) + 1;
    scene.add(pet.root); pet.stop(); pet.ctl = null; pet.busy = false; pet.baseY = 0; pet.carry = null; pet.lookTarget = null;
    pet.brain = walkIdle; pet.bounds = bounds;
    const startT = { cafe: 0.0, shop: 0.09, field: 0.25, kennel: 0.5 }[opts.from] ?? 0.75;
    const P = curvePt(startT), n = outward(startT);
    pet.pos.copy(P).addScaledVector(n, 0.4); pet.heading = Math.atan2(curve.getTangentAt(startT).x, curve.getTangentAt(startT).z);
    camYaw = pet.heading; lookV.copy(pet.pos);
    walkT = 0; greeted = new Set(); race = null; talkBusy = false; steer = null; promptKey = '';
    spawnPresents();
    applyLighting();
    placeCam(true);
    if (!G.state.tut.walk) { G.state.tut.walk = 1; setTimeout(() => G.ui.hint('Hold on the ground to lead ' + pet.name + '. Tap people to chat!', 5000), 800); }
    else setTimeout(() => G.ui.hint(G.timeWord() === 'night' ? 'A quiet night walk...' : 'Lovely ' + G.season() + ' ' + G.timeWord() + ' for a walk!', 2500), 600);
  };
  W.exit = function () {
    if (!pet) return;
    if (walkT > 20) { pet.d.walks = (pet.d.walks || 0) + 1; G.state.stats.walks++; pet.d.bond = Math.min(100, pet.d.bond + 2); pet.happy(6, false); }
    scene.remove(pet.root); pet.stop();
    if (leashMesh) { scene.remove(leashMesh); leashMesh.geometry.dispose(); leashMesh = null; }
    for (const pr of presents) { if (pr.box) scene.remove(pr.box); }
    presents = []; G.ui.prompts([]); G.ui.hint(null);
  };
  W.dock = () => [
    { label: 'Treat', icon: 'treat', fn: treatSheet },
    { label: 'Map', icon: 'map', fn: mapSheet },
    { label: 'Home', icon: 'home', cls: 'go', fn: () => G.go('home') },
  ];
  function treatSheet() {
    G.ui.sheet({ title: 'Give a treat', render(body) {
      const ks = Object.keys(G.ITEMS).filter((k) => G.ITEMS[k].cat === 'treat' && G.state.inv[k] > 0);
      if (!ks.length) { G.ui.note(body, 'No treats in your pocket. The Pet Shop is just around the corner!'); return; }
      const g = G.ui.grid(body);
      ks.forEach((k) => g.appendChild(G.ui.card({ img: G.M.icons.item(k), name: G.ITEMS[k].name, badge: G.state.inv[k], fn: () => { G.ui.closeSheet(true); giveTreat(k); } })));
    } });
  }
  function giveTreat(k) {
    const it = G.ITEMS[k]; G.state.inv[k]--; const food = G.M.item(k);
    pet.do((function* () {
      yield* pet.face(cam.position.x, cam.position.z); pet.setPose('sit'); pet.m.mouth.add(food); food.scale.setScalar(0.8 / (pet.S * pet.m.headR / 0.165));
      pet.chewT = 1.6; pet.eyeOverride = 'happy'; for (let i = 0; i < 4; i++) { G.audio.play('munch'); yield* pet.wait(0.4); }
      pet.m.mouth.remove(food); pet.eyeOverride = null; pet.d.hunger = U.clamp(pet.d.hunger + it.hunger, 0, 100); pet.d.energy = U.clamp(pet.d.energy + 6, 0, 100); pet.happy(it.mood); pet.excite = 1; pet.voice('happy');
    })());
  }
  function mapSheet() {
    const places = [['Paw & Bean Café', 0.0, 'cup'], ['Maple Pets', 0.09, 'bag'], ['Disc Cup Field', 0.25, 'disc'], ['Maple Kennel', 0.5, 'kennel'], ['Home', 0.75, 'home'], ['Pond', 'pond', 'water'], ['Fountain', 'fountain', 'water'], ['Big oak tree', 'oak', 'paw']];
    G.ui.sheet({ title: 'Maple Hill map', render(body) {
      G.ui.note(body, 'Hop straight to a spot. (Or just walk, there’s lots to sniff on the way!)');
      const l = G.ui.list(body);
      places.forEach(([n, t, ic]) => l.appendChild(G.ui.li({ icon: ic, title: n, fn: () => { G.ui.closeSheet(true); travel(t); } })));
    } });
  }
  function travel(t) {
    const f = $('#fade'); f.classList.add('on');
    setTimeout(() => {
      let p;
      if (t === 'pond') p = pondPos.clone().add(new V3(5.5, 0, 0)); else if (t === 'fountain') p = fountainPos.clone().add(new V3(-2.6, 0, 0)); else if (t === 'oak') p = oakPos.clone().add(new V3(0, 0, 2.5));
      else { const P = curvePt(t), n = outward(t); p = P.clone().addScaledVector(n, 0.5); }
      pet.pos.copy(p); pet.stop(); placeCam(true); f.classList.remove('on');
    }, 380);
  }

  /* ---------------- presents ---------------- */
  function spawnPresents() {
    presents = [];
    for (let i = 0; i < 6; i++) {
      for (let k = 0; k < 20; k++) {
        const t = Math.random(); const P = curvePt(t), n = outward(t); const side = Math.random() < 0.5 ? 1 : -1;
        const p = P.clone().addScaledVector(n, side * U.rand(1.8, 4.5));
        if (colliders.every((c) => U.d2(p.x, p.z, c.x, c.z) > c.r + 0.8)) { presents.push({ pos: p, found: false, sp: Math.random() }); break; }
      }
    }
  }
  function rewardPresent() {
    const r = Math.random();
    G.state.stats.presents++;
    if (r < 0.45) { const n = U.randi(15, 55); G.addCoins(n, 'Found ' + n + ' coins!'); return; }
    if (r < 0.8) { const k = U.pick(['biscuit', 'jerky', 'potato', 'salmon', 'kibble', 'shampoo']); G.addItem(k, 1); G.audio.play('gift'); G.ui.toast('Found ' + G.ITEMS[k].name + '!', 'gold'); return; }
    const pool = Object.keys(G.ITEMS).filter((k) => (G.ITEMS[k].cat === 'acc' && !G.state.acc[k] && G.ITEMS[k].price < 200) || (G.ITEMS[k].cat === 'toy' && !G.state.toys[k] && G.ITEMS[k].price < 150));
    if (pool.length) { const k = U.pick(pool); G.addItem(k, 1); G.audio.play('fanfare'); G.ui.toast('Wow! Found a ' + G.ITEMS[k].name + '!', 'gold'); }
    else G.addCoins(60, 'Found 60 coins!');
  }
  function* digUp(pr) {
    pr.found = true; talkBusy = true; steer = null;
    try { yield* digInner(pr); } finally { talkBusy = false; if (pr.box) { scene.remove(pr.box); pr.box = null; } }
  }
  function* digInner(pr) {
    yield* pet.face(pr.pos.x, pr.pos.z); pet.setPose('sniff'); G.audio.play('sniff'); pet.emote('bang', 0.8); yield* pet.wait(0.7);
    pet.setPose('bow'); pet.digT = 1.4; G.audio.play('dig'); yield* pet.wait(1.4);
    const box = G.M.gift(U.pick(['#e2574c', '#4aa6e0', '#79b25a', '#7a5cff'])); box.position.copy(pr.pos); box.scale.setScalar(0.01); scene.add(box); pr.box = box;
    G.audio.play('pop'); G.fx.spawn('star', pr.pos.clone().setY(0.3), 8);
    let t = 0; while (t < 0.4) { t += pet.dt; box.scale.setScalar(U.smooth(0, 0.4, t) * 1.2); box.position.y = Math.sin(t / 0.4 * Math.PI) * 0.3; yield; }
    pet.setPose('stand'); pet.excite = 1; pet.voice(); yield* pet.wait(0.4);
    rewardPresent(); pet.happy(4);
    yield* pet.wait(0.9);
  }

  /* ---------------- player brain ---------------- */
  function* walkIdle(p) {
    if (steer || keyActive || talkBusy) { yield; return; }
    const r = Math.random();
    if (r < 0.3) yield* p.sniffAround(1);
    else if (r < 0.55) { p.lookCam = 2; yield* p.act('sit', U.rand(1.5, 3)); }
    else if (r < 0.62) yield* p.scratch();
    else if (r < 0.72) { p.tiltT = 1.2; p.tiltDir = U.chance(0.5) ? 1 : -1; p.lookCam = 1.5; yield* p.wait(1.5); }
    else if (r < 0.78 && p.d.energy < 30) { yield* p.act('lie', 2); }
    else yield* p.wait(U.rand(0.8, 2));
  }

  /* ---------------- talking ---------------- */
  function npcMeshes() { const a = []; for (const N of npcs) { N.person.root.traverse((o) => { if (o.isMesh) a.push(o); }); if (N.extra) N.extra.root.traverse((o) => { if (o.isMesh) a.push(o); }); } return a; }
  function npcOf(obj) { const per = obj.userData.person; return npcs.find((N) => N.person === per || N.extra === per); }
  function approach(N) {
    const tp = N.person.pos;
    if (U.d2(pet.pos.x, pet.pos.z, tp.x, tp.z) < 3.4) { talkTo(N); return; }
    pet.do((function* () { yield* pet.goto(tp.x, tp.z, { speed: 2, near: 2.4, timeout: 10, follow: () => N.person.pos }); talkTo(N); })());
  }
  async function talkTo(N) {
    if (talkBusy) return; talkBusy = true; steer = null; G.ui.prompts([]); promptKey = '';
    const per = N.person; N.paused = true; per.target = null; per.lookAt = pet.pos; per.talking = 0;
    pet.stop(); pet.do((function* () { yield* pet.face(per.pos.x, per.pos.z); pet.lookTarget = per.head ? null : null; pet.setPose('sit'); while (talkBusy) { pet.lookTarget = per.m.face.getWorldPosition(new V3()); yield; } pet.lookTarget = null; })());
    W.talking = N;
    const talkAnim = setInterval(() => { if ($('#dialog').classList.contains('hidden')) return; per.talking = 0.3; }, 250);
    const ctx = {
      pet,
      play: (sec) => { const dg = N.dogs[0]; if (!dg) return; const c = dg.pos.clone(); dg.do(dg.zoomies(c.x, c.z, 1.6, 2)); pet.do((function* () { let t = 0; pet.excite = 1; while (t < sec) { t += pet.dt; pet.moveTarget = new V3(dg.pos.x, 0, dg.pos.z); pet.speedMul = 3; yield; } pet.moveTarget = null; pet.happy(8); pet.setPose('sit'); })()); },
      petBy: (n) => { pet.eyeOverride = 'happy'; pet.excite = 1; G.audio.play('aww'); let k = 0; const iv = setInterval(() => { pet.fx('heart', 1); pet.petT = 0; pet.petPart = 'head'; if (++k > 10) { clearInterval(iv); pet.eyeOverride = null; } }, 160); pet.happy(n, false); if (N.extra) N.extra.waveT = 1.5; per.waveT = 1.5; },
      race: () => { N.raceReq = true; },
      paint: () => { G.state.coins -= 150; G.ui.refresh(); paintPortrait(); },
      music: (type, sec) => { let k = 0; const iv = setInterval(() => { G.fx.spawn('note', per.pos.clone().add(new V3(U.rand(-0.4, 0.4), 1.4, U.rand(-0.4, 0.4))), 1); if (++k > sec * 3) clearInterval(iv); }, 330); pet.excite = 1; },
      howl: () => { pet.do((function* () { pet.setPose('howl'); pet.voice('howl'); yield* pet.wait(1.8); pet.setPose('sit'); })()); let k = 0; const iv = setInterval(() => { G.fx.spawn('note', per.pos.clone().add(new V3(0, 1.4, 0)), 1); if (++k > 6) clearInterval(iv); }, 300); },
    };
    try { await G.ui.talk(N.key, ctx); } catch (e) { console.error(e); }
    clearInterval(talkAnim);
    talkBusy = false; N.paused = false; per.talking = 0; W.talking = null;
    if (N.raceReq) { N.raceReq = false; startRace(N); }
  }
  async function talkNori() {
    if (talkBusy) return; talkBusy = true; steer = null; pet.stop(); pet.do((function* () { yield* pet.face(nori.pos.x, nori.pos.z); pet.setPose('sit'); })());
    nori.lookCam = 3; nori.voice();
    await G.ui.talk('nori', { pet });
    talkBusy = false;
  }

  /* ---------------- race ---------------- */
  function startRace(N) {
    race = { N, t: 0, over: false };
    N.mode = 'race'; N.person.speed = 2.35 + Math.min(0.35, (G.state.npc.rina && G.state.npc.rina.f || 0) * 0.03);
    G.ui.banner('Race!', 'First to the big oak wins', 1600); G.audio.play('whistle');
    G.ui.hint('Hold toward the big oak tree in the park!', 4000);
  }
  function updateRace(dt) {
    if (!race || race.over) return;
    race.t += dt; const N = race.N; const per = N.person;
    per.target = oakPos.clone().add(new V3(0.6, 0, 1.4));
    for (const dg of N.dogs) { dg.stop(); dg.moveTarget = per.pos.clone().add(new V3(-0.6, 0, -0.3)); dg.speedMul = 3; }
    const dp = U.d2(pet.pos.x, pet.pos.z, oakPos.x, oakPos.z), dr = U.d2(per.pos.x, per.pos.z, oakPos.x, oakPos.z);
    if (dp < 2.4 || dr < 1.7 || race.t > 60) {
      race.over = true; const win = dp < 2.4 && dr >= 1.7;
      if (win) { G.audio.play('fanfare'); G.ui.banner('You win!', pet.name + ' beat Blizzard!', 2200); pet.happy(10); pet.excite = 1; G.addCoins(80, 'Race prize: +80 coins!'); G.state.npc.rina.f = (G.state.npc.rina.f || 0) + 1; pet.d.disc = Math.min(100, (pet.d.disc || 0) + 1); }
      else { G.audio.play('sad'); G.ui.banner('Rina wins!', 'So close! Try again sometime', 2200); G.addCoins(10, 'Good effort: +10 coins'); }
      for (const dg of N.dogs) dg.moveTarget = null;
      setTimeout(() => { if (N.mode === 'race') N.mode = 'loop'; N.s = nearestT(per.pos); race = null; }, 2500);
    }
  }
  function nearestT(p) { let best = 0, bd = 1e9; for (let i = 0; i < 200; i++) { const q = curvePt(i / 200); const d = U.d2(p.x, p.z, q.x, q.z); if (d < bd) { bd = d; best = i / 200; } } return best; }

  /* ---------------- portrait painting ---------------- */
  function paintPortrait() {
    const r = G.renderer; const W2 = 320, H2 = 400;
    const rt = new THREE.WebGLRenderTarget(W2, H2, { samples: 4 }); rt.texture.encoding = THREE.sRGBEncoding;
    const pc = new THREE.PerspectiveCamera(30, W2 / H2, 0.05, 50);
    const hp = pet.headWorld(); const fwd = new V3(Math.sin(pet.heading), 0, Math.cos(pet.heading));
    pc.position.copy(hp).addScaledVector(fwd, 1.25 * pet.S).add(new V3(0, 0.05, 0)); pc.lookAt(hp.clone().add(new V3(0, -0.12 * pet.S, 0)));
    const em = pet.eyeMode; pet.eyeOverride = 'open'; pet.animate(0.001);
    r.setRenderTarget(rt); r.render(scene, pc); const buf = new Uint8Array(W2 * H2 * 4); r.readRenderTargetPixels(rt, 0, 0, W2, H2, buf); r.setRenderTarget(null); rt.dispose(); pet.eyeOverride = null; void em;
    const src = document.createElement('canvas'); src.width = W2; src.height = H2; const sg = src.getContext('2d'); const img = sg.createImageData(W2, H2);
    for (let y = 0; y < H2; y++) img.data.set(buf.subarray((H2 - 1 - y) * W2 * 4, (H2 - y) * W2 * 4), y * W2 * 4);
    sg.putImageData(img, 0, 0);
    const out = document.createElement('canvas'); out.width = W2; out.height = H2; const g = out.getContext('2d');
    g.fillStyle = '#f6efe2'; g.fillRect(0, 0, W2, H2);
    g.filter = 'blur(3px) saturate(1.25)'; g.drawImage(src, 0, 0); g.filter = 'none';
    const data = sg.getImageData(0, 0, W2, H2).data;
    for (let i = 0; i < 4200; i++) {
      const x = Math.random() * W2, y = Math.random() * H2; const k = (Math.floor(y) * W2 + Math.floor(x)) * 4;
      g.strokeStyle = 'rgba(' + data[k] + ',' + data[k + 1] + ',' + data[k + 2] + ',0.55)'; g.lineWidth = U.rand(2, 6); g.lineCap = 'round';
      const a = U.rand(-0.6, 0.6) + Math.PI / 4; const l = U.rand(4, 12);
      g.beginPath(); g.moveTo(x - Math.cos(a) * l, y - Math.sin(a) * l); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
    }
    g.fillStyle = 'rgba(120,80,40,.6)'; g.font = 'italic 600 16px Fredoka, sans-serif'; g.textAlign = 'right'; g.fillText('Sora', W2 - 14, H2 - 14);
    G.state.portrait = out.toDataURL('image/jpeg', 0.82); G.save();
    G.audio.play('sparkle'); G.ui.toast('A portrait of ' + pet.name + ' now hangs at home!', 'gold');
  }

  /* ---------------- input ---------------- */
  W.onDown = function (p) {
    if (talkBusy) return;
    const hit = G.pick(p, npcMeshes(), false)[0];
    if (hit) { pendingTap = { npc: npcOf(hit.object) }; return; }
    if (nori) { const nh = G.pick(p, nori.m.meshes, false)[0]; if (nh) { pendingTap = { nori: true }; return; } }
    steer = { target: null }; const g = G.groundAt(p); if (g) steer.target = g;
    pet.stop();
  };
  W.onMove = function (p, down) { if (steer && down) { const g = G.groundAt(p); if (g) steer.target = g; } };
  W.onUp = function (p) {
    steer = null; idleT = 0;
    if (pendingTap && p.tap) {
      if (pendingTap.npc) approach(pendingTap.npc);
      else if (pendingTap.nori) { if (U.d2(pet.pos.x, pet.pos.z, nori.pos.x, nori.pos.z) < 5) talkNori(); else G.ui.toast('Walk closer to the cat first.'); }
    }
    pendingTap = null;
    if (!talkBusy) pet.moveTarget = null;
  };
  W.onCancel = function () { steer = null; pendingTap = null; };

  /* ---------------- lighting ---------------- */
  function applyLighting() {
    const dl = G.daylight();
    const sky = new THREE.Color('#1a2448').lerp(new THREE.Color('#9fd4ff'), dl);
    const hor = new THREE.Color('#3a3a6a').lerp(new THREE.Color(dl < 0.75 && dl > 0.1 ? '#ffc08a' : '#e4f4ff'), dl);
    scene.background.copy(hor); scene.fog.color.copy(hor);
    G.M.paint(W.sky.geometry, (c, x, y) => { const t = U.smooth(-10, 90, y); c.copy(hor).lerp(sky, t); });
    L.sun.intensity = 0.2 + 1.05 * dl; L.sun.color.set(dl < 0.8 && dl > 0.05 ? 0xffd2a0 : 0xfff0d8);
    L.hemi.intensity = 0.35 + 0.4 * dl; L.hemi.color.set(dl > 0.3 ? 0xfff4e0 : 0x8fa0d8);
    winMat.emissiveIntensity = (1 - dl) * 0.95;
    bulbMats.forEach((m) => { m.emissiveIntensity = 0.2 + (1 - dl) * 2.2; });
  }

  /* ---------------- update ---------------- */
  let lightT = 0, promptT = 0;
  function placeCam(snap) {
    const portrait = G.aspect() < 0.9; const dist = portrait ? 6.6 : 5.2, h = portrait ? 3.9 : 2.9;
    let tgt = pet.pos.clone();
    if (W.talking) tgt = pet.pos.clone().lerp(W.talking.person.pos, 0.5);
    const pos = tgt.clone().add(new V3(-Math.sin(camYaw) * dist, h, -Math.cos(camYaw) * dist));
    const look = tgt.clone().add(new V3(Math.sin(camYaw) * 1.4, 0.55, Math.cos(camYaw) * 1.4));
    if (snap) { cam.position.copy(pos); lookV.copy(look); }
    else { const k = 1 - Math.exp(-2.2 * G._dt); cam.position.lerp(pos, k); lookV.lerp(look, k); }
    cam.lookAt(lookV);
  }
  W.update = function (dt) {
    if (!pet) return;
    G._dt = dt; walkT += dt;
    // keyboard steering
    const K = G.input.keys || {};
    const kx = (K.KeyD || K.ArrowRight ? 1 : 0) - (K.KeyA || K.ArrowLeft ? 1 : 0), kz = (K.KeyW || K.ArrowUp ? 1 : 0) - (K.KeyS || K.ArrowDown ? 1 : 0);
    keyActive = !talkBusy && (kx || kz);
    let target = null;
    if (!talkBusy && steer && steer.target) target = steer.target;
    if (keyActive) { const f = new V3(Math.sin(camYaw), 0, Math.cos(camYaw)), r = new V3(-Math.cos(camYaw), 0, Math.sin(camYaw)); target = pet.pos.clone().addScaledVector(f, kz * 4).addScaledVector(r, kx * 4); }
    if (target) {
      if (pet.task) pet.stop();
      const d = U.d2(pet.pos.x, pet.pos.z, target.x, target.z);
      pet.setPose('stand'); pet.moveTarget = target.clone();
      const tired = pet.d.energy < 15;
      pet.speedMul = tired ? 0.9 : keyActive ? 2.3 : d > 5 ? 2.8 : d > 2.2 ? 1.9 : 1.0;
      if (tired && Math.random() < dt * 0.1) { G.ui.toast(pet.name + ' is getting tired. Time to head home?'); }
      idleT = 0;
    } else if (!talkBusy && !pet.task) { pet.moveTarget = null; }
    pet.update(dt);
    // camera yaw follows movement gently
    if (pet.vel > 0.6 && !talkBusy) { camYaw += U.angDiff(camYaw, pet.heading) * (1 - Math.exp(-0.9 * dt)); }
    placeCam(false);
    // shadows follow the player
    L.sun.position.set(pet.pos.x - 6, 12, pet.pos.z + 8); L.sun.target.position.copy(pet.pos);
    // leash
    const hand = cam.localToWorld(new V3(0.15, -0.95, -1.6));
    const collar = new V3(); pet.m.slots.collar.getWorldPosition(collar);
    const dist = hand.distanceTo(collar); const mid = hand.clone().lerp(collar, 0.55); mid.y -= Math.max(0.05, 3.8 - dist) * 0.22;
    if (leashMesh) { scene.remove(leashMesh); leashMesh.geometry.dispose(); }
    leashMesh = new THREE.Mesh(new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(hand, mid, collar), 18, 0.014, 5, false), G.M.mat('#e2574c', { r: 0.6 })); scene.add(leashMesh);
    // NPCs
    for (const N of npcs) {
      const per = N.person;
      if (!N.paused) {
        if (N.mode === 'loop') { N.s += N.speed * dt / curveLen; const P = curvePt(N.s); const n = outward(N.s); per.target = P.addScaledVector(n, N.speed > 0 ? 0.7 : -0.7); per.speed = Math.abs(N.speed); }
        const near = U.d2(per.pos.x, per.pos.z, pet.pos.x, pet.pos.z) < 6;
        per.lookAt = near ? pet.pos : null;
        if (near && !N.waved) { N.waved = true; per.waveT = 1.3; if (N.extra) N.extra.waveT = 1.3; }
        if (!near && U.d2(per.pos.x, per.pos.z, pet.pos.x, pet.pos.z) > 12) N.waved = false;
        if (N.key === 'kenji' && Math.random() < dt * 2) G.fx.spawn('note', per.pos.clone().add(new V3(U.rand(-0.3, 0.3), 1.3, U.rand(-0.3, 0.3))), 1);
        if (N.key === 'sora') per.m.arms[1].rotation.x = -1.2 + Math.sin(per.t * 3) * 0.2;
      }
      per.update(dt); if (N.extra) { N.extra.lookAt = per.lookAt; N.extra.update(dt); if (Math.random() < dt * 0.15) N.extra.waveT = 0.8; }
      for (const dg of N.dogs) {
        dg.update(dt);
        if (!greeted.has(dg) && !talkBusy && U.d2(dg.pos.x, dg.pos.z, pet.pos.x, pet.pos.z) < 1.9) {
          greeted.add(dg); dg.stop(); dg.do((function* () { yield* dg.face(pet.pos.x, pet.pos.z); dg.excite = 1; dg.setPose(dg.d.old ? 'sit' : 'bow'); yield* dg.wait(1.6); })());
          pet.emote('heart', 1.2); dg.emote('heart', 1.2); pet.excite = 1; pet.happy(3, false); G.audio.play('sniff');
          if (U.chance(0.4)) dg.voice();
        }
      }
    }
    updateRace(dt);
    // nori
    if (nori) {
      nori.update(dt);
      const fed = (G.state.npc.nori && G.state.npc.nori.fed) || 0; const adopted = G.state.npc.nori && G.state.npc.nori.adopted;
      nori.root.visible = !adopted;
      const dn = U.d2(nori.pos.x, nori.pos.z, pet.pos.x, pet.pos.z);
      if (!adopted && fed < 3 && dn < 2.6 && !talkBusy && !nori.fleeing) {
        nori.fleeing = true; pet.voice(); pet.excite = 1; nori.voice('hiss'); nori.emote('anger', 1);
        noriSpot = (noriSpot + 1) % noriSpots.length; const dest = noriSpots[noriSpot];
        nori.do((function* () { nori.jump(2.4); nori.baseY = 0; yield* nori.wait(0.3); yield* nori.goto(dest.x, dest.z, { speed: 3.4, near: 0.15, timeout: 12 }); nori.jump(3.0); nori.baseY = 0.55; yield* nori.waitUntil(() => !nori.airborne, 2); nori.fleeing = false; yield* nori.act('sit', 2); })());
      }
      if (fed >= 3 && !adopted) nori.lookTarget = pet.headWorld();
    }
    // presents
    for (const pr of presents) {
      if (pr.found) continue;
      pr.sp += dt; if (pr.sp > 0.45) { pr.sp = 0; if (pr.pos.distanceTo(pet.pos) < 28) G.fx.spawn('sparkle', pr.pos.clone().add(new V3(U.rand(-0.2, 0.2), 0.15, U.rand(-0.2, 0.2))), 1); }
      if (!talkBusy && U.d2(pr.pos.x, pr.pos.z, pet.pos.x, pet.pos.z) < 1.3) { pet.stop(); pet.do(digUp(pr)); }
    }
    // ducks
    for (const d of W.ducks) { d.a += d.s * dt; d.m.position.set(pondPos.x + Math.cos(d.a) * d.r, 0.06 + Math.sin(G.time * 2 + d.r) * 0.01, pondPos.z + Math.sin(d.a) * d.r); d.m.rotation.y = -d.a; }
    if (U.d2(pet.pos.x, pet.pos.z, fountainPos.x, fountainPos.z) < 18 && Math.random() < dt * 14) G.fx.spawn('drop', fountainPos.clone().setY(1.75), 1, { vel: new V3(0, 1.2, 0) });
    // ambient particles
    for (const s of ambient) {
      const u = s.userData; u.ph += dt;
      if (season === 'summer') { s.material.opacity = G.daylight() < 0.4 ? 0.5 + Math.sin(u.ph * 3) * 0.5 : 0; s.position.x += Math.sin(u.ph) * dt * 0.3; s.position.y += Math.cos(u.ph * 0.7) * dt * 0.2; }
      else { s.position.y -= dt * u.sp * (season === 'winter' ? 0.8 : 0.6); s.position.x += Math.sin(u.ph * 1.3) * dt * 0.6; s.material.rotation += dt * u.sp; }
      if (s.position.y < 0 || s.position.distanceTo(pet.pos) > 18) s.position.set(pet.pos.x + U.rand(-14, 14), U.rand(2, 9), pet.pos.z + U.rand(-14, 14));
    }
    // prompts (nearest NPC / door)
    promptT -= dt;
    if (promptT < 0 && !talkBusy) {
      promptT = 0.25;
      const list = []; let key = '';
      let best = null, bd = 3.2; for (const N of npcs) { const d = U.d2(N.person.pos.x, N.person.pos.z, pet.pos.x, pet.pos.z); if (d < bd) { bd = d; best = N; } }
      if (best) { list.push({ label: 'Talk to ' + G.NPCS[best.key].name, fn: () => talkTo(best) }); key += best.key; }
      if (nori && nori.root.visible && U.d2(nori.pos.x, nori.pos.z, pet.pos.x, pet.pos.z) < 4.2) { list.push({ label: 'Approach the cat', cls: 'pink', fn: talkNori }); key += 'nori'; }
      for (const d of doors) if (U.d2(d.p.x, d.p.z, pet.pos.x, pet.pos.z) < 2.6) { list.push({ label: d.kind === 'home' ? 'Go home' : 'Enter ' + d.name, cls: 'orange', fn: () => enterDoor(d) }); key += d.kind; }
      if (key !== promptKey) { promptKey = key; G.ui.prompts(list); }
    }
    lightT -= dt; if (lightT < 0) { lightT = 30; applyLighting(); }
  };
  function enterDoor(d) {
    G.audio.play('door');
    if (d.kind === 'home') G.go('home');
    else if (d.kind === 'cafe') G.go('cafe', { from: 'walk' });
    else if (d.kind === 'shop') G.ui.shop();
    else if (d.kind === 'field') G.go('frisbee', { from: 'walk' });
    else if (d.kind === 'kennel') G.go('kennel', { from: 'walk' });
  }
  return W;
})();
