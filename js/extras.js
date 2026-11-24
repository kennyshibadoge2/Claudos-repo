'use strict';
/* =========================================================
   Shiba Days — world detail: weather, holidays, stamps, mail,
   TV channels, capsule toys, fortunes, secrets
   ========================================================= */

/* ---------------- extra sounds ---------------- */
(() => {
  const A = G.audio; const S = A.S; const T = (...a) => A.tone(...a), N = (...a) => A.noise(...a);
  S.call = () => { T('sine', 880, 1180, 0.12, 0.14); T('sine', 1180, 990, 0.18, 0.14, 0.14); };
  S.quack = () => { T('sawtooth', 520, 380, 0.12, 0.08); N(0.1, 0.06, 'bandpass', 900, 2); };
  S.sneeze = () => { T('triangle', 900, 1400, 0.2, 0.1); N(0.18, 0.3, 'highpass', 2500, 0.6, 0.22); };
  S.clunk = () => { T('sine', 140, 70, 0.18, 0.35); N(0.08, 0.2, 'lowpass', 500, 1); };
  S.capsule = () => { for (let i = 0; i < 6; i++) T('square', 600 + i * 40, 620 + i * 40, 0.03, 0.04, i * 0.06); T('sine', 1200, 1600, 0.15, 0.1, 0.45); };
  S.tvclick = () => { T('square', 2000, 2000, 0.01, 0.05); N(0.25, 0.1, 'bandpass', 3000, 0.4, 0.01); };
  S.jingle = () => { [784, 988, 1175, 988, 1319].forEach((f, i) => T('triangle', f, f, 0.12, 0.08, i * 0.1)); };
  S.stamp = () => { T('sine', 180, 90, 0.1, 0.35); [1047, 1319, 1568].forEach((f, i) => T('triangle', f, f, 0.25, 0.08, 0.12 + i * 0.07)); };
  S.shrine = () => { T('sine', 660, 660, 1.4, 0.12); T('sine', 990, 990, 1.0, 0.05); T('sine', 1320, 1320, 0.7, 0.03); };
  S.coins = () => { for (let i = 0; i < 4; i++) T('square', 1600 + Math.random() * 600, 1700, 0.04, 0.04, i * 0.07); };
  S.ufo = () => { const t = A.now(); const o = A.ctx.createOscillator(); o.type = 'sine'; o.frequency.value = 500; const l = A.ctx.createOscillator(); l.frequency.value = 7; const lg = A.ctx.createGain(); lg.gain.value = 180; l.connect(lg); lg.connect(o.frequency); const g = A.ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.08, t + 0.3); g.gain.exponentialRampToValueAtTime(0.0001, t + 2.2); o.connect(g); g.connect(A.sfx()); o.start(t); l.start(t); o.stop(t + 2.3); l.stop(t + 2.3); };
  S.blip = () => T('square', 660, 990, 0.06, 0.05);
  S.gameover = () => { [523, 392, 330, 262].forEach((f, i) => T('square', f, f, 0.12, 0.05, i * 0.12)); };
  S.poof = () => N(0.3, 0.15, 'bandpass', 700, 0.8);
})();

/* ---------------- calendar, weather, moon ---------------- */
G.dateSeed = (off = 0) => { const d = new Date(Date.now() + off * 864e5); return d.getFullYear() * 400 + d.getMonth() * 32 + d.getDate(); };
G.weather = function (off = 0) {
  if (G.forceWeather && !off) return G.forceWeather;
  const r = U.hash(G.dateSeed(off), 1.7, 2.3); const s = G.season();
  if (s === 'winter') return r < 0.3 ? 'snow' : r < 0.55 ? 'cloudy' : 'sunny';
  return r < 0.16 ? 'rain' : r < 0.4 ? 'cloudy' : 'sunny';
};
G.temp = function (off = 0) { const base = { spring: 16, summer: 28, autumn: 17, winter: 4 }[G.season()]; return Math.round(base + (U.hash(G.dateSeed(off), 5, 9) - 0.5) * 8 - (G.weather(off) === 'rain' ? 3 : 0)); };
G.moonPhase = function () { const days = (Date.now() - Date.UTC(2000, 0, 6, 18, 14)) / 864e5; return ((days % 29.530588) + 29.530588) % 29.530588 / 29.530588; };
G.fullMoon = () => Math.abs(G.moonPhase() - 0.5) < 0.04;
G.holiday = function () {
  const d = new Date(), m = d.getMonth() + 1, day = d.getDate();
  if (m === 10 && day >= 24) return 'halloween';
  if (m === 12 && day >= 18 && day <= 26) return 'xmas';
  if ((m === 12 && day === 31) || (m === 1 && day <= 3)) return 'newyear';
  if (m === 2 && day >= 10 && day <= 14) return 'valentine';
  if (m === 4 && day <= 12) return 'hanami';
  if (m === 7 && day === 7) return 'tanabata';
  if (m === 11 && day === 1) return 'dogday';
  return null;
};
G.HOLIDAY_NAMES = { halloween: 'Halloween', xmas: 'the holidays', newyear: 'New Year', valentine: 'Valentine’s week', hanami: 'cherry blossom season', tanabata: 'Tanabata', dogday: 'Dog Day' };

