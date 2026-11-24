'use strict';
/* =========================================================
   Shiba Days — Paw & Bean Café
   ========================================================= */
G.NPCS.yuki.talk = async function (D) {
  if (!D.flag('met')) { D.setFlag('met'); await D.say('Welcome to Paw & Bean! I’m Yuki. Pets eat free... just kidding, but they do get the best seats.'); D.friend(1); }
  const c = await D.ask(U.pick(['What can I get started for you?', 'Back again? I saved you the window seat.', 'The espresso machine is singing today.']), ['Any recommendations?', 'Can you do latte art?', 'How’s business?']);
  if (c === 0) { const sp = G.cafeSpecial(); await D.say('Today’s special is the ' + sp.name + ', 30% off! ' + (sp.who === 'pet' ? D.name + ' will love it.' : 'It’s my favorite.')); }
  else if (c === 1) {
    if (!D.flag('art')) { D.setFlag('art'); await D.say('Can I?! Watch this... a little shiba face. Ears, eyebrows, and... the tail swirl!'); await D.say('Ta-da! Your next latte will have a pup on it. On the house this once.'); D.give('biscuit', 2); D.friend(1); }
    else await D.say(U.pick(['I’m practicing a corgi next. The legs are tricky. Too short for the foam!', 'Yesterday I made a cat. Matcha was not impressed.']));
  } else { await D.say(U.pick(['Busy mornings, quiet afternoons. Matcha sleeps through both.', 'Mrs. Kato comes in every day for two pup-cups. Dango and Udon run this town.', 'We just started baking peanut cookies for dogs. They vanish by noon!'])); D.once('chat', () => D.friend(1)); }
};
G.NPCS.ito.talk = async function (D) {
  if (!D.flag('met')) { D.setFlag('met'); await D.say('Hm? Oh, hello. Ito. I study animal behavior at the university. And drink too much coffee.'); D.friend(1); }
  const facts = [
    'Dogs can follow a pointing finger, something even chimpanzees struggle with. They’ve been reading us for thousands of years.',
    'A dog’s nose has hundreds of millions of scent receptors. To ' + D.name + ', this café is a thousand stories at once.',
    'Cats usually save their meows for humans. Between themselves they mostly use body language.',
    'That slow blink a cat gives you? A sign of trust. Try blinking slowly back at Matcha.',
    'Play bows, front down and tail up, mean "everything after this is just for fun!"',
    'Dogs often yawn when they’re a bit unsure, not just when sleepy. A little calming signal.',
    'Puppies learn best in short, happy sessions. Praise right away. Timing is everything!',
  ];
  const c = await D.ask('Care for a little animal fact?', ['Yes please!', 'What are you reading?', 'Not right now']);
  if (c === 0) { await D.say(U.pick(facts)); D.once('fact', () => D.friend(1)); }
  else if (c === 1) { await D.say(U.pick(['"The Secret Lives of Neighborhood Cats". Matcha is in chapter four, apparently.', 'A thesis on tail wagging. Did you know dogs wag a bit more to the right when they’re happy?'])); }
  else await D.say('Of course. Enjoy your drink.');
};
G.cafeSpecial = function () { const d = new Date(); return G.CAFE[(d.getDate() + d.getMonth()) % G.CAFE.length]; };

