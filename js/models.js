'use strict';
/* =========================================================
   Shiba Days — procedural models
   ========================================================= */
const M = G.M = {};
const _mc = {};
M.mat = function (color, o = {}) {
  const key = color + '|' + JSON.stringify(o);
  if (_mc[key]) return _mc[key];
  const m = new THREE.MeshStandardMaterial({
    color, roughness: o.r ?? 0.78, metalness: o.m ?? 0, flatShading: !!o.flat,
    transparent: o.op !== undefined, opacity: o.op ?? 1, side: o.side || THREE.FrontSide,
  });
  if (o.em) { m.emissive = new THREE.Color(o.em); m.emissiveIntensity = o.ei ?? 1; }
  if (o.map) m.map = o.map;
  if (o.vc) m.vertexColors = true;
  if (o.dw === false) m.depthWrite = false;
  _mc[key] = m; return m;
};
M.basic = (color, o = {}) => { const key = 'b' + color + JSON.stringify(o); if (_mc[key]) return _mc[key]; const m = new THREE.MeshBasicMaterial({ color, transparent: o.op !== undefined, opacity: o.op ?? 1, depthWrite: o.dw ?? true, side: o.side || THREE.FrontSide }); if (o.map) m.map = o.map; return (_mc[key] = m); };
// soft fur: vertex colours + warm rim light for a fuzzy silhouette
M.fur = function (rim = 0.36) {
  const key = 'fur' + rim; if (_mc[key]) return _mc[key];
  const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.92, metalness: 0 });
  m.onBeforeCompile = (sh) => {
    sh.fragmentShader = sh.fragmentShader.replace('#include <output_fragment>',
      `float rimF = 1.0 - clamp(dot(normalize(normal), normalize(vViewPosition)), 0.0, 1.0);
       outgoingLight += vec3(1.0, 0.93, 0.82) * pow(rimF, 2.4) * ${rim.toFixed(3)} * (0.6 + 0.4 * diffuseColor.rgb);
       outgoingLight *= 1.0 - pow(rimF, 6.0) * 0.12;
       #include <output_fragment>`);
  };
  m.customProgramCacheKey = () => 'fur' + rim;
  return (_mc[key] = m);
};
function mesh(geo, mat, part, parent, cast = true) {
  const m = new THREE.Mesh(geo, mat); m.castShadow = cast; m.receiveShadow = false;
  if (part) m.userData.part = part; if (parent) parent.add(m); return m;
}
M.mesh = mesh;
function paint(geo, fn) {
  const pos = geo.attributes.position, nor = geo.attributes.normal;
  const cols = new Float32Array(pos.count * 3); const c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    fn(c, pos.getX(i), pos.getY(i), pos.getZ(i), nor.getX(i), nor.getY(i), nor.getZ(i));
    cols[i * 3] = c.r; cols[i * 3 + 1] = c.g; cols[i * 3 + 2] = c.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(cols, 3));
  return geo;
}
M.paint = paint;
function taperTube(pts, r0, r1, segs, rad, painter) {
  const curve = new THREE.CatmullRomCurve3(pts.map((p) => new V3(p[0], p[1], p[2])));
  const geo = new THREE.TubeGeometry(curve, segs, 1, rad, false);
  const pos = geo.attributes.position, nor = geo.attributes.normal;
  const cols = new Float32Array(pos.count * 3); const c = new THREE.Color();
  const P = new V3(), v = new V3(), n = new V3();
  for (let i = 0; i <= segs; i++) {
    const t = i / segs; curve.getPointAt(t, P);
    const r = U.lerp(r0, r1, Math.pow(t, 1.15)) * (t < 0.08 ? 1 + (0.08 - t) * 3 : 1);
    for (let j = 0; j <= rad; j++) {
      const k = i * (rad + 1) + j;
      v.fromBufferAttribute(pos, k).sub(P).multiplyScalar(r).add(P);
      pos.setXYZ(k, v.x, v.y, v.z);
      n.fromBufferAttribute(nor, k);
      if (painter) painter(c, t, n, v); else c.set(0xffffff);
      cols[k * 3] = c.r; cols[k * 3 + 1] = c.g; cols[k * 3 + 2] = c.b;
    }
  }
  geo.setAttribute('color', new THREE.BufferAttribute(cols, 3));
  pos.needsUpdate = true; geo.computeBoundingSphere();
  return { geo, curve };
}
M.taperTube = taperTube;

/* ---------------- coat painting ---------------- */
function coatCols(C) {
  if (C._c) return C._c;
  const o = {};
  for (const k of ['top', 'mid', 'under', 'tan', 'dots', 'stripes', 'points', 'mask']) if (C[k]) o[k] = new THREE.Color(C[k]);
  o.orange = new THREE.Color('#df8a3e'); o.dark = new THREE.Color('#2a2322');
  return (C._c = o);
}
function coat(out, C, part, nx, ny, nz, wx, wy, wz, ex = {}) {
  const K = coatCols(C);
  let u = 0;
  switch (part) {
    case 'torso': u = Math.max(U.smooth(-0.15, -0.7, ny), U.smooth(0.6, 0.97, nz) * U.smooth(0.4, -0.2, ny)); break;
    case 'rump': u = U.smooth(-0.2, -0.75, ny); break;
    case 'chest': u = Math.max(U.smooth(0.45, -0.1, ny), U.smooth(0.2, 0.75, nz) * U.smooth(0.75, 0.25, ny)); break;
    case 'head': { const throat = U.smooth(-0.15, -0.55, ny) * U.smooth(-0.7, 0.1, nz); const cheek = U.smooth(0.42, 0.85, nz) * U.smooth(0.1, -0.32, ny); u = Math.max(throat, cheek); break; }
    case 'cheek': u = U.smooth(0.45, -0.25, ny); break;
    case 'muzzle': u = 1 - U.smooth(0.5, 0.95, ny) * U.smooth(0.9, 0.4, nz) * 0.6; break;
    case 'jaw': u = 1; break;
    case 'leg': u = Math.max((ex.sock || 0) * U.smooth(0.35, 0.8, ex.t), U.smooth(0.2, 0.95, -nx * ex.s) * 0.55 * (ex.f < 0 ? 1 : 0.6)); break;
    case 'paw': u = ex.sock || 0; break;
    case 'tail': u = ex.u || 0; break;
    case 'ear': u = 0; break;
    default: u = 0;
  }
  if (C.tan) {
    out.copy(K.top);
    out.lerp(K.tan, U.smooth(0.08, 0.4, u));
    out.lerp(K.under, U.smooth(0.5, 0.9, u));
    if (part === 'muzzle' || part === 'cheek') out.lerp(K.tan, 0.25 * (1 - u));
  } else {
    out.copy(K.mid).lerp(K.top, U.smooth(0.05, 0.9, ny) * (C.sesame ? 1 : 0.8));
    if (C.sesame) { const n = U.noise3(wx * 70, wy * 70, wz * 70); out.lerp(K.top, U.smooth(0.1, 0.85, ny) * n * 0.55); }
    if (C.stripes && u < 0.5 && part !== 'muzzle' && part !== 'jaw') {
      const s = Math.sin((part === 'tail' ? ex.t * 30 : wz * 60 + Math.sin(wx * 25) * 1.6) + (part === 'head' ? wx * 55 : 0) + (part === 'leg' ? wy * 70 : 0));
      if (s > 0.3) out.lerp(K.stripes, 0.8 * (1 - u * 2));
    }
    if (C.calico && u < 0.55 && !(part === 'head' && nz > 0.35) && part !== 'cheek') {
      const n = U.noise3(wx * 8 + 3.1, wy * 8 + 1.7, wz * 8);
      if (n > 0.58) out.copy(K.orange); else if (n < 0.34) out.copy(K.dark);
    }
    out.lerp(K.under, u);
  }
  if (C.points && ex.point) out.lerp(K.points, ex.point);
  if (C.mask && (part === 'muzzle' || part === 'jaw' || part === 'ear')) out.copy(K.mask);
  return out;
}
function paintSphere(geo, C, part, sx, sy, sz, ex) {
  return paint(geo, (c, x, y, z, nx, ny, nz) => coat(c, C, part, nx, ny, nz, x * sx, y * sy, z * sz, ex));
}

/* =========================================================
   Pet builder (dogs + cats)
   ========================================================= */