/* ---------------- stamps (achievements) ---------------- */
G.STAMPS = [
  { id: 'first', name: 'Hello, friend', desc: 'Adopt your first pet.', coins: 20 },
  { id: 'quests', name: 'Busy bee', desc: 'Finish all three daily quests in one day.', coins: 50 },
  { id: 'tug', name: 'Tug champion', desc: 'Win a tug of war at a Disc Cup.', coins: 40 },
  { id: 'dream', name: 'Sweet dreams', desc: 'Watch your pet dream 10 times.', coins: 30, secret: true },
  { id: 'pets100', name: 'Gentle hands', desc: 'Give 100 pets.', coins: 30 },
  { id: 'pets1000', name: 'Professional petter', desc: 'Give 1,000 pets.', coins: 150 },
  { id: 'named', name: 'That’s me!', desc: 'Teach a pet its name.', coins: 30 },
  { id: 'trick', name: 'Good job!', desc: 'Teach your first trick.', coins: 30 },
  { id: 'tricks5', name: 'Show-off', desc: 'Teach one pet five tricks.', coins: 80 },
  { id: 'walk', name: 'First steps', desc: 'Go on a walk.', coins: 20 },
  { id: 'walk20', name: 'Neighborhood regular', desc: 'Go on 20 walks.', coins: 120 },
  { id: 'present10', name: 'Treasure nose', desc: 'Dig up 10 presents.', coins: 80 },
  { id: 'bath', name: 'Squeaky clean', desc: 'Give a bath.', coins: 25 },
  { id: 'flying', name: 'Air time', desc: 'Make a flying catch.', coins: 40 },
  { id: 'cup', name: 'Champion', desc: 'Win any Disc Cup.', coins: 60 },
  { id: 'champ', name: 'Legend of the disc', desc: 'Win the Champions Cup.', coins: 500 },
  { id: 'agility', name: 'Zoom zoom', desc: 'Win an agility trial.', coins: 60 },
  { id: 'obedience', name: 'Model citizen', desc: 'Win an obedience trial.', coins: 60 },
  { id: 'full', name: 'Full house', desc: 'Live with four pets.', coins: 100 },
  { id: 'cat', name: 'Cat person', desc: 'Adopt a cat.', coins: 30 },
  { id: 'frog', name: 'Ribbit', desc: 'Wear the frog hat.', coins: 20 },
  { id: 'fashion', name: 'Fashionista', desc: 'Wear a hat, neckwear and glasses at once.', coins: 50 },
  { id: 'portrait', name: 'Masterpiece', desc: 'Get a portrait painted.', coins: 40 },
  { id: 'race', name: 'Faster than snow', desc: 'Beat Blizzard in a race.', coins: 50 },
  { id: 'nori', name: 'Street cat’s friend', desc: 'Earn Nori’s trust.', coins: 50 },
  { id: 'cafe5', name: 'Café regular', desc: 'Order 5 things at Paw & Bean.', coins: 40 },
  { id: 'social', name: 'Social butterfly', desc: 'Chat with everyone in Maple Hill.', coins: 80 },
  { id: 'mail10', name: 'Pen pal', desc: 'Read 10 letters.', coins: 40 },
  { id: 'capsule', name: 'Capsule collector', desc: 'Collect 6 capsule figures.', coins: 80 },
  { id: 'capsuleAll', name: 'Complete set', desc: 'Collect every capsule figure.', coins: 300 },
  { id: 'bones', name: 'Golden nose', desc: 'Find all 8 golden bones.', coins: 200 },
  { id: 'fortune', name: 'Great blessing', desc: 'Draw the best fortune at the shrine.', coins: 30 },
  { id: 'retro', name: 'Retro gamer', desc: 'Score 25 in Shiba Dash on TV.', coins: 50 },
  { id: 'citizen', name: 'Good citizen', desc: 'Clean up after your dog 10 times.', coins: 50 },
  { id: 'konami', name: 'Up, up, down, down', desc: 'A very old code.', secret: true, coins: 77 },
  { id: 'doge', name: 'Such stamp', desc: 'Very secret. Wow.', secret: true, coins: 69 },
  { id: 'moon', name: 'Moon song', desc: 'Howl at a full moon.', secret: true, coins: 60 },
  { id: 'ufo', name: 'I want to believe', desc: 'Spot something strange in the night sky.', secret: true, coins: 100 },
  { id: 'ghost', name: 'Friendly spirit', desc: 'Meet a visitor at the kennel after midnight.', secret: true, coins: 100 },
  { id: 'tail', name: 'Round and round', desc: 'Catch your pup chasing their own tail.', secret: true, coins: 40 },
  { id: 'sneeze', name: 'Bless you!', desc: 'Boop a nose too many times.', secret: true, coins: 30 },
  { id: 'wish', name: 'Make a wish', desc: 'Look out the window at 11:11.', secret: true, coins: 111 },
  { id: 'chestnut', name: 'The Flying Chestnut', desc: 'Learn Kuri’s secret.', secret: true, coins: 80 },
  { id: 'squirrel', name: 'SQUIRREL!', desc: 'Say the forbidden word.', secret: true, coins: 30 },
  { id: 'moonwink', name: 'Knock knock', desc: 'Someone up there noticed you.', secret: true, coins: 50 },
  { id: 'fountain', name: 'Wish granted', desc: 'Get lucky at the fountain.', secret: true, coins: 0 },
];
G.stamp = function (id) {
  const s = G.state; s.stamps = s.stamps || {};
  if (s.stamps[id]) return false;
  const st = G.STAMPS.find((x) => x.id === id); if (!st) return false;
  s.stamps[id] = Date.now();
  setTimeout(() => { G.audio.play('stamp'); G.ui.toast('Stamp get! “' + st.name + '”' + (st.coins ? ' +' + st.coins + ' coins' : ''), 'gold'); if (st.coins) { s.coins += st.coins; G.ui.refresh(); } }, 250);
  G.save(); return true;
};
G.checkStamps = function () {
  const s = G.state; if (!s || !s.pets) return; const st = s.stats;
  if (s.pets.length) G.stamp('first');
  if (st.pets >= 100) G.stamp('pets100'); if (st.pets >= 1000) G.stamp('pets1000');
  if (s.pets.some((p) => (p.nameLearn || 0) >= 1)) G.stamp('named');
  if (s.pets.some((p) => Object.values(p.tricks).some((v) => v >= 1))) G.stamp('trick');
  if (s.pets.some((p) => Object.values(p.tricks).filter((v) => v >= 1).length >= 5)) G.stamp('tricks5');
  if (st.walks >= 1) G.stamp('walk'); if (st.walks >= 20) G.stamp('walk20');
  if (st.presents >= 10) G.stamp('present10');
  if (s.pets.length >= 4) G.stamp('full'); if (s.pets.some((p) => p.breed === 'cat')) G.stamp('cat');
  if (s.pets.some((p) => p.acc.head === 'frog')) G.stamp('frog');
  if (s.pets.some((p) => p.acc.head && p.acc.neck && p.acc.face)) G.stamp('fashion');
  if (s.portrait) G.stamp('portrait');
  if (s.npc.nori && s.npc.nori.fed >= 3) G.stamp('nori');
  if ((st.cafe || 0) >= 5) G.stamp('cafe5');
  if (['hana', 'ogawa', 'kids', 'rina', 'kenji', 'pip', 'sora', 'kato'].every((k) => s.npc[k] && s.npc[k].flags && s.npc[k].flags.met !== undefined || (s.npc[k] && s.npc[k].talked))) G.stamp('social');
  if ((st.mailRead || 0) >= 10) G.stamp('mail10');
  const caps = Object.keys(s.capsules || {}).length; if (caps >= 6) G.stamp('capsule'); if (caps >= G.CAPSULES.length) G.stamp('capsuleAll');
  if (Object.keys(s.bones || {}).length >= 8) G.stamp('bones');
  if ((st.poop || 0) >= 10) G.stamp('citizen');
  if ((s.retroHigh || 0) >= 25) G.stamp('retro');
  if (s.trophies.some((t) => t.place === 1 && G.CONTESTS.some((c) => c.id === t.cls))) G.stamp('cup');
  if (s.trophies.some((t) => t.place === 1 && t.cls === 'champ')) G.stamp('champ');
  if (s.trophies.some((t) => t.place === 1 && t.kind === 'agility')) G.stamp('agility');
  if (s.trophies.some((t) => t.place === 1 && t.kind === 'obedience')) G.stamp('obedience');
};
G.ui.stampSheet = function () {
  G.ui.sheet({ title: 'Stamp book', tabs: [{ id: 'quests', name: 'Daily' }, { id: 'stamps', name: 'Stamps' }, { id: 'album', name: 'Album' }, { id: 'caps', name: 'Capsules' }, { id: 'stats', name: 'Records' }], render(body, tab) {
    const s = G.state; s.stamps = s.stamps || {};
    if (tab === 'quests') { G.quests.tab(body); return; }
    if (tab === 'album') { G.photos.tab(body); return; }
    if (tab === 'stamps') {
      const got = G.STAMPS.filter((x) => s.stamps[x.id]).length;
      G.ui.note(body, got + ' of ' + G.STAMPS.length + ' stamps. Secret stamps show as ??? until you find them.');
      const g = G.ui.grid(body);
      G.STAMPS.forEach((st) => {
        const have = !!s.stamps[st.id]; const hidden = st.secret && !have;
        const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="32" cy="32" r="27" fill="' + (have ? (st.secret ? '#7a5cff' : '#e2574c') : '#e8dcc8') + '" stroke="' + (have ? '#fff' : '#d2c2a8') + '" stroke-width="4" stroke-dasharray="4 3"/>' + (have ? '<path d="M32 15l5 11 12 1.5-9 8 2.6 12L32 41.5 21.4 47.5 24 35.5l-9-8 12-1.5z" fill="#fff"/>' : '<text x="32" y="41" font-size="26" text-anchor="middle" fill="#bfae92" font-family="sans-serif" font-weight="700">?</text>') + '</svg>';
        g.appendChild(G.ui.card({ img: 'data:image/svg+xml;utf8,' + encodeURIComponent(svg), name: hidden ? '???' : st.name, sub: hidden ? 'A secret...' : st.desc, dim: !have }));
      });
    } else if (tab === 'caps') {
      const caps = s.capsules || {};
      G.ui.note(body, Object.keys(caps).length + ' of ' + G.CAPSULES.length + ' figures. Find the capsule machine next to Maple Pets on your walk (30 coins a spin). Collected figures sit on your windowsill.');
      const g = G.ui.grid(body);
      G.CAPSULES.forEach((c) => g.appendChild(G.ui.card({ img: caps[c.id] ? G.M.icons.raw(G.M.capsuleFig(c.id), 'cap:' + c.id) : 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="32" cy="36" r="20" fill="#e8dcc8"/><path d="M12 36a20 20 0 0140 0z" fill="#d2c2a8"/></svg>'), name: caps[c.id] ? c.name : '???', sub: caps[c.id] ? c.desc + (caps[c.id] > 1 ? ' (x' + caps[c.id] + ')' : '') : c.rare ? 'Rare!' : '', dim: !caps[c.id] })));
    } else {
      const st = s.stats; const kv = document.createElement('div'); kv.className = 'kv';
      const rows = [['Days in Maple Hill', s.day], ['Pets given', st.pets], ['Walks', st.walks], ['Presents found', st.presents], ['Treats given', st.treats], ['Disc throws', st.throws], ['Catches', st.catches], ['Contests entered', st.contests], ['Trophies', s.trophies.length], ['Letters read', st.mailRead || 0], ['Golden bones', Object.keys(s.bones || {}).length + '/8'], ['Shiba Dash best', s.retroHigh || 0], ['Clean-ups', st.poop || 0]];
      kv.innerHTML = rows.map(([k, v]) => '<b>' + U.esc(k) + '</b><span>' + U.esc(v) + '</span>').join(''); body.appendChild(kv);
    }
  } });
};

/* ---------------- capsule toys ---------------- */
G.CAPSULES = [
  { id: 'kuri', name: 'Mini Kuri', desc: 'A sesame shiba. Very dignified.', pet: ['shiba', 'sesame'] },
  { id: 'biscuit', name: 'Mini Biscuit', desc: 'Holding a stolen sock.', pet: ['corgi', 'corgi'] },
  { id: 'blizzard', name: 'Mini Blizzard', desc: 'Never lost a race (allegedly).', pet: ['husky', 'husky'] },
  { id: 'dango', name: 'Mini Dango', desc: 'Snores even as a figure.', pet: ['pug', 'pug'] },
  { id: 'nori', name: 'Mini Nori', desc: 'Glares at you. Lovingly.', pet: ['cat', 'black'] },
  { id: 'matcha', name: 'Mini Matcha', desc: 'Asleep on a tiny cushion.', pet: ['cat', 'grey'] },
  { id: 'daruma', name: 'Daruma', desc: 'Paint one eye when you make a wish.' },
  { id: 'lucky', name: 'Lucky Cat', desc: 'Waves good fortune your way.' },
  { id: 'onigiri', name: 'Onigiri', desc: 'Do not feed to dogs. It’s plastic.' },
  { id: 'duck', name: 'Pond Duck', desc: 'From the pond. Says quack (it doesn’t).' },
  { id: 'golden', name: 'Golden Shiba', desc: 'Ultra rare! Shines like the sun.', pet: ['shiba', 'cream'], rare: true },
  { id: 'ufo', name: 'Tiny UFO', desc: 'Where did this come from?', rare: true },
];
G.M.capsuleFig = function (id) {
  const c = G.CAPSULES.find((x) => x.id === id); const g = new THREE.Group(); const M = G.M;
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.12, 0.03, 20), M.mat('#fff7ea')); base.position.y = 0.015; g.add(base);
  if (c.pet) {
    const P = M.pet({ breed: c.pet[0], coat: c.pet[1] }); P.rig.scale.multiplyScalar(0.38); P.root.position.y = 0.03; g.add(P.root);
    if (id === 'golden') P.root.traverse((o) => { if (o.isMesh && o.material && o.material.vertexColors) o.material = M.mat('#f2c24b', { r: 0.25, m: 0.85 }); });
    if (id === 'biscuit') { const sock = new THREE.Mesh(new THREE.CapsuleGeometry(0.012, 0.04, 4, 8), M.mat('#e2574c')); sock.rotation.z = Math.PI / 2; P.m.mouth.add(sock); }
  } else if (id === 'daruma') {
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.08, 20, 16), M.mat('#e2574c', { r: 0.4 })); b.scale.y = 1.1; b.position.y = 0.11; g.add(b);
    const f = new THREE.Mesh(new THREE.CircleGeometry(0.045, 20), M.mat('#fff7ea')); f.position.set(0, 0.13, 0.078); g.add(f);
    const e = new THREE.Mesh(new THREE.SphereGeometry(0.009, 8, 6), M.mat('#111')); e.position.set(-0.016, 0.14, 0.082); g.add(e);
  } else if (id === 'lucky') {
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.06, 16, 12), M.mat('#fff7ea', { r: 0.4 })); b.position.y = 0.09; b.scale.y = 1.2; g.add(b);
    const h = new THREE.Mesh(new THREE.SphereGeometry(0.05, 16, 12), M.mat('#fff7ea', { r: 0.4 })); h.position.y = 0.18; g.add(h);
    for (const s of [-1, 1]) { const ear = new THREE.Mesh(new THREE.ConeGeometry(0.018, 0.035, 8), M.mat('#fff7ea')); ear.position.set(s * 0.03, 0.225, 0); g.add(ear); }
    const paw = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 6), M.mat('#fff7ea')); paw.position.set(0.05, 0.2, 0.02); g.add(paw);
    const coin = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.006, 16), M.mat('#f2c24b', { m: 0.8, r: 0.3 })); coin.rotation.x = Math.PI / 2; coin.position.set(0, 0.09, 0.06); g.add(coin);
  } else if (id === 'onigiri') {
    const r = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.12, 3), M.mat('#fffaf2', { r: 0.9 })); r.position.y = 0.09; r.rotation.y = Math.PI / 6; r.scale.z = 0.5; g.add(r);
    const n = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.04, 0.05), M.mat('#1f2a24')); n.position.y = 0.05; g.add(n);
  } else if (id === 'duck') { const d = M.item('duck'); d.scale.setScalar(1.4); d.position.y = 0.08; g.add(d); }
  else if (id === 'ufo') {
    const s = new THREE.Mesh(new THREE.SphereGeometry(0.1, 20, 8), M.mat('#c9d2dc', { m: 0.8, r: 0.3 })); s.scale.y = 0.3; s.position.y = 0.12; g.add(s);
    const d = new THREE.Mesh(new THREE.SphereGeometry(0.045, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), M.mat('#9fe08a', { op: 0.7, r: 0.1 })); d.position.y = 0.13; g.add(d);
  }
  return g;
};
G.spinCapsule = function () {
  if (G.state.coins < 30) { G.ui.toast('A spin costs 30 coins.'); return null; }
  G.state.coins -= 30; G.audio.play('capsule');
  const r = Math.random(); let pool = G.CAPSULES.filter((c) => !c.rare);
  if (r < 0.06) pool = G.CAPSULES.filter((c) => c.rare);
  const c = U.pick(pool); G.state.capsules = G.state.capsules || {}; G.state.capsules[c.id] = (G.state.capsules[c.id] || 0) + 1;
  G.ui.refresh(); G.save(); return c;
};

