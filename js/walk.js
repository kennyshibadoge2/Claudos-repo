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
    W.waterTex = G.canvasTex(256, 256, (g) => { g.fillStyle = '#5fb4e6'; g.fillRect(0, 0, 256, 256); for (let i = 0; i < 70; i++) { g.strokeStyle = 'rgba(255,255,255,' + U.rand(0.08, 0.3) + ')'; g.lineWidth = U.rand(1, 3); const x = Math.random() * 256, y = Math.random() * 256, l = U.rand(10, 40); g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + l / 2, y - 4, x + l, y); g.stroke(); } g.fillStyle = 'rgba(30,90,140,.18)'; for (let i = 0; i < 30; i++) { g.beginPath(); g.arc(Math.random() * 256, Math.random() * 256, U.rand(6, 20), 0, 7); g.fill(); } }, { repeat: [3, 3] });
    const pond = new THREE.Mesh(new THREE.CircleGeometry(4.2, 48), new THREE.MeshStandardMaterial({ map: W.waterTex, roughness: 0.05, metalness: 0.15 })); pond.rotation.x = -Math.PI / 2; pond.position.set(pondPos.x, 0.04, pondPos.z); scene.add(pond);
    const pondEdge = new THREE.Mesh(new THREE.RingGeometry(4.15, 4.6, 48), M.mat('#c9b48a', { r: 1 })); pondEdge.rotation.x = -Math.PI / 2; pondEdge.position.set(pondPos.x, 0.035, pondPos.z); pondEdge.receiveShadow = true; scene.add(pondEdge);
    for (let i = 0; i < 46; i++) { const a = i / 46 * Math.PI * 2; const s = new THREE.Mesh(new THREE.IcosahedronGeometry(U.rand(0.18, 0.32), 0), M.mat(U.pick(['#9a948a', '#b5ada0', '#857f76']), { r: 0.9, flat: true })); s.position.set(pondPos.x + Math.cos(a) * 4.5, 0.08, pondPos.z + Math.sin(a) * 4.5); s.rotation.set(Math.random() * 3, Math.random() * 3, 0); s.castShadow = true; st.add(s); }
    for (let i = 0; i < 7; i++) { const lp = new THREE.Mesh(new THREE.CircleGeometry(U.rand(0.25, 0.4), 16, 0.3, Math.PI * 1.8), M.mat('#5e9e44', { r: 0.8 })); lp.rotation.x = -Math.PI / 2; const a = Math.random() * 6.28, d = U.rand(1, 3.4); lp.position.set(pondPos.x + Math.cos(a) * d, 0.05, pondPos.z + Math.sin(a) * d); scene.add(lp); }
    W.ducks = [];
    for (let i = 0; i < 2; i++) { const d = M.item('duck'); d.scale.setScalar(2.2); scene.add(d); W.ducks.push({ m: d, a: Math.random() * 6, r: U.rand(1.5, 2.8), s: U.rand(0.15, 0.3) }); }
    colliders.push({ x: pondPos.x, z: pondPos.z, r: 4.7 });
    // clouds
    W.clouds = [];
    for (let i = 0; i < 9; i++) { const c = new THREE.Group(); const cm = new THREE.MeshLambertMaterial({ color: '#ffffff', transparent: true, opacity: 0.92, fog: false }); for (let k = 0; k < 5; k++) { const s2 = new THREE.Mesh(new THREE.SphereGeometry(U.rand(2.5, 4.5), 10, 8), cm); s2.position.set(k * 3 - 6 + U.rand(-1, 1), U.rand(-0.8, 0.8), U.rand(-1.5, 1.5)); s2.scale.y = 0.55; c.add(s2); } const a = Math.random() * 6.28; c.position.set(Math.cos(a) * U.rand(40, 90), U.rand(32, 46), Math.sin(a) * U.rand(40, 90)); scene.add(c); W.clouds.push(c); }
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
      { t: 0.0, kind: 'cafe', name: 'Paw & Bean Caf\u00e9', o: { w: 5.2, d: 4, h: 3, wall: '#f3e2c4', wallKind: 'boards', style: 'gable', roof: '#7a4a24', sign: 'Paw & Bean', signCol: '#7a4a24', awning: '#7a4a24', door: '#7a4a24', porch: false, fence: false, mailbox: false, pots: 2, chimney: true, shutters: '#7a4a24', flowers: true } },
      { t: 0.09, kind: 'shop', name: 'Maple Pets', o: { w: 5, d: 4, h: 3, wall: '#eef7e4', wallKind: 'siding', style: 'hip', roof: '#4a8a3a', sign: 'Maple Pets', signCol: '#3f7a32', awning: '#79b25a', porch: false, fence: false, mailbox: false, pots: 2, flowers: true } },
      { t: 0.25, kind: 'field', name: 'Disc Cup Field' },
      { t: 0.37, kind: 'park', name: 'Maple Dog Park' },
      { t: 0.5, kind: 'kennel', name: 'Maple Kennel', o: { w: 3.6, d: 2.8, h: 2.2, wall: '#fff2dc', wallKind: 'boards', style: 'gable', roof: '#e2574c', sign: 'Maple Kennel', signCol: '#e2574c', windows: [[-1.1, 1.3]], fence: true, mailbox: true, porch: false } },
      { t: 0.75, kind: 'home', name: 'Home', o: { w: 4.8, d: 3.8, h: 2.5, stories: 2, wall: '#fff7ea', wallKind: 'siding', style: 'gable', roof: '#ee8a3c', door: '#c8622a', porch: true, chimney: true, mailbox: true, fence: true, pots: 2, shutters: '#c8622a', flowers: true, number: 7 } },
    ];
    const pal = [['#fde3e3', '#c84a4a'], ['#e3eefd', '#3b5ba8'], ['#fff3d6', '#c8922a'], ['#e9f6e9', '#4a8a5a'], ['#f2e6fa', '#7a5c9a'], ['#fff0e6', '#b35a3a']];
    const styles = ['gable', 'japanese', 'hip', 'saltbox', 'flat', 'gable', 'japanese'], walls = ['siding', 'plaster', 'brick', 'shingle', 'plaster', 'boards', 'plaster'];
    BLD.push({ t: 0.59, kind: 'hotel', name: 'Paw Inn', o: { w: 5.2, d: 3.8, h: 2.6, stories: 2, wall: '#e9f1fb', wallKind: 'siding', style: 'hip', roof: '#3b5ba8', sign: 'Paw Inn', signCol: '#3b5ba8', awning: '#6a8fd8', door: '#3b5ba8', porch: true, flowers: true, pots: 2, shutters: '#3b5ba8', fence: false, mailbox: false } });
    [0.17, -1, 0.46, 0.59, 0.66, 0.84, 0.92].forEach((t, i) => t >= 0 && t !== 0.59 && BLD.push({ t, kind: 'house', o: { w: U.lerp(3.8, 4.8, rnd()), d: 3.4, h: U.lerp(2.3, 2.7, rnd()), stories: i % 3 === 1 ? 2 : 1, style: styles[i], wallKind: walls[i], wall: walls[i] === 'brick' ? '#c8786a' : pal[i % pal.length][0], roof: styles[i] === 'japanese' ? '#3b4a5a' : pal[i % pal.length][1], number: 12 + i * 4, rnd: mulberry(i * 31 + 5), trim: i % 2 ? '#fff7ea' : '#f6efe2' } }));
    // Maple Dog Park entrance: stone pillars, wooden arch with a carved sign, hedges, flowers, map board
    function parkEntrance(P, n, b) {
      const g = new THREE.Group(); g.position.copy(P.clone().addScaledVector(n, 3.2)); g.rotation.y = Math.atan2(-n.x, -n.z); st.add(g);
      const stone = M.mat('#cfc6b8', { r: 0.9 }), stoneD = M.mat('#a99f90', { r: 0.95 }), wood = M.mat('#9a6a40', { r: 0.8 }), woodD = M.mat('#7a5232', { r: 0.85 });
      const add = (geo, mat, x, y, z, ry = 0) => { const m2 = new THREE.Mesh(geo, mat); m2.position.set(x, y, z); m2.rotation.y = ry; m2.castShadow = true; m2.receiveShadow = true; g.add(m2); return m2; };
      for (const sx of [-1, 1]) {
        const x = sx * 2.5;
        add(new THREE.BoxGeometry(0.85, 0.25, 0.85), stoneD, x, 0.12, 0);
        add(new THREE.BoxGeometry(0.66, 2.1, 0.66), stone, x, 1.3, 0);
        for (let k = 0; k < 4; k++) add(new THREE.BoxGeometry(0.68, 0.04, 0.68), stoneD, x, 0.55 + k * 0.5, 0);
        add(new THREE.BoxGeometry(0.84, 0.18, 0.84), stoneD, x, 2.44, 0);
        // lantern on top
        add(new THREE.CylinderGeometry(0.08, 0.12, 0.2, 8), M.mat('#3b3b3b', { r: 0.5, m: 0.4 }), x, 2.62, 0);
        const lan = add(new THREE.BoxGeometry(0.3, 0.38, 0.3), M.mat('#fff3c4', { r: 0.3, em: '#ffd36a', ei: 0.9 }), x, 2.9, 0); lan.castShadow = false;
        add(new THREE.ConeGeometry(0.28, 0.22, 4), M.mat('#3b3b3b', { r: 0.5, m: 0.4 }), x, 3.2, 0, Math.PI / 4);
        // paw plaque
        const plq = G.canvasTex(64, 64, (c) => { c.fillStyle = '#b8ad9c'; c.fillRect(0, 0, 64, 64); c.fillStyle = '#6b5a45'; c.beginPath(); c.ellipse(32, 40, 13, 11, 0, 0, 7); c.fill(); for (const [px, py] of [[16, 24], [26, 16], [38, 16], [48, 24]]) { c.beginPath(); c.ellipse(px, py, 5, 6.5, 0, 0, 7); c.fill(); } });
        const pm = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.4), M.mat('#fff', { map: plq, r: 0.9 })); pm.position.set(x, 1.5, 0.335); g.add(pm);
        // planter + flowers
        add(new THREE.CylinderGeometry(0.42, 0.34, 0.42, 14), M.mat('#b5653a', { r: 0.9 }), x + sx * 0.9, 0.21, 0.5);
        const fl = M.flowers(14, 0.32); fl.position.set(x + sx * 0.9, 0.42, 0.5); g.add(fl);
        // hedges + fence running off to the sides
        for (let k = 0; k < 3; k++) { const bu = M.bush(k % 2 ? '#5e9e44' : '#6aa94e', 1.2); bu.position.set(sx * (3.4 + k * 1.05), 0, -0.25); g.add(bu); }
        const fe = M.fence(4, '#c8a07a'); fe.position.set(sx * 7.4, 0, -0.9); g.add(fe);
        const tr = M.tree(G.season(), 'round'); tr.position.set(sx * U.rand(4.5, 6.5), 0, -3.2); tr.scale.setScalar(1.2); g.add(tr);
      }
      // wooden arch
      const arch = new THREE.Mesh(new THREE.TorusGeometry(2.5, 0.13, 10, 40, Math.PI), wood); arch.position.set(0, 2.45, 0); arch.scale.y = 0.42; arch.castShadow = true; g.add(arch);
      const arch2 = new THREE.Mesh(new THREE.TorusGeometry(2.5, 0.07, 8, 40, Math.PI), woodD); arch2.position.set(0, 2.3, 0); arch2.scale.y = 0.36; g.add(arch2);
      for (let k = -3; k <= 3; k++) { if (k === 0) continue; const xx = k * 0.62; const hh = Math.sqrt(Math.max(0, 1 - (xx / 2.5) ** 2)) * 2.5 * 0.42 - Math.sqrt(Math.max(0, 1 - (xx / 2.5) ** 2)) * 2.5 * 0.36 + 0.12; add(new THREE.BoxGeometry(0.05, hh, 0.05), woodD, xx, 2.3 + Math.sqrt(Math.max(0, 1 - (xx / 2.5) ** 2)) * 2.5 * 0.36 + hh / 2 - 0.06, 0); }
      // carved hanging sign
      const signTex = G.canvasTex(512, 160, (c) => {
        c.fillStyle = '#7ab04f'; c.beginPath(); c.roundRect ? c.roundRect(6, 6, 500, 148, 40) : c.rect(6, 6, 500, 148); c.fill();
        c.lineWidth = 8; c.strokeStyle = '#4e7d33'; c.stroke(); c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 3; c.setLineDash([10, 8]); c.beginPath(); c.roundRect ? c.roundRect(22, 22, 468, 116, 28) : c.rect(22, 22, 468, 116); c.stroke(); c.setLineDash([]);
        c.fillStyle = '#fff'; c.font = '700 58px Fredoka, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('Maple Dog Park', 256, 72);
        c.font = '600 24px Fredoka, sans-serif'; c.fillStyle = '#eaf7da'; c.fillText('• pond • pier • friends •', 256, 118);
        const paw = (x, y, s2) => { c.beginPath(); c.ellipse(x, y + 5 * s2, 9 * s2, 7.5 * s2, 0, 0, 7); c.fill(); for (const [dx, dy] of [[-10, -6], [-4, -12], [4, -12], [10, -6]]) { c.beginPath(); c.ellipse(x + dx * s2, y + dy * s2, 3.4 * s2, 4.4 * s2, 0, 0, 7); c.fill(); } };
        c.fillStyle = '#fff4d6'; paw(52, 70, 1.4); paw(460, 70, 1.4);
      });
      const sign = new THREE.Mesh(new THREE.BoxGeometry(2.9, 0.9, 0.08), [woodD, woodD, woodD, woodD, M.mat('#fff', { map: signTex, r: 0.8 }), M.mat('#fff', { map: signTex, r: 0.8 })]); sign.position.set(0, 2.85, 0.12); sign.castShadow = true; g.add(sign);
      for (const sx of [-1, 1]) add(new THREE.CylinderGeometry(0.015, 0.015, 0.4, 4), M.mat('#555'), sx * 1.1, 3.38, 0.12);
      // bunting under the arch
      for (let i = 0; i < 11; i++) { const fl2 = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.26, 3), M.mat(['#e2574c', '#f2c24b', '#4aa6e0', '#79b25a', '#f39bb0'][i % 5], { side: THREE.DoubleSide })); fl2.rotation.z = Math.PI; const xx = -2.2 + i * 0.44; fl2.position.set(xx, 2.25 - Math.sin((i / 10) * Math.PI) * 0.18 - 0.1, 0.05); g.add(fl2); }
      // paw-print path into the park
      const pawTex = G.canvasTex(64, 64, (c) => { c.fillStyle = 'rgba(122,90,58,.75)'; c.beginPath(); c.ellipse(32, 40, 13, 11, 0, 0, 7); c.fill(); for (const [px, py] of [[16, 24], [26, 16], [38, 16], [48, 24]]) { c.beginPath(); c.ellipse(px, py, 5, 6.5, 0, 0, 7); c.fill(); } });
      const pawM = M.basic('#fff', { map: pawTex, op: 1, dw: false });
      for (let i = 0; i < 9; i++) { const pp = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.34), pawM); pp.rotation.x = -Math.PI / 2; pp.rotation.z = Math.PI + (i % 2 ? 0.15 : -0.15); pp.position.set((i % 2 ? 0.22 : -0.22), 0.02, 1.6 - i * 0.55); g.add(pp); }
      const path2 = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 6), M.mat('#d9c29a', { r: 1 })); path2.rotation.x = -Math.PI / 2; path2.position.set(0, 0.012, -0.8); path2.receiveShadow = true; g.add(path2);
      // map board
      const mapTex = G.canvasTex(256, 192, (c) => {
        c.fillStyle = '#f6ecd2'; c.fillRect(0, 0, 256, 192); c.fillStyle = '#9fd27a'; c.fillRect(10, 34, 236, 148);
        c.fillStyle = '#7cc0e8'; c.beginPath(); c.ellipse(170, 110, 52, 34, 0.2, 0, 7); c.fill(); c.fillStyle = '#b08a5a'; c.fillRect(150, 88, 34, 6);
        c.fillStyle = '#5e9e44'; for (const [x, y] of [[40, 60], [70, 150], [210, 60], [30, 120]]) { c.beginPath(); c.arc(x, y, 12, 0, 7); c.fill(); }
        c.strokeStyle = '#d9c29a'; c.lineWidth = 8; c.beginPath(); c.moveTo(128, 182); c.quadraticCurveTo(110, 110, 80, 80); c.stroke();
        c.fillStyle = '#e2574c'; c.beginPath(); c.arc(128, 172, 6, 0, 7); c.fill(); c.fillStyle = '#3b2a1f'; c.font = '700 22px Fredoka, sans-serif'; c.textAlign = 'center'; c.fillText('PARK MAP', 128, 25); c.font = '600 12px Fredoka, sans-serif'; c.fillText('you are here', 128, 160); c.fillText('POND', 170, 132);
      });
      const bd = new THREE.Group(); bd.position.set(-3.6, 0, 1.0); bd.rotation.y = 0.35; g.add(bd);
      for (const sx of [-1, 1]) { const leg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.3, 0.08), woodD); leg.position.set(sx * 0.55, 0.65, 0); leg.castShadow = true; bd.add(leg); }
      const brd = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.95, 0.06), [wood, wood, wood, wood, M.mat('#fff', { map: mapTex, r: 0.85 }), wood]); brd.position.y = 1.35; brd.castShadow = true; bd.add(brd);
      const rf = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.06, 0.3), woodD); rf.position.set(0, 1.86, 0.04); bd.add(rf);
      // doggy water station
      const ws = new THREE.Group(); ws.position.set(3.5, 0, 1.1); g.add(ws);
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.9, 12), M.mat('#4a7a5a', { r: 0.5, m: 0.3 })); post.position.y = 0.45; post.castShadow = true; ws.add(post);
      const spout = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.025, 6, 12, Math.PI), M.mat('#c0c0c0', { r: 0.3, m: 0.8 })); spout.position.set(0, 0.92, 0.06); ws.add(spout);
      const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.2, 0.1, 18), M.mat('#c0c0c0', { r: 0.3, m: 0.8 })); bowl.position.set(0, 0.05, 0.32); ws.add(bowl);
      const water = new THREE.Mesh(new THREE.CircleGeometry(0.22, 18), M.mat('#8fd0f0', { r: 0.1 })); water.rotation.x = -Math.PI / 2; water.position.set(0, 0.095, 0.32); ws.add(water);
      colliders.push({ x: g.position.x + Math.cos(g.rotation.y) * 2.5, z: g.position.z - Math.sin(g.rotation.y) * 2.5, r: 0.5 }, { x: g.position.x - Math.cos(g.rotation.y) * 2.5, z: g.position.z + Math.sin(g.rotation.y) * 2.5, r: 0.5 });
    }
    for (const b of BLD) {
      const P = curvePt(b.t), n = outward(b.t);
      if (b.kind === 'park') { parkEntrance(P, n, b); doors.push({ kind: b.kind, name: b.name, p: P.clone().addScaledVector(n, 2.0) }); continue; }
      if (b.kind === 'field' || b.kind === 'park') {
        const gate = new THREE.Group(); const gp = P.clone().addScaledVector(n, 3.2); gate.position.copy(gp); gate.rotation.y = Math.atan2(-n.x, -n.z); st.add(gate);
        const pm = M.mat('#ffffff', { r: 0.6 });
        for (const s of [-1, 1]) { const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 3.2, 12), pm); pole.position.set(s * 2.2, 1.6, 0); pole.castShadow = true; gate.add(pole); const ball = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 10), M.mat('#ee8a3c')); ball.position.set(s * 2.2, 3.3, 0); gate.add(ball); }
        const tex = G.textTex(b.name, { font: '700 64px Fredoka, sans-serif', bg: b.kind === 'park' ? '#79b25a' : '#ee8a3c', color: '#fff', pad: 30 });
        const ban = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 4.2 * tex.userData.h / tex.userData.w), M.mat('#fff', { map: tex, side: THREE.DoubleSide })); ban.position.set(0, 2.7, 0.02); gate.add(ban);
        for (let i = 0; i < 9; i++) { const fl = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.32, 3), M.mat(['#e2574c', '#f2c24b', '#4aa6e0', '#79b25a'][i % 4], { side: THREE.DoubleSide })); fl.rotation.z = Math.PI; fl.position.set(-2 + i * 0.5, 3.05 - Math.sin(i / 8 * Math.PI) * 0.25, 0); gate.add(fl); }
        if (b.kind === 'field') { const fieldG = new THREE.Mesh(new THREE.PlaneGeometry(14, 10), M.mat('#9fd27a', { r: 1 })); fieldG.rotation.x = -Math.PI / 2; fieldG.position.copy(P.clone().addScaledVector(n, 9)).setY(0.015); fieldG.rotation.z = Math.atan2(-n.x, -n.z); fieldG.receiveShadow = true; scene.add(fieldG); } else { const fl = M.fence(10, '#c8a07a'); fl.position.copy(P.clone().addScaledVector(n, 3.4)); fl.rotation.y = Math.atan2(-n.x, -n.z); fl.position.addScaledVector(curve.getTangentAt(b.t), 0); st.add(fl); }
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
    buildDetail(st);
    // instanced grass tufts swaying in the wind
    { const blade = new THREE.ConeGeometry(0.035, 0.32, 3, 1); blade.translate(0, 0.16, 0);
      const parts = []; for (let k = 0; k < 4; k++) { const b = blade.clone(); b.rotateZ(U.rand(-0.35, 0.35)); b.rotateY(k * 1.6); b.translate(U.rand(-0.06, 0.06), 0, U.rand(-0.06, 0.06)); parts.push(b.toNonIndexed()); }
      const tuft = new THREE.BufferGeometry(); const arr = []; for (const pp of parts) arr.push(...pp.attributes.position.array); tuft.setAttribute('position', new THREE.Float32BufferAttribute(arr, 3)); tuft.computeVertexNormals();
      const gm = new THREE.MeshLambertMaterial({ color: '#ffffff' }); W.grassU = { value: 0 };
      gm.onBeforeCompile = (sh) => { sh.uniforms.uTime = W.grassU; sh.vertexShader = 'uniform float uTime;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n vec4 wp = instanceMatrix * vec4(0.0,0.0,0.0,1.0); float sway = sin(uTime*1.8 + wp.x*0.35 + wp.z*0.27) * 0.09 * position.y * 3.0; transformed.x += sway; transformed.z += sway*0.5;'); };
      const N = Math.max(1, Math.round((G.mobile ? 2200 : 4200) * G.quality().grass)); const im = new THREE.InstancedMesh(tuft, gm, N); const m4 = new THREE.Matrix4(); const q = new THREE.Quaternion(); const col = new THREE.Color(); let n = 0, tries = 0;
      const base = { spring: '#7cbf5a', summer: '#5e9e44', autumn: '#9aa84a', winter: '#cfd9cf' }[season];
      while (n < N && tries < N * 6) { tries++; const r = Math.sqrt(Math.random()) * 46, a = Math.random() * 6.28; const x = Math.cos(a) * r, z = Math.sin(a) * r * 0.9; if (distToPathFast(x, z) < 1.7) continue; if (!colliders.every((c) => U.d2(x, z, c.x, c.z) > c.r + 0.2)) continue; if (U.d2(x, z, pondPos.x, pondPos.z) < 4.8) continue; const sc = U.rand(0.7, 1.4); m4.compose(new V3(x, 0, z), q.setFromAxisAngle(new V3(0, 1, 0), Math.random() * 6.28), new V3(sc, sc * U.rand(0.8, 1.3), sc)); im.setMatrixAt(n, m4); im.setColorAt(n, col.set(base).offsetHSL(U.rand(-0.03, 0.03), U.rand(-0.1, 0.05), U.rand(-0.08, 0.08))); n++; }
      im.count = n; im.instanceMatrix.needsUpdate = true; scene.add(im); }
    scene.add(M.bake(st));
    // NPCs
    addNPC('hana', new V3(5.5, 0, -7.2), { hours: [[9, 20]] });
    addNPC('ogawa', new V3(-7, 0, -2.2), { hours: [[6, 18]], sit: true, heading: Math.atan2(pondPos.x + 7, pondPos.z + 2.2) });
    const kids = addNPC('kids', new V3(1.6, 0, -6.8), { hours: [0, 6].includes(new Date().getDay()) ? [[10, 19]] : [[14, 19]] });
    const aki = new G.Person('aki'); aki.pos.set(2.3, 0, -6.6); scene.add(aki.root); kids.extra = aki;
    addNPC('rina', curvePt(0.3), { mode: 'loop', s: 0.3, speed: 2.3, hours: [[5, 10], [16, 21]] });
    { const P = curvePt(0.035), n = outward(0.035); addNPC('kenji', P.clone().addScaledVector(n, 1.2), { hours: [[11, 23]], playing: true, heading: Math.atan2(-n.x, -n.z) }); }
    addNPC('pip', curvePt(0.62), { mode: 'loop', s: 0.62, speed: -1.0, hours: [[8, 17]] });
    addNPC('sora', new V3(-11.8, 0, 3.2), { hours: [[6, 11], [15, 20]], heading: Math.atan2(pondPos.x + 11.8, pondPos.z - 3.2) });
    addNPC('kato', curvePt(0.85), { mode: 'loop', s: 0.85, speed: 0.55, hours: [[7, 11], [16, 20]] });
    const lunaN = addNPC('luna', new V3(-3.6, 0, -13.2), { hours: [[19, 24], [0, 5]], heading: 2.6 });
    { const ts = new THREE.Group(); ts.position.set(-2.9, 0, -13.6); scene.add(ts); lunaN.prop = ts; const lm = G.M.mat('#3b2a1f'); for (let i = 0; i < 3; i++) { const a = i / 3 * Math.PI * 2; const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 1.2, 5), lm); leg.position.set(Math.cos(a) * 0.18, 0.55, Math.sin(a) * 0.18); leg.rotation.set(Math.sin(a) * 0.3, 0, -Math.cos(a) * 0.3); ts.add(leg); } const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.9, 14), G.M.mat('#f2f2f2', { m: 0.3, r: 0.4 })); tube.position.set(0, 1.25, 0); tube.rotation.set(-0.9, 0.6, 0); ts.add(tube); const lens = new THREE.Mesh(new THREE.CircleGeometry(0.075, 14), G.M.mat('#7cc8f0', { r: 0.05 })); lens.position.set(0, 0.46, 0); lens.rotation.x = -Math.PI / 2; tube.add(lens); colliders.push({ x: -2.9, z: -13.6, r: 0.4 }); }
    W.sparrows = [];
    for (let i = 0; i < 5; i++) { const b = new THREE.Group(); const body = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), G.M.mat('#8a6a4a')); body.scale.set(1, 0.85, 1.3); b.add(body); const hd = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 6), G.M.mat('#6a4a3a')); hd.position.set(0, 0.05, 0.07); b.add(hd); const bk = new THREE.Mesh(new THREE.ConeGeometry(0.012, 0.03, 5), G.M.mat('#f2c24b')); bk.rotation.x = Math.PI / 2; bk.position.set(0, 0.045, 0.115); b.add(bk); const tl = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.01, 0.06), G.M.mat('#6a4a3a')); tl.position.set(0, 0.02, -0.09); tl.rotation.x = 0.4; b.add(tl); scene.add(b); W.sparrows.push({ m: b, home: new V3(-7 + U.rand(-1.4, 1.4), 0, -1.2 + U.rand(-0.2, 1.2)), ph: Math.random() * 6, fly: 0 }); }
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
  let pathPts = null;
  function distToPathFast(x, z) { if (!pathPts) { pathPts = []; for (let i = 0; i < 200; i++) pathPts.push(curvePt(i / 200)); } let b = 1e9; for (const p of pathPts) { const d = (p.x - x) * (p.x - x) + (p.z - z) * (p.z - z); if (d < b) b = d; } return Math.sqrt(b); }
  function distToPath(x, z) { let best = 1e9; for (let i = 0; i < 80; i++) { const p = curvePt(i / 80); best = Math.min(best, U.d2(x, z, p.x, p.z)); } return best; }
  function addNPC(key, pos, o = {}) {
    const look = G.NPCS[key].look || key;
    const person = new G.Person(look, Object.assign({ key }, o)); person.pos.copy(pos); scene.add(person.root);
    const N = { key, person, home: pos.clone(), mode: o.mode || 'idle', s: o.s || 0, speed: o.speed || 0, dogs: [], waved: false, hours: o.hours || [[0, 24]], present: true };
    [G.NPCS[key].dog, G.NPCS[key].dog2].filter(Boolean).forEach((dg, i) => {
      const p = new G.Pet({ name: dg.name, breed: dg.breed, coat: dg.coat, acc: { collar: ['collar_blue', 'collar_pink', 'collar_gold'][i % 3] }, mood: 85, old: dg.old }, { npc: true });
      p.pos.copy(pos).add(new V3(0.9 + i * 0.5, 0, 0.6)); p.brain = G.npcDogBrain(person, 1.7, i); p.bounds = bounds; scene.add(p.root); N.dogs.push(p); npcDogs.push(p); p.owner = N;
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
    const startT = { cafe: 0.0, shop: 0.09, field: 0.25, kennel: 0.5, park: 0.37, hotel: 0.59 }[opts.from] ?? 0.75;
    const P = curvePt(startT), n = outward(startT);
    pet.pos.copy(P).addScaledVector(n, 0.4); pet.heading = Math.atan2(curve.getTangentAt(startT).x, curve.getTangentAt(startT).z);
    camYaw = pet.heading; lookV.copy(pet.pos);
    walkT = 0; greeted = new Set(); race = null; talkBusy = false; steer = null; promptKey = '';
    refreshPresence(); spawnPresents(); setTimeout(() => { if (G.curName === 'walk' && presents.length) G.ui.toast(presents.length + ' presents are buried around town today. Look for twinkling mounds!'); }, 4000); if (pet && pet.d.breed === 'dachshund') { for (let k = 0; k < 3; k++) addPresent(); setTimeout(() => G.ui.toast(pet.name + '\u2019s nose is twitching... there are extra presents around!'), 2500); } if (G.state.fortune && G.state.fortune.day === G.today() && G.state.fortune.i === 0) for (let k = 0; k < 3; k++) addPresent();
    weatherSetup(); G.audio.loop(G.weather() === 'rain'); howled = false; poopT = U.rand(60, 120);
    if (poop) { scene.remove(poop.m); poop = null; } if (ufo) { scene.remove(ufo.m); ufo = null; }
    ufoT = G.daylight() < 0.3 && Math.random() < 0.35 ? U.rand(25, 80) : -1;
    applyLighting();
    placeCam(true);
    if (!G.state.tut.walk) { G.state.tut.walk = 1; setTimeout(() => G.ui.hint('Hold on the ground to lead ' + pet.name + '. Tap people to chat!', 5000), 800); }
    else setTimeout(() => G.ui.hint(G.timeWord() === 'night' ? 'A quiet night walk...' : 'Lovely ' + G.season() + ' ' + G.timeWord() + ' for a walk!', 2500), 600);
  };
  W.onVoice = function (kind, id, p) { if (talkBusy) return true; if (kind === 'name') { p.stop(); p.emote('heart', 1); p.voice(); p.do((function* () { yield* p.face(cam.position.x, cam.position.z); p.lookCam = 3; yield* p.act('sit', 2); })()); } else p.do((function* () { p.lookCam = 3; yield* p.trick(id); p.happy(2); })()); return true; };
  W.debugProps = () => props;
  W.debugDoors = () => doors;
  function refreshPresence() {
    const h = new Date().getHours() + (G.hourOffset || 0);
    for (const N of npcs) {
      const hh = ((h % 24) + 24) % 24; const on = N.hours.some(([a, b]) => hh >= a && hh < b);
      N.present = on; N.person.root.visible = on; if (N.extra) N.extra.root.visible = on; if (N.prop) N.prop.visible = on;
      for (const d of N.dogs) d.root.visible = on;
    }
  }
  W.exit = function () {
    G.audio.loop(false); G.audio.busk(null, 0);
    if (!pet) return;
    if (walkT > 20) { pet.d.walks = (pet.d.walks || 0) + 1; G.state.stats.walks++; pet.d.bond = Math.min(100, pet.d.bond + (pet.d.breed === 'golden' ? 3 : 2)); pet.happy(6, false); }
    scene.remove(pet.root); pet.stop();
    if (leashMesh) { scene.remove(leashMesh); leashMesh.geometry.dispose(); leashMesh = null; }
    for (const pr of presents) { if (pr.box) scene.remove(pr.box); if (pr.g) scene.remove(pr.g); }
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
    const places = [['Paw & Bean Café', 0.0, 'cup'], ['Maple Pets', 0.09, 'bag'], ['Disc Cup Field', 0.25, 'disc'], ['Maple Dog Park', 0.37, 'paw'], ['Maple Kennel', 0.5, 'kennel'], ['Home', 0.75, 'home'], ['Pond', 'pond', 'water'], ['Fountain', 'fountain', 'water'], ['Big oak tree', 'oak', 'paw']];
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
  // presents: little dirt mounds with a twinkling glint, near the path; your pet sniffs them out
  let moundMat = null;
  function makePresent(p) {
    if (!moundMat) moundMat = G.M.mat('#7a5232', { r: 1 });
    const g = new THREE.Group(); g.position.copy(p); scene.add(g);
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.28, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), moundMat); m.scale.set(1, 0.35, 0.85); m.receiveShadow = true; g.add(m);
    for (let i = 0; i < 4; i++) { const c = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 4), moundMat); c.position.set(U.rand(-0.3, 0.3), 0.02, U.rand(-0.3, 0.3)); g.add(c); }
    const glint = new THREE.Sprite(new THREE.SpriteMaterial({ map: G.tex.sparkle, color: '#fff3a0', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); glint.position.y = 0.32; glint.scale.setScalar(0.5); g.add(glint);
    presents.push({ pos: p, found: false, sp: Math.random(), g, glint, ph: Math.random() * 6 });
  }
  function presentSpot() {
    for (let k = 0; k < 30; k++) {
      const t = Math.random(); const P = curvePt(t), n = outward(t); const side = Math.random() < 0.5 ? 1 : -1;
      const p = P.clone().addScaledVector(n, side * U.rand(1.0, 2.6));
      if (colliders.every((c) => U.d2(p.x, p.z, c.x, c.z) > c.r + 0.8) && presents.every((q) => q.found || U.d2(p.x, p.z, q.pos.x, q.pos.z) > 6)) return p;
    }
    return null;
  }
  function spawnPresents() {
    for (const pr of presents) if (pr.g) scene.remove(pr.g);
    presents = [];
    for (let i = 0; i < 6; i++) { const p = presentSpot(); if (p) makePresent(p); }
  }
  function addPresent() { const p = presentSpot(); if (p) makePresent(p); }
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
    if (pr.g) { scene.remove(pr.g); pr.g = null; }
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
    if (!howled && G.fullMoon() && G.daylight() < 0.3 && U.chance(0.25)) { howled = true; p.lookTarget = moonMesh.position; p.setPose('howl'); p.voice('howl'); G.ui.toast(p.name + ' howls at the full moon!'); G.stamp('moon'); yield* p.wait(2); p.lookTarget = null; p.setPose('sit'); return; }
    const r = Math.random();
    if (r < 0.3) yield* p.sniffAround(1);
    else if (r < 0.55) { p.lookCam = 2; yield* p.act('sit', U.rand(1.5, 3)); }
    else if (r < 0.62) yield* p.scratch();
    else if (r < 0.72) { p.tiltT = 1.2; p.tiltDir = U.chance(0.5) ? 1 : -1; p.lookCam = 1.5; yield* p.wait(1.5); }
    else if (r < 0.78 && p.d.energy < 30) { yield* p.act('lie', 2); }
    else yield* p.wait(U.rand(0.8, 2));
  }

  /* ---------------- talking ---------------- */
  function npcMeshes() { const a = []; for (const N of npcs) { if (!N.present) continue; N.person.root.traverse((o) => { if (o.isMesh) a.push(o); }); if (N.extra) N.extra.root.traverse((o) => { if (o.isMesh) a.push(o); }); } return a; }
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
      music: (type, sec) => { if (G.BUSK_NAMES[type]) W.kenjiSong = type; let k = 0; const iv = setInterval(() => { G.fx.spawn('note', per.pos.clone().add(new V3(U.rand(-0.4, 0.4), 1.4, U.rand(-0.4, 0.4))), 1); if (++k > sec * 3) clearInterval(iv); }, 330); pet.excite = 1; },
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
      if (win) { G.audio.play('fanfare'); G.ui.banner('You win!', pet.name + ' beat Blizzard!', 2200); pet.happy(10); pet.excite = 1; G.addCoins(80, 'Race prize: +80 coins!'); G.stamp('race'); G.state.npc.rina.f = (G.state.npc.rina.f || 0) + 1; pet.d.disc = Math.min(100, (pet.d.disc || 0) + 1); }
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

  /* =========================================================
     Town detail: billboards, machines, shrine, bones, weather, secrets
     ========================================================= */
  let props = [], bones = [], poop = null, poopT = 60, puddles = [], rain = null, ufo = null, ufoT = -1, moonMesh = null, umbrellas = [], howled = false;
  const BONE_SPOTS = () => [[0.9, -9.9], [-13, -11.2], [noriSpots[0].x * 0.93, noriSpots[0].z * 0.93 + 0.8], [-12.9, 7.6], [10.2, -4.8], [-2.6, 10.6], [14.5, 1.2], [5.2, 9.4]];
  function adTex(lines, bg, fg, accent) {
    return G.canvasTex(512, 256, (g) => {
      g.fillStyle = bg; g.fillRect(0, 0, 512, 256); g.strokeStyle = accent; g.lineWidth = 14; g.strokeRect(7, 7, 498, 242);
      g.textAlign = 'center'; g.fillStyle = fg; g.font = '700 58px Fredoka, sans-serif'; g.fillText(lines[0], 256, 100);
      g.font = '600 30px Fredoka, sans-serif'; g.fillStyle = accent; g.fillText(lines[1], 256, 160);
      if (lines[2]) { g.font = 'italic 500 20px Fredoka, sans-serif'; g.fillStyle = fg; g.fillText(lines[2], 256, 212); }
    });
  }
  function buildDetail(st) {
    const M = G.M;
    // billboards
    const ads = [
      [['PAW & BEAN', 'Now with 20% more honey*', '*the bees were consulted'], '#7a4a24', '#fff7ea', '#f2c24b'],
      [['FROG HATS', 'Ribbit. Only at Maple Pets.', 'Not suitable for actual frogs'], '#79b25a', '#ffffff', '#fff3a0'],
      [['VOTE KURI', 'for Mayor of Maple Hill', '"Woof." — Kuri, 14'], '#3b5ba8', '#ffffff', '#f2c24b'],
      [['CAN YOUR DOG FLY?', 'Disc Cup Field → north side', 'Flying catches score x1.5'], '#1d2a24', '#f2c24b', '#ee8a3c'],
    ];
    [0.2, 0.43, 0.63, 0.86].forEach((t, i) => {
      const P = curvePt(t), n = outward(t); const b = new THREE.Group(); b.position.copy(P).addScaledVector(n, 6.5); b.rotation.y = Math.atan2(-n.x, -n.z); st.add(b);
      for (const s of [-1, 1]) { const post = new THREE.Mesh(new THREE.BoxGeometry(0.16, 3.6, 0.16), M.mat('#7a5236')); post.position.set(s * 1.5, 1.8, -0.1); post.castShadow = true; b.add(post); }
      const back = new THREE.Mesh(new THREE.BoxGeometry(3.6, 1.9, 0.1), M.mat('#3b2a1f')); back.position.set(0, 2.7, -0.08); back.castShadow = true; b.add(back);
      const face = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 1.7), M.mat('#fff', { map: adTex(...ads[i]), r: 0.8 })); face.position.set(0, 2.7, -0.02); face.userData.noBake = true; b.add(face);
      colliders.push({ x: b.position.x, z: b.position.z, r: 1.6 });
    });
    // lamp-post flyers
    const flyers = [['LOST: ONE SOCK', 'Last seen near a corgi.\nReward: another sock.'], ['KENJI LIVE!', 'Every evening\nby the café. Dogs free.'], ['SHRINE FORTUNES', 'Great blessings\nreported this week!'], ['FOUND: NOTHING', 'If lost, please\nkeep looking.']];
    flyers.forEach((f, i) => { const t = i / 14 * 3 + 0.03 + 1 / 14; const P = curvePt(t), n = outward(t); const tex = G.canvasTex(128, 170, (g) => { g.fillStyle = '#fffdf0'; g.fillRect(0, 0, 128, 170); g.fillStyle = '#e2574c'; g.font = '700 15px Fredoka, sans-serif'; g.textAlign = 'center'; g.fillText(f[0], 64, 30); g.fillStyle = '#3b2a1f'; g.font = '500 13px Fredoka, sans-serif'; f[1].split('\n').forEach((l, k) => g.fillText(l, 64, 70 + k * 18)); g.fillStyle = '#c9b8a3'; for (let k = 0; k < 6; k++) g.fillRect(8 + k * 20, 140, 12, 26); }); const fl = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.53), M.mat('#fff', { map: tex, side: THREE.DoubleSide })); fl.position.copy(P).addScaledVector(n, 1.78).setY(1.5); fl.rotation.y = Math.atan2(-n.x, -n.z); fl.userData.noBake = true; st.add(fl); });
    // vending machine
    { const t = 0.966, P = curvePt(t), n = outward(t); const v = new THREE.Group(); v.position.copy(P).addScaledVector(n, 2.0); v.rotation.y = Math.atan2(-n.x, -n.z); scene.add(v);
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.95, 1.85, 0.7), M.mat('#e2574c', { r: 0.4 })); body.position.y = 0.925; body.castShadow = true; v.add(body);
      const front = new THREE.Mesh(new THREE.PlaneGeometry(0.75, 1.0), new THREE.MeshBasicMaterial({ map: G.canvasTex(150, 200, (g) => { g.fillStyle = '#eaf6ff'; g.fillRect(0, 0, 150, 200); const cols = ['#9fe08a', '#f2c24b', '#4aa6e0', '#f39bb0', '#ffffff', '#ee8a3c']; for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) { g.fillStyle = cols[(r * 4 + c) % cols.length]; g.fillRect(12 + c * 34, 14 + r * 62, 22, 44); g.fillStyle = '#3b2a1f'; g.fillRect(12 + c * 34, 62 + r * 62, 22, 8); } }) })); front.position.set(0, 1.25, 0.351); v.add(front);
      const slot = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.16, 0.05), M.mat('#2a2622')); slot.position.set(0, 0.35, 0.36); v.add(slot);
      colliders.push({ x: v.position.x, z: v.position.z, r: 0.65 }); props.push({ kind: 'vending', obj: v, label: 'Vending machine', fn: vendSheet }); }
    // capsule machine
    { const t = 0.118, P = curvePt(t), n = outward(t); const c = new THREE.Group(); c.position.copy(P).addScaledVector(n, 2.0); c.rotation.y = Math.atan2(-n.x, -n.z); scene.add(c);
      const base = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.85, 0.55), M.mat('#4aa6e0', { r: 0.4 })); base.position.y = 0.425; base.castShadow = true; c.add(base);
      const dome = new THREE.Mesh(new THREE.SphereGeometry(0.32, 24, 16), M.mat('#dff3ff', { r: 0.05, op: 0.35 })); dome.position.y = 1.15; c.add(dome);
      for (let i = 0; i < 16; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), M.mat(U.pick(['#e2574c', '#f2c24b', '#79b25a', '#f39bb0', '#7a5cff']))); const a = Math.random() * 6.28, r = Math.random() * 0.2; b.position.set(Math.cos(a) * r, 0.95 + Math.random() * 0.2, Math.sin(a) * r); c.add(b); }
      const crank = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.05, 16), M.mat('#c9d2dc', { m: 0.8, r: 0.3 })); crank.rotation.x = Math.PI / 2; crank.position.set(0, 0.6, 0.29); c.add(crank); W.crank = crank;
      const sign = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.14), M.mat('#fff', { map: G.textTex('CAPSULE TOYS 30c', { font: '700 40px Fredoka, sans-serif', bg: '#f2c24b', color: '#3b2a1f', pad: 10, radius: 8 }) })); sign.position.set(0, 0.78, 0.28); c.add(sign);
      colliders.push({ x: c.position.x, z: c.position.z, r: 0.5 }); props.push({ kind: 'capsule', obj: c, label: 'Capsule machine', fn: capsuleSheet }); W.capsuleMachine = c; }
    // shrine
    { const sp = new V3(-13, 0, -9.2); const sh = new THREE.Group(); sh.position.copy(sp); sh.rotation.y = Math.atan2(-sp.x, -sp.z); scene.add(sh);
      const red = M.mat('#d9412b', { r: 0.5 });
      const torii = new THREE.Group(); torii.position.z = 2.6; sh.add(torii);
      for (const s of [-1, 1]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, 2.6, 12), red); p.position.set(s * 1.0, 1.3, 0); p.castShadow = true; torii.add(p); }
      const k1 = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.16, 0.24), M.mat('#2a2622')); k1.position.y = 2.7; torii.add(k1);
      const k2 = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.12, 0.16), red); k2.position.y = 2.3; torii.add(k2);
      const hut = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.2, 1.2), M.mat('#c48a52', { r: 0.7 })); hut.position.y = 0.9; hut.castShadow = true; sh.add(hut);
      const rg = new THREE.CylinderGeometry(0.01, 1.3, 2.0, 4, 1); rg.rotateY(Math.PI / 4); rg.rotateZ(Math.PI / 2); rg.scale(1, 0.55, 1.15);
      const roof = new THREE.Mesh(rg, M.mat('#3b4a5a', { r: 0.6 })); roof.position.y = 1.85; roof.castShadow = true; sh.add(roof);
      const box = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.45, 0.4), M.mat('#7a4a24')); box.position.set(0, 0.23, 0.85); sh.add(box);
      const bell = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 10), M.mat('#f2c24b', { m: 0.8, r: 0.3 })); bell.position.set(0, 1.35, 0.68); sh.add(bell);
      const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.9, 6), M.mat('#e8d2a8')); rope.position.set(0, 0.85, 0.7); sh.add(rope);
      for (const s of [-1, 1]) { const ped = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.5, 0.4), M.mat('#b5ada0')); ped.position.set(s * 1.3, 0.25, 1.6); sh.add(ped); const g2 = G.M.pet({ breed: 'shiba', coat: 'cream' }); g2.rig.scale.multiplyScalar(0.9); g2.root.position.set(s * 1.3, 0.5, 1.6); g2.root.rotation.y = -s * 0.4; g2.root.traverse((o) => { if (o.isMesh) o.material = M.mat('#d8d0c4', { r: 0.9 }); }); sh.add(g2.root); }
      colliders.push({ x: sp.x, z: sp.z, r: 1.3 });
      props.push({ kind: 'shrine', obj: sh, label: 'Shrine', fn: shrineSheet, at: sp.clone().add(new V3(-sp.x, 0, -sp.z).normalize().multiplyScalar(2.4)) }); }
    props.push({ kind: 'fountain', obj: null, at: fountainPos.clone().add(new V3(-2.3, 0, 0.6)), label: 'Fountain', fn: fountainSheet });
    // golden bones
    const st0 = G.state.bones = G.state.bones || {};
    BONE_SPOTS().forEach(([x, z], i) => { if (st0[i]) return; const b = new THREE.Group(); b.position.set(x, 0.06, z); const gm = M.mat('#f2c24b', { r: 0.2, m: 0.9, em: '#a07010', ei: 0.3 }); const c = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.14, 8), gm); c.rotation.z = Math.PI / 2; b.add(c); for (const s of [-1, 1]) for (const t2 of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.026, 8, 6), gm); e.position.set(s * 0.075, 0, t2 * 0.02); b.add(e); } b.rotation.y = Math.random() * 3; scene.add(b); bones.push({ i, m: b, sp: Math.random() * 3 }); });
    // moon
    moonMesh = new THREE.Mesh(new THREE.CircleGeometry(4, 32), new THREE.MeshBasicMaterial({ color: '#fff6d6', fog: false, transparent: true })); scene.add(moonMesh);
  }
  function weatherSetup() {
    const w = G.weather();
    if (rain) { scene.remove(rain); rain = null; }
    for (const p of puddles) scene.remove(p); puddles = [];
    for (const u of umbrellas) u.parent && u.parent.remove(u); umbrellas = [];
    if (w === 'rain') {
      const n = 900, pos = new Float32Array(n * 6);
      for (let i = 0; i < n; i++) { const x = U.rand(-15, 15), y = U.rand(0, 14), z = U.rand(-15, 15); pos.set([x, y, z, x + 0.05, y - 0.45, z], i * 6); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      rain = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: '#cfe4ff', transparent: true, opacity: 0.55 })); rain.frustumCulled = false; scene.add(rain);
      for (let i = 0; i < 18; i++) { const t = Math.random(); const P = curvePt(t), n2 = outward(t); const pd = new THREE.Mesh(new THREE.CircleGeometry(U.rand(0.35, 0.7), 20), G.M.mat('#7f9fbf', { r: 0.05, op: 0.6 })); pd.rotation.x = -Math.PI / 2; pd.scale.y = U.rand(0.6, 1); pd.position.copy(P).addScaledVector(n2, U.rand(-0.9, 0.9)).setY(0.035); scene.add(pd); puddles.push(pd); }
      for (const N of npcs) { if (N.person.sitting) continue; const u = new THREE.Group(); const top = new THREE.Mesh(new THREE.ConeGeometry(0.75, 0.32, 10, 1, true), G.M.mat(U.pick(['#e2574c', '#4aa6e0', '#f2c24b', '#79b25a', '#f39bb0']), { side: THREE.DoubleSide })); top.position.y = 1.62; u.add(top); const st = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.85, 6), G.M.mat('#3b2a1f')); st.position.set(0, 1.22, 0); u.add(st); u.position.set(0.12, 0, 0.08); N.person.m.rig.add(u); umbrellas.push(u); }
    }
  }
  function vendSheet() {
    G.ui.sheet({ title: 'Vending machine', render(body) {
      G.ui.note(body, 'A cheerful machine humming a little tune. One of the buttons is labeled "MYSTERY".');
      const l = G.ui.list(body);
      const buy = (name, cost, fn) => () => { if (G.state.coins < cost) { G.ui.toast('Not enough coins.'); return; } G.state.coins -= cost; G.audio.play('clunk'); fn(); if (Math.random() < 0.12) setTimeout(() => { G.audio.play('clunk'); G.ui.toast('Lucky! A second one dropped out!', 'gold'); fn(true); }, 600); G.ui.refresh(); G.ui.closeSheet(true); };
      l.appendChild(G.ui.li({ icon: 'cup', title: 'Melon Soda', sub: 'Fizzy and very green. For you.', right: '10c', fn: buy('soda', 10, () => G.ui.toast(U.pick(['Ahh, refreshing!', 'Fizzy! ' + pet.name + ' sneezes at the bubbles.', 'You feel 5% more energetic.']))) }));
      l.appendChild(G.ui.li({ icon: 'water', title: 'Pup Water', sub: 'Cool spring water in a dog-friendly bottle.', right: '12c', fn: buy('water', 12, () => { pet.d.thirst = Math.min(100, pet.d.thirst + 45); pet.happy(3); pet.lickT = 1.2; G.ui.toast(pet.name + ' laps it up happily!'); }) }));
      l.appendChild(G.ui.li({ icon: 'q', title: 'MYSTERY', sub: 'Nobody knows. Not even the machine.', right: '20c', fn: buy('myst', 20, () => { const r = Math.random(); if (r < 0.3) { G.addItem('biscuit', 2); G.ui.toast('Out came... 2 Bone Biscuits?!'); } else if (r < 0.55) { G.addCoins(30, 'Out came... 30 coins! The machine owed you.'); } else if (r < 0.75) G.ui.toast('Out came... a single sock. Biscuit would be proud.'); else if (r < 0.9) { G.addItem('salmon', 1); G.ui.toast('Out came... Salmon Bites!'); } else G.ui.toast('Out came... a tiny note: "thank you for your business".'); }) }));
    } });
  }
  function capsuleSheet() {
    G.ui.sheet({ title: 'Capsule toys', render(body) {
      const caps = G.state.capsules || {}; G.ui.note(body, 'Turn the crank for a random mini figure! ' + Object.keys(caps).length + ' of ' + G.CAPSULES.length + ' collected. Rare ones shine...');
      const b = document.createElement('button'); b.className = 'btn orange'; b.textContent = 'Spin! (30 coins)'; b.disabled = G.state.coins < 30;
      b.onclick = () => { const c = G.spinCapsule(); if (!c) return; G.ui.closeSheet(true); openCapsule(c); };
      body.appendChild(b);
      const g = G.ui.grid(body); g.style.marginTop = '12px';
      G.CAPSULES.forEach((c) => g.appendChild(G.ui.card({ img: caps[c.id] ? G.M.icons.raw(G.M.capsuleFig(c.id), 'cap:' + c.id) : 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="32" cy="36" r="20" fill="#e8dcc8"/></svg>'), name: caps[c.id] ? c.name : '???', dim: !caps[c.id] })));
    } });
  }
  function openCapsule(c) {
    const m = W.capsuleMachine; const p = m.localToWorld(new V3(0, 0.35, 0.5));
    const cap = new THREE.Group(); const top = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), G.M.mat(U.pick(['#e2574c', '#f39bb0', '#7a5cff', '#79b25a']))); const bot = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), G.M.mat('#ffffff', { op: 0.6 })); cap.add(top, bot); cap.position.copy(p); scene.add(cap);
    let t = 0; const step = () => {
      t += 0.016; if (W.crank) W.crank.rotation.z += 0.25;
      if (t < 0.6) cap.position.y = p.y + Math.sin(t / 0.6 * Math.PI) * 0.5;
      else if (t < 1.0) { top.position.y = (t - 0.6) * 1.2; top.rotation.z = (t - 0.6) * 4; }
      else { scene.remove(cap); const f = G.M.capsuleFig(c.id); f.position.copy(p).setY(0.05); f.scale.setScalar(2); scene.add(f); G.fx.spawn(c.rare ? 'star' : 'sparkle', p.clone().setY(0.4), c.rare ? 14 : 6); G.audio.play(c.rare ? 'fanfare' : 'sparkle'); G.ui.banner(c.rare ? 'RARE!' : 'You got', c.name + '!', 2000); G.checkStamps(); setTimeout(() => scene.remove(f), 3500); return; }
      requestAnimationFrame(step);
    }; requestAnimationFrame(step);
  }
  function shrineSheet() {
    G.audio.play('shrine');
    G.ui.sheet({ title: 'Maple Hill Shrine', render(body) {
      G.ui.note(body, 'A quiet little shrine guarded by two stone shibas. Leaves rustle. The bell rope sways.');
      const f = G.state.fortune; const today = f && f.day === G.today();
      const l = G.ui.list(body);
      l.appendChild(G.ui.li({ icon: 'menu', title: today ? 'Today’s fortune: ' + G.FORTUNES[f.i].t : 'Draw a fortune', sub: today ? G.FORTUNES[f.i].d : 'One fortune slip per day (5 coins).', right: today ? '' : '5c', fn: today ? null : () => {
        if (G.state.coins < 5) { G.ui.toast('Not enough coins.'); return; } G.state.coins -= 5;
        const r = Math.random(); const i = r < 0.12 ? 0 : r < 0.35 ? 1 : r < 0.55 ? 2 : r < 0.75 ? 3 : r < 0.92 ? 4 : 5;
        G.state.fortune = { day: G.today(), i }; G.audio.play(i === 0 ? 'fanfare' : 'shrine');
        if (i === 0) { G.stamp('fortune'); for (let k = 0; k < 3; k++) addPresent(); G.ui.toast('Great blessing! Extra presents appear around town!', 'gold'); }
        G.ui.refresh(); G.ui.resheet(); } }));
      l.appendChild(G.ui.li({ icon: 'paw', title: 'Ring the bell and pray', sub: 'Toss a coin, ring twice, bow twice, clap twice...', right: '1c', fn: () => { if (G.state.coins < 1) return; G.state.coins -= 1; G.audio.play('coins'); setTimeout(() => G.audio.play('shrine'), 300); { const hr = new Date().getHours(); if ((hr >= 20 || hr < 5) && !G.robo.has('gear')) { G.ui.closeSheet(true); setTimeout(() => { G.ui.toast('The bell rings out in the dark... something glints under the offering box!', 'gold'); pet.do((function* () { pet.setPose('crouch'); pet.digT = 1.2; yield* pet.wait(1.2); G.fx.spawn('star', pet.pos.clone().setY(0.4), 10); G.robo.give('gear'); })()); }, 900); } } pet.do((function* () { yield* pet.act('bow', 1.2); pet.emote('sparkle'); })()); G.ui.toast(U.pick(['You pray for many happy walks.', pet.name + ' bows too. Very polite.', 'A warm breeze. Somehow you feel lucky.', 'You wish for ' + pet.name + ' to stay healthy forever.'])); G.ui.closeSheet(true); } }));
    } });
  }
  function fountainSheet() {
    G.ui.sheet({ title: 'Wishing fountain', render(body) {
      G.ui.note(body, 'The bottom glitters with coins. A little sign reads: "All wishes go to the dog park fund."');
      const l = G.ui.list(body);
      l.appendChild(G.ui.li({ icon: 'coin', title: 'Toss a coin and make a wish', sub: 'Who knows what might happen?', right: '5c', fn: () => {
        if (G.state.coins < 5) { G.ui.toast('Not enough coins.'); return; } G.state.coins -= 5; G.audio.play('coins'); G.ui.closeSheet(true);
        { const rb = G.robo.st(); if (rb.wishDay !== G.today()) { rb.wishDay = G.today(); rb.wishes = 0; } rb.wishes++; if (rb.wishes >= 3 && !G.robo.has('bolt')) { setTimeout(() => { G.audio.play('splash'); G.ui.toast('Your third wish makes the water swirl... a silver bolt bobs up!', 'gold'); G.fx.spawn('star', fountainPos.clone().setY(1), 10); G.robo.give('bolt'); }, 1400); } }
        setTimeout(() => { G.audio.play('splash'); G.fx.spawn('drop', fountainPos.clone().setY(0.6), 10);
          if (Math.random() < 0.07) { G.stamp('fountain'); G.audio.play('fanfare'); G.ui.banner('Wish granted!', 'Coins rain down!', 2200); G.addCoins(120, 'The fountain sparkles: +120 coins!'); for (let k = 0; k < 4; k++) setTimeout(() => G.fx.spawn('star', pet.pos.clone().setY(2), 8), k * 200); }
          else G.ui.toast(U.pick(['You wish for endless treats. ' + pet.name + ' approves.', 'The water sparkles. Nothing happens. Yet.', 'A duck from the pond stares at you judgmentally.', 'You hear a faint "woof" from the water. Probably an echo.', pet.name + ' tries to drink from the fountain. Not allowed!'])); G.ui.refresh(); }, 500);
      } }));
    } });
  }
  function* doPoop() {
    talkBusy = true;
    try {
      pet.setPose('sit'); pet.eyeOverride = 'closed'; pet.emote('dots', 1.4);
      let t = 0; while (t < 1.4) { t += pet.dt; pet.m.body.position.x = Math.sin(t * 40) * 0.004; yield; }
      pet.m.body.position.x = 0; pet.eyeOverride = null;
      const back = new V3(-Math.sin(pet.heading), 0, -Math.cos(pet.heading)).multiplyScalar(0.35 * pet.S);
      const g = new THREE.Group(); const mat = G.M.mat('#7a4a24', { r: 0.6 });
      [[0.07, 0.03], [0.055, 0.07], [0.035, 0.1]].forEach(([r, y]) => { const s = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 8), mat); s.scale.y = 0.6; s.position.y = y; g.add(s); });
      g.position.copy(pet.pos).add(back); scene.add(g); poop = { m: g, t: 0 };
      pet.setPose('stand'); pet.excite = 0.6; yield* pet.wait(0.3);
      G.ui.hint('Oops! Please pick up after ' + pet.name + '.', 3000);
    } finally { talkBusy = false; }
  }
  function pickPoop() { if (!poop) return; G.audio.play('poof'); G.fx.spawn('sparkle', poop.m.position.clone().setY(0.2), 4); scene.remove(poop.m); poop = null; G.state.stats.poop = (G.state.stats.poop || 0) + 1; pet.d.bond = Math.min(100, pet.d.bond + 1); G.ui.toast(U.pick(['Good citizen! Maple Hill thanks you.', 'Bagged and binned. Nice.', 'The park stays lovely thanks to you.'])); G.checkStamps(); promptKey = ''; }
  function updateDetail(dt) {
    // bones
    for (let i = bones.length - 1; i >= 0; i--) { const b = bones[i]; b.m.rotation.y += dt; b.sp -= dt; if (b.sp < 0) { b.sp = U.rand(1.5, 4); if (b.m.position.distanceTo(pet.pos) < (pet.d.breed === 'beagle' ? 45 : 22)) G.fx.spawn('sparkle', b.m.position.clone().setY(0.2), 1, { color: '#ffd84a' }); }
      if (U.d2(b.m.position.x, b.m.position.z, pet.pos.x, pet.pos.z) < 0.7 * pet.S + 0.3) { scene.remove(b.m); bones.splice(i, 1); G.state.bones[b.i] = 1; const n = Object.keys(G.state.bones).length; G.audio.play('fanfare'); G.fx.spawn('star', pet.pos.clone().setY(0.5), 10); G.ui.banner('Golden bone!', n + ' of 8 found', 2000); pet.excite = 1; if (n >= 8 && !G.state.acc.collar_gold) G.addItem('collar_gold'); G.checkStamps(); } }
    // poop
    poopT -= dt * (pet.vel > 0.3 ? 1 : 0.2);
    if (poopT < 0 && !poop && !talkBusy && !race && pet.vel < 0.2 && !steer) { poopT = U.rand(90, 160); pet.stop(); pet.do(doPoop()); }
    if (poop) { poop.t += dt; if (U.d2(poop.m.position.x, poop.m.position.z, pet.pos.x, pet.pos.z) > 12) { scene.remove(poop.m); poop = null; G.ui.toast('Someone tutted at the mess left behind... (pick it up next time!)'); pet.d.mood = Math.max(0, pet.d.mood - 2); } }
    // rain
    if (rain) { rain.position.set(pet.pos.x, 0, pet.pos.z); const a = rain.geometry.attributes.position; for (let i = 0; i < a.count; i += 2) { let y = a.getY(i) - dt * 14; if (y < 0) y += 14; a.setY(i, y); a.setY(i + 1, y - 0.45); } a.needsUpdate = true; for (const pd of puddles) if (pet.vel > 1 && U.d2(pd.position.x, pd.position.z, pet.pos.x, pet.pos.z) < 0.6 && Math.random() < 0.3) { G.fx.spawn('drop', pet.pos.clone().setY(0.1), 2); if (Math.random() < 0.2) G.audio.play('splash'); pet.d.clean = Math.max(0, pet.d.clean - 0.3); } }
    // moon + full moon howl
    const dl = G.daylight(); moonMesh.visible = dl < 0.35 && G.weather() !== 'rain';
    if (moonMesh.visible) { moonMesh.position.set(cam.position.x + 60, 45, cam.position.z - 70); moonMesh.lookAt(cam.position); const ph = G.moonPhase(); moonMesh.material.opacity = 0.35 + 0.65 * (1 - Math.abs(ph - 0.5) * 2); moonMesh.scale.setScalar(G.fullMoon() ? 1.25 : 1); }
    // UFO
    if (ufoT > 0) { ufoT -= dt; if (ufoT <= 0) spawnUfo(); }
    if (ufo) { ufo.t += dt; const a = ufo.t * 0.25 + ufo.a0; ufo.m.position.set(pet.pos.x + Math.cos(a) * 30, 14 + Math.sin(ufo.t * 2) * 0.6, pet.pos.z + Math.sin(a) * 30); ufo.m.rotation.y += dt * 2; ufo.beam.visible = Math.sin(ufo.t * 1.5) > 0.3; if (ufo.t > 18) { scene.remove(ufo.m); ufo = null; G.ui.toast('...it zipped away over the hills.'); } }
  }
  function spawnUfo() {
    const g = new THREE.Group(); const M = G.M;
    const disc = new THREE.Mesh(new THREE.SphereGeometry(1.4, 24, 10), M.mat('#c9d2dc', { m: 0.8, r: 0.3 })); disc.scale.y = 0.28; g.add(disc);
    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.6, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), M.mat('#9fe08a', { op: 0.75, em: '#9fe08a', ei: 0.6 })); dome.position.y = 0.2; g.add(dome);
    for (let i = 0; i < 8; i++) { const l = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), new THREE.MeshBasicMaterial({ color: i % 2 ? '#ffd84a' : '#ff6f91', fog: false })); const a = i / 8 * 6.28; l.position.set(Math.cos(a) * 1.3, -0.05, Math.sin(a) * 1.3); g.add(l); }
    const beam = new THREE.Mesh(new THREE.ConeGeometry(2, 14, 20, 1, true), new THREE.MeshBasicMaterial({ color: '#c8ffb0', transparent: true, opacity: 0.18, depthWrite: false, fog: false })); beam.position.y = -7; g.add(beam);
    g.traverse((o) => { if (o.isMesh) o.userData.ufo = true; });
    scene.add(g); ufo = { m: g, t: 0, a0: Math.random() * 6.28, beam }; G.audio.play('ufo');
    pet.emote('bang', 2); pet.voiceCd = 0; pet.voice(); G.ui.toast('What’s that in the sky?! (tap it!)');
  }

  /* ---------------- input ---------------- */
  W.onDown = function (p) {
    if (talkBusy) return;
    const hit = G.pick(p, npcMeshes(), false)[0];
    if (hit) { pendingTap = { npc: npcOf(hit.object) }; return; }
    if (nori) { const nh = G.pick(p, nori.m.meshes, false)[0]; if (nh) { pendingTap = { nori: true }; return; } }
    if (ufo) { const uh = G.pick(p, [ufo.m], true)[0]; if (uh) { pendingTap = { ufo: true }; return; } }
    const ph = G.pick(p, props.filter((x) => x.obj).map((x) => x.obj), true)[0];
    if (ph) { let o = ph.object; const pr = props.find((x) => { let q = o; while (q) { if (q === x.obj) return true; q = q.parent; } return false; }); if (pr) { pendingTap = { prop: pr }; return; } }
    if (poop) { const pp = G.pick(p, [poop.m], true)[0]; if (pp) { pendingTap = { poop: true }; return; } }
    steer = { target: null }; const g = G.groundAt(p); if (g) steer.target = g;
    pet.stop();
  };
  W.onMove = function (p, down) { if (steer && down) { const g = G.groundAt(p); if (g) steer.target = g; } };
  W.onUp = function (p) {
    steer = null; idleT = 0;
    if (pendingTap && p.tap) {
      if (pendingTap.npc) approach(pendingTap.npc);
      else if (pendingTap.ufo) { if (ufo) { G.stamp('ufo'); G.audio.play('ufo'); G.ui.banner('!!!', 'You definitely saw it.', 2000); G.state.capsules = G.state.capsules || {}; if (!G.state.capsules.ufo) { G.state.capsules.ufo = 1; G.ui.toast('Something small fell from the sky... a Tiny UFO figure!', 'gold'); } ufo.t = 17; } }
      else if (pendingTap.poop) { if (poop && U.d2(poop.m.position.x, poop.m.position.z, pet.pos.x, pet.pos.z) < 5) pickPoop(); }
      else if (pendingTap.prop) { const pr = pendingTap.prop; const at = pr.at || pr.obj.position; if (U.d2(at.x, at.z, pet.pos.x, pet.pos.z) < 4.5) pr.fn(); else pet.do((function* () { yield* pet.goto(at.x, at.z, { speed: 2, near: 2, timeout: 10 }); pr.fn(); })()); }
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
    const wq = G.weather(); if (wq === 'rain' || wq === 'cloudy' || wq === 'snow') { const gr = new THREE.Color(wq === 'snow' ? '#c9d4de' : '#8a94a6'); sky.lerp(gr, wq === 'rain' ? 0.6 : 0.35); hor.lerp(gr, wq === 'rain' ? 0.5 : 0.3); }
    scene.background.copy(hor); scene.fog.color.copy(hor); scene.fog.near = wq === 'rain' ? 18 : 30;
    G.M.paint(W.sky.geometry, (c, x, y) => { const t = U.smooth(-10, 90, y); c.copy(hor).lerp(sky, t); });
    L.sun.intensity = 0.2 + 1.05 * dl; L.sun.color.set(dl < 0.8 && dl > 0.05 ? 0xffd2a0 : 0xfff0d8);
    const wf = { rain: 0.6, cloudy: 0.8, snow: 0.85 }[G.weather()] || 1; L.sun.intensity *= wf; L.hemi.intensity = (0.35 + 0.4 * dl) * (0.85 + wf * 0.15); L.hemi.color.set(dl > 0.3 ? 0xfff4e0 : 0x8fa0d8);
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
      if (!N.present) continue;
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
    // personal space: dogs never overlap each other or people
    const dogs = npcDogs.filter((d) => d.root.visible !== false).concat([pet]);
    for (let i = 0; i < dogs.length; i++) {
      const a = dogs[i];
      for (let j = i + 1; j < dogs.length; j++) { const b = dogs[j]; const dx = b.pos.x - a.pos.x, dz = b.pos.z - a.pos.z, dd = Math.hypot(dx, dz), r = 0.3 * (a.S + b.S) + 0.05; if (dd < r && dd > 1e-4) { const k = (r - dd) / dd * 0.5; const wa = a === pet ? 0.3 : 1, wb = b === pet ? 0.3 : 1; a.pos.x -= dx * k * wa; a.pos.z -= dz * k * wa; b.pos.x += dx * k * wb; b.pos.z += dz * k * wb; } }
      for (const N of npcs) for (const per of [N.person, N.extra]) { if (!per || per.root.visible === false) continue; const dx = a.pos.x - per.pos.x, dz = a.pos.z - per.pos.z, dd = Math.hypot(dx, dz), r = 0.42 + 0.22 * a.S; if (dd < r && dd > 1e-4) { a.pos.x = per.pos.x + dx / dd * r; a.pos.z = per.pos.z + dz / dd * r; } }
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
      pr.ph += dt; if (pr.glint) { const tw = Math.max(0, Math.sin(pr.ph * 2.2)); pr.glint.material.opacity = 0.35 + tw * 0.65; pr.glint.scale.setScalar(0.35 + tw * 0.35); pr.glint.material.rotation = pr.ph * 0.6; pr.glint.position.y = 0.32 + Math.sin(pr.ph) * 0.04; }
      pr.sp += dt; if (pr.sp > 0.6) { pr.sp = 0; if (pr.pos.distanceTo(pet.pos) < 28) G.fx.spawn('sparkle', pr.pos.clone().add(new V3(U.rand(-0.2, 0.2), 0.25, U.rand(-0.2, 0.2))), 1); }
      const dd = U.d2(pr.pos.x, pr.pos.z, pet.pos.x, pet.pos.z);
      if (!pr.sniffed && dd < 5 && !talkBusy) { pr.sniffed = true; pet.emote('bang', 1); pet.lookTarget = pr.pos.clone().setY(0.1); G.audio.play('sniff'); G.ui.hint(pet.name + ' smells something! Lead them to the little mound.', 3000); setTimeout(() => { if (pet) pet.lookTarget = null; }, 1500); }
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
      let best = null, bd = 3.2; for (const N of npcs) { if (!N.present) continue; const d = U.d2(N.person.pos.x, N.person.pos.z, pet.pos.x, pet.pos.z); if (d < bd) { bd = d; best = N; } }
      if (best) { list.push({ label: 'Talk to ' + G.NPCS[best.key].name, fn: () => talkTo(best) }); key += best.key; }
      if (nori && nori.root.visible && U.d2(nori.pos.x, nori.pos.z, pet.pos.x, pet.pos.z) < 4.2) { list.push({ label: 'Approach the cat', cls: 'pink', fn: talkNori }); key += 'nori'; }
      for (const pr of props) { const at = pr.at || pr.obj.position; if (U.d2(at.x, at.z, pet.pos.x, pet.pos.z) < 2.6) { list.push({ label: { vending: 'Vending machine', capsule: 'Capsule toys (30c)', shrine: 'Visit the shrine', fountain: 'Make a wish' }[pr.kind], cls: 'pink', fn: pr.fn }); key += pr.kind; } }
      if (poop) { list.push({ label: 'Pick up (bag)', cls: 'pink', fn: pickPoop }); key += 'poop'; }
      for (const d of doors) if (U.d2(d.p.x, d.p.z, pet.pos.x, pet.pos.z) < 2.6) { list.push({ label: d.kind === 'home' ? 'Go home' : 'Enter ' + d.name, cls: 'orange', fn: () => enterDoor(d) }); key += d.kind; }
      if (key !== promptKey) { promptKey = key; G.ui.prompts(list); }
    }
    updateDetail(dt);
    if (W.grassU) W.grassU.value = G.time; if (W.waterTex) { W.waterTex.offset.x += dt * 0.015; W.waterTex.offset.y += dt * 0.008; } for (const c of W.clouds) { c.position.x += dt * 0.6; if (c.position.x > 100) c.position.x = -100; }
    W.presT = (W.presT || 0) - dt; if (W.presT < 0) { W.presT = 20; if (!talkBusy && !race) refreshPresence(); }
    const og = npcs.find((N) => N.key === 'ogawa');
    for (const b of W.sparrows) { b.m.visible = og.present; if (!og.present) continue; b.ph += dt; const scared = U.d2(b.home.x, b.home.z, pet.pos.x, pet.pos.z) < 3; b.fly = U.damp(b.fly, scared ? 1 : 0, scared ? 3 : 0.6, dt); const hop = Math.max(0, Math.sin(b.ph * 7)) * 0.04; b.m.position.set(b.home.x + Math.sin(b.ph * 0.5) * 0.3 + b.fly * 2, hop + b.fly * 3.5, b.home.z + Math.cos(b.ph * 0.4) * 0.3); b.m.rotation.y = Math.sin(b.ph * 0.5) * 2; if (Math.random() < dt * 0.4 && !scared) b.m.rotation.x = 0.5; else b.m.rotation.x *= 0.9; }
    { const K = npcs.find((N) => N.key === 'kenji'); if (K && K.person.root.visible !== false) { const d = U.d2(K.person.pos.x, K.person.pos.z, pet.pos.x, pet.pos.z); G.audio.busk(W.kenjiSong || 'sakura', U.clamp(1 - (d - 2.5) / 13, 0, 1)); } else G.audio.busk(null, 0); }
    lightT -= dt; if (lightT < 0) { lightT = 30; applyLighting(); }
  };
  function enterDoor(d) {
    G.audio.play('door');
    if (d.kind === 'home') G.go('home');
    else if (d.kind === 'cafe') G.go('cafe', { from: 'walk' });
    else if (d.kind === 'shop') G.go('shop', { from: 'walk' });
    else if (d.kind === 'field') G.ui.trialsSheet('walk');
    else if (d.kind === 'kennel') G.go('kennel', { from: 'walk' });
    else if (d.kind === 'park') G.go('park', { from: 'walk' });
    else if (d.kind === 'hotel') G.go('hotel', { from: 'walk' });
  }
  return W;
})();
