'use strict';
/* =========================================================
   Shiba Days — Title scene + Kennel (adoption)
   ========================================================= */
function outdoorLights(scene, o = {}) {
  const hemi = new THREE.HemisphereLight(0xfff4e0, 0x7a9a5a, 0.7); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff0d8, 1.25); sun.position.set(-4, 8, 6); sun.castShadow = true;
  const s = o.shadow || 8; sun.shadow.mapSize.set(G.mobile ? 1024 : 2048, G.mobile ? 1024 : 2048);
  Object.assign(sun.shadow.camera, { left: -s, right: s, top: s, bottom: -s, near: 1, far: 40 }); sun.shadow.bias = -0.0006; sun.shadow.radius = 3;
  scene.add(sun); scene.add(sun.target);
  return { hemi, sun };
}
G.outdoorLights = outdoorLights;
G.grassTex = function (season, rep = 8) {
  const base = { spring: '#8fca6a', summer: '#7cbf5a', autumn: '#a6b85a', winter: '#e6eef2' }[season] || '#7cbf5a';
  return G.canvasTex(256, 256, (g) => {
    g.fillStyle = base; g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 1400; i++) { const c = new THREE.Color(base).offsetHSL(U.rand(-0.02, 0.02), U.rand(-0.05, 0.05), U.rand(-0.07, 0.07)); g.fillStyle = c.getStyle(); g.fillRect(Math.random() * 256, Math.random() * 256, 2, U.rand(3, 7)); }
    if (season === 'autumn') for (let i = 0; i < 60; i++) { g.fillStyle = U.pick(['#e8823a', '#d9592f', '#f2b04b']); g.beginPath(); g.ellipse(Math.random() * 256, Math.random() * 256, 4, 2.5, Math.random() * 3, 0, 7); g.fill(); }
    if (season === 'spring') for (let i = 0; i < 40; i++) { g.fillStyle = U.pick(['#ffd1df', '#fff', '#ffe58a']); g.beginPath(); g.arc(Math.random() * 256, Math.random() * 256, 2, 0, 7); g.fill(); }
  }, { repeat: [rep, rep] });
};

/* ---------------- Title ---------------- */
G.scenes.title = (() => {
  const T = { music: 'title', hideNeeds: true };
  let scene, cam, pets = [], t = 0;
  T.init = function () {
    scene = new THREE.Scene(); T.scene = scene;
    scene.background = new THREE.Color('#f2a65a');
    scene.fog = new THREE.Fog('#f2a65a', 8, 16);
    cam = new THREE.PerspectiveCamera(36, G.aspect(), 0.1, 50); T.camera = cam;
    outdoorLights(scene, { shadow: 4 });
    const disk = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.8, 0.3, 64), G.M.mat('#ffffff', { map: G.grassTex('summer', 3), r: 1 })); disk.position.y = -0.15; disk.receiveShadow = true; scene.add(disk);
    const fl = G.M.flowers(40, 2.4); scene.add(fl);
    const specs = [['shiba', 'red', 'collar_red'], ['shiba', 'sesame', 'collar_blue'], ['shiba', 'blacktan', 'collar_pink'], ['cat', 'calico', null]];
    specs.forEach(([b, c, col], i) => {
      const p = new G.Pet({ name: 'x', breed: b, coat: c, mood: 90, acc: col ? { collar: col } : {} }, { npc: true });
      p.pos.set((i - 1.5) * 0.8, 0, (i % 2) * 0.4 - 0.2); p.heading = 0.2 * (i - 1.5);
      p.brain = (pp) => (function* () {
        const r = Math.random();
        if (r < 0.3) { yield* pp.goto(U.rand(-1.6, 1.6), U.rand(-1, 1)); yield* pp.face(cam.position.x, cam.position.z); pp.lookCam = 3; yield* pp.act('sit', U.rand(2, 4)); }
        else if (r < 0.45 && !pp.cat) { pp.lookCam = 2; yield* pp.act('bow', 1); pp.excite = 1; }
        else if (r < 0.6) { yield* pp.act('lie', 3); }
        else if (r < 0.7 && !pp.cat) yield* pp.zoomies(0, 0, 1.4, 1);
        else if (r < 0.8) { pp.lookCam = 3; yield* pp.face(cam.position.x, cam.position.z); pp.tiltT = 1.2; yield* pp.act('sit', 2); }
        else yield* pp.idleLook(2);
      })();
      p.bounds = (pp) => { const d = Math.hypot(pp.pos.x, pp.pos.z); if (d > 2.2) { pp.pos.x *= 2.2 / d; pp.pos.z *= 2.2 / d; } };
      scene.add(p.root); pets.push(p);
    });
  };
  T.enter = function () { };
  T.update = function (dt) {
    t += dt;
    for (const p of pets) p.update(dt);
    const portrait = G.aspect() < 0.9;
    const r = portrait ? 7.4 : 5.2, a = Math.sin(t * 0.15) * 0.5;
    cam.position.set(Math.sin(a) * r, portrait ? 2.6 : 2.0, Math.cos(a) * r); cam.lookAt(0, portrait ? -0.6 : -0.1, 0);
  };
  return T;
})();

