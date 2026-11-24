'use strict';
/* =========================================================
   Shiba Days — Pet: procedural animation + behaviour coroutines
   ========================================================= */
const POSE_KEYS = ['h', 'pitch', 'roll', 'fh', 'fk', 'bh', 'bk', 'hp', 'ht', 'tail', 'ear', 'mouth', 'lift', 'blift'];
function makePoses(P) {
  const { by, bz, bx } = P.dims; const bh0 = P.baseH;
  const base = { h: 0, pitch: 0, roll: 0, fh: 0, fk: 0, bh: 0, bk: 0, hp: 0, ht: 0, tail: 1, ear: 1, mouth: 0, lift: 0, blift: 0 };
  const mk = (o) => Object.assign({}, base, o);
  const sitH = by * 0.85 * 1.0 + 0.09 - bh0;
  return {
    stand: mk({}),
    sit: mk({ h: Math.min(-0.06, by * 1.35 - bh0), pitch: -0.55, fh: 0.18, fk: 0, bh: -0.78, bk: 2.75, hp: 0.42, tail: 0.85 }),
    lie: mk({ h: by * 0.92 - bh0, fh: -1.42, fk: 0.12, bh: -1.25, bk: 2.75, hp: -0.05, tail: 0.6 }),
    sleep: mk({ h: by * 0.88 - bh0, roll: 0.12, fh: -1.45, fk: 0.1, bh: -1.25, bk: 2.75, hp: 0.62, ht: 0.25, tail: 0.3, ear: 0.45 }),
    beg: mk({ h: by * 1.5 - bh0, pitch: -1.12, fh: -0.1, fk: 1.25, bh: -0.28, bk: 2.85, hp: 0.85, tail: 1, ear: 1 }),
    bow: mk({ h: Math.max(-0.16, by * 0.75 - bh0 + 0.03), pitch: 0.42, fh: -1.75, fk: 0.35, bh: -0.15, bk: 0.55, hp: -0.8, tail: 1.2, ear: 1 }),
    roll: mk({ h: by * 1.02 - bh0, roll: 2.75, fh: -0.5, fk: 1.1, bh: 0.4, bk: -0.9, hp: -0.2, ht: 0.3, tail: 0.6, ear: 0.4, mouth: 0.25 }),
    dead: mk({ h: bx * 1.05 - bh0, roll: 1.5, fh: -0.25, fk: 0.1, bh: 0.2, bk: 0.1, hp: 0.2, tail: 0.3, ear: 0.3, mouth: 0.35 }),
    eat: mk({ h: -0.025, pitch: 0.16, fh: -0.18, bh: -0.16, hp: 1.0, tail: 1 }),
    sniff: mk({ h: -0.012, pitch: 0.08, fh: -0.08, bh: -0.08, hp: 0.62, tail: 1 }),
    howl: mk({ h: Math.min(-0.06, by * 1.35 - bh0), pitch: -0.6, fh: 0.2, bh: -0.78, bk: 2.75, hp: -0.55, mouth: 0.9, tail: 0.9, ear: 0.7 }),
    paw: mk({ h: Math.min(-0.06, by * 1.35 - bh0), pitch: -0.55, fh: 0.18, bh: -0.78, bk: 2.75, hp: 0.35, lift: 1, tail: 1 }),
    crouch: mk({ h: -0.06, pitch: 0.05, fh: 0.25, fk: 0.5, bh: -0.5, bk: 0.9, hp: -0.1, tail: 1.1 }),
    leap: mk({ h: 0.02, pitch: -0.25, fh: -1.1, fk: 0.7, bh: 0.9, bk: 0.4, hp: -0.15, tail: 1.2, ear: 0.6 }),
    tug: mk({ h: -0.05, pitch: -0.15, fh: -0.35, fk: 0.1, bh: 0.2, bk: 0.6, hp: 0.1, tail: 1.1 }),
    groom: mk({ h: Math.min(-0.06, by * 1.35 - bh0), pitch: -0.55, fh: 0.18, bh: -0.78, bk: 2.75, hp: 0.75, ht: 0.35, lift: 1.25, tail: 0.8 }),
    stretch: mk({ h: -0.1, pitch: 0.35, fh: -1.6, fk: 0.2, bh: -0.25, bk: 0.4, hp: -0.4, tail: 1.2, mouth: 0.8 }),
  };
}