/* ---------------- fortunes ---------------- */
G.FORTUNES = [
  { t: 'Great blessing', d: 'Presents sparkle brighter today. Your pup’s tail cannot be stopped.', luck: 2 },
  { t: 'Blessing', d: 'A good day for walks and new tricks.', luck: 1 },
  { t: 'Middle blessing', d: 'Someone in town has a treat for you. Maybe.', luck: 1 },
  { t: 'Small blessing', d: 'Small joys: a warm nap spot, a fresh bowl of water.', luck: 0 },
  { t: 'Future blessing', d: 'Patience. Even the oldest shiba was once a puppy.', luck: 0 },
  { t: 'Curse (mild)', d: 'You may step on a squeaky toy at night. Tie this paper to the tree to leave it behind.', luck: -1 },
];

/* ---------------- daily mail & gazette ---------------- */
G.COMIC = [
  'Biscuit finds a sock. Biscuit hides the sock. Hana finds the sock. Biscuit is betrayed.',
  'Biscuit finds TWO socks. "A matching pair," says Biscuit. Nobody knows where the second one came from.',
  'A mysterious sock appears on the pond. The ducks deny everything.',
  'Biscuit tries to bury a sock in the sandbox. Strikes oil. (It was a juice box.)',
  'The great sock heist: Biscuit vs. the laundry basket. The basket wins. For now.',
  'Mr. Ogawa’s left slipper has vanished. Kuri looks innocent. Kuri is not innocent.',
  'Biscuit retires from sock theft. The next day: three socks. Retirement lasted four hours.',
];
G.HEADLINES = [
  'Paw & Bean unveils new latte art: "Corgi Loaf" still in development',
  'Local ducks unionize, demand more bread crumbs',
  'Maple Pets reports frog hat shortage; "Ribbit," says manager',
  'Fountain coin collection donated to the dog park fund',
  'Mrs. Kato’s pug wins "Loudest Snore" for third year running',
  'Squirrel sightings up 40%, local dogs "on high alert"',
  'Mail carrier Pip delivers 10,000th letter, celebrates with a nap',
  'Mystery of the vanishing socks deepens',
  'Shrine fortunes "unusually optimistic" this week, priest says',
  'Kenji’s street concert draws record crowd of 3 people and 7 dogs',
  'Study: 9 out of 10 shibas prefer being outside the bath',
  'Rumors of a UFO over Maple Hill dismissed as "a very shiny frisbee"',
  'Sora’s pond painting sells for 4 coins and a sandwich',
];
G.genMail = function () {
  const s = G.state; s.mail = s.mail || []; s.stats.mailRead = s.stats.mailRead || 0;
  if (s.mailDay === G.today()) return 0;
  const first = !s.mailDay; s.mailDay = G.today(); s.comicN = (s.comicN || 0) + (first ? 0 : 1);
  const pet = G.state.pets[0]; const pn = pet ? pet.name : 'your pup';
  const add = (m) => { m.id = 'm' + Date.now() + Math.random().toString(36).slice(2, 6); m.day = G.today(); m.read = false; s.mail.unshift(m); };
  const w = G.weather(), w1 = G.weather(1);
  const heads = [U.pick(G.HEADLINES), U.pick(G.HEADLINES.filter((h) => true))];
  const last = s.trophies[s.trophies.length - 1];
  if (last && Date.now() - last.date < 2 * 864e5) heads.unshift('Local ' + (G.petById(last.pet) || { name: pn }).name + ' takes ' + ['', '1st', '2nd', '3rd'][last.place] + ' place at the ' + ((G.CONTESTS.find((c) => c.id === last.cls) || {}).name || 'trials') + '!');
  if (G.holiday()) heads.unshift('Maple Hill celebrates ' + G.HOLIDAY_NAMES[G.holiday()] + '!');
  add({ from: 'Maple Hill Gazette', kind: 'paper', subject: 'Today’s Gazette', body: 'HEADLINES\n• ' + heads.slice(0, 3).join('\n• ') + '\n\nWEATHER\nToday: ' + w + ', ' + G.temp() + '°. Tomorrow: ' + w1 + ', ' + G.temp(1) + '°.\n\nSHIBA FACT\n' + U.pick(G.FACTS) + '\n\nCOMIC: "Biscuit & the Socks" #' + (s.comicN + 1) + '\n' + G.COMIC[s.comicN % G.COMIC.length] });
  if (first) { add({ from: 'Maple Hill Town Hall', subject: 'Welcome to Maple Hill!', body: 'Dear new neighbor,\n\nWelcome to Maple Hill, the friendliest little town for pets and their people. Please enjoy our park, our café, and our very shiny fountain.\n\nEnclosed is a welcome gift. Please pick up after your dog.\n\n— The Mayor (and the Mayor’s cat)', gift: { item: 'jerky', n: 3 } }); return s.mail.filter((m) => !m.read).length; }
  const friends = ['hana', 'ogawa', 'kato', 'pip', 'kenji', 'sora', 'rina'].filter((k) => s.npc[k] && (s.npc[k].f || 0) >= 2);
  if (friends.length && U.chance(0.75)) {
    const k = U.pick(friends); const notes = {
      hana: ['Biscuit says hi! (He stole my sock again.) See you at the field!', 'I saw ' + pn + ' at the park, so cute! Practice those flying catches!'],
      ogawa: ['The sparrows were especially loud this morning. Kuri barked at them once, then went back to sleep. A good day.', 'A shiba is patient until it is not. Treat yours well.'],
      kato: ['I baked biscuits. Udon ate six. Dango ate seven. These ones survived.', 'Dango and Udon send their regards and a little snack.'],
      pip: ['This is a letter about letters. I had a slow day. Here’s a treat for reading it.', 'Did you know I walk 12 km a day? My feet send their regards.'],
      kenji: ['Wrote a new song: "' + pn + ' Blues". It’s actually very happy. Come hear it!', 'Thanks for the duet! ' + pn + ' has real stage presence.'],
      sora: ['I painted the pond at sunrise today. Pink and gold, like ' + pn + '’s ears in the morning light.', 'Colors look different after a walk with a good dog. Have you noticed?'],
      rina: ['Blizzard did 5 laps today. I did 3 and a half. Rematch soon?', 'Hydrate! Both of you!'],
    }[k];
    add({ from: G.NPCS[k].name, subject: U.pick(['A little note', 'Hello!', 'From your neighbor']), body: U.pick(notes) + '\n\n— ' + G.NPCS[k].name, gift: U.chance(0.7) ? { item: U.pick(['biscuit', 'jerky', 'potato', 'salmon']), n: 1 } : null });
  }
  if (U.chance(0.45)) {
    const ads = [
      ['Maple Pets', 'Frog Hat restock!', 'Ribbit ribbit. Ribbit. (Translation: FROG HATS ARE BACK.)\nShow this letter for a small thank-you.', { coins: 15 }],
      ['Paw & Bean Café', 'Happy hour', 'Every day is happy hour when your dog gets a pup-cup. Enclosed: a coupon worth 15 coins.', { coins: 15 }],
      ['SqueakMaster Inc.', 'The SQUEAKMASTER 3000', 'The world’s squeakiest toy. Tested on 400 dogs. 399 approved. (One was a cat.)\nNot sold in stores. Not sold anywhere, actually.', null],
      ['Maple Hill Disc Club', 'Disc Cup season is here', 'Think your pup can fly? Prove it at the Disc Cup Field, north side of the loop. Flying catches score x1.5!', null],
      ['Maple Hill Shrine', 'Draw your fortune', 'Visit the little shrine in the park for today’s fortune. Great blessings rumored this week.', null],
    ];
    const a = U.pick(ads); add({ from: a[0], kind: 'ad', subject: a[1], body: a[2], gift: a[3] });
  }
  if (U.chance(0.22)) {
    const hints = ['The moon has a face, if you knock five times.', 'Golden things glint in the oddest corners: behind the shrine, under the oak, beside the kennel wall...', 'Old dogs know secrets. Ask Mr. Ogawa again. And again. And again.', 'Up, up, down, down... you know the rest.', 'They say a ghost pup plays at the kennel after midnight. It only wants a pat.', 'Watch the sky over the hills on a clear night. Bring a dog with a loud bark.', 'At 11:11, look out the window and make a wish.', 'Never, ever say the S-word near a dog. (Squ...)'];
    add({ from: '???', kind: 'secret', subject: 'A mysterious letter', body: 'The envelope smells faintly of fish. Inside, in tiny paw-shaped handwriting:\n\n"' + U.pick(hints) + '"' });
  }
  for (const p of s.pets) { const age = Math.floor((Date.now() - p.born) / 864e5); if (age > 0 && age % 30 === 0) add({ from: 'Everyone in Maple Hill', subject: 'Happy ' + age / 30 + '-month pupday, ' + p.name + '!', body: 'Wishing ' + p.name + ' a very happy pupday! Enjoy a cake on us.', gift: { item: 'cake', n: 1 } }); }
  if (s.mail.length > 40) s.mail.length = 40;
  return s.mail.filter((m) => !m.read).length;
};
G.ui.mailSheet = function () {
  G.ui.sheet({ title: 'Mailbox', render(body) {
    const s = G.state; const mail = s.mail || [];
    if (!mail.length) { G.ui.note(body, 'No mail yet. New letters arrive every day.'); return; }
    const l = G.ui.list(body);
    mail.forEach((m) => l.appendChild(G.ui.li({ icon: m.kind === 'paper' ? 'menu' : m.kind === 'secret' ? 'q' : 'chat', title: (m.read ? '' : '• ') + m.subject, sub: m.from + (m.gift && !m.claimed ? ' · gift enclosed!' : ''), fn: () => G.ui.letter(m) })));
  }, onClose: () => G.ui.refreshMail && G.ui.refreshMail() });
};
G.ui.letter = function (m) {
  if (!m.read) { m.read = true; G.state.stats.mailRead = (G.state.stats.mailRead || 0) + 1; }
  G.ui.sheet({ title: m.subject, render(body) {
    const paper = document.createElement('div');
    paper.style.cssText = 'background:#fffdf6;border-radius:14px;padding:18px 18px 22px;box-shadow:0 3px 0 rgba(90,55,30,.12);white-space:pre-wrap;line-height:1.55;font-size:16px;background-image:repeating-linear-gradient(#fffdf6 0 25px,#f0e6d2 25px 26px);' + (m.kind === 'secret' ? 'font-style:italic;' : '');
    paper.textContent = 'From: ' + m.from + '\n\n' + m.body; body.appendChild(paper);
    const r = document.createElement('div'); r.className = 'mrow';
    if (m.gift && !m.claimed) { const b = document.createElement('button'); b.className = 'btn orange'; b.textContent = m.gift.item ? 'Take ' + G.ITEMS[m.gift.item].name + (m.gift.n > 1 ? ' x' + m.gift.n : '') : 'Take ' + m.gift.coins + ' coins'; b.onclick = () => { m.claimed = true; if (m.gift.item) { G.addItem(m.gift.item, m.gift.n || 1); G.audio.play('gift'); G.ui.toast('Got ' + G.ITEMS[m.gift.item].name + '!', 'gold'); } else G.addCoins(m.gift.coins); G.ui.letter(m); }; r.appendChild(b); }
    const back = document.createElement('button'); back.className = 'btn ghost'; back.textContent = 'Back to mailbox'; back.onclick = () => G.ui.mailSheet(); r.appendChild(back);
    body.appendChild(r);
  }, onClose: () => G.ui.refreshMail && G.ui.refreshMail() });
  G.save();
};

