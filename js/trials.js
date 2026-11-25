'use strict';
/* =========================================================
   Shiba Days — Agility & Obedience trials
   ========================================================= */
G.LOOKS.judge = { skin: '#f0cfb3', hair: '#d9d6d0', style: 'bun', top: '#33415c', bottom: '#33415c', h: 1.0, extra: ['glasses'] };
G.NPCS.judge = { name: 'Judge Hoshino', look: 'judge' };
G.TRIALS = {
  agility: [
    { id: 'ag1', name: 'Agility: Puppy Course', fee: 0, prize: [180, 100, 50], rival: [16, 26], need: null, n: 6 },
    { id: 'ag2', name: 'Agility: Open Course', fee: 40, prize: [450, 240, 110], rival: [21, 31], need: 'ag1', n: 8 },
    { id: 'ag3', name: 'Agility: Masters', fee: 100, prize: [1200, 600, 280], rival: [25, 35], need: 'ag2', n: 10, refuse: 1.5 },
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
    if (G.state.pets.some((d) => d.breed !== 'cat')) { const cur = G.activePet(); if (cur && cur.cat) { const dog = G.state.pets.find((d) => d.breed !== 'cat'); G.state.active = dog.id; G.ui.refresh && G.ui.refresh(true); } G.ui.dogPicker(body, () => G.ui.resheet()); }
    const l = G.ui.list(body);
    l.appendChild(G.ui.li({ icon: 'disc', title: 'Disc Cup', sub: 'Flick the disc, your pup makes the catch.', fn: () => { G.ui.closeSheet(true); G.go('frisbee', { from }); } }));
    l.appendChild(G.ui.li({ icon: 'paw', title: 'Agility trial', sub: 'Lead your pup over hurdles, through tunnels and weave poles. Fastest time wins.', fn: () => { G.ui.closeSheet(true); G.go('trials', { mode: 'agility', from }); } }));
    l.appendChild(G.ui.li({ icon: 'star', title: 'Obedience trial', sub: 'The judge calls commands; perform the gestures before time runs out.', fn: () => { G.ui.closeSheet(true); G.go('trials', { mode: 'obedience', from }); } }));
    if (!G.state.pets.some((d) => d.breed !== 'cat')) G.ui.note(body, 'Cats are welcome to watch, but only dogs can compete. Adopt a dog to enter!');
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
    // arena dressing: bunting, a judges' tent, crates, water station, flags
    const bunt = (x0, z0, x1, z1) => { for (let i = 0; i <= 18; i++) { const k = i / 18; const fl = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.26, 3), M.mat(['#e2574c', '#f2c24b', '#4aa6e0', '#79b25a', '#f39bb0'][i % 5], { side: THREE.DoubleSide })); fl.rotation.z = Math.PI; fl.position.set(U.lerp(x0, x1, k), 1.45 - Math.sin(k * Math.PI) * 0.25, U.lerp(z0, z1, k)); s.add(fl); } };
    bunt(-AREA.x - 1, -AREA.z - 1, -1, -AREA.z - 1); bunt(1, -AREA.z - 1, AREA.x + 1, -AREA.z - 1);
    for (const [x, z] of [[-AREA.x - 1, -AREA.z - 1], [AREA.x + 1, -AREA.z - 1], [-AREA.x - 1, AREA.z + 1], [AREA.x + 1, AREA.z + 1]]) { const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 3, 8), M.mat('#fff')); pole.position.set(x, 1.5, z); s.add(pole); const fl = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.45), M.mat('#3b5ba8', { side: THREE.DoubleSide })); fl.position.set(x + 0.36, 2.7, z); s.add(fl); }
    const tent = new THREE.Group(); tent.position.set(-AREA.x - 3.2, 0, -2); s.add(tent);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(2.0, 1.1, 4, 1, true), M.mat('#e2574c', { side: THREE.DoubleSide })); roof.rotation.y = Math.PI / 4; roof.position.y = 2.6; tent.add(roof);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const p2 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.1, 6), M.mat('#fff')); p2.position.set(sx * 1.3, 1.05, sz * 1.3); tent.add(p2); }
    const tbl = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.7, 0.6), M.mat('#fff7ea')); tbl.position.y = 0.35; tent.add(tbl);
    for (let i = 0; i < 3; i++) { const tr = G.M.trophy(['#f2c24b', '#c0c0c0', '#cd7f32'][i]); tr.position.set(-0.5 + i * 0.5, 0.7, 0); tr.scale.setScalar(0.8); tent.add(tr); }
    for (let i = 0; i < 3; i++) { const cr = new THREE.Group(); cr.position.set(-AREA.x - 2.6, 0, 4 + i * 1.3); s.add(cr); const bx = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.7, 1.1), M.mat(['#79b25a', '#4aa6e0', '#f2c24b'][i])); bx.position.y = 0.35; cr.add(bx); const door = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.5), M.mat('#3b3b3b', { side: THREE.DoubleSide })); door.position.set(0.46, 0.35, 0); door.rotation.y = Math.PI / 2; cr.add(door); }
    const wb = G.M.bowl('#4aa6e0'); wb.position.set(-AREA.x + 0.6, 0, AREA.z - 0.6); s.add(wb);
    scene.add(M.bake(s));
    judge = new G.Person('judge', { key: 'judge' }); judge.pos.set(-AREA.x + 1.5, 0, -AREA.z + 1.2); judge.heading = 0.8; scene.add(judge.root);
    const clip = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.24, 0.02), M.mat('#c48a52')); clip.position.set(0, 0.2, 0.22); judge.m.torso.add(clip);
    ['hana', 'kato', 'tomo', 'aki', 'kenji', 'ito'].forEach((k, i) => { const p = new G.Person(k); p.pos.set(-8 + i * 3.2, 0, AREA.z + 2.6); p.heading = Math.PI; scene.add(p.root); specs.push(p); });
    marker = new THREE.Sprite(new THREE.SpriteMaterial({ map: G.textTex('▼', { font: '700 90px Fredoka, sans-serif', color: '#ee8a3c', stroke: '#fff', strokeW: 12, pad: 10 }), depthTest: false, transparent: true })); marker.scale.set(0.6, 0.6, 1); marker.renderOrder = 20; scene.add(marker);
    ring = new THREE.Mesh(new THREE.RingGeometry(0.55, 0.75, 32), new THREE.MeshBasicMaterial({ color: '#ee8a3c', transparent: true, opacity: 0.8, depthWrite: false })); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.03; scene.add(ring);
  };
  /* ---------------- course ---------------- */
  // the route is a loop; every obstacle faces along the route so you always run straight through it
  const FINISH = { ag1: [4.4, 6.4], ag2: [-6.6, 5.6], ag3: [-4.6, -1.2] };
  const ROUTE = [[-7.6, -5.4], [-3.6, -5.8], [1.6, -5.6], [6.6, -4.6], [9.6, -0.8], [8.0, 3.9], [3.0, 5.4], [-2.2, 5.4], [-6.8, 3.8], [-9.6, 0.4]];
  const COURSES = { ag1: ['hurdle', 'hurdle', 'tunnel', 'tire', 'hurdle', 'aframe'], ag2: ['hurdle', 'tunnel', 'weave', 'hurdle', 'aframe', 'tire', 'table', 'hurdle'], ag3: ['hurdle', 'weave', 'tunnel', 'teeter', 'tire', 'aframe', 'hurdle', 'table', 'weave', 'hurdle'] };
  const LEN = { hurdle: 0.3, tire: 0.3, tunnel: 3.0, weave: 3.6, aframe: 3.0, teeter: 3.6, table: 0.9, finish: 0.3 };
  let courseGrp = null;
  function buildCourse(cls) {
    for (const o of obstacles) scene.remove(o.g); obstacles = []; if (courseGrp) scene.remove(courseGrp); courseGrp = new THREE.Group(); scene.add(courseGrp);
    const M = G.M; const types = COURSES[cls.id] || COURSES.ag1; const n = types.length;
    const pts = ROUTE.slice(0, n).map(([x, z]) => new V3(x, 0, z));
    const first = pts[0], d0 = pts[1].clone().sub(first).normalize();
    const startP = first.clone().addScaledVector(d0, -3.4); const finishP = pts[n - 1].clone().lerp(pts[0], n >= ROUTE.length ? 0.45 : 0).add(n >= ROUTE.length ? new V3(0, 0, 0) : new V3(0, 0, 0));
    // finish: a few metres past the last obstacle, heading back toward the start area
    const lastDir = pts[n - 1].clone().sub(pts[n - 2]).normalize(); const fz = FINISH[cls.id]; const fin = fz ? new V3(fz[0], 0, fz[1]) : pts[n - 1].clone().addScaledVector(lastDir, 4.2);
    st.start = startP; st.startDir = d0;
    const all = pts.concat([fin]);
    const stripe = M.mat('#e2574c', { r: 0.6 }), white = M.mat('#ffffff', { r: 0.5 }), blue = M.mat('#3b5ba8', { r: 0.6 }), yellow = M.mat('#f2c24b', { r: 0.6 }), metal = M.mat('#c0c4c8', { r: 0.3, m: 0.7 });
    const stripeTex = G.canvasTex(64, 16, (c) => { for (let i = 0; i < 8; i++) { c.fillStyle = i % 2 ? '#ffffff' : '#e2574c'; c.fillRect(i * 8, 0, 8, 16); } });
    all.forEach((c, i) => {
      const type = i < n ? types[i] : 'finish';
      const prev = i === 0 ? startP : all[i - 1], next = all[i + 1] || c.clone().add(lastDir);
      const dir = next.clone().sub(prev).setY(0).normalize(); if (type === 'finish') dir.copy(c.clone().sub(prev).setY(0).normalize());
      const g = new THREE.Group(); g.position.copy(c); g.rotation.y = Math.atan2(dir.x, dir.z); scene.add(g);
      const len = LEN[type];
      const box = (w, h, d, mat, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); g.add(m); return m; };
      const cyl = (r, h, mat, x, y, z) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 10), mat); m.position.set(x, y, z); g.add(m); return m; };
      if (type === 'hurdle') {
        for (const sx of [-1, 1]) { box(0.08, 0.9, 0.08, white, sx * 0.72, 0.45, 0); box(0.32, 0.7, 0.03, sx > 0 ? blue : stripe, sx * 0.92, 0.38, 0); box(0.36, 0.04, 0.36, white, sx * 0.8, 0.02, 0); }
        const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.44, 10), M.mat('#fff', { map: stripeTex })); bar.rotation.z = Math.PI / 2; bar.position.y = 0.42; g.add(bar);
      } else if (type === 'tire') {
        const fr = M.mat('#3b5ba8', { r: 0.5 });
        for (const sx of [-1, 1]) { box(0.08, 1.5, 0.08, fr, sx * 0.75, 0.75, 0); box(0.08, 0.06, 0.8, fr, sx * 0.75, 0.03, 0); }
        box(1.58, 0.08, 0.08, fr, 0, 1.5, 0);
        const tire = new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.1, 12, 28), M.mat('#2a2a2a', { r: 0.9 })); tire.position.y = 0.78; g.add(tire);
        const tape = new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.105, 6, 28, Math.PI / 3), yellow); tape.position.y = 0.78; tape.rotation.z = 0.4; g.add(tape);
        for (const a of [0.5, 2.6, Math.PI + 0.5, Math.PI + 2.6]) { const ch = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.5, 4), metal); const px = Math.cos(a) * 0.62, py = 0.78 + Math.sin(a) * 0.62; ch.position.set(px * 0.82, py * 0.9 + 0.08, 0); ch.rotation.z = a + Math.PI / 2; g.add(ch); }
      } else if (type === 'tunnel') {
        const tt = G.canvasTex(64, 64, (c2) => { c2.fillStyle = '#4aa6e0'; c2.fillRect(0, 0, 64, 64); c2.fillStyle = '#3a8ac0'; for (let y = 0; y < 64; y += 8) c2.fillRect(0, y, 64, 2); }, { repeat: [1, 6] });
        const curve = new THREE.CatmullRomCurve3([new V3(0, 0.38, -1.5), new V3(0.35, 0.38, 0), new V3(0, 0.38, 1.5)]);
        const tm = new THREE.Mesh(new THREE.TubeGeometry(curve, 30, 0.42, 18, false), M.mat('#fff', { map: tt, side: THREE.DoubleSide, r: 0.8 })); g.add(tm);
        for (const z of [-1.5, 1.5]) { const rim = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.04, 8, 24), yellow); rim.position.set(0, 0.38, z); g.add(rim); }
        for (const z of [-0.8, 0.8]) { const sb = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.1, 0.3), M.mat('#8a6a4a', { r: 0.9 })); sb.position.set(0.2, 0.05, z); g.add(sb); }
      } else if (type === 'weave') {
        box(0.08, 0.04, 3.7, white, 0, 0.02, 0);
        for (let k = 0; k < 6; k++) { const p = cyl(0.025, 1.0, k % 2 ? M.mat('#79b25a') : white, 0, 0.52, -1.5 + k * 0.6); const cap = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), k % 2 ? white : M.mat('#79b25a')); cap.position.set(0, 1.03, -1.5 + k * 0.6); g.add(cap); }
      } else if (type === 'aframe') {
        const slat = M.mat('#8a6a4a');
        for (const sz of [-1, 1]) {
          const b = new THREE.Group(); b.position.set(0, 0.45, sz * 0.72); b.rotation.x = sz * 0.58; g.add(b);
          const board = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.06, 1.65), M.mat('#f2c24b', { r: 0.8 })); b.add(board);
          const contact = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.065, 0.5), M.mat('#3b5ba8', { r: 0.8 })); contact.position.z = sz * 0.58; b.add(contact);
          for (let k = 0; k < 6; k++) { const sl = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.02, 0.03), slat); sl.position.set(0, 0.04, -0.7 + k * 0.28); b.add(sl); }
        }
        for (const sx of [-1, 1]) { const ch = cyl(0.01, 1.2, metal, sx * 0.4, 0.3, 0); ch.rotation.x = Math.PI / 2; }
      } else if (type === 'teeter') {
        box(0.2, 0.42, 0.2, M.mat('#c0c4c8', { r: 0.4, m: 0.6 }), 0, 0.21, 0);
        const plank = new THREE.Group(); plank.position.y = 0.45; g.add(plank); g.userData.plank = plank;
        const pb = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.05, 3.6), M.mat('#e2574c', { r: 0.7 })); plank.add(pb);
        for (const sz of [-1, 1]) { const ct = new THREE.Mesh(new THREE.BoxGeometry(0.43, 0.055, 0.8), yellow); ct.position.z = sz * 1.4; plank.add(ct); }
        plank.rotation.x = 0.24;
      } else if (type === 'table') {
        box(1.0, 0.08, 1.0, M.mat('#3b5ba8', { r: 0.6 }), 0, 0.45, 0);
        for (const sx of [-1, 1]) for (const sz of [-1, 1]) cyl(0.03, 0.45, metal, sx * 0.42, 0.22, sz * 0.42);
        const tl = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.8), M.mat('#fff', { map: G.textTex('PAUSE', { font: '700 52px Fredoka, sans-serif', color: '#ffffff', pad: 16 }) })); tl.rotation.x = -Math.PI / 2; tl.position.y = 0.5; g.add(tl);
      } else if (type === 'finish') {
        for (const sx of [-1, 1]) { cyl(0.07, 2.4, M.mat('#3b2a1f'), sx * 1.2, 1.2, 0); const fl = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.34, 3), sx > 0 ? stripe : blue); fl.rotation.z = Math.PI / 2 * sx; fl.position.set(sx * 1.38, 2.25, 0); g.add(fl); }
        const ft = G.textTex('FINISH', { font: '700 64px Fredoka, sans-serif', bg: '#e2574c', color: '#fff', pad: 16, radius: 10 });
        const fb = new THREE.Mesh(new THREE.PlaneGeometry(2.3, 2.3 * ft.userData.h / ft.userData.w), M.mat('#fff', { map: ft, side: THREE.DoubleSide })); fb.position.y = 2.2; g.add(fb);
        const ch = G.canvasTex(64, 16, (c2) => { for (let x = 0; x < 16; x++) for (let y = 0; y < 4; y++) { c2.fillStyle = (x + y) % 2 ? '#222' : '#fff'; c2.fillRect(x * 4, y * 4, 4, 4); } });
        const line = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.4), M.mat('#fff', { map: ch })); line.rotation.x = -Math.PI / 2; line.position.y = 0.02; g.add(line);
      }
      g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
      if (type !== 'finish') {
        const nt = G.textTex(String(i + 1), { font: '700 64px Fredoka, sans-serif', bg: '#3b5ba8', color: '#fff', pad: 14, radius: 40 });
        const cone = new THREE.Group(); cone.position.copy(c).addScaledVector(new V3(dir.z, 0, -dir.x), 1.25); scene.add(cone);
        const cm = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.42, 14), M.mat('#ee8a3c', { r: 0.6 })); cm.position.y = 0.21; cm.castShadow = true; cone.add(cm);
        const num = new THREE.Sprite(new THREE.SpriteMaterial({ map: nt })); num.scale.set(0.42, 0.42, 1); num.position.y = 0.72; cone.add(num); courseGrp.add(cone);
      }
      const o = { type, g, c: c.clone(), dir, len, entry: c.clone().addScaledVector(dir, -(len / 2 + 0.75)), exit: c.clone().addScaledVector(dir, len / 2 + 0.7) };
      obstacles.push(o);
    });
    // start gate
    const sg = new THREE.Group(); sg.position.copy(startP); sg.rotation.y = Math.atan2(d0.x, d0.z); courseGrp.add(sg);
    for (const sx of [-1, 1]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.8, 8), M.mat('#3b5ba8')); p.position.set(sx * 1.0, 0.9, 0); sg.add(p); }
    const stt = G.textTex('START', { font: '700 56px Fredoka, sans-serif', bg: '#79b25a', color: '#fff', pad: 14, radius: 10 }); const sb2 = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 1.9 * stt.userData.h / stt.userData.w), M.mat('#fff', { map: stt, side: THREE.DoubleSide })); sb2.position.y = 1.7; sg.add(sb2);
    // paw-print route guide between obstacles
    const pawT = G.canvasTex(32, 32, (c2) => { c2.fillStyle = 'rgba(226,118,46,.85)'; c2.beginPath(); c2.ellipse(16, 20, 6, 5, 0, 0, 7); c2.fill(); for (const [px, py] of [[8, 12], [13, 8], [19, 8], [24, 12]]) { c2.beginPath(); c2.arc(px, py, 2.4, 0, 7); c2.fill(); } });
    const pawM = new THREE.MeshBasicMaterial({ map: pawT, transparent: true, depthWrite: false, opacity: 0.85 });
    let prevExit = startP.clone();
    for (const o of obstacles) {
      const a = prevExit, bb = o.entry; const L2 = a.distanceTo(bb); const steps = Math.floor(L2 / 0.7);
      for (let k = 1; k < steps; k++) { const p = a.clone().lerp(bb, k / steps); const pp = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.3), pawM); pp.rotation.set(-Math.PI / 2, 0, -Math.atan2(bb.x - a.x, bb.z - a.z) + Math.PI); pp.position.set(p.x + (k % 2 ? 0.08 : -0.08), 0.025, p.z); courseGrp.add(pp); }
      prevExit = o.exit;
    }
    // big timer board
    const tb = new THREE.Group(); tb.position.set(AREA.x - 2.2, 0, -AREA.z - 0.8); tb.rotation.y = -0.35; courseGrp.add(tb);
    for (const sx of [-1, 1]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.15, 3.0, 0.15), M.mat('#3b2a1f')); p.position.set(sx * 1.6, 1.5, 0); tb.add(p); }
    timerCanvas = document.createElement('canvas'); timerCanvas.width = 256; timerCanvas.height = 96; timerTex = new THREE.CanvasTexture(timerCanvas); timerTex.colorSpace = THREE.SRGBColorSpace;
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 1.2), new THREE.MeshBasicMaterial({ map: timerTex })); scr.position.y = 2.6; tb.add(scr);
    drawTimer(0);
  }
  let timerCanvas = null, timerTex = null;
  function drawTimer(t) { if (!timerCanvas) return; const c = timerCanvas.getContext('2d'); c.fillStyle = '#1d2a24'; c.fillRect(0, 0, 256, 96); c.fillStyle = '#ffd36a'; c.font = '700 54px monospace'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(t.toFixed(1) + 's', 128, 50); c.fillStyle = '#9fd4ff'; c.font = '600 16px Fredoka, sans-serif'; c.fillText(st && st.cls ? st.cls.name.replace('Agility: ', '') : 'AGILITY', 128, 14); timerTex.needsUpdate = true; }
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
  T.exit = function () { if (pet) { scene.remove(pet.root); pet.stop(); pet.extraPitch = 0; pet.baseY = 0; pet.root.visible = true; } if (courseGrp) { scene.remove(courseGrp); courseGrp = null; } for (const o of obstacles) scene.remove(o.g); obstacles = []; $('#contestHud').classList.add('hidden'); G.ui.hint(null); G.ui.banner('', null, 1); st = null; };
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
      buildCourse(c); pet.stop(); pet.pos.copy(st.start); pet.heading = Math.atan2(st.startDir.x, st.startDir.z); pet.brain = null; pet.baseY = 0;
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
    if (Math.random() < refuseP) { st.refusals++; pet.stop(); pet.setPose('sit'); pet.emote('q'); G.audio.play('aww'); G.ui.toast(pet.name + ' refused the obstacle! (+3s)'); st.t += 3; yield* pet.wait(1.0); pet.pos.copy(o.entry).addScaledVector(o.dir, -0.9); st.busy = false; return; }
    const spd = (3.4 + (pet.d.agility || 0) * 0.02) * pet.S;
    const H0 = Math.atan2(o.dir.x, o.dir.z);
    // line up with the obstacle first (smoothly)
    { const a = pet.pos.clone(), b = o.entry.clone(); let t = 0; const dur = Math.min(0.35, a.distanceTo(b) / (spd * 1.2) + 0.05); while (t < dur) { t += pet.dt; const k = Math.min(1, t / dur); pet.pos.x = U.lerp(a.x, b.x, k); pet.pos.z = U.lerp(a.z, b.z, k); pet.heading += U.angDiff(pet.heading, H0) * Math.min(1, pet.dt * 14); pet.vel = spd; yield; } }
    pet.heading = H0;
    const from = pet.pos.clone(); const to = o.exit.clone();
    const total = from.distanceTo(to); let d = 0; let jumped = false;
    const side = new V3(o.dir.z, 0, -o.dir.x);
    if (o.type === 'tunnel') pet.setPose('crouch'); else pet.setPose('stand');
    if (o.type === 'table') {
      const top = o.c.clone(); let t = 0; pet.jump(2.6); pet.setPose('leap', 10); G.audio.play('whoosh');
      while (t < 0.35) { t += pet.dt; const k = Math.min(1, t / 0.35); pet.pos.x = U.lerp(from.x, top.x, k); pet.pos.z = U.lerp(from.z, top.z, k); pet.baseY = 0.48 * k; yield; }
      pet.setPose('sit'); pet.lookCam = 2; for (let n = 3; n > 0; n--) { G.audio.play('tick'); G.ui.toast(String(n)); yield* pet.wait(0.6); }
      pet.setPose('stand'); pet.jump(2.4); t = 0; while (t < 0.35) { t += pet.dt; const k = Math.min(1, t / 0.35); pet.pos.x = U.lerp(top.x, to.x, k); pet.pos.z = U.lerp(top.z, to.z, k); pet.baseY = 0.48 * (1 - k); yield; }
    } else while (d < total) {
      d += spd * pet.dt * (o.type === 'weave' ? 0.6 : o.type === 'tunnel' ? 0.8 : o.type === 'teeter' ? 0.55 : 1);
      const k = Math.min(1, d / total);
      const p = from.clone().lerp(to, k);
      if (o.type === 'weave') { const local = k * total - 0.75; p.addScaledVector(side, Math.sin(local / 0.6 * Math.PI) * 0.3); pet.heading = H0 + Math.cos(local / 0.6 * Math.PI) * 0.7; }
      if (o.type === 'tunnel') { const tk = U.clamp((k * total - 0.75) / o.len, 0, 1); p.addScaledVector(side, -Math.sin(tk * Math.PI) * 0.35); pet.root.visible = !(tk > 0.15 && tk < 0.85); }
      if (o.type === 'aframe') { const ak = U.clamp((k * total - 0.75) / o.len, 0, 1); pet.baseY = (ak < 0.5 ? ak * 2 : (1 - ak) * 2) * 0.88; pet.extraPitch = ak > 0 && ak < 1 ? (ak < 0.5 ? -0.55 : 0.55) : 0; }
      if (o.type === 'teeter') {
        const sk = U.clamp((k * total - 0.75) / o.len, 0, 1); const plank = o.g.userData.plank;
        const target = sk < 0.55 ? 0.24 : -0.24; if (plank) { const before = plank.rotation.x; plank.rotation.x = U.damp(plank.rotation.x, target, 7, pet.dt); if (before > 0 && plank.rotation.x <= 0) G.audio.play('clunk'); }
        const ang = plank ? plank.rotation.x : 0; const sAlong = (sk - 0.5) * o.len;
        pet.baseY = sk > 0 && sk < 1 ? Math.max(0, 0.47 - Math.tan(ang) * sAlong) : 0; pet.extraPitch = sk > 0 && sk < 1 ? ang : 0;
      }
      if ((o.type === 'hurdle' || o.type === 'tire') && !jumped && k * total > 0.75 + o.len / 2 - 0.6) { jumped = true; pet.jump(o.type === 'tire' ? 3.7 : 3.1); pet.setPose('leap', 10); G.audio.play('whoosh'); }
      pet.pos.x = p.x; pet.pos.z = p.z; pet.vel = spd;
      yield;
    }
    pet.root.visible = true; pet.baseY = 0; pet.extraPitch = 0; pet.setPose('stand'); pet.vel = spd * 0.6;
    if (o.type === 'teeter' && o.g.userData.plank) o.g.userData.plank.rotation.x = -0.24;
    G.audio.play('pop'); G.fx.spawn('sparkle', pet.pos.clone().setY(0.4), 4); specs.forEach((sp) => { if (Math.random() < 0.4) sp.clapT = 0.8; });
    st.idx++; st.busy = false; pet.d.agility = Math.min(100, (pet.d.agility || 0) + 0.4);
  }
  function finishAgility() {
    st.phase = 'done'; G.audio.play('whistle'); const time = Math.round((st.t + st.refusals * 2) * 10) / 10;
    drawTimer(time); G.ui.banner('Finished!', time.toFixed(1) + ' seconds', 2000); G.audio.play('cheer'); specs.forEach((s) => { s.cheerT = 2; }); G.fx.spawn('confetti', pet.pos.clone().setY(1.5), 40);
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
      st.t += dt; hud(); if (Math.floor(st.t * 10) !== st._tt) { st._tt = Math.floor(st.t * 10); drawTimer(st.t); }
      const K = G.input.keys || {}; const kx = (K.KeyD || K.ArrowRight ? 1 : 0) - (K.KeyA || K.ArrowLeft ? 1 : 0), kz = (K.KeyS || K.ArrowDown ? 1 : 0) - (K.KeyW || K.ArrowUp ? 1 : 0);
      if (!st.busy) {
        let tgt = null; if (steer && steer.target) tgt = steer.target; if (kx || kz) tgt = pet.pos.clone().add(new V3(kx, 0, kz).multiplyScalar(3));
        if (tgt) { pet.task = null; pet.setPose('stand'); pet.moveTarget = tgt.clone(); const d = U.d2(pet.pos.x, pet.pos.z, tgt.x, tgt.z); pet.speedMul = d > 2.5 ? 3.0 + (pet.d.agility || 0) * 0.012 : 1.6; } else pet.moveTarget = null;
        const o = obstacles[st.idx];
        if (o) {
          const toC = new V3(o.c.x - pet.pos.x, 0, o.c.z - pet.pos.z); const along = -toC.dot(o.dir); const lateral = Math.abs(toC.dot(new V3(o.dir.z, 0, -o.dir.x)));
          if (o.type === 'finish') { if (U.d2(pet.pos.x, pet.pos.z, o.c.x, o.c.z) < 1.6) { st.idx++; finishAgility(); } }
          else { const d = U.d2(pet.pos.x, pet.pos.z, o.entry.x, o.entry.z); const fwd = new V3(Math.sin(pet.heading), 0, Math.cos(pet.heading));
            // forgiving: near the entry (or approaching from the right side, close to the obstacle) and not heading backwards
            if ((d < 1.5 && fwd.dot(o.dir) > -0.3) || (along < -0.2 && along > -(o.len / 2 + 1.6) && lateral < 1.0 && fwd.dot(o.dir) > 0)) { pet.moveTarget = null; pet.task = doObstacle(o); } }
        }
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