class Pet {
  constructor(data, opts = {}) {
    this.d = data; this.npc = !!opts.npc;
    this.spec = { breed: data.breed, coat: data.coat, size: data.size || (data.old ? 0.97 : 1) };
    this.m = G.M.pet(this.spec);
    this.B = this.m.B; this.cat = this.m.cat; this.S = this.m.S;
    this.root = this.m.root; this.root.userData.pet = this;
    for (const me of this.m.meshes) me.userData.pet = this;
    this.poses = makePoses(this.m);
    this.pose = Object.assign({}, this.poses.stand); this.poseName = 'stand'; this.poseK = 7;
    this.heading = 0; this.vel = 0; this.moveTarget = null; this.speedMul = 1; this.phase = Math.random() * 6;
    this.turnTo = null; this.task = null; this.brain = null; this.dt = 0; this.t = Math.random() * 10;
    this.lookTarget = null; this.lookYaw = 0; this.lookPitch = 0;
    this.excite = 0; this.pant = 0; this.blinkT = U.rand(1, 4); this.blinking = 0; this.eyeOverride = null; this.eyeMode = '';
    this.earSp = [{ a: 0, v: 0 }, { a: 0, v: 0 }]; this.prevVel = 0; this.twitch = 0; this.twitchSide = 0;
    this.jumpY = 0; this.jumpV = 0; this.airborne = false; this.squash = 0;
    this.shakeT = 0; this.wet = 0; this.kickT = 0; this.scratchT = 0; this.chewT = 0; this.spinV = 0;
    this.petT = 9; this.petPart = null; this.petPoint = new V3(); this.petLean = 0;
    this.carry = null; this.carryKind = null; this.busy = false; this.ctl = null;
    this.emoteSprite = null; this.emoteT = 0; this.voiceCd = 0;
    this.sizeH = (this.m.baseH + this.m.dims.by + this.m.headR * 2.4) * this.S;
    this.applyAcc();
    const sh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: G.tex.shadow, transparent: true, depthWrite: false, opacity: 0.55 }));
    sh.rotation.x = -Math.PI / 2; sh.position.y = 0.012; sh.renderOrder = 1; sh.scale.set(this.m.dims.bx * 3.2 * this.S, this.m.dims.bz * 3.6 * this.S, 1); this.root.add(sh); this.blob = sh;
  }
  get pos() { return this.root.position; }
  get name() { return this.d.name; }
  get species() { return this.cat ? 'cat' : 'dog'; }
  /* ---------------- accessories ---------------- */
  applyAcc() {
    for (const k in this.m.slots) { const s = this.m.slots[k]; while (s.children.length) s.remove(s.children[0]); }
    const acc = this.d.acc || {};
    for (const slot in acc) { const id = acc[slot]; if (id && G.ITEMS[id] && this.m.slots[slot]) { const a = G.M.acc(id); this.m.slots[slot].add(a); if (a.userData.pom) this.pom = a.userData.pom; } }
  }
  /* ---------------- voice ---------------- */
  voice(kind = 'bark') {
    if (this.voiceCd > 0 && kind !== 'force') return; this.voiceCd = 0.35;
    const p = (this.B.voice || 1) / Math.sqrt(this.S);
    if (this.cat) { if (kind === 'purr') G.audio.play('purr'); else if (kind === 'hiss') G.audio.play('hiss'); else G.audio.play('meow', p * U.rand(0.9, 1.1)); return; }
    if (kind === 'whine') G.audio.play('whine', p); else if (kind === 'happy') G.audio.play('happy', p); else if (kind === 'howl') G.audio.play('howl', p); else if (kind === 'yawn') G.audio.play('yawn', p); else if (kind === 'growl') G.audio.play('growl', p); else G.audio.play(Math.random() < 0.5 ? 'bark' : 'yip', p * U.rand(0.92, 1.08));
    this.mouthPop = 0.25;
  }
  /* ---------------- emotes ---------------- */
  emote(type, dur = 1.6) {
    const tex = G.tex.emo[type]; if (!tex) return;
    if (!this.emoteSprite) { this.emoteSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false })); this.emoteSprite.renderOrder = 10; this.root.add(this.emoteSprite); }
    this.emoteSprite.material.map = tex; this.emoteSprite.visible = true; this.emoteT = dur; this.emoteAge = 0;
  }
  fx(type, n = 1, o) { const p = this.headWorld(); p.y += 0.12 * this.S; G.fx.spawn(type, p, n, o); }
  headWorld(out = new V3()) { this.m.hc.getWorldPosition(out); return out; }
  mouthWorld(out = new V3()) { this.m.mouth.getWorldPosition(out); return out; }
  /* ---------------- care helpers (owned pets) ---------------- */
  happy(n = 1, hearts = true) {
    if (this.d.mood !== undefined) { this.d.mood = U.clamp(this.d.mood + n, 0, 100); this.d.bond = U.clamp((this.d.bond || 0) + n * 0.05, 0, 100); }
    if (hearts) this.fx('heart', Math.max(1, Math.round(n / 4)));
  }
  needs(dt) {
    const d = this.d; if (this.npc || d.hunger === undefined) return;
    const r = dt / 60;
    const active = Math.abs(this.vel) > 0.5 * this.S;
    const sleeping = this.poseName === 'sleep';
    d.hunger = U.clamp(d.hunger - r * (active ? 1.8 : 1.0), 0, 100);
    d.thirst = U.clamp(d.thirst - r * (active ? 2.6 : 1.3), 0, 100);
    d.energy = U.clamp(d.energy + (sleeping ? r * 14 : -r * (0.6 + (active ? 2.2 : 0))), 0, 100);
    d.clean = U.clamp(d.clean - r * (G.curName === 'walk' ? 1.4 : 0.3), 0, 100);
    const base = Math.min(d.hunger, d.thirst, d.clean + 30, d.energy + 25) * 0.55 + 45;
    d.mood = U.clamp(d.mood + (Math.min(base, 100) - d.mood) * r * 0.08, 0, 100);
  }
  /* ---------------- coroutine helpers ---------------- */
  endTask() { const t = this.task; this.task = null; if (t && t.return) { try { t.return(); } catch (e) { /* ignore */ } } }
  do(gen) { this.endTask(); this.task = gen; this.moveTarget = null; this.turnTo = null; }
  stop() { this.endTask(); this.moveTarget = null; this.turnTo = null; }
  *wait(s) { let t = 0; while (t < s) { t += this.dt; yield; } }
  *waitUntil(fn, max = 30) { let t = 0; while (!fn() && t < max) { t += this.dt; yield; } }
  *goto(x, z, o = {}) {
    const near = o.near ?? 0.12; const timeout = o.timeout ?? 15;
    this.setPose('stand');
    this.moveTarget = new V3(x, 0, z); this.speedMul = o.speed ?? 1; let t = 0;
    while (this.moveTarget) {
      const d = U.d2(this.pos.x, this.pos.z, this.moveTarget.x, this.moveTarget.z);
      if (d < near) break; t += this.dt; if (t > timeout) break;
      if (o.follow) { const p = o.follow(); if (!p) break; this.moveTarget.set(p.x, 0, p.z); }
      yield;
    }
    this.moveTarget = null;
  }
  *face(x, z, tol = 0.12) {
    this.turnTo = Math.atan2(x - this.pos.x, z - this.pos.z); let t = 0;
    while (this.turnTo !== null && Math.abs(U.angDiff(this.heading, this.turnTo)) > tol && t < 2) { t += this.dt; yield; }
    this.turnTo = null;
  }
  *act(pose, s, eyes) { this.setPose(pose); if (eyes) this.eyeOverride = eyes; yield* this.wait(s); if (eyes) this.eyeOverride = null; }
  setPose(name, k) { if (!this.poses[name]) return; this.poseName = name; this.poseK = k || (name === 'stand' ? 8 : 6); }
  jump(v = 3.2) { if (this.airborne) return; this.jumpV = v * Math.sqrt(this.S); this.airborne = true; this.squash = -0.08; }
  /* ---------------- tricks ---------------- */
  *trick(id) {
    const p = this.poseName;
    switch (id) {
      case 'sit': yield* this.act('sit', 1.6); break;
      case 'down': if (p !== 'sit' && p !== 'lie') yield* this.act('sit', 0.4); yield* this.act('lie', 1.8); break;
      case 'paw': if (p !== 'sit') yield* this.act('sit', 0.45); yield* this.act('paw', 1.4); this.setPose('sit'); yield* this.wait(0.4); break;
      case 'beg': if (p !== 'sit') yield* this.act('sit', 0.45); yield* this.act('beg', 1.8, 'happy'); this.setPose('sit'); yield* this.wait(0.4); break;
      case 'spin': { this.setPose('stand'); yield* this.wait(0.2); let a = 0; this.spinV = 9; while (a < Math.PI * 2) { a += this.spinV * this.dt; this.heading += this.spinV * this.dt; yield; } this.spinV = 0; this.excite = 1; break; }
      case 'jump': this.setPose('stand'); yield* this.act('crouch', 0.25); this.jump(3.4); this.setPose('leap', 10); yield* this.waitUntil(() => !this.airborne, 2); this.setPose('stand'); yield* this.wait(0.3); break;
      case 'rollover': {
        if (p !== 'lie') yield* this.act('lie', 0.5);
        this.setPose('roll', 5); yield* this.wait(0.55);
        const r0 = this.heading; let a = 0; while (a < 1) { a += this.dt * 2.2; yield; }
        this.setPose('lie', 5); yield* this.wait(0.8); this.excite = 1; void r0; break;
      }
      case 'dead': if (p !== 'lie') yield* this.act('lie', 0.5); this.setPose('dead', 4); this.eyeOverride = 'closed'; yield* this.wait(2.2); this.eyeOverride = null; this.setPose('lie'); yield* this.wait(0.5); this.excite = 1; break;
      case 'speak': this.lookCam = 1; this.voice('force'); yield* this.wait(0.3); this.voiceCd = 0; this.voice('force'); yield* this.wait(0.5); break;
      default: break;
    }
  }
  /* ---------------- common behaviours ---------------- */
  *shake() { this.setPose('stand'); yield* this.wait(0.15); this.shakeT = 1.1; G.audio.play('shake'); yield* this.wait(1.15); }
  *yawn() { this.eyeOverride = 'closed'; this.yawnT = 1.1; this.voice('yawn'); yield* this.wait(1.15); this.eyeOverride = null; }
  *scratch() { if (this.poseName !== 'sit') yield* this.act('sit', 0.5); this.scratchT = 1.6; this.eyeOverride = 'happy'; yield* this.wait(1.7); this.eyeOverride = null; }
  *stretch() { yield* this.act('stretch', 1.4, 'closed'); this.setPose('stand'); yield* this.wait(0.3); }
  *groom() { if (this.poseName !== 'sit') yield* this.act('sit', 0.5); this.setPose('groom'); this.chewT = 2; this.eyeOverride = 'closed'; yield* this.wait(2.2); this.eyeOverride = null; this.setPose('sit'); }
  *sniffAround(n = 2) { for (let i = 0; i < n; i++) { const a = Math.random() * 6.28; this.setPose('sniff'); this.moveTarget = new V3(this.pos.x + Math.cos(a) * 0.4, 0, this.pos.z + Math.sin(a) * 0.4); this.speedMul = 0.35; yield* this.waitUntil(() => !this.moveTarget || U.d2(this.pos.x, this.pos.z, this.moveTarget.x, this.moveTarget.z) < 0.1, 2); this.moveTarget = null; this.setPose('sniff'); if (U.chance(0.5)) G.audio.play('sniff'); yield* this.wait(0.8); } this.setPose('stand'); }
  *zoomies(cx, cz, rad, laps = 1.5) {
    this.excite = 1; let a = Math.atan2(this.pos.z - cz, this.pos.x - cx); const dir = U.chance(0.5) ? 1 : -1; let t = 0;
    while (t < laps * 6.28) { t += this.dt * 2.6; a += dir * this.dt * 2.6; this.setPose('stand'); this.moveTarget = new V3(cx + Math.cos(a) * rad, 0, cz + Math.sin(a) * rad); this.speedMul = 3.2; if (U.chance(0.01)) this.voice(); yield; }
    this.moveTarget = null;
  }
  *idleLook(s) { this.setPose(U.chance(0.5) ? 'sit' : 'stand'); let t = 0; while (t < s) { t += this.dt; if (U.chance(0.004)) this.tiltT = 1.2; yield; } }
  /* ---------------- per-frame ---------------- */
  update(dt) {
    this.dt = dt; this.t += dt;
    this.voiceCd -= dt;
    this.needs(dt);
    if (this.ctl) this.ctl(this, dt);
    else {
      if (this.task) { const cur = this.task; let r; try { r = cur.next(); } catch (e) { console.error(e); r = { done: true }; } if (r.done && this.task === cur) this.task = null; }
      if (!this.task && this.brain) { try { this.task = this.brain(this); } catch (e) { console.error(e); } }
    }
    this.locomote(dt);
    this.animate(dt);
  }
  locomote(dt) {
    let target = 0; let turning = 0;
    if (this.moveTarget) {
      const dx = this.moveTarget.x - this.pos.x, dz = this.moveTarget.z - this.pos.z;
      const dist = Math.hypot(dx, dz);
      const want = Math.atan2(dx, dz); const diff = U.angDiff(this.heading, want);
      const tr = (this.speedMul > 2 ? 7 : 5) * dt;
      this.heading += U.clamp(diff, -tr, tr); turning = Math.abs(diff);
      target = this.speedMul * this.S * (this.cat ? 0.9 : 1.0) * (this.terrainMul ?? 1) * Math.min(1, dist / (0.35 * this.S) + 0.15) * (turning > 1.4 ? 0.25 : 1);
    } else if (this.turnTo !== null && this.turnTo !== undefined) {
      const diff = U.angDiff(this.heading, this.turnTo); const tr = 4.5 * dt;
      this.heading += U.clamp(diff, -tr, tr); turning = Math.abs(diff) > 0.05 ? 1 : 0;
    }
    this.vel = U.damp(this.vel, target, target > this.vel ? 5 : 7, dt);
    if (this.vel > 0.002) {
      this.pos.x += Math.sin(this.heading) * this.vel * dt;
      this.pos.z += Math.cos(this.heading) * this.vel * dt;
    }
    if (this.bounds) this.bounds(this);
    this.root.rotation.y = this.heading;
    const stride = 0.4 * this.S * (this.B.legL / 0.12 * 0.6 + 0.4);
    this.phase += dt * ((this.vel / stride) * Math.PI + (turning > 0.05 && this.vel < 0.1 ? 7 : 0) + (this.spinV ? 12 : 0));
    // panting
    if (this.vel > 1.8 * this.S) this.pant = Math.min(1, this.pant + dt * 0.25);
    else this.pant = Math.max(0, this.pant - dt * 0.06);
    // jump physics
    if (this.airborne || this.jumpY > 0) {
      this.jumpV -= 9.8 * dt; this.jumpY += this.jumpV * dt;
      if (this.jumpY <= 0) { this.jumpY = 0; this.jumpV = 0; if (this.airborne) { this.squash = 0.12; this.airborne = false; G.fx.spawn('puff', this.pos.clone().setY(0.05), 2); } }
    }
    this.root.position.y = this.jumpY + (this.baseY || 0);
    if (this.blob) { this.blob.position.y = 0.012 - this.root.position.y; const k = 1 / (1 + this.jumpY * 2.5); this.blob.material.opacity = 0.55 * k; this.blob.visible = this.poseName !== 'roll' || true; }
  }
  animate(dt) {
    const m = this.m, P = this.pose, T = this.poses[this.poseName] || this.poses.stand;
    for (const k of POSE_KEYS) P[k] = U.damp(P[k], T[k], this.poseK, dt);
    const t = this.t, S = this.S;
    const spd = this.vel / S;
    const moving = spd > 0.08 || this.spinV;
    const gallop = spd > 2.3;
    const A = gallop ? 0.85 : U.clamp(spd * 0.62, 0, 0.7) + (this.spinV ? 0.4 : 0) + (!moving && this.phase && this.turnTo !== null ? 0.25 : 0);
    const ph = this.phase;
    this.excite = Math.max(0, this.excite - dt * 0.35);
    // body
    let bob = 0, gp = 0;
    if (moving) { bob = gallop ? Math.sin(ph * 2) * 0.03 : -Math.abs(Math.sin(ph)) * 0.01 * Math.min(1, spd); gp = gallop ? Math.sin(ph) * 0.13 : 0; }
    this.squash = U.damp(this.squash, 0, 10, dt);
    const breath = Math.sin(t * (this.pant > 0.3 ? 16 : 3.2)) * (this.pant > 0.3 ? 0.018 : 0.01);
    let roll = P.roll, shake = 0;
    if (this.shakeT > 0) { this.shakeT -= dt; const e = Math.sin(Math.min(1, this.shakeT) * Math.PI); shake = Math.sin(t * 46) * 0.5 * e; roll += shake; if (this.wet > 0 && Math.random() < 0.6) { const p = this.root.position.clone(); p.y = m.baseH * S + 0.05; G.fx.spawn('drop', p, 2); } if (this.shakeT <= 0) this.wet = 0; }
    this.petT += dt;
    const petting = this.petT < 0.5;
    this.petLean = U.damp(this.petLean, petting ? 1 : 0, 5, dt);
    m.body.position.y = m.baseH + P.h + bob + this.squash * -0.3 * m.dims.by;
    if (this.flipL) G.discFlip(this, this.flipL); // flips play out on their own, even after the catch
    m.body.rotation.set(P.pitch + gp + (this.extraPitch || 0), 0, roll + this.petLean * 0.05 * Math.sin(t * 2));
    m.body.scale.set(1 + this.squash * 0.5, 1 + breath - this.squash, 1 + this.squash * 0.3);
    // legs
    for (let i = 0; i < 4; i++) {
      const L = m.legs[i]; const front = L.f > 0;
      let off = 0;
      if (gallop) off = front ? (L.s < 0 ? 0 : 0.35) : (L.s < 0 ? Math.PI : Math.PI + 0.35);
      else off = (i === 0 || i === 3) ? 0 : Math.PI;
      const sw = Math.sin(ph + off), lift = Math.max(0, Math.cos(ph + off));
      let hip = (front ? P.fh : P.bh) - sw * A * (front ? 1 : 0.9);
      let knee = (front ? P.fk : P.bk) + lift * A * (front ? 1.1 : 0.9);
      if (gallop) { hip -= sw * 0.2; }
      if (front && L.s > 0) { hip -= P.lift * 1.25; knee += P.lift * 0.55; }
      if (front && L.s < 0 && P.lift > 1.1) { hip -= 0.2; }
      if (!front && L.s > 0 && (this.scratchT > 0 || this.kickT > 0)) { hip += -0.55 + Math.sin(t * 30) * 0.4; knee += 0.4; }
      if (this.airborne && !gallop) { hip += front ? -0.25 : 0.25; }
      if (this.digT > 0 && front) { hip += Math.sin(t * 22 + (L.s > 0 ? Math.PI : 0)) * 0.55 - 0.3; knee += 0.5; }
      L.hip.rotation.x = hip; L.knee.rotation.x = knee;
      L.hip.rotation.z = (this.poseName === 'dead' ? 0 : 0) + (P.roll > 1 ? -L.s * 0.25 : 0);
    }
    this.scratchT = Math.max(0, this.scratchT - dt); this.kickT = Math.max(0, this.kickT - dt);
    if (this.digT > 0) { this.digT -= dt; if (Math.random() < 0.3) G.fx.spawn('puff', this.root.position.clone().add(new V3(Math.sin(this.heading) * 0.2, 0.05, Math.cos(this.heading) * 0.2)), 1); }
    // head look
    let yawT = 0, pitchT = 0;
    const lt = this.lookTarget || (this.lookCam ? G.cur && G.cur.camera && G.cur.camera.position : null);
    if (lt && this.poseName !== 'sleep' && this.poseName !== 'dead') {
      const np = m.neck.getWorldPosition(this._tmp || (this._tmp = new V3()));
      const dx = lt.x - np.x, dy = lt.y - np.y, dz = lt.z - np.z;
      const ang = Math.atan2(dx, dz); yawT = U.clamp(U.angDiff(this.heading, ang), -1.1, 1.1);
      pitchT = U.clamp(-Math.atan2(dy, Math.hypot(dx, dz)), -0.75, 0.6) - (P.pitch * -1) * 0;
      if (P.roll > 1) { yawT *= 0.3; pitchT *= 0.3; }
    }
    if (this.lookCam > 0) this.lookCam -= dt;
    this.lookYaw = U.damp(this.lookYaw, yawT, 5, dt);
    this.lookPitch = U.damp(this.lookPitch, pitchT, 5, dt);
    if (this.tiltT > 0) this.tiltT -= dt;
    const tilt = this.tiltT > 0 ? Math.sin(Math.min(1, this.tiltT) * Math.PI) * 0.42 * (this.tiltDir || 1) : 0;
    let nod = 0;
    if (this.chewT > 0) { this.chewT -= dt; nod = Math.sin(t * 14) * 0.05; }
    m.head.rotation.set(P.hp + this.lookPitch + nod - (petting && this.petPart === 'chin' ? 0.35 : 0) + (moving && !gallop ? Math.sin(ph * 2) * 0.03 : 0),
      this.lookYaw - shake * 0.6, P.ht + tilt + (petting ? Math.sin(t * 2.2) * 0.12 : 0) - shake * 0.5);
    if (this.gnaw) { m.head.rotation.x += 0.45 + Math.sin(t * 15) * 0.14; m.head.rotation.z += Math.sin(t * 6) * 0.3; m.head.rotation.y += Math.sin(t * 3.3) * 0.25; }
    // mouth / tongue
    this.mouthPop = Math.max(0, (this.mouthPop || 0) - dt);
    let mouth = P.mouth + (this.mouthPop > 0 ? 0.55 : 0) + this.pant * 0.45 + (this.chewT > 0 ? (Math.sin(t * 14) * 0.5 + 0.5) * 0.4 : 0);
    if (this.yawnT > 0) { this.yawnT -= dt; mouth += Math.sin(Math.min(1, this.yawnT) * Math.PI) * 1.1; }
    if (this.carry) mouth = Math.max(mouth, 0.45);
    if (petting && this.petPart !== 'tail') mouth = Math.max(mouth, 0.3);
    m.jaw.rotation.x = U.clamp(mouth, 0, 1.2) * 0.42;
    const tOut = Math.max(this.pant, this.poseName === 'dead' ? 1 : 0, this.lickT > 0 ? 1 : 0);
    if (this.lickT > 0) this.lickT -= dt;
    m.tongue.position.z = m.tongueBase.z + tOut * m.headR * (0.16 + (this.lickT > 0 ? Math.sin(t * 16) * 0.06 : 0));
    m.tongue.position.y = m.tongueBase.y - tOut * m.headR * 0.04;
    m.tongue.rotation.x = tOut * 0.5 + (this.pant > 0.3 ? Math.sin(t * 16) * 0.08 : 0);
    // eyes
    this.blinkT -= dt;
    if (this.blinkT < 0) { this.blinking = 0.13; this.blinkT = U.rand(2, 5.5); }
    this.blinking -= dt;
    let mode = this.eyeOverride || (this.poseName === 'sleep' ? 'closed' : petting && this.petPart !== 'tail' ? 'happy' : this.excite > 0.6 ? 'happy' : 'open');
    if (mode !== this.eyeMode) { this.eyeMode = mode; for (const e of m.eyes) { e.open.visible = mode === 'open'; e.happy.visible = mode === 'happy'; e.sleep.visible = mode === 'closed'; } }
    const bl = this.blinking > 0 ? 0.12 : 1;
    for (const e of m.eyes) e.open.scale.y = U.damp(e.open.scale.y, bl, 40, dt);
    // ears: perk + spring jiggle
    const acc = (this.vel - this.prevVel) / Math.max(dt, 0.001); this.prevVel = this.vel;
    this.twitch -= dt; if (this.twitch < -U.rand(3, 9)) { this.twitch = 0.25; this.twitchSide = U.chance(0.5) ? 0 : 1; }
    const earT = petting ? 0.25 : P.ear;
    for (let i = 0; i < m.ears.length; i++) {
      const E = m.ears[i], sp = this.earSp[i];
      const imp = -acc * 0.004 - (this.airborne ? this.jumpV * 0.02 : 0) + (moving ? Math.sin(ph * 2 + i) * 0.4 * Math.min(spd, 2) * 0.02 : 0) + shake * 0.3;
      sp.v += (-sp.a * 160 - sp.v * 12) * dt + imp; sp.a += sp.v * dt;
      const tw = this.twitch > 0 && this.twitchSide === i ? Math.sin(this.twitch * 25) * 0.25 : 0;
      if (this.B.ear === 'flop') { E.pivot.rotation.z = E.base.z + sp.a * 3 * E.s + (1 - earT) * 0.3 * E.s; E.pivot.rotation.x = E.base.x - sp.a; }
      else { E.pivot.rotation.x = E.base.x + (1 - earT) * -1.0 + sp.a + tw; E.pivot.rotation.z = E.base.z * (0.65 + 0.35 * earT) - (1 - earT) * E.s * 0.35; }
    }
    // tail
    let wagA, wagS;
    if (this.cat) { wagA = 0.18 + (petting ? 0.15 : 0); wagS = 1.6; }
    else {
      const mood = this.d.mood !== undefined ? this.d.mood : 70;
      wagA = petting ? 0.5 : this.excite > 0.2 ? 0.55 * this.excite + 0.15 : mood > 65 ? 0.2 : mood > 35 ? 0.08 : 0.02;
      if (this.poseName === 'sleep' || this.poseName === 'dead') wagA = 0.01;
      wagS = 9 + this.excite * 9 + (petting ? 8 : 0);
    }
    this.wagA = U.damp(this.wagA || 0, wagA, 4, dt);
    const tl = m.tail;
    tl.rotation.z = Math.sin(t * wagS) * this.wagA;
    tl.rotation.y = Math.sin(t * wagS + 1) * this.wagA * 0.3;
    tl.rotation.x = (1 - P.tail) * (this.B.tail === 'curl' ? 0.6 : 0.9) - (this.cat && moving ? -0.1 : 0);
    if (this.pom) this.pom.position.x = Math.sin(t * 10) * 0.004 + this.earSp[0].a * 0.05;
    // carried toy wobble
    if (this.carry && this.carryKind === 'plush' && this.excite > 0.5) m.head.rotation.y += Math.sin(t * 20) * 0.3 * this.excite;
    // emote
    if (this.emoteSprite && this.emoteSprite.visible) {
      this.emoteT -= dt; this.emoteAge += dt;
      const s = Math.min(1, this.emoteAge * 6) * (this.emoteT < 0.25 ? this.emoteT / 0.25 : 1);
      this.emoteSprite.scale.setScalar(0.32 * s);
      this.emoteSprite.position.set(0, this.sizeH / this.root.scale.y + 0.06 + Math.sin(this.t * 4) * 0.015, 0);
      if (this.emoteT <= 0) this.emoteSprite.visible = false;
    }
  }
  /* ---------------- toy handling ---------------- */
  grab(toyObj, kind = 'toy') {
    this.carry = toyObj; this.carryKind = kind;
    const mo = this.m.mouth; mo.add(toyObj.mesh);
    toyObj.mesh.position.set(0, 0, 0); toyObj.mesh.rotation.set(0, Math.PI / 2, 0);
    if (toyObj.id === 'disc' || toyObj.id === 'prodisc') { toyObj.mesh.rotation.set(Math.PI / 2.4, 0, 0); toyObj.mesh.position.set(0, -0.02, 0.07); }
    if (toyObj.id === 'rope') toyObj.mesh.rotation.set(0, 0, 0);
    toyObj.mesh.scale.setScalar(1 / (this.S * (this.m.headR / 0.165)));
    toyObj.held = this;
  }
  drop(scene) {
    const c = this.carry; if (!c) return null;
    const p = new V3(); c.mesh.getWorldPosition(p);
    scene.add(c.mesh); c.mesh.scale.setScalar(1); c.mesh.position.copy(p); c.mesh.rotation.set(0, this.heading, 0);
    c.pos.copy(p); c.vel.set(Math.sin(this.heading) * 0.4, 0.5, Math.cos(this.heading) * 0.4); c.held = null; c.rest = false;
    this.carry = null; this.carryKind = null;
    return c;
  }
}
G.Pet = Pet;

