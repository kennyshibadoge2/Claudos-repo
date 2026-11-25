'use strict';
/* =========================================================
   Shiba Days — Paw Inn: a pet hotel for pets who aren't at home
   (4 pets at home + 8 hotel rooms)
   ========================================================= */
G.HOTEL_ROOMS = 8;
G.HOME_MAX = 4;
G.hotel = {
  list() { G.state.hotel = G.state.hotel || []; return G.state.hotel; },
  roomsFree() { return G.HOTEL_ROOMS - this.list().length; },
  total() { return G.state.pets.length + this.list().length; },
  // pets come home fed, clean and happy
  freshen(d) { d.hunger = Math.max(d.hunger, 90); d.thirst = Math.max(d.thirst, 90); d.clean = Math.max(d.clean, 95); d.energy = Math.max(d.energy, 90); d.mood = Math.max(d.mood, 85); },
  checkIn(id) {
    const s = G.state; const i = s.pets.findIndex((d) => d.id === id); if (i < 0) return false;
    if (s.pets.length <= 1) { G.ui.toast('Keep at least one pet at home!'); return false; }
    if (this.roomsFree() <= 0) { G.ui.toast('Paw Inn is fully booked!'); return false; }
    const [d] = s.pets.splice(i, 1); d.hotelSince = Date.now(); this.list().push(d);
    if (G.pets[id]) { const p = G.pets[id]; if (p.root.parent) p.root.parent.remove(p.root); delete G.pets[id]; }
    if (s.active === id) s.active = s.pets[0].id;
    G.ui.refresh && G.ui.refresh(true); G.save(); return true;
  },
  checkOut(id) {
    const s = G.state; const H = this.list(); const i = H.findIndex((d) => d.id === id); if (i < 0) return false;
    if (s.pets.length >= G.HOME_MAX) { G.ui.toast('Your home is full (' + G.HOME_MAX + '). Swap a pet instead.'); return false; }
    const [d] = H.splice(i, 1); this.freshen(d); delete d.hotelSince; s.pets.push(d);
    G.ui.refresh && G.ui.refresh(true); G.save(); return true;
  },
  swap(homeId, hotelId) {
    const s = G.state; const H = this.list();
    const hi = s.pets.findIndex((d) => d.id === homeId), gi = H.findIndex((d) => d.id === hotelId); if (hi < 0 || gi < 0) return false;
    const home = s.pets[hi], guest = H[gi];
    if (G.pets[homeId]) { const p = G.pets[homeId]; if (p.root.parent) p.root.parent.remove(p.root); delete G.pets[homeId]; }
    this.freshen(guest); delete guest.hotelSince; home.hotelSince = Date.now();
    s.pets[hi] = guest; H[gi] = home; if (s.active === homeId) s.active = guest.id;
    G.ui.refresh && G.ui.refresh(true); G.save(); return true;
  },
};
// pet lookups also see hotel guests (trophies, unlock checks), but home lists stay home-only
G.allPets = () => G.state.pets.concat(G.state.hotel || []);

