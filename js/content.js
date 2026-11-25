'use strict';
/* =========================================================
   Shiba Days — extra content: daily quests, photo album,
   nap dreams
   ========================================================= */

/* ---------------- daily quests ---------------- */
G.QUESTS = [
  { id: 'pet', text: 'Pet your pals 10 times', stat: 'pets', n: 10, reward: 40 },
  { id: 'treats', text: 'Give 3 treats', stat: 'treats', n: 3, reward: 35 },
  { id: 'walk', text: 'Go for a walk', stat: 'walks', n: 1, reward: 45 },
  { id: 'catch', text: 'Make 5 catches (disc or ball)', stat: 'catches', n: 5, reward: 60 },
  { id: 'throws', text: 'Throw toys 12 times', stat: 'throws', n: 12, reward: 40 },
  { id: 'cafe', text: 'Visit Café Pawsome', stat: 'cafe', n: 1, reward: 35 },
  { id: 'park', text: 'Visit the dog park', stat: 'park', n: 1, reward: 45 },
  { id: 'present', text: 'Find a present on a walk', stat: 'presents', n: 1, reward: 50 },
  { id: 'cup', text: 'Enter a Disc Cup', stat: 'contests', n: 1, reward: 80 },
  { id: 'photo', text: 'Take 2 photos', stat: 'photos', n: 2, reward: 30 },
  { id: 'mail', text: 'Read a letter', stat: 'mailRead', n: 1, reward: 20 },
  { id: 'baths', text: 'Give a bath or a brush', stat: 'groom', n: 1, reward: 35 },
];
G.quests = (() => {
  const Q = {};
  const key = () => new Date().toDateString();
  const stat = (k) => (G.state.stats[k] || 0);
  Q.today = function () {
    const s = G.state; const k = key();
    if (!s.quests || s.quests.day !== k) {
      const seed = Array.from(k).reduce((a, c) => a * 31 + c.charCodeAt(0) | 0, 7);
      const pool = G.QUESTS.slice(); const pick = [];
      for (let i = 0; i < 3; i++) { const j = Math.abs(seed * (i + 3) * 2654435761 | 0) % pool.length; pick.push(pool.splice(j, 1)[0]); }
      s.quests = { day: k, list: pick.map((q) => ({ id: q.id, base: stat(q.stat), done: false })), bonus: false };
    }
    return s.quests;
  };
  Q.progress = function (e) { const q = G.QUESTS.find((x) => x.id === e.id); return { q, n: Math.min(q.n, stat(q.stat) - e.base) }; };
  Q.check = function () {
    if (!G.state || !G.state.pets.length) return;
    const t = Q.today(); let changed = false;
    for (const e of t.list) {
      if (e.done) continue; const { q, n } = Q.progress(e);
      if (n >= q.n) { e.done = true; changed = true; G.state.coins += q.reward; G.audio.play('chime'); G.ui.banner('Daily quest complete!', q.text + '  +' + q.reward + ' coins', 2600); }
    }
    if (!t.bonus && t.list.every((e) => e.done)) { t.bonus = true; G.state.questDays = (G.state.questDays || 0) + 1; setTimeout(() => G.checkBreeds(), 6000); G.state.coins += 100; setTimeout(() => { G.audio.play('fanfare'); G.ui.banner('All quests done!', 'Bonus +100 coins. See you tomorrow!', 3000); G.stamp && G.stamp('quests'); }, 2800); changed = true; }
    if (changed) { G.ui.refresh && G.ui.refresh(); G.save(); }
  };
  Q.tab = function (body) {
    const t = Q.today();
    G.ui.note(body, 'Three new quests every day. Rewards are paid automatically when you finish one. Finish all three for a bonus!');
    const l = document.createElement('div'); l.className = 'list'; body.appendChild(l);
    for (const e of t.list) {
      const { q, n } = Q.progress(e);
      const row = document.createElement('div'); row.className = 'qrow' + (e.done ? ' done' : '');
      row.innerHTML = '<div class="qtxt">' + (e.done ? '✔ ' : '') + q.text + '</div><div class="qbar"><i style="width:' + Math.round(n / q.n * 100) + '%"></i></div><div class="qrew">' + n + '/' + q.n + ' · ' + q.reward + 'c</div>';
      l.appendChild(row);
    }
    if (t.bonus) G.ui.note(body, '⭐ All done today! New quests tomorrow.');
  };
  setInterval(() => { try { Q.check(); } catch (e) { /* ignore */ } }, 2500);
  return Q;
})();