/* ---------------- contextual small talk ---------------- */
G.smallTalk = function (key, pet) {
  const lines = []; const n = pet ? pet.name : 'your pup'; const w = G.weather(); const h = G.holiday(); const acc = pet ? pet.d.acc : {};
  if (w === 'rain') lines.push('What a rainy day! ' + n + ' doesn’t seem to mind the puddles.', 'Rain, rain... at least the flowers are happy.');
  if (w === 'snow') lines.push('Snow! ' + n + ' looks like a toasted marshmallow out here.', 'Watch your step, the path is slippery!');
  if (w === 'sunny' && G.timeWord() !== 'night') lines.push('Perfect weather for a walk, isn’t it?');
  if (G.timeWord() === 'night') lines.push('Out for a night stroll? The stars are lovely tonight.');
  if (G.timeWord() === 'morning') lines.push('Good morning! Early walks are the best walks.');
  if (h) lines.push('Happy ' + G.HOLIDAY_NAMES[h] + '!');
  if (acc && acc.head === 'frog') lines.push('Is that... a frog hat? On a dog? I love it.');
  if (acc && acc.head === 'crown') lines.push('A crown! Are we in the presence of disc royalty?');
  if (acc && acc.face === 'shades') lines.push(n + ' looks very cool in those sunglasses. Too cool.');
  if (acc && acc.head === 'party') lines.push('Party hat! Is it ' + n + '’s birthday?');
  if (pet && pet.d.clean < 30) lines.push(n + ' looks like they rolled in something... interesting.');
  if (pet && pet.d.energy < 25) lines.push(n + ' looks sleepy. Long day?');
  if (pet && pet.d.mood > 90) lines.push(n + ' looks SO happy today!');
  if (G.fullMoon() && G.timeWord() === 'night') lines.push('Full moon tonight. Kuri always gets a little howly on full moons.');
  return lines.length ? U.pick(lines) : null;
};

