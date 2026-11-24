'use strict';
/* =========================================================
   Shiba Days — Home (the living room)
   ========================================================= */
G.scenes.home = (() => {
  const H = { music: 'home' };
  let scene, cam, sun, hemi, lamp, winTex, winCanvas, clockHands, trophyGroup, frameMat;
  const BX0 = -3.85, BX1 = 3.85, BZ0 = -3.05, BZ1 = 2.75;
  const BOWL = new V3(2.05, 0, 1.25), WATER = new V3(2.75, 0, 0.6), BED = new V3(-2.7, 0, -2.25), TOYBOX = new V3(3.15, 0, -2.35), CALL = new V3(0, 0, 1.9);
  const OBST = [{ x: TOYBOX.x, z: TOYBOX.z, r: 0.6 }, { x: -3.75, z: -2.9, r: 0.4 }, { x: 3.75, z: -1.0, r: 0.35 }, { x: BOWL.x, z: BOWL.z, r: 0.22 }, { x: WATER.x, z: WATER.z, r: 0.22 }, { x: -3.9, z: 0.6, r: 0.35 }];
  let pets = [], toys = [], touch = null, held = null, praise = null, mode = 'idle', heldTreat = null, tug = null, bath = null;
  let focus = null, focusUntil = 0, camZoom = 1, lookV = new V3(0, 0.45, 0.1), clickables = [], bowlFill, waterFill, tub, lastAlert = 0, ropeMesh = null;
  const camBase = () => (G.aspect() < 0.9 ? new V3(0, 3.3, 7.0) : new V3(0, 2.15, 4.5));

  /* ---------------- building ---------------- */
  H.init = function () {
    scene = new THREE.Scene(); H.scene = scene;
    scene.background = new THREE.Color('#f3dcc0');
    cam = new THREE.PerspectiveCamera(42, G.aspect(), 0.05, 60); H.camera = cam; cam.position.copy(camBase());
    hemi = new THREE.HemisphereLight(0xfff1e0, 0xa47c5c, 0.6); scene.add(hemi);
    sun = new THREE.DirectionalLight(0xfff0dc, 1.15); sun.position.set(-2.5, 6, 4.5); sun.castShadow = true;
    sun.shadow.mapSize.set(G.mobile ? 1024 : 2048, G.mobile ? 1024 : 2048); const sc = sun.shadow.camera; sc.left = -5; sc.right = 5; sc.top = 5; sc.bottom = -5; sc.near = 1; sc.far = 20; sun.shadow.bias = -0.0005; sun.shadow.radius = 4;
    scene.add(sun);
    const fill = new THREE.DirectionalLight(0xcfe6ff, 0.35); fill.position.set(1, 3, -5); scene.add(fill);
    lamp = new THREE.PointLight(0xffc27a, 0, 9, 1.6); lamp.position.set(-3.75, 1.75, 0.6); scene.add(lamp);
    buildRoom();
  };
  function buildRoom() {
    const M = G.M;
    const wood = G.canvasTex(512, 512, (g) => {
      const cols = ['#c98f5a', '#d39b65', '#c4884f', '#d8a46d', '#bf8550'];
      for (let r = 0; r < 8; r++) {
        let x = -(r % 2) * 128;
        while (x < 512) { const w = 160 + Math.random() * 120; g.fillStyle = U.pick(cols); g.fillRect(x, r * 64, w, 64); g.strokeStyle = 'rgba(90,50,20,.18)'; for (let i = 0; i < 6; i++) { g.beginPath(); const y = r * 64 + 8 + Math.random() * 48; g.moveTo(x, y); g.bezierCurveTo(x + w * 0.3, y + U.rand(-4, 4), x + w * 0.6, y + U.rand(-4, 4), x + w, y + U.rand(-3, 3)); g.stroke(); } g.fillStyle = 'rgba(70,40,20,.45)'; g.fillRect(x, r * 64, 2, 64); x += w; }
        g.fillStyle = 'rgba(70,40,20,.35)'; g.fillRect(0, r * 64, 512, 2);
      }
    }, { repeat: [2.4, 2.4] });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(9.4, 8.2), M.mat('#ffffff', { map: wood, r: 0.55 })); floor.rotation.x = -Math.PI / 2; floor.position.z = -0.1; floor.receiveShadow = true; scene.add(floor);
    const paper = G.canvasTex(256, 256, (g) => { g.fillStyle = '#fbe6cf'; g.fillRect(0, 0, 256, 256); g.fillStyle = '#f6d6b6'; for (let x = 0; x < 256; x += 32) g.fillRect(x, 0, 14, 256); g.fillStyle = 'rgba(238,138,60,.18)'; for (let y = 16; y < 256; y += 64) for (let x = 7; x < 256; x += 32) { g.beginPath(); g.arc(x, y + (x % 64 ? 32 : 0), 3, 0, 7); g.fill(); } }, { repeat: [5, 2] });
    const wallM = M.mat('#ffffff', { map: paper, r: 0.95 });
    const back = new THREE.Mesh(new THREE.PlaneGeometry(9.4, 4.2), wallM); back.position.set(0, 2.1, -3.6); back.receiveShadow = true; scene.add(back);
    const left = new THREE.Mesh(new THREE.PlaneGeometry(8.2, 4.2), wallM); left.rotation.y = Math.PI / 2; left.position.set(-4.7, 2.1, -0.1); left.receiveShadow = true; scene.add(left);
    const right = left.clone(); right.rotation.y = -Math.PI / 2; right.position.x = 4.7; scene.add(right);
    const trim = M.mat('#a8683a', { r: 0.6 });
    [[0, -3.57, 9.4, 0], [-4.67, -0.1, 8.2, Math.PI / 2], [4.67, -0.1, 8.2, Math.PI / 2]].forEach(([x, z, w, ry]) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, 0.16, 0.06), trim); b.position.set(x, 0.08, z); b.rotation.y = ry; b.receiveShadow = true; scene.add(b); });
    // window
    winCanvas = document.createElement('canvas'); winCanvas.width = 256; winCanvas.height = 192;
    winTex = new THREE.CanvasTexture(winCanvas); winTex.encoding = THREE.sRGBEncoding;
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.6), new THREE.MeshBasicMaterial({ map: winTex })); glass.position.set(0, 2.05, -3.58); scene.add(glass);
    glass.userData.click = 'window'; clickables.push(glass);
    const frameM = M.mat('#fff7ea', { r: 0.6 });
    [[0, 2.88, 2.4, 0.1], [0, 1.22, 2.5, 0.14], [-1.15, 2.05, 0.1, 1.76], [1.15, 2.05, 0.1, 1.76], [0, 2.05, 0.06, 1.6], [0, 2.05, 2.2, 0.06]].forEach(([x, y, w, h]) => { const f = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.1), frameM); f.position.set(x, y, -3.54); f.castShadow = true; scene.add(f); });
    const sill = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.06, 0.3), frameM); sill.position.set(0, 1.16, -3.45); sill.castShadow = true; scene.add(sill);
    const cur = M.mat('#f39bb0', { r: 0.95 });
    for (const s of [-1, 1]) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.28, 2.1, 12, 1, true, 0, Math.PI), M.mat('#f39bb0', { r: 0.95, side: THREE.DoubleSide })); c.position.set(s * 1.45, 1.95, -3.48); c.rotation.y = Math.PI; c.castShadow = true; scene.add(c); void cur; }
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 3.4, 8), M.mat('#7a4a24')); rod.rotation.z = Math.PI / 2; rod.position.set(0, 3.0, -3.45); scene.add(rod);
    const potM = M.mat('#e8823a', { r: 0.7 });
    const sp = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.08, 0.14, 12), potM); sp.position.set(0.7, 1.26, -3.45); scene.add(sp);
    for (let i = 0; i < 4; i++) { const l = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), M.mat('#6aa84f')); l.position.set(0.7 + U.rand(-0.06, 0.06), 1.38 + i * 0.03, -3.45 + U.rand(-0.05, 0.05)); scene.add(l); }
    // rug
    const rugT = G.canvasTex(256, 256, (g) => { g.fillStyle = '#f6c98a'; g.beginPath(); g.arc(128, 128, 126, 0, 7); g.fill(); g.strokeStyle = '#fff7ea'; g.lineWidth = 10; [100, 70, 40].forEach((r) => { g.beginPath(); g.arc(128, 128, r, 0, 7); g.stroke(); }); g.fillStyle = '#ee8a3c'; for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; g.beginPath(); g.arc(128 + Math.cos(a) * 116, 128 + Math.sin(a) * 116, 6, 0, 7); g.fill(); } });
    const rug = new THREE.Mesh(new THREE.CircleGeometry(1.9, 48), M.mat('#ffffff', { map: rugT, r: 1 })); rug.rotation.x = -Math.PI / 2; rug.position.set(0, 0.006, 0.1); rug.receiveShadow = true; scene.add(rug);
    // dog bed
    const bed = new THREE.Group(); bed.position.copy(BED); scene.add(bed);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.2, 14, 36), M.mat('#7a9fd6', { r: 0.95 })); rim.rotation.x = Math.PI / 2; rim.position.y = 0.16; rim.scale.set(1, 1, 0.9); bed.add(rim);
    const cush = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.12, 32), M.mat('#fff4e0', { r: 1 })); cush.position.y = 0.07; bed.add(cush);
    bed.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); bed.userData.click = 'bed'; clickables.push(bed);
    // bowls
    const fb = M.bowl('#e2574c'); fb.position.copy(BOWL); scene.add(fb); fb.userData.click = 'bowl'; clickables.push(fb);
    bowlFill = new THREE.Group(); fb.add(bowlFill);
    for (let i = 0; i < 26; i++) { const k = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 5), M.mat(i % 3 ? '#a86232' : '#8a4a24', { r: 0.9 })); const a = Math.random() * 6.28, d = Math.sqrt(Math.random()) * 0.15; k.position.set(Math.cos(a) * d, 0.04 + (0.15 - d) * 0.25 + Math.random() * 0.02, Math.sin(a) * d); bowlFill.add(k); }
    const wb = M.bowl('#4aa6e0'); wb.position.copy(WATER); scene.add(wb); wb.userData.click = 'water'; clickables.push(wb);
    waterFill = new THREE.Mesh(new THREE.CircleGeometry(0.19, 28), M.mat('#9fd8ff', { r: 0.05, op: 0.8 })); waterFill.rotation.x = -Math.PI / 2; wb.add(waterFill);
    // toy box
    const tb = new THREE.Group(); tb.position.copy(TOYBOX); tb.rotation.y = -0.4; scene.add(tb);
    const boxT = G.canvasTex(128, 64, (g) => { g.fillStyle = '#79b25a'; g.fillRect(0, 0, 128, 64); g.fillStyle = '#fff7ea'; g.font = '700 30px Fredoka, sans-serif'; g.textAlign = 'center'; g.fillText('TOYS', 64, 42); });
    const bx = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.55, 0.65), [M.mat('#79b25a'), M.mat('#79b25a'), M.mat('#79b25a'), M.mat('#79b25a'), M.mat('#fff', { map: boxT }), M.mat('#79b25a')]); bx.position.y = 0.275; tb.add(bx);
    const lid = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.06, 0.7), M.mat('#5e9e44')); lid.position.set(0, 0.62, -0.25); lid.rotation.x = -0.9; tb.add(lid);
    const pk1 = M.item('ball'); pk1.position.set(-0.2, 0.58, 0); tb.add(pk1); const pk2 = M.item('duck'); pk2.position.set(0.18, 0.58, 0.05); pk2.rotation.y = 0.6; tb.add(pk2);
    tb.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); tb.userData.click = 'toybox'; clickables.push(tb);
    // plants
    const plant = (x, z, s) => { const g = new THREE.Group(); g.position.set(x, 0, z); g.scale.setScalar(s); const p = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.18, 0.42, 16), M.mat('#fff7ea', { r: 0.5 })); p.position.y = 0.21; g.add(p); for (let i = 0; i < 7; i++) { const l = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), M.mat(i % 2 ? '#5e9e44' : '#79b25a', { r: 0.9 })); const a = i / 7 * 6.28; l.position.set(Math.cos(a) * 0.15, 0.62 + Math.sin(i * 2.1) * 0.15 + (i === 0 ? 0.25 : 0), Math.sin(a) * 0.15); l.scale.set(0.8, 1.3, 0.8); g.add(l); } g.traverse((o) => { if (o.isMesh) { o.castShadow = true; } }); scene.add(g); };
    plant(-3.85, -2.95, 1.15); plant(3.8, -1.0, 0.85);
    // shelf + trophies
    const shelf = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.07, 0.34), M.mat('#a8683a')); shelf.position.set(-2.6, 1.55, -3.42); shelf.castShadow = true; scene.add(shelf); shelf.userData.click = 'shelf'; clickables.push(shelf);
    for (const s of [-1, 1]) { const br = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.22, 0.25), M.mat('#7a4a24')); br.position.set(-2.6 + s * 0.8, 1.42, -3.47); scene.add(br); }
    trophyGroup = new THREE.Group(); trophyGroup.position.set(-2.6, 1.585, -3.42); scene.add(trophyGroup);
    // portrait frame
    const fr = new THREE.Group(); fr.position.set(2.45, 1.95, -3.53); scene.add(fr);
    const outer = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.45, 0.06), M.mat('#c8922a', { r: 0.35, m: 0.5 })); outer.castShadow = true; fr.add(outer);
    frameMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 });
    frameMat.map = G.canvasTex(256, 320, (g) => { g.fillStyle = '#e8f2f8'; g.fillRect(0, 0, 256, 320); g.fillStyle = '#bfd8e6'; g.beginPath(); g.moveTo(0, 220); g.lineTo(90, 120); g.lineTo(160, 190); g.lineTo(200, 150); g.lineTo(256, 210); g.lineTo(256, 320); g.lineTo(0, 320); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.moveTo(70, 143); g.lineTo(90, 120); g.lineTo(110, 143); g.fill(); g.fillStyle = '#9cc58a'; g.fillRect(0, 250, 256, 70); g.fillStyle = '#f2c24b'; g.beginPath(); g.arc(200, 70, 22, 0, 7); g.fill(); });
    const canvasM = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.25), frameMat); canvasM.position.z = 0.035; fr.add(canvasM);
    fr.userData.click = 'frame'; clickables.push(fr);
    // clock
    const ck = new THREE.Group(); ck.position.set(-4.66, 2.6, -1.4); ck.rotation.y = Math.PI / 2; scene.add(ck);
    const face = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.06, 32), M.mat('#fff7ea')); face.rotation.x = Math.PI / 2; ck.add(face);
    const rimC = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.035, 8, 32), M.mat('#ee8a3c')); ck.add(rimC);
    for (let i = 0; i < 12; i++) { const d = new THREE.Mesh(new THREE.SphereGeometry(i % 3 ? 0.015 : 0.025, 6, 6), M.mat('#3b2a1f')); const a = i / 12 * 6.28; d.position.set(Math.sin(a) * 0.29, Math.cos(a) * 0.29, 0.035); ck.add(d); }
    const hh = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.17, 0.01).translate(0, 0.07, 0), M.mat('#3b2a1f')); hh.position.z = 0.04; ck.add(hh);
    const mh = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.25, 0.01).translate(0, 0.11, 0), M.mat('#3b2a1f')); mh.position.z = 0.045; ck.add(mh);
    clockHands = { hh, mh }; ck.userData.click = 'clock'; clickables.push(ck);
    // floor lamp
    const fl = new THREE.Group(); fl.position.set(-3.9, 0, 0.6); scene.add(fl);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.6, 8), M.mat('#3b2a1f', { m: 0.5, r: 0.4 })); pole.position.y = 0.8; fl.add(pole);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.25, 0.05, 20), M.mat('#3b2a1f', { m: 0.5, r: 0.4 })); base.position.y = 0.025; fl.add(base);
    const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.32, 0.36, 20, 1, true), M.mat('#fff2d6', { side: THREE.DoubleSide, em: '#ffd28a', ei: 0 })); shade.position.y = 1.7; fl.add(shade); H.shade = shade;
    fl.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    // zabuton cushion + low bookshelf
    const zb = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.1, 0.75), M.mat('#e2574c', { r: 1 })); zb.position.set(1.0, 0.05, -2.6); zb.rotation.y = 0.3; zb.castShadow = true; zb.receiveShadow = true; scene.add(zb);
    const bs = new THREE.Group(); bs.position.set(-4.45, 0, 1.9); bs.rotation.y = Math.PI / 2; scene.add(bs);
    const shelfBox = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.9, 0.4), M.mat('#a8683a')); shelfBox.position.y = 0.45; bs.add(shelfBox);
    const bookCols = ['#4aa6e0', '#e2574c', '#f2c24b', '#79b25a', '#7a5cff', '#fff7ea', '#ee8a3c'];
    for (let r = 0; r < 2; r++) for (let i = 0; i < 9; i++) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.28 + Math.random() * 0.08, 0.28), M.mat(U.pick(bookCols))); b.position.set(-0.55 + i * 0.13, 0.2 + r * 0.42 + b.geometry.parameters.height / 2 - 0.13, 0.08); bs.add(b); }
    bs.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    // bath tub (hidden)
    tub = new THREE.Group(); tub.position.set(0, 0, 0.9); tub.visible = false; scene.add(tub);
    const tp = [new THREE.Vector2(0, 0.02), new THREE.Vector2(0.55, 0.02), new THREE.Vector2(0.68, 0.12), new THREE.Vector2(0.7, 0.42), new THREE.Vector2(0.64, 0.44), new THREE.Vector2(0.62, 0.14), new THREE.Vector2(0.5, 0.07), new THREE.Vector2(0, 0.07)];
    const tm = new THREE.Mesh(new THREE.LatheGeometry(tp, 40), M.mat('#ffffff', { r: 0.25, side: THREE.DoubleSide })); tm.scale.set(1.15, 1, 0.85); tm.castShadow = true; tm.receiveShadow = true; tub.add(tm);
    const tw = new THREE.Mesh(new THREE.CircleGeometry(0.62, 32), M.mat('#9fd8ff', { r: 0.05, op: 0.7 })); tw.rotation.x = -Math.PI / 2; tw.position.y = 0.26; tw.scale.set(1.15, 0.85, 1); tub.add(tw);
    for (const s of [-1, 1]) { const ft = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), M.mat('#f2c24b', { m: 0.6, r: 0.3 })); ft.position.set(s * 0.55, 0.03, 0.3); tub.add(ft); }
  }
  function drawWindow() {
    const g = winCanvas.getContext('2d'); const dl = G.daylight(); const season = G.season();
    const top = new THREE.Color('#1f2a50').lerp(new THREE.Color('#7cc4ff'), dl), bot = new THREE.Color('#3a3a6a').lerp(new THREE.Color(dl < 0.7 && dl > 0.1 ? '#ffb37a' : '#d6efff'), dl);
    const grd = g.createLinearGradient(0, 0, 0, 192); grd.addColorStop(0, '#' + top.getHexString()); grd.addColorStop(1, '#' + bot.getHexString());
    g.fillStyle = grd; g.fillRect(0, 0, 256, 192);
    if (dl < 0.4) { g.fillStyle = '#fff'; for (let i = 0; i < 30; i++) { g.globalAlpha = 0.5 + Math.random() * 0.5; g.fillRect(U.hash(i, 1, 2) * 256, U.hash(i, 3, 4) * 110, 2, 2); } g.globalAlpha = 1; g.fillStyle = '#fff6d6'; g.beginPath(); g.arc(196, 40, 16, 0, 7); g.fill(); }
    else { g.fillStyle = 'rgba(255,255,255,.85)'; [[40, 40], [150, 60], [210, 30]].forEach(([x, y]) => { g.beginPath(); g.arc(x, y, 14, 0, 7); g.arc(x + 16, y - 6, 16, 0, 7); g.arc(x + 32, y, 12, 0, 7); g.fill(); }); }
    const hill = season === 'winter' ? '#e8f0f6' : season === 'autumn' ? '#d9934a' : season === 'spring' ? '#9fd08a' : '#7cbf5a';
    g.fillStyle = new THREE.Color(hill).lerp(new THREE.Color('#1a2440'), (1 - dl) * 0.7).getStyle(); g.beginPath(); g.moveTo(0, 150); g.quadraticCurveTo(80, 110, 160, 140); g.quadraticCurveTo(220, 160, 256, 130); g.lineTo(256, 192); g.lineTo(0, 192); g.fill();
    const treeC = season === 'spring' ? '#f6b9cf' : season === 'autumn' ? '#e8823a' : season === 'winter' ? '#ffffff' : '#5e9e44';
    g.fillStyle = new THREE.Color(treeC).lerp(new THREE.Color('#141c33'), (1 - dl) * 0.7).getStyle(); [[30, 140], [200, 138], [235, 128]].forEach(([x, y]) => { g.beginPath(); g.arc(x, y, 18, 0, 7); g.fill(); });
    winTex.needsUpdate = true;
  }
  function applyLighting() {
    const dl = G.daylight();
    sun.intensity = 0.35 + 0.85 * dl; sun.color.set(dl < 0.8 && dl > 0.05 ? 0xffd9b0 : 0xfff0dc);
    hemi.intensity = 0.38 + 0.25 * dl;
    lamp.intensity = (1 - dl) * 1.6; H.shade.material.emissiveIntensity = (1 - dl) * 0.9;
    scene.background.set(dl > 0.5 ? '#f3dcc0' : '#4a3a40');
    drawWindow();
  }
  function refreshTrophies() {
    while (trophyGroup.children.length) trophyGroup.remove(trophyGroup.children[0]);
    const list = G.state.trophies.slice(-8);
    list.forEach((t, i) => { const c = G.CONTESTS.find((x) => x.id === t.cls); const col = t.place === 1 ? '#f2c24b' : t.place === 2 ? '#c9d2dc' : '#cd7f32'; const m = G.M.trophy(col); m.position.set(-0.78 + i * 0.22, 0, 0); m.scale.setScalar(c && c.id === 'champ' ? 1.25 : 1); trophyGroup.add(m); });
  }
  let lastPortrait = null;
  function refreshPortrait() {
    if (G.state.portrait && G.state.portrait !== lastPortrait) {
      lastPortrait = G.state.portrait;
      const img = new Image(); img.onload = () => { const t = new THREE.Texture(img); t.encoding = THREE.sRGBEncoding; t.needsUpdate = true; frameMat.map = t; frameMat.needsUpdate = true; }; img.src = G.state.portrait;
    }
  }
  function updateBowls() {
    const b = G.state.bowl; bowlFill.visible = b.amt > 0.02; bowlFill.scale.set(1, 0.3 + b.amt * 0.7, 1);
    const col = b.food === 'premium' ? '#d9a52f' : b.food === 'catfood' ? '#e8a0a0' : '#a86232';
    bowlFill.children.forEach((k, i) => { k.material = G.M.mat(i % 3 ? col : '#8a4a24', { r: 0.9 }); });
    waterFill.visible = G.state.water > 0.02; waterFill.position.y = 0.03 + G.state.water * 0.05; waterFill.scale.setScalar(0.8 + G.state.water * 0.2);
  }

  /* ---------------- enter / exit ---------------- */
  H.enter = function () {
    pets = [];
    G.state.pets.forEach((d, i) => {
      const p = G.petObj(d.id); pets.push(p); scene.add(p.root);
      p.stop(); p.ctl = null; p.busy = false; p.baseY = 0; p.lookTarget = null; p.carry = null;
      const a = (i / Math.max(1, G.state.pets.length)) * Math.PI * 2 + 0.4;
      p.pos.set(Math.cos(a) * 1.0, 0, 0.4 + Math.sin(a) * 0.7); p.heading = Math.atan2(-p.pos.x, 5 - p.pos.z);
      p.brain = homeBrain; p.bounds = bounds; p.setPose('stand'); Object.assign(p.pose, p.poses.stand);
    });
    for (const t of toys) scene.remove(t.mesh); toys = [];
    mode = 'idle'; held = null; touch = null; praise = null; heldTreat = null; tug = null; bath = null; focus = null;
    tub.visible = false;
    applyLighting(); refreshTrophies(); refreshPortrait(); updateBowls();
    cam.position.copy(camBase()); lookV.set(0, 0.4, 0.35);
    // daily allowance
    if (G.state.dailyBonus !== G.today()) {
      const first = !G.state.dailyBonus; G.state.dailyBonus = G.today();
      if (!first) setTimeout(() => { G.addCoins(60, 'Daily allowance: +60 coins!'); }, 1200);
      G.state.day++;
    }
    setTimeout(nextHint, 900);
  };
  H.exit = function () {
    for (const p of pets) { if (p.carry) p.drop(scene); scene.remove(p.root); p.stop(); p.ctl = null; }
    endModes(); G.ui.cursor(null); G.ui.hint(null);
  };
  H.onActive = function (d) { const p = G.pets[d.id]; if (p) { p.lookCam = 2; p.emote('heart', 1); p.voice(); } };
  H.dock = () => [
    { id: 'feed', label: 'Food', icon: 'bowl', fn: () => G.ui.feedSheet() },
    { id: 'toys', label: 'Toys', icon: 'ball', fn: () => G.ui.toySheet() },
    { id: 'tricks', label: 'Tricks', icon: 'star', fn: () => G.ui.trickSheet() },
    { id: 'care', label: 'Care', icon: 'care', fn: () => G.ui.careSheet() },
    { id: 'dress', label: 'Dress', icon: 'dress', fn: () => G.ui.dressSheet() },
    { id: 'go', label: 'Go out', icon: 'door', cls: 'go', fn: () => G.ui.goSheet() },
  ];

  /* ---------------- tutorial ---------------- */
  function nextHint() {
    if (G.curName !== 'home') return;
    const t = G.state.tut; const p = G.activePet(); if (!p) return;
    if (!t.pet) G.ui.hint('Press and stroke ' + p.name + ' to pet them!', 0);
    else if (!t.call) G.ui.hint('Tap the floor to call ' + p.name + ' over.', 0);
    else if (!t.toy) G.ui.hint('Open Toys, pick the ball and flick it up to throw!', 0);
    else if (!t.trick) G.ui.hint('Teach a trick: stroke down along ' + p.name + '’s back while they stand.', 0);
    else if (!t.walk) G.ui.hint('Ready for an adventure? Go out → Walk around Maple Hill.', 7000);
    else G.ui.hint(null);
  }
  function tutDone(k) { if (!G.state.tut[k]) { G.state.tut[k] = 1; setTimeout(nextHint, 1500); } }
  H.tutDone = tutDone;

  /* ---------------- bounds ---------------- */
  function bounds(p) {
    if (p.ctl && bath && bath.pet === p) return;
    p.pos.x = U.clamp(p.pos.x, BX0, BX1); p.pos.z = U.clamp(p.pos.z, BZ0, BZ1);
    for (const o of OBST) { const dx = p.pos.x - o.x, dz = p.pos.z - o.z, d = Math.hypot(dx, dz); const r = o.r + 0.12 * p.S; if (d < r && d > 0.0001) { p.pos.x = o.x + dx / d * r; p.pos.z = o.z + dz / d * r; } }
  }
  function randPoint() { for (let i = 0; i < 10; i++) { const x = U.rand(BX0 + 0.4, BX1 - 0.4), z = U.rand(BZ0 + 0.4, BZ1 - 0.6); if (OBST.every((o) => U.d2(x, z, o.x, o.z) > o.r + 0.4)) return { x, z }; } return { x: 0, z: 0 }; }

  /* ---------------- brain ---------------- */
  function* homeBrain(p) {
    const d = p.d;
    if (G.time - lastAlert > 12 && Math.random() < 0.3) {
      lastAlert = G.time;
      if (d.hunger < 30) p.emote('hungry'); else if (d.thirst < 30) p.emote('thirsty'); else if (d.clean < 25) p.emote('dirty'); else if (d.energy < 18) p.emote('zzz'); else if (!p.cat && d.mood < 50 && U.chance(0.5)) p.emote('walk');
    }
    if (d.thirst < 40 && G.state.water > 0.05 && U.chance(0.6)) return yield* drink(p);
    if (d.hunger < 45) { if (G.state.bowl.amt > 0.02) return yield* eat(p); if (U.chance(0.35)) return yield* beg(p); }
    if (d.energy < 22 || (d.personality === 'sleepy' && d.energy < 60 && U.chance(0.2))) return yield* nap(p);
    const others = pets.filter((o) => o !== p && !o.busy && !o.ctl && o.poseName !== 'sleep');
    if (others.length && U.chance(0.2)) return yield* social(p, U.pick(others));
    const floorToys = toys.filter((t) => !t.held && t.rest && !t.inHand && !t.tugging);
    if (floorToys.length && U.chance(d.personality === 'playful' ? 0.35 : 0.18) && d.energy > 20) return yield* playToy(p, U.pick(floorToys));
    const r = Math.random();
    if (r < 0.26) { const q = randPoint(); yield* p.goto(q.x, q.z, { speed: U.pick([0.7, 1, 1.2]) }); yield* p.idleLook(U.rand(1, 3)); }
    else if (r < 0.4) { p.lookCam = 4; yield* p.face(cam.position.x, cam.position.z); yield* p.act('sit', U.rand(2, 4)); if (U.chance(0.4)) { p.tiltT = 1.2; p.tiltDir = U.chance(0.5) ? 1 : -1; } yield* p.wait(1); }
    else if (r < 0.5) yield* p.sniffAround(2);
    else if (r < 0.57) yield* p.scratch();
    else if (r < 0.65) yield* p.act('lie', U.rand(3, 6));
    else if (r < 0.7) yield* p.yawn();
    else if (r < 0.75) yield* p.stretch();
    else if (r < 0.8 && d.energy > 55) yield* p.zoomies(0, 0.2, 1.6, 1);
    else if (r < 0.86 && p.cat) yield* p.groom();
    else if (r < 0.9) { yield* p.goto(U.rand(-0.8, 0.8), -2.85); p.lookTarget = new V3(0, 2, -3.6); yield* p.act('sit', 3); p.lookTarget = null; }
    else if (r < 0.94 && !p.cat) { p.lookCam = 2; yield* p.face(cam.position.x, cam.position.z); p.voice(); yield* p.act('bow', 1); }
    else yield* p.wait(U.rand(1, 2.5));
  }
  function* eat(p) {
    p.busy = true;
    const ap = BOWL.clone().add(new V3(-0.42 * p.S - 0.1, 0, -0.02));
    yield* p.goto(ap.x, ap.z, { speed: 1.6 }); yield* p.face(BOWL.x, BOWL.z);
    p.setPose('eat'); p.chewT = 4; let t = 0;
    while (t < 4) { t += p.dt; if (Math.random() < p.dt * 1.6) G.audio.play('munch'); yield; }
    const it = G.ITEMS[G.state.bowl.food] || G.ITEMS.kibble; const take = Math.min(0.34, G.state.bowl.amt);
    G.state.bowl.amt = Math.max(0, G.state.bowl.amt - take);
    p.d.hunger = U.clamp(p.d.hunger + it.hunger * take / 0.34, 0, 100);
    p.happy((it.mood || 2) * take / 0.34 + (p.cat && G.state.bowl.food === 'catfood' ? 6 : 1));
    updateBowls(); p.setPose('stand'); p.excite = 0.6; p.busy = false; yield* p.wait(0.4);
    if (U.chance(0.5)) { p.lickT = 1; yield* p.wait(1); }
  }
  function* drink(p) {
    p.busy = true;
    const ap = WATER.clone().add(new V3(-0.42 * p.S - 0.1, 0, 0.05));
    yield* p.goto(ap.x, ap.z, { speed: 1.4 }); yield* p.face(WATER.x, WATER.z);
    p.setPose('eat'); let t = 0;
    while (t < 3) { t += p.dt; p.lickT = 0.2; if (Math.random() < p.dt * 1.2) G.audio.play('lap'); yield; }
    G.state.water = Math.max(0, G.state.water - 0.22); p.d.thirst = U.clamp(p.d.thirst + 50, 0, 100); p.happy(1, false);
    updateBowls(); p.setPose('stand'); p.busy = false;
    if (U.chance(0.4)) yield* p.shake();
  }
  function* beg(p) {
    const ap = BOWL.clone().add(new V3(-0.5, 0, 0.1));
    yield* p.goto(ap.x, ap.z); p.lookCam = 4; yield* p.face(cam.position.x, cam.position.z);
    p.emote(G.state.bowl.amt > 0.02 ? 'hungry' : 'hungry'); p.voice('whine'); yield* p.act('sit', 3);
  }
  function* nap(p) {
    const idx = pets.indexOf(p);
    const off = [[0, 0], [0.32, 0.18], [-0.3, 0.2], [0.05, -0.3]][idx % 4];
    yield* p.goto(BED.x + off[0], BED.z + off[1], { speed: 0.8, near: 0.08 });
    yield* p.face(BED.x + 1, BED.z + 2);
    yield* p.act('lie', 1);
    p.setPose('sleep'); p.baseY = 0.1; let t = 0, z = 0;
    while (p.d.energy < 92 && t < 40) { t += p.dt; z += p.dt; if (z > 1.8) { z = 0; p.fx('zzz', 1); } yield; }
    p.baseY = 0; yield* p.yawn(); yield* p.stretch();
  }
  function* social(p, o) {
    o.busy = true; p.busy = true;
    try {
      yield* p.goto(o.pos.x + Math.sin(o.heading) * 0.5 * o.S, o.pos.z + Math.cos(o.heading) * 0.5 * o.S, { speed: 1.2, timeout: 6 });
      if (o.ctl || !o.busy) return;
      o.do((function* () { yield* o.face(p.pos.x, p.pos.z); yield* o.wait(3.5); })());
      yield* p.face(o.pos.x, o.pos.z);
      p.lookTarget = o.headWorld(); p.setPose('sniff'); G.audio.play('sniff'); yield* p.wait(1.2); p.setPose('stand');
      const r = Math.random();
      if (!p.cat && !o.cat && r < 0.6 && p.d.energy > 30 && o.d.energy > 30) {
        yield* p.act('bow', 0.9); p.voice(); o.excite = 1; p.excite = 1; p.lookTarget = null;
        o.do(o.zoomies(0, 0.2, 1.7, 1.3));
        let t = 0; while (t < 4.5) { t += p.dt; p.setPose('stand'); p.moveTarget = new V3(o.pos.x, 0, o.pos.z); p.speedMul = 3; yield; }
        p.moveTarget = null; p.happy(3); o.happy && o.happy(3);
      } else if (p.cat !== o.cat && r < 0.55) {
        const c = p.cat ? p : o; c.do((function* () { yield* c.act('paw', 0.8); c.voice(); yield* c.act('sit', 1); })());
        yield* p.wait(1.2); (p.cat ? o : p).emote('sweat');
      } else { p.emote('heart'); o.emote('heart'); p.lickT = 0.8; yield* p.wait(1.4); p.happy(2); o.happy(2); }
      if (p.d.energy < 50 && o.d.energy < 50 && U.chance(0.5)) { o.do(nap(o)); p.lookTarget = null; yield* nap(p); }
    } finally { p.busy = false; o.busy = false; p.lookTarget = null; }
  }
  function* playToy(p, toy) {
    yield* p.goto(toy.pos.x, toy.pos.z, { speed: 2.2, near: 0.25 * p.S + 0.05 });
    if (toy.held || toy.inHand) return;
    p.setPose('sniff'); yield* p.wait(0.3); p.grab(toy, toy.def.toy === 'squeak' ? 'plush' : 'toy');
    if (toy.def.toy === 'squeak') G.audio.play('squeak');
    p.excite = 1; p.setPose('stand');
    for (let i = 0; i < 2; i++) { const q = randPoint(); yield* p.goto(q.x, q.z, { speed: 1.8, timeout: 4 }); if (toy.def.toy === 'squeak') { G.audio.play('squeak'); p.excite = 1; yield* p.wait(0.6); } }
    if (p.carry === toy) { p.drop(scene); }
    p.happy(2); yield* p.act('lie', 1.5);
  }
  /* fetch for thrown toys */
  function* fetch(p, toy) {
    p.busy = true; p.excite = 1;
    try {
      let t = 0;
      while (!toy.held && !toy.inHand && t < 12) {
        t += p.dt; p.setPose('stand');
        const tx = toy.pos.x + toy.vel.x * 0.25, tz = toy.pos.z + toy.vel.z * 0.25;
        p.moveTarget = new V3(tx, 0, tz); p.speedMul = 3.1 + (p.d.disc || 0) * 0.01;
        const dd = U.d2(p.pos.x, p.pos.z, toy.pos.x, toy.pos.z);
        const mouthH = (p.m.baseH + p.m.dims.by + p.m.headR) * p.S;
        if (dd < 0.3 * p.S + 0.12) {
          if (toy.pos.y < mouthH + 0.1) { p.grab(toy, toy.def.toy === 'squeak' ? 'plush' : 'toy'); if (toy.pos.y > 0.2 || p.airborne) { p.fx('sparkle', 4); G.audio.play('sparkle'); } break; }
          else if (toy.pos.y < mouthH + 0.7 && !p.airborne && toy.vel.y < 1) { p.jump(3.2); p.setPose('leap', 10); }
        }
        yield;
      }
      p.moveTarget = null;
      if (toy.held !== p) { p.emote('sweat'); yield* p.act('sit', 1); return; }
      if (toy.def.toy === 'squeak') G.audio.play('squeak');
      yield* p.wait(0.2);
      yield* p.goto(CALL.x + U.rand(-0.3, 0.3), CALL.z, { speed: 2.2 });
      yield* p.face(cam.position.x, cam.position.z);
      p.lookCam = 3; p.setPose('sit'); yield* p.wait(0.5);
      if (p.carry === toy) p.drop(scene);
      p.voice(); p.excite = 1; p.happy(3); p.d.disc = Math.min(100, (p.d.disc || 0) + 0.3);
      yield* p.wait(2);
    } finally { p.busy = false; }
  }

  /* ---------------- toys / physics ---------------- */
  function makeToy(id) {
    const def = G.ITEMS[id]; const mesh = G.M.item(id); scene.add(mesh);
    const t = { id, def, mesh, pos: mesh.position, vel: new V3(), r: def.r || 0.06, rest: true, held: null, inHand: false, spin: 0 };
    mesh.traverse((o) => { o.userData.toy = t; }); toys.push(t); return t;
  }
  function handPoint(p, dist = 1.6) { const rc = G.ray(p); return rc.ray.at(dist, new V3()); }
  H.holdToy = function (id) {
    endModes();
    let t = toys.find((x) => x.id === id);
    if (t && t.held) t.held.drop(scene);
    if (!t) t = makeToy(id);
    held = t; t.inHand = true; t.rest = false; t.vel.set(0, 0, 0);
    t.pos.copy(handPoint({ nx: 0, ny: -0.45 }, 1.5));
    G.ui.prompts([{ label: 'Put away', cls: 'orange', fn: () => { if (held) { scene.remove(held.mesh); toys.splice(toys.indexOf(held), 1); held = null; G.ui.prompts([]); } } }]);
    G.ui.hint(t.def.toy === 'tug' ? 'Hold the rope near ' + (G.activePet() || {}).name + '... then drag back to tug!' : t.def.toy === 'squeak' ? 'Flick up to throw, or drop it and tap to squeak!' : 'Press the toy and flick upward to throw!', 4000);
    if (t.def.toy === 'tug') startTug(t);
  };
  function moveHeld(p) { if (!held) return; held.pos.copy(handPoint(p, 1.5)); held.vel.set(0, 0, 0); held.mesh.rotation.y += 0.02; }
  function releaseHeld(p) {
    const t = held; held = null; G.ui.prompts([]);
    t.inHand = false; t.rest = false;
    const up = -p.vy / innerHeight;
    if (up > 0.7 && p.dur < 1200) {
      const f = U.clamp(up * 2.3, 1.2, 8.5) * (t.def.toy === 'disc' ? 0.85 : 1);
      const fwd = new V3(); cam.getWorldDirection(fwd); fwd.y = 0; fwd.normalize();
      const right = new V3(fwd.z, 0, -fwd.x).multiplyScalar(-1);
      t.vel.copy(fwd).multiplyScalar(f).addScaledVector(right, U.clamp(p.vx / innerHeight * 2.2, -4, 4));
      t.vel.y = 1.4 + f * 0.32; t.thrown = true; t.flying = true;
      G.audio.play('whoosh'); G.state.stats.throws++;
      tutDone('toy');
      // send fetchers
      const cands = pets.filter((x) => !x.ctl && x.poseName !== 'sleep' && x.d.energy > 10 && !(x.cat && U.chance(0.6)));
      cands.forEach((x, i) => { if (i === 0 || U.chance(x.d.personality === 'playful' ? 0.9 : 0.6)) { x.do(fetch(x, t)); x.emote('bang', 0.8); } });
    } else { t.vel.set(0, 0, 0); }
  }
  function updateToys(dt) {
    for (const t of toys) {
      if (t.held || t.inHand) continue;
      if (t.rest) continue;
      const disc = t.def.toy === 'disc';
      const g = disc && Math.hypot(t.vel.x, t.vel.z) > 2 ? 3.2 : 9.8;
      t.vel.y -= g * dt;
      t.pos.addScaledVector(t.vel, dt);
      if (disc) { t.mesh.rotation.y += dt * 18; t.mesh.rotation.x = 0.1; t.vel.x *= Math.exp(-0.4 * dt); t.vel.z *= Math.exp(-0.4 * dt); }
      const floorY = disc ? 0.015 : t.r;
      if (t.pos.y < floorY) {
        t.pos.y = floorY;
        if (Math.abs(t.vel.y) > 0.8) { G.audio.play('bounce'); if (t.def.toy === 'squeak' && Math.abs(t.vel.y) > 2) G.audio.play('squeak'); }
        t.vel.y = -t.vel.y * t.def.bounce; if (Math.abs(t.vel.y) < 0.4) t.vel.y = 0;
        t.vel.x *= Math.exp(-(disc ? 8 : 2.2) * dt); t.vel.z *= Math.exp(-(disc ? 8 : 2.2) * dt);
        if (!disc) { t.mesh.rotation.x += t.vel.z * dt / t.r; t.mesh.rotation.z -= t.vel.x * dt / t.r; }
        t.flying = false;
      }
      if (t.pos.x < BX0) { t.pos.x = BX0; t.vel.x = Math.abs(t.vel.x) * 0.5; G.audio.play('thud'); } if (t.pos.x > BX1) { t.pos.x = BX1; t.vel.x = -Math.abs(t.vel.x) * 0.5; G.audio.play('thud'); }
      if (t.pos.z < BZ0 - 0.3) { t.pos.z = BZ0 - 0.3; t.vel.z = Math.abs(t.vel.z) * 0.5; G.audio.play('thud'); } if (t.pos.z > BZ1 + 0.2) { t.pos.z = BZ1 + 0.2; t.vel.z = -Math.abs(t.vel.z) * 0.5; }
      if (t.pos.y <= floorY + 0.001 && t.vel.lengthSq() < 0.01) { t.vel.set(0, 0, 0); t.rest = true; }
    }
  }

  /* ---------------- tug of war ---------------- */
  function startTug(rope) {
    const p = G.activePet(); if (!p || p.cat) return;
    tug = { pet: p, rope, stage: 'come', pull: 0, score: 0, t: 0, petPull: 0 };
    p.stop(); p.emote('bang'); p.excite = 1;
    p.do((function* () { yield* p.goto(CALL.x, CALL.z - 0.3, { speed: 2.4 }); yield* p.face(cam.position.x, cam.position.z); tug && (tug.stage = 'ready'); })());
  }
  function updateTug(dt) {
    if (!tug) return;
    const p = tug.pet;
    if (!held || held !== tug.rope) { endTug(false); return; }
    if (tug.stage !== 'play') {
      if (tug.stage === 'ready' && U.d2(held.pos.x, held.pos.z, p.pos.x, p.pos.z) < 2.2) { tug.stage = 'play'; p.stop(); p.setPose('tug'); G.ui.hint('Drag down to pull! Win the tug of war!', 3000); }
      return;
    }
    tug.t += dt;
    p.lookCam = 1; p.setPose('tug');
    tug.petPull = 0.5 + Math.sin(tug.t * 3.2) * 0.5;
    const camF = new V3(cam.position.x, 0, cam.position.z);
    const dir = camF.clone().sub(p.pos).setY(0).normalize();
    const want = CALL.clone().add(new V3(0, 0, -0.35)).addScaledVector(dir, (tug.pull - tug.petPull) * 0.25);
    p.pos.x = U.damp(p.pos.x, want.x, 6, dt); p.pos.z = U.damp(p.pos.z, want.z, 6, dt);
    p.heading = Math.atan2(dir.x, dir.z);
    p.m.head.rotation.y += Math.sin(tug.t * 18) * 0.25;
    if (Math.random() < dt * 0.7) p.voice('growl');
    // rope visual
    const a = held.pos.clone(); const b = p.mouthWorld();
    const mid = a.clone().lerp(b, 0.5); mid.y -= 0.12 * (1 - tug.pull);
    if (ropeMesh) { scene.remove(ropeMesh); ropeMesh.geometry.dispose(); }
    const curve = new THREE.CatmullRomCurve3([a, mid, b]);
    ropeMesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 16, 0.018, 6, false), G.M.mat('#e2574c', { r: 0.9 })); scene.add(ropeMesh);
    held.mesh.visible = false;
    if (tug.pull > 0.75 && tug.petPull > 0.6 && !tug.cool) { tug.score++; tug.cool = true; G.audio.play('pop'); p.excite = 1; G.vibrate(20); }
    if (tug.pull < 0.4) tug.cool = false;
    if (tug.score >= 4) endTug(true);
    else if (tug.t > 10) endTug(false, true);
  }
  function endTug(win, petWins) {
    if (!tug) return; const p = tug.pet; const rope = tug.rope; tug = null;
    if (ropeMesh) { scene.remove(ropeMesh); ropeMesh.geometry.dispose(); ropeMesh = null; }
    rope.mesh.visible = true;
    if (win || petWins) {
      if (held === rope) { held = null; G.ui.prompts([]); rope.inHand = false; }
      if (win) { G.ui.toast('You won the tug of war!'); p.happy(6); p.emote('heart'); p.do((function* () { yield* p.act('bow', 1); p.voice(); })()); rope.rest = false; rope.vel.set(0, 0, 0); }
      else { G.ui.toast(p.name + ' won the tug of war!'); p.grab(rope, 'plush'); p.happy(8); p.do((function* () { yield* p.zoomies(0, 0.3, 1.5, 1.2); if (p.carry) p.drop(scene); yield* p.act('lie', 1.5); })()); }
    } else { p.stop(); }
  }

  /* ---------------- interactions ---------------- */
  function partOf(hit, pet) {
    let part = hit.object.userData.part || 'back';
    if (part === 'torso') { const l = pet.m.body.worldToLocal(hit.point.clone()); part = l.y < -pet.m.dims.by * 0.3 ? 'belly' : 'back'; }
    else if (part === 'head' || part === 'muzzle') { const l = pet.m.hc.worldToLocal(hit.point.clone()); if (l.y < -pet.m.headR * 0.28) part = 'chin'; else part = 'head'; }
    return part;
  }
  function petMeshes() { const a = []; for (const p of pets) if (p.root.parent) a.push(...p.m.meshes); return a; }
  function setFocus(target, secs = 3) { focus = target; focusUntil = G.time + secs; }
  H.focusPet = function (p) { if (p) setFocus(p, 999); else focus = null; };
  H.onDown = function (p) {
    if (mode === 'bath') return bathStroke(p, true);
    if (held) { moveHeld(p); held.dragging = true; return; }
    if (mode === 'treat') { touch = { kind: 'treat', p0: p }; G.ui.cursor(G.M.icons.item(heldTreat), p.x, p.y); return; }
    const hp = G.pick(p, petMeshes(), false)[0];
    const th = G.pick(p, toys.filter((t) => !t.held && !t.inHand).map((t) => t.mesh), true)[0];
    if (th && (!hp || th.distance < hp.distance)) { touch = { kind: 'toy', toy: th.object.userData.toy, p0: p }; return; }
    if (hp) {
      const pet = hp.object.userData.pet;
      touch = { kind: 'pet', pet, p0: p, last: p, path: [p], accum: 0, angle: 0, prevA: null, rough: 0, part: partOf(hp, pet), over: true, purr: 0 };
      if (!pet.ctl && pet !== (tug && tug.pet)) {
        if (pet.carry) pet.drop(scene);
        const wasSleeping = pet.poseName === 'sleep';
        const keep = ['sit', 'lie', 'roll', 'beg'].includes(pet.poseName) ? pet.poseName : 'stand';
        pet.do((function* () {
          if (wasSleeping) { pet.baseY = 0; pet.setPose('lie'); pet.emote('bang', 0.8); yield* pet.wait(0.3); }
          pet.setPose(wasSleeping ? 'lie' : keep);
          if (!wasSleeping && keep === 'stand') yield* pet.face(cam.position.x, cam.position.z, 0.35);
          while (pet.petT < 1.4 || (touch && touch.pet === pet)) yield;
        })());
      }
      pet.lookCam = 1.5; setFocus(pet, 4);
      G.ui.cursor(mode === 'brush' ? IC.brush : IC.hand, p.x, p.y);
      return;
    }
    const ph = G.pick(p, clickables, true)[0];
    if (ph) { let o = ph.object; while (o && !o.userData.click) o = o.parent; touch = { kind: 'prop', click: o && o.userData.click, p0: p }; return; }
    touch = { kind: 'floor', p0: p };
  };
  H.onMove = function (p, down) {
    if (mode === 'bath') { if (down) bathStroke(p); else G.ui.cursor(IC.hand, p.x, p.y); return; }
    if (held) { if (down || held.inHand) moveHeld(p); if (tug && down) { tug.pull = U.clamp((p.y - G.input.sy) / 160, 0, 1); } return; }
    if (mode === 'treat') { G.ui.cursor(G.M.icons.item(heldTreat), p.x, p.y); treatPoint = G.groundAt(p) || treatPoint; return; }
    if (!down) {
      if (p.type === 'mouse') { const hp = G.pick(p, petMeshes(), false)[0]; if (hp) G.ui.cursor(mode === 'brush' ? IC.brush : IC.hand, p.x, p.y); else G.ui.cursor(null); }
      return;
    }
    if (!touch) return;
    if (touch.kind === 'toy' && G.input.moved > 14) { const t = touch.toy; touch = null; if (t.held) t.held.drop(scene); held = t; t.inHand = true; t.rest = false; moveHeld(p); return; }
    if (touch.kind === 'pet') strokePet(p);
  };
  function strokePet(p) {
    const T = touch, pet = T.pet;
    const dtp = Math.max(8, p.t - T.last.t) / 1000;
    const dist = Math.hypot(p.x - T.last.x, p.y - T.last.y); const speed = dist / dtp;
    T.path.push(p);
    const sc = G.toScreen(pet.pos.clone().setY(pet.sizeH * 0.45));
    const a = Math.atan2(p.y - sc.y, p.x - sc.x); if (T.prevA !== null) T.angle += U.angDiff(T.prevA, a); T.prevA = a;
    G.ui.cursor(mode === 'brush' ? IC.brush : IC.hand, p.x, p.y);
    const hit = G.pick(p, pet.m.meshes, false)[0];
    T.last = p;
    if (!hit) { T.over = false; return; }
    T.over = true; const part = partOf(hit, pet); T.part = part;
    pet.petT = 0; pet.petPart = part; pet.lookCam = 1;
    if (speed > 3400) T.rough += dtp * 1.3; else T.rough = Math.max(0, T.rough - dtp * 0.6);
    if (T.rough > 1.0 && mode !== 'brush') {
      touch = null; G.ui.cursor(null);
      pet.emote('anger'); pet.voice(pet.cat ? 'hiss' : 'growl'); pet.d.mood = Math.max(0, pet.d.mood - 4);
      pet.do((function* () { yield* pet.goto(pet.pos.x + U.rand(-1, 1), pet.pos.z - 1, { speed: 1.5, timeout: 2 }); yield* pet.act('sit', 1.5); })());
      G.ui.toast('Too rough! Gentle strokes, please.');
      return;
    }
    T.accum += Math.min(dist, 60);
    if (mode === 'brush') {
      if (Math.random() < 0.35) G.fx.spawn('puff', hit.point, 1, { scale: 0.4 });
      if (Math.random() < 0.2) G.fx.spawn('sparkle', hit.point, 1, { scale: 0.6 });
      if (Math.random() < 0.15) G.audio.play('scrub');
    }
    while (T.accum > 85) {
      T.accum -= 85;
      if (mode === 'brush') { pet.d.clean = Math.min(100, pet.d.clean + 1.6); pet.happy(0.8, false); if (pet.d.clean >= 100 && !T.done) { T.done = true; G.ui.toast(pet.name + ' is super fluffy!'); pet.fx('sparkle', 6); G.audio.play('sparkle'); } }
      else { pet.happy(1.1, false); G.fx.spawn('heart', hit.point.clone().add(new V3(0, 0.05, 0)), 1); }
      G.state.stats.pets++; tutDone('pet');
      if (praise && praise.pet === pet) doPraise();
    }
    if (part === 'belly' && !pet.cat) { if (pet.poseName === 'lie') pet.setPose('roll', 5); if (pet.poseName === 'roll') pet.kickT = 0.4; }
    if (pet.cat) { T.purr -= dtp; if (T.purr <= 0) { T.purr = 2; pet.voice('purr'); } }
    else if (Math.random() < dtp * 0.35) { pet.voice('happy'); pet.lickT = 0.7; }
    if (part === 'tail' && Math.random() < dtp * 2) pet.emote('sweat', 0.8);
  }
  H.onUp = function (p) {
    if (mode === 'bath') return;
    if (held) { if (tug) return; releaseHeld(p); return; }
    const T = touch; touch = null;
    if (mode !== 'brush' && mode !== 'treat') G.ui.cursor(null);
    if (!T) return;
    if (T.kind === 'treat') { feedTreatAt(p); return; }
    if (T.kind === 'pet') return endPetTouch(T, p);
    if (T.kind === 'toy' && p.tap) {
      const t = T.toy; if (t.held) t.held.drop(scene);
      t.rest = false; t.vel.set(U.rand(-0.3, 0.3), 1.8, U.rand(-0.3, 0.3));
      if (t.def.toy === 'squeak') { G.audio.play('squeak'); pets.forEach((x) => { if (!x.ctl && x.poseName !== 'sleep' && U.chance(0.7)) { x.emote('bang', 0.8); x.lookTarget = t.pos; setTimeout(() => (x.lookTarget = null), 1500); } }); const f = pets.find((x) => !x.ctl && !x.busy && x.poseName !== 'sleep'); if (f) f.do(playToy(f, t)); }
      else G.audio.play('bounce');
      return;
    }
    if (T.kind === 'prop' && p.tap) return propTap(T.click);
    if (T.kind === 'floor' && p.tap) { const g = G.groundAt(p); if (g) callPet(g); }
  };
  H.onCancel = function () { touch = null; G.ui.cursor(null); };
  H.onZoom = function (d) { camZoom = U.clamp(camZoom + d, 0.55, 1.35); };
  function endPetTouch(T, p) {
    const pet = T.pet; const dx = p.x - T.p0.x, dy = p.y - T.p0.y, dur = p.t - T.p0.t;
    if (G.state.pets.find((x) => x.id === pet.d.id)) { if (G.state.active !== pet.d.id) { G.state.active = pet.d.id; G.ui.refresh(true); } }
    if (mode === 'brush') return;
    if (p.tap) return tapPet(pet, T.part, p);
    const pl = T.path.reduce((s, q, i) => (i ? s + Math.hypot(q.x - T.path[i - 1].x, q.y - T.path[i - 1].y) : 0), 0);
    const pn = pet.poseName, standing = pn === 'stand', sitting = pn === 'sit', lying = pn === 'lie' || pn === 'roll';
    let g = null;
    if (Math.abs(T.angle) > 5.2 && pl > 260 && (standing || sitting)) g = 'spin';
    else if (dy < -70 && p.vy < -1300 && dur < 450 && standing) g = 'jump';
    else if (dy > 55 && Math.abs(dx) < dy * 0.85 && standing) g = 'sit';
    else if (dy > 55 && Math.abs(dx) < dy * 0.85 && sitting) g = 'down';
    else if (dy < -55 && Math.abs(dx) < -dy * 0.85 && sitting && !pet.cat) g = 'beg';
    else if (Math.abs(dx) > 90 && Math.abs(dy) < Math.abs(dx) * 0.65 && lying && !pet.cat) g = 'rollover';
    else if (dur > 1500 && G.input.moved < 30 && lying && (T.part === 'head' || T.part === 'chin') && !pet.cat) g = 'dead';
    if (g) startTrick(pet, g);
  }
  function tapPet(pet, part, p) {
    if (part === 'paw' && pet.poseName === 'sit') return startTrick(pet, 'paw');
    if (part === 'nose') { if (pet._nose && p.t - pet._nose < 500) { pet._nose = 0; return startTrick(pet, 'speak'); } pet._nose = p.t; pet.emote('q', 0.8); return; }
    pet.lookCam = 2.5; pet.excite = Math.max(pet.excite, 0.6); pet.happy(0.5, false);
    pet.emote(U.pick(['heart', 'note', 'bang'])); pet.voice();
    if (pet.poseName === 'sleep' || pet.poseName === 'lie') { pet.stop(); pet.baseY = 0; pet.do((function* () { yield* pet.act('lie', 0.2); pet.setPose('stand'); yield* pet.stretch(); })()); }
  }
  function startTrick(pet, id) {
    const tr = G.TRICKS.find((t) => t.id === id);
    const learned = (pet.d.tricks[id] || 0) >= 1;
    pet.do((function* () { pet.lookCam = 4; if (pet.poseName === 'stand') yield* pet.face(cam.position.x, cam.position.z, 0.4); yield* pet.trick(id); pet.excite = Math.max(pet.excite, 0.5); pet.lookCam = 3; yield* pet.wait(1.5); })());
    setFocus(pet, 5);
    if (!learned) {
      praise = { pet, id, until: G.time + 5 };
      G.ui.prompts([{ label: 'Good job!', cls: 'pink', fn: () => doPraise() }]);
      G.ui.hint(pet.name + ' tried "' + tr.name + '"! Praise them to teach it.', 3500);
    } else { pet.happy(2); G.ui.toast(pet.name + ': ' + tr.name + '!'); }
  }
  function doPraise() {
    if (!praise) return; const { pet, id } = praise; praise = null; G.ui.prompts([]);
    const tr = G.TRICKS.find((t) => t.id === id);
    pet.d.tricks[id] = Math.min(1, (pet.d.tricks[id] || 0) + 0.34);
    pet.happy(5); pet.fx('heart', 4); G.audio.play('chime'); pet.excite = 1; pet.voice('happy');
    tutDone('trick');
    if (pet.d.tricks[id] >= 1) { setTimeout(() => G.audio.play('fanfare'), 300); G.ui.banner(pet.name + ' learned', tr.name + '!', 2400); pet.fx('star', 10); }
    else G.ui.toast('Learning ' + tr.name + ': ' + Math.round(pet.d.tricks[id] * 100) + '%');
  }
  H.command = function (id) {
    const pet = G.activePet(); if (!pet) return;
    const tr = G.TRICKS.find((t) => t.id === id);
    pet.stop(); setFocus(pet, 6);
    pet.do((function* () {
      if (U.d2(pet.pos.x, pet.pos.z, CALL.x, CALL.z) > 1.5) yield* pet.goto(CALL.x, CALL.z - 0.4, { speed: 2 });
      yield* pet.face(cam.position.x, cam.position.z); pet.lookCam = 4;
      if (['down', 'paw', 'beg'].includes(id) && pet.poseName !== 'sit') yield* pet.act('sit', 0.5);
      if (['rollover', 'dead'].includes(id) && pet.poseName !== 'lie') yield* pet.act('lie', 0.6);
      G.ui.banner(tr.name + '!', null, 900);
      yield* pet.wait(0.5);
      const ok = Math.random() < 0.55 + pet.d.mood * 0.0045;
      if (ok) { yield* pet.trick(id); pet.happy(3); pet.excite = 1; pet.d.bond = Math.min(100, pet.d.bond + 0.3); }
      else { pet.tiltT = 1.2; pet.emote('q'); yield* pet.wait(1.2); G.ui.toast(pet.name + ' seems distracted. A happier pet listens better!'); }
      yield* pet.wait(1);
    })());
  };
  function callPet(g) {
    const pet = G.activePet(); if (!pet) return;
    if (pet.ctl || (tug && tug.pet === pet)) return;
    const x = U.clamp(g.x, BX0, BX1), z = U.clamp(g.z, BZ0, BZ1);
    G.audio.play('whistle'); tutDone('call');
    if (pet.poseName === 'sleep' && pet.d.energy < 30) { pet.emote('zzz'); G.ui.toast(pet.name + ' is too sleepy...'); return; }
    if (pet.carry) pet.drop(scene);
    pet.baseY = 0; pet.emote('bang', 0.8);
    pet.do((function* () { yield* pet.goto(x, z, { speed: 2.2 }); yield* pet.face(cam.position.x, cam.position.z); pet.lookCam = 3; yield* pet.act('sit', 2); })());
    pets.forEach((o) => { if (o !== pet && !o.busy && !o.ctl && o.poseName !== 'sleep' && U.chance(0.35)) o.do((function* () { yield* o.wait(0.4); yield* o.goto(x + U.rand(-0.6, 0.6), z + U.rand(-0.3, 0.3), { speed: 1.8 }); yield* o.act('sit', 1.5); })()); });
  }
  function propTap(c) {
    G.audio.play('tick');
    switch (c) {
      case 'bowl': G.ui.feedSheet(); break;
      case 'water': H.refillWater(); break;
      case 'toybox': G.ui.toySheet(); break;
      case 'bed': { const p = G.activePet(); if (!p) break; if (p.d.energy < 75) { p.do(nap(p)); G.ui.toast(p.name + ' curls up for a nap.'); } else { p.emote('q'); G.ui.toast(p.name + ' isn’t sleepy yet.'); } break; }
      case 'window': G.ui.toast(G.timeWord() === 'night' ? 'A quiet ' + G.season() + ' night. The stars are out.' : 'A lovely ' + G.season() + ' ' + G.timeWord() + ' in Maple Hill.'); break;
      case 'frame': G.ui.toast(G.state.portrait ? 'A portrait by Sora. Masterpiece!' : 'An empty frame... Sora by the pond paints pet portraits.'); break;
      case 'shelf': G.ui.toast(G.state.trophies.length ? G.state.trophies.length + ' troph' + (G.state.trophies.length > 1 ? 'ies' : 'y') + ' won!' : 'Win Disc Cups to fill this shelf!'); break;
      case 'clock': G.ui.toast('It’s ' + U.fmtTime(new Date()) + '.'); break;
      default: break;
    }
  }
  H.refillWater = function () { G.state.water = 1; updateBowls(); G.audio.play('pour'); G.fx.spawn('drop', WATER.clone().setY(0.2), 8); G.ui.toast('Fresh water!'); };
  /* ---------------- food ---------------- */
  let treatPoint = new V3(0, 0, 1.8);
  H.useFood = function (id) {
    const it = G.ITEMS[id]; if (!it || !(G.state.inv[id] > 0)) return;
    if (it.cat === 'food') {
      G.state.inv[id]--; G.state.bowl = { food: id, amt: 1 }; updateBowls(); G.audio.play('kibble');
      G.ui.toast('Filled the bowl with ' + it.name + '.');
      pets.forEach((p) => { if (p.d.hunger < 85 && !p.ctl) { p.emote('bang', 0.8); p.do(eat(p)); } });
      return;
    }
    endModes();
    mode = 'treat'; heldTreat = id; treatPoint = new V3(0, 0, 1.6);
    G.ui.cursor(G.M.icons.item(id), innerWidth / 2, innerHeight * 0.7);
    G.ui.prompts([{ label: 'Put away', cls: 'orange', fn: () => endModes() }]);
    G.ui.hint('Tap your pet to give them the ' + it.name + '!', 3500);
    pets.forEach((p) => { if (!p.ctl && p.poseName !== 'sleep') { p.emote('bang', 0.8); p.do(treatWait(p)); } });
  };
  function* treatWait(p) {
    while (mode === 'treat') {
      const tx = treatPoint.x + (pets.indexOf(p) - pets.length / 2) * 0.5, tz = U.clamp(treatPoint.z - 0.4, BZ0, BZ1);
      if (U.d2(p.pos.x, p.pos.z, tx, tz) > 0.35) yield* p.goto(tx, tz, { speed: 1.8, timeout: 3 });
      yield* p.face(cam.position.x, cam.position.z, 0.3); p.lookCam = 1;
      p.setPose((p.d.tricks.beg || 0) >= 1 ? 'beg' : 'sit');
      yield* p.wait(0.5);
    }
  }
  function feedTreatAt(p) {
    const hp = G.pick(p, petMeshes(), false)[0];
    if (!hp) { const g = G.groundAt(p); if (g) treatPoint = g; return; }
    const pet = hp.object.userData.pet; const it = G.ITEMS[heldTreat];
    if (pet.d.hunger > 97) { pet.emote('q'); G.ui.toast(pet.name + ' is too full!'); return; }
    G.state.inv[heldTreat]--; G.state.stats.treats++;
    const id = heldTreat;
    endModes();
    const food = G.M.item(id); food.scale.setScalar(0.8);
    pet.do((function* () {
      pet.setPose('sit'); pet.m.mouth.add(food); food.scale.setScalar(0.8 / (pet.S * pet.m.headR / 0.165)); food.position.set(0, 0, 0.02);
      pet.chewT = 1.8; pet.eyeOverride = 'happy';
      for (let i = 0; i < 4; i++) { G.audio.play('munch'); yield* pet.wait(0.4); }
      pet.m.mouth.remove(food); pet.eyeOverride = null;
      pet.d.hunger = U.clamp(pet.d.hunger + it.hunger, 0, 100); pet.happy(it.mood); pet.fx('heart', 3); pet.excite = 1; pet.voice('happy');
      pet.lickT = 1.2; yield* pet.wait(1.2);
    })());
    if (praise && praise.pet === pet) doPraise();
  }
  /* ---------------- brush ---------------- */
  H.startBrush = function () {
    endModes(); mode = 'brush'; const p = G.activePet(); if (!p) return;
    p.stop(); p.do((function* () { yield* p.goto(CALL.x, CALL.z - 0.4, { speed: 1.5 }); yield* p.face(cam.position.x, cam.position.z); p.setPose('stand'); while (mode === 'brush') yield; })());
    setFocus(p, 999);
    G.ui.prompts([{ label: 'Done brushing', cls: 'orange', fn: () => endModes() }]);
    G.ui.hint('Stroke ' + p.name + '’s fur with the brush!', 3500);
  };
  /* ---------------- bath ---------------- */
  H.startBath = function () {
    const p = G.activePet(); if (!p || !(G.state.inv.shampoo > 0)) return;
    endModes(); G.state.inv.shampoo--; mode = 'bath';
    tub.visible = true; G.audio.play('splash');
    bath = { pet: p, foam: [], stage: 'scrub', last: null, t: 0 };
    p.stop(); if (p.carry) p.drop(scene);
    p.pos.set(tub.position.x, 0, tub.position.z); p.baseY = 0.16; p.heading = Math.atan2(cam.position.x - p.pos.x, cam.position.z - p.pos.z); p.setPose('stand');
    p.ctl = (pp, dt) => { pp.vel = 0; pp.moveTarget = null; pp.lookCam = 1; if (bath && bath.stage === 'scrub') pp.setPose(pp.d.personality === 'proud' && Math.random() < dt * 0.1 ? 'sit' : pp.poseName); };
    if (p.d.personality === 'proud' || p.cat) { p.emote('sweat', 2); p.voice('whine'); }
    setFocus(tub, 999);
    G.ui.hint('Rub ' + p.name + ' all over to make bubbles!', 4000);
    G.ui.prompts([{ label: 'Cancel', cls: 'orange', fn: () => finishBath(true) }]);
  };
  function bathStroke(p, start) {
    if (!bath || bath.stage !== 'scrub') return;
    const pet = bath.pet; const hit = G.pick(p, pet.m.meshes, false)[0];
    G.ui.cursor(IC.hand, p.x, p.y);
    if (!hit) return;
    pet.petT = 0; pet.petPart = 'back';
    const lp = pet.m.body.worldToLocal(hit.point.clone());
    if (start || !bath.last || bath.last.distanceTo(lp) > 0.035) {
      bath.last = lp;
      if (bath.foam.length < 70) {
        const f = new THREE.Mesh(new THREE.SphereGeometry(U.rand(0.03, 0.055), 10, 8), G.M.mat('#ffffff', { r: 1 }));
        f.position.copy(lp); pet.m.body.add(f); bath.foam.push(f); f.scale.setScalar(0.1); f.userData.s = 1;
      }
      if (Math.random() < 0.5) G.audio.play('scrub');
      if (Math.random() < 0.4) G.fx.spawn('bubble', hit.point, 1);
      if (bath.foam.length === 30) { G.ui.prompts([{ label: 'Rinse!', cls: 'pink', fn: () => rinse() }, { label: 'Cancel', cls: 'orange', fn: () => finishBath(true) }]); G.ui.hint('So bubbly! Tap Rinse when ready.', 2500); }
    }
  }
  function rinse() {
    if (!bath) return; bath.stage = 'rinse'; bath.t = 0; G.ui.prompts([]); G.audio.play('splash');
  }
  function updateBath(dt) {
    if (!bath) return;
    for (const f of bath.foam) { const target = bath.stage === 'rinse' ? 0 : f.userData.s; f.scale.setScalar(U.damp(f.scale.x, target, bath.stage === 'rinse' ? 3 : 10, dt)); }
    if (bath.stage === 'rinse') {
      bath.t += dt;
      const p = bath.pet.pos.clone(); p.y += 1.0;
      for (let i = 0; i < 3; i++) G.fx.spawn('drop', p.clone().add(new V3(U.rand(-0.3, 0.3), U.rand(0, 0.3), U.rand(-0.3, 0.3))), 1, { vel: new V3(0, -2.5, 0) });
      if (Math.random() < dt * 4) G.audio.play('pour');
      if (bath.t > 2.3) finishBath(false);
    }
  }
  function finishBath(cancel) {
    if (!bath) return; const p = bath.pet;
    for (const f of bath.foam) { p.m.body.remove(f); f.geometry.dispose(); }
    bath = null; mode = 'idle'; tub.visible = false; p.ctl = null; p.baseY = 0; G.ui.prompts([]); G.ui.cursor(null); focus = null;
    p.pos.set(0, 0, 1.9);
    if (!cancel) {
      p.d.clean = 100; p.wet = 1; p.happy(8);
      p.do((function* () { p.jump(2.6); yield* p.waitUntil(() => !p.airborne, 2); yield* p.shake(); p.fx('sparkle', 8); G.audio.play('sparkle'); G.ui.toast(p.name + ' is squeaky clean!'); p.excite = 1; yield* p.act('sit', 1.5); })());
    }
  }
  function endModes() {
    if (mode === 'treat') { pets.forEach((p) => { if (!p.ctl) p.stop(); }); }
    if (mode === 'brush') { const p = G.activePet(); if (p && !p.ctl) p.stop(); focus = null; }
    if (mode === 'bath') finishBath(true);
    if (tug) endTug(false);
    if (held) { held.inHand = false; held.rest = false; held = null; }
    mode = 'idle'; heldTreat = null; G.ui.prompts([]); G.ui.cursor(null);
  }

  /* ---------------- update ---------------- */
  let lightT = 0, clockT = 0;
  H.update = function (dt) {
    for (const p of pets) p.update(dt);
    // separation
    for (let i = 0; i < pets.length; i++) for (let j = i + 1; j < pets.length; j++) {
      const a = pets[i], b = pets[j]; if (a.ctl || b.ctl) continue;
      const dx = b.pos.x - a.pos.x, dz = b.pos.z - a.pos.z, d = Math.hypot(dx, dz), r = 0.32 * (a.S + b.S);
      if (d < r && d > 0.001) { const push = (r - d) * 0.5; a.pos.x -= dx / d * push; a.pos.z -= dz / d * push; b.pos.x += dx / d * push; b.pos.z += dz / d * push; }
    }
    updateToys(dt); updateTug(dt); updateBath(dt);
    if (praise && G.time > praise.until) { praise = null; G.ui.prompts([]); }
    if (held && !held.dragging && !G.input.down) held.mesh.rotation.y += dt * 0.8;
    // camera
    if (focus && focusUntil < G.time && mode === 'idle') focus = null;
    const base = camBase(); const look = new V3(0, 0.4, 0.35);
    let pos = look.clone().add(base.clone().sub(look).multiplyScalar(camZoom));
    if (focus) {
      const fp = focus.pos || focus.position; const portrait = G.aspect() < 0.9;
      const tl = new V3(fp.x * 0.85, (focus === tub ? 0.35 : 0.3), fp.z);
      pos = tl.clone().add(new V3(fp.x * 0.15, portrait ? 1.6 : 1.15, portrait ? 3.2 : 2.25).multiplyScalar(Math.max(0.75, camZoom)));
      look.copy(tl);
    }
    const k = focus ? 2.2 : 1.8;
    cam.position.x = U.damp(cam.position.x, pos.x, k, dt); cam.position.y = U.damp(cam.position.y, pos.y, k, dt); cam.position.z = U.damp(cam.position.z, pos.z, k, dt);
    lookV.x = U.damp(lookV.x, look.x, k, dt); lookV.y = U.damp(lookV.y, look.y, k, dt); lookV.z = U.damp(lookV.z, look.z, k, dt);
    cam.lookAt(lookV);
    lightT -= dt; if (lightT < 0) { lightT = 20; applyLighting(); }
    clockT -= dt; if (clockT < 0) { clockT = 1; const d = new Date(); clockHands.hh.rotation.z = -((d.getHours() % 12) + d.getMinutes() / 60) / 12 * Math.PI * 2; clockHands.mh.rotation.z = -(d.getMinutes() / 60) * Math.PI * 2; }
  };
  return H;
})();