M.pet = function (spec) {
  const B = G.BREEDS[spec.breed] || G.BREEDS.shiba;
  const C = G.COATS[spec.coat] || G.COATS.red;
  const cat = B.species === 'cat';
  const S = (B.scale || 1) * (spec.size || 1);
  const root = new THREE.Group(); root.name = 'pet';
  const rig = new THREE.Group(); rig.scale.setScalar(S); root.add(rig);
  const P = { root, rig, B, C, S, meshes: [], legs: [], ears: [], eyes: [], cat };
  const fur = M.fur(cat ? 0.3 : 0.38);
  const [bx, by, bz] = B.body;
  const L1 = B.legL, L2 = B.legL * 0.95, lw = B.legW, pawH = lw * 0.78;
  const baseH = L1 + L2 + pawH + by * 0.4;
  P.baseH = baseH; P.dims = { bx, by, bz, L1, L2, lw, pawH, hr: B.headR };
  const sock = C.sock !== undefined ? C.sock : (cat ? (spec.coat === 'tuxedo' ? 1 : 0) : (C.tan || C.mask ? 0.75 : spec.coat === 'dachs' || spec.coat === 'golden' ? 0 : 0.85));
  const addM = (m) => { P.meshes.push(m); return m; };

  const body = new THREE.Group(); body.position.y = baseH; rig.add(body); P.body = body;
  // torso: one smooth bean-shaped lathe body (rump, soft waist, puffed chest)
  {
    const N = 36, pts = [];
    for (let i = 0; i <= N; i++) {
      const t = i / N; const e = 2 * t - 1;
      let r = Math.pow(Math.max(0, 1 - e * e), 0.62);
      r *= 1 - 0.07 * Math.exp(-Math.pow((t - 0.47) / 0.16, 2)) + 0.06 * Math.exp(-Math.pow((t - 0.8) / 0.13, 2)) + 0.03 * Math.exp(-Math.pow((t - 0.18) / 0.12, 2));
      pts.push(new THREE.Vector2(Math.max(0.0001, r * bx), -bz * 1.08 + t * bz * 2.16));
    }
    const tg = new THREE.LatheGeometry(pts, 40); tg.rotateX(Math.PI / 2); // lathe axis now along z
    tg.scale(1, by / bx, 1);
    tg.computeVertexNormals();
    const pos = tg.attributes.position;
    for (let i = 0; i < pos.count; i++) { const z = pos.getZ(i); const t = (z / (bz * 1.08) + 1) / 2; pos.setY(i, pos.getY(i) + by * 0.12 * U.smooth(0.45, 1, t) - by * 0.04 * U.smooth(0.5, 0, t)); }
    tg.computeVertexNormals();
    paint(tg, (c, x, y, z, nx, ny, nz) => coat(c, C, 'torso', nx, ny, nz, x, y, z));
    P.torso = addM(mesh(tg, fur, 'torso', body));
    P.torso.material.side = THREE.FrontSide;
  }
  // chest ruff (soft fluff under the chin)
  const cg = paintSphere(new THREE.SphereGeometry(1, 28, 20), C, 'chest', bx, by, bx); cg.scale(bx * 0.74, by * 0.8, bx * 0.55);
  addM(mesh(cg, fur, 'torso', body)).position.set(0, by * 0.18, bz * 0.82);

  // ---- head ----
  const hr = B.headR;
  const neck = new THREE.Group(); neck.position.set(0, by * 0.52, bz * 0.74); body.add(neck); P.neck = neck;
  const head = new THREE.Group(); neck.add(head); P.head = head;
  const hc = new THREE.Group(); hc.position.set(0, hr * 0.66, hr * 0.38); head.add(hc); P.hc = hc;
  const rx = hr * (B.cheek || 1.08), ry = hr * 0.9, rz = hr * 0.9;
  const hg = paintSphere(new THREE.SphereGeometry(1, 44, 32), C, 'head', rx, ry, rz); hg.scale(rx, ry, rz);
  P.headMesh = addM(mesh(hg, fur, 'head', hc));
  const surf = (x, y, z, k = 1) => { const d = new V3(x, y, z).normalize(); return { p: new V3(d.x * rx * k, d.y * ry * k, d.z * rz * k), n: new V3(d.x / rx, d.y / ry, d.z / rz).normalize() }; };
  // fluffy cheeks
  if (!cat) {
    for (const s of [-1, 1]) {
      const g = paintSphere(new THREE.SphereGeometry(1, 24, 18), C, 'cheek', hr, hr, hr); g.scale(hr * 0.42, hr * 0.36, hr * 0.42);
      addM(mesh(g, fur, 'head', hc)).position.set(s * rx * 0.62, -hr * 0.28, rz * 0.32);
    }
  } else {
    for (const s of [-1, 1]) { // cat cheek tufts
      const g = paintSphere(new THREE.SphereGeometry(1, 20, 14), C, 'cheek', hr, hr, hr); g.scale(hr * 0.36, hr * 0.3, hr * 0.32);
      addM(mesh(g, fur, 'head', hc)).position.set(s * rx * 0.66, -hr * 0.3, rz * 0.25);
    }
  }
  // muzzle
  const sn = B.snout;
  const mzL = hr * 0.36 * sn + hr * 0.08;
  const mg = paintSphere(new THREE.SphereGeometry(1, 30, 22), C, 'muzzle', hr, hr, hr); mg.scale(hr * (cat ? 0.34 : 0.4), hr * (cat ? 0.25 : 0.3), mzL);
  const muzzle = addM(mesh(mg, fur, 'muzzle', hc)); muzzle.position.set(0, -hr * (cat ? 0.3 : 0.3), rz * 0.66);
  const mzFront = rz * 0.66 + mzL * 0.92;
  // nose
  const noseCol = C.nose || (spec.coat === 'cream' ? '#5a3a2a' : '#1d1716');
  const ng = new THREE.SphereGeometry(hr * (cat ? 0.075 : 0.105), 20, 14); ng.scale(1.3, cat ? 0.8 : 0.85, 0.85);
  const nose = mesh(ng, M.mat(noseCol, { r: 0.28 }), 'nose', hc); nose.position.set(0, -hr * (cat ? 0.21 : 0.19), mzFront - hr * 0.02); addM(nose); P.nose = nose;
  const nh = mesh(new THREE.SphereGeometry(hr * 0.03, 10, 8), M.basic(0xffffff, { op: 0.7 }), null, nose, false); nh.position.set(-hr * 0.03, hr * 0.04, hr * 0.06);
  // ω mouth
  const lineM = M.mat('#3a2620', { r: 0.6 });
  for (const s of [-1, 1]) {
    const tg2 = new THREE.TorusGeometry(hr * 0.07, hr * 0.014, 6, 16, Math.PI);
    const m = mesh(tg2, lineM, null, hc, false); m.rotation.z = Math.PI; m.position.set(s * hr * 0.07, -hr * (cat ? 0.31 : 0.33), mzFront - hr * 0.09); m.rotation.x = -0.25;
  }
  const philtrum = mesh(new THREE.CylinderGeometry(hr * 0.012, hr * 0.012, hr * 0.08, 6), lineM, null, hc, false); philtrum.position.set(0, -hr * (cat ? 0.27 : 0.275), mzFront - hr * 0.07);
  // jaw + tongue + mouth interior
  const jaw = new THREE.Group(); jaw.position.set(0, -hr * 0.4, rz * 0.6); hc.add(jaw); P.jaw = jaw;
  const jg = paintSphere(new THREE.SphereGeometry(1, 20, 14), C, 'jaw', hr, hr, hr); jg.scale(hr * 0.28, hr * 0.11, hr * 0.3);
  addM(mesh(jg, fur, 'muzzle', jaw)).position.set(0, -hr * 0.02, hr * 0.12 * sn + hr * 0.04);
  const inside = mesh(new THREE.SphereGeometry(1, 16, 12), M.mat('#7a2f35', { r: 0.6 }), null, hc, false); inside.scale.set(hr * 0.24, hr * 0.12, hr * 0.26 * sn + hr * 0.04); inside.position.set(0, -hr * 0.38, rz * 0.66 + hr * 0.04);
  const tongue = mesh(new THREE.SphereGeometry(1, 16, 12), M.mat('#f27a8a', { r: 0.45 }), 'tongue', jaw, false);
  tongue.scale.set(hr * 0.13, hr * 0.04, hr * 0.2); tongue.position.set(0, hr * 0.03, hr * 0.14 * sn + hr * 0.04); P.tongue = tongue;
  P.tongueBase = tongue.position.clone();

  // eyes
  const eyeR = hr * (cat ? 0.165 : 0.148);
  const eyeMat = M.mat(cat ? '#111' : '#151012', { r: 0.12 });
  const hiMat = M.basic(0xffffff);
  const arcMat = M.mat('#1d1716', { r: 0.5 });
  for (const s of [-1, 1]) {
    const sp = surf(s * 0.43, 0.13, 0.89, 0.965);
    const eg = new THREE.Group(); eg.position.copy(sp.p); eg.quaternion.setFromUnitVectors(new V3(0, 0, 1), sp.n.clone().lerp(new V3(0, 0, 1), 0.45).normalize()); hc.add(eg);
    const open = new THREE.Group(); eg.add(open);
    const eye = mesh(new THREE.SphereGeometry(eyeR, 24, 18), eyeMat, 'head', open, false); eye.scale.set(1, cat ? 1.15 : 1.12, 0.5);
    if (cat) {
      const iris = mesh(new THREE.SphereGeometry(eyeR * 0.92, 24, 18), M.mat(C.eye || '#9ccc4a', { r: 0.2 }), null, open, false); iris.scale.set(1, 1.12, 0.45); iris.position.z = eyeR * 0.09;
      const pup = mesh(new THREE.SphereGeometry(eyeR * 0.5, 16, 12), eyeMat, null, open, false); pup.scale.set(0.42, 1.5, 0.4); pup.position.z = eyeR * 0.3; P.eyes.push({ pup });
    } else if (C.eye) {
      const iris = mesh(new THREE.SphereGeometry(eyeR * 0.8, 20, 14), M.mat(C.eye, { r: 0.2 }), null, open, false); iris.scale.set(1, 1.1, 0.45); iris.position.z = eyeR * 0.1;
      const pup = mesh(new THREE.SphereGeometry(eyeR * 0.45, 16, 12), eyeMat, null, open, false); pup.scale.set(1, 1, 0.4); pup.position.z = eyeR * 0.3;
    }
    const h1 = mesh(new THREE.SphereGeometry(eyeR * 0.34, 12, 10), hiMat, null, open, false); h1.position.set(eyeR * 0.3, eyeR * 0.42, eyeR * 0.42);
    const h2 = mesh(new THREE.SphereGeometry(eyeR * 0.15, 10, 8), hiMat, null, open, false); h2.position.set(-eyeR * 0.32, -eyeR * 0.38, eyeR * 0.4);
    const happy = mesh(new THREE.TorusGeometry(eyeR * 0.8, eyeR * 0.24, 8, 20, Math.PI), arcMat, null, eg, false); happy.position.y = -eyeR * 0.25; happy.visible = false;
    const sleep = mesh(new THREE.TorusGeometry(eyeR * 0.8, eyeR * 0.2, 8, 20, Math.PI), arcMat, null, eg, false); sleep.rotation.z = Math.PI; sleep.position.y = eyeR * 0.3; sleep.visible = false;
    P.eyes.push({ g: eg, open, happy, sleep, s });
    // eyebrow dots
    if (!cat && C.dots && spec.breed !== 'pug') {
      const dp = surf(s * 0.3, 0.5, 0.81, 0.99);
      const dm = M.mat(C.dots, { r: 0.9 });
      const d = mesh(new THREE.SphereGeometry(hr * 0.062, 14, 10), dm, null, hc, false); d.scale.set(1.35, 0.85, 0.45); d.position.copy(dp.p); d.quaternion.setFromUnitVectors(new V3(0, 0, 1), dp.n);
    }
    // blush
    const bp = surf(s * 0.62, -0.2, 0.74, 1.012);
    const blush = mesh(new THREE.CircleGeometry(hr * 0.12, 20), M.basic('#ff8fa8', { op: 0.38, dw: false }), null, hc, false);
    blush.position.copy(bp.p); blush.quaternion.setFromUnitVectors(new V3(0, 0, 1), bp.n);
  }
  P.eyes = P.eyes.filter((e) => e.g);
  // whiskers for cats
  if (cat) {
    const wm = M.mat('#f5f0e8', { r: 0.6 });
    for (const s of [-1, 1]) for (let i = 0; i < 3; i++) {
      const w = mesh(new THREE.CylinderGeometry(hr * 0.008, hr * 0.004, hr * 0.75, 4), wm, null, hc, false);
      w.position.set(s * hr * 0.42, -hr * 0.3 + i * hr * 0.05, mzFront - hr * 0.12); w.rotation.z = s * (Math.PI / 2 + (i - 1) * 0.18); w.rotation.y = s * 0.3;
    }
  }
  // ears
  const earOuter = (s) => {
    const pivot = new THREE.Group();
    if (B.ear === 'prick' || B.ear === 'cat') {
      const sp = surf(s * 0.5, 0.8, -0.05, 0.86);
      pivot.position.copy(sp.p); pivot.rotation.set(-0.1, 0, -s * (cat ? 0.28 : 0.34));
      const eh = B.earH, er = B.earR;
      const og = new THREE.ConeGeometry(er, eh, 24, 1); og.translate(0, eh / 2, 0);
      paint(og, (c, x, y, z, nx, ny, nz) => coat(c, C, 'ear', nx, ny, nz, x, y, z, { point: 1 }));
      og.scale(1, 1, cat ? 0.42 : 0.5);
      const outer = addM(mesh(og, fur, 'ear', pivot));
      const inner = mesh(new THREE.ConeGeometry(er * 0.66, eh * 0.78, 20, 1).translate(0, eh * 0.38, 0), M.mat(cat ? '#f2b4b4' : C.mask ? '#4a3a36' : (C.tan ? '#d9c2a5' : '#f6d8c6'), { r: 0.85 }), 'ear', pivot, false);
      inner.scale.set(1, 1, 0.3); inner.position.z = er * 0.22; addM(inner);
      outer.userData.part = 'ear';
    } else if (B.ear === 'flop') {
      const sp = surf(s * 0.82, 0.45, -0.05, 0.92);
      pivot.position.copy(sp.p); pivot.rotation.set(0, 0, s * 0.18);
      const g = paintSphere(new THREE.SphereGeometry(1, 20, 14), C, 'ear', 1, 1, 1, {}); g.scale(B.earR * 0.42, B.earH * 0.8, B.earR * 1.05); g.translate(0, -B.earH * 0.62, 0);
      addM(mesh(g, fur, 'ear', pivot));
    } else { // fold (pug)
      const sp = surf(s * 0.62, 0.72, 0.05, 0.92);
      pivot.position.copy(sp.p); pivot.rotation.set(1.1, 0, -s * 0.5);
      const og = new THREE.ConeGeometry(B.earR, B.earH, 16, 1); og.translate(0, B.earH / 2, 0); og.scale(1, 1, 0.4);
      addM(mesh(og, M.mat(C.mask || '#3a2c26', { r: 0.9 }), 'ear', pivot));
    }
    hc.add(pivot); P.ears.push({ pivot, s, base: pivot.rotation.clone() });
  };
  earOuter(-1); earOuter(1);

  // slots for accessories / carrying
  const accScale = hr / 0.165;
  const slot = (parent, x, y, z) => { const g = new THREE.Group(); g.position.set(x, y, z); g.scale.setScalar(accScale); parent.add(g); return g; };
  P.slots = {
    head: slot(hc, 0, ry * 0.86, -hr * 0.08),
    face: slot(hc, 0, hr * 0.13, rz * 0.86),
    collar: slot(neck, 0, -hr * 0.2, hr * 0.02),
    neck: slot(neck, 0, -hr * 0.2, hr * 0.02),
  };
  P.slots.collar.rotation.x = 0.85; P.slots.neck.rotation.x = 0.85;
  P.mouth = new THREE.Group(); P.mouth.position.set(0, hr * 0.02, hr * 0.3 * sn + hr * 0.12); jaw.add(P.mouth);

  // ---- legs ----
  const legDefs = [['FL', -1, 1], ['FR', 1, 1], ['BL', -1, -1], ['BR', 1, -1]];
  for (const [name, s, f] of legDefs) {
    const hip = new THREE.Group(); hip.position.set(s * bx * 0.56, -by * 0.4, f * bz * (f > 0 ? 0.58 : 0.6)); body.add(hip);
    const ex = { s, f, sock: f > 0 ? sock : sock * 0.85, point: cat ? 0 : 0 };
    // shoulder / thigh blob
    const tb = paintSphere(new THREE.SphereGeometry(1, 20, 14), C, f < 0 ? 'rump' : 'torso', lw, lw, lw); tb.scale(lw * 1.2, lw * 1.9, lw * (f < 0 ? 1.6 : 1.25));
    addM(mesh(tb, fur, 'torso', hip)).position.set(-s * lw * 0.35, lw * 0.25, 0);
    const ug = new THREE.CylinderGeometry(lw * 1.12, lw * 0.98, L1, 18, 12); ug.translate(0, -L1 / 2, 0);
    paint(ug, (c, x, y, z, nx, ny, nz) => coat(c, C, 'leg', nx, ny, nz, x, y, z, Object.assign({ t: (-y / L1) * 0.5, point: C.points ? U.smooth(0.5, 1, -y / L1) * 0.5 : 0 }, ex)));
    addM(mesh(ug, fur, 'leg', hip));
    const knee = new THREE.Group(); knee.position.y = -L1; hip.add(knee);
    const kg = new THREE.SphereGeometry(lw * 0.97, 18, 12); paint(kg, (c, x, y, z, nx, ny, nz) => coat(c, C, 'leg', nx, ny, nz, x, y, z, Object.assign({ t: 0.5, point: C.points ? 0.6 : 0 }, ex)));
    addM(mesh(kg, fur, 'leg', knee));
    const lg = new THREE.CylinderGeometry(lw * 0.98, lw * 0.88, L2, 18, 12); lg.translate(0, -L2 / 2, 0);
    paint(lg, (c, x, y, z, nx, ny, nz) => coat(c, C, 'leg', nx, ny, nz, x, y, z, Object.assign({ t: 0.5 + (-y / L2) * 0.5, point: C.points ? 0.85 : 0 }, ex)));
    addM(mesh(lg, fur, 'leg', knee));
    const pg = new THREE.SphereGeometry(1, 20, 14);
    paint(pg, (c, x, y, z, nx, ny, nz) => coat(c, C, 'paw', nx, ny, nz, x, y, z, Object.assign({ point: C.points ? 1 : 0 }, ex)));
    pg.scale(lw * 1.12, pawH, lw * 1.38);
    const paw = addM(mesh(pg, fur, 'paw', knee)); paw.position.set(0, -L2, lw * 0.35);
    const pad = mesh(new THREE.SphereGeometry(lw * 0.7, 12, 8), M.mat('#3a2a2a', { r: 0.7 }), null, paw, false); pad.scale.set(1, 0.3, 1); pad.position.set(0, -pawH * 0.75, lw * 0.05);
    if (!cat && spec.coat !== 'blacktan') pad.material = M.mat('#e89aa0', { r: 0.7 });
    if (cat) pad.material = M.mat(C.nose || '#e89aa0', { r: 0.7 });
    P.legs.push({ hip, knee, paw, s, f, name });
  }

  // ---- tail ----
  const tail = new THREE.Group(); tail.position.set(0, by * 0.55, -bz * 0.88); body.add(tail); P.tail = tail;
  const ts = by / 0.165;
  const scalePts = (pts) => pts.map((p) => [p[0] * ts, p[1] * ts, p[2] * ts]);
  let tdef;
  if (B.tail === 'curl') tdef = { pts: [[0, 0, 0], [0, 0.07, -0.05], [0, 0.15, -0.045], [0, 0.205, 0.005], [0.018, 0.215, 0.072], [0.045, 0.18, 0.115], [0.062, 0.125, 0.11], [0.065, 0.095, 0.065]], r0: 0.058, r1: 0.032, c: [0.035, 0.13, 0.04] };
  else if (B.tail === 'plume') tdef = { pts: [[0, 0, 0], [0, 0.08, -0.09], [0, 0.18, -0.1], [0, 0.25, -0.03], [0, 0.24, 0.05]], r0: 0.06, r1: 0.042, c: [0, 0.15, 0.0] };
  else if (B.tail === 'straight') tdef = { pts: [[0, 0, 0], [0, 0.0, -0.1], [0, -0.03, -0.2], [0, -0.07, -0.28]], r0: 0.032, r1: 0.014, c: [0, -1, 0] };
  else if (B.tail === 'cat') tdef = { pts: [[0, 0, 0], [0, 0.05, -0.1], [0, 0.16, -0.16], [0, 0.3, -0.15], [0, 0.4, -0.09], [0, 0.44, -0.02]], r0: 0.03, r1: 0.024, c: [0, -1, 0] };
  if (tdef) {
    const ctr = new V3(...tdef.c).multiplyScalar(ts);
    const { geo, curve } = taperTube(scalePts(tdef.pts), tdef.r0 * ts, tdef.r1 * ts, 64, 20, (c, t, n, v) => {
      let u = 0;
      if (B.tail === 'curl' || B.tail === 'plume') { const toC = ctr.clone().sub(v).normalize(); u = U.smooth(-0.15, 0.85, n.dot(toC)) * 0.95; }
      else u = U.smooth(0, -0.8, n.y) * 0.7;
      const pt = C.points ? U.smooth(0.2, 0.8, t) : 0;
      coat(c, C, 'tail', n.x, n.y, n.z, v.x, v.y, v.z, { u: C.calico ? 0 : u, t, point: pt });
      if (C.tan && B.tail === 'curl') c.lerp(coatCols(C).tan, U.smooth(0.2, 0.8, u) * 0.3);
    });
    addM(mesh(geo, fur, 'tail', tail));
    const tip = curve.getPointAt(1);
    const tipG = new THREE.SphereGeometry(tdef.r1 * ts * 1.02, 14, 10);
    const tipCol = new THREE.Color(); coat(tipCol, C, 'tail', 0, 1, 0, tip.x, tip.y, tip.z, { u: B.tail === 'curl' ? 0.5 : 0, t: 1, point: C.points ? 1 : 0 });
    paint(tipG, (c) => c.copy(tipCol));
    addM(mesh(tipG, fur, 'tail', tail)).position.copy(tip);
  } else { // stub
    const g = paintSphere(new THREE.SphereGeometry(1, 16, 12), C, 'rump', 1, 1, 1); g.scale(0.05 * ts, 0.045 * ts, 0.04 * ts);
    addM(mesh(g, fur, 'tail', tail)).position.set(0, -0.01, -0.02);
  }
  P.headR = hr;
  root.traverse((o) => { if (o.isMesh) o.userData.root = root; });
  return P;
};

