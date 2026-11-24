'use strict';
/* =========================================================
   Shiba Days — Maple Pets (walk-in shop)
   ========================================================= */
G.NPCS.daisuke.talk = async function (D) {
  if (!D.flag('met')) { D.setFlag('met'); await D.say('Welcome to Maple Pets! I’m Daisuke. That’s Kiwi on the perch. He’s our security system. And our marketing department.'); D.friend(1); }
  const c = await D.ask(U.pick(['Looking for anything special?', 'Need a recommendation?', 'Kiwi, quiet. We have a customer.']), ['What’s popular?', 'Any tips for my pet?', 'Tell me about Kiwi']);
  if (c === 0) await D.say(U.pick(['Frog hats. Always frog hats. I don’t understand it, but I respect it.', 'Pro Discs are flying off the shelves. Literally, once. A customer tested one indoors.', 'Shampoo! Shibas pretend they hate baths, but they love being clean.', 'The Squeaky Carrot. Dogs go wild. Owners go slightly less wild.']));
  else if (c === 1) await D.say(U.pick(['Treats work best right after a good trick. Timing is everything!', 'Bored pets get grumpy. Rotate the toys so they feel new.', 'Deluxe Kibble fills the bowl and the heart.', 'Cats love the Toy Mouse. There’s catnip inside. It’s basically a party.', 'A happy pup listens better in contests. Lots of pets before a Disc Cup!']));
  else { await D.say('Kiwi is a 20-year-old parrot. He learned to say "frog hat" in a week. It took me three years to learn the cash register.'); D.once('kiwi', () => D.friend(1)); }
};
G.scenes.shop = (() => {
  const S = { music: 'shop' };
  let scene, cam, pet, from = 'home', dai, kiwi, fish = [], lookV = new V3(), shelves = [], focusPos = null;
  S.init = function () {
    scene = new THREE.Scene(); S.scene = scene; scene.background = new THREE.Color('#3b4a3a');
    cam = new THREE.PerspectiveCamera(48, G.aspect(), 0.05, 50); S.camera = cam;
    scene.add(new THREE.HemisphereLight(0xfff8ec, 0x6a7a5a, 0.75));
    const key = new THREE.DirectionalLight(0xfff0dc, 0.85); key.position.set(-2, 6, 5); key.castShadow = true; key.shadow.mapSize.set(1024, 1024); Object.assign(key.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6 }); key.shadow.bias = -0.0006; scene.add(key);
    for (const x of [-2, 2]) { const pl = new THREE.PointLight(0xfff2d6, 0.35, 7, 1.5); pl.position.set(x, 2.8, 0); scene.add(pl); }
    build();
  };
  function build() {
    const M = G.M; const st = new THREE.Group();
    const ft = G.canvasTex(256, 256, (g) => { g.fillStyle = '#c9ad84'; g.fillRect(0, 0, 256, 256); for (let r = 0; r < 8; r++) for (let c = 0; c < 4; c++) { g.fillStyle = U.pick(['#e8d2b0', '#dcc39c', '#e2cba8']); g.fillRect(c * 64 + (r % 2) * 32, r * 32, 62, 30); } }, { repeat: [4, 4] });
    const fl = new THREE.Mesh(new THREE.PlaneGeometry(9, 8), M.mat('#fff', { map: ft, r: 0.6 })); fl.rotation.x = -Math.PI / 2; fl.receiveShadow = true; scene.add(fl);
    const wt = G.canvasTex(128, 128, (g) => { g.fillStyle = '#d8efd0'; g.fillRect(0, 0, 128, 128); g.fillStyle = '#cbe6c0'; for (let x = 0; x < 128; x += 32) g.fillRect(x, 0, 14, 128); g.fillStyle = 'rgba(121,178,90,.35)'; for (let y = 20; y < 128; y += 40) for (let x = 8; x < 128; x += 32) { g.beginPath(); g.ellipse(x, y, 5, 4, 0, 0, 7); g.fill(); } }, { repeat: [5, 2] });
    const wm = M.mat('#fff', { map: wt, r: 0.95 });
    const back = new THREE.Mesh(new THREE.PlaneGeometry(9, 4), wm); back.position.set(0, 2, -3.6); scene.add(back);
    const left = new THREE.Mesh(new THREE.PlaneGeometry(8, 4), wm); left.rotation.y = Math.PI / 2; left.position.set(-4.5, 2, 0); scene.add(left);
    const right = left.clone(); right.rotation.y = -Math.PI / 2; right.position.x = 4.5; scene.add(right);
    // shelves with real products
    const wood = M.mat('#b9773f', { r: 0.7 });
    const shelfUnit = (x, z, ry, tab, items) => {
      const u = new THREE.Group(); u.position.set(x, 0, z); u.rotation.y = ry; scene.add(u);
      const sideG = new THREE.BoxGeometry(0.08, 2.2, 0.5);
      for (const sx of [-1, 1]) { const sd = new THREE.Mesh(sideG, wood); sd.position.set(sx * 1.0, 1.1, 0); sd.castShadow = true; u.add(sd); }
      const backP = new THREE.Mesh(new THREE.BoxGeometry(2.08, 2.2, 0.04), M.mat('#8a5a3a')); backP.position.set(0, 1.1, -0.23); u.add(backP);
      for (let r = 0; r < 4; r++) { const sh = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.05, 0.48), wood); sh.position.set(0, 0.25 + r * 0.6, 0); sh.receiveShadow = true; sh.castShadow = true; u.add(sh); }
      items.forEach((id, i) => { const r = i % 3, c = Math.floor(i / 3); for (let k = 0; k < 2; k++) { const m = M.item(id); m.position.set(-0.7 + c * 0.45 + k * 0.18, 0.29 + r * 0.6 + (G.ITEMS[id] && G.ITEMS[id].cat === 'acc' ? 0.08 : 0), 0.05 - k * 0.05); m.rotation.y = U.rand(-0.4, 0.4); u.add(m); } });
      const lab = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.26), M.mat('#fff', { map: G.textTex({ food: 'FOOD & TREATS', toy: 'TOYS', acc: 'DRESS-UP', care: 'CARE' }[tab], { font: '700 48px Fredoka, sans-serif', bg: '#79b25a', color: '#fff', pad: 12, radius: 12 }) })); lab.position.set(0, 2.35, 0.02); u.add(lab);
      u.userData.tab = tab; shelves.push(u);
    };
    shelfUnit(-3.1, -3.25, 0, 'food', ['kibble', 'premium', 'catfood', 'biscuit', 'jerky', 'salmon', 'potato', 'cake', 'biscuit', 'jerky', 'kibble', 'premium']);
    shelfUnit(-0.9, -3.25, 0, 'toy', ['ball', 'squeaky', 'duck', 'rope', 'ring', 'carrot', 'yarn', 'mouse', 'disc', 'prodisc', 'ball', 'duck']);
    shelfUnit(-4.2, -0.8, Math.PI / 2, 'care', ['shampoo', 'brush', 'shampoo', 'brush', 'shampoo', 'shampoo']);
    // hat display: a mannequin shiba bust
    const disp = new THREE.Group(); disp.position.set(-3.4, 0, 1.4); scene.add(disp);
    const tbl = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.8, 24), M.mat('#fff7ea')); tbl.position.y = 0.4; tbl.castShadow = true; disp.add(tbl);
    const bust = G.M.pet({ breed: 'shiba', coat: 'cream' }); bust.root.traverse((o) => { if (o.isMesh) o.material = M.mat('#e8e2d8', { r: 0.6 }); }); bust.root.position.y = 0.8; bust.root.rotation.y = 0.6; disp.add(bust.root);
    bust.slots.head.add(G.M.acc('frog')); bust.slots.face.add(G.M.acc('glasses')); bust.slots.neck.add(G.M.acc('bowtie'));
    const hatSign = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.24), M.mat('#fff', { map: G.textTex('NEW! Frog Hat', { font: '700 44px Fredoka, sans-serif', bg: '#fff3a0', color: '#3b2a1f', pad: 10, radius: 10 }) })); hatSign.position.set(0, 0.86, 0.62); hatSign.rotation.x = -0.4; disp.add(hatSign);
    disp.userData.tab = 'acc'; shelves.push(disp);
    // counter + register
    const counter = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.0, 0.8), M.mat('#79b25a', { r: 0.6 })); counter.position.set(2.6, 0.5, -1.4); counter.castShadow = true; counter.receiveShadow = true; st.add(counter);
    const ctop = new THREE.Mesh(new THREE.BoxGeometry(2.75, 0.06, 0.92), M.mat('#f6efe2', { r: 0.4 })); ctop.position.set(2.6, 1.03, -1.4); st.add(ctop);
    const reg = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.3, 0.4), M.mat('#3b3f4a', { r: 0.4 })); reg.position.set(2.2, 1.21, -1.45); st.add(reg);
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.16), new THREE.MeshBasicMaterial({ map: G.textTex('THANK YOU', { font: '700 40px monospace', bg: '#1d2a24', color: '#9fe08a', pad: 8, radius: 4 }) })); scr.position.set(2.2, 1.42, -1.3); scr.rotation.x = -0.4; scene.add(scr);
    const jar = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.26, 16), M.mat('#dff3ff', { op: 0.5, r: 0.05 })); jar.position.set(3.2, 1.19, -1.35); scene.add(jar);
    for (let i = 0; i < 6; i++) { const b = M.item('biscuit'); b.scale.setScalar(0.6); b.position.set(3.2 + U.rand(-0.05, 0.05), 1.1 + i * 0.03, -1.35 + U.rand(-0.05, 0.05)); b.rotation.set(Math.random(), Math.random(), 0); scene.add(b); }
    // kibble pyramid + ball bin + fish tank + sale banner + plants
    for (let r = 0; r < 3; r++) for (let i = 0; i < 3 - r; i++) { const b = M.item(r % 2 ? 'premium' : 'kibble'); b.scale.setScalar(1.6); b.position.set(1.4 + i * 0.3 + r * 0.15, r * 0.36, 1.6); scene.add(b); }
    const bin = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.4, 0.6, 20, 1, true), M.mat('#4aa6e0', { side: THREE.DoubleSide })); bin.position.set(3.4, 0.3, 1.2); scene.add(bin);
    for (let i = 0; i < 14; i++) { const b = M.item('ball'); b.position.set(3.4 + U.rand(-0.3, 0.3), 0.45 + Math.random() * 0.15, 1.2 + U.rand(-0.3, 0.3)); b.rotation.set(Math.random() * 3, Math.random() * 3, 0); scene.add(b); }
    const tank = new THREE.Group(); tank.position.set(4.1, 0, -0.1); tank.rotation.y = -Math.PI / 2; scene.add(tank);
    const tstand = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.8, 0.6), M.mat('#3b2a1f')); tstand.position.y = 0.4; tank.add(tstand);
    const water = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.75, 0.5), M.mat('#7cc8f0', { op: 0.4, r: 0.05 })); water.position.y = 1.2; tank.add(water);
    const sand = new THREE.Mesh(new THREE.BoxGeometry(1.48, 0.08, 0.48), M.mat('#e8d2a8')); sand.position.y = 0.86; tank.add(sand);
    for (let i = 0; i < 4; i++) { const wd = new THREE.Mesh(new THREE.ConeGeometry(0.03, U.rand(0.3, 0.5), 5), M.mat('#5e9e44')); wd.position.set(-0.6 + i * 0.35, 1.05, -0.1); tank.add(wd); }
    for (let i = 0; i < 5; i++) { const f = new THREE.Group(); const bd = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), M.mat(U.pick(['#ff8a3c', '#f2c24b', '#4aa6e0', '#f39bb0']))); bd.scale.set(1.5, 1, 0.6); f.add(bd); const tl = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.06, 4), bd.material); tl.rotation.z = Math.PI / 2; tl.position.x = -0.08; f.add(tl); tank.add(f); fish.push({ m: f, ph: Math.random() * 6, y: U.rand(1.0, 1.45), sp: U.rand(0.5, 1) }); }
    const ban = new THREE.Mesh(new THREE.PlaneGeometry(3, 0.6), M.mat('#fff', { map: G.textTex('SALE! Everything adorable', { font: '700 60px Fredoka, sans-serif', bg: '#e2574c', color: '#fff', pad: 18 }), side: THREE.DoubleSide })); ban.position.set(1.4, 3.1, -3.5); scene.add(ban);
    for (const [x, z] of [[4, -3.1], [-4, 3]]) { const b = G.M.bush('#5e9e44', 0.8); b.position.set(x, 0.3, z); st.add(b); const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.24, 0.4, 14), M.mat('#c8622a')); pot.position.set(x, 0.2, z); st.add(pot); }
    const mat2 = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.9), M.mat('#fff', { map: G.textTex('WELCOME', { font: '700 56px Fredoka, sans-serif', bg: '#7a4a24', color: '#fff7ea', pad: 16, radius: 8 }) })); mat2.rotation.x = -Math.PI / 2; mat2.position.set(0, 0.01, 3.2); scene.add(mat2);
    scene.add(G.M.bake(st));
    // people + parrot
    dai = new G.Person('daisuke', { key: 'daisuke' }); dai.pos.set(2.6, 0, -2.25); scene.add(dai.root);
    kiwi = new THREE.Group(); kiwi.position.set(3.85, 0, -1.4); scene.add(kiwi);
    const perch = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.7, 6), M.mat('#7a5236')); perch.position.y = 0.85; kiwi.add(perch);
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.5, 6), M.mat('#7a5236')); bar.rotation.z = Math.PI / 2; bar.position.y = 1.7; kiwi.add(bar);
    const bird = new THREE.Group(); bird.position.y = 1.83; kiwi.add(bird); kiwi.userData.bird = bird;
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.12, 14, 10), M.mat('#3fae5a', { r: 0.6 })); body.scale.set(0.85, 1.2, 0.9); bird.add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 10), M.mat('#e2574c', { r: 0.6 })); head.position.set(0, 0.16, 0.03); bird.add(head);
    const beak = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.07, 8), M.mat('#f2c24b')); beak.rotation.x = Math.PI / 2 + 0.4; beak.position.set(0, 0.14, 0.11); bird.add(beak);
    for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.014, 6, 6), M.mat('#111')); e.position.set(s * 0.045, 0.18, 0.08); bird.add(e); const wg = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), M.mat('#2f8ac8', { r: 0.6 })); wg.scale.set(0.4, 1, 0.8); wg.position.set(s * 0.1, -0.01, 0); bird.add(wg); }
    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.25, 0.03), M.mat('#2f8ac8')); tail.position.set(0, -0.2, -0.06); tail.rotation.x = -0.3; bird.add(tail);
  }
  S.enter = function (opts = {}) {
    from = opts.from || 'home';
    pet = G.activePet(); if (!pet) { setTimeout(() => G.go('home'), 50); return; }
    scene.add(pet.root); pet.stop(); pet.ctl = null; pet.baseY = 0; pet.bounds = (p) => { p.pos.x = U.clamp(p.pos.x, -3.5, 3.4); p.pos.z = U.clamp(p.pos.z, -2.4, 3.2); };
    pet.pos.set(-0.4, 0, 2.6); pet.heading = Math.PI;
    pet.brain = (p) => (function* () { const r = Math.random(); if (r < 0.35) { yield* p.goto(U.rand(-2, 2), U.rand(0, 2.8), { speed: 0.8 }); yield* p.sniffAround(1); } else if (r < 0.55) { p.lookTarget = kiwi.userData.bird.getWorldPosition(new V3()); p.tiltT = 1.2; yield* p.act('sit', 2.5); p.lookTarget = null; } else { p.lookCam = 3; yield* p.act('sit', U.rand(2, 4)); } })();
    cam.position.set(0, 2.2, 5.6); lookV.set(0, 1.0, -1); focusPos = null;
    G.audio.play('door');
    setTimeout(() => G.ui.hint('Tap a shelf to browse. Tap Kiwi the parrot to say hi!', 3500), 600);
  };
  S.exit = function () { if (pet) { scene.remove(pet.root); pet.stop(); pet.lookTarget = null; } G.ui.hint(null); };
  S.dock = () => [
    { label: 'Shop', icon: 'bag', fn: () => G.ui.shop() },
    { label: 'Chat', icon: 'chat', fn: talk },
    { label: 'Leave', icon: 'door', cls: 'go', fn: () => G.go(from === 'walk' ? 'walk' : 'home', { from: 'shop' }) },
  ];
  async function talk() { focusPos = dai.pos.clone().setY(1.1); dai.lookAt = cam.position; const iv = setInterval(() => { if (!$('#dialog').classList.contains('hidden')) dai.talking = 0.3; }, 250); await G.ui.talk('daisuke', { pet }); clearInterval(iv); focusPos = null; dai.lookAt = null; }
  const KIWI = ['FROG HAT! FROG HAT!', 'Hello! Hello!', 'Good dog! Squawk!', 'Ribbit! Ribbit!', 'Buy something! ...Please!', 'Pretty bird! PRETTY BIRD!', 'Who’s a good boy?', 'SQUIRREL! ...just kidding.'];
  S.onDown = function () { };
  S.onUp = function (p) {
    if (!p.tap) return;
    if (G.pick(p, [kiwi], true)[0]) { G.audio.play('quack'); G.audio.play('whistle'); G.ui.toast('Kiwi: “' + U.pick(KIWI) + '”'); kiwi.userData.flap = 1; pet.lookTarget = kiwi.userData.bird.getWorldPosition(new V3()); pet.emote('bang', 0.8); setTimeout(() => (pet.lookTarget = null), 1500); return; }
    if (G.pick(p, [dai.root], true)[0]) { talk(); return; }
    if (G.pick(p, pet.m.meshes, false)[0]) { pet.emote('heart', 1); pet.voice(); pet.happy(1); return; }
    const sh = G.pick(p, shelves, true)[0];
    if (sh) { let o = sh.object; while (o && !o.userData.tab) o = o.parent; if (o) { G.audio.play('pop'); G.ui.shop(o.userData.tab); } }
  };
  S.update = function (dt) {
    if (!pet) return;
    pet.update(dt); dai.update(dt);
    if (Math.random() < dt * 0.2) dai.lookAt = U.chance(0.5) ? cam.position : pet.pos;
    const bird = kiwi.userData.bird; kiwi.userData.flap = Math.max(0, (kiwi.userData.flap || 0) - dt);
    bird.rotation.y = Math.sin(G.time * 0.7) * 0.6; bird.position.y = 1.83 + kiwi.userData.flap * Math.abs(Math.sin(G.time * 25)) * 0.08; bird.children[0].rotation.z = 0;
    if (Math.random() < dt * 0.03) { G.ui.toast('Kiwi: “' + U.pick(KIWI) + '”'); kiwi.userData.flap = 0.6; }
    for (const f of fish) { f.ph += dt * f.sp; f.m.position.set(Math.sin(f.ph) * 0.6, f.y + Math.sin(f.ph * 2.3) * 0.04, Math.cos(f.ph * 0.7) * 0.15); f.m.rotation.y = Math.cos(f.ph) > 0 ? 0 : Math.PI; }
    const portrait = G.aspect() < 0.9;
    let pos = portrait ? new V3(0, 3.0, 7.4) : new V3(0, 2.2, 5.6), look = new V3(0, 1.0, -1);
    if (focusPos) { look = focusPos.clone(); pos = look.clone().add(new V3(-0.8, 0.4, 2.6)); }
    const k = 1 - Math.exp(-2.4 * dt); cam.position.lerp(pos, k); lookV.lerp(look, k); cam.lookAt(lookV);
  };
  return S;
})();