/* ---------------- shared pet registry for owned pets ---------------- */
G.petById = (id) => G.state.pets.find((p) => p.id === id);
G.petObj = function (id) {
  if (!G.pets[id]) { const d = G.petById(id); if (!d) return null; G.pets[id] = new Pet(d); }
  return G.pets[id];
};
G.activePet = function () { const d = G.petById(G.state.active) || G.state.pets[0]; return d ? G.petObj(d.id) : null; };
G.newPetData = function (o) {
  const id = 'p' + (G.state.nextId++);
  return Object.assign({
    id, name: 'Mochi', breed: 'shiba', coat: 'red', sex: 'boy', personality: 'playful',
    hunger: 80, thirst: 80, energy: 90, clean: 90, mood: 75, bond: 5, tricks: {}, disc: 5, walks: 0, born: Date.now(),
    acc: { collar: 'collar_red' }, trophies: 0, catches: 0, nameLearn: 0,
  }, o);
};
G.offlineDecay = function () {
  const s = G.state; const mins = Math.min(8 * 60, Math.max(0, (Date.now() - s.last) / 60000));
  if (mins < 2) return 0;
  for (const p of s.pets) {
    p.hunger = U.clamp(p.hunger - mins * 0.35, 8, 100); p.thirst = U.clamp(p.thirst - mins * 0.45, 8, 100);
    p.clean = U.clamp(p.clean - mins * 0.12, 15, 100); p.energy = U.clamp(p.energy + mins * 0.6, 0, 100);
    p.mood = U.clamp(p.mood - mins * 0.1, 25, 100);
  }
  s.water = Math.max(0, s.water - mins * 0.004); s.bowl.amt = Math.max(0, s.bowl.amt - mins * 0.004);
  return mins;
};