/* =========================================================
   Accessories (built for a 0.165 head radius)
   ========================================================= */
function stripeCone(r, h, c1, c2, bands = 4) {
  const g = new THREE.ConeGeometry(r, h, 28, 8); g.translate(0, h / 2, 0);
  const a = new THREE.Color(c1), b = new THREE.Color(c2);
  return paint(g, (c, x, y) => c.copy(Math.floor((y / h) * bands * 2) % 2 ? a : b));
}
M.acc = function (id) {
  const it = G.ITEMS[id]; const g = new THREE.Group(); const col = it.color || '#e2574c';
  const m = (c, o) => M.mat(c, o || { r: 0.7 });
  switch (id) {
    case 'collar_red': case 'collar_blue': case 'collar_pink': case 'collar_gold': {
      const t = mesh(new THREE.TorusGeometry(0.128, 0.018, 10, 40), m(col, it.metal ? { r: 0.25, m: 0.8 } : { r: 0.55 }), null, g); t.rotation.x = Math.PI / 2;
      const tag = mesh(it.bell ? new THREE.SphereGeometry(0.026, 14, 10) : new THREE.CylinderGeometry(0.024, 0.024, 0.008, 18), m('#f2c24b', { r: 0.25, m: 0.85 }), null, g);
      tag.position.set(0, -0.026, 0.138); if (!it.bell) tag.rotation.x = Math.PI / 2;
      break;
    }
    case 'bandana_red': case 'bandana_plaid': {
      let mat = m(col, { r: 0.85, side: THREE.DoubleSide });
      if (it.plaid) mat = M.mat('#ffffff', { r: 0.85, side: THREE.DoubleSide, map: G.canvasTex(64, 64, (c) => { c.fillStyle = '#4a7a5a'; c.fillRect(0, 0, 64, 64); c.fillStyle = 'rgba(226,87,76,.7)'; for (let i = 0; i < 64; i += 16) { c.fillRect(i, 0, 6, 64); c.fillRect(0, i, 64, 6); } c.fillStyle = 'rgba(255,240,200,.5)'; for (let i = 8; i < 64; i += 16) { c.fillRect(i, 0, 2, 64); c.fillRect(0, i, 64, 2); } }) });
      const band = mesh(new THREE.TorusGeometry(0.128, 0.02, 8, 30), mat, null, g); band.rotation.x = Math.PI / 2;
      const tri = new THREE.ConeGeometry(0.1, 0.14, 3, 1); tri.rotateX(Math.PI); tri.scale(1, 1, 0.25);
      const tm = mesh(tri, mat, null, g); tm.position.set(0, -0.055, 0.118); tm.rotation.set(-0.2, Math.PI / 6 * 3, 0);
      if (!it.plaid) { const dots = M.mat('#fff4e0'); for (let i = 0; i < 5; i++) { const d = mesh(new THREE.SphereGeometry(0.008, 6, 6), dots, null, tm, false); d.position.set(U.rand(-0.04, 0.04), U.rand(-0.04, 0.04), 0.012); } }
      break;
    }
    case 'scarf': {
      const knit = M.mat('#ffffff', { r: 0.95, map: G.canvasTex(64, 64, (c) => { c.fillStyle = col; c.fillRect(0, 0, 64, 64); c.fillStyle = 'rgba(255,255,255,.35)'; for (let y = 0; y < 64; y += 8) for (let x = 0; x < 64; x += 8) { c.beginPath(); c.ellipse(x + 4, y + 4, 2, 3.5, 0.5, 0, 7); c.fill(); } c.fillStyle = '#e2574c'; c.fillRect(0, 24, 64, 10); }, { repeat: [4, 1] }) });
      const t = mesh(new THREE.TorusGeometry(0.13, 0.034, 12, 32), knit, null, g); t.rotation.x = Math.PI / 2;
      const end = mesh(new THREE.BoxGeometry(0.06, 0.13, 0.025), knit, null, g); end.position.set(0.05, -0.07, 0.125); end.rotation.z = 0.25;
      break;
    }
    case 'bowtie': {
      const bm = m(col, { r: 0.5 });
      for (const s of [-1, 1]) { const c = mesh(new THREE.ConeGeometry(0.035, 0.06, 16), bm, null, g); c.rotation.z = s * Math.PI / 2; c.position.set(s * 0.03, 0, 0.135); c.scale.set(1, 1, 0.5); }
      mesh(new THREE.SphereGeometry(0.018, 12, 10), bm, null, g).position.set(0, 0, 0.14);
      const band = mesh(new THREE.TorusGeometry(0.128, 0.008, 6, 30), M.mat('#ffffff'), null, g); band.rotation.x = Math.PI / 2;
      break;
    }
    case 'party': {
      const c = mesh(stripeCone(0.065, 0.17, col, '#f2c24b', 3), M.mat('#fff', { vc: true, r: 0.6 }), null, g);
      c.rotation.z = 0.25; c.position.x = 0.03;
      const pom = mesh(new THREE.SphereGeometry(0.026, 12, 10), M.mat('#ff6f91'), null, c); pom.position.y = 0.17;
      break;
    }
    case 'beanie': {
      const knit = M.mat(col, { r: 0.95 });
      const cap = mesh(new THREE.SphereGeometry(0.155, 28, 16, 0, Math.PI * 2, 0, Math.PI / 2), knit, null, g); cap.scale.set(1.08, 0.75, 1.02); cap.position.y = -0.04;
      const cuff = mesh(new THREE.TorusGeometry(0.158, 0.03, 10, 32), M.mat('#fff4e0', { r: 0.95 }), null, g); cuff.rotation.x = Math.PI / 2; cuff.position.y = -0.035; cuff.scale.set(1.06, 1, 1);
      const pom = mesh(new THREE.SphereGeometry(0.048, 14, 12), M.mat('#fff4e0', { r: 1 }), null, g); pom.position.y = 0.085; g.userData.pom = pom;
      break;
    }
    case 'flower': {
      const ring = mesh(new THREE.TorusGeometry(0.13, 0.012, 6, 30), M.mat('#6aa84f'), null, g); ring.rotation.x = Math.PI / 2; ring.position.y = -0.03;
      const cols = ['#f39bb0', '#fff4e0', '#f2c24b', '#c39bf3', '#ff8fa8', '#fff4e0', '#f2c24b'];
      cols.forEach((cc, i) => {
        const a = (i / cols.length) * Math.PI * 2; const f = new THREE.Group(); f.position.set(Math.cos(a) * 0.13, -0.02, Math.sin(a) * 0.13); g.add(f);
        for (let k = 0; k < 5; k++) { const p = mesh(new THREE.SphereGeometry(0.016, 8, 6), M.mat(cc), null, f, false); const b = k / 5 * Math.PI * 2; p.position.set(Math.cos(b) * 0.017, 0.006, Math.sin(b) * 0.017); p.scale.y = 0.5; }
        mesh(new THREE.SphereGeometry(0.01, 8, 6), M.mat('#f2c24b'), null, f, false).position.y = 0.012;
      });
      break;
    }
    case 'straw': {
      const sm = M.mat(col, { r: 0.95 });
      const brim = mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.012, 36), sm, null, g); brim.position.y = -0.01;
      const crown = mesh(new THREE.CylinderGeometry(0.1, 0.115, 0.08, 28), sm, null, g); crown.position.y = 0.035;
      const band = mesh(new THREE.CylinderGeometry(0.117, 0.117, 0.024, 28, 1, true), M.mat('#e2574c'), null, g); band.position.y = 0.012;
      g.rotation.z = -0.15;
      break;
    }
    case 'bow': {
      const bm = M.mat(col, { r: 0.45 });
      const b = new THREE.Group(); b.position.set(0.09, 0.01, 0.03); b.rotation.z = -0.4; g.add(b);
      for (const s of [-1, 1]) { const c = mesh(new THREE.SphereGeometry(0.045, 16, 12), bm, null, b); c.scale.set(1.2, 0.8, 0.45); c.position.x = s * 0.045; }
      mesh(new THREE.SphereGeometry(0.022, 12, 10), bm, null, b);
      break;
    }
    case 'frog': {
      const gm = M.mat(col, { r: 0.85 });
      const cap = mesh(new THREE.SphereGeometry(0.16, 28, 16, 0, Math.PI * 2, 0, Math.PI / 2), gm, null, g); cap.scale.set(1.1, 0.72, 1.05); cap.position.y = -0.04;
      for (const s of [-1, 1]) {
        const e = mesh(new THREE.SphereGeometry(0.045, 16, 12), gm, null, g); e.position.set(s * 0.075, 0.07, 0.06);
        const w = mesh(new THREE.SphereGeometry(0.03, 14, 10), M.mat('#ffffff', { r: 0.4 }), null, e); w.position.z = 0.025;
        const pp = mesh(new THREE.SphereGeometry(0.016, 10, 8), M.mat('#111', { r: 0.2 }), null, w); pp.position.z = 0.018;
      }
      const smile = mesh(new THREE.TorusGeometry(0.05, 0.006, 6, 16, Math.PI), M.mat('#2f5a2a'), null, g); smile.rotation.z = Math.PI; smile.position.set(0, 0.03, 0.15);
      break;
    }
    case 'crown': {
      const gm = M.mat(col, { r: 0.25, m: 0.9 });
      const band = mesh(new THREE.CylinderGeometry(0.085, 0.09, 0.05, 24, 1, true), M.mat(col, { r: 0.25, m: 0.9, side: THREE.DoubleSide }), null, g); band.position.y = 0.01;
      for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; const s = mesh(new THREE.ConeGeometry(0.02, 0.05, 8), gm, null, g); s.position.set(Math.cos(a) * 0.087, 0.06, Math.sin(a) * 0.087); const gem = mesh(new THREE.SphereGeometry(0.01, 8, 6), M.mat(i % 2 ? '#e2574c' : '#4aa6e0', { r: 0.2 }), null, g, false); gem.position.set(Math.cos(a) * 0.092, 0.01, Math.sin(a) * 0.092); }
      g.rotation.z = 0.12;
      break;
    }
    case 'glasses': case 'shades': {
      const fm = M.mat(col, { r: 0.4 });
      for (const s of [-1, 1]) {
        const r = mesh(new THREE.TorusGeometry(0.048, 0.007, 8, 24), fm, null, g); r.position.set(s * 0.068, 0, 0.012);
        if (it.dark) { const l = mesh(new THREE.CircleGeometry(0.047, 24), M.mat('#111', { r: 0.1, op: 0.85 }), null, g, false); l.position.set(s * 0.068, 0, 0.013); }
        else { const l = mesh(new THREE.CircleGeometry(0.047, 24), M.basic('#dff3ff', { op: 0.2, dw: false }), null, g, false); l.position.set(s * 0.068, 0, 0.013); }
        const arm = mesh(new THREE.BoxGeometry(0.006, 0.006, 0.09), fm, null, g, false); arm.position.set(s * 0.115, 0.005, -0.035);
      }
      mesh(new THREE.TorusGeometry(0.02, 0.006, 6, 12, Math.PI), fm, null, g).position.set(0, 0.004, 0.012);
      break;
    }
    case 'bunny': {
      const fur = M.mat('#ffffff', { r: 1 }), pink = M.mat('#f6b6c4', { r: 0.9 });
      const band = mesh(new THREE.TorusGeometry(0.15, 0.012, 8, 30, Math.PI), M.mat('#f39bb0', { r: 0.6 }), null, g); band.position.y = -0.03;
      for (const s of [-1, 1]) {
        const e = new THREE.Group(); e.position.set(s * 0.06, 0.05, 0); e.rotation.z = -s * 0.18; if (s > 0) { e.rotation.z = -0.9; e.position.y = 0.03; } g.add(e);
        const ear = mesh(new THREE.SphereGeometry(0.035, 14, 10), fur, null, e); ear.scale.set(0.8, 2.6, 0.45); ear.position.y = 0.08;
        const inner = mesh(new THREE.SphereGeometry(0.022, 12, 8), pink, null, e); inner.scale.set(0.8, 2.6, 0.3); inner.position.set(0, 0.08, 0.012);
      }
      break;
    }
    case 'sailor': {
      const wm = M.mat('#ffffff', { r: 0.7 });
      const top = mesh(new THREE.CylinderGeometry(0.11, 0.1, 0.07, 28), wm, null, g); top.position.y = 0.0;
      const rim = mesh(new THREE.CylinderGeometry(0.135, 0.135, 0.015, 28), wm, null, g); rim.position.y = -0.03;
      const stripe = mesh(new THREE.CylinderGeometry(0.103, 0.103, 0.02, 28, 1, true), M.mat('#2e4a8a', { r: 0.6, side: THREE.DoubleSide }), null, g); stripe.position.y = -0.012;
      const anc = mesh(new THREE.TorusGeometry(0.012, 0.004, 6, 12), M.mat('#f2c24b', { r: 0.3, m: 0.8 }), null, g); anc.position.set(0, 0.0, 0.105);
      g.rotation.z = -0.12;
      break;
    }
    case 'tiara': {
      const sm = M.mat('#d9dde6', { r: 0.2, m: 0.95 });
      const band = mesh(new THREE.TorusGeometry(0.1, 0.008, 8, 30, Math.PI), sm, null, g); band.rotation.y = Math.PI / 2; band.rotation.z = Math.PI / 2; band.rotation.x = 0; band.position.y = -0.01;
      for (let i = -2; i <= 2; i++) { const pk = mesh(new THREE.ConeGeometry(0.012, 0.05 - Math.abs(i) * 0.01, 6), sm, null, g); pk.position.set(i * 0.03, 0.025 - Math.abs(i) * 0.005, 0.07 - Math.abs(i) * 0.012); pk.rotation.z = -i * 0.25; }
      const gem = mesh(new THREE.OctahedronGeometry(0.018), M.mat('#f39bb0', { r: 0.1, m: 0.3, em: '#a03a5a', ei: 0.6 }), null, g); gem.position.set(0, 0.04, 0.075);
      break;
    }
    case 'patch': {
      const pm = M.mat('#1a1a1a', { r: 0.6 });
      const pt = mesh(new THREE.CircleGeometry(0.045, 20), pm, null, g); pt.position.set(0.068, 0, 0.016); pt.scale.y = 0.85;
      const strap = mesh(new THREE.TorusGeometry(0.13, 0.004, 4, 30), pm, null, g); strap.rotation.set(0, 0, 0.5); strap.position.z = -0.07;
      break;
    }
    default: break;
  }
  g.traverse((o) => { if (o.isMesh) { o.castShadow = false; o.userData.acc = id; } });
  return g;
};

