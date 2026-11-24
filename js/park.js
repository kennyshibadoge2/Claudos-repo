'use strict';
/* =========================================================
   Shiba Days — Maple Dog Park (off-leash area)
   ========================================================= */
G.PARK_VISITOR_DOGS = [['Pocky', 'corgi', 'corgi'], ['Natto', 'shiba', 'sesame'], ['Snowpea', 'husky', 'husky'], ['Waffle', 'golden', 'golden'], ['Udon Jr.', 'dachshund', 'dachs'], ['Kinako', 'mame', 'cream'], ['Tofu', 'pug', 'pug'], ['Rocket', 'husky', 'husky'], ['Bean', 'shiba', 'red'], ['Maru', 'shiba', 'blacktan'], ['Cookie', 'corgi', 'corgi'], ['Latte', 'golden', 'golden']];
G.PARK_LINES = [
  (d, n) => 'Isn’t this park the best? ' + d + ' runs laps around the pond every morning.',
  (d, n) => n + ' is so cute! How old? ' + d + ' is three, but acts like a puppy.',
  (d) => 'Throw a disc! ' + d + ' will totally try to steal it. Sorry in advance.',
  (d) => 'Tip: dogs who play here a lot get way better at catching. ' + d + ' used to just chew the disc.',
  (d) => 'The fountain by the oak has fresh water for pups. ' + d + ' drinks like a camel.',
  (d) => 'Watch out for the ducks. ' + d + ' lost a staring contest to one yesterday.',
  (d, n) => 'Our dogs are getting along great! ' + d + ' really likes ' + n + '.',
  (d) => 'I come here after work to unwind. Nothing beats watching ' + d + ' do zoomies.',
];
G.scenes.park = (() => {
  const P = { music: 'walk' };
  let scene, cam, pet, me = new V3(0, 0, 22), meHead = Math.PI, camYaw = Math.PI, lookV = new V3(), from = 'walk';
  let hand, flights = [], visitors = [], vdogs = [], colliders = [], steer = null, pending = null, ducks = [], held = null, promptKey = '', season;
  const FX = 40, FZ = 30, POND = new V3(-14, 0, -6), FOUNT = new V3(12, 0, -12), GATE = new V3(0, 0, 29), TUNNEL = new V3(14, 0, 8);
  P.init = function () {
    season = G.season();
    scene = new THREE.Scene(); P.scene = scene; scene.background = new THREE.Color('#bfe4ff'); scene.fog = new THREE.Fog('#bfe4ff', 45, 110);
    cam = new THREE.PerspectiveCamera(50, G.aspect(), 0.1, 220); P.camera = cam;
    P.L = G.outdoorLights(scene, { shadow: 18 });
    hand = new G.DiscHand(scene, cam);
    build();
  };
  function build() {
    const M = G.M; const st = new THREE.Group();
    const g = new THREE.Mesh(new THREE.PlaneGeometry(240, 240), M.mat('#fff', { map: G.grassTex(season, 60), r: 1 })); g.rotation.x = -Math.PI / 2; g.receiveShadow = true; scene.add(g);
    // fence ring with gate gap
    const fenceCol = '#c8a07a';
    for (const [x, z, len, r] of [[0, -FZ, FX * 2, 0], [-FX, 0, FZ * 2, Math.PI / 2], [FX, 0, FZ * 2, Math.PI / 2], [-FX / 2 - 1.5, FZ, FX - 3, 0], [FX / 2 + 1.5, FZ, FX - 3, 0]]) { const f = M.fence(len, fenceCol); f.position.set(x, 0, z); f.rotation.y = r; st.add(f); }
    const gate = new THREE.Group(); gate.position.copy(GATE); st.add(gate);
    for (const sd of [-1, 1]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.3, 2.8, 0.3), M.mat('#7a5236')); p.position.set(sd * 2.6, 1.4, 0); p.castShadow = true; gate.add(p); }
    const gt = G.textTex('Maple Dog Park', { font: '700 64px Fredoka, sans-serif', bg: '#79b25a', color: '#fff', pad: 26 });
    const gb = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 4.6 * gt.userData.h / gt.userData.w), M.mat('#fff', { map: gt, side: THREE.DoubleSide })); gb.position.set(0, 2.6, 0); gb.userData.noBake = true; gate.add(gb);
    const sign = new THREE.Group(); sign.position.set(4.5, 0, 26.5); st.add(sign); const sp = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.3, 0.1), M.mat('#7a5236')); sp.position.y = 0.65; sign.add(sp);
    const sb = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.9), M.mat('#fff', { map: G.canvasTex(256, 164, (c) => { c.fillStyle = '#fff7ea'; c.fillRect(0, 0, 256, 164); c.fillStyle = '#3f7a32'; c.font = '700 22px Fredoka, sans-serif'; c.textAlign = 'center'; c.fillText('OFF-LEASH AREA', 128, 34); c.fillStyle = '#3b2a1f'; c.font = '500 17px Fredoka, sans-serif'; ['Be kind to all dogs', 'Please clean up', 'No ducks were harmed', '(the ducks are in charge)'].forEach((l, i) => c.fillText(l, 128, 66 + i * 24)); }) })); sb.position.set(0, 1.35, 0.06); sb.userData.noBake = true; sign.add(sb);
    // pond with pier, reeds, lily pads
    const water = G.canvasTex(256, 256, (c) => { c.fillStyle = '#5fb4e6'; c.fillRect(0, 0, 256, 256); for (let i = 0; i < 80; i++) { c.strokeStyle = 'rgba(255,255,255,' + U.rand(0.08, 0.3) + ')'; c.lineWidth = U.rand(1, 3); const x = Math.random() * 256, y = Math.random() * 256, l = U.rand(10, 40); c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + l / 2, y - 4, x + l, y); c.stroke(); } }, { repeat: [4, 4] });
    P.water = water;
    const pond = new THREE.Mesh(new THREE.CircleGeometry(7, 56), new THREE.MeshStandardMaterial({ map: water, roughness: 0.05, metalness: 0.15 })); pond.rotation.x = -Math.PI / 2; pond.position.set(POND.x, 0.04, POND.z); scene.add(pond);
    const edge = new THREE.Mesh(new THREE.RingGeometry(6.9, 7.6, 56), M.mat('#c9b48a', { r: 1 })); edge.rotation.x = -Math.PI / 2; edge.position.set(POND.x, 0.035, POND.z); edge.receiveShadow = true; scene.add(edge);
    for (let i = 0; i < 60; i++) { const a = i / 60 * Math.PI * 2; if (a > 0.2 && a < 0.7) continue; const s = new THREE.Mesh(new THREE.IcosahedronGeometry(U.rand(0.2, 0.36), 0), M.mat(U.pick(['#9a948a', '#b5ada0', '#857f76']), { flat: true })); s.position.set(POND.x + Math.cos(a) * 7.5, 0.08, POND.z + Math.sin(a) * 7.5); s.rotation.set(Math.random() * 3, Math.random() * 3, 0); s.castShadow = true; st.add(s); }
    for (let i = 0; i < 40; i++) { const a = U.rand(2.2, 4.2), r = U.rand(6.4, 7.2); const rd = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, U.rand(0.6, 1.1), 4), M.mat('#6a8a3a')); rd.position.set(POND.x + Math.cos(a) * r, 0.4, POND.z + Math.sin(a) * r); rd.rotation.z = U.rand(-0.2, 0.2); st.add(rd); if (i % 4 === 0) { const cat = new THREE.Mesh(new THREE.CapsuleGeometry(0.035, 0.12, 3, 6), M.mat('#6a4a2a')); cat.position.set(rd.position.x, 0.85, rd.position.z); st.add(cat); } }
    for (let i = 0; i < 10; i++) { const lp = new THREE.Mesh(new THREE.CircleGeometry(U.rand(0.3, 0.5), 16, 0.3, Math.PI * 1.8), M.mat('#5e9e44')); lp.rotation.x = -Math.PI / 2; const a = Math.random() * 6.28, d = U.rand(1.5, 5.5); lp.position.set(POND.x + Math.cos(a) * d, 0.05, POND.z + Math.sin(a) * d); scene.add(lp); if (i % 3 === 0) { const fl = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), M.mat('#f39bb0')); fl.position.copy(lp.position).setY(0.09); scene.add(fl); } }
    const pier = new THREE.Group(); pier.position.set(POND.x + 6.4, 0, POND.z + 2.6); pier.rotation.y = -0.45 - Math.PI / 2; st.add(pier);
    for (let i = 0; i < 9; i++) { const pl = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.08, 0.32), M.mat(i % 2 ? '#b9773f' : '#a8683a')); pl.position.set(0, 0.32, i * 0.36); pl.castShadow = true; pier.add(pl); }
    for (const sx of [-1, 1]) for (let i = 0; i < 3; i++) { const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.8, 8), M.mat('#7a5236')); post.position.set(sx * 0.65, 0.25, i * 1.4); pier.add(post); }
    colliders.push({ x: POND.x, z: POND.z, r: 6.6, pond: true });
    for (let i = 0; i < 3; i++) { const d = M.item('duck'); d.scale.setScalar(2.4); scene.add(d); ducks.push({ m: d, a: Math.random() * 6, r: U.rand(2, 5), s: U.rand(0.12, 0.25) }); }
    // fountain for dogs
    const fo = new THREE.Group(); fo.position.copy(FOUNT); st.add(fo);
    const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.32, 1.0, 14), M.mat('#9aa2ac', { m: 0.3, r: 0.5 })); ped.position.y = 0.5; fo.add(ped);
    const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.3, 0.15, 18), M.mat('#c9d2dc', { m: 0.5, r: 0.3 })); bowl.position.set(0.5, 0.18, 0); fo.add(bowl);
    const fw = new THREE.Mesh(new THREE.CircleGeometry(0.34, 18), M.mat('#7cc8f0', { r: 0.05 })); fw.rotation.x = -Math.PI / 2; fw.position.set(0.5, 0.26, 0); scene.add(fw); fw.position.add(FOUNT);
    const ft = G.textTex('PUP WATER', { font: '700 40px Fredoka, sans-serif', bg: '#4aa6e0', color: '#fff', pad: 10, radius: 10 }); const fs = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.18), M.mat('#fff', { map: ft })); fs.position.set(0, 0.85, 0.26); fs.userData.noBake = true; fo.add(fs);
    colliders.push({ x: FOUNT.x, z: FOUNT.z, r: 0.5 });
    // play tunnel + hurdle
    const tc = new THREE.CatmullRomCurve3([new V3(-1.8, 0.4, 0), new V3(0, 0.45, 0.6), new V3(1.8, 0.4, 0)]);
    const tun = new THREE.Mesh(new THREE.TubeGeometry(tc, 20, 0.48, 14, false), M.mat('#f2c24b', { side: THREE.DoubleSide })); tun.position.copy(TUNNEL); tun.castShadow = true; st.add(tun);
    for (let i = 0; i < 4; i++) { const t = new THREE.Mesh(new THREE.TorusGeometry(0.49, 0.03, 6, 20), M.mat('#e2574c')); const pp = tc.getPointAt(i / 3); t.position.copy(pp).add(TUNNEL); t.lookAt(pp.clone().add(tc.getTangentAt(i / 3)).add(TUNNEL)); st.add(t); }
    colliders.push({ x: TUNNEL.x, z: TUNNEL.z, r: 1.0 });
    // trees, benches, picnic tables, flowers
    const rnd = (() => { let a = 77; return () => { a = (a * 16807) % 2147483647; return a / 2147483647; }; })();
    let n = 0, tries = 0;
    while (n < 34 && tries < 500) { tries++; const edgeT = rnd() < 0.7; const x = edgeT ? (rnd() < 0.5 ? -1 : 1) * U.lerp(FX - 6, FX - 1, rnd()) * (rnd() < 0.5 ? 1 : U.lerp(0.2, 1, rnd())) : U.lerp(-FX + 4, FX - 4, rnd()); const z = edgeT ? U.lerp(-FZ + 1, FZ - 3, rnd()) : U.lerp(-FZ + 4, FZ - 6, rnd()); if (Math.abs(x) < 4 && z > 18) continue; if (!colliders.every((c) => U.d2(x, z, c.x, c.z) > c.r + 2)) continue; const t = M.tree(season, rnd() < 0.25 ? 'pine' : 'round', rnd); t.position.set(x, 0, z); t.scale.setScalar(U.lerp(1, 1.6, rnd())); st.add(t); colliders.push({ x, z, r: 0.5 }); n++; }
    for (const [x, z, ry] of [[-6, -14, 0.3], [6, 16, Math.PI], [-20, 10, 1.2], [20, -2, -1.4], [-4, 2, -0.3]]) { const b = M.bench(); b.position.set(x, 0, z); b.rotation.y = ry; st.add(b); colliders.push({ x, z, r: 0.8 }); }
    for (const [x, z] of [[22, 18], [-24, -20]]) { const pt = new THREE.Group(); pt.position.set(x, 0, z); const top = new THREE.Mesh(new THREE.BoxGeometry(2, 0.08, 0.9), M.mat('#b9773f')); top.position.y = 0.75; pt.add(top); for (const sz of [-1, 1]) { const bn = new THREE.Mesh(new THREE.BoxGeometry(2, 0.06, 0.3), M.mat('#a8683a')); bn.position.set(0, 0.45, sz * 0.7); pt.add(bn); } for (const sx of [-0.8, 0.8]) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.75, 1.6), M.mat('#7a5236')); l.position.set(sx, 0.37, 0); pt.add(l); } const bas = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.25, 0.3), M.mat('#c48a52')); bas.position.set(0.4, 0.92, 0); pt.add(bas); pt.traverse((o) => { if (o.isMesh) o.castShadow = true; }); st.add(pt); colliders.push({ x, z, r: 1.1 }); }
    for (const [x, z, r] of [[8, 22, 1.5], [-10, 20, 1.2], [18, -20, 1.4], [-30, 6, 1.3], [28, 10, 1.2]]) { const f = M.flowers(Math.round(r * 30), r, rnd); f.position.set(x, 0, z); st.add(f); }
    for (let i = 0; i < 26; i++) { const x = U.rand(-FX + 3, FX - 3), z = U.rand(-FZ + 3, FZ - 6); if (!colliders.every((c) => U.d2(x, z, c.x, c.z) > c.r + 2.5) || (Math.abs(x) < 5 && z > 12)) continue; const b2 = M.bush(season === 'autumn' ? U.pick(['#7a9a3a', '#b5862f', '#5e9e44']) : '#5e9e44', U.rand(0.7, 1.3)); b2.position.set(x, 0, z); st.add(b2); colliders.push({ x, z, r: 0.6 }); }
    for (const [x, z, r] of [[-2, -8, 2], [10, -2, 1.6], [-26, 18, 1.8], [26, -22, 1.6], [0, 8, 1.4]]) { const f = M.flowers(Math.round(r * 34), r, rnd); f.position.set(x, 0, z); st.add(f); const ring = new THREE.Mesh(new THREE.RingGeometry(r + 0.05, r + 0.35, 28), M.mat('#b5ada0')); ring.rotation.x = -Math.PI / 2; ring.position.set(x, 0.02, z); st.add(ring); }
    scene.add(M.bake(st));
    { const blade = new THREE.ConeGeometry(0.035, 0.3, 3, 1); blade.translate(0, 0.15, 0); const arr = []; for (let k = 0; k < 4; k++) { const b2 = blade.clone(); b2.rotateZ(U.rand(-0.35, 0.35)); b2.rotateY(k * 1.6); b2.translate(U.rand(-0.06, 0.06), 0, U.rand(-0.06, 0.06)); arr.push(...b2.toNonIndexed().attributes.position.array); }
      const tuft = new THREE.BufferGeometry(); tuft.setAttribute('position', new THREE.Float32BufferAttribute(arr, 3)); tuft.computeVertexNormals();
      const gm = new THREE.MeshLambertMaterial({ color: '#ffffff' }); P.grassU = { value: 0 };
      gm.onBeforeCompile = (sh) => { sh.uniforms.uTime = P.grassU; sh.vertexShader = 'uniform float uTime;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n vec4 wp = instanceMatrix * vec4(0.0,0.0,0.0,1.0); float sway = sin(uTime*1.8 + wp.x*0.35 + wp.z*0.27) * 0.27 * position.y; transformed.x += sway; transformed.z += sway*0.5;'); };
      const N = Math.round((G.quality ? G.quality().grass : 1) * (G.mobile ? 2600 : 5000)); const im = new THREE.InstancedMesh(tuft, gm, Math.max(1, N)); const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), col = new THREE.Color(); let n = 0, tries = 0;
      const base = { spring: '#7cbf5a', summer: '#5e9e44', autumn: '#9aa84a', winter: '#cfd9cf' }[season];
      while (n < N && tries < N * 5) { tries++; const x = U.rand(-FX + 1, FX - 1), z = U.rand(-FZ + 1, FZ - 1); if (!colliders.every((c) => U.d2(x, z, c.x, c.z) > c.r + 0.3)) continue; if (U.d2(x, z, POND.x, POND.z) < 7.8) continue; const sc = U.rand(0.7, 1.4); m4.compose(new V3(x, 0, z), q.setFromAxisAngle(new V3(0, 1, 0), Math.random() * 6.28), new V3(sc, sc, sc)); im.setMatrixAt(n, m4); im.setColorAt(n, col.set(base).offsetHSL(U.rand(-0.03, 0.03), U.rand(-0.1, 0.05), U.rand(-0.08, 0.08))); n++; }
      im.count = n; scene.add(im); }
  }
  /* ---------------- visitors ---------------- */
  function clearVisitors() { for (const v of visitors) { scene.remove(v.person.root); for (const d of v.dogs) scene.remove(d.root); } visitors = []; vdogs = []; }
  function spawnVisitors() {
    clearVisitors();
    const h = (new Date().getHours() + (G.hourOffset || 0) + 24) % 24; const inH = (rs) => rs.some(([a, b]) => h >= a && h < b);
    const named = [['hana', [[9, 20]]], ['kato', [[7, 11], [16, 20]]], ['rina', [[5, 10], [16, 21]]]].filter(([k, hrs]) => inH(hrs) && Math.random() < 0.7);
    const spots = [[-6, -4], [8, 4], [-18, 8], [16, -14], [2, -18], [-24, -10], [22, 14]].sort(() => Math.random() - 0.5);
    named.forEach(([k], i) => addVisitor(k, G.NPCS[k].look || k, [G.NPCS[k].dog, G.NPCS[k].dog2].filter(Boolean), spots[i]));
    const extra = h >= 22 || h < 5 ? U.randi(0, 1) : U.randi(2, 4);
    const pool = G.PARK_VISITOR_DOGS.slice().sort(() => Math.random() - 0.5);
    for (let i = 0; i < extra; i++) { const [nm, br, ct] = pool[i]; addVisitor(null, { skin: U.pick(['#f6d2b8', '#e6b894', '#c99a76', '#8a5a3a']), hair: U.pick(['#2a1d18', '#5a3a26', '#c4622a', '#e8d2a8']), style: U.pick(['short', 'bob', 'pony', 'bun', 'messy']), top: U.pick(['#e2574c', '#4aa6e0', '#79b25a', '#f2c24b', '#7a5cff', '#f39bb0']), bottom: U.pick(['#3b4a6a', '#3a3a3a', '#5a4a3a']), h: U.rand(0.93, 1.05), extra: U.chance(0.3) ? ['cap'] : [] }, [{ name: nm, breed: br, coat: ct }], spots[named.length + i] || [U.rand(-20, 20), U.rand(-20, 15)]); }
  }
  function addVisitor(key, look, dogs, spot) {
    const per = new G.Person(look, { key: key || 'visitor' }); per.pos.set(spot[0], 0, spot[1]); per.heading = Math.random() * 6; scene.add(per.root);
    const v = { key, person: per, dogs: [], name: key ? G.NPCS[key].name : U.pick(['Visitor', 'Dog walker', 'Park regular']) };
    dogs.forEach((dg, i) => {
      const p = new G.Pet({ name: dg.name, breed: dg.breed, coat: dg.coat, mood: 85, acc: { collar: U.pick(['collar_blue', 'collar_pink', 'collar_red', 'collar_gold']) }, disc: U.rand(10, 70) }, { npc: true });
      p.pos.set(spot[0] + 1 + i, 0, spot[1] + 1); p.owner = v; p.bounds = bounds; p.brain = visitorDogBrain(per, i); scene.add(p.root); v.dogs.push(p); vdogs.push(p);
    });
    visitors.push(v);
  }
  function visitorDogBrain(owner, idx) {
    return (p) => (function* () {
      const o = owner.pos; const d = U.d2(p.pos.x, p.pos.z, o.x, o.z);
      if (d > 9) { yield* p.goto(o.x + U.rand(-2, 2), o.z + U.rand(-2, 2), { speed: 2.2, timeout: 6 }); return; }
      const r = Math.random();
      if (r < 0.25 && pet && U.d2(p.pos.x, p.pos.z, pet.pos.x, pet.pos.z) < 8 && !pet.busy) { yield* playWith(p, pet); return; }
      if (r < 0.45) { const a = Math.random() * 6.28; yield* p.goto(o.x + Math.cos(a) * 6, o.z + Math.sin(a) * 6, { speed: U.pick([1, 1.6, 2.6]), timeout: 6 }); }
      else if (r < 0.6) yield* p.sniffAround(2);
      else if (r < 0.7) yield* p.zoomies(p.pos.x, p.pos.z, 2, 1);
      else if (r < 0.82) yield* p.act(U.pick(['sit', 'lie']), U.rand(2, 4));
      else yield* p.act('bow', 1);
    })();
  }
  function* playWith(a, b) {
    yield* a.goto(b.pos.x, b.pos.z, { speed: 2.4, near: 0.9, timeout: 4 });
    if (b.busy || b.ctl) return;
    yield* a.face(b.pos.x, b.pos.z); a.setPose('bow'); a.excite = 1; a.voiceCd = 0; if (U.chance(0.5)) a.voice(); yield* a.wait(0.8);
    if (!b.task || b === pet) { b.lookTarget = a.headWorld(); }
    b.do((function* () { b.excite = 1; yield* b.face(a.pos.x, a.pos.z); yield* b.act('bow', 0.6); b.lookTarget = null; let t = 0; while (t < 4) { t += b.dt; b.setPose('stand'); b.moveTarget = new V3(a.pos.x, 0, a.pos.z); b.speedMul = 3; yield; } b.moveTarget = null; if (b === pet) b.happy(4); })());
    yield* a.zoomies(a.pos.x, a.pos.z, 2.5, 1.2);
  }
  function bounds(p) {
    p.pos.x = U.clamp(p.pos.x, -FX + 0.6, FX - 0.6); p.pos.z = U.clamp(p.pos.z, -FZ + 0.6, FZ - 0.8);
    for (const c of colliders) { const dx = p.pos.x - c.x, dz = p.pos.z - c.z, d = Math.hypot(dx, dz); const r = c.r + (c.pond && p.wading ? -1.2 : 0.12 * p.S); if (d < r && d > 1e-4) { p.pos.x = c.x + dx / d * r; p.pos.z = c.z + dz / d * r; } }
  }

  /* ---------------- enter / exit ---------------- */
  P.enter = function (opts = {}) {
    from = opts.from || 'walk';
    pet = G.activePet(); if (!pet || pet.cat) { setTimeout(() => G.go('home'), 50); return; }
    scene.add(pet.root); pet.stop(); pet.ctl = null; pet.baseY = 0; pet.busy = false; pet.bounds = bounds; pet.brain = myBrain;
    me.set(0, 0, 19); meHead = Math.PI; camYaw = Math.PI; pet.pos.set(0.8, 0, 17.6); pet.heading = Math.PI;
    spawnVisitors(); hand.hide(); held = null; promptKey = '';
    const dl = G.daylight(); scene.background.set(new THREE.Color('#1a2448').lerp(new THREE.Color('#bfe4ff'), dl)); scene.fog.color.copy(scene.background); P.L.sun.intensity = 0.2 + 1.05 * dl; P.L.hemi.intensity = 0.35 + 0.4 * dl;
    placeCam(true);
    setTimeout(() => G.ui.hint('Off-leash! Hold on the ground to walk. Use Toys to throw a disc or ball.', 4500), 600);
    G.stats = G.stats || {}; G.state.stats.park = (G.state.stats.park || 0) + 1;
  };
  P.exit = function () { if (pet) { if (pet.carry) { pet.m.mouth.remove(pet.carry.mesh); pet.carry = null; } scene.remove(pet.root); pet.stop(); pet.wading = false; } for (const f of flights) f.remove(); flights = []; hand.hide(); clearVisitors(); G.ui.prompts([]); G.ui.hint(null); };
  P.dock = () => [
    { label: 'Call', icon: 'whistle', fn: () => P.call() },
    { label: 'Toys', icon: 'ball', fn: toySheet },
    { label: 'Treat', icon: 'treat', fn: treatSheet },
    { label: 'Leave', icon: 'door', cls: 'go', fn: () => G.go('walk', { from: 'park' }) },
  ];
  function toySheet() {
    G.ui.sheet({ title: 'Play', render(body) {
      G.ui.note(body, 'Throwables at the park: discs and balls. Grab it, swing up, let go!');
      const g = G.ui.grid(body);
      Object.keys(G.state.toys).filter((k) => G.ITEMS[k] && ['disc', 'throw'].includes(G.ITEMS[k].toy)).forEach((k) => g.appendChild(G.ui.card({ img: G.M.icons.item(k), name: G.ITEMS[k].name, fn: () => { G.ui.closeSheet(true); held = k; hand.show(k); G.ui.prompts([{ label: 'Put away', cls: 'orange', fn: () => { hand.hide(); held = null; G.ui.prompts([]); promptKey = ''; } }]); promptKey = 'held'; } })));
    } });
  }
  function treatSheet() {
    G.ui.sheet({ title: 'Give a treat', render(body) {
      const ks = Object.keys(G.ITEMS).filter((k) => G.ITEMS[k].cat === 'treat' && G.state.inv[k] > 0);
      if (!ks.length) { G.ui.note(body, 'No treats in your pocket.'); return; }
      const g = G.ui.grid(body);
      ks.forEach((k) => g.appendChild(G.ui.card({ img: G.M.icons.item(k), name: G.ITEMS[k].name, badge: G.state.inv[k], fn: () => { G.ui.closeSheet(true); G.state.inv[k]--; const it = G.ITEMS[k]; P.call(() => { pet.chewT = 1.5; G.audio.play('munch'); pet.d.hunger = U.clamp(pet.d.hunger + it.hunger, 0, 100); pet.happy(it.mood); pet.voice('happy'); }); } })));
    } });
  }
  P.call = function (after) {
    G.audio.play('call'); if (pet.carry && !flights.length) { /* keep */ }
    pet.stop(); pet.wading = false; pet.emote('bang', 0.8);
    pet.do((function* () { const f = new V3(Math.sin(meHead), 0, Math.cos(meHead)); yield* pet.goto(me.x + f.x * 1.2, me.z + f.z * 1.2, { speed: 2.8, timeout: 12 }); yield* pet.face(me.x, me.z); pet.setPose('sit'); pet.lookCam = 3; if (after) after(); yield* pet.wait(2); })());
  };
  /* ---------------- my dog ---------------- */
  function* myBrain(p) {
    const d = U.d2(p.pos.x, p.pos.z, me.x, me.z);
    if (d > 10) { yield* p.goto(me.x + U.rand(-2, 2), me.z + U.rand(-2, 2), { speed: 2.4, timeout: 8 }); return; }
    const r = Math.random();
    if (p.d.thirst < 50 && r < 0.4) { yield* p.goto(FOUNT.x + 0.5, FOUNT.z + 0.9, { speed: 1.8 }); yield* p.face(FOUNT.x + 0.5, FOUNT.z); p.setPose('eat'); p.lickT = 3; G.audio.play('lap'); yield* p.wait(2.5); p.d.thirst = 100; p.setPose('stand'); return; }
    if (r < 0.12 && U.d2(p.pos.x, p.pos.z, POND.x, POND.z) < 16) { const a = Math.atan2(p.pos.z - POND.z, p.pos.x - POND.x); p.wading = true; yield* p.goto(POND.x + Math.cos(a) * 5.6, POND.z + Math.sin(a) * 5.6, { speed: 1.6, timeout: 6 }); p.setPose('sniff'); for (let i = 0; i < 6; i++) { G.fx.spawn('drop', p.pos.clone().setY(0.1), 2); yield* p.wait(0.3); } if (U.chance(0.3)) G.audio.play('splash'); p.wet = 1; p.d.clean = Math.max(0, p.d.clean - 6); yield* p.goto(POND.x + Math.cos(a) * 8.2, POND.z + Math.sin(a) * 8.2, { speed: 1.6, timeout: 5 }); p.wading = false; yield* p.shake(); return; }
    if (r < 0.32) { const a = Math.random() * 6.28; yield* p.goto(me.x + Math.cos(a) * 5, me.z + Math.sin(a) * 5, { speed: U.pick([1, 1.8, 2.8]), timeout: 6 }); }
    else if (r < 0.48) yield* p.sniffAround(2);
    else if (r < 0.58 && vdogs.length) { const o = U.pick(vdogs); if (!o.busy) yield* playWith(p, o); }
    else if (r < 0.66 && U.d2(p.pos.x, p.pos.z, TUNNEL.x, TUNNEL.z) < 14) { yield* p.goto(TUNNEL.x - 2.4, TUNNEL.z, { speed: 2.4, timeout: 6 }); p.setPose('crouch'); const t0 = G.time; while (G.time - t0 < 1.2) { const k = (G.time - t0) / 1.2; p.pos.set(TUNNEL.x - 2.2 + k * 4.4, 0, TUNNEL.z + Math.sin(k * Math.PI) * 0.6); p.heading = Math.PI / 2; p.vel = 3; yield; } p.setPose('stand'); p.excite = 1; p.voice(); }
    else if (r < 0.74) yield* p.zoomies(p.pos.x, p.pos.z, 2.2, 1);
    else { p.lookCam = 2; yield* p.act(U.pick(['sit', 'lie', 'sit']), U.rand(2, 4)); }
  }
  /* ---------------- throwing ---------------- */
  function launch(r) {
    const isBall = G.ITEMS[r.id].toy !== 'disc';
    const path = G.discSim(r.pos, r.vel, { pro: r.id === 'prodisc', ball: isBall, bounds: { x0: -FX + 0.5, x1: FX - 0.5, z0: -FZ + 0.5, z1: FZ - 0.5 } });
    const fl = new G.DiscFlight(scene, r.id, path); if (isBall) fl.mesh.scale.setScalar(1); flights.push(fl);
    if (r.power > 4) G.audio.play('whoosh'); G.state.stats.throws++;
    const racers = [pet].concat(vdogs.filter((d) => U.chance(0.35) && U.d2(d.pos.x, d.pos.z, me.x, me.z) < 18));
    let best = null, bt = 1e9;
    for (const d of racers) { if (d.carry) continue; const pl = G.discPlan(d, path); const tt = pl ? pl.t - (d === pet ? 0.25 : 0) : 99; if (tt < bt) { bt = tt; best = { d, pl }; } }
    if (!best) best = { d: pet, pl: null };
    for (const d of racers) {
      d.stop(); d.wading = false;
      if (d === best.d) d.do(fetchSeq(d, fl, best.pl, r.id));
      else d.do((function* () { d.excite = 1; let t = 0; while (t < 3 && !fl.caught) { t += d.dt; d.setPose('stand'); d.moveTarget = new V3(fl.pos.x, 0, fl.pos.z); d.speedMul = 3; yield; } d.moveTarget = null; if (d === pet) { pet.emote('sweat'); } yield* d.act('bow', 0.7); })());
    }
    if (best.d !== pet) G.ui.toast(best.d.name + ' is going for it too!');
  }
  function* fetchSeq(d, fl, plan, id) {
    d.busy = true;
    try {
      let kind = null; yield* G.discChase(d, fl, plan, { id, train: d === pet ? 1 : 0, done: (k) => (kind = k) });
      flights.splice(flights.indexOf(fl), 1);
      if (d === pet) { if (kind === 'flip') G.ui.toast('Flip catch!'); else if (kind === 'jump') G.ui.toast('Jumping catch!'); }
      else { G.ui.toast(d.name + ' caught it and brings it to you!'); d.owner && (d.owner.person.waveT = 1.5); }
      const f = new V3(Math.sin(meHead), 0, Math.cos(meHead));
      yield* d.goto(me.x + f.x * 1.1, me.z + f.z * 1.1, { speed: 2.6, timeout: 15 }); yield* d.face(me.x, me.z); d.setPose('sit'); d.lookCam = 2; yield* d.wait(0.4);
      if (d.carry) { d.m.mouth.remove(d.carry.mesh); d.carry = null; }
      d.happy && d.d.mood !== undefined && d.happy(2); d.excite = 1; d.voiceCd = 0; d.voice('happy');
      if (held) hand.show(held);
      yield* d.wait(1.2);
    } finally { d.busy = false; }
  }
  /* ---------------- input ---------------- */
  function visitorMeshes() { const a = []; for (const v of visitors) v.person.root.traverse((o) => { if (o.isMesh) a.push(o); }); return a; }
  P.onDown = function (p) {
    if (held && hand.active && hand.down(p)) return;
    const vh = G.pick(p, vdogs.flatMap((d) => d.m.meshes), false)[0]; if (vh) { pending = { dog: vh.object.userData.pet }; return; }
    const ph = G.pick(p, visitorMeshes(), false)[0]; if (ph) { pending = { vis: visitors.find((v) => v.person === ph.object.userData.person) }; return; }
    const mh = G.pick(p, pet.m.meshes, false)[0]; if (mh) { pending = { mine: true }; return; }
    steer = { target: G.groundAt(p) };
  };
  P.onMove = function (p, down) { if (hand.drag) { hand.move(p); return; } if (steer && down) { const g = G.groundAt(p); if (g) steer.target = g; } };
  P.onUp = function (p) {
    if (hand.drag) { const r = hand.up(p); if (r) launch(r); return; }
    steer = null;
    if (pending && p.tap) {
      if (pending.dog) petOther(pending.dog);
      else if (pending.vis) talkVisitor(pending.vis);
      else if (pending.mine) { pet.emote('heart', 1); pet.happy(2); pet.voice(); pet.excite = 1; }
    }
    pending = null;
  };
  P.onCancel = function () { steer = null; pending = null; };
  function petOther(d) {
    if (U.d2(d.pos.x, d.pos.z, me.x, me.z) > 6) { G.ui.toast('Walk closer to pet ' + d.name + '.'); return; }
    d.stop(); d.do((function* () { yield* d.face(me.x, me.z); d.setPose('sit'); d.eyeOverride = 'happy'; d.petT = 0; for (let i = 0; i < 6; i++) { d.petT = 0; d.petPart = 'head'; G.fx.spawn('heart', d.headWorld().add(new V3(0, 0.15, 0)), 1); yield* d.wait(0.3); } d.eyeOverride = null; d.excite = 1; d.voiceCd = 0; d.voice('happy'); })());
    if (pet.task === null || !pet.busy) { pet.emote('sweat', 1); pet.tiltT = 1; }
    const ow = d.owner; if (ow) { ow.person.lookAt = me; ow.person.waveT = 1; setTimeout(() => G.ui.toast((ow.key ? G.NPCS[ow.key].name : 'Their owner') + ': “' + U.pick([d.name + ' loves you!', 'Aww, ' + d.name + ' is melting!', 'You’re a natural!', d.name + ' says thank you!']) + '”'), 900); }
  }
  async function talkVisitor(v) {
    if (U.d2(v.person.pos.x, v.person.pos.z, me.x, me.z) > 6) { G.ui.toast('Walk closer to chat.'); return; }
    v.person.lookAt = me;
    if (v.key && G.NPCS[v.key].talk) { await G.ui.talk(v.key, { pet, play: (sec) => { const dg = v.dogs[0]; if (dg) { pet.stop(); dg.stop(); dg.do(playWith(dg, pet)); } } }); return; }
    const port = G.M.icons.raw(G.M.person(v.person.look).root, 'vis:' + JSON.stringify(v.person.look), { dir: new V3(0.25, 0.2, 1), radius: 0.6, center: new V3(0, 0.9, 0) });
    const dn = v.dogs[0] ? v.dogs[0].name : 'my dog';
    await G.ui.say(v.name, U.pick(G.PARK_LINES)(dn, pet.name), port);
    const c = await G.ui.ask(v.name, 'Want our dogs to play together?', ['Sure!', 'Maybe later']);
    if (c === 0) { const dg = v.dogs[0]; if (dg) { pet.stop(); dg.stop(); dg.do(playWith(dg, pet)); } await G.ui.say(v.name, 'Yay! Look at them go!', port); }
    G.ui.endDialog();
  }
  /* ---------------- update ---------------- */
  function placeCam(snap) {
    const portrait = G.aspect() < 0.9; const dist = portrait ? 7 : 5.4, h = portrait ? 4 : 3;
    const pos = me.clone().add(new V3(-Math.sin(camYaw) * dist, h, -Math.cos(camYaw) * dist));
    const look = me.clone().add(new V3(Math.sin(camYaw) * 3, 0.6, Math.cos(camYaw) * 3));
    if (snap) { cam.position.copy(pos); lookV.copy(look); } else { const k = 1 - Math.exp(-2.4 * G._dt); cam.position.lerp(pos, k); lookV.lerp(look, k); }
    cam.lookAt(lookV);
  }
  P.update = function (dt) {
    if (!pet) return; G._dt = dt;
    const K = G.input.keys || {}; const kx = (K.KeyD || K.ArrowRight ? 1 : 0) - (K.KeyA || K.ArrowLeft ? 1 : 0), kz = (K.KeyW || K.ArrowUp ? 1 : 0) - (K.KeyS || K.ArrowDown ? 1 : 0);
    let tgt = null; if (steer && steer.target) tgt = steer.target;
    if (kx || kz) { const f = new V3(Math.sin(camYaw), 0, Math.cos(camYaw)), r = new V3(-Math.cos(camYaw), 0, Math.sin(camYaw)); tgt = me.clone().addScaledVector(f, kz * 3).addScaledVector(r, kx * 3); }
    if (tgt) { const dx = tgt.x - me.x, dz = tgt.z - me.z, d = Math.hypot(dx, dz); if (d > 0.3) { meHead = Math.atan2(dx, dz); const sp = Math.min(3.4, d * 2) * dt; me.x += dx / d * sp; me.z += dz / d * sp; camYaw += U.angDiff(camYaw, meHead) * (1 - Math.exp(-1.2 * dt)); } }
    me.x = U.clamp(me.x, -FX + 1, FX - 1); me.z = U.clamp(me.z, -FZ + 1, FZ - 1);
    for (const c of colliders) { const dx = me.x - c.x, dz = me.z - c.z, d = Math.hypot(dx, dz); if (d < c.r + 0.4 && d > 1e-4) { me.x = c.x + dx / d * (c.r + 0.4); me.z = c.z + dz / d * (c.r + 0.4); } }
    pet.update(dt);
    for (const v of visitors) { v.person.update(dt); if (Math.random() < dt * 0.1) v.person.lookAt = U.chance(0.5) ? (v.dogs[0] || pet).pos : null; for (const d of v.dogs) d.update(dt); }
    const all = vdogs.concat([pet]);
    for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) { const a = all[i], b = all[j]; const dx = b.pos.x - a.pos.x, dz = b.pos.z - a.pos.z, d = Math.hypot(dx, dz), r = 0.3 * (a.S + b.S); if (d < r && d > 1e-4) { const k = (r - d) / d * 0.5; a.pos.x -= dx * k; a.pos.z -= dz * k; b.pos.x += dx * k; b.pos.z += dz * k; } }
    for (const f of flights) f.update(dt);
    hand.update(dt);
    for (const d of ducks) { d.a += d.s * dt; d.m.position.set(POND.x + Math.cos(d.a) * d.r, 0.06 + Math.sin(G.time * 2 + d.r) * 0.01, POND.z + Math.sin(d.a) * d.r); d.m.rotation.y = -d.a; }
    if (P.grassU) P.grassU.value = G.time;
    if (P.water) { P.water.offset.x += dt * 0.012; P.water.offset.y += dt * 0.007; }
    P.L.sun.position.set(me.x - 6, 14, me.z + 8); P.L.sun.target.position.copy(me);
    placeCam(false);
    // prompts
    let key = held ? 'held' : '';
    const nearGate = U.d2(me.x, me.z, GATE.x, GATE.z) < 4;
    const nearF = U.d2(me.x, me.z, FOUNT.x, FOUNT.z) < 3.5;
    key += (nearGate ? 'g' : '') + (nearF ? 'f' : '');
    if (key !== promptKey && !held) {
      promptKey = key; const list = [];
      if (nearF) list.push({ label: 'Fill the dog fountain', cls: 'pink', fn: () => { G.audio.play('pour'); G.fx.spawn('drop', FOUNT.clone().add(new V3(0.5, 0.4, 0)), 8); pet.d.thirst = Math.min(100, pet.d.thirst + 5); P.call(() => { pet.do((function* () { yield* pet.goto(FOUNT.x + 0.5, FOUNT.z + 0.9, { speed: 1.8 }); yield* pet.face(FOUNT.x + 0.5, FOUNT.z); pet.setPose('eat'); pet.lickT = 3; G.audio.play('lap'); yield* pet.wait(2.5); pet.d.thirst = 100; pet.happy(2); })()); }); } });
      if (nearGate) list.push({ label: 'Leave Dog Park', cls: 'orange', fn: () => G.go('walk', { from: 'park' }) });
      G.ui.prompts(list);
    }
  };
  P.onVoice = function (kind, id, p) { if (kind === 'name') P.call(); else { p.stop(); p.do((function* () { yield* p.face(me.x, me.z); p.lookCam = 3; yield* p.trick(id); p.happy(2); })()); } return true; };
  P.debug = () => ({ pet, visitors, vdogs, hand, flights, me });
  return P;
})();
