'use strict';
/* =========================================================
   Shiba Days — Agility & Obedience trials
   ========================================================= */
G.LOOKS.judge = { skin: '#f0cfb3', hair: '#d9d6d0', style: 'bun', top: '#33415c', bottom: '#33415c', h: 1.0, extra: ['glasses'] };
G.NPCS.judge = { name: 'Judge Hoshino', look: 'judge' };
G.TRIALS = {
  agility: [
    { id: 'ag1', name: 'Agility: Puppy Course', fee: 0, prize: [180, 100, 50], rival: [34, 48], need: null, n: 6 },
    { id: 'ag2', name: 'Agility: Open Course', fee: 40, prize: [450, 240, 110], rival: [28, 38], need: 'ag1', n: 8 },
    { id: 'ag3', name: 'Agility: Masters', fee: 100, prize: [1200, 600, 280], rival: [22, 30], need: 'ag2', n: 8, refuse: 1.5 },
  ],
  obedience: [
    { id: 'ob1', name: 'Obedience: Novice', fee: 0, prize: [180, 100, 50], rival: [40, 70], need: null, n: 4, time: 7 },
    { id: 'ob2', name: 'Obedience: Open', fee: 40, prize: [450, 240, 110], rival: [60, 82], need: 'ob1', n: 6, time: 5.5 },
    { id: 'ob3', name: 'Obedience: Utility', fee: 100, prize: [1200, 600, 280], rival: [78, 94], need: 'ob2', n: 8, time: 4.5 },
  ],
};
G.ui.trialsSheet = function (from) {
  const p = G.activePet();
  G.ui.sheet({ title: 'Disc Cup Field', render(body) {
    G.ui.note(body, 'Three events take place at the field. Trophies and prizes for the top 3!');
    const l = G.ui.list(body);
    l.appendChild(G.ui.li({ icon: 'disc', title: 'Disc Cup', sub: 'Flick the disc, your pup makes the catch.', fn: () => { G.ui.closeSheet(true); G.go('frisbee', { from }); } }));
    l.appendChild(G.ui.li({ icon: 'paw', title: 'Agility trial', sub: 'Lead your pup over hurdles, through tunnels and weave poles. Fastest time wins.', fn: () => { G.ui.closeSheet(true); G.go('trials', { mode: 'agility', from }); } }));
    l.appendChild(G.ui.li({ icon: 'star', title: 'Obedience trial', sub: 'The judge calls commands; perform the gestures before time runs out.', fn: () => { G.ui.closeSheet(true); G.go('trials', { mode: 'obedience', from }); } }));
    if (p && p.cat) G.ui.note(body, 'Cats are welcome to watch, but only dogs can compete.');
  } });
};