G.scenes.cafe = (() => {
  const C = { music: 'cafe' };
  let scene, cam, pet = null, from = 'home', yuki, ito, matcha, table, onTable = [], lookV = new V3(), focusPos = null, busy = false;
  C.init = function () {
    scene = new THREE.Scene(); C.scene = scene; scene.background = new THREE.Color('#3b2a1f');
    cam = new THREE.PerspectiveCamera(46, G.aspect(), 0.05, 50); C.camera = cam;
    scene.add(new THREE.HemisphereLight(0xffe8cc, 0x5a3a2a, 0.65));
    const key = new THREE.DirectionalLight(0xffe0b8, 0.9); key.position.set(-3, 6, 4); key.castShadow = true; key.shadow.mapSize.set(1024, 1024);
    Object.assign(key.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6, near: 1, far: 20 }); key.shadow.bias = -0.0006; scene.add(key);
    for (const x of [-2.2, 0, 2.2]) { const pl = new THREE.PointLight(0xffc27a, 0.45, 6, 1.5); pl.position.set(x, 2.6, -0.5); scene.add(pl); }
    build();
  };
  function build() {
    const M = G.M; const st = new THREE.Group();
    const floorT = G.canvasTex(256, 256, (g) => { for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { g.fillStyle = (x + y) % 2 ? '#e9d8bf' : '#7a5236'; g.fillRect(x * 32, y * 32, 32, 32); } }, { repeat: [4, 4] });
    const fl = new THREE.Mesh(new THREE.PlaneGeometry(9, 8), M.mat('#fff', { map: floorT, r: 0.5 })); fl.rotation.x = -Math.PI / 2; fl.receiveShadow = true; scene.add(fl);
    const wallT = G.canvasTex(128, 128, (g) => { g.fillStyle = '#5e8a6a'; g.fillRect(0, 0, 128, 128); g.fillStyle = '#6a9676'; for (let x = 0; x < 128; x += 16) g.fillRect(x, 0, 8, 128); }, { repeat: [6, 2] });
    const wm = M.mat('#fff', { map: wallT, r: 0.9 });
    const back = new THREE.Mesh(new THREE.PlaneGeometry(9, 4), wm); back.position.set(0, 2, -3.6); back.receiveShadow = true; scene.add(back);
    const left = new THREE.Mesh(new THREE.PlaneGeometry(8, 4), wm); left.rotation.y = Math.PI / 2; left.position.set(-4.5, 2, 0); scene.add(left);
    const right = left.clone(); right.rotation.y = -Math.PI / 2; right.position.x = 4.5; scene.add(right);
    const wain = new THREE.Mesh(new THREE.PlaneGeometry(9, 1.1), M.mat('#7a5236', { r: 0.7 })); wain.position.set(0, 0.55, -3.58); scene.add(wain);
    // counter
    const counter = new THREE.Mesh(new THREE.BoxGeometry(4.6, 1.05, 0.8), M.mat('#a8683a', { r: 0.6 })); counter.position.set(0.6, 0.525, -2.4); counter.castShadow = true; counter.receiveShadow = true; st.add(counter);
    const ctop = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.06, 0.95), M.mat('#f6efe2', { r: 0.3 })); ctop.position.set(0.6, 1.08, -2.4); ctop.castShadow = true; st.add(ctop);
    const mach = new THREE.Group(); mach.position.set(1.8, 1.11, -2.55); st.add(mach);
    const mb = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.55, 0.45), M.mat('#c9d2dc', { r: 0.25, m: 0.8 })); mb.position.y = 0.275; mach.add(mb);
    const mt = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.08, 0.47), M.mat('#e2574c', { r: 0.4 })); mt.position.y = 0.58; mach.add(mt);
    for (const s of [-1, 1]) { const sp = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.12, 8), M.mat('#3b2a1f')); sp.position.set(s * 0.15, 0.1, 0.25); mach.add(sp); }
    const disp = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.45, 0.6), M.mat('#dff3ff', { r: 0.05, op: 0.35 })); disp.position.set(-0.6, 1.33, -2.4); scene.add(disp);
    const pastryCols = ['#f2c24b', '#c98a4b', '#f39bb0', '#fff4ea', '#8fbf5a'];
    for (let i = 0; i < 10; i++) { const p = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 8), M.mat(U.pick(pastryCols), { r: 0.8 })); p.scale.y = 0.6; p.position.set(-1.1 + (i % 5) * 0.25, 1.16 + Math.floor(i / 5) * 0.2, -2.4 + (i % 2) * 0.1); st.add(p); }
    const menuT = G.canvasTex(512, 384, (g) => {
      g.fillStyle = '#2a2a2a'; g.fillRect(0, 0, 512, 384); g.strokeStyle = '#a8683a'; g.lineWidth = 16; g.strokeRect(8, 8, 496, 368);
      g.fillStyle = '#fff7ea'; g.font = '700 40px Fredoka, sans-serif'; g.textAlign = 'center'; g.fillText('Paw & Bean', 256, 60);
      g.font = '500 24px Fredoka, sans-serif'; g.textAlign = 'left';
      G.CAFE.forEach((it, i) => { g.fillStyle = it.who === 'pet' ? '#f2c24b' : '#fff7ea'; g.fillText(it.name, 40, 110 + i * 36); g.textAlign = 'right'; g.fillText(it.price + 'c', 472, 110 + i * 36); g.textAlign = 'left'; });
    });
    const menu = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.65), M.mat('#fff', { map: menuT, r: 0.9 })); menu.position.set(0.6, 2.55, -3.57); scene.add(menu);
    const lampM = M.mat('#f2c24b', { em: '#ffcf80', ei: 0.8 });
    for (const x of [-2.2, 0, 2.2]) { const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 1.2, 4), M.mat('#222')); cord.position.set(x, 3.4, -0.5); st.add(cord); const sh = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.3, 20, 1, true), M.mat('#3b2a1f', { side: THREE.DoubleSide })); sh.position.set(x, 2.75, -0.5); st.add(sh); const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), lampM); bulb.position.set(x, 2.62, -0.5); scene.add(bulb); }
    // tables
    const tableAt = (x, z) => { const g = new THREE.Group(); g.position.set(x, 0, z); const top = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.05, 28), M.mat('#f6efe2', { r: 0.4 })); top.position.y = 0.74; g.add(top); const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.74, 10), M.mat('#3b2a1f', { m: 0.5, r: 0.4 })); leg.position.y = 0.37; g.add(leg); const ft = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.3, 0.04, 20), M.mat('#3b2a1f', { m: 0.5, r: 0.4 })); ft.position.y = 0.02; g.add(ft);
      for (const s of [-1, 1]) { const ch = new THREE.Group(); ch.position.set(s * 0.85, 0, 0); ch.rotation.y = -s * Math.PI / 2; g.add(ch); const seat = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.06, 0.45), M.mat('#a8683a')); seat.position.y = 0.45; ch.add(seat); const bk = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.5, 0.05), M.mat('#a8683a')); bk.position.set(0, 0.72, -0.2); ch.add(bk); for (const a of [-1, 1]) for (const b of [-1, 1]) { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.45, 6), M.mat('#3b2a1f')); l.position.set(a * 0.18, 0.22, b * 0.18); ch.add(l); } }
      g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); return g; };
    table = tableAt(0.9, 1.1); scene.add(table);
    const t2 = tableAt(-2.6, -0.4); st.add(t2); const t3 = tableAt(2.8, -0.2); st.add(t3);
    // plants + window
    for (const [x, z] of [[-4, -3.1], [4, -3.1], [-4, 2.5]]) { const pg = G.M.bush('#5e9e44', 0.8); pg.position.set(x, 0.35, z); st.add(pg); const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.24, 0.4, 14), M.mat('#e8823a')); pot.position.set(x, 0.2, z); st.add(pot); }
    const win = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.6), new THREE.MeshBasicMaterial({ color: G.daylight() > 0.4 ? '#bfe4ff' : '#24305a' })); win.rotation.y = Math.PI / 2; win.position.set(-4.48, 1.9, -0.6); scene.add(win);
    const cushion = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.1, 20), M.mat('#f39bb0', { r: 1 })); cushion.position.set(-1.35, 1.16, -2.35); st.add(cushion);
    scene.add(G.M.bake(st));
    // people
    yuki = new G.Person('yuki', { key: 'yuki' }); yuki.pos.set(0.4, 0, -3.05); scene.add(yuki.root);
    ito = new G.Person('ito', { key: 'ito', sit: true }); ito.pos.set(-1.75, 0, -0.4); ito.heading = -Math.PI / 2; scene.add(ito.root);
    const book = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.2, 0.04), M.mat('#4aa6e0')); book.position.set(0, 0.42, 0.24); book.rotation.x = -0.6; ito.m.torso.add(book);
    matcha = new G.Pet({ name: 'Matcha', breed: 'cat', coat: 'grey', mood: 80, acc: { collar: 'collar_gold' } }, { npc: true });
    matcha.pos.set(-1.35, 0, -2.35); matcha.baseY = 1.2; matcha.heading = 0.4; scene.add(matcha.root);
    matcha.brain = (p) => (function* () { const r = Math.random(); if (r < 0.5) yield* p.act('sleep', 5); else if (r < 0.75) yield* p.groom(); else { p.lookCam = 2; yield* p.act('sit', 3); } })();
  }
  C.enter = function (opts = {}) {
    from = opts.from || 'home';
    pet = G.activePet(); if (!pet) { setTimeout(() => G.go('home'), 50); return; }
    scene.add(pet.root); pet.stop(); pet.ctl = null; pet.baseY = 0; pet.bounds = null;
    pet.pos.set(-0.35, 0, 1.75); pet.heading = Math.PI - 0.5;
    pet.brain = (p) => (function* () { p.lookCam = 3; p.setPose(U.chance(0.7) ? 'sit' : 'lie'); yield* p.wait(U.rand(2, 5)); if (U.chance(0.25)) { p.tiltT = 1.2; } })();
    for (const o of onTable) table.remove(o); onTable = [];
    cam.position.set(0.3, 2.3, 4.8); lookV.set(0, 0.75, -0.5); focusPos = null; busy = false;
    const sp = G.cafeSpecial();
    setTimeout(() => G.ui.hint('Today’s special: ' + sp.name + ' (30% off)', 3500), 700);
    G.audio.play('bell');
  };
  C.exit = function () { if (pet) { scene.remove(pet.root); pet.stop(); } G.ui.hint(null); };
  C.dock = () => [
    { label: 'Menu', icon: 'menu', fn: menuSheet },
    { label: 'Chat', icon: 'chat', fn: chatSheet },
    { label: 'Leave', icon: 'door', cls: 'go', fn: () => G.go(from === 'walk' ? 'walk' : 'home', { from: 'cafe' }) },
  ];
  function price(it) { return it.id === G.cafeSpecial().id ? Math.round(it.price * 0.7) : it.price; }
  function menuSheet() {
    G.ui.sheet({ title: 'Paw & Bean menu', tabs: [{ id: 'you', name: 'For you' }, { id: 'pet', name: 'For ' + pet.name }], render(body, tab) {
      const g = G.ui.grid(body);
      G.CAFE.filter((it) => it.who === tab).forEach((it) => {
        const pr = price(it);
        const c = G.ui.card({ img: G.M.icons.cafe(it.id), name: it.name, sub: it.desc });
        const b = document.createElement('button'); b.className = 'buy'; b.textContent = pr + ' coins' + (pr < it.price ? ' (special!)' : ''); b.disabled = G.state.coins < pr || busy;
        b.onclick = (e) => { e.stopPropagation(); G.ui.closeSheet(true); order(it, pr); };
        c.appendChild(b); g.appendChild(c);
      });
    } });
  }
  function chatSheet() {
    G.ui.sheet({ title: 'Chat', render(body) {
      const l = G.ui.list(body);
      l.appendChild(G.ui.li({ img: G.M.icons.person('yuki'), title: 'Yuki', sub: 'Barista. Makes a mean latte.', fn: () => { G.ui.closeSheet(true); talk('yuki', yuki); } }));
      l.appendChild(G.ui.li({ img: G.M.icons.person('ito'), title: 'Prof. Ito', sub: 'Animal behavior professor.', fn: () => { G.ui.closeSheet(true); talk('ito', ito); } }));
      l.appendChild(G.ui.li({ img: G.M.icons.pet({ breed: 'cat', coat: 'grey', acc: { collar: 'collar_gold' } }), title: 'Matcha', sub: 'The café cat. Usually asleep.', fn: () => { G.ui.closeSheet(true); boopMatcha(); } }));
    } });
  }
  async function talk(key, per) {
    focusPos = per.pos.clone().add(new V3(0, 1, 0)); per.lookAt = cam.position;
    const iv = setInterval(() => { if (!$('#dialog').classList.contains('hidden')) per.talking = 0.3; }, 250);
    await G.ui.talk(key, { pet }); clearInterval(iv); focusPos = null; per.lookAt = null;
  }
  function boopMatcha() {
    if (busy) return; busy = true;
    pet.stop(); focusPos = matcha.pos.clone().setY(1.2);
    pet.do((function* () {
      yield* pet.goto(-1.0, -1.7, { speed: 1.2 }); yield* pet.face(matcha.pos.x, matcha.pos.z);
      pet.lookTarget = matcha.headWorld(); pet.setPose('beg'); pet.voice('happy');
      matcha.stop(); matcha.do((function* () { yield* matcha.face(pet.pos.x, pet.pos.z); matcha.setPose('sit'); yield* matcha.wait(0.6); matcha.setPose('paw'); matcha.voice(); yield* matcha.wait(0.8); matcha.setPose('sit'); matcha.eyeOverride = 'happy'; matcha.voice('purr'); yield* matcha.wait(1.5); matcha.eyeOverride = null; })());
      yield* pet.wait(1.6); pet.emote('heart'); matcha.emote('heart'); pet.happy(5); yield* pet.wait(1.4);
      pet.lookTarget = null; yield* pet.goto(-0.35, 1.75, { speed: 1.2 }); yield* pet.face(0.3, 4);
      busy = false; focusPos = null;
    })());
    G.ui.toast(pet.name + ' says hi to Matcha.');
  }
  function order(it, pr) {
    if (G.state.coins < pr || busy) return;
    busy = true; G.state.coins -= pr; G.ui.refresh(); G.audio.play('coin');
    const item = G.M.item(it.id);
    yuki.target = new V3(0.4, 0, 0.35); yuki.speed = 1.3;
    const startT = G.time;
    const step = () => {
      if (U.d2(yuki.pos.x, yuki.pos.z, 0.4, 0.35) > 0.2 && G.time - startT < 6) { requestAnimationFrame(step); return; }
      yuki.waveT = 0.8; G.audio.play('pop');
      if (it.who === 'you') {
        item.position.set(U.rand(-0.25, 0.25), 0.765, U.rand(0.05, 0.25)); table.add(item); onTable.push(item);
        G.ui.toast(U.pick(['Mmm, cozy.', 'Delicious!', 'The perfect little treat.', 'You feel very relaxed.']) + ' ' + pet.name + ' watches hopefully.');
        pet.lookTarget = table.localToWorld(item.position.clone()); pet.tiltT = 1.2; setTimeout(() => (pet.lookTarget = null), 2500);
        busy = false;
      } else {
        item.position.set(-0.35, 0, 2.15); scene.add(item);
        pet.stop(); pet.do((function* () {
          yield* pet.face(-0.35, 2.15); pet.setPose('eat'); pet.chewT = 3;
          for (let i = 0; i < 6; i++) { G.audio.play('munch'); yield* pet.wait(0.5); }
          scene.remove(item); pet.setPose('sit');
          pet.d.hunger = U.clamp(pet.d.hunger + it.hunger, 0, 100); pet.happy(it.mood); pet.excite = 1; pet.voice('happy'); pet.lickT = 1.4;
          G.ui.toast(pet.name + ' loved the ' + it.name + '!'); busy = false;
        })());
      }
      yuki.target = new V3(0.4, 0, -3.05);
    };
    requestAnimationFrame(step);
  }
  C.onDown = function () { };
  C.onUp = function (p) {
    if (!p.tap) return;
    const hit = G.pick(p, [...pet.m.meshes, ...matcha.m.meshes], false)[0];
    if (hit) { const pp = hit.object.userData.pet; if (pp === matcha) { matcha.voice(); matcha.emote('heart', 1); matcha.eyeOverride = 'happy'; setTimeout(() => (matcha.eyeOverride = null), 1200); } else { pp.emote('heart', 1); pp.voice(); pp.happy(1); pp.excite = 0.8; } return; }
    const ph = G.pick(p, [yuki.root, ito.root], true)[0];
    if (ph) { const per = ph.object.userData.person; if (per === yuki) talk('yuki', yuki); else talk('ito', ito); }
  };
  C.update = function (dt) {
    if (!pet) return;
    pet.update(dt); matcha.update(dt); yuki.update(dt); ito.update(dt);
    if (Math.random() < dt * 0.25) yuki.lookAt = U.chance(0.5) ? cam.position : null;
    const portrait = G.aspect() < 0.9;
    let pos = portrait ? new V3(0.3, 3.2, 6.8) : new V3(0.3, 2.3, 4.8), look = new V3(0, 0.75, -0.5);
    if (focusPos) { look = focusPos.clone(); pos = look.clone().add(portrait ? new V3(0.6, 0.6, 3.4) : new V3(0.6, 0.4, 2.4)); }
    const k = 1 - Math.exp(-2.4 * dt); cam.position.lerp(pos, k); lookV.lerp(look, k); cam.lookAt(lookV);
  };
  return C;
})();