/* ---------------- Kennel ---------------- */
G.scenes.kennel = (() => {
  const K = { music: 'kennel', hideNeeds: true };
  let scene, cam, pups = [], sel = null, first = false, lookV = new V3(0, 0.3, 0);
  K.init = function () {
    scene = new THREE.Scene(); K.scene = scene;
    scene.background = new THREE.Color('#bfe4ff'); scene.fog = new THREE.Fog('#bfe4ff', 14, 30);
    cam = new THREE.PerspectiveCamera(40, G.aspect(), 0.1, 60); K.camera = cam;
    outdoorLights(scene, { shadow: 6 });
    const season = G.season();
    const g = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), G.M.mat('#ffffff', { map: G.grassTex(season, 12), r: 1 })); g.rotation.x = -Math.PI / 2; g.receiveShadow = true; scene.add(g);
    // fence pen
    const W = 6, D = 4.4;
    [[0, -D / 2, W, 0], [-W / 2, 0, D, Math.PI / 2], [W / 2, 0, D, Math.PI / 2]].forEach(([x, z, l, r]) => { const f = G.M.fence(l); f.position.set(x, 0, z); f.rotation.y = r; scene.add(f); });
    // kennel house
    const kh = G.M.house({ w: 2.6, d: 1.8, h: 1.4, roofH: 0.9, wall: '#fff2dc', roof: '#e2574c', windows: [], sign: 'Maple Kennel', signCol: '#e2574c' });
    kh.position.set(-1.6, 0, -3.6); scene.add(kh);
    const t1 = G.M.tree(season, 'round'); t1.position.set(3.8, 0, -3.5); scene.add(t1);
    const t2 = G.M.tree(season, 'round'); t2.position.set(-4.4, 0, -2.0); t2.scale.setScalar(0.9); scene.add(t2);
    const fl = G.M.flowers(30, 1.2); fl.position.set(2.2, 0, -1.6); scene.add(fl);
    const bowl = G.M.bowl('#4aa6e0'); bowl.position.set(2.2, 0, 1.2); scene.add(bowl);
    for (let i = 0; i < 3; i++) { const b = G.M.item(U.pick(['ball', 'duck', 'squeaky'])); b.position.set(U.rand(-2, 2), 0.06, U.rand(-1.2, 1.2)); scene.add(b); }
    const hills = new THREE.Mesh(new THREE.SphereGeometry(18, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), G.M.mat(season === 'winter' ? '#e8f0f6' : '#8fc46a', { r: 1 })); hills.scale.set(1.6, 0.25, 1); hills.position.set(0, -0.5, -26); scene.add(hills);
  };
  function candidates() {
    const out = [];
    const pers = Object.keys(G.PERSONALITIES);
    const seed = G.state.day * 7 + G.state.pets.length * 13;
    const r = (i) => U.hash(seed, i, 3);
    const coats = G.PET_COATS.dog.slice();
    for (let i = 0; i < 3; i++) out.push({ breed: r(i + 10) < 0.25 ? 'mame' : 'shiba', coat: coats[(Math.floor(r(i) * 4) + i) % 4], personality: pers[Math.floor(r(i + 5) * pers.length)], sex: r(i + 20) < 0.5 ? 'boy' : 'girl', price: G.state.pets.length ? 200 : 0 });
    const cc = G.PET_COATS.cat;
    for (let i = 0; i < 2; i++) out.push({ breed: 'cat', coat: cc[(Math.floor(r(i + 30) * cc.length) + i * 2) % cc.length], personality: pers[Math.floor(r(i + 40) * pers.length)], sex: r(i + 50) < 0.5 ? 'boy' : 'girl', price: G.state.pets.length ? 150 : 0 });
    if (G.state.npc.nori && G.state.npc.nori.fed >= 3 && !G.state.npc.nori.adopted) out.push({ breed: 'cat', coat: 'black', personality: 'proud', sex: 'girl', price: 0, nori: true, name: 'Nori' });
    return out;
  }
  K.enter = function (opts) {
    first = !!opts.first || !G.state.pets.length;
    for (const p of pups) scene.remove(p.root); pups = []; sel = null;
    candidates().forEach((c, i) => {
      const p = new G.Pet(Object.assign({ name: c.name || '', mood: 85, acc: {} }, c), { npc: true }); p.cand = c;
      p.pos.set(U.rand(-2.2, 2.2), 0, U.rand(-1.4, 1.4)); p.heading = Math.random() * 6;
      p.brain = (pp) => (function* () {
        if (pp === sel) { pp.lookCam = 3; yield* pp.face(cam.position.x, cam.position.z); yield* pp.act(pp.cat ? 'sit' : U.pick(['sit', 'bow', 'sit']), 2); if (!pp.cat && U.chance(0.4)) { pp.voice(); pp.excite = 1; } return; }
        const r = Math.random();
        if (r < 0.35) { yield* pp.goto(U.rand(-2.4, 2.4), U.rand(-1.6, 1.6), { speed: U.pick([0.8, 1.2, 2]) }); }
        else if (r < 0.5) { pp.lookCam = 3; yield* pp.face(cam.position.x, cam.position.z); yield* pp.act('sit', 2); }
        else if (r < 0.6) yield* pp.act('lie', 3);
        else if (r < 0.7) yield* pp.sniffAround(1);
        else if (r < 0.78 && !pp.cat) yield* pp.zoomies(0, 0, 1.3, 1);
        else if (r < 0.85 && pp.cat) yield* pp.groom();
        else if (r < 0.92) { const o = U.pick(pups.filter((x) => x !== pp)); if (o) { yield* pp.goto(o.pos.x + 0.4, o.pos.z, { timeout: 4 }); yield* pp.face(o.pos.x, o.pos.z); pp.setPose(pp.cat ? 'sit' : 'bow'); yield* pp.wait(1); } }
        else yield* pp.scratch();
      })();
      p.bounds = (pp) => { pp.pos.x = U.clamp(pp.pos.x, -2.7, 2.7); pp.pos.z = U.clamp(pp.pos.z, -1.9, 2.0); };
      scene.add(p.root); pups.push(p);
    });
    G.ui.hint(first ? 'Welcome to Maple Hill! Tap a puppy or kitten to meet them.' : 'Tap a pet to meet them.', 0);
    cam.position.set(0, 3.6, 6.4);
  };
  K.exit = function () { G.ui.hint(null); G.ui.prompts([]); };
  K.dock = () => (first ? [] : [{ label: 'Home', icon: 'home', cls: 'go', fn: () => G.go('home') }]);
  K.onDown = function () { };
  K.onUp = function (p) {
    if (!p.tap) return;
    const hit = G.pick(p, pups.flatMap((x) => x.m.meshes), false)[0];
    if (!hit) { sel = null; G.ui.prompts([]); return; }
    const pet = hit.object.userData.pet; select(pet);
  };
  function select(pet) {
    sel = pet; pet.stop(); pet.emote('heart', 1.2); pet.voice(); pet.excite = 1;
    const c = pet.cand; const B = G.BREEDS[c.breed];
    G.ui.hint((c.nori ? 'Nori the street cat! ' : '') + (c.sex === 'boy' ? 'Boy' : 'Girl') + ' · ' + B.name + ' · ' + G.COATS[c.coat].name + ' · ' + G.PERSONALITIES[c.personality].name + ': ' + G.PERSONALITIES[c.personality].desc, 0);
    const full = G.state.pets.length >= 4;
    G.ui.prompts([{ label: full ? 'Your home is full (4/4)' : c.price ? 'Adopt (' + c.price + ' coins)' : 'Adopt me!', cls: 'pink', fn: () => adopt(pet) }]);
  }
  async function adopt(pet) {
    const c = pet.cand;
    if (G.state.pets.length >= 4) { G.ui.toast('You can have up to 4 pets.'); return; }
    if (G.state.coins < c.price) { G.ui.toast('Not enough coins. Win Disc Cups or find presents on walks!'); return; }
    const res = await G.ui.nameModal({ title: 'Name your new ' + (c.breed === 'cat' ? 'kitten' : 'puppy'), sub: 'Choose a name and whether they’re a boy or a girl.', value: c.name || U.pick(G.PET_NAMES), sexVal: c.sex, cancel: true });
    if (!res) return;
    G.state.coins -= c.price;
    const d = G.newPetData({ name: res.name, breed: c.breed, coat: c.coat, sex: res.sex, personality: c.personality, acc: c.breed === 'cat' ? { collar: 'collar_pink' } : { collar: 'collar_red' } });
    if (c.nori) { G.state.npc.nori.adopted = true; }
    if (c.breed === 'cat' && !G.state.acc.collar_pink) G.state.acc.collar_pink = 1;
    G.state.pets.push(d); G.state.active = d.id;
    G.audio.play('fanfare'); G.ui.banner('Welcome home,', res.name + '!', 2200);
    G.save();
    setTimeout(() => G.go('home'), 1600);
  }
  K.update = function (dt) {
    for (const p of pups) p.update(dt);
    const portrait = G.aspect() < 0.9;
    let pos = portrait ? new V3(0, 5.2, 9.5) : new V3(0, 3.6, 6.6), look = new V3(0, 0.2, 0);
    if (sel) { look = sel.pos.clone().setY(0.3); pos = look.clone().add(portrait ? new V3(0, 1.5, 3.4) : new V3(0, 1.1, 2.4)); }
    cam.position.lerp(pos, 1 - Math.exp(-2.5 * dt)); lookV.lerp(look, 1 - Math.exp(-2.5 * dt)); cam.lookAt(lookV);
  };
  return K;
})();