G.LOOKS.inoue = { skin: '#f3d0b5', hair: '#6a4a3a', style: 'bun', top: '#3b5ba8', bottom: '#2c2c3a', h: 1.0, extra: ['apron'] };
G.NPCS.inoue = { name: 'Mrs. Inoue', look: 'inoue' };
G.NPCS.inoue.talk = async function (D) {
  if (!D.flag('met')) { D.setFlag('met'); await D.say('Welcome to the Paw Inn! I’m Mrs. Inoue. Eight cosy rooms, room service, and a strict no-cats-on-the-curtains policy. Mostly strict.'); D.friend(1); }
  const n = G.hotel.list().length;
  const c = await D.ask(U.pick(['How can I help?', 'Checking someone in?', 'Lovely day for a nap, isn’t it?']), ['How does the hotel work?', 'How are my pets doing?', 'Any gossip?']);
  if (c === 0) await D.say('You can keep ' + G.HOME_MAX + ' pets at home and ' + G.HOTEL_ROOMS + ' here. Tap a guest to bring them home, or use Check in to give a pet a holiday. They always leave fed, brushed and happy!');
  else if (c === 1) await D.say(n ? U.pick(['Everyone ate their breakfast. Some ate other people’s breakfast, but we don’t name names.', 'Room ' + (1 + Math.floor(Math.random() * n)) + ' had the zoomies at 3 a.m. It was very cute and very loud.', 'They’ve been napping in the sunbeam all afternoon.']) : 'All the rooms are empty right now. The beds are fluffed and waiting!');
  else await D.say(U.pick(['Kiwi from Maple Pets keeps shouting "frog hat" through the window. We have filed a complaint with the parrot.', 'A famous show dog stayed here once. Demanded the corner room and a tiny cucumber sandwich.', 'Mr. Ogawa brings the guests chestnuts. Don’t tell him dogs don’t really like chestnuts.']));
};