/* =========================================================
   Items: food, toys, care, café
   ========================================================= */
M.item = function (id) {
  const g = new THREE.Group();
  const m = (c, o) => M.mat(c, o || { r: 0.6 });
  const it = G.ITEMS[id];
  if (it && it.cat === 'acc') return M.acc(id);
  switch (id) {
    case 'ball': case 'yarn': {
      const r = 0.06;
      if (id === 'ball') {
        const geo = paint(new THREE.SphereGeometry(r, 28, 20), (c, x, y, z, nx, ny, nz) => { const th = Math.atan2(nz, nx); c.set(Math.abs(ny - 0.62 * Math.sin(2 * th)) < 0.09 ? '#f6f6ee' : '#cfe24a'); });
        mesh(geo, M.mat('#fff', { vc: true, r: 0.95 }), null, g);
      } else {
        mesh(new THREE.SphereGeometry(r, 24, 18), m('#f39bb0', { r: 1 }), null, g);
        for (let i = 0; i < 5; i++) { const t = mesh(new THREE.TorusGeometry(r * 1.0, 0.004, 4, 30), m('#e07a98', { r: 1 }), null, g); t.rotation.set(Math.random() * 3, Math.random() * 3, 0); }
      }
      break;
    }
    case 'disc': case 'prodisc': {
      const pts = [new THREE.Vector2(0, 0.012), new THREE.Vector2(0.09, 0.012), new THREE.Vector2(0.118, 0.006), new THREE.Vector2(0.122, -0.008), new THREE.Vector2(0.11, -0.014), new THREE.Vector2(0.104, -0.004), new THREE.Vector2(0.0, -0.002)];
      mesh(new THREE.LatheGeometry(pts, 40), m(id === 'disc' ? '#ff8a3c' : '#3b7fd6', { r: 0.35, side: THREE.DoubleSide }), null, g);
      const ring = mesh(new THREE.TorusGeometry(0.07, 0.006, 6, 36), m(id === 'disc' ? '#fff4e0' : '#f2c24b', id === 'prodisc' ? { r: 0.3, m: 0.7 } : undefined), null, g, false); ring.rotation.x = Math.PI / 2; ring.position.y = 0.013;
      break;
    }
    case 'squeaky': {
      const bm = m('#7ec8f2', { r: 0.4 });
      const c = mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.12, 14), bm, null, g); c.rotation.z = Math.PI / 2;
      for (const s of [-1, 1]) for (const t of [-1, 1]) mesh(new THREE.SphereGeometry(0.032, 14, 10), bm, null, g).position.set(s * 0.065, 0, t * 0.024);
      break;
    }
    case 'duck': {
      const y = m('#ffd84a', { r: 0.9 });
      const b = mesh(new THREE.SphereGeometry(0.065, 20, 14), y, null, g); b.scale.set(1, 0.8, 1.25);
      const h = mesh(new THREE.SphereGeometry(0.045, 18, 12), y, null, g); h.position.set(0, 0.06, 0.05);
      const beak = mesh(new THREE.SphereGeometry(0.025, 12, 8), m('#ff8a3c'), null, h); beak.scale.set(1.2, 0.5, 1.2); beak.position.set(0, -0.005, 0.04);
      for (const s of [-1, 1]) mesh(new THREE.SphereGeometry(0.008, 8, 6), m('#222', { r: 0.2 }), null, h).position.set(s * 0.022, 0.012, 0.036);
      const tl = mesh(new THREE.ConeGeometry(0.025, 0.04, 10), y, null, g); tl.position.set(0, 0.03, -0.08); tl.rotation.x = -1.0;
      break;
    }
    case 'rope': {
      const pts = [[-0.12, 0, 0], [-0.06, 0.005, 0.02], [0, 0, 0], [0.06, -0.005, -0.02], [0.12, 0, 0]];
      const { geo } = taperTube(pts, 0.018, 0.018, 40, 10, (c, t, n, v) => c.set(Math.floor(t * 14 + Math.atan2(n.y, n.z) * 0.6) % 2 ? '#e2574c' : '#fff4e0'));
      mesh(geo, M.mat('#fff', { vc: true, r: 0.95 }), null, g);
      for (const s of [-1, 1]) mesh(new THREE.SphereGeometry(0.035, 14, 10), m('#4aa6e0', { r: 0.95 }), null, g).position.set(s * 0.13, 0, 0);
      break;
    }
    case 'ring': { const t = mesh(new THREE.TorusGeometry(0.07, 0.024, 14, 30), m('#e2574c', { r: 0.4 }), null, g); t.rotation.x = Math.PI / 2; break; }
    case 'carrot': {
      const c = mesh(new THREE.ConeGeometry(0.035, 0.15, 16), m('#ff8a3c', { r: 0.8 }), null, g); c.rotation.z = Math.PI / 2;
      for (let i = 0; i < 3; i++) { const l = mesh(new THREE.ConeGeometry(0.012, 0.06, 6), m('#6aa84f'), null, g); l.position.set(0.09, 0, (i - 1) * 0.012); l.rotation.z = -Math.PI / 2 + (i - 1) * 0.4; }
      break;
    }
    case 'mouse': {
      const gm = m('#9aa2ac', { r: 1 });
      const b = mesh(new THREE.SphereGeometry(0.04, 16, 12), gm, null, g); b.scale.set(0.8, 0.7, 1.3);
      for (const s of [-1, 1]) mesh(new THREE.SphereGeometry(0.016, 10, 8), m('#f2b4b4'), null, g).position.set(s * 0.02, 0.025, 0.035);
      const { geo } = taperTube([[0, 0, -0.05], [0.02, 0, -0.09], [-0.01, 0, -0.13]], 0.005, 0.003, 10, 5, (c) => c.set('#f2b4b4'));
      mesh(geo, M.mat('#fff', { vc: true }), null, g);
      break;
    }
    case 'kibble': case 'premium': {
      const bag = mesh(new THREE.BoxGeometry(0.16, 0.22, 0.07), m(id === 'kibble' ? '#c87a3a' : '#f2c24b', { r: 0.7 }), null, g); bag.position.y = 0.11;
      const label = mesh(new THREE.PlaneGeometry(0.11, 0.09), M.mat('#fff', { map: G.textTex(id === 'kibble' ? 'KIBBLE' : 'DELUXE', { font: '700 40px Fredoka, sans-serif', bg: '#fff7ea', color: '#c8622a', pad: 12 }) }), null, g, false); label.position.set(0, 0.12, 0.0355);
      const top = mesh(new THREE.BoxGeometry(0.16, 0.03, 0.04), m(id === 'kibble' ? '#a85f28' : '#d9a52f'), null, g); top.position.y = 0.23;
      break;
    }
    case 'catfood': {
      mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.05, 24), m('#c9d2dc', { r: 0.3, m: 0.7 }), null, g).position.y = 0.025;
      mesh(new THREE.CylinderGeometry(0.061, 0.061, 0.032, 24, 1, true), m('#4aa6e0'), null, g).position.y = 0.025;
      break;
    }
    case 'biscuit': {
      const bm = m('#d9a35a', { r: 0.9 });
      const c = mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.09, 12), bm, null, g); c.rotation.z = Math.PI / 2;
      for (const s of [-1, 1]) for (const t of [-1, 1]) mesh(new THREE.SphereGeometry(0.024, 12, 8), bm, null, g).position.set(s * 0.048, 0, t * 0.017);
      break;
    }
    case 'jerky': {
      for (let i = 0; i < 2; i++) { const j = mesh(new THREE.BoxGeometry(0.12, 0.015, 0.03), m(i ? '#8a3f22' : '#a5512b', { r: 0.6 }), null, g); j.position.set(0, i * 0.016, i * 0.02 - 0.01); j.rotation.set(0, i * 0.4 - 0.2, 0.15); }
      break;
    }
    case 'salmon': {
      const s = mesh(new THREE.BoxGeometry(0.1, 0.045, 0.06), m('#ff9e80', { r: 0.6 }), null, g); s.rotation.y = 0.3;
      for (let i = 0; i < 3; i++) { const l = mesh(new THREE.BoxGeometry(0.004, 0.047, 0.062), m('#ffe0d0'), null, s, false); l.position.x = -0.03 + i * 0.03; }
      break;
    }
    case 'potato': {
      const p = mesh(new THREE.SphereGeometry(0.045, 18, 12), m('#9a3f4a', { r: 0.8 }), null, g); p.scale.set(1.7, 0.9, 0.95);
      const cut = mesh(new THREE.CircleGeometry(0.038, 18), m('#f2b14b'), null, g); cut.position.x = 0.075; cut.rotation.y = Math.PI / 2;
      break;
    }
    case 'cake': {
      mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.05, 28), m('#f6d2a6'), null, g).position.y = 0.025;
      mesh(new THREE.CylinderGeometry(0.077, 0.077, 0.02, 28), m('#fff4f6'), null, g).position.y = 0.06;
      mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.035, 28), m('#f6d2a6'), null, g).position.y = 0.087;
      mesh(new THREE.CylinderGeometry(0.062, 0.062, 0.015, 28), m('#f39bb0'), null, g).position.y = 0.11;
      const st = mesh(new THREE.SphereGeometry(0.02, 12, 10), m('#e2574c', { r: 0.4 }), null, g); st.position.y = 0.13; st.scale.y = 1.2;
      break;
    }
    case 'shampoo': {
      mesh(new THREE.CylinderGeometry(0.04, 0.045, 0.14, 18), m('#f39bb0', { r: 0.3 }), null, g).position.y = 0.07;
      mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.03, 12), m('#fff7ea'), null, g).position.y = 0.155;
      mesh(new THREE.CylinderGeometry(0.0455, 0.0455, 0.05, 18, 1, true), m('#fff7ea'), null, g).position.y = 0.07;
      break;
    }
    case 'brush': {
      const h = mesh(new THREE.BoxGeometry(0.03, 0.02, 0.14), m('#c8622a'), null, g); h.position.z = -0.06;
      const hd = mesh(new THREE.BoxGeometry(0.09, 0.025, 0.08), m('#4aa6e0'), null, g); hd.position.z = 0.04;
      const br = mesh(new THREE.BoxGeometry(0.08, 0.02, 0.07), m('#e8e8e8', { r: 1 }), null, g); br.position.set(0, -0.02, 0.04);
      break;
    }
    // café menu
    case 'latte': case 'matcha': {
      mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.008, 24), m('#fff7ea'), null, g).position.y = 0.004;
      mesh(new THREE.CylinderGeometry(0.048, 0.038, 0.07, 22), m('#fff7ea', { r: 0.3 }), null, g).position.y = 0.043;
      const top = mesh(new THREE.CircleGeometry(0.044, 22), m(id === 'latte' ? '#c9935a' : '#8fbf5a'), null, g); top.rotation.x = -Math.PI / 2; top.position.y = 0.074;
      const art = mesh(new THREE.CircleGeometry(0.018, 16), m('#fff7ea'), null, g, false); art.rotation.x = -Math.PI / 2; art.position.y = 0.075;
      const h = mesh(new THREE.TorusGeometry(0.018, 0.006, 6, 12), m('#fff7ea'), null, g); h.position.set(0.052, 0.045, 0);
      break;
    }
    case 'soda': {
      mesh(new THREE.CylinderGeometry(0.04, 0.032, 0.13, 20), M.mat('#9fe08a', { r: 0.1, op: 0.75 }), null, g).position.y = 0.065;
      mesh(new THREE.SphereGeometry(0.038, 16, 12), m('#fff7ea', { r: 0.9 }), null, g).position.y = 0.13;
      mesh(new THREE.SphereGeometry(0.012, 10, 8), m('#e2574c', { r: 0.3 }), null, g).position.set(0.01, 0.17, 0);
      const straw = mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.12, 6), m('#ffffff'), null, g); straw.position.set(-0.02, 0.15, 0); straw.rotation.z = 0.25;
      break;
    }
    case 'shortcake': {
      const w = mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.07, 3, 1, false, 0, Math.PI / 2.5), m('#fff4ea'), null, g); w.position.y = 0.035;
      mesh(new THREE.SphereGeometry(0.016, 10, 8), m('#e2574c', { r: 0.4 }), null, g).position.set(0.02, 0.08, 0.02);
      mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.006, 24), m('#ffffff'), null, g).position.y = 0.002;
      break;
    }
    case 'pupcup': {
      mesh(new THREE.CylinderGeometry(0.035, 0.028, 0.05, 18), m('#f39bb0'), null, g).position.y = 0.025;
      const c = mesh(new THREE.ConeGeometry(0.035, 0.05, 18), m('#fffaf2', { r: 1 }), null, g); c.position.y = 0.072;
      break;
    }
    case 'cookie': { const c = mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.014, 22), m('#c98a4b', { r: 1 }), null, g); c.position.y = 0.007; for (let i = 0; i < 5; i++) mesh(new THREE.SphereGeometry(0.007, 6, 6), m('#5a3a22'), null, g, false).position.set(U.rand(-0.03, 0.03), 0.015, U.rand(-0.03, 0.03)); break; }
    case 'salmonbowl': {
      const pts = [new THREE.Vector2(0.0, 0), new THREE.Vector2(0.05, 0), new THREE.Vector2(0.07, 0.04), new THREE.Vector2(0.065, 0.042), new THREE.Vector2(0.046, 0.006), new THREE.Vector2(0, 0.006)];
      mesh(new THREE.LatheGeometry(pts, 24), m('#4aa6e0', { side: THREE.DoubleSide }), null, g);
      mesh(new THREE.SphereGeometry(0.058, 18, 8, 0, Math.PI * 2, 0, Math.PI / 2), m('#fff7ea', { r: 1 }), null, g).position.y = 0.02;
      mesh(new THREE.BoxGeometry(0.05, 0.015, 0.03), m('#ff9e80'), null, g).position.set(0, 0.05, 0);
      break;
    }
    case 'chicken': {
      const y = m('#f6d23a', { r: 0.5 });
      const b = mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.16, 14), y, null, g); b.rotation.x = Math.PI / 2;
      const h = mesh(new THREE.SphereGeometry(0.035, 14, 10), y, null, g); h.position.set(0, 0.03, 0.09);
      const beak = mesh(new THREE.ConeGeometry(0.014, 0.04, 8), m('#ff8a3c'), null, h); beak.rotation.x = Math.PI / 2; beak.position.z = 0.04;
      const comb = mesh(new THREE.SphereGeometry(0.016, 8, 6), m('#e2574c'), null, h); comb.scale.set(0.5, 1.2, 1.4); comb.position.y = 0.035;
      for (const s of [-1, 1]) { mesh(new THREE.SphereGeometry(0.006, 6, 6), m('#111', { r: 0.2 }), null, h).position.set(s * 0.02, 0.01, 0.028); const f = mesh(new THREE.ConeGeometry(0.012, 0.05, 6), m('#ff8a3c'), null, g); f.position.set(s * 0.018, -0.02, -0.09); f.rotation.x = -1.8; }
      break;
    }
    case 'glowball': {
      const gb = mesh(new THREE.SphereGeometry(0.06, 24, 18), M.mat('#9dffb0', { r: 0.4, em: '#3dff7a', ei: 1.2 }), null, g);
      const halo = mesh(new THREE.SphereGeometry(0.09, 16, 12), M.basic('#7dffa0', { op: 0.25, dw: false }), null, g, false);
      break;
    }
    default: mesh(new THREE.SphereGeometry(0.05, 12, 10), m('#ccc'), null, g);
  }
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return g;
};