/* ---------------- photo mode ---------------- */
G.photos = (() => {
  const P = {}; const KEY = 'shibadays.photos.v1';
  P.list = function () { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) { return []; } };
  P.saveList = function (l) { try { localStorage.setItem(KEY, JSON.stringify(l)); return true; } catch (e) { return false; } };
  P.request = function () { if (!G.cur || G.curName === 'title') return; P.want = true; };
  // called by the main loop right after rendering, while the frame is still in the buffer
  P.afterRender = function () {
    if (!P.want) return; P.want = false;
    const src = G.renderer.domElement; const W = 560, H = Math.round(W * src.height / src.width);
    const c = document.createElement('canvas'); c.width = W; c.height = H + 46; const x = c.getContext('2d');
    x.fillStyle = '#fff8ec'; x.fillRect(0, 0, c.width, c.height);
    try { x.drawImage(src, 0, 0, W, H); } catch (e) { return; }
    x.fillStyle = '#3b2a1f'; x.font = '700 20px Fredoka, sans-serif'; x.textBaseline = 'middle';
    const p = G.activePet(); const place = { home: 'At home', walk: 'Maple Hill', cafe: 'Café Pawsome', park: 'Maple Dog Park', frisbee: 'Disc Cup', shop: 'Maple Pets', kennel: 'Kennel', trials: 'Training Grounds' }[G.curName] || '';
    x.fillText((p ? p.name + ' · ' : '') + place, 14, H + 23);
    x.textAlign = 'right'; x.fillStyle = '#b08a6a'; x.font = '600 16px Fredoka, sans-serif'; x.fillText(new Date().toLocaleDateString(), W - 14, H + 23);
    const url = c.toDataURL('image/jpeg', 0.78);
    G.state.stats.photos = (G.state.stats.photos || 0) + 1;
    // shutter flash + sound
    const f = document.createElement('div'); f.className = 'photoFlash'; document.body.appendChild(f); setTimeout(() => f.remove(), 500);
    try { G.audio.noise(0.06, 0.3, 'highpass', 3000, 1); G.audio.noise(0.05, 0.2, 'highpass', 2000, 1, 0.09); } catch (e) { /* ignore */ }
    if (p) { p.lookCam = 2; p.emote('note', 1); }
    P.preview(url);
  };
  // small modal with a photo and buttons: [{label, cls, fn}]
  function photoModal(title, url, buttons) {
    const html = '<h2>' + U.esc(title) + '</h2><img class="photoPrev" src="' + url + '" alt="Photo"><div class="mrow">' + buttons.map((b, i) => '<button class="btn ' + (b.cls || 'ghost') + '" data-i="' + i + '">' + U.esc(b.label) + '</button>').join('') + '</div>';
    G.ui.modal(html, (m, done) => { m.querySelectorAll('.mrow button').forEach((el) => (el.onclick = () => { done(); const b = buttons[+el.dataset.i]; if (b.fn) b.fn(); })); });
  }
  P.preview = function (url) {
    photoModal('Snap!', url, [
      { label: 'Toss it' },
      { label: 'Download', fn: () => P.download(url) },
      { label: 'Keep in album', cls: 'orange', fn: () => { const l = P.list(); l.unshift({ url, t: Date.now() }); while (l.length > 12) l.pop(); if (!P.saveList(l)) { l.pop(); P.saveList(l); } G.ui.toast('Saved to your album (Stamp book → Album)'); } },
    ]);
  };
  P.download = function (url) { try { const a = document.createElement('a'); a.href = url; a.download = 'shiba-days-' + Date.now() + '.jpg'; document.body.appendChild(a); a.click(); a.remove(); } catch (e) { G.ui.toast('Downloads are blocked here. Long-press the photo to save it.'); } };
  P.tab = function (body) {
    const l = P.list();
    G.ui.note(body, l.length ? l.length + ' of 12 photos. Tap a photo to download or delete it.' : 'No photos yet! Tap the camera in the top bar to snap your pets anywhere.');
    const g = document.createElement('div'); g.className = 'album'; body.appendChild(g);
    l.forEach((ph, i) => {
      const im = document.createElement('img'); im.src = ph.url; im.title = new Date(ph.t).toLocaleString();
      im.onclick = () => { G.ui.closeSheet && G.ui.closeSheet(true); photoModal(new Date(ph.t).toLocaleDateString(), ph.url, [
        { label: 'Delete', fn: () => { const l2 = P.list(); l2.splice(i, 1); P.saveList(l2); G.ui.toast('Photo deleted'); } },
        { label: 'Download', fn: () => P.download(ph.url) },
        { label: 'Close' },
      ]); };
      g.appendChild(im);
    });
  };
  return P;
})();