/* ---------------- secrets: keyboard codes ---------------- */
(() => {
  const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'KeyB', 'KeyA'];
  let seq = [], typed = '';
  addEventListener('keydown', (e) => {
    if (e.target && e.target.tagName === 'INPUT') return;
    seq.push(e.code); if (seq.length > 10) seq.shift();
    if (seq.join() === KONAMI.join()) { seq = []; G.partyMode(); }
    if (e.key && e.key.length === 1) { typed = (typed + e.key.toLowerCase()).slice(-12); if (typed.endsWith('squirrel')) { typed = ''; G.squirrel(); } }
  });
})();
G.partyMode = function () {
  if (!G.state || !G.cur) return;
  G.stamp('konami'); G.audio.play('fanfare'); G.ui.banner('PARTY MODE', 'Up, up, down, down...', 2200);
  G.party = G.time + 20;
  for (const id in G.pets) { const p = G.pets[id]; if (!p.root.parent) continue; const h = G.M.acc('party'); p.m.slots.head.add(h); p._partyHat = h; p.excite = 1; p.voice(); }
  const iv = setInterval(() => { if (!G.cur || G.time > G.party) { clearInterval(iv); for (const id in G.pets) { const p = G.pets[id]; if (p._partyHat) { p.m.slots.head.remove(p._partyHat); p._partyHat = null; } } return; } const c = G.cur.camera; const v = new V3(U.rand(-2, 2), 0, U.rand(-3, 0)).applyQuaternion(c.quaternion).add(c.position); v.y = 2.5; G.fx.spawn('confetti', v, 6); }, 400);
};
G.squirrel = function () {
  G.stamp('squirrel');
  G.ui.toast('You said it. You said the word.');
  for (const id in G.pets) { const p = G.pets[id]; if (!p.root.parent || p.cat) continue; p.stop(); p.emote('bang', 1.5); p.excite = 1; p.do((function* () { p.setPose('stand'); for (let i = 0; i < 3; i++) { p.voiceCd = 0; p.voice(); yield* p.wait(0.35); } yield* p.zoomies(p.pos.x, p.pos.z, 1.2, 1); })()); }
};