/* =========================================================
   People (chibi)
   ========================================================= */
M.person = function (look) {
  const L = typeof look === 'string' ? G.LOOKS[look] : look;
  const root = new THREE.Group(); const rig = new THREE.Group(); rig.scale.setScalar(L.h || 1); root.add(rig);
  const P = { root, rig, L };
  const skin = M.mat(L.skin, { r: 0.7 }), top = M.mat(L.top, { r: 0.85 }), bot = M.mat(L.bottom, { r: 0.85 }), hair = M.mat(L.hair, { r: 0.75 });
  const shoe = M.mat('#4a3a32', { r: 0.6 });
  P.legs = [];
  for (const s of [-1, 1]) {
    const hip = new THREE.Group(); hip.position.set(s * 0.075, 0.3, 0); rig.add(hip);
    const lg = new THREE.CapsuleGeometry(0.06, 0.18, 6, 12); lg.translate(0, -0.14, 0);
    mesh(lg, bot, null, hip);
    const sh = mesh(new THREE.SphereGeometry(0.068, 14, 10), shoe, null, hip); sh.scale.set(1, 0.65, 1.35); sh.position.set(0, -0.27, 0.025);
    P.legs.push(hip);
  }
  const torso = new THREE.Group(); torso.position.y = 0.3; rig.add(torso); P.torso = torso;
  const pts = [[0, 0], [0.16, 0.0], [0.19, 0.08], [0.18, 0.22], [0.14, 0.36], [0.07, 0.42], [0, 0.43]].map((p) => new THREE.Vector2(p[0], p[1]));
  mesh(new THREE.LatheGeometry(pts, 28), top, 'person', torso);
  if (L.extra && L.extra.includes('apron')) { const ap = mesh(new THREE.CylinderGeometry(0.192, 0.165, 0.3, 24, 1, true, -0.9, 1.8), M.mat('#7a5c46', { r: 0.9, side: THREE.DoubleSide }), null, torso); ap.position.y = 0.13; }
  P.arms = [];
  for (const s of [-1, 1]) {
    const sh = new THREE.Group(); sh.position.set(s * 0.17, 0.36, 0); torso.add(sh);
    const ag = new THREE.CapsuleGeometry(0.045, 0.2, 6, 10); ag.translate(0, -0.13, 0);
    const arm = mesh(ag, top, null, sh); sh.rotation.z = s * 0.18;
    const hand = mesh(new THREE.SphereGeometry(0.05, 12, 10), skin, null, sh); hand.position.y = -0.27;
    P.arms.push(sh);
  }
  const head = new THREE.Group(); head.position.y = 0.66; rig.add(head); P.head = head;
  const hm = mesh(new THREE.SphereGeometry(0.24, 32, 24), skin, 'person', head); hm.position.y = 0.2; hm.scale.set(1.05, 1, 1);
  const face = new THREE.Group(); face.position.y = 0.2; head.add(face); P.face = face;
  const eyeM = M.mat('#231a16', { r: 0.2 });
  P.eyes = [];
  for (const s of [-1, 1]) {
    const e = mesh(new THREE.SphereGeometry(0.03, 14, 10), eyeM, null, face, false); e.position.set(s * 0.085, 0.0, 0.215); e.scale.set(0.85, 1.15, 0.5);
    const hi = mesh(new THREE.SphereGeometry(0.01, 8, 6), M.basic(0xffffff), null, e, false); hi.position.set(0.01, 0.012, 0.02);
    const bl = mesh(new THREE.CircleGeometry(0.035, 16), M.basic('#ff9aa8', { op: 0.45, dw: false }), null, face, false); bl.position.set(s * 0.135, -0.055, 0.195); bl.rotation.y = s * 0.55;
    P.eyes.push(e);
  }
  const mouth = mesh(new THREE.TorusGeometry(0.03, 0.007, 6, 14, Math.PI), M.mat('#7a3a2a'), null, face, false); mouth.rotation.z = Math.PI; mouth.position.set(0, -0.07, 0.225); P.mouth = mouth;
  // hair
  const style = L.style;
  if (style !== 'bald') {
    const cap = mesh(new THREE.SphereGeometry(0.258, 30, 20, 0, Math.PI * 2, 0, Math.PI * 0.52), hair, null, face); cap.rotation.x = -0.32; cap.scale.set(1.06, 1.02, 1.03); cap.position.y = 0.01;
    const fr = mesh(new THREE.SphereGeometry(0.12, 16, 10), hair, null, face); fr.scale.set(1.6, 0.5, 0.8); fr.position.set(0.02, 0.14, 0.17);
    if (style === 'bob') { for (const s of [-1, 1]) { const sd = mesh(new THREE.SphereGeometry(0.13, 16, 12), hair, null, face); sd.scale.set(0.6, 1.25, 1); sd.position.set(s * 0.19, -0.05, -0.02); } const bk = mesh(new THREE.SphereGeometry(0.24, 20, 14), hair, null, face); bk.scale.set(1.05, 1.05, 0.8); bk.position.set(0, -0.03, -0.08); }
    if (style === 'pony') { const p = mesh(new THREE.CapsuleGeometry(0.06, 0.2, 6, 10), hair, null, face); p.position.set(0, -0.02, -0.27); p.rotation.x = 0.5; mesh(new THREE.SphereGeometry(0.05, 10, 8), M.mat('#e2574c'), null, face).position.set(0, 0.08, -0.25); }
    if (style === 'bun') { mesh(new THREE.SphereGeometry(0.1, 16, 12), hair, null, face).position.set(0, 0.24, -0.1); }
    if (style === 'messy') { for (let i = 0; i < 6; i++) { const sp = mesh(new THREE.ConeGeometry(0.05, 0.12, 8), hair, null, face); const a = i / 6 * Math.PI * 2; sp.position.set(Math.cos(a) * 0.12, 0.2, Math.sin(a) * 0.1 - 0.02); sp.rotation.set(Math.sin(a) * 0.6, 0, -Math.cos(a) * 0.6); } }
  } else {
    const ring = mesh(new THREE.TorusGeometry(0.2, 0.05, 8, 24, Math.PI * 1.2), hair, null, face); ring.rotation.set(Math.PI / 2, 0, Math.PI * 0.9 + 0.65); ring.position.y = -0.0;
  }
  const ex = L.extra || [];
  if (ex.includes('mustache')) for (const s of [-1, 1]) { const mm = mesh(new THREE.SphereGeometry(0.04, 12, 8), hair, null, face); mm.scale.set(1.4, 0.55, 0.6); mm.position.set(s * 0.04, -0.04, 0.22); mm.rotation.z = s * -0.3; }
  if (ex.includes('cap')) { const c = mesh(new THREE.SphereGeometry(0.262, 24, 12, 0, Math.PI * 2, 0, Math.PI * 0.45), M.mat(L.top === '#d9534f' ? '#33415c' : '#e2574c'), null, face); c.position.y = 0.03; c.rotation.x = -0.2; const br = mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.015, 20, 1, false, -Math.PI / 2, Math.PI), c.material, null, face); br.position.set(0, 0.1, 0.18); br.rotation.x = 0.15; }
  if (ex.includes('beret')) { const b = mesh(new THREE.SphereGeometry(0.2, 20, 10), M.mat('#e2574c'), null, face); b.scale.set(1.2, 0.35, 1.2); b.position.set(0.05, 0.23, -0.02); b.rotation.z = -0.25; }
  if (ex.includes('band')) { const b = mesh(new THREE.TorusGeometry(0.245, 0.02, 6, 30), M.mat('#ffffff'), null, face); b.rotation.x = Math.PI / 2 - 0.3; b.position.y = 0.08; }
  if (ex.includes('glasses')) for (const s of [-1, 1]) { const gl = mesh(new THREE.TorusGeometry(0.048, 0.007, 6, 20), M.mat('#3b2a1f'), null, face, false); gl.position.set(s * 0.085, 0.0, 0.23); }
  if (ex.includes('guitar')) { const gt = new THREE.Group(); gt.position.set(0, 0.17, 0.2); gt.rotation.set(0, 0, -0.9); torso.add(gt); const gb = mesh(new THREE.SphereGeometry(0.1, 16, 12), M.mat('#c8622a', { r: 0.4 }), null, gt); gb.scale.set(1, 1.25, 0.4); mesh(new THREE.BoxGeometry(0.03, 0.32, 0.02), M.mat('#5a3a22'), null, gt).position.y = 0.25; mesh(new THREE.CircleGeometry(0.03, 12), M.mat('#3b2a1f'), null, gt, false).position.set(0, 0.02, 0.041); P.guitar = gt; }
  if (ex.includes('bag')) { const bg = mesh(new THREE.BoxGeometry(0.18, 0.16, 0.08), M.mat('#c8622a'), null, torso); bg.position.set(0.2, 0.08, 0.02); const st = mesh(new THREE.TorusGeometry(0.22, 0.01, 4, 24), M.mat('#7a4a24'), null, torso); st.position.set(0.0, 0.24, 0); st.rotation.set(0, 0.3, 0.7); }
  root.traverse((o) => { if (o.isMesh) o.userData.root = root; });
  return P;
};