G.scenes.trials = (() => {
  const T = { music: 'contest', hideNeeds: true };
  let scene, cam, pet, judge, mode = 'agility', from = 'home', st = null, lookV = new V3(), obstacles = [], marker, ring, steer = null, touch = null, specs = [];
  const AREA = { x: 12, z: 8 };
  T.init = function () {
    scene = new THREE.Scene(); T.scene = scene; scene.background = new THREE.Color('#9fd4ff'); scene.fog = new THREE.Fog('#9fd4ff', 40, 90);
    cam = new THREE.PerspectiveCamera(46, G.aspect(), 0.1, 150); T.camera = cam;
    const L = G.outdoorLights(scene, { shadow: 16 }); L.sun.position.set(-8, 20, 12);
    const M = G.M; const s = new THREE.Group();
    const g = new THREE.Mesh(new THREE.PlaneGeometry(160, 160), M.mat('#fff', { map: G.grassTex('summer', 40), r: 1 })); g.rotation.x = -Math.PI / 2; g.receiveShadow = true; scene.add(g);
    const arena = new THREE.Mesh(new THREE.PlaneGeometry(AREA.x * 2 + 2, AREA.z * 2 + 2), M.mat('#c9e6a8', { r: 1 })); arena.rotation.x = -Math.PI / 2; arena.position.y = 0.01; arena.receiveShadow = true; scene.add(arena);
    [[0, -AREA.z - 1, AREA.x * 2 + 2, 0], [0, AREA.z + 1, AREA.x * 2 + 2, 0], [-AREA.x - 1, 0, AREA.z * 2 + 2, Math.PI / 2], [AREA.x + 1, 0, AREA.z * 2 + 2, Math.PI / 2]].forEach(([x, z, l, r]) => { const f = M.fence(l, '#ffffff'); f.position.set(x, 0, z); f.rotation.y = r; s.add(f); });
    for (let i = 0; i < 16; i++) { const t = M.tree('summer', i % 4 ? 'round' : 'pine'); const a = i / 16 * Math.PI * 2; t.position.set(Math.cos(a) * 26, 0, Math.sin(a) * 20); t.scale.setScalar(U.rand(1.2, 1.7)); s.add(t); }
    const banTex = G.textTex('Maple Hill Dog Trials', { font: '700 72px Fredoka, sans-serif', bg: '#3b5ba8', color: '#fff', pad: 34 });
    const ban = new THREE.Mesh(new THREE.PlaneGeometry(8, 8 * banTex.userData.h / banTex.userData.w), M.mat('#fff', { map: banTex })); ban.position.set(0, 1.4, -AREA.z - 1.3); scene.add(ban);
    scene.add(M.bake(s));
    judge = new G.Person('judge', { key: 'judge' }); judge.pos.set(-AREA.x + 1.5, 0, -AREA.z + 1.2); judge.heading = 0.8; scene.add(judge.root);
    const clip = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.24, 0.02), M.mat('#c48a52')); clip.position.set(0, 0.2, 0.22); judge.m.torso.add(clip);
    ['hana', 'kato', 'tomo', 'aki', 'kenji', 'ito'].forEach((k, i) => { const p = new G.Person(k); p.pos.set(-8 + i * 3.2, 0, AREA.z + 2.6); p.heading = Math.PI; scene.add(p.root); specs.push(p); });
    marker = new THREE.Sprite(new THREE.SpriteMaterial({ map: G.textTex('▼', { font: '700 90px Fredoka, sans-serif', color: '#ee8a3c', stroke: '#fff', strokeW: 12, pad: 10 }), depthTest: false, transparent: true })); marker.scale.set(0.6, 0.6, 1); marker.renderOrder = 20; scene.add(marker);
    ring = new THREE.Mesh(new THREE.RingGeometry(0.55, 0.75, 32), new THREE.MeshBasicMaterial({ color: '#ee8a3c', transparent: true, opacity: 0.8, depthWrite: false })); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.03; scene.add(ring);
  };
  /* ---------------- course ---------------- */
  function buildCourse(n) {
    for (const o of obstacles) scene.remove(o.g); obstacles = [];
    const M = G.M;
    const layout = [['hurdle', -7, -4, 0], ['hurdle', -2.5, -5, 0], ['tunnel', 3.5, -4.8, 0.35], ['weave', 8.2, -0.5, Math.PI / 2], ['aframe', 4.5, 4.5, Math.PI], ['tire', -0.8, 5, Math.PI], ['hurdle', -5.5, 3.5, Math.PI + 0.6], ['hurdle', -8.2, -0.2, -Math.PI / 2]].slice(0, n);
    layout.push(['finish', -8.5, -4.6, -Math.PI / 2 - 0.3]);
    layout.forEach(([type, x, z, ang], i) => {
      const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ang + Math.PI / 2; scene.add(g);
      const dir = new V3(Math.cos(-ang) * 0, 0, 0); dir.set(Math.sin(ang + Math.PI / 2), 0, Math.cos(ang + Math.PI / 2));
      let len = 1.2;
      const stripe = M.mat('#e2574c'), white = M.mat('#ffffff');
      if (type === 'hurdle') { for (const s of [-1, 1]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.8, 8), white); p.position.set(s * 0.7, 0.4, 0); g.add(p); } const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.4, 8), stripe); bar.rotation.z = Math.PI / 2; bar.position.y = 0.38; g.add(bar); }
      if (type === 'tire') { for (const s of [-1, 1]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.3, 8), white); p.position.set(s * 0.65, 0.65, 0); g.add(p); } const top = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.3, 8), white); top.rotation.z = Math.PI / 2; top.position.y = 1.3; g.add(top); const tr = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.09, 12, 24), M.mat('#f2c24b')); tr.position.y = 0.62; g.add(tr); }
      if (type === 'tunnel') { len = 3.2; const curve = new THREE.CatmullRomCurve3([new V3(0, 0.38, -1.6), new V3(0.3, 0.38, 0), new V3(0, 0.38, 1.6)]); const tm = new THREE.Mesh(new THREE.TubeGeometry(curve, 24, 0.45, 16, false), M.mat('#4aa6e0', { side: THREE.DoubleSide, r: 0.7 })); g.add(tm); for (let k = 0; k < 5; k++) { const rr = new THREE.Mesh(new THREE.TorusGeometry(0.46, 0.03, 6, 20), white); const pp = curve.getPointAt(k / 4); rr.position.copy(pp); rr.lookAt(pp.clone().add(curve.getTangentAt(k / 4))); g.add(rr); } }
      if (type === 'weave') { len = 3.6; for (let k = 0; k < 6; k++) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.0, 8), k % 2 ? M.mat('#79b25a') : white); p.position.set(0, 0.5, -1.5 + k * 0.6); g.add(p); } }
      if (type === 'aframe') { len = 3.0; for (const s of [-1, 1]) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.06, 1.65), M.mat('#f2c24b', { r: 0.8 })); b.position.set(0, 0.45, s * 0.72); b.rotation.x = s * 0.58; g.add(b); const cz = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.065, 0.5), stripe); cz.position.set(0, 0.16, s * 1.25); cz.rotation.x = s * 0.58; g.add(cz); } }
      if (type === 'finish') { for (const s of [-1, 1]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.2, 8), M.mat('#3b2a1f')); p.position.set(s * 1.0, 1.1, 0); g.add(p); } const ft = G.textTex('FINISH', { font: '700 64px Fredoka, sans-serif', bg: '#e2574c', color: '#fff', pad: 16 }); const fb = new THREE.Mesh(new THREE.PlaneGeometry(2, 0.5), M.mat('#fff', { map: ft, side: THREE.DoubleSide })); fb.position.y = 2.0; g.add(fb); }
      g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
      if (type !== 'finish') { const nt = G.textTex(String(i + 1), { font: '700 64px Fredoka, sans-serif', bg: '#3b5ba8', color: '#fff', pad: 14, radius: 40 }); const num = new THREE.Sprite(new THREE.SpriteMaterial({ map: nt })); num.scale.set(0.45, 0.45, 1); num.position.y = type === 'tire' ? 1.7 : 1.3; g.add(num); }
      const c = new V3(x, 0, z);
      obstacles.push({ type, g, c, dir, len, entry: c.clone().addScaledVector(dir, -(len / 2 + 0.7)), exit: c.clone().addScaledVector(dir, len / 2 + 0.6) });
    });
  }
  /* ---------------- enter ---------------- */
  T.enter = function (opts = {}) {
    mode = opts.mode || 'agility'; from = opts.from || 'home';
    pet = G.activePet(); if (!pet || pet.cat) { setTimeout(() => G.go('home'), 50); return; }
    scene.add(pet.root); pet.stop(); pet.ctl = null; pet.baseY = 0; pet.extraPitch = 0;
    pet.bounds = (p) => { p.pos.x = U.clamp(p.pos.x, -AREA.x, AREA.x); p.pos.z = U.clamp(p.pos.z, -AREA.z, AREA.z); };
    pet.brain = (p) => (function* () { p.lookCam = 2; p.setPose('sit'); yield* p.wait(2); })();
    pet.pos.set(mode === 'agility' ? -10 : 0, 0, mode === 'agility' ? -6 : 0.5); pet.heading = mode === 'agility' ? 0.6 : 0;
    st = null; for (const o of obstacles) scene.remove(o.g); obstacles = []; marker.visible = false; ring.visible = false;
    judge.pos.set(mode === 'agility' ? -AREA.x + 1.5 : -1.6, 0, mode === 'agility' ? -AREA.z + 1.2 : -1.2); judge.heading = mode === 'agility' ? 0.8 : 0.4;
    lookV.copy(pet.pos);
    setTimeout(menu, 400);
  };
  T.onVoice = function (kind, id) { if (mode === 'obedience' && st && st.phase === 'obey' && kind === 'trick') judgeGesture(id); return true; };
  T.debug = () => ({ st, obstacles, pet });
  T.exit = function () { if (pet) { scene.remove(pet.root); pet.stop(); pet.extraPitch = 0; pet.baseY = 0; } $('#contestHud').classList.add('hidden'); G.ui.hint(null); G.ui.banner('', null, 1); st = null; };
  T.dock = () => [{ label: 'Events', icon: 'trophy', fn: () => { if (!st || st.phase === 'done') menu(); } }, { label: 'Leave', icon: 'door', cls: 'go', fn: () => G.go(from === 'walk' ? 'walk' : 'home', { from: 'field' }) }];
  function menu() {
    st = null; $('#contestHud').classList.add('hidden');
    const list = G.TRIALS[mode];
    G.ui.sheet({ title: mode === 'agility' ? 'Agility trial' : 'Obedience trial', render(body) {
      if (mode === 'agility') G.ui.note(body, 'Hold on the ground (or WASD) to lead ' + pet.name + ' to each numbered obstacle in order, head-on. Fastest time wins! An unhappy or tired pup may refuse obstacles.');
      else { const learned = G.TRICKS.filter((t) => (pet.d.tricks[t.id] || 0) >= 1); G.ui.note(body, 'Judge Hoshino calls commands. Perform each trick’s gesture on ' + pet.name + ' before time runs out. Only tricks ' + pet.name + ' has learned will be called (' + learned.length + ' learned).'); }
      const l = G.ui.list(body);
      list.forEach((c) => {
        const open = !c.need || G.petCups(pet.d)[c.need + '_won'];
        l.appendChild(G.ui.li({ icon: 'trophy', title: c.name, sub: open ? 'Entry ' + (c.fee ? c.fee + ' coins' : 'free') + ' · 1st prize ' + c.prize[0] + ' coins' : 'Locked: win the previous level first', lock: !open, fn: open ? () => {
          if (mode === 'obedience' && G.TRICKS.filter((t) => (pet.d.tricks[t.id] || 0) >= 1).length < 2) { G.ui.toast(pet.name + ' needs to know at least 2 tricks. Teach Sit and Lie down at home!'); return; }
          if (G.state.coins < c.fee) { G.ui.toast('Not enough coins.'); return; } G.state.coins -= c.fee; G.ui.closeSheet(true); start(c); } : null }));
      });
    } });
  }
  async function start(c) {
    st = { cls: c, phase: 'intro', t: 0, refusals: 0, idx: 0, score: 0, calls: [] };
    $('#contestHud').classList.remove('hidden');
    const port = G.M.icons.person('judge');
    await G.ui.say('Judge Hoshino', mode === 'agility' ? 'Welcome to the ' + c.name + '. Guide ' + pet.name + ' through all obstacles in numbered order. The clock starts on my whistle.' : 'Welcome to the ' + c.name + '. I will call ' + c.n + ' commands. Show me the teamwork between you and ' + pet.name + '.', port);
    G.ui.endDialog();
    if (mode === 'agility') {
      buildCourse(c.n); pet.stop(); pet.pos.set(-10, 0, -6); pet.heading = 0.6; pet.brain = null;
      G.ui.banner('Ready...', null, 900); await G.wait(1000); G.audio.play('whistle'); G.ui.banner('GO!', null, 700);
      st.phase = 'run'; st.t = 0; hud();
    } else {
      pet.stop(); pet.pos.set(0, 0, 0.5); pet.heading = 0; pet.brain = null;
      const learned = G.TRICKS.filter((t) => (pet.d.tricks[t.id] || 0) >= 1).map((t) => t.id);
      for (let i = 0; i < c.n; i++) st.calls.push(U.pick(learned));
      st.phase = 'obey'; nextCall();
    }
  }
  function hud() {
    if (!st) return;
    if (mode === 'agility') $('#contestHud').innerHTML = 'Time <span>' + st.t.toFixed(1) + 's</span> Obstacle <span>' + Math.min(st.idx + 1, obstacles.length) + '/' + obstacles.length + '</span>' + (st.refusals ? ' Refusals <span>' + st.refusals + '</span>' : '');
    else $('#contestHud').innerHTML = 'Command <span>' + Math.min(st.idx + 1, st.calls.length) + '/' + st.calls.length + '</span> Score <span>' + Math.round(st.score) + '</span>' + (st.callT !== undefined ? ' Time <span>' + Math.max(0, st.callT).toFixed(1) + '</span>' : '');
  }

  /* ---------------- agility ---------------- */
  function* doObstacle(o) {
    st.busy = true; steer = null;
    const refuseP = Math.max(0, (45 - pet.d.mood) / 120) + (pet.d.energy < 15 ? 0.3 : 0) + (st.cls.refuse ? 0.05 : 0);
    if (Math.random() < refuseP) { st.refusals++; pet.stop(); pet.setPose('sit'); pet.emote('q'); G.audio.play('aww'); G.ui.toast(pet.name + ' refused the obstacle! (+3s)'); st.t += 3; yield* pet.wait(1.0); pet.pos.addScaledVector(o.dir, -0.8); st.busy = false; return; }
    const spd = (3.4 + (pet.d.agility || 0) * 0.02) * pet.S;
    pet.heading = Math.atan2(o.dir.x, o.dir.z);
    const from = pet.pos.clone(); const to = o.exit.clone();
    const total = from.distanceTo(to); let d = 0; let jumped = false;
    const side = new V3(o.dir.z, 0, -o.dir.x);
    if (o.type === 'tunnel') pet.setPose('crouch'); else pet.setPose('stand');
    while (d < total) {
      d += spd * pet.dt * (o.type === 'weave' ? 0.6 : o.type === 'tunnel' ? 0.8 : 1);
      const k = Math.min(1, d / total);
      const p = from.clone().lerp(to, k);
      if (o.type === 'weave') { const local = k * total - 0.7; p.addScaledVector(side, Math.sin(local / 0.6 * Math.PI) * 0.32); pet.heading = Math.atan2(o.dir.x, o.dir.z) + Math.cos(local / 0.6 * Math.PI) * 0.7; }
      if (o.type === 'tunnel') { const tk = U.clamp((k * total - 0.7) / o.len, 0, 1); p.addScaledVector(side, -Math.sin(tk * Math.PI) * 0.3); }
      if (o.type === 'aframe') { const ak = U.clamp((k * total - 0.7) / o.len, 0, 1); pet.baseY = (ak < 0.5 ? ak * 2 : (1 - ak) * 2) * 0.88; pet.extraPitch = ak > 0 && ak < 1 ? (ak < 0.5 ? -0.55 : 0.55) : 0; }
      if ((o.type === 'hurdle' || o.type === 'tire') && !jumped && k * total > 0.7 + o.len / 2 - 0.55) { jumped = true; pet.jump(o.type === 'tire' ? 3.6 : 3.0); pet.setPose('leap', 10); G.audio.play('whoosh'); }
      pet.pos.x = p.x; pet.pos.z = p.z; pet.vel = spd;
      yield;
    }
    pet.baseY = 0; pet.extraPitch = 0; pet.setPose('stand'); pet.vel = spd * 0.6;
    G.audio.play('pop'); G.fx.spawn('sparkle', pet.pos.clone().setY(0.4), 3);
    st.idx++; st.busy = false; pet.d.agility = Math.min(100, (pet.d.agility || 0) + 0.4);
    if (st.idx >= obstacles.length) finishAgility();
  }
  function finishAgility() {
    st.phase = 'done'; G.audio.play('whistle'); const time = Math.round((st.t + st.refusals * 2) * 10) / 10;
    G.ui.banner('Finished!', time.toFixed(1) + ' seconds', 2000); G.audio.play('cheer'); specs.forEach((s) => (s.waveT = 2));
    results(time, true);
  }

  /* ---------------- obedience ---------------- */
  const PREP = { sit: 'stand', spin: 'stand', jump: 'stand', down: 'sit', paw: 'sit', beg: 'sit', speak: 'sit', rollover: 'lie', dead: 'lie' };
  function nextCall() {
    if (!st) return;
    if (st.idx >= st.calls.length) { st.phase = 'done'; const sc = Math.round(st.score / (st.calls.length * 20) * 100); G.ui.banner('All done!', 'Score ' + sc + ' / 100', 2000); G.audio.play('cheer'); results(sc, false); return; }
    const id = st.calls[st.idx]; const tr = G.TRICKS.find((t) => t.id === id);
    pet.stop(); pet.setPose(PREP[id] || 'sit'); pet.lookCam = 30;
    st.callT = st.cls.time; st.cur = id; st.answered = false;
    judge.talking = 1; G.audio.play('whistle');
    G.ui.banner(tr.name + '!', 'Do the gesture: ' + tr.hint.replace(/ while they are \w+( down)?\./, '.'), 1800);
    hud();
  }
  function judgeGesture(g) {
    if (!st || st.phase !== 'obey' || st.answered || st.waiting) return;
    const id = st.cur;
    if (g !== id) { st.score = Math.max(0, st.score - 3); G.audio.play('back'); pet.tiltT = 1; pet.emote('q', 0.8); G.ui.toast('Hmm, that’s not "' + G.TRICKS.find((t) => t.id === id).name + '"...'); return; }
    const p = 0.72 + pet.d.mood * 0.002 + (pet.d.bond || 0) * 0.002;
    st.waiting = true;
    pet.do((function* () {
      if (Math.random() > p) { pet.emote('q'); pet.tiltT = 1.2; G.ui.toast(pet.name + ' got distracted! Try again.'); yield* pet.wait(1); st.waiting = false; pet.setPose(PREP[id] || 'sit'); return; }
      yield* pet.trick(id);
      const pts = 10 + 10 * Math.max(0, st.callT) / st.cls.time; st.score += pts; st.answered = true; st.waiting = false;
      G.audio.play('chime'); pet.happy(2); G.ui.toast('+' + Math.round(pts) + ' — ' + U.pick(['Excellent!', 'Very good.', 'Lovely form.', 'Crisp!']));
      yield* pet.wait(0.6); st.idx++; nextCall();
    })());
  }
  function partOf(hit) {
    let part = hit.object.userData.part || 'back';
    if (part === 'torso') { const l = pet.m.body.worldToLocal(hit.point.clone()); part = l.y < -pet.m.dims.by * 0.3 ? 'belly' : 'back'; }
    else if (part === 'head' || part === 'muzzle') { const l = pet.m.hc.worldToLocal(hit.point.clone()); part = l.y < -pet.m.headR * 0.28 ? 'chin' : 'head'; }
    return part;
  }
  /* ---------------- input ---------------- */
  T.onDown = function (p) {
    if (!st) return;
    if (mode === 'agility') { if (st.phase === 'run' && !st.busy) { steer = { target: G.groundAt(p) }; } return; }
    if (st.phase !== 'obey') return;
    const hit = G.pick(p, pet.m.meshes, false)[0];
    if (hit) { touch = { p0: p, path: [p], angle: 0, prevA: null, part: partOf(hit) }; G.ui.cursor(G.IC.hand, p.x, p.y); pet.petT = 0; }
  };
  T.onMove = function (p, down) {
    if (mode === 'agility') { if (steer && down) { const g = G.groundAt(p); if (g) steer.target = g; } return; }
    if (!touch || !down) return;
    touch.path.push(p); G.ui.cursor(G.IC.hand, p.x, p.y);
    const sc = G.toScreen(pet.pos.clone().setY(pet.sizeH * 0.45)); const a = Math.atan2(p.y - sc.y, p.x - sc.x); if (touch.prevA !== null) touch.angle += U.angDiff(touch.prevA, a); touch.prevA = a;
    if (G.pick(p, pet.m.meshes, false)[0]) pet.petT = 0;
  };
  T.onUp = function (p) {
    steer = null; G.ui.cursor(null);
    if (mode !== 'obedience' || !touch) return;
    const Tt = touch; touch = null;
    const dx = p.x - Tt.p0.x, dy = p.y - Tt.p0.y, dur = p.t - Tt.p0.t;
    const pl = Tt.path.reduce((s, q, i) => (i ? s + Math.hypot(q.x - Tt.path[i - 1].x, q.y - Tt.path[i - 1].y) : 0), 0);
    const pn = pet.poseName; let g = null;
    if (p.tap) { if (Tt.part === 'paw') g = 'paw'; else if (Tt.part === 'nose') { if (pet._nose && p.t - pet._nose < 600) { g = 'speak'; pet._nose = 0; } else pet._nose = p.t; } }
    else if (Math.abs(Tt.angle) > 5.2 && pl > 240) g = 'spin';
    else if (dy < -70 && p.vy < -1300 && dur < 450 && pn === 'stand') g = 'jump';
    else if (dy > 55 && Math.abs(dx) < dy * 0.85) g = pn === 'stand' ? 'sit' : 'down';
    else if (dy < -55 && Math.abs(dx) < -dy * 0.85) g = 'beg';
    else if (Math.abs(dx) > 90 && Math.abs(dy) < Math.abs(dx) * 0.65) g = 'rollover';
    else if (dur > 1500 && G.input.moved < 30) g = 'dead';
    if (g) judgeGesture(g);
  };
  T.onCancel = function () { steer = null; touch = null; G.ui.cursor(null); };

  /* ---------------- results ---------------- */
  function results(score, lowerBetter) {
    const c = st.cls;
    const rivals = G.RIVALS.slice().sort(() => Math.random() - 0.5).slice(0, 5).map(([owner, dog, breed]) => ({ owner, dog, breed, score: Math.round(U.rand(c.rival[0], c.rival[1]) * 10) / 10 }));
    rivals.push({ owner: 'You', dog: pet.name, breed: pet.d.breed, score, me: true });
    rivals.sort((a, b) => (lowerBetter ? a.score - b.score : b.score - a.score));
    const place = rivals.findIndex((x) => x.me) + 1; const prize = place <= 3 ? c.prize[place - 1] : 15;
    G.state.coins += prize; G.state.stats.contests++;
    if (place <= 3) G.state.trophies.push({ cls: c.id, kind: mode, place, date: Date.now(), pet: pet.d.id });
    let prizeAcc = []; const PRZ = { ag3: 'medal_ag', ob3: 'medal_ob' }[c.id];
    if (place === 1) { G.petCups(pet.d)[c.id + '_won'] = true; if (PRZ) prizeAcc = G.givePrize([PRZ]); G.audio.play('fanfare'); G.fx.spawn('confetti', pet.pos.clone().setY(1.5), 50); } else if (place <= 3) G.audio.play('chime'); else G.audio.play('sad');
    G.checkStamps(); G.save();
    pet.do((function* () { pet.setPose('stand'); yield* pet.face(cam.position.x, cam.position.z); if (place <= 3) { pet.excite = 1; pet.voice(); yield* pet.act('beg', 1.6, 'happy'); } yield* pet.act('sit', 2); })());
    setTimeout(() => {
      G.ui.sheet({ title: place <= 3 ? ['', '1st place!', '2nd place!', '3rd place!'][place] : 'Results', render(body) {
        rivals.forEach((b, i) => { const r = document.createElement('div'); r.className = 'score' + (b.me ? ' me' : ''); r.innerHTML = '<span>' + (i + 1) + '. ' + U.esc(b.dog) + ' <small style="color:#7a5c46">(' + U.esc(b.owner) + ', ' + U.esc(G.BREEDS[b.breed].name) + ')</small></span><span>' + (lowerBetter ? b.score.toFixed(1) + 's' : b.score) + '</span>'; body.appendChild(r); });
        G.ui.note(body, 'Prize: ' + prize + ' coins' + (place <= 3 ? ' and a trophy!' : '. Practice makes perfect!') + (place === 1 && G.TRIALS[mode].find((x) => x.need === c.id) ? ' The next level is unlocked!' : ''));
        if (place === 1 && PRZ) G.ui.prizeBox(body, prizeAcc, [PRZ], pet);
        const r = document.createElement('div'); r.className = 'mrow';
        const again = document.createElement('button'); again.className = 'btn ghost'; again.textContent = 'Other events'; again.onclick = () => { G.ui.closeSheet(true); menu(); };
        const back = document.createElement('button'); back.className = 'btn orange'; back.textContent = from === 'walk' ? 'Back to town' : 'Go home'; back.onclick = () => G.go(from === 'walk' ? 'walk' : 'home', { from: 'field' });
        r.append(again, back); body.appendChild(r);
      } });
      G.ui.refresh();
    }, 2200);
  }

  /* ---------------- update ---------------- */
  T.update = function (dt) {
    if (!pet) return;
    judge.update(dt); for (const s of specs) { s.update(dt); s.lookAt = pet.pos; if (Math.random() < dt * 0.05) s.waveT = 1; }
    judge.lookAt = pet.pos;
    if (st && mode === 'agility' && st.phase === 'run') {
      st.t += dt; hud();
      const K = G.input.keys || {}; const kx = (K.KeyD || K.ArrowRight ? 1 : 0) - (K.KeyA || K.ArrowLeft ? 1 : 0), kz = (K.KeyS || K.ArrowDown ? 1 : 0) - (K.KeyW || K.ArrowUp ? 1 : 0);
      if (!st.busy) {
        let tgt = null; if (steer && steer.target) tgt = steer.target; if (kx || kz) tgt = pet.pos.clone().add(new V3(kx, 0, kz).multiplyScalar(3));
        if (tgt) { pet.task = null; pet.setPose('stand'); pet.moveTarget = tgt.clone(); const d = U.d2(pet.pos.x, pet.pos.z, tgt.x, tgt.z); pet.speedMul = d > 2.5 ? 3.0 + (pet.d.agility || 0) * 0.012 : 1.6; } else pet.moveTarget = null;
        const o = obstacles[st.idx];
        if (o) { const d = U.d2(pet.pos.x, pet.pos.z, o.entry.x, o.entry.z); const fwd = new V3(Math.sin(pet.heading), 0, Math.cos(pet.heading)); if (o.type === 'finish' ? U.d2(pet.pos.x, pet.pos.z, o.c.x, o.c.z) < 1.2 : d < 0.9 && fwd.dot(o.dir) > 0.2) { if (o.type === 'finish') { st.idx++; finishAgility(); } else { pet.moveTarget = null; pet.task = doObstacle(o); } } }
      }
      const o = obstacles[st.idx];
      marker.visible = !!o; ring.visible = !!o && o.type !== 'finish';
      if (o) { marker.position.copy(o.c).setY(2.2 + Math.sin(G.time * 4) * 0.12); ring.position.set(o.entry.x, 0.03, o.entry.z); ring.material.opacity = 0.5 + Math.sin(G.time * 6) * 0.3; }
    } else { marker.visible = false; ring.visible = false; }
    if (st && mode === 'obedience' && st.phase === 'obey' && !st.answered && !st.waiting) {
      st.callT -= dt; hud();
      if (st.callT <= 0) { G.audio.play('back'); G.ui.toast('Time! Moving on.'); pet.emote('sweat', 0.8); st.idx++; st.callT = undefined; setTimeout(nextCall, 700); st.answered = true; }
    }
    pet.update(dt);
    const portrait = G.aspect() < 0.9;
    let pos, look;
    if (mode === 'agility') { look = pet.pos.clone().setY(0.4); pos = look.clone().add(portrait ? new V3(0, 10, 9.5) : new V3(0, 6.5, 7.5)); }
    else { look = pet.pos.clone().setY(0.35); pos = look.clone().add(portrait ? new V3(0.2, 1.9, 3.6) : new V3(0.3, 1.3, 2.5)); }
    const k = 1 - Math.exp(-3 * dt); cam.position.lerp(pos, k); lookV.lerp(look, k); cam.lookAt(lookV);
  };
  return T;
})();