/* ---------------- TV ---------------- */
G.TV = class {
  constructor() {
    this.c = document.createElement('canvas'); this.c.width = 320; this.c.height = 200; this.g = this.c.getContext('2d');
    this.tex = new THREE.CanvasTexture(this.c); this.tex.encoding = THREE.sRGBEncoding;
    this.on = false; this.ch = 0; this.t = 0; this.acc = 0; this.static = 0; this.adI = 0; this.game = null;
    this.drawOff();
  }
  channels() { const h = new Date().getHours(); const list = ['news', 'weather', 'dogtv', 'ads', 'cooking', 'retro']; if (h < 4) list.push('moon'); return list; }
  get name() { return this.channels()[this.ch % this.channels().length]; }
  label() { return { news: 'Maple Hill News', weather: 'Weather', dogtv: 'Dog TV', ads: 'Commercials', cooking: 'Pup Kitchen', retro: 'Retro Games', moon: '???' }[this.name]; }
  toggle() { this.on = !this.on; this.static = 0.3; G.audio.play('tvclick'); if (!this.on) this.drawOff(); }
  next() { this.ch = (this.ch + 1) % this.channels().length; this.static = 0.35; G.audio.play('tvclick'); if (this.name === 'ads') G.audio.play('jingle'); this.game = null; }
  tap() { if (this.name === 'retro') { this.jump(); return true; } return false; }
  drawOff() { const g = this.g; g.fillStyle = '#141616'; g.fillRect(0, 0, 320, 200); g.fillStyle = 'rgba(255,255,255,.05)'; g.beginPath(); g.ellipse(90, 50, 80, 30, -0.4, 0, 7); g.fill(); this.tex.needsUpdate = true; }
  update(dt) {
    if (!this.on) return; this.t += dt; this.acc += dt;
    if (this.name === 'retro') this.stepGame(dt);
    if (this.acc < 1 / 15) return; this.acc = 0;
    const g = this.g;
    if (this.static > 0) { this.static -= 1 / 15; const img = g.createImageData(320, 200); for (let i = 0; i < img.data.length; i += 4) { const v = Math.random() * 255; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; } g.putImageData(img, 0, 0); this.tex.needsUpdate = true; return; }
    this['draw_' + this.name](g, this.t);
    g.fillStyle = 'rgba(0,0,0,.08)'; for (let y = 0; y < 200; y += 3) g.fillRect(0, y, 320, 1);
    this.tex.needsUpdate = true;
  }
  text(g, s, x, y, size, col, align = 'left', w = 700) { g.font = w + ' ' + size + 'px Fredoka, sans-serif'; g.fillStyle = col; g.textAlign = align; g.fillText(s, x, y); }
  draw_news(g, t) {
    g.fillStyle = '#244a7a'; g.fillRect(0, 0, 320, 200); g.fillStyle = '#2f5d96'; for (let i = 0; i < 6; i++) g.fillRect(i * 60 - (t * 10 % 60), 0, 30, 150);
    g.fillStyle = '#fff7ea'; g.fillRect(0, 118, 320, 4);
    // anchor: a shiba in a suit
    g.fillStyle = '#3b3f4a'; g.beginPath(); g.ellipse(160, 140, 46, 36, 0, Math.PI, 0); g.fill(); g.fillRect(114, 140, 92, 20);
    g.fillStyle = '#fff'; g.beginPath(); g.moveTo(150, 106); g.lineTo(170, 106); g.lineTo(160, 130); g.fill(); g.fillStyle = '#e2574c'; g.fillRect(157, 110, 6, 18);
    g.fillStyle = '#e48a3e'; g.beginPath(); g.arc(160, 82, 26, 0, 7); g.fill();
    g.beginPath(); g.moveTo(138, 70); g.lineTo(140, 44); g.lineTo(154, 60); g.fill(); g.beginPath(); g.moveTo(182, 70); g.lineTo(180, 44); g.lineTo(166, 60); g.fill();
    g.fillStyle = '#fbebd2'; g.beginPath(); g.ellipse(160, 92, 16, 11, 0, 0, 7); g.fill();
    g.fillStyle = '#1d1716'; g.beginPath(); g.arc(151, 78, 3, 0, 7); g.arc(169, 78, 3, 0, 7); g.fill(); g.beginPath(); g.ellipse(160, 88, 4, 3, 0, 0, 7); g.fill();
    const mouth = Math.sin(t * 12) > 0 ? 3 : 1; g.fillStyle = '#7a2f35'; g.beginPath(); g.ellipse(160, 96, 4, mouth, 0, 0, 7); g.fill();
    g.fillStyle = '#e2574c'; g.fillRect(10, 10, 74, 24); this.text(g, 'MHN', 47, 29, 18, '#fff', 'center');
    this.text(g, U.fmtTime(new Date()), 310, 28, 14, '#fff', 'right', 600);
    g.fillStyle = '#ee8a3c'; g.fillRect(0, 160, 320, 40); g.fillStyle = '#c8622a'; g.fillRect(0, 160, 64, 40); this.text(g, 'LIVE', 32, 186, 16, '#fff', 'center');
    if (!this.ticker || this.tickerT < t) { const extra = []; const s = G.state; if (s.pets[0]) extra.push(s.pets[0].name + ' spotted doing zoomies near the rug'); if (s.trophies.length) extra.push(s.trophies.length + ' trophies now displayed in a local living room'); extra.push('Weather: ' + G.weather() + ', ' + G.temp() + '°'); this.ticker = [...extra, ...G.HEADLINES.slice().sort(() => Math.random() - 0.5).slice(0, 4)].join('   •   '); this.tickerT = t + 60; this.tx = 330; }
    this.tx -= 2.2; g.save(); g.beginPath(); g.rect(64, 160, 256, 40); g.clip(); this.text(g, this.ticker, this.tx, 186, 15, '#fff', 'left', 600); g.restore();
    if (this.tx < -g.measureText(this.ticker).width) this.tx = 330;
  }
  draw_weather(g, t) {
    const w = G.weather(), w1 = G.weather(1);
    const grd = g.createLinearGradient(0, 0, 0, 200); grd.addColorStop(0, w === 'rain' ? '#5a6a86' : w === 'snow' ? '#a9bccb' : '#5fb4e6'); grd.addColorStop(1, '#d6efff'); g.fillStyle = grd; g.fillRect(0, 0, 320, 200);
    this.text(g, 'MAPLE HILL WEATHER', 160, 28, 18, '#fff', 'center');
    const icon = (k, x, y, s) => {
      if (k === 'sunny') { g.fillStyle = '#ffd84a'; g.beginPath(); g.arc(x, y, 22 * s, 0, 7); g.fill(); g.strokeStyle = '#ffd84a'; g.lineWidth = 4 * s; for (let i = 0; i < 8; i++) { const a = i / 8 * 6.28 + t * 0.5; g.beginPath(); g.moveTo(x + Math.cos(a) * 30 * s, y + Math.sin(a) * 30 * s); g.lineTo(x + Math.cos(a) * 38 * s, y + Math.sin(a) * 38 * s); g.stroke(); } }
      else { g.fillStyle = k === 'cloudy' ? '#f4f6f8' : '#d6dde4'; g.beginPath(); g.arc(x - 14 * s, y, 16 * s, 0, 7); g.arc(x + 4 * s, y - 8 * s, 20 * s, 0, 7); g.arc(x + 20 * s, y + 2 * s, 14 * s, 0, 7); g.fill(); if (k === 'rain') { g.strokeStyle = '#4aa6e0'; g.lineWidth = 3 * s; for (let i = 0; i < 4; i++) { const yy = (t * 60 + i * 13) % 26; g.beginPath(); g.moveTo(x - 18 * s + i * 12 * s, y + 18 * s + yy * s); g.lineTo(x - 21 * s + i * 12 * s, y + 25 * s + yy * s); g.stroke(); } } if (k === 'snow') { g.fillStyle = '#fff'; for (let i = 0; i < 5; i++) { g.beginPath(); g.arc(x - 18 * s + i * 9 * s, y + 22 * s + ((t * 20 + i * 9) % 20) * s, 2.5 * s, 0, 7); g.fill(); } } }
    };
    icon(w, 90, 100, 1.3); this.text(g, 'Today', 90, 168, 16, '#3b2a1f', 'center'); this.text(g, G.temp() + '°', 160, 112, 40, '#fff', 'center');
    icon(w1, 240, 104, 0.8); this.text(g, 'Tomorrow ' + G.temp(1) + '°', 240, 168, 14, '#3b2a1f', 'center');
    this.text(g, G.fullMoon() ? 'Full moon tonight!' : 'Moon: ' + Math.round(G.moonPhase() * 100) + '% through its cycle', 160, 190, 11, '#3b2a1f', 'center', 500);
  }
  draw_dogtv(g, t) {
    g.fillStyle = '#9fd4ff'; g.fillRect(0, 0, 320, 200); g.fillStyle = '#7cbf5a'; g.fillRect(0, 120, 320, 80);
    g.fillStyle = '#7a5236'; g.fillRect(250, 40, 18, 90); g.fillStyle = '#5e9e44'; g.beginPath(); g.arc(259, 40, 42, 0, 7); g.fill();
    const x = 160 + Math.sin(t * 1.3) * 120, dir = Math.cos(t * 1.3) > 0 ? 1 : -1, hop = Math.abs(Math.sin(t * 9)) * 10;
    g.save(); g.translate(x, 140 - hop); g.scale(dir, 1);
    g.fillStyle = '#a0612e'; g.beginPath(); g.ellipse(0, 0, 16, 10, 0, 0, 7); g.fill();
    g.beginPath(); g.ellipse(-18, -14, 9, 18, -0.6, 0, 7); g.fill();
    g.beginPath(); g.arc(14, -6, 7, 0, 7); g.fill(); g.fillStyle = '#111'; g.beginPath(); g.arc(17, -8, 1.8, 0, 7); g.fill(); g.restore();
    const bx = (t * 50) % 380 - 30; g.strokeStyle = '#3b2a1f'; g.lineWidth = 2; g.beginPath(); g.moveTo(bx - 8, 50 + Math.sin(t * 8) * 4); g.lineTo(bx, 55); g.lineTo(bx + 8, 50 + Math.sin(t * 8) * 4); g.stroke();
    g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(0, 0, 320, 26); this.text(g, 'DOG TV • relaxing for pups', 10, 18, 13, '#fff', 'left', 600);
  }
  draw_ads(g, t) {
    const ads = [
      () => { g.fillStyle = '#7a4a24'; g.fillRect(0, 0, 320, 200); g.fillStyle = '#fff7ea'; g.beginPath(); g.ellipse(160, 110, 60, 22, 0, 0, 7); g.fill(); g.fillRect(105, 110, 110, 50); g.fillStyle = '#c9935a'; g.beginPath(); g.ellipse(160, 110, 52, 17, 0, 0, 7); g.fill(); g.fillStyle = '#fff7ea'; g.beginPath(); g.arc(160, 110, 9, 0, 7); g.fill(); g.beginPath(); g.moveTo(152, 104); g.lineTo(150, 96); g.lineTo(156, 102); g.fill(); g.beginPath(); g.moveTo(168, 104); g.lineTo(170, 96); g.lineTo(164, 102); g.fill(); this.text(g, 'Paw & Bean', 160, 40, 26, '#fff7ea', 'center'); this.text(g, 'Lattes so good, your dog will be jealous.', 160, 186, 12, '#f2c24b', 'center', 600); },
      () => { g.fillStyle = '#79b25a'; g.fillRect(0, 0, 320, 200); g.fillStyle = '#5e9e44'; g.beginPath(); g.arc(160, 120, 50, Math.PI, 0); g.fill(); for (const s of [-1, 1]) { g.fillStyle = '#5e9e44'; g.beginPath(); g.arc(160 + s * 26, 76, 15, 0, 7); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(160 + s * 26, 76, 9, 0, 7); g.fill(); g.fillStyle = '#111'; g.beginPath(); g.arc(160 + s * 26, 77, 4, 0, 7); g.fill(); } this.text(g, 'FROG HATS', 160, 40, 28, '#fff', 'center'); this.text(g, 'Ribbit. Now at Maple Pets.', 160, 160, 16, '#fff7ea', 'center', 600); },
      () => { g.fillStyle = '#e2574c'; g.fillRect(0, 0, 320, 200); const sq = 1 + Math.abs(Math.sin(t * 8)) * 0.15; g.save(); g.translate(160, 110); g.scale(sq, 1 / sq); g.fillStyle = '#7ec8f2'; g.fillRect(-50, -10, 100, 20); for (const a of [-1, 1]) for (const b of [-1, 1]) { g.beginPath(); g.arc(a * 52, b * 12, 14, 0, 7); g.fill(); } g.restore(); this.text(g, 'SQUEAKMASTER 3000', 160, 42, 22, '#fff', 'center'); this.text(g, '*Squeaks may cause zoomies', 160, 186, 11, '#fff7ea', 'center', 500); },
      () => { g.fillStyle = '#1d2a24'; g.fillRect(0, 0, 320, 200); const y = 120 - Math.sin(t * 2) * 50; g.fillStyle = '#ff8a3c'; g.beginPath(); g.ellipse(160 + Math.cos(t * 2) * 80, y, 26, 8, 0, 0, 7); g.fill(); this.text(g, 'DISC CUP', 160, 44, 30, '#f2c24b', 'center'); this.text(g, 'Can your dog fly? North field, every day.', 160, 186, 13, '#fff', 'center', 600); },
      () => { g.fillStyle = '#f6efe4'; g.fillRect(0, 0, 320, 200); this.text(g, 'Maple Hill Shrine', 160, 46, 22, '#b33a2a', 'center'); g.fillStyle = '#d9412b'; g.fillRect(110, 70, 100, 10); g.fillRect(100, 62, 120, 8); g.fillRect(120, 70, 10, 80); g.fillRect(190, 70, 10, 80); this.text(g, 'Today’s fortune awaits.', 160, 180, 14, '#3b2a1f', 'center', 600); },
    ];
    const i = Math.floor(t / 5) % ads.length; ads[i]();
    g.fillStyle = 'rgba(255,255,255,.75)'; g.fillRect(270, 8, 42, 16); this.text(g, 'AD', 291, 21, 12, '#3b2a1f', 'center');
  }
  draw_cooking(g, t) {
    g.fillStyle = '#fff2dc'; g.fillRect(0, 0, 320, 200); g.fillStyle = '#e8d2b0'; for (let i = 0; i < 8; i++) for (let j = 0; j < 4; j++) if ((i + j) % 2) g.fillRect(i * 40, 120 + j * 20, 40, 20);
    g.fillStyle = '#9aa2ac'; g.fillRect(190, 96, 90, 40); g.fillStyle = '#7d8590'; g.fillRect(184, 92, 102, 8);
    g.fillStyle = 'rgba(255,255,255,.7)'; for (let i = 0; i < 3; i++) { const yy = 80 - ((t * 20 + i * 15) % 45); g.beginPath(); g.arc(215 + i * 20 + Math.sin(t * 3 + i) * 4, yy, 7, 0, 7); g.fill(); }
    g.fillStyle = '#d9a35a'; g.beginPath(); g.arc(80, 90, 26, 0, 7); g.fill(); g.fillStyle = '#fff'; g.fillRect(58, 48, 44, 16); g.beginPath(); g.arc(80, 46, 18, Math.PI, 0); g.fill();
    g.fillStyle = '#1d1716'; g.beginPath(); g.arc(72, 88, 2.5, 0, 7); g.arc(88, 88, 2.5, 0, 7); g.fill();
    this.text(g, 'PUP KITCHEN', 160, 28, 20, '#c8622a', 'center');
    const steps = ['Today: Sweet potato pupcakes!', '1. Mash 1 sweet potato.', '2. Mix with oats & an egg.', '3. Bake until golden.', '4. Let cool. Very important.', '5. Serve with love. Good dog!'];
    this.text(g, steps[Math.floor(t / 3) % steps.length], 160, 180, 14, '#3b2a1f', 'center', 600);
  }
  draw_moon(g, t) {
    g.fillStyle = '#0d1430'; g.fillRect(0, 0, 320, 200); g.fillStyle = '#fff'; for (let i = 0; i < 40; i++) { g.globalAlpha = 0.4 + 0.6 * Math.abs(Math.sin(t + i)); g.fillRect(U.hash(i, 2, 3) * 320, U.hash(i, 5, 1) * 140, 2, 2); } g.globalAlpha = 1;
    g.fillStyle = '#fff6d6'; g.beginPath(); g.arc(220, 70, 40, 0, 7); g.fill();
    g.fillStyle = '#1a1a2a'; g.beginPath(); g.moveTo(60, 200); g.lineTo(60, 150); g.lineTo(80, 130); g.lineTo(84, 110); g.lineTo(92, 124); g.lineTo(104, 130); g.lineTo(130, 150); g.lineTo(150, 200); g.fill(); g.fillRect(0, 180, 320, 20);
    this.text(g, 'aWOOooo...', 160, 30, 14, '#8fa0d8', 'center', 500);
  }
  draw_retro(g) {
    const s = this.game || this.newGame();
    g.fillStyle = '#d8e4c0'; g.fillRect(0, 0, 320, 200); g.fillStyle = '#4a5a3a'; g.fillRect(0, 160, 320, 3);
    g.fillStyle = '#4a5a3a'; const px = 4; const dog = [' xx    x ', 'xxxx  xx ', 'xxxxxxxx ', ' xxxxxx  ', ' x  x x  '];
    dog.forEach((row, r) => [...row].forEach((c, k) => { if (c === 'x') g.fillRect(40 + k * px, s.y - 20 + r * px, px, px); }));
    for (const o of s.obs) { g.fillRect(o.x, 160 - o.h, 10, o.h); g.fillRect(o.x - 4, 160 - o.h * 0.6, 4, 4); g.fillRect(o.x + 10, 160 - o.h * 0.7, 4, 4); }
    this.text(g, 'SHIBA DASH', 10, 22, 14, '#4a5a3a', 'left', 700); this.text(g, 'SCORE ' + s.score + '   HI ' + (G.state.retroHigh || 0), 310, 22, 12, '#4a5a3a', 'right', 600);
    if (s.over) this.text(g, s.demo ? 'TAP THE TV TO PLAY' : 'GAME OVER • TAP TO RETRY', 160, 100, 15, '#4a5a3a', 'center', 700);
  }
  newGame(demo = true) { this.game = { y: 160, vy: 0, obs: [], score: 0, t: 0, next: 1.5, over: false, demo, speed: 140 }; return this.game; }
  jump() {
    const s = this.game || this.newGame(false);
    if (s.over || s.demo) { this.newGame(false); G.audio.play('blip'); return; }
    if (s.y >= 160) { s.vy = -330; G.audio.play('blip'); }
  }
  stepGame(dt) {
    const s = this.game || this.newGame(); if (s.over) return;
    s.t += dt; s.speed += dt * 4; s.vy += 900 * dt; s.y = Math.min(160, s.y + s.vy * dt); if (s.y >= 160) s.vy = 0;
    s.next -= dt; if (s.next <= 0) { s.obs.push({ x: 330, h: U.rand(14, 26), passed: false }); s.next = U.rand(0.9, 1.9) * 140 / s.speed; }
    for (const o of s.obs) { o.x -= s.speed * dt; if (!o.passed && o.x < 40) { o.passed = true; s.score++; } if (o.x < 72 && o.x > 32 && s.y > 160 - o.h + 4) { s.over = true; if (!s.demo) { G.audio.play('gameover'); if (s.score > (G.state.retroHigh || 0)) { G.state.retroHigh = s.score; G.ui.toast('New Shiba Dash high score: ' + s.score + '!'); } } } }
    if (s.demo) { const n = s.obs.find((o) => o.x > 50 && o.x < 92); if (n && s.y >= 160) s.vy = -330; if (s.over) setTimeout(() => { if (this.game === s) this.newGame(true); }, 1500); }
    s.obs = s.obs.filter((o) => o.x > -20);
  }
};