/* =========================================================
   Scenery
   ========================================================= */
M.tree = function (season, kind = 'round', rnd = Math.random) {
  const g = new THREE.Group();
  const trunk = mesh(new THREE.CylinderGeometry(0.12, 0.2, 1.6, 10), M.mat('#7a5236', { r: 0.95 }), null, g); trunk.position.y = 0.8;
  trunk.receiveShadow = true;
  const pal = {
    spring: ['#f6b9cf', '#f9cadb', '#f3a5c0', '#fbd9e5'], summer: ['#6fb04f', '#5e9e44', '#82c060', '#77b85a'],
    autumn: ['#e8823a', '#d9592f', '#f2b04b', '#c94a2a'], winter: ['#eef3f7', '#dfe8ef', '#ffffff', '#e6eef4'],
  }[season];
  if (kind === 'pine') {
    for (let i = 0; i < 3; i++) { const c = mesh(new THREE.ConeGeometry(1.1 - i * 0.28, 1.2, 10), M.mat(season === 'winter' ? '#d8e4ea' : '#3f7a4a', { r: 0.9 }), null, g); c.position.y = 1.4 + i * 0.7; }
  } else {
    const n = 5 + Math.floor(rnd() * 3);
    for (let i = 0; i < n; i++) {
      const r = 0.55 + rnd() * 0.45; const a = rnd() * Math.PI * 2, d = i === 0 ? 0 : 0.45 + rnd() * 0.35;
      const f = mesh(new THREE.IcosahedronGeometry(r, 2), M.mat(pal[Math.floor(rnd() * pal.length)], { r: 0.95, flat: false }), null, g);
      f.position.set(Math.cos(a) * d, 2.0 + rnd() * 0.7 + (i === 0 ? 0.3 : 0), Math.sin(a) * d);
    }
  }
  g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return g;
};
M.bench = function () {
  const g = new THREE.Group(); const wood = M.mat('#b9773f', { r: 0.85 }), iron = M.mat('#3a3433', { r: 0.5, m: 0.4 });
  for (let i = 0; i < 3; i++) { const s = mesh(new THREE.BoxGeometry(1.6, 0.05, 0.13), wood, null, g); s.position.set(0, 0.45, -0.16 + i * 0.16); }
  for (let i = 0; i < 2; i++) { const s = mesh(new THREE.BoxGeometry(1.6, 0.12, 0.04), wood, null, g); s.position.set(0, 0.62 + i * 0.16, -0.27); s.rotation.x = -0.15; }
  for (const x of [-0.7, 0.7]) { const l = mesh(new THREE.BoxGeometry(0.06, 0.45, 0.5), iron, null, g); l.position.set(x, 0.225, -0.05); const b = mesh(new THREE.BoxGeometry(0.06, 0.5, 0.06), iron, null, g); b.position.set(x, 0.6, -0.28); }
  g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return g;
};
M.lamp = function () {
  const g = new THREE.Group(); const iron = M.mat('#33302f', { r: 0.5, m: 0.5 });
  mesh(new THREE.CylinderGeometry(0.05, 0.08, 2.6, 10), iron, null, g).position.y = 1.3;
  const head = mesh(new THREE.CylinderGeometry(0.12, 0.2, 0.25, 8), iron, null, g); head.position.y = 2.75;
  const bulb = mesh(new THREE.SphereGeometry(0.13, 14, 10), M.mat('#fff2c4', { em: '#ffd98a', ei: 0.2 }), null, g, false); bulb.position.y = 2.58; g.userData.bulb = bulb;
  return g;
};
M.flowers = function (n, rad, rnd = Math.random) {
  const g = new THREE.Group();
  const cols = ['#f39bb0', '#fff4e0', '#f2c24b', '#c39bf3', '#e2574c', '#7ec8f2'];
  const stemM = M.mat('#5e9e44');
  for (let i = 0; i < n; i++) {
    const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd()) * rad;
    const f = new THREE.Group(); f.position.set(Math.cos(a) * d, 0, Math.sin(a) * d); g.add(f);
    const h = 0.12 + rnd() * 0.12;
    mesh(new THREE.CylinderGeometry(0.008, 0.008, h, 4), stemM, null, f, false).position.y = h / 2;
    const c = mesh(new THREE.SphereGeometry(0.035, 8, 6), M.mat(cols[Math.floor(rnd() * cols.length)], { r: 0.8 }), null, f, false); c.position.y = h; c.scale.y = 0.6;
  }
  return g;
};
M.bush = function (col = '#5e9e44', s = 1) {
  const g = new THREE.Group();
  for (let i = 0; i < 4; i++) { const b = mesh(new THREE.IcosahedronGeometry(0.35 * s, 1), M.mat(col, { r: 0.95 }), null, g); b.position.set(U.rand(-0.35, 0.35) * s, 0.25 * s, U.rand(-0.2, 0.2) * s); }
  g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return g;
};
M.fence = function (len, col = '#fff7ea') {
  const g = new THREE.Group(); const m = M.mat(col, { r: 0.8 });
  const n = Math.max(2, Math.round(len / 0.5));
  for (let i = 0; i <= n; i++) { const p = mesh(new THREE.BoxGeometry(0.08, 0.6, 0.06), m, null, g); p.position.set(-len / 2 + (i / n) * len, 0.3, 0); const tp = mesh(new THREE.ConeGeometry(0.057, 0.08, 4), m, null, g); tp.position.set(p.position.x, 0.64, 0); tp.rotation.y = Math.PI / 4; }
  for (const y of [0.2, 0.45]) { const r = mesh(new THREE.BoxGeometry(len, 0.06, 0.03), m, null, g); r.position.set(0, y, -0.04); }
  g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return g;
};
const _texCache = {};
function wallTex(kind, col) {
  const key = kind + col; if (_texCache[key]) return _texCache[key];
  const base = new THREE.Color(col);
  const t = G.canvasTex(256, 256, (g) => {
    g.fillStyle = col; g.fillRect(0, 0, 256, 256);
    const shade = (k) => base.clone().offsetHSL(0, 0, k).getStyle();
    if (kind === 'siding') { for (let y = 0; y < 256; y += 16) { g.fillStyle = shade(-0.06); g.fillRect(0, y + 13, 256, 3); g.fillStyle = shade(0.03); g.fillRect(0, y, 256, 2); } }
    else if (kind === 'brick') { g.fillStyle = '#e8ddd0'; g.fillRect(0, 0, 256, 256); for (let y = 0; y < 256; y += 21) for (let x = -((y / 21) % 2) * 24; x < 256; x += 48) { g.fillStyle = shade(U.rand(-0.07, 0.05)); g.fillRect(x + 2, y + 2, 44, 17); } }
    else if (kind === 'boards') { for (let x = 0; x < 256; x += 22) { g.fillStyle = shade(U.rand(-0.05, 0.04)); g.fillRect(x, 0, 20, 256); g.fillStyle = shade(-0.12); g.fillRect(x + 20, 0, 2, 256); } }
    else if (kind === 'shingle') { for (let y = 0; y < 256; y += 18) for (let x = -((y / 18) % 2) * 10; x < 256; x += 20) { g.fillStyle = shade(U.rand(-0.06, 0.04)); g.beginPath(); g.moveTo(x, y); g.lineTo(x + 19, y); g.lineTo(x + 19, y + 14); g.quadraticCurveTo(x + 10, y + 19, x, y + 14); g.fill(); } }
    else { for (let i = 0; i < 900; i++) { g.fillStyle = shade(U.rand(-0.04, 0.04)); g.fillRect(Math.random() * 256, Math.random() * 256, 3, 3); } }
  }, { repeat: [1, 1] });
  t.wrapS = t.wrapT = THREE.RepeatWrapping; return (_texCache[key] = t);
}
function tileTex(col, jp) {
  const key = 'tile' + col + jp; if (_texCache[key]) return _texCache[key];
  const base = new THREE.Color(col);
  const t = G.canvasTex(256, 256, (g) => {
    g.fillStyle = base.clone().offsetHSL(0, 0, -0.12).getStyle(); g.fillRect(0, 0, 256, 256);
    for (let y = 0; y < 256; y += 24) for (let x = -((y / 24) % 2) * 16; x < 256; x += 32) {
      const c = base.clone().offsetHSL(0, U.rand(-0.03, 0.03), U.rand(-0.06, 0.05)).getStyle();
      g.fillStyle = c; g.beginPath();
      if (jp) { g.ellipse(x + 16, y + 12, 15, 13, 0, 0, Math.PI * 2); } else { g.moveTo(x + 1, y); g.lineTo(x + 31, y); g.lineTo(x + 31, y + 16); g.quadraticCurveTo(x + 16, y + 26, x + 1, y + 16); }
      g.fill(); g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(x + 4, y + 2, 22, 3);
    }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping; return (_texCache[key] = t);
}
M.house = function (o = {}) {
  const g = new THREE.Group();
  const rnd = o.rnd || Math.random;
  const w = o.w || 4, d = o.d || 3.5, stories = o.stories || 1, h = (o.h || 2.6) * (stories === 2 ? 1.75 : 1);
  const style = o.style || 'gable', wallKind = o.wallKind || 'plaster';
  const trimCol = o.trim || '#fff7ea';
  const wt = wallTex(wallKind, o.wall || '#fff2dc').clone(); wt.needsUpdate = true; wt.repeat.set(w / 2.2, h / 2.2);
  const wall = new THREE.MeshStandardMaterial({ map: wt, roughness: 0.92 });
  const roofCol = o.roof || '#c8622a';
  const tiles = tileTex(roofCol, style === 'japanese');
  const roofMat = (rw, rl) => { const t = tiles.clone(); t.needsUpdate = true; t.repeat.set(rw / 1.4, rl / 1.0); return new THREE.MeshStandardMaterial({ map: t, roughness: 0.75 }); };
  const trim = M.mat(trimCol, { r: 0.7 }), dark = M.mat('#5a3a26', { r: 0.7 });
  const add = (geo, mat, x, y, z, rx = 0, ry = 0, rz = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.set(rx, ry, rz); m.castShadow = true; m.receiveShadow = true; g.add(m); return m; };
  // foundation + body
  add(new THREE.BoxGeometry(w + 0.16, 0.3, d + 0.16), M.mat('#9a948a', { r: 0.95 }), 0, 0.15, 0);
  add(new THREE.BoxGeometry(w, h, d), wall, 0, h / 2 + 0.25, 0);
  const top = h + 0.25;
  if (stories === 2) add(new THREE.BoxGeometry(w + 0.08, 0.12, d + 0.08), trim, 0, top * 0.53, 0);
  // corner trims
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(new THREE.BoxGeometry(0.12, h, 0.12), trim, sx * (w / 2), h / 2 + 0.25, sz * (d / 2));
  // roof
  const ov = o.overhang ?? (style === 'japanese' ? 0.55 : 0.32); const rh = o.roofH || (style === 'flat' ? 0 : style === 'japanese' ? d * 0.42 : d * 0.5);
  if (style === 'gable' || style === 'japanese' || style === 'saltbox') {
    const shape = new THREE.Shape(); const peakZ = style === 'saltbox' ? -d * 0.18 : 0;
    shape.moveTo(-d / 2, 0); shape.lineTo(d / 2, 0); shape.lineTo(peakZ, rh); shape.lineTo(-d / 2, 0);
    const tri = new THREE.ExtrudeGeometry(shape, { depth: w, bevelEnabled: false }); tri.rotateY(Math.PI / 2); tri.translate(-w / 2, 0, 0);
    const gm = add(tri, wall, 0, top, 0); gm.material = wall;
    for (const side of [-1, 1]) {
      const run = side > 0 ? d / 2 - peakZ : d / 2 + peakZ; const len = Math.hypot(run + ov, rh + ov * rh / run);
      const ang = Math.atan2(rh, run);
      const slab = add(new THREE.BoxGeometry(w + ov * 2, 0.12, len), roofMat(w + ov * 2, len), 0, 0, 0);
      slab.rotation.x = side * ang; slab.position.set(0, top + rh / 2 - Math.sin(ang) * ov / 2 + 0.05, peakZ + side * (run / 2 + ov / 2) * 1.0);
      if (style === 'japanese') { const lip = add(new THREE.BoxGeometry(w + ov * 2 + 0.1, 0.1, 0.25), M.mat('#2a2a33', { r: 0.6 }), 0, top - ov * Math.tan(ang) + 0.04, side * (d / 2 + ov)); lip.rotation.x = -side * 0.35; }
    }
    add(new THREE.BoxGeometry(w + ov * 2 + 0.05, 0.12, 0.2), M.mat(new THREE.Color(roofCol).offsetHSL(0, 0, -0.15).getStyle(), { r: 0.6 }), 0, top + rh + 0.06, peakZ);
    if (style === 'japanese') for (const sx of [-1, 1]) { const cap = add(new THREE.BoxGeometry(0.22, 0.32, 0.26), M.mat('#2a2a33'), sx * (w / 2 + ov), top + rh + 0.15, peakZ); cap.rotation.z = sx * 0.2; }
    if (o.roundWin || rnd() < 0.4) { const rw = add(new THREE.CircleGeometry(0.22, 20), M.mat('#bfe4ff', { r: 0.2, em: '#ffd98a', ei: 0 }), 0, top + rh * 0.42, d / 2 + 0.01); rw.userData.win = true; const rr = add(new THREE.TorusGeometry(0.23, 0.04, 6, 20), trim, 0, top + rh * 0.42, d / 2 + 0.02); void rr; }
  } else if (style === 'hip') {
    const cone = new THREE.ConeGeometry(1, rh, 4, 1); cone.rotateY(Math.PI / 4); cone.scale((w / 2 + ov) * Math.SQRT2, 1, (d / 2 + ov) * Math.SQRT2);
    const rm = add(cone, roofMat(w, d), 0, top + rh / 2, 0); void rm;
    add(new THREE.BoxGeometry(w + ov * 2, 0.08, d + ov * 2), M.mat(new THREE.Color(roofCol).offsetHSL(0, 0, -0.15).getStyle()), 0, top + 0.02, 0);
  } else {
    add(new THREE.BoxGeometry(w + 0.2, 0.3, 0.16), trim, 0, top + 0.1, d / 2 + 0.02); add(new THREE.BoxGeometry(w + 0.2, 0.3, 0.16), trim, 0, top + 0.1, -d / 2 - 0.02);
    add(new THREE.BoxGeometry(0.16, 0.3, d + 0.2), trim, w / 2 + 0.02, top + 0.1, 0); add(new THREE.BoxGeometry(0.16, 0.3, d + 0.2), trim, -w / 2 - 0.02, top + 0.1, 0);
    add(new THREE.BoxGeometry(0.7, 0.45, 0.5), M.mat('#c9d2dc', { m: 0.5, r: 0.4 }), w * 0.2, top + 0.22, -d * 0.15);
    const tank = add(new THREE.CylinderGeometry(0.35, 0.35, 0.7, 14), M.mat('#9aa2ac', { m: 0.4, r: 0.5 }), -w * 0.25, top + 0.5, -d * 0.2); void tank;
  }
  // chimney
  if (o.chimney ?? (style !== 'flat' && rnd() < 0.55)) { const cx = w * (rnd() < 0.5 ? -0.28 : 0.28); add(new THREE.BoxGeometry(0.42, rh * 0.8 + 0.6, 0.42), M.mat(rnd() < 0.5 ? '#a8574a' : '#8a8580', { r: 0.9 }), cx, top + rh * 0.5 + 0.2, -d * 0.12); add(new THREE.BoxGeometry(0.52, 0.1, 0.52), M.mat('#5a5550'), cx, top + rh * 0.9 + 0.55, -d * 0.12); }
  // door, steps, porch, lanterns
  const doorX = o.doorX || 0;
  add(new THREE.BoxGeometry(1.05, 1.8, 0.1), trim, doorX, 1.15, d / 2 + 0.03);
  const door = add(new THREE.BoxGeometry(0.88, 1.68, 0.08), M.mat(o.door || '#8a5a3a', { r: 0.6 }), doorX, 1.1, d / 2 + 0.07);
  add(new THREE.SphereGeometry(0.045, 8, 6), M.mat('#f2c24b', { r: 0.3, m: 0.8 }), doorX + 0.3, 1.1, d / 2 + 0.13);
  if (o.doorWin !== false) add(new THREE.BoxGeometry(0.4, 0.3, 0.02), M.mat('#bfe4ff', { r: 0.2 }), doorX, 1.6, d / 2 + 0.12);
  add(new THREE.BoxGeometry(1.4, 0.12, 0.55), M.mat('#b5ada0'), doorX, 0.06, d / 2 + 0.38);
  if (o.porch ?? rnd() < 0.5) { const pr = add(new THREE.BoxGeometry(1.7, 0.08, 1.0), M.mat(roofCol, { r: 0.6 }), doorX, 2.3, d / 2 + 0.5); pr.rotation.x = 0.22; for (const sx of [-1, 1]) add(new THREE.CylinderGeometry(0.05, 0.05, 2.2, 8), trim, doorX + sx * 0.75, 1.15, d / 2 + 0.92); }
  for (const sx of [-1, 1]) { const ln = add(new THREE.BoxGeometry(0.14, 0.22, 0.14), M.mat('#fff2c4', { em: '#ffd98a', ei: 0.2 }), doorX + sx * 0.72, 1.7, d / 2 + 0.12); ln.userData.lamp = true; }
  if (o.number !== undefined) { const nt = G.textTex(String(o.number), { font: '700 56px Fredoka, sans-serif', bg: '#3b5ba8', color: '#fff', pad: 10, radius: 12 }); add(new THREE.PlaneGeometry(0.28, 0.22), M.mat('#fff', { map: nt }), doorX - 0.75, 1.3, d / 2 + 0.02); }
  // windows
  g.userData.windows = [];
  const winM = M.mat('#bfe4ff', { r: 0.2, em: '#ffd98a', ei: 0 });
  const shutCol = o.shutters || (rnd() < 0.6 ? U.pick(['#3f7a4a', '#3b5ba8', '#a8574a', '#5a3a26', '#7a5cff']) : null);
  const winPos = o.windows || (() => { const arr = [[-w / 3, 1.35], [w / 3, 1.35]]; if (stories === 2) arr.push([-w / 3, top * 0.72], [w / 3, top * 0.72], [0, top * 0.72]); return arr; })();
  for (const [x, y] of winPos) {
    add(new THREE.BoxGeometry(0.95, 0.85, 0.08), trim, x, y, d / 2 + 0.02);
    const gl = add(new THREE.PlaneGeometry(0.8, 0.7), winM, x, y, d / 2 + 0.065); gl.castShadow = false; g.userData.windows.push(gl);
    add(new THREE.BoxGeometry(0.04, 0.7, 0.03), trim, x, y, d / 2 + 0.07); add(new THREE.BoxGeometry(0.8, 0.04, 0.03), trim, x, y, d / 2 + 0.07);
    add(new THREE.BoxGeometry(1.05, 0.06, 0.18), trim, x, y - 0.46, d / 2 + 0.08);
    if (shutCol) for (const sx of [-1, 1]) { const sh = add(new THREE.BoxGeometry(0.32, 0.85, 0.05), M.mat(shutCol, { r: 0.7 }), x + sx * 0.66, y, d / 2 + 0.05); void sh; }
    if ((o.flowers ?? rnd() < 0.55) && y < 2) { add(new THREE.BoxGeometry(0.9, 0.18, 0.22), M.mat('#8a5a3a'), x, y - 0.58, d / 2 + 0.16); const cols = ['#e2574c', '#f39bb0', '#f2c24b', '#fff7ea', '#c39bf3']; for (let k = 0; k < 6; k++) add(new THREE.SphereGeometry(0.07, 8, 6), M.mat(U.pick(cols)), x - 0.35 + k * 0.14, y - 0.45, d / 2 + 0.17); }
  }
  // side windows
  for (const sx of [-1, 1]) { const gl = add(new THREE.PlaneGeometry(0.7, 0.6), winM, sx * (w / 2 + 0.01), 1.4, 0, 0, sx * Math.PI / 2); gl.castShadow = false; g.userData.windows.push(gl); add(new THREE.BoxGeometry(0.06, 0.76, 0.86), trim, sx * (w / 2 + 0.005), 1.4, 0); }
  // yard props
  if (o.fence ?? rnd() < 0.45) { for (const sx of [-1, 1]) { const f = M.fence(w / 2 - 0.6, rnd() < 0.5 ? '#fff7ea' : '#c8a07a'); f.position.set(sx * (w / 4 + 0.6), 0, d / 2 + 1.25); g.add(f); } }
  if (o.mailbox ?? rnd() < 0.6) { const mb = new THREE.Group(); mb.position.set(doorX + (w / 2 - 0.3) * (rnd() < 0.5 ? -1 : 1), 0, d / 2 + 1.5); const post = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.0, 0.08), M.mat('#5a3a26')); post.position.y = 0.5; mb.add(post); const box = new THREE.Mesh(new THREE.CapsuleGeometry(0.13, 0.28, 4, 10), M.mat(U.pick(['#e2574c', '#3b5ba8', '#79b25a', '#f2c24b']))); box.rotation.x = Math.PI / 2; box.position.y = 1.05; mb.add(box); const flag = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.18, 0.06), M.mat('#e2574c')); flag.position.set(0.14, 1.15, 0); mb.add(flag); mb.traverse((x) => { if (x.isMesh) x.castShadow = true; }); g.add(mb); }
  for (let i = 0; i < (o.pots ?? Math.floor(rnd() * 3)); i++) { const px = doorX + (i % 2 ? 0.95 : -0.95); const pot = add(new THREE.CylinderGeometry(0.17, 0.13, 0.3, 12), M.mat('#c8622a'), px, 0.15, d / 2 + 0.4); void pot; const bush = add(new THREE.IcosahedronGeometry(0.22, 1), M.mat('#5e9e44', { r: 0.9 }), px, 0.45, d / 2 + 0.4); void bush; }
  // sign + awning (shops)
  if (o.sign) {
    const tex = G.textTex(o.sign, { font: '700 72px Fredoka, sans-serif', bg: o.signBg || '#fff7ea', color: o.signCol || '#c8622a', border: o.signCol || '#c8622a', pad: 36 });
    const sw = Math.min(w * 0.75, 2.6), sh = sw * tex.userData.h / tex.userData.w;
    const s = new THREE.Mesh(new THREE.PlaneGeometry(sw, sh), M.mat('#fff', { map: tex, r: 0.8 })); s.position.set(0, top - 0.32, d / 2 + 0.12); g.add(s);
  }
  if (o.awning) {
    const aw = new THREE.CylinderGeometry(0.5, 0.5, w * 0.9, 16, 1, true, 0, Math.PI); aw.rotateZ(Math.PI / 2);
    const tex = G.canvasTex(64, 64, (c) => { for (let i = 0; i < 8; i++) { c.fillStyle = i % 2 ? '#fff7ea' : o.awning; c.fillRect(i * 8, 0, 8, 64); } }, { repeat: [6, 1] });
    const a = new THREE.Mesh(aw, M.mat('#fff', { map: tex, side: THREE.DoubleSide, r: 0.8 })); a.position.set(0, 2.25, d / 2 + 0.3); a.rotation.x = Math.PI * 0.95; a.scale.set(1, 1, 0.6); a.castShadow = true; g.add(a);
  }
  g.userData.winMat = winM;
  return g;
};
M.trophy = function (col) {
  const g = new THREE.Group(); const gm = M.mat(col, { r: 0.22, m: 0.85 });
  mesh(new THREE.BoxGeometry(0.16, 0.06, 0.16), M.mat('#5a3a22', { r: 0.6 }), null, g).position.y = 0.03;
  mesh(new THREE.CylinderGeometry(0.02, 0.03, 0.08, 12), gm, null, g).position.y = 0.1;
  const cup = mesh(new THREE.CylinderGeometry(0.075, 0.035, 0.1, 20, 1, true), M.mat(col, { r: 0.22, m: 0.85, side: THREE.DoubleSide }), null, g); cup.position.y = 0.19;
  for (const s of [-1, 1]) { const h = mesh(new THREE.TorusGeometry(0.028, 0.008, 6, 12, Math.PI * 1.2), gm, null, g); h.position.set(s * 0.08, 0.2, 0); h.rotation.z = s > 0 ? -1.2 : Math.PI + 1.2 - Math.PI * 0.2; }
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return g;
};
M.bowl = function (col) {
  const g = new THREE.Group();
  const pts = [new THREE.Vector2(0, 0), new THREE.Vector2(0.17, 0), new THREE.Vector2(0.2, 0.02), new THREE.Vector2(0.22, 0.09), new THREE.Vector2(0.2, 0.095), new THREE.Vector2(0.16, 0.025), new THREE.Vector2(0, 0.025)];
  const b = mesh(new THREE.LatheGeometry(pts, 36), M.mat(col, { r: 0.35, side: THREE.DoubleSide }), 'bowl', g); b.receiveShadow = true;
  return g;
};
M.gift = function (col = '#e2574c') {
  const g = new THREE.Group();
  mesh(new THREE.BoxGeometry(0.28, 0.22, 0.28), M.mat(col, { r: 0.5 }), null, g).position.y = 0.11;
  mesh(new THREE.BoxGeometry(0.3, 0.06, 0.3), M.mat(col, { r: 0.5 }), null, g).position.y = 0.24;
  const rib = M.mat('#f2c24b', { r: 0.4 });
  mesh(new THREE.BoxGeometry(0.05, 0.28, 0.3), rib, null, g).position.y = 0.135;
  mesh(new THREE.BoxGeometry(0.3, 0.28, 0.05), rib, null, g).position.y = 0.135;
  for (const s of [-1, 1]) { const l = mesh(new THREE.TorusGeometry(0.045, 0.014, 6, 14), rib, null, g); l.position.set(s * 0.04, 0.3, 0); l.rotation.y = s * 0.6; }
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return g;
};

