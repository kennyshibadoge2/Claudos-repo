'use strict';
/* =========================================================
   Shiba Days — flying disc: drag-in-hand, real release velocity,
   lift/drag/glide flight, skill-based catch planning
   ========================================================= */
G.discSim = function (pos, vel, o = {}) {
  const p = pos.clone(), v = vel.clone(); const out = [{ t: 0, p: pos.clone(), bank: 0 }]; const dt = 1 / 120; let t = 0;
  if (o.bounds) { const b0 = o.bounds; o.bounds = { x0: Math.min(b0.x0, p.x - 0.1), x1: Math.max(b0.x1, p.x + 0.1), z0: Math.min(b0.z0, p.z - 0.1), z1: Math.max(b0.z1, p.z + 0.1) }; }
  const CL = o.ball ? 0 : o.pro ? 0.058 : 0.055, CD = o.ball ? 0.012 : o.pro ? 0.031 : 0.035, GK = o.ball ? 0 : o.pro ? 4.6 : 4, wind = o.ball ? 0 : o.wind || 0, b = o.bounds; const R = o.ball ? 0.06 : 0.02; let bounces = 0;
  let k = 0;
  while (t < 12) {
    const h = Math.hypot(v.x, v.z), s = Math.hypot(v.x, v.y, v.z);
    v.y += (CL * h * h - 9.8) * dt;
    if (v.y < 0) v.y *= Math.exp(-GK * Math.min(1, h / 6) * dt);
    v.x -= (CD * s * v.x + wind * 0.8) * dt; v.y -= CD * s * v.y * dt * 1.6; v.z -= CD * s * v.z * dt;
    p.addScaledVector(v, dt); t += dt;
    if (b) {
      if (p.x < b.x0 || p.x > b.x1) { p.x = U.clamp(p.x, b.x0, b.x1); v.x *= -0.25; v.z *= 0.5; }
      if (p.z < b.z0 || p.z > b.z1) { p.z = U.clamp(p.z, b.z0, b.z1); v.z *= -0.25; v.x *= 0.5; }
    }
    if (++k % 2 === 0) out.push({ t, p: p.clone(), bank: U.clamp(v.x * 0.06, -0.5, 0.5) });
    if (p.y <= R) { p.y = R; if (o.ball && Math.abs(v.y) > 0.8 && bounces < 6) { v.y = -v.y * 0.6; v.x *= 0.85; v.z *= 0.85; bounces++; G._bounceT = t; continue; } if (o.ball && Math.hypot(v.x, v.z) > 0.3) { v.y = 0; v.x *= Math.exp(-2.2 * dt); v.z *= Math.exp(-2.2 * dt); if (k % 2 === 0) out.push({ t, p: p.clone(), bank: 0, ground: true }); continue; } out.push({ t, p: p.clone(), bank: 0 }); break; }
  }
  // slide along the ground a little
  const last = out[out.length - 1]; const hv = new V3(v.x, 0, v.z).multiplyScalar(0.25);
  for (let i = 1; i <= 12; i++) { const q = last.p.clone().addScaledVector(hv, i * 0.04 * (1 - i / 14)); q.y = 0.02; if (b) { q.x = U.clamp(q.x, b.x0, b.x1); q.z = U.clamp(q.z, b.z0, b.z1); } out.push({ t: last.t + i * 0.04, p: q, bank: 0, ground: true }); }
  return out;
};
G.discSkill = function (pet) {
  const sk = pet.d.disc || 0;
  const reach = (pet.m.baseH + pet.m.dims.by + pet.m.headR) * pet.S + 0.05;
  return { sk, spd: (5.6 + sk * 0.036) * pet.S * (pet.d.breed === 'husky' ? 1.1 : 1), delay: 0.3 - sk * 0.0015, reach, canJump: sk >= 25, canFlip: sk >= 60, jumpReach: reach + (sk >= 25 ? 0.35 + sk * 0.006 : 0.06) };
};
// o.terrain(x, z) -> speed multiplier (sand traps etc.)
G.discPlan = function (pet, path, o = {}) {
  const S = G.discSkill(pet);
  const slow = (x, z) => { if (!o.terrain) return 1; let m = 0; for (let k = 1; k <= 6; k++) { const f = k / 6; m += o.terrain(pet.pos.x + (x - pet.pos.x) * f, pet.pos.z + (z - pet.pos.z) * f); } return m / 6; };
  const reachable = (q) => U.d2(pet.pos.x, pet.pos.z, q.p.x, q.p.z) / (S.spd * slow(q.p.x, q.p.z)) + S.delay + 0.05 <= q.t;
  let first = -1;
  for (let i = 0; i < path.length; i++) { const q = path[i]; if (q.p.y > S.jumpReach || q.ground) continue; if (reachable(q)) { first = i; break; } }
  if (first < 0) return null;
  let i = first, q = path[i], h = q.p.y - S.reach;
  // the disc is high when the dog gets there: sometimes go for the leap, otherwise wait for it to come down
  if (h >= 0.12 && S.canJump && Math.random() > Math.min(0.5, 0.15 + S.sk * 0.004)) {
    for (let j = first + 1; j < path.length; j++) { const qq = path[j]; if (qq.ground) break; if (qq.p.y - S.reach < 0.1 && reachable(qq)) { i = j; q = qq; h = q.p.y - S.reach; break; } }
  }
  const kind = h < 0.12 || !S.canJump ? 'ground' : S.canFlip && h > 0.5 && Math.random() < Math.min(0.24, 0.1 + (S.sk - 60) / 220) ? 'flip' : 'jump';
  return { i, t: q.t, p: q.p.clone(), kind, S };
};
// launch a leap for a planned catch; returns timing used by discFlip
G.discLeap = function (pet, plan) {
  const S = plan.S; pet.jump(Math.sqrt(Math.max(0.5, 2 * 9.8 * (plan.p.y - S.reach))) + (plan.kind === 'flip' ? 1.5 : 0.4)); pet.setPose('leap', 10);
  const L = { t0: G.time, dur: Math.max(0.45, 2 * pet.jumpV / 9.8 * 0.9), flip: plan.kind === 'flip' }; if (L.flip) pet.flipL = L; return L;
};
// smooth backflip timed to the dog's airtime (finishes before landing, never snaps)
G.discFlip = function (pet, L) {
  if (!L || !L.flip) return;
  const k = U.clamp((G.time - L.t0) / L.dur, 0, 1); const e = k * k * (3 - 2 * k);
  pet.extraPitch = -Math.PI * 2 * e; if (k >= 1) { pet.extraPitch = 0; if (pet.flipL === L) pet.flipL = null; }
};
// a disc in flight: follows its precomputed path
G.DiscFlight = class {
  constructor(scene, id, path) { this.scene = scene; this.path = path; this.t = 0; this.i = 0; this.landed = false; this.caught = false; this.mesh = G.M.item(id); this.mesh.scale.setScalar(1.6); scene.add(this.mesh); this.pos = path[0].p.clone(); this.mesh.position.copy(this.pos); }
  update(dt) {
    if (this.caught) return;
    this.t += dt; const P = this.path; while (this.i < P.length - 1 && P[this.i].t < this.t) this.i++;
    const a = P[Math.max(0, this.i - 1)], b = P[this.i]; const k = b.t > a.t ? U.clamp((this.t - a.t) / (b.t - a.t), 0, 1) : 1;
    this.pos.copy(a.p).lerp(b.p, k); this.mesh.position.copy(this.pos);
    if (!b.ground) { this.mesh.rotation.y += dt * 22; this.mesh.rotation.x = 0.06; this.mesh.rotation.z = b.bank; } else { this.mesh.rotation.x = U.damp(this.mesh.rotation.x, 0, 8, dt); this.mesh.rotation.z = U.damp(this.mesh.rotation.z, 0, 8, dt); this.mesh.rotation.y += dt * 4 * (1 - k); }
    if (this.i >= P.length - 1 && !this.landed) { this.landed = true; G.audio.play('thud'); }
    if (P[this.i].ground && !this.touched) { this.touched = true; G.audio.play('bounce'); }
  }
  get onGround() { return !!this.path[this.i].ground || this.landed; }
  remove() { this.scene.remove(this.mesh); }
};
// the disc you hold: drag it anywhere, let go to throw with your hand's velocity
G.DiscHand = class {
  constructor(scene, cam, o = {}) { this.scene = scene; this.cam = cam; this.o = o; this.mesh = null; this.id = null; this.drag = false; this.hist = []; this.rest = new V3(0.32, -0.42, -1.15); this.local = this.rest.clone(); }
  show(id) { this.hide(); this.id = id; this.mesh = G.M.item(id); this.mesh.scale.setScalar(1.0); this.scene.add(this.mesh); this.local.copy(this.rest); this.drag = false; }
  hide() { if (this.mesh) this.scene.remove(this.mesh); this.mesh = null; this.drag = false; if (this.pv) this.preview(null); }
  get active() { return !!this.mesh; }
  screenPos() { return G.toScreen(this.cam.localToWorld(this.local.clone()), this.cam); }
  planePoint(p) { const ndc = new V3(p.nx, p.ny, 0.5).unproject(this.cam); const dir = ndc.sub(this.cam.position).normalize(); const fwd = new V3(); this.cam.getWorldDirection(fwd); const d = 1.15 / Math.max(0.2, dir.dot(fwd)); return this.cam.worldToLocal(this.cam.position.clone().addScaledVector(dir, d)); }
  down(p) {
    if (!this.mesh) return false;
    const sp = this.screenPos(); const near = Math.hypot(p.x - sp.x, p.y - sp.y) < Math.max(110, innerHeight * 0.16);
    if (!near && p.y < innerHeight * 0.45) return false;
    this.drag = true; this.hist = []; this.move(p); G.audio.play('tick'); return true;
  }
  move(p) {
    if (!this.drag) return; const l = this.planePoint(p); l.y = Math.max(l.y, -0.62); this.local.copy(l);
    this.hist.push({ t: p.t, l: l.clone() }); if (this.hist.length > 20) this.hist.shift(); this._lastMoveAt = performance.now();
  }
  // the throw the current swing would make (used for release and the aim preview)
  calc() {
    const h = this.hist; if (h.length < 2) return null;
    const e = h[h.length - 1]; let i = h.length - 1; while (i > 0 && e.t - h[i - 1].t < 110) i--; if (i === h.length - 1) i = Math.max(0, i - 1);
    const a = h[i]; const dt = Math.max(0.012, (e.t - a.t) / 1000);
    const vu = (e.l.y - a.l.y) / dt, vl = (e.l.x - a.l.x) / dt;
    const fwd = new V3(); this.cam.getWorldDirection(fwd); fwd.y = 0; fwd.normalize(); const right = new V3(-fwd.z, 0, fwd.x);
    const M = 18; const f = vu > 0 ? M * (1 - Math.exp(-3.2 * vu / M)) : 0;
    const vel = fwd.clone().multiplyScalar(f).addScaledVector(right, U.clamp(vl * 1.4, -0.35 * f - 0.6, 0.35 * f + 0.6));
    vel.y = f > 0.5 ? U.clamp(f * 0.16, 0.5, 4) : Math.max(-0.5, vu * 0.3);
    return { pos: this.cam.localToWorld(this.local.clone()), vel, power: f };
  }
  up(p) {
    if (!this.drag) return null; this.drag = false; this.move(p);
    const r = this.calc(); this.preview(null);
    if (!r || r.power < 1.6) { G.ui.hint('Swing the disc upward and let go to throw!', 2000); this.drag = false; return null; }
    const id = this.id; this.hide(); r.id = id;
    return r;
  }
  // dotted arc + landing ring while swinging (o.preview() -> discSim options)
  preview(r, ringOnly) {
    if (!this.pv) {
      const ring = new THREE.Mesh(new THREE.RingGeometry(0.32, 0.46, 32), new THREE.MeshBasicMaterial({ color: '#ffe14d', transparent: true, opacity: 0.95, depthWrite: false, depthTest: false })); ring.rotation.x = -Math.PI / 2; ring.renderOrder = 20;
      const dot = new THREE.Mesh(new THREE.CircleGeometry(0.12, 16), new THREE.MeshBasicMaterial({ color: '#ee8a3c', transparent: true, opacity: 0.9, depthWrite: false, depthTest: false })); dot.rotation.x = -Math.PI / 2; dot.renderOrder = 21;
      const line = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineDashedMaterial({ color: '#ffffff', dashSize: 0.25, gapSize: 0.18, transparent: true, opacity: 0.75, depthTest: false })); line.renderOrder = 19; line.frustumCulled = false;
      const lab = new THREE.Sprite(new THREE.SpriteMaterial({ depthTest: false, transparent: true })); lab.renderOrder = 22;
      this.pv = { ring, dot, line, lab, txt: '' }; for (const o of [ring, dot, line, lab]) { o.visible = false; this.scene.add(o); }
    }
    const P = this.pv;
    if (!r) { for (const o of [P.ring, P.dot, P.line, P.lab]) o.visible = false; return; }
    const path = G.discSim(r.pos, r.vel, this.o.preview ? this.o.preview() : {});
    const end = path[path.length - 1].p; const pts = [];
    for (let i = 0; i < path.length; i += 2) pts.push(path[i].p); pts.push(end);
    P.line.geometry.dispose(); P.line.geometry = new THREE.BufferGeometry().setFromPoints(pts); P.line.computeLineDistances();
    P.ring.position.set(end.x, 0.05, end.z); P.dot.position.set(end.x, 0.05, end.z);
    const m = Math.round(Math.max(0, end.z - (this.o.zeroZ ?? r.pos.z))) + ' m';
    if (m !== P.txt) { P.txt = m; if (P.lab.material.map) P.lab.material.map.dispose(); const t = G.textTex(m, { font: '800 56px Fredoka, sans-serif', color: '#fff', stroke: '#3b2a1f', strokeW: 10, pad: 10 }); P.lab.material.map = t; P.lab.material.needsUpdate = true; P.lab.scale.set(0.42 * t.userData.w / t.userData.h, 0.42, 1); }
    P.lab.position.set(end.x, 0.6, end.z);
    const sc = 1 + U.d2(this.cam.position.x, this.cam.position.z, end.x, end.z) * 0.08; P.ring.scale.setScalar(sc); P.dot.scale.setScalar(sc); const t2 = P.lab.material.map; if (t2) P.lab.scale.set(0.42 * sc * 1.05 * t2.userData.w / t2.userData.h, 0.42 * sc * 1.05, 1); P.lab.position.y = 0.4 + sc * 0.3;
    for (const o of [P.ring, P.dot, P.line, P.lab]) o.visible = true; if (ringOnly) P.line.visible = false;
  }
  update(dt) {
    if (!this.mesh) return;
    const hh = 1.15 * Math.tan(this.cam.fov * Math.PI / 360), hw = hh * this.cam.aspect; const tall = this.cam.aspect < 0.9; this.rest.set(Math.min(hw * 0.45, 0.35), -hh * (tall ? 0.66 : 0.5), -1.15); this.mesh.scale.setScalar(tall ? 0.62 : 1);
    if (!this.drag) this.local.lerp(this.rest, 1 - Math.exp(-8 * dt));
    if (this.o.preview && this.drag) { this._pt = (this._pt || 0) - dt; if (this._pt <= 0) { this._pt = 0.07; const r = this.calc(); const fresh = this.hist.length && performance.now() - (this._lastMoveAt || 0) < 400; this.preview(r && r.power >= 1.6 && fresh ? r : null); } }
    const w = this.cam.localToWorld(this.local.clone()); this.mesh.position.copy(w);
    this.mesh.quaternion.copy(this.cam.quaternion); this.mesh.rotateX(-1.15); if (!this.drag) this.mesh.rotateY(Math.sin(G.time * 2) * 0.1);
  }
};
// shared chase-and-catch behaviour (home, park): returns via cb(result)
G.discChase = function* (pet, flight, plan, o = {}) {
  const S = plan ? plan.S : G.discSkill(pet); let jumped = false, t0 = 0;
  yield* pet.wait(Math.max(0.05, S.delay - 0.1)); pet.voiceCd = 0; pet.voice(); pet.excite = 1;
  pet.setPose('stand');
  while (!flight.caught) {
    const tgt = plan ? plan.p : flight.pos;
    if (!plan || U.d2(pet.pos.x, pet.pos.z, tgt.x, tgt.z) > 0.3) { pet.moveTarget = new V3(tgt.x, 0, tgt.z); pet.speedMul = S.spd / pet.S; } else { pet.moveTarget = null; pet.lookTarget = flight.pos; }
    if (plan) {
      if (plan.kind !== 'ground' && !jumped && flight.t >= plan.t - 0.34) { jumped = G.discLeap(pet, plan); }
      G.discFlip(pet, jumped);
      if (flight.t >= plan.t) { if (U.d2(pet.pos.x, pet.pos.z, plan.p.x, plan.p.z) < 0.5 * pet.S + 1.3) { flight.caught = true; break; } plan = null; } // too late: chase it down instead
    } else if (flight.onGround) {
      const dd = U.d2(pet.pos.x, pet.pos.z, flight.pos.x, flight.pos.z);
      if (dd < 0.35 * pet.S + 0.1) { flight.caught = true; break; }
      // can't get any closer (wall, fence, out of reach)? grab it anyway so play never gets stuck
      if (dd >= (flight._best || 1e9) - 0.02) flight._stuck = (flight._stuck || 0) + pet.dt; else { flight._best = dd; flight._stuck = 0; }
      if (flight._stuck > 1.2 && dd < 3.5) { flight.caught = true; break; }
      if (flight._stuck > 4) { flight.caught = true; break; }
    }
    yield;
  }
  pet.moveTarget = null; pet.lookTarget = null;
  flight.remove(); pet.grab({ id: flight.mesh.userData.id || o.id || 'disc', mesh: G.M.item(o.id || 'disc'), pos: new V3(), vel: new V3() }, 'toy');
  const kind = plan ? plan.kind : 'miss';
  if (kind !== 'miss' && kind !== 'ground') { G.fx.spawn('star', pet.pos.clone().setY(1), 8); G.audio.play('sparkle'); G.stamp('flying'); }
  if (kind !== 'miss') pet.d.disc = Math.min(100, (pet.d.disc || 0) + ({ ground: 0.8, jump: 1.5, flip: 2 }[kind] || 0) * (o.train || 0.7));
  yield* pet.waitUntil(() => !pet.airborne, 2); pet.extraPitch = 0;
  if (o.done) o.done(kind);
};
