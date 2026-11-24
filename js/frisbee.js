'use strict';
/* =========================================================
   Shiba Days — Disc Cup (flying disc contest)
   ========================================================= */
G.scenes.frisbee = (() => {
  const F = { music: 'contest', hideNeeds: true };
  let scene, cam, pet, mc, crowd, crowdData = [], disc, discId = 'disc', from = 'home', lookV = new V3(0, 0.8, 10), board, boardCtx, boardTex;
  let st = null; // contest state
  const HAND = new V3(0.35, 1.15, 0.2), SIT = new V3(1.0, 0, 0.7);
  F.init = function () {
    scene = new THREE.Scene(); F.scene = scene; scene.background = new THREE.Color('#9fd4ff'); scene.fog = new THREE.Fog('#9fd4ff', 50, 110);
    cam = new THREE.PerspectiveCamera(50, G.aspect(), 0.1, 200); F.camera = cam;
    const L = G.outdoorLights(scene, { shadow: 30 }); L.sun.position.set(-10, 25, 15); L.sun.target.position.set(0, 0, 25); F.L = L;
    build();
  };
  function build() {
    const M = G.M; const s = new THREE.Group();
    const g = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), M.mat('#fff', { map: G.grassTex('summer', 50), r: 1 })); g.rotation.x = -Math.PI / 2; g.receiveShadow = true; scene.add(g);
    const stripe = G.canvasTex(64, 64, (c) => { c.fillStyle = '#8fd06a'; c.fillRect(0, 0, 64, 64); c.fillStyle = '#7cc25a'; c.fillRect(0, 0, 64, 32); }, { repeat: [1, 8] });
    const field = new THREE.Mesh(new THREE.PlaneGeometry(22, 72), M.mat('#fff', { map: stripe, r: 1 })); field.rotation.x = -Math.PI / 2; field.position.set(0, 0.01, 34); field.receiveShadow = true; scene.add(field);
    const lineM = M.mat('#ffffff', { r: 1 });
    for (let z = 0; z <= 70; z += 5) {
      const l = new THREE.Mesh(new THREE.PlaneGeometry(22, z % 10 === 0 ? 0.14 : 0.07), lineM); l.rotation.x = -Math.PI / 2; l.position.set(0, 0.02, z); scene.add(l);
      if (z % 10 === 0 && z > 0) { const tex = G.textTex(z + 'm', { font: '700 72px Fredoka, sans-serif', color: '#ffffff', pad: 10 }); const lab = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.6 * tex.userData.h / tex.userData.w), M.basic('#fff', { map: tex, op: 0.9, dw: false })); lab.rotation.set(-Math.PI / 2, 0, Math.PI); lab.position.set(-8.5, 0.03, z - 0.7); scene.add(lab); const lab2 = lab.clone(); lab2.position.x = 8.5; scene.add(lab2); }
    }
    const throwLine = new THREE.Mesh(new THREE.PlaneGeometry(22, 0.2), M.mat('#e2574c')); throwLine.rotation.x = -Math.PI / 2; throwLine.position.set(0, 0.025, 1.0); scene.add(throwLine);
    // stands + crowd
    const standM = M.mat('#4aa6e0', { r: 0.7 }), standM2 = M.mat('#fff7ea', { r: 0.7 });
    for (const side of [-1, 1]) for (let r = 0; r < 4; r++) { const b = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.5 + r * 0.5, 50), r % 2 ? standM : standM2); b.position.set(side * (12.5 + r * 1.2), (0.5 + r * 0.5) / 2, 30); b.castShadow = true; b.receiveShadow = true; s.add(b); }
    const n = 160; const bodyG = new THREE.CapsuleGeometry(0.22, 0.35, 4, 8); const headG = new THREE.SphereGeometry(0.2, 10, 8);
    crowd = { body: new THREE.InstancedMesh(bodyG, M.mat('#ffffff', { r: 0.8 }), n), head: new THREE.InstancedMesh(headG, M.mat('#f0c7a6', { r: 0.7 }), n) };
    const col = new THREE.Color();
    for (let i = 0; i < n; i++) { const side = i % 2 ? 1 : -1; const r = Math.floor(Math.random() * 4); const z = U.rand(8, 54); crowdData.push({ x: side * (12.5 + r * 1.2), y: 0.5 + r * 0.5, z, ph: Math.random() * 6, jump: 0 }); crowd.body.setColorAt(i, col.setHSL(Math.random(), 0.6, 0.6)); crowd.head.setColorAt(i, col.set(U.pick(['#f6d2b8', '#e6b894', '#c99a76', '#8a5a3a', '#f3d0b5']))); }
    crowd.body.castShadow = true; scene.add(crowd.body); scene.add(crowd.head);
    // arch + banners + flags
    const arch = new THREE.Group(); arch.position.set(0, 0, 64); arch.rotation.y = Math.PI; s.add(arch);
    for (const sd of [-1, 1]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 4, 12), M.mat('#ee8a3c')); p.position.set(sd * 6, 2, 0); p.castShadow = true; arch.add(p); }
    const banTex = G.textTex('Maple Hill Disc Cup', { font: '700 80px Fredoka, sans-serif', bg: '#ee8a3c', color: '#fff', pad: 40 });
    const ban = new THREE.Mesh(new THREE.PlaneGeometry(9, 9 * banTex.userData.h / banTex.userData.w), M.mat('#fff', { map: banTex, side: THREE.DoubleSide })); ban.position.set(0, 3.6, 0); arch.add(ban);
    for (let z = 6; z < 66; z += 6) for (const sd of [-1, 1]) { const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.4, 6), M.mat('#ffffff')); pole.position.set(sd * 11.2, 1.2, z); s.add(pole); const fl = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.45), M.mat(['#e2574c', '#f2c24b', '#4aa6e0', '#79b25a'][(z / 6) % 4], { side: THREE.DoubleSide })); fl.position.set(sd * 11.2 + 0.36 * -sd, 2.15, z); fl.rotation.y = Math.PI / 2; scene.add(fl); }
    // scoreboard
    const bc = document.createElement('canvas'); bc.width = 512; bc.height = 256; boardCtx = bc.getContext('2d'); boardTex = new THREE.CanvasTexture(bc); boardTex.encoding = THREE.sRGBEncoding;
    board = new THREE.Mesh(new THREE.PlaneGeometry(8, 4), new THREE.MeshBasicMaterial({ map: boardTex })); board.position.set(0, 6.5, 74); board.rotation.y = Math.PI; scene.add(board);
    const bframe = new THREE.Mesh(new THREE.BoxGeometry(8.4, 4.4, 0.3), M.mat('#3b2a1f')); bframe.position.set(0, 6.5, 74.2); s.add(bframe);
    for (const sd of [-1, 1]) { const leg = new THREE.Mesh(new THREE.BoxGeometry(0.3, 4.5, 0.3), M.mat('#3b2a1f')); leg.position.set(sd * 3.5, 2.25, 74.2); s.add(leg); }
    for (let i = 0; i < 14; i++) { const t = M.tree('summer', 'round'); t.position.set(U.rand(-40, 40), 0, U.rand(80, 100)); t.scale.setScalar(U.rand(1.2, 2)); s.add(t); }
    for (let i = 0; i < 10; i++) { const t = M.tree('summer', i % 3 ? 'round' : 'pine'); t.position.set((i % 2 ? 1 : -1) * U.rand(20, 34), 0, U.rand(-5, 70)); t.scale.setScalar(U.rand(1.2, 1.8)); s.add(t); }
    scene.add(G.M.bake(s));
    mc = new G.Person('pepper', { key: 'pepper' }); mc.pos.set(-3.2, 0, 1.6); mc.heading = 0.7; scene.add(mc.root);
    const mic = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.02, 0.2, 8), M.mat('#222')); mic.position.set(0.05, -0.2, 0.05); mc.m.arms[1].add(mic);
  }
  function drawBoard(lines) {
    const g = boardCtx; g.fillStyle = '#1d2a24'; g.fillRect(0, 0, 512, 256);
    g.fillStyle = '#f2c24b'; g.font = '700 38px Fredoka, sans-serif'; g.textAlign = 'center'; g.fillText(lines[0] || '', 256, 54);
    g.fillStyle = '#ffffff'; g.font = '600 32px Fredoka, sans-serif';
    for (let i = 1; i < lines.length; i++) g.fillText(lines[i], 256, 54 + i * 52);
    boardTex.needsUpdate = true;
  }

  F.enter = function (opts = {}) {
    from = opts.from || 'home';
    pet = G.activePet(); if (!pet || pet.cat) { setTimeout(() => G.go('home'), 50); return; }
    scene.add(pet.root); pet.stop(); pet.ctl = null; pet.baseY = 0; pet.bounds = (p) => { p.pos.x = U.clamp(p.pos.x, -10.5, 10.5); p.pos.z = U.clamp(p.pos.z, -1, 70); };
    pet.pos.copy(SIT); pet.heading = 0; pet.brain = sitBrain;
    discId = G.state.toys.prodisc ? 'prodisc' : 'disc';
    if (disc) scene.remove(disc.mesh);
    disc = { mesh: G.M.item(discId), pos: new V3(), vel: new V3() }; disc.mesh.scale.setScalar(1.6); disc.mesh.visible = false; scene.add(disc.mesh);
    st = null; drawBoard(['Disc Cup', 'Welcome!', '', '']);
    cam.position.set(0.6, 1.8, -3.4); lookV.set(0, 0.9, 10);
    setTimeout(classMenu, 450);
  };
  F.debug = () => st;
  F.exit = function () { $('#dock').style.visibility = ''; if (pet) { if (pet.carry) pet.drop(scene); scene.remove(pet.root); pet.stop(); } $('#contestHud').classList.add('hidden'); G.ui.hint(null); st = null; };
  F.dock = () => [{ label: 'Cups', icon: 'trophy', fn: () => { if (!st || st.phase === 'done') { st = null; classMenu(); } } }, { label: 'Leave', icon: 'door', cls: 'go', fn: () => G.go(from === 'walk' ? 'walk' : 'home', { from: 'field' }) }];
  function* sitBrain(p) { p.lookCam = 2; yield* p.face(p.pos.x, p.pos.z + 5); p.setPose('sit'); yield* p.wait(2); if (st && st.phase === 'ready' && U.chance(0.4)) { p.excite = 1; p.voice(); } }

  /* ---------------- menus ---------------- */
  function classMenu() {
    $('#dock').style.visibility = '';
    G.ui.sheet({ title: 'Disc Cup entry', render(body) {
      G.ui.note(body, 'Three throws each. Catches score their distance in meters, and flying catches score x1.5! Win a cup to unlock the next one.');
      const l = G.ui.list(body);
      l.appendChild(G.ui.li({ icon: 'disc', title: 'Practice', sub: 'Free throws, no pressure. Builds disc skill.', fn: () => { G.ui.closeSheet(true); start(null); } }));
      G.CONTESTS.forEach((c) => {
        const open = G.state.unlocked[c.id]; const best = G.state.trophies.filter((t) => t.cls === c.id).reduce((m, t) => Math.min(m, t.place), 9);
        l.appendChild(G.ui.li({ icon: 'trophy', title: c.name + (best < 9 ? ' — best: ' + ['', '1st', '2nd', '3rd'][best] : ''), sub: open ? 'Entry ' + (c.fee ? c.fee + ' coins' : 'free') + ' · 1st prize ' + c.prize[0] + ' coins' : 'Locked: win the ' + G.CONTESTS.find((x) => x.id === c.need).name + ' first', lock: !open, fn: open ? () => { if (G.state.coins < c.fee) { G.ui.toast('Not enough coins for the entry fee.'); return; } G.ui.closeSheet(true); G.state.coins -= c.fee; G.ui.refresh(); start(c); } : null }));
      });
      G.ui.note(body, pet.name + '’s disc skill: ' + Math.round(pet.d.disc || 0) + '/100' + (discId === 'prodisc' ? ' · using the Pro Disc!' : ''));
    } });
  }
  async function start(cls) {
    st = { cls, practice: !cls, throw: 0, total: 0, scores: [], phase: 'intro', wind: 0 };
    $('#contestHud').classList.remove('hidden'); $('#dock').style.visibility = 'hidden';
    if (cls) {
      const port = G.M.icons.person('pepper');
      await G.ui.say('MC Pepper', U.pick(['Welcome, welcome to the ' + cls.name + '!', 'Laaadies and gentlemen and good dogs! The ' + cls.name + ' is ON!']), port);
      await G.ui.say('MC Pepper', 'Next up: ' + pet.name + ' the ' + G.BREEDS[pet.d.breed].name + '! Three throws. Let’s see some air!', port);
      G.ui.endDialog();
      mc.waveT = 1.5; G.audio.play('cheer');
    }
    nextThrow();
  }
  function nextThrow() {
    if (!st) return;
    if (!st.practice && st.throw >= 3) { finish(); return; }
    st.throw++; st.phase = 'ready';
    const hard = st.cls && (st.cls.id === 'expert' || st.cls.id === 'champ');
    st.wind = st.cls ? U.rand(-1, 1) * (hard ? 1.6 : st.cls.id === 'open' ? 0.8 : 0.3) : U.rand(-0.4, 0.4);
    pet.stop(); pet.brain = sitBrain;
    pet.do((function* () { if (pet.carry) pet.drop(scene); yield* pet.goto(SIT.x, SIT.z, { speed: 2 }); yield* pet.face(SIT.x, SIT.z + 5); pet.setPose('sit'); pet.excite = 0.6; })());
    disc.mesh.visible = true; disc.flying = false; disc.mesh.scale.setScalar(1.6);
    hud();
    G.ui.banner(st.practice ? 'Practice' : 'Throw ' + st.throw + ' / 3', st.practice ? 'Flick up to throw' : null, 1200);
    G.ui.hint('Flick upward to throw! Faster = farther. Aim with the angle.', 3500);
    if (st.practice) G.ui.prompts([{ label: 'Done practicing', cls: 'orange', fn: () => { st = null; $('#contestHud').classList.add('hidden'); G.ui.prompts([]); disc.mesh.visible = false; classMenu(); } }]);
  }
  function hud() {
    if (!st) return;
    const w = st.wind; const arrow = Math.abs(w) < 0.15 ? 'calm' : (w > 0 ? '← ' : '') + Math.abs(w).toFixed(1) + (w < 0 ? ' →' : '');
    $('#contestHud').innerHTML = st.practice ? 'Practice <span>Skill ' + Math.round(pet.d.disc || 0) + '</span> Wind <span>' + arrow + '</span>' : 'Throw <span>' + st.throw + '/3</span> Score <span>' + st.total.toFixed(1) + '</span> Wind <span>' + arrow + '</span>';
    drawBoard([st.practice ? 'Practice' : st.cls.name, pet.name, st.practice ? '' : 'Score ' + st.total.toFixed(1), st.scores.map((s) => s.toFixed(1)).join('  ')]);
  }

  /* ---------------- throwing ---------------- */
  F.onDown = function () { if (st && st.phase === 'ready') st.aim = true; };
  F.onMove = function (p, down) { if (st && st.phase === 'ready' && down) { const off = (p.x / innerWidth - 0.5) * 0.6; HAND.x = 0.35 + off; } };
  F.onUp = function (p) {
    if (!st || st.phase !== 'ready') return;
    const up = -p.vy / innerHeight;
    if (up < 0.55 || p.dur > 1500) { if (!p.tap) G.ui.toast('Flick upward faster to throw!'); return; }
    const pro = discId === 'prodisc' ? 1.1 : 1;
    const s = U.clamp(3.5 + up * 2.5, 4, 18) * pro;
    const ang = U.clamp(p.vx / Math.max(250, -p.vy) * 0.9, -0.5, 0.5);
    throwDisc(s, ang);
  };
  function simulate(s, ang, wind) {
    const pos = HAND.clone(); const vel = new V3(Math.sin(ang) * s, s * 0.06 + 1.0, Math.cos(ang) * s);
    const out = []; const dt = 1 / 60; let t = 0; const L = discId === 'prodisc' ? 9.75 : 9.6;
    while (t < 10) {
      const h = Math.hypot(vel.x, vel.z); const lift = L * Math.min(1, Math.pow(h / 7, 2));
      vel.y += (lift - 9.8) * dt; vel.y *= Math.exp(-0.6 * dt); vel.x += -wind * dt * 0.9; vel.x *= Math.exp(-0.45 * dt); vel.z *= Math.exp(-0.45 * dt);
      pos.addScaledVector(vel, dt); t += dt;
      out.push({ t, p: pos.clone() });
      if (pos.y <= 0.03) break;
    }
    return out;
  }
  function throwDisc(s, ang) {
    st.phase = 'flight'; G.ui.hint(null); G.ui.prompts([]);
    G.audio.play('whoosh'); G.state.stats.throws++;
    const path = simulate(s, ang, st.wind);
    st.path = path; st.t = 0; disc.flying = true;
    // plan intercept
    const skill = pet.d.disc || 0; const spd = (6.5 + skill * 0.035) * pet.S; const delay = 0.3 - skill * 0.0012;
    const reach = (pet.m.baseH + pet.m.dims.by + pet.m.headR) * pet.S + 0.05; const jumpReach = reach + 0.55 + skill * 0.006;
    let plan = null;
    for (let i = 0; i < path.length; i++) {
      const q = path[i]; if (q.p.y > jumpReach) continue;
      const need = U.d2(pet.pos.x, pet.pos.z, q.p.x, q.p.z) / spd + delay;
      if (need <= q.t) { plan = { i, t: q.t, p: q.p.clone(), flying: q.p.y > reach + 0.02 }; break; }
    }
    st.plan = plan; st.landing = path[path.length - 1].p.clone();
    st.result = null;
    pet.stop(); pet.brain = null; pet.excite = 1;
    pet.do((function* () {
      yield* pet.wait(Math.max(0.05, delay - 0.1)); pet.voice();
      const tgt = plan ? plan.p : st.landing;
      pet.setPose('stand'); pet.moveTarget = new V3(tgt.x, 0, tgt.z); pet.speedMul = spd / pet.S;
      let jumped = false;
      while (st && st.phase === 'flight') {
        if (plan) {
          const d = U.d2(pet.pos.x, pet.pos.z, plan.p.x, plan.p.z);
          if (d < 0.3) { pet.moveTarget = null; pet.lookTarget = disc.pos; }
          if (plan.flying && !jumped && st.t >= plan.t - 0.32) { jumped = true; const need = plan.p.y - reach; pet.jump(Math.sqrt(Math.max(0.5, 2 * 9.8 * need)) + 0.4); pet.setPose('leap', 10); }
          if (st.t >= plan.t - 0.001 || (disc.landed && !disc.flying)) { catchIt(); break; }
        } else if (disc.landed) break;
        yield;
      }
      pet.lookTarget = null;
    })());
  }
  function catchIt() {
    const plan = st.plan; st.phase = 'result';
    disc.flying = false; disc.mesh.visible = false;
    const m = G.M.item(discId); pet.grab({ id: discId, mesh: m, pos: new V3(), vel: new V3() }, 'toy');
    const dist = Math.max(0, plan.p.z - 1.0); const mult = plan.flying ? 1.5 : 1; const sc = Math.round(dist * mult * 10) / 10;
    G.state.stats.catches++; pet.d.catches = (pet.d.catches || 0) + 1;
    pet.d.disc = Math.min(100, (pet.d.disc || 0) + (plan.flying ? 2 : 1) * (st.practice ? 0.6 : 1));
    if (plan.flying) { G.stamp('flying'); G.audio.play('cheer'); G.audio.play('sparkle'); G.fx.spawn('confetti', plan.p.clone(), 30); G.fx.spawn('star', plan.p.clone(), 8); crowdJump(1.2); }
    else { G.audio.play('cheer'); crowdJump(0.6); }
    G.vibrate(30);
    if (!st.practice) { st.total += sc; st.scores.push(sc); }
    G.ui.banner(plan.flying ? 'Flying catch!' : 'Nice catch!', dist.toFixed(1) + 'm' + (plan.flying ? ' x1.5 = ' + sc.toFixed(1) : ''), 1800);
    hud(); returnDog();
  }
  function missed() {
    st.phase = 'result'; G.audio.play('aww');
    if (!st.practice) st.scores.push(0);
    G.ui.banner('Missed!', 'The disc landed first', 1500); hud();
    pet.stop(); pet.do((function* () {
      yield* pet.goto(disc.pos.x, disc.pos.z, { speed: 5, near: 0.3 });
      disc.mesh.visible = false; const m = G.M.item(discId); pet.grab({ id: discId, mesh: m, pos: new V3(), vel: new V3() }, 'toy'); pet.emote('sweat');
      returnDog(true);
    })());
  }
  function returnDog(already) {
    const go = function* () {
      yield* pet.wait(0.5);
      yield* pet.goto(SIT.x, SIT.z + 0.3, { speed: 4.5, timeout: 20 }); yield* pet.face(0, -3);
      pet.setPose('sit'); pet.lookCam = 2; yield* pet.wait(0.4);
      if (pet.carry) { pet.m.mouth.remove(pet.carry.mesh); pet.carry = null; }
      pet.happy(3); pet.voice('happy'); yield* pet.wait(0.6);
      setTimeout(nextThrow, 300);
    };
    if (already) { pet.task = null; } pet.do(go());
  }
  function crowdJump(a) { for (const c of crowdData) c.jump = a * U.rand(0.5, 1); }

  /* ---------------- results ---------------- */
  function finish() {
    st.phase = 'done'; disc.mesh.visible = false; $('#dock').style.visibility = '';
    const c = st.cls; const rivals = U.pick([0, 1]) ? G.RIVALS.slice().sort(() => Math.random() - 0.5).slice(0, 5) : G.RIVALS.slice(2, 7);
    const board2 = rivals.map(([owner, dog, breed]) => ({ owner, dog, breed, score: Math.round(U.rand(c.rival[0], c.rival[1]) * 10) / 10 }));
    board2.push({ owner: 'You', dog: pet.name, breed: pet.d.breed, score: Math.round(st.total * 10) / 10, me: true });
    board2.sort((a, b) => b.score - a.score);
    const place = board2.findIndex((x) => x.me) + 1;
    G.state.stats.contests++;
    let prize = place <= 3 ? c.prize[place - 1] : 15;
    if (place <= 3) { G.state.trophies.push({ cls: c.id, place, date: Date.now(), pet: pet.d.id }); pet.d.trophies = (pet.d.trophies || 0) + 1; }
    let unlockedNew = null;
    if (place === 1) { const idx = G.CONTESTS.indexOf(c); const nx = G.CONTESTS[idx + 1]; if (nx && !G.state.unlocked[nx.id]) { G.state.unlocked[nx.id] = true; unlockedNew = nx; } if (c.id === 'champ' && !G.state.acc.crown) { G.state.acc.crown = 1; } }
    G.state.coins += prize; G.save();
    if (place === 1) { G.audio.play('fanfare'); G.fx.spawn('confetti', pet.pos.clone().setY(1.5), 60); crowdJump(1.5); pet.excite = 1; }
    else if (place <= 3) { G.audio.play('chime'); crowdJump(0.8); } else G.audio.play('sad');
    drawBoard([c.name + ' results', ...board2.slice(0, 3).map((b, i) => (i + 1) + '. ' + b.dog + '  ' + b.score.toFixed(1))]);
    pet.do((function* () { yield* pet.face(0, -3); if (place <= 3) { yield* pet.act('beg', 1.8, 'happy'); pet.voice(); yield* pet.trick('spin'); } yield* pet.act('sit', 2); })());
    setTimeout(() => {
      G.ui.sheet({ title: place <= 3 ? ['', 'You won the ' + c.name + '!', '2nd place!', '3rd place!'][place] : 'Results', render(body) {
        board2.forEach((b, i) => { const r = document.createElement('div'); r.className = 'score' + (b.me ? ' me' : ''); r.innerHTML = '<span>' + (i + 1) + '. ' + U.esc(b.dog) + ' <small style="color:#7a5c46">(' + U.esc(b.owner) + ', ' + U.esc(G.BREEDS[b.breed].name) + ')</small></span><span>' + b.score.toFixed(1) + '</span>'; body.appendChild(r); });
        G.ui.note(body, 'Prize: ' + prize + ' coins' + (place <= 3 ? ' and a trophy for your shelf!' : '. Keep practicing!') + (unlockedNew ? ' The ' + unlockedNew.name + ' is now unlocked!' : '') + (c.id === 'champ' && place === 1 ? ' You also earned the Champion Crown!' : ''));
        const r = document.createElement('div'); r.className = 'mrow';
        const again = document.createElement('button'); again.className = 'btn ghost'; again.textContent = 'Enter another cup'; again.onclick = () => { G.ui.closeSheet(true); $('#contestHud').classList.add('hidden'); st = null; classMenu(); };
        const back = document.createElement('button'); back.className = 'btn orange'; back.textContent = from === 'walk' ? 'Back to town' : 'Go home'; back.onclick = () => G.go(from === 'walk' ? 'walk' : 'home', { from: 'field' });
        r.append(again, back); body.appendChild(r);
      } });
      G.ui.refresh();
    }, 2200);
  }

  /* ---------------- update ---------------- */
  F.update = function (dt) {
    if (!pet) return;
    pet.update(dt); mc.update(dt);
    mc.lookAt = pet.pos;
    // disc
    if (st && st.phase === 'ready') { disc.pos.copy(cam.localToWorld(new V3(HAND.x - 0.1, -0.55, -1.3))); disc.mesh.position.copy(disc.pos); disc.mesh.rotation.set(0.5, G.time, 0); disc.landed = false; }
    if (st && st.phase === 'flight') st.t += dt;
    if (st && st.phase === 'flight' && disc.flying) {
      const P = st.path; let i = 0; while (i < P.length - 1 && P[i].t < st.t) i++;
      disc.pos.copy(P[i].p); disc.mesh.position.copy(disc.pos); disc.mesh.rotation.y += dt * 22; disc.mesh.rotation.x = 0.08;
      if (i >= P.length - 1) { disc.flying = false; disc.landed = true; G.audio.play('thud'); if (!st.plan) missed(); }
    }
    // crowd
    const m4 = new THREE.Matrix4(); const q = new THREE.Quaternion();
    for (let i = 0; i < crowdData.length; i++) { const c = crowdData[i]; c.ph += dt * 3; c.jump = Math.max(0, c.jump - dt * 0.6); const y = c.y + 0.4 + Math.abs(Math.sin(c.ph)) * (0.04 + c.jump * 0.3); m4.compose(new V3(c.x, y, c.z), q, new V3(1, 1, 1)); crowd.body.setMatrixAt(i, m4); m4.compose(new V3(c.x, y + 0.5, c.z), q, new V3(1, 1, 1)); crowd.head.setMatrixAt(i, m4); }
    crowd.body.instanceMatrix.needsUpdate = true; crowd.head.instanceMatrix.needsUpdate = true;
    // camera: follows the action
    const portrait = G.aspect() < 0.9;
    let pos = portrait ? new V3(0.5, 2.6, -5.2) : new V3(0.6, 1.8, -3.4), look = new V3(0, 0.9, 10);
    if (st && (st.phase === 'flight' || st.phase === 'result')) {
      const dz = disc.flying ? disc.pos.z : pet.pos.z;
      look = new V3(pet.pos.x * 0.6, 0.7, (pet.pos.z + Math.min(dz, pet.pos.z + 10)) / 2 + 1.5); pos = new V3(pet.pos.x * 0.4 + 0.4, portrait ? 3.6 : 2.7, Math.max(-3.4, pet.pos.z - (portrait ? 8.5 : 6.5)));
    }
    if (st && st.phase === 'done') { look = pet.pos.clone().setY(0.4); pos = pet.pos.clone().add(new V3(1.2, 1.2, -2.6)); }
    const k = 1 - Math.exp(-2.6 * dt); cam.position.lerp(pos, k); lookV.lerp(look, k); cam.lookAt(lookV);
  };
  return F;
})();