/* =========================================================
   Icon renderer — real 3D thumbnails for the UI
   ========================================================= */
M.icons = (() => {
  const cache = {}; let scene, cam, rt;
  function init() {
    scene = new THREE.Scene();
    scene.add(new THREE.HemisphereLight(0xfff4e6, 0x8a7060, 0.9));
    const d = new THREE.DirectionalLight(0xffffff, 1.3); d.position.set(2, 4, 5); scene.add(d);
    const d2 = new THREE.DirectionalLight(0xffe0c0, 0.5); d2.position.set(-4, 1, -2); scene.add(d2);
    cam = new THREE.PerspectiveCamera(28, 1, 0.01, 100);
    rt = new THREE.WebGLRenderTarget(192, 192, { samples: 4 });
    rt.texture.encoding = THREE.sRGBEncoding;
  }
  function render(obj, key, o = {}) {
    if (cache[key]) return cache[key];
    if (!scene) init();
    const r = G.renderer;
    scene.add(obj); obj.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(obj); const sph = box.getBoundingSphere(new THREE.Sphere());
    const c = o.center || sph.center; const rad = o.radius || sph.radius;
    const dir = (o.dir || new V3(0.55, 0.6, 1)).clone().normalize();
    const dist = rad / Math.sin((cam.fov * Math.PI / 180) / 2) * (o.zoom || 1.02);
    cam.position.copy(c).addScaledVector(dir, dist); cam.lookAt(c); cam.near = dist / 20; cam.far = dist * 4; cam.updateProjectionMatrix();
    const prevTM = r.toneMapping; const prevCol = new THREE.Color(); r.getClearColor(prevCol); const prevA = r.getClearAlpha();
    r.setRenderTarget(rt); r.setClearColor(0x000000, 0); r.clear(); r.render(scene, cam);
    const W = rt.width, H = rt.height; const buf = new Uint8Array(W * H * 4);
    r.readRenderTargetPixels(rt, 0, 0, W, H, buf);
    r.setRenderTarget(null); r.setClearColor(prevCol, prevA); r.toneMapping = prevTM;
    scene.remove(obj);
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d'); const img = g.createImageData(W, H);
    for (let y = 0; y < H; y++) { const sy = H - 1 - y; img.data.set(buf.subarray(sy * W * 4, (sy + 1) * W * 4), y * W * 4); }
    g.putImageData(img, 0, 0);
    return (cache[key] = cv.toDataURL('image/png'));
  }
  return {
    item(id) { return render(M.item(id), 'item:' + id, { dir: G.ITEMS[id] && G.ITEMS[id].cat === 'acc' ? new V3(0.3, 0.5, 1) : undefined }); },
    cafe(id) { return render(M.item(id), 'cafe:' + id); },
    pet(d) {
      const key = 'pet:' + d.breed + d.coat + (d.acc ? JSON.stringify(d.acc) : '');
      if (cache[key]) return cache[key];
      const P = M.pet({ breed: d.breed, coat: d.coat });
      if (d.acc) for (const s in d.acc) if (d.acc[s] && P.slots[s]) P.slots[s].add(M.acc(d.acc[s]));
      P.root.updateMatrixWorld(true);
      const c = new V3(); P.hc.getWorldPosition(c);
      return render(P.root, key, { center: c, radius: P.headR * 1.75, dir: new V3(0.35, 0.15, 1) });
    },
    person(look) {
      const key = 'person:' + look; if (cache[key]) return cache[key];
      const P = M.person(look); P.root.updateMatrixWorld(true);
      const c = new V3(); P.face.getWorldPosition(c); c.y -= 0.03;
      return render(P.root, key, { center: c, radius: 0.33, dir: new V3(0.25, 0.1, 1) });
    },
    raw: render,
  };
})();