/* ---------------- nap dreams ---------------- */
G.dreams = (() => {
  const D = { list: [] };
  const THEMES = [
    ['🦴', 'a giant bone'], ['🎾', 'endless tennis balls'], ['🥏', 'the perfect catch'], ['🦋', 'butterflies'],
    ['🍖', 'dinner'], ['🐿️', 'THE squirrel'], ['⭐', 'winning the cup'], ['💤', 'more sleep'], ['❤️', 'you'], ['🍰', 'cake'], ['🌙', 'the moon'], ['🐟', 'a fish'],
  ];
  function tex(icon) {
    return G.canvasTex(128, 128, (c) => {
      c.fillStyle = 'rgba(255,255,255,.95)'; c.strokeStyle = 'rgba(160,140,200,.8)'; c.lineWidth = 4;
      const puff = [[64, 58, 38], [36, 64, 22], [92, 64, 22], [50, 40, 22], [80, 42, 22]];
      c.beginPath(); for (const [x, y, r] of puff) { c.moveTo(x + r, y); c.arc(x, y, r, 0, Math.PI * 2); } c.fill();
      c.beginPath(); c.arc(30, 104, 9, 0, 7); c.fill(); c.stroke(); c.beginPath(); c.arc(16, 120, 5, 0, 7); c.fill(); c.stroke();
      c.font = '48px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(icon, 64, 58);
    });
  }
  D.show = function (pet, scene) {
    const th = U.pick(pet.cat ? THEMES.filter((t) => t[1] !== 'the perfect catch') : THEMES);
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex(th[0]), transparent: true, depthTest: false, opacity: 0 })); sp.renderOrder = 20;
    sp.scale.setScalar(0.45 * pet.S); scene.add(sp);
    D.list.push({ sp, pet, scene, t: 0, life: 4 });
    if (pet.root.parent && Math.random() < 0.35) pet.voice('whine');
    if (Math.random() < 0.25) G.ui.toast(pet.name + ' is dreaming about ' + th[1] + '...');
    pet.d.dreams = (pet.d.dreams || 0) + 1; if (pet.d.dreams >= 10) G.stamp('dream');
  };
  D.update = function (dt) {
    for (let i = D.list.length - 1; i >= 0; i--) {
      const d = D.list[i]; d.t += dt; const k = d.t / d.life;
      d.sp.position.copy(d.pet.pos).add(new V3(0.18 * d.pet.S, d.pet.sizeH + 0.25 + k * 0.15, 0));
      d.sp.material.opacity = Math.min(1, d.t * 2, (d.life - d.t) * 2);
      if (d.t >= d.life || !d.pet.root.parent || d.pet.poseName !== 'sleep') { d.scene.remove(d.sp); d.sp.material.map.dispose(); d.sp.material.dispose(); D.list.splice(i, 1); }
    }
  };
  return D;
})();

/* ---------------- secret: Dr. Kurogane's Robo Shiba ---------------- */
G.ROBO_PARTS = [
  { id: 'gear', name: 'Mainspring Gear', icon: '⚙️', hint: 'A gear sleeps where wishes are rung after dark.' },
  { id: 'bolt', name: 'Silver Bolt', icon: '🔩', hint: 'A bolt rests in the wishing fountain. Third wish of the day is the charm.' },
  { id: 'battery', name: 'Tiny Battery', icon: '🔋', hint: 'My battery is powering a little TV game. Ten points should shake it loose.' },
  { id: 'antenna', name: 'Star Antenna', icon: '📡', hint: 'The antenna fell from the strange light. The stargazer saw it — keep asking her what’s strange.' },
  { id: 'chip', name: 'Memory Chip', icon: '💾', hint: 'A chip got mixed into the capsule machine by mistake. Keep spinning!' },
];
G.robo = {
  st() { const s = G.state; s.robo = s.robo || { parts: {} }; s.robo.parts = s.robo.parts || {}; return s.robo; },
  has(id) { return !!this.st().parts[id]; },
  count() { return Object.keys(this.st().parts).length; },
  give(id) {
    const r = this.st(); if (r.parts[id]) return false; const part = G.ROBO_PARTS.find((p) => p.id === id); if (!part) return false;
    r.parts[id] = Date.now(); const n = this.count();
    G.audio.play('robopart'); G.ui.banner('Robo Part found! (' + n + '/5)', part.icon + ' ' + part.name, 3200);
    G.state.mail = G.state.mail || [];
    if (n === 1) G.state.mail.unshift({ id: 'robo_letter', from: 'Dr. Kurogane', subject: 'Did you find my gear?!', body: 'Dear finder,\n\nThat ' + part.name.toLowerCase() + ' you found belongs to me! I’m a retired toymaker, and my greatest invention — a little robot Shiba — fell apart when I tripped over a cat. Five parts scattered across Maple Hill. If you can find them all, he’s yours to keep.\n\nWhere I think they went:\n• ' + G.ROBO_PARTS.map((p) => p.icon + ' ' + p.hint).join('\n• ') + '\n\nYou can check your progress in the kennel and in the Stamp book (Breeds). Good luck!\n\n— Dr. Kurogane\n\nP.S. He beeps when he’s happy. It’s adorable.', day: G.today(), read: false });
    if (n >= 5) { G.stamp('robo'); setTimeout(() => { G.checkBreeds(); }, 3600); }
    G.ui.refresh && G.ui.refresh(); G.save(); return true;
  },
};