/* =========================================================
   People (NPC animation)
   ========================================================= */
class Person {
  constructor(look, o = {}) {
    this.look = look; this.m = G.M.person(look); this.root = this.m.root; this.t = Math.random() * 10;
    this.vel = 0; this.heading = o.heading || 0; this.target = null; this.speed = o.speed || 1.1; this.sitting = !!o.sit;
    this.talking = 0; this.waveT = 0; this.lookAt = null; this.yaw = 0; this.playing = !!o.playing; this.key = o.key;
    this.root.userData.person = this; this.root.traverse((x) => { if (x.isMesh) x.userData.person = this; });
  }
  get pos() { return this.root.position; }
  walkPath(pts) { this.path = pts.map((p) => p.clone()); this.target = this.path.shift(); }
  get idle() { return !this.target && !(this.path && this.path.length); }
  update(dt) {
    this.t += dt; const m = this.m;
    if (this.target) {
      const dx = this.target.x - this.pos.x, dz = this.target.z - this.pos.z, d = Math.hypot(dx, dz);
      if (d > 0.12) { const want = Math.atan2(dx, dz); this.heading += U.clamp(U.angDiff(this.heading, want), -4 * dt, 4 * dt); this.vel = U.damp(this.vel, this.speed * Math.min(1, d / 0.5 + 0.2), 4, dt); }
      else { this.target = this.path && this.path.length ? this.path.shift() : null; }
    } else this.vel = U.damp(this.vel, 0, 6, dt);
    if (this.vel > 0.01) { this.pos.x += Math.sin(this.heading) * this.vel * dt; this.pos.z += Math.cos(this.heading) * this.vel * dt; }
    this.root.rotation.y = this.heading;
    const sp = Math.min(1, this.vel / 1.2), ph = this.t * (4 + this.vel * 3.5);
    if (this.sitting) { m.legs.forEach((l) => { l.rotation.x = -1.45; }); m.rig.position.y = -0.2; m.arms.forEach((a) => { a.rotation.x = -0.35; }); }
    else {
      m.legs[0].rotation.x = Math.sin(ph) * 0.65 * sp; m.legs[1].rotation.x = -Math.sin(ph) * 0.65 * sp;
      m.arms[0].rotation.x = -Math.sin(ph) * 0.55 * sp; if (this.waveT <= 0) m.arms[1].rotation.x = Math.sin(ph) * 0.55 * sp;
      m.rig.position.y = Math.abs(Math.sin(ph)) * 0.035 * sp;
    }
    if (this.waveT > 0) { this.waveT -= dt; m.arms[1].rotation.z = U.damp(m.arms[1].rotation.z, 2.5 + Math.sin(this.t * 12) * 0.3, 12, dt); m.arms[1].rotation.x = 0; }
    else m.arms[1].rotation.z = U.damp(m.arms[1].rotation.z, 0.18, 8, dt);
    if (this.playing && m.guitar) { m.arms[1].rotation.x = -0.9 + Math.sin(this.t * 12) * 0.25; m.arms[0].rotation.x = -1.1; m.arms[0].rotation.z = -0.6; }
    if (this.throwT > 0) { // wind back, then fling forward
      this.throwT -= dt; const k = 1 - this.throwT / 0.55; const a = m.arms[1];
      a.rotation.x = k < 0.45 ? 1.4 * (k / 0.45) : 1.4 - 3.6 * Math.min(1, (k - 0.45) / 0.3); a.rotation.z = 0.5;
      m.rig.rotation.y = (k < 0.45 ? -0.5 * k / 0.45 : -0.5 + 0.9 * Math.min(1, (k - 0.45) / 0.3)); if (this.throwT <= 0) m.rig.rotation.y = 0;
    } else if (this.holding) { m.arms[1].rotation.x = -0.55; m.arms[1].rotation.z = 0.35; }
    if (this.cheerT > 0) { this.cheerT -= dt; m.arms[0].rotation.z = -2.6 + Math.sin(this.t * 14) * 0.25; m.arms[1].rotation.z = 2.6 - Math.sin(this.t * 14) * 0.25; m.arms[0].rotation.x = m.arms[1].rotation.x = 0; m.rig.position.y = Math.abs(Math.sin(this.t * 9)) * 0.14; }
    else if (!this.sitting && this.vel < 0.05) m.arms[0].rotation.z = U.damp(m.arms[0].rotation.z, -0.18, 8, dt);
    if (this.clapT > 0) { this.clapT -= dt; const c = Math.abs(Math.sin(this.t * 16)); m.arms[0].rotation.x = m.arms[1].rotation.x = -1.2; m.arms[0].rotation.z = -0.2 - c * 0.5; m.arms[1].rotation.z = 0.2 + c * 0.5; }
    let yawT = 0;
    if (this.lookAt) { const dx = this.lookAt.x - this.pos.x, dz = this.lookAt.z - this.pos.z; yawT = U.clamp(U.angDiff(this.heading, Math.atan2(dx, dz)), -1.1, 1.1); }
    this.yaw = U.damp(this.yaw, yawT, 5, dt); m.head.rotation.y = this.yaw;
    if (this.talking > 0) { this.talking -= dt; m.head.rotation.x = Math.sin(this.t * 9) * 0.07; m.mouth.scale.set(1, 1 + Math.abs(Math.sin(this.t * 13)) * 1.6, 1); }
    else { m.head.rotation.x = U.damp(m.head.rotation.x, this.playing ? 0.15 + Math.sin(this.t * 3) * 0.08 : 0, 5, dt); m.mouth.scale.set(1, 1, 1); }
    m.torso.scale.y = 1 + Math.sin(this.t * 2) * 0.012;
    if (Math.random() < dt * 0.3) { m.eyes.forEach((e) => (e.scale.y = 0.15)); setTimeout(() => m.eyes.forEach((e) => (e.scale.y = 1.15)), 120); }
  }
}
G.Person = Person;
G.npcDogBrain = function (owner, radius = 1.6, idx = 0) {
  const side = idx % 2 ? -1 : 1, back = 0.9 + idx * 0.35;
  return (p) => (function* () {
    const o = owner.pos; const d = U.d2(p.pos.x, p.pos.z, o.x, o.z);
    if (owner.vel > 0.3) { yield* p.goto(o.x - Math.sin(owner.heading + 0.7 * side) * back, o.z - Math.cos(owner.heading + 0.7 * side) * back, { speed: owner.vel * 1.3 / p.S + 0.4, timeout: 1.5, near: 0.3 }); return; }
    if (d > radius) { yield* p.goto(o.x + side * U.rand(0.5, 1.0), o.z + U.rand(-0.8, 0.8), { speed: d > 4 ? 2.6 : 1.3, timeout: 4 }); return; }
    const r = Math.random();
    if (r < 0.3) yield* p.sniffAround(1);
    else if (r < 0.55) yield* p.act('sit', U.rand(1, 3));
    else if (r < 0.7) yield* p.act('lie', U.rand(2, 4));
    else if (r < 0.85) { const a = Math.random() * 6.28; yield* p.goto(o.x + Math.cos(a) * radius * 0.8, o.z + Math.sin(a) * radius * 0.8, { timeout: 3 }); }
    else yield* p.wait(1);
  })();
};