/* =========================================================
   Static batching: merge a scenery group into one mesh per material
   ========================================================= */
M.bake = function (group) {
  group.updateMatrixWorld(true);
  const buckets = new Map();
  const keep = [];
  group.traverse((o) => {
    if (!o.isMesh) return;
    if (o.userData.noBake || Array.isArray(o.material)) { keep.push(o); return; }
    const k = o.material.uuid;
    if (!buckets.has(k)) buckets.set(k, { mat: o.material, geos: [], cast: false, recv: false });
    const b = buckets.get(k);
    let g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
    g.applyMatrix4(o.matrixWorld);
    b.geos.push(g); b.cast = b.cast || o.castShadow; b.recv = b.recv || o.receiveShadow || true;
  });
  const out = new THREE.Group();
  for (const b of buckets.values()) {
    const names = ['position', 'normal', 'uv', 'color'].filter((n) => b.geos.every((g) => g.attributes[n]));
    let total = 0; for (const g of b.geos) total += g.attributes.position.count;
    const merged = new THREE.BufferGeometry();
    for (const n of names) {
      const size = b.geos[0].attributes[n].itemSize; const arr = new Float32Array(total * size); let off = 0;
      for (const g of b.geos) { const a = g.attributes[n]; arr.set(a.array.length === a.count * size ? a.array : Array.from({ length: a.count * size }, (_, i) => a.array[i]), off); off += a.count * size; }
      merged.setAttribute(n, new THREE.BufferAttribute(arr, size));
    }
    merged.computeBoundingSphere();
    const m = new THREE.Mesh(merged, b.mat); m.castShadow = b.cast; m.receiveShadow = b.recv; out.add(m);
    for (const g of b.geos) g.dispose();
  }
  for (const o of keep) { const c = o.clone(); o.updateMatrixWorld(true); c.matrix.copy(o.matrixWorld); c.matrix.decompose(c.position, c.quaternion, c.scale); out.add(c); }
  return out;
};