G.scenes.hotel = (() => {
  const H = { minHFov: 68, music: 'cafe', hideNeeds: true };
  let scene, cam, from = 'home', guests = [], plates = [], inoue, sel = null, lookV = new V3(0, 0.8, -1), focus = null;
  const ROOM_W = 1.25, ROOMS_X0 = -((G.HOTEL_ROOMS / 2) - 0.5) * ROOM_W;
  const roomX = (i) => ROOMS_X0 + (i % 4) * ROOM_W + (i >= 4 ? 0 : 0);
  // two rows of four rooms: back row and a raised row on the left/right
  const roomPos = (i) => (i < 4 ? new V3(-2.4 + i * 1.6, 0, -2.7) : new V3(-2.4 + (i - 4) * 1.6, 0, -0.5));
  H.init = function () {
    scene = new THREE.Scene(); H.scene = scene; scene.background = new THREE.Color('#2f3a52');
    cam = new THREE.PerspectiveCamera(46, G.aspect(), 0.05, 50); H.camera = cam;
    scene.add(new THREE.HemisphereLight(0xfff6ea, 0x5a5a7a, 0.8));
    const key = new THREE.DirectionalLight(0xfff0dc, 0.75); key.position.set(-3, 7, 6); key.castShadow = true; key.shadow.mapSize.set(1024, 1024); Object.assign(key.shadow.camera, { left: -7, right: 7, top: 7, bottom: -7 }); key.shadow.bias = -0.0006; scene.add(key);
    for (const x of [-2.5, 0, 2.5]) { const pl = new THREE.PointLight(0xffe2b0, 0.35, 6, 1.6); pl.position.set(x, 2.6, -1.2); scene.add(pl); }
    build();
  };
  function build() {
    const M = G.M; const st = new THREE.Group();
    const ft = G.canvasTex(256, 256, (g) => { g.fillStyle = '#8a5a3a'; g.fillRect(0, 0, 256, 256); for (let r = 0; r < 8; r++) for (let c = 0; c < 3; c++) { g.fillStyle = U.pick(['#9a6a44', '#8e603e', '#a4744c']); g.fillRect(c * 86 + (r % 2) * 43, r * 32, 84, 30); } }, { repeat: [3, 3] });
    const fl = new THREE.Mesh(new THREE.PlaneGeometry(10, 9), M.mat('#fff', { map: ft, r: 0.55 })); fl.rotation.x = -Math.PI / 2; fl.receiveShadow = true; scene.add(fl);
    const rug = new THREE.Mesh(new THREE.CircleGeometry(1.6, 40), M.mat('#c8323c', { r: 0.95 })); rug.rotation.x = -Math.PI / 2; rug.position.set(0, 0.01, 2.3); rug.scale.y = 0.6; rug.receiveShadow = true; scene.add(rug);
    const rug2 = new THREE.Mesh(new THREE.RingGeometry(1.35, 1.5, 40), M.mat('#f2c24b', { r: 0.9 })); rug2.rotation.x = -Math.PI / 2; rug2.position.set(0, 0.012, 2.3); rug2.scale.y = 0.6; scene.add(rug2);
    const wt = G.canvasTex(128, 128, (g) => { g.fillStyle = '#e9eef8'; g.fillRect(0, 0, 128, 128); g.fillStyle = '#d6def0'; for (let x = 0; x < 128; x += 32) g.fillRect(x, 0, 12, 128); g.fillStyle = 'rgba(59,91,168,.25)'; for (let y = 16; y < 128; y += 32) for (let x = 6; x < 128; x += 32) { g.beginPath(); g.ellipse(x + 10, y, 4, 3, 0, 0, 7); g.fill(); for (const [dx, dy] of [[-5, -5], [-1, -8], [3, -8], [7, -5]]) { g.beginPath(); g.arc(x + 10 + dx, y + dy, 1.6, 0, 7); g.fill(); } } }, { repeat: [3, 1] });
    const wm = M.mat('#fff', { map: wt, r: 0.95 });
    const back = new THREE.Mesh(new THREE.PlaneGeometry(10, 4), wm); back.position.set(0, 2, -3.6); scene.add(back);
    for (const sx of [-1, 1]) { const w = new THREE.Mesh(new THREE.PlaneGeometry(9, 4), wm); w.rotation.y = -sx * Math.PI / 2; w.position.set(sx * 5, 2, 0.9); scene.add(w); }
    const wain = new THREE.Mesh(new THREE.BoxGeometry(10, 0.9, 0.06), M.mat('#3b5ba8', { r: 0.7 })); wain.position.set(0, 0.45, -3.56); st.add(wain);
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 0.8), M.mat('#fff', { map: G.textTex('★ PAW INN ★', { font: '700 64px Fredoka, sans-serif', bg: '#3b5ba8', color: '#ffe28a', pad: 22, radius: 18 }) })); sign.position.set(0, 3.15, -3.55); scene.add(sign);
    // rooms: little wooden suites with a cushion bed and a lamp
    const wood = M.mat('#c08a58', { r: 0.7 }), woodD = M.mat('#8a5a3a', { r: 0.75 });
    for (let i = 0; i < G.HOTEL_ROOMS; i++) {
      const p = roomPos(i); const g = new THREE.Group(); g.position.copy(p); scene.add(g);
      const flr = new THREE.Mesh(new THREE.BoxGeometry(1.36, 0.06, 1.1), M.mat(['#f6e2c4', '#e6eefc', '#fde3e3', '#e9f6e9'][i % 4], { r: 0.9 })); flr.position.y = 0.03; flr.receiveShadow = true; g.add(flr);
      for (const sx of [-1, 1]) { const wl = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.55, 1.1), wood); wl.position.set(sx * 0.68, 0.3, 0); wl.castShadow = true; g.add(wl); const post = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.62, 0.1), woodD); post.position.set(sx * 0.68, 0.31, 0.55); g.add(post); }
      const bw = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.55, 0.06), wood); bw.position.set(0, 0.3, -0.55); g.add(bw);
      const bed = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.38, 0.12, 24), M.mat(['#e2574c', '#4aa6e0', '#79b25a', '#f2c24b', '#7a5cff', '#f39bb0', '#ee8a3c', '#3b5ba8'][i], { r: 0.95 })); bed.position.set(0.18, 0.11, -0.18); bed.receiveShadow = true; g.add(bed);
      const cush = new THREE.Mesh(new THREE.CylinderGeometry(0.29, 0.3, 0.06, 24), M.mat('#fff7ea', { r: 1 })); cush.position.set(0.18, 0.18, -0.18); g.add(cush);
      const bowl = M.bowl('#c0c0c0'); bowl.scale.setScalar(0.8); bowl.position.set(-0.4, 0.06, 0.25); g.add(bowl);
      const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 10), M.mat('#fff3c4', { em: '#ffd36a', ei: 0.8 })); lamp.position.set(-0.5, 0.66, -0.45); g.add(lamp);
      const num = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.2), M.mat('#fff', { map: G.textTex(String(i + 1), { font: '700 56px Fredoka, sans-serif', bg: '#3b5ba8', color: '#fff', pad: 10, radius: 10 }) })); num.position.set(0, 0.48, -0.51); g.add(num);
      const pl = new THREE.Sprite(new THREE.SpriteMaterial({ depthTest: false, transparent: true })); pl.position.set(p.x, 0.95, p.z + 0.5); pl.renderOrder = 14; scene.add(pl); plates[i] = pl;
    }
    // reception
    const desk = new THREE.Group(); desk.position.set(3.4, 0, 2.0); desk.rotation.y = -0.5; scene.add(desk);
    const dk = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.0, 0.7), M.mat('#3b5ba8', { r: 0.6 })); dk.position.y = 0.5; dk.castShadow = true; desk.add(dk);
    const top = new THREE.Mesh(new THREE.BoxGeometry(1.95, 0.08, 0.82), M.mat('#c08a58', { r: 0.5 })); top.position.y = 1.04; desk.add(top);
    const bell = new THREE.Mesh(new THREE.SphereGeometry(0.09, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), M.mat('#f2c24b', { r: 0.2, m: 0.9 })); bell.position.set(0.5, 1.08, 0.15); desk.add(bell); H.bell = bell;
    const book = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.05, 0.3), M.mat('#7a3a2a')); book.position.set(-0.3, 1.1, 0.1); book.rotation.y = 0.2; desk.add(book);
    const keys = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.8, 0.05), woodD); keys.position.set(3.9, 1.8, 1.2); keys.rotation.y = -Math.PI / 2 + 0.25; scene.add(keys);
    for (let i = 0; i < 8; i++) { const k = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.012, 6, 10), M.mat('#f2c24b', { m: 0.8, r: 0.3 })); k.position.set(3.87, 1.95 - Math.floor(i / 4) * 0.3, 1.2 + (i % 4 - 1.5) * 0.25); k.rotation.y = Math.PI / 2; scene.add(k); }
    for (const [x, z] of [[-4.4, 2.8], [-4.4, -3.1], [4.4, -3.1]]) { const b = M.bush('#5e9e44', 0.8); b.position.set(x, 0.32, z); st.add(b); const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.24, 0.4, 14), M.mat('#c8622a')); pot.position.set(x, 0.2, z); st.add(pot); }
    const sofa = new THREE.Group(); sofa.position.set(-3.6, 0, 2.2); sofa.rotation.y = Math.PI / 2 - 0.2; scene.add(sofa);
    const sb = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.4, 0.7), M.mat('#c8323c', { r: 0.9 })); sb.position.y = 0.3; sofa.add(sb);
    const sbk = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.5, 0.18), M.mat('#c8323c', { r: 0.9 })); sbk.position.set(0, 0.65, -0.28); sofa.add(sbk);
    scene.add(G.M.bake(st));
    G.M.stoolAt(scene, 3.75, 1.45, 0.8);
    inoue = new G.Person('inoue', { key: 'inoue', seat: 0.8 }); inoue.pos.set(3.75, 0, 1.45); inoue.heading = -2.3; scene.add(inoue.root);
  }
  function plateFor(i, d) {
    const pl = plates[i]; if (pl.material.map) pl.material.map.dispose();
    const t = G.textTex(d ? d.name : 'Vacant', { font: '700 40px Fredoka, sans-serif', bg: d ? 'rgba(59,91,168,.9)' : 'rgba(120,120,140,.6)', color: '#fff', pad: 10, radius: 16 });
    pl.material.map = t; pl.material.needsUpdate = true; pl.scale.set(0.3 * t.userData.w / t.userData.h, 0.3, 1);
  }
  function guestBrain(i) {
    const c = roomPos(i);
    return (pp) => (function* () {
      if (pp === sel) { pp.lookCam = 3; yield* pp.face(cam.position.x, cam.position.z); yield* pp.act(pp.cat ? 'sit' : U.pick(['sit', 'bow']), 2); if (!pp.cat && U.chance(0.4)) pp.voice(); return; }
      const r = Math.random();
      if (r < 0.3) { yield* pp.goto(c.x + 0.18, c.z - 0.18, { speed: 0.6, near: 0.08 }); yield* pp.act('lie', 1); pp.setPose('sleep'); pp.baseY = 0.1; yield* pp.wait(U.rand(5, 10)); pp.baseY = 0; }
      else if (r < 0.55) { yield* pp.goto(c.x + U.rand(-0.4, 0.4), c.z + U.rand(-0.2, 0.35), { speed: 0.7 }); yield* pp.act('sit', 2); }
      else if (r < 0.7) { pp.lookCam = 3; yield* pp.face(cam.position.x, cam.position.z); pp.tiltT = 1; yield* pp.act('sit', 2.5); }
      else if (r < 0.82) yield* pp.sniffAround(1);
      else if (r < 0.9 && pp.cat) yield* pp.groom();
      else { yield* pp.act('lie', 3); }
    })();
  }
  function spawnGuests() {
    for (const g of guests) scene.remove(g.root); guests = []; sel = null; G.ui.prompts([]);
    const list = G.hotel.list();
    for (let i = 0; i < G.HOTEL_ROOMS; i++) {
      const d = list[i]; plateFor(i, d); if (!d) continue;
      const p = new G.Pet(d, { npc: true }); const c = roomPos(i); p.room = i;
      p.pos.set(c.x + U.rand(-0.3, 0.3), 0, c.z + U.rand(-0.1, 0.3)); p.heading = U.rand(-0.5, 0.5);
      p.brain = guestBrain(i); p.bounds = (pp) => { pp.pos.x = U.clamp(pp.pos.x, c.x - 0.5, c.x + 0.5); pp.pos.z = U.clamp(pp.pos.z, c.z - 0.38, c.z + 0.45); };
      scene.add(p.root); guests.push(p);
    }
  }
  H.enter = function (opts = {}) {
    from = opts.from || 'home'; focus = null;
    spawnGuests();
    G.audio.play('door');
    cam.position.set(0, 4.9, 5.6); lookV.set(0, 0.1, -1.3);
    const n = G.hotel.list().length;
    setTimeout(() => G.ui.hint(n ? 'Tap a guest to bring them home. Use Check in to give a pet a holiday.' : 'All rooms are free! Use Check in to give a pet a holiday.', 4500), 600);
  };
  H.exit = function () { for (const g of guests) scene.remove(g.root); guests = []; G.ui.hint(null); G.ui.prompts([]); };
  H.dock = () => [
    { label: 'Check in', icon: 'kennel', fn: checkInSheet },
    { label: 'Chat', icon: 'chat', fn: talk },
    { label: 'Leave', icon: 'door', cls: 'go', fn: () => G.go(from === 'walk' ? 'walk' : 'home', { from: 'hotel' }) },
  ];
  async function talk() { focus = inoue.pos.clone().setY(1.1); inoue.lookAt = cam.position; const iv = setInterval(() => { if (!$('#dialog').classList.contains('hidden')) inoue.talking = 0.3; }, 250); await G.ui.talk('inoue', {}); clearInterval(iv); focus = null; }
  function checkInSheet() {
    G.ui.sheet({ title: 'Check in at Paw Inn', render(body) {
      G.ui.note(body, G.hotel.roomsFree() + ' of ' + G.HOTEL_ROOMS + ' rooms free. Pets on holiday don’t get hungry or messy, and come home fed, clean and happy. Keep at least one pet at home.');
      const l = G.ui.list(body);
      for (const d of G.state.pets) {
        const ok = G.state.pets.length > 1 && G.hotel.roomsFree() > 0;
        l.appendChild(G.ui.li({ img: G.M.icons.pet(d), title: d.name, sub: (d.breed === 'cat' ? 'Cat' : G.BREEDS[d.breed].name) + (ok ? ' · tap to check in' : G.state.pets.length <= 1 ? ' · your only pet at home' : ' · hotel full'), lock: !ok, fn: ok ? () => { if (G.hotel.checkIn(d.id)) { G.audio.play('chime'); inoue.waveT = 1; G.ui.toast(d.name + ' checked in. Enjoy the holiday!'); spawnGuests(); G.ui.resheet(); } } : null }));
      }
    } });
  }
  function selectGuest(p) {
    sel = p; p.stop(); p.emote('heart', 1); p.voice(); focus = p.pos.clone().setY(0.35);
    const d = p.d; const homeFull = G.state.pets.length >= G.HOME_MAX; const days = Math.max(0, Math.floor((Date.now() - (d.hotelSince || Date.now())) / 86400000));
    G.ui.hint(d.name + ' · Room ' + (p.room + 1) + ' · ' + (days ? 'on holiday for ' + days + ' day' + (days > 1 ? 's' : '') : 'checked in today'), 0);
    const prompts = [];
    if (!homeFull) prompts.push({ label: 'Bring ' + d.name + ' home', cls: 'pink', fn: () => { if (G.hotel.checkOut(d.id)) { G.audio.play('fanfare'); G.ui.banner('Welcome home,', d.name + '!', 2200); G.ui.hint(null); spawnGuests(); focus = null; } } });
    else prompts.push({ label: 'Swap with a pet at home', cls: 'pink', fn: () => swapSheet(d) });
    G.ui.prompts(prompts);
  }
  function swapSheet(guest) {
    G.ui.sheet({ title: 'Swap ' + guest.name + ' in', render(body) {
      G.ui.note(body, 'Your home is full. Pick a pet to stay at the Paw Inn instead of ' + guest.name + '.');
      const l = G.ui.list(body);
      for (const d of G.state.pets) l.appendChild(G.ui.li({ img: G.M.icons.pet(d), title: d.name, sub: 'Check in ' + d.name + ', bring ' + guest.name + ' home', fn: () => { if (G.hotel.swap(d.id, guest.id)) { G.ui.closeSheet(true); G.audio.play('fanfare'); G.ui.banner('Swapped!', guest.name + ' is home, ' + d.name + ' is on holiday', 2400); spawnGuests(); focus = null; G.ui.hint(null); } } }));
    } });
  }
  H.onDown = function () { };
  H.onUp = function (p) {
    if (!p.tap) return;
    if (G.pick(p, [H.bell], true)[0]) { G.audio.play('chime'); inoue.waveT = 0.8; G.ui.toast('Ding! Mrs. Inoue: “Coming, dear!”'); return; }
    if (G.pick(p, [inoue.root], true)[0]) { talk(); return; }
    const hit = G.pick(p, guests.flatMap((g) => g.m.meshes), false)[0];
    if (hit) { selectGuest(hit.object.userData.pet); return; }
    sel = null; focus = null; G.ui.prompts([]);
  };
  H.debug = () => ({ guests });
  H.update = function (dt) {
    for (const g of guests) g.update(dt);
    inoue.update(dt); if (Math.random() < dt * 0.2) inoue.lookAt = U.chance(0.5) ? cam.position : (guests.length ? U.pick(guests).pos : null);
    const portrait = G.aspect() < 0.9;
    let pos = portrait ? new V3(0, 6.4, 8.6) : new V3(0, 4.9, 5.6), look = new V3(0, 0.1, -1.3);
    if (focus) { look = focus.clone(); pos = look.clone().add(portrait ? new V3(0, 1.4, 3.2) : new V3(0, 1.0, 2.4)); }
    const k = 1 - Math.exp(-2.5 * dt); cam.position.lerp(pos, k); lookV.lerp(look, k); cam.lookAt(lookV);
  };
  return H;
})();
