'use strict';
/* =========================================================
   Shiba Days — UI: HUD, sheets, dialogue, shop, menus
   ========================================================= */
const IC = {
  bowl: '<svg viewBox="0 0 32 32"><path d="M4 15h24c0 6-5 11-12 11S4 21 4 15z" fill="#ee8a3c"/><ellipse cx="16" cy="15" rx="12" ry="3" fill="#c8622a"/><circle cx="11" cy="12" r="2.4" fill="#8a4a24"/><circle cx="16" cy="11" r="2.4" fill="#8a4a24"/><circle cx="21" cy="12" r="2.4" fill="#8a4a24"/></svg>',
  ball: '<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="11" fill="#cfe24a"/><path d="M7 9c5 3 5 11 0 14M25 9c-5 3-5 11 0 14" stroke="#fff" stroke-width="2.4" fill="none"/></svg>',
  star: '<svg viewBox="0 0 32 32"><path d="M16 3l3.8 8 8.7 1-6.4 6 1.7 8.6L16 22.4 8.2 26.6 9.9 18 3.5 12l8.7-1z" fill="#f2c24b" stroke="#c8922a" stroke-width="1.5" stroke-linejoin="round"/></svg>',
  care: '<svg viewBox="0 0 32 32"><circle cx="11" cy="12" r="5" fill="#bfe4ff"/><circle cx="19" cy="9" r="3.5" fill="#dff3ff"/><circle cx="21" cy="17" r="4.5" fill="#bfe4ff"/><path d="M6 22h20v3a3 3 0 01-3 3H9a3 3 0 01-3-3z" fill="#4aa6e0"/></svg>',
  dress: '<svg viewBox="0 0 32 32"><path d="M16 4l11 18H5z" fill="#7a5cff"/><path d="M8.6 16h14.8M6.8 19.5h18.4" stroke="#f2c24b" stroke-width="2.6"/><circle cx="16" cy="4.5" r="3" fill="#ff6f91"/></svg>',
  door: '<svg viewBox="0 0 32 32"><rect x="8" y="4" width="16" height="25" rx="2" fill="#fff"/><path d="M11 7h10v22H11z" fill="#c8622a" opacity=".2"/><circle cx="20" cy="17" r="1.6" fill="#fff"/><path d="M4 29h24" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/></svg>',
  paw: '<svg viewBox="0 0 32 32"><ellipse cx="16" cy="21" rx="7" ry="6" fill="currentColor"/><ellipse cx="7.5" cy="14" rx="3" ry="3.8" fill="currentColor"/><ellipse cx="12.5" cy="8.5" rx="3" ry="3.8" fill="currentColor"/><ellipse cx="19.5" cy="8.5" rx="3" ry="3.8" fill="currentColor"/><ellipse cx="24.5" cy="14" rx="3" ry="3.8" fill="currentColor"/></svg>',
  home: '<svg viewBox="0 0 32 32"><path d="M4 15L16 5l12 10" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M8 14v13h16V14" fill="currentColor"/><rect x="13.5" y="19" width="5" height="8" fill="#fff" opacity=".6"/></svg>',
  bag: '<svg viewBox="0 0 32 32"><path d="M6 11h20l-1.5 16h-17z" fill="#79b25a"/><path d="M11 13V9a5 5 0 0110 0v4" stroke="#3b2a1f" stroke-width="2.2" fill="none"/></svg>',
  cup: '<svg viewBox="0 0 32 32"><path d="M6 11h17v8a7 7 0 01-7 7h-3a7 7 0 01-7-7z" fill="#fff7ea" stroke="#c8622a" stroke-width="2"/><path d="M23 13h2a3 3 0 010 6h-2" stroke="#c8622a" stroke-width="2" fill="none"/><path d="M11 4c-1 2 1 3 0 5M16 4c-1 2 1 3 0 5" stroke="#c8622a" stroke-width="1.8" fill="none" stroke-linecap="round"/></svg>',
  trophy: '<svg viewBox="0 0 32 32"><path d="M10 5h12v7a6 6 0 01-12 0z" fill="#f2c24b"/><path d="M10 7H6c0 4 2 6 5 6M22 7h4c0 4-2 6-5 6" stroke="#f2c24b" stroke-width="2" fill="none"/><path d="M14 18h4v4h-4z" fill="#c8922a"/><rect x="10" y="22" width="12" height="5" rx="1.5" fill="#7a4a24"/></svg>',
  disc: '<svg viewBox="0 0 32 32"><ellipse cx="16" cy="17" rx="13" ry="6" fill="#ff8a3c"/><ellipse cx="16" cy="15.5" rx="13" ry="5.5" fill="#ffa25c"/><ellipse cx="16" cy="15.5" rx="7" ry="2.8" fill="none" stroke="#fff4e0" stroke-width="1.6"/></svg>',
  chat: '<svg viewBox="0 0 32 32"><path d="M5 7h22v14H14l-6 5v-5H5z" fill="#fff" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><circle cx="11" cy="14" r="1.6" fill="currentColor"/><circle cx="16" cy="14" r="1.6" fill="currentColor"/><circle cx="21" cy="14" r="1.6" fill="currentColor"/></svg>',
  menu: '<svg viewBox="0 0 32 32"><rect x="7" y="4" width="18" height="24" rx="3" fill="#fff7ea" stroke="#c8622a" stroke-width="2"/><path d="M11 11h10M11 16h10M11 21h6" stroke="#c8622a" stroke-width="2" stroke-linecap="round"/></svg>',
  gear: '<svg viewBox="0 0 32 32"><path d="M16 10a6 6 0 100 12 6 6 0 000-12z" fill="none" stroke="#3b2a1f" stroke-width="2.6"/><path d="M16 3v4M16 25v4M3 16h4M25 16h4M6.8 6.8l2.8 2.8M22.4 22.4l2.8 2.8M6.8 25.2l2.8-2.8M22.4 9.6l2.8-2.8" stroke="#3b2a1f" stroke-width="2.6" stroke-linecap="round"/></svg>',
  coin: '<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="12" fill="#f2c24b" stroke="#c8922a" stroke-width="2"/><path d="M12 12.5c0-2 2-3 4-3s4 1 4 3-8 2-8 5 2 3.5 4 3.5 4-1 4-3M16 7v18" stroke="#a0701a" stroke-width="2" fill="none" stroke-linecap="round"/></svg>',
  info: '<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="12" fill="#4aa6e0"/><path d="M16 14v8" stroke="#fff" stroke-width="3" stroke-linecap="round"/><circle cx="16" cy="9.5" r="2" fill="#fff"/></svg>',
  water: '<svg viewBox="0 0 32 32"><path d="M16 4c5 7 9 11 9 16a9 9 0 01-18 0c0-5 4-9 9-16z" fill="#5bb6ff"/><ellipse cx="12.5" cy="20" rx="2" ry="3.5" fill="#fff" opacity=".6"/></svg>',
  brush: '<svg viewBox="0 0 32 32"><rect x="5" y="8" width="16" height="9" rx="3" fill="#4aa6e0"/><path d="M7 17v5M10 17v6M13 17v5M16 17v6M19 17v5" stroke="#bbb" stroke-width="1.8" stroke-linecap="round"/><rect x="19" y="10" width="10" height="4" rx="2" fill="#c8622a"/></svg>',
  bath: '<svg viewBox="0 0 32 32"><path d="M4 16h24v3a7 7 0 01-7 7H11a7 7 0 01-7-7z" fill="#fff" stroke="#4aa6e0" stroke-width="2"/><circle cx="11" cy="12" r="3" fill="#bfe4ff"/><circle cx="17" cy="10" r="2.2" fill="#dff3ff"/><circle cx="21" cy="13" r="2.6" fill="#bfe4ff"/></svg>',
  kennel: '<svg viewBox="0 0 32 32"><path d="M4 15L16 6l12 9v12H4z" fill="#c8622a"/><path d="M11 27v-7a5 5 0 0110 0v7z" fill="#3b2a1f"/></svg>',
  map: '<svg viewBox="0 0 32 32"><path d="M4 8l7-3 10 3 7-3v19l-7 3-10-3-7 3z" fill="#fff7ea" stroke="#79b25a" stroke-width="2" stroke-linejoin="round"/><path d="M11 5v19M21 8v19" stroke="#79b25a" stroke-width="2"/></svg>',
  hand: '<svg viewBox="0 0 64 64"><path d="M22 34V14a4 4 0 018 0v14-18a4 4 0 018 0v18-14a4 4 0 018 0v16-8a4 4 0 018 0v16c0 12-8 20-20 20-8 0-12-3-16-9l-8-12a4 4 0 016-5z" fill="#fff4e8" stroke="#7a5c46" stroke-width="3" stroke-linejoin="round"/></svg>',
  treat: '<svg viewBox="0 0 32 32"><g fill="#d9a35a"><rect x="9" y="13.5" width="14" height="5" rx="2"/><circle cx="8" cy="12.5" r="3.3"/><circle cx="8" cy="19.5" r="3.3"/><circle cx="24" cy="12.5" r="3.3"/><circle cx="24" cy="19.5" r="3.3"/></g></svg>',
};
G.IC = IC;

G.addItem = function (id, n = 1) {
  const it = G.ITEMS[id]; if (!it) return;
  const s = G.state;
  if (it.cat === 'toy') s.toys[id] = (s.toys[id] || 0) + n;
  else if (it.cat === 'acc') s.acc[id] = 1;
  else if (id !== 'brush') s.inv[id] = (s.inv[id] || 0) + n;
};
G.addCoins = function (n, msg) { G.state.coins += n; if (n > 0) { G.audio.play('coin'); G.ui.toast(msg || ('+' + n + ' coins'), 'gold'); } G.ui.refresh(); };
G.today = () => { const d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); };
G.timeWord = () => { const h = new Date().getHours(); return h < 5 ? 'night' : h < 11 ? 'morning' : h < 17 ? 'afternoon' : h < 21 ? 'evening' : 'night'; };

G.ui = (() => {
  const ui = {};
  let typing = null, sheetCfg = null, hintTimer = 0;
  ui.init = function () {
    $('#btnSettings').innerHTML = IC.gear;
    $('#btnSettings').onclick = () => ui.settings();
    $('#shClose').onclick = () => ui.closeSheet();
    $('#sheetWrap').addEventListener('pointerdown', (e) => { if (e.target.id === 'sheetWrap') ui.closeSheet(); });
    $('#dialog').addEventListener('click', () => { if (typing) typing.skip(); });
    setInterval(() => ui.refresh(), 400);
  };
  ui.closeAll = function () { ui.closeSheet(true); ui.prompts([]); $('#modalWrap').classList.add('hidden'); };

  /* ---------------- HUD ---------------- */
  ui.setScene = function (name) {
    $('#hud').classList.remove('hidden');
    const sc = G.scenes[name];
    const dock = $('#dock'); dock.innerHTML = '';
    (sc.dock ? sc.dock() : []).forEach((b) => {
      const el = document.createElement('button'); if (b.cls) el.className = b.cls;
      el.innerHTML = (IC[b.icon] || '') + '<span>' + U.esc(b.label) + '</span>';
      el.onclick = () => { G.audio.init(); G.audio.play('pop'); b.fn(); };
      if (b.id) el.id = 'dock-' + b.id;
      dock.appendChild(el);
    });
    $('#contestHud').classList.toggle('hidden', name !== 'frisbee');
    $('#needs').classList.toggle('min', !!sc.hideNeeds);
    ui.prompts([]); ui.refresh(true);
  };
  const BARS = [['hunger', 'Food', '#ee8a3c'], ['thirst', 'Water', '#4aa6e0'], ['energy', 'Energy', '#79b25a'], ['mood', 'Happy', '#f39bb0'], ['clean', 'Clean', '#9b8cf0']];
  let lastChips = '';
  ui.refresh = function (force) {
    if (!G.state) return;
    const s = G.state;
    $('#coins').innerHTML = IC.coin + '<span>' + s.coins + '</span>';
    $('#clock').textContent = U.fmtTime(new Date());
    const act = G.petById(s.active);
    const chipsKey = s.pets.map((p) => p.id + p.name + p.coat + JSON.stringify(p.acc) + Math.round(p.mood / 20)).join() + s.active;
    if (chipsKey !== lastChips || force) {
      lastChips = chipsKey;
      const wrap = $('#pets'); wrap.innerHTML = '';
      s.pets.forEach((p) => {
        const b = document.createElement('button'); b.className = 'chip' + (p.id === s.active ? ' on' : '');
        const img = G.M.icons.pet(p);
        b.innerHTML = '<img class="dot" src="' + img + '" alt=""><span class="nm">' + U.esc(p.name) + '<span class="mood">' + moodWord(p) + '</span></span>';
        b.onclick = () => { G.audio.play('tick'); if (s.active === p.id) ui.petInfo(p); else { s.active = p.id; ui.refresh(true); if (G.cur && G.cur.onActive) G.cur.onActive(p); } };
        wrap.appendChild(b);
      });
    }
    if (act) {
      $('#needs').innerHTML = BARS.map(([k, n, c]) => '<span>' + n + '</span><div class="bar" data-l="' + n + '"><i style="width:' + Math.round(act[k]) + '%;background:' + (act[k] < 25 ? '#e2574c' : c) + '"></i></div>').join('');
    }
  };
  function moodWord(p) {
    if (p.hunger < 25) return 'Hungry'; if (p.thirst < 25) return 'Thirsty'; if (p.energy < 18) return 'Sleepy'; if (p.clean < 25) return 'Needs a bath';
    return p.mood > 85 ? 'Overjoyed' : p.mood > 65 ? 'Happy' : p.mood > 45 ? 'Content' : p.mood > 25 ? 'Bored' : 'Sad';
  }
  ui.moodWord = moodWord;
  ui.toast = function (msg, cls) {
    const t = document.createElement('div'); t.className = 'toast' + (cls ? ' ' + cls : ''); t.textContent = msg;
    $('#toasts').appendChild(t); setTimeout(() => { t.style.transition = 'opacity .4s'; t.style.opacity = '0'; setTimeout(() => t.remove(), 450); }, 2600);
    while ($('#toasts').children.length > 4) $('#toasts').firstChild.remove();
  };
  ui.hint = function (txt, ms = 4500) {
    const h = $('#hint'); clearTimeout(hintTimer);
    if (!txt) { h.style.opacity = 0; return; }
    h.textContent = txt; h.style.opacity = 1;
    if (ms) hintTimer = setTimeout(() => (h.style.opacity = 0), ms);
  };
  ui.prompts = function (list) {
    const w = $('#prompts'); w.innerHTML = '';
    for (const p of list) {
      const b = document.createElement('button'); b.className = 'pbtn ' + (p.cls || ''); b.textContent = p.label;
      b.onclick = (e) => { e.stopPropagation(); G.audio.play('pop'); p.fn(); };
      w.appendChild(b);
    }
  };
  ui.banner = function (txt, sub, ms = 1600) {
    const b = $('#banner'); b.innerHTML = '<span>' + U.esc(txt) + (sub ? '<small>' + U.esc(sub) + '</small>' : '') + '</span>'; b.classList.remove('hidden');
    clearTimeout(ui._bt); if (ms) ui._bt = setTimeout(() => b.classList.add('hidden'), ms);
  };
  ui.cursor = function (src, x, y) {
    const c = $('#cursor');
    if (src === null) { c.classList.add('hidden'); c.dataset.src = ''; return; }
    if (src !== undefined && c.dataset.src !== src) { c.dataset.src = src; c.innerHTML = src.startsWith('<svg') ? src : '<img src="' + src + '" alt="">'; }
    c.classList.remove('hidden');
    if (x !== undefined) c.style.transform = 'translate(' + x + 'px,' + y + 'px)';
  };

  /* ---------------- sheets ---------------- */
  ui.sheet = function (cfg) {
    sheetCfg = cfg; G.blockInput = true;
    $('#sheetWrap').classList.remove('hidden');
    $('#shTitle').textContent = cfg.title;
    const tabs = $('#shTabs'); tabs.innerHTML = ''; tabs.classList.toggle('hidden', !cfg.tabs);
    if (cfg.tabs) {
      cfg.tab = cfg.tab || cfg.tabs[0].id;
      cfg.tabs.forEach((t) => { const b = document.createElement('button'); b.className = 'tab' + (t.id === cfg.tab ? ' on' : ''); b.textContent = t.name; b.onclick = () => { cfg.tab = t.id; G.audio.play('tick'); ui.sheet(cfg); }; tabs.appendChild(b); });
    }
    const body = $('#shBody'); body.innerHTML = ''; body.scrollTop = 0;
    cfg.render(body, cfg.tab);
  };
  ui.resheet = function () { if (sheetCfg && !$('#sheetWrap').classList.contains('hidden')) { const st = $('#shBody').scrollTop; ui.sheet(sheetCfg); $('#shBody').scrollTop = st; } };
  ui.closeSheet = function (silent) {
    if ($('#sheetWrap').classList.contains('hidden')) return;
    $('#sheetWrap').classList.add('hidden'); G.blockInput = false;
    const cb = sheetCfg && sheetCfg.onClose; sheetCfg = null; if (cb) cb();
    if (!silent) G.audio.play('back');
  };
  function card(o) {
    const c = document.createElement('button'); c.className = 'card' + (o.on ? ' on' : '') + (o.dim ? ' dim' : '');
    c.innerHTML = (o.badge !== undefined ? '<span class="badge">' + o.badge + '</span>' : '') + '<img src="' + o.img + '" alt=""><span class="nm">' + U.esc(o.name) + '</span>' + (o.sub ? '<span class="sub">' + U.esc(o.sub) + '</span>' : '');
    if (o.fn) c.onclick = o.fn;
    return c;
  }
  ui.card = card;
  function li(o) {
    const c = document.createElement('button'); c.className = 'li' + (o.lock ? ' lock' : '');
    c.innerHTML = '<span class="ic">' + (o.img ? '<img src="' + o.img + '" style="width:42px;height:42px" alt="">' : (IC[o.icon] || '')) + '</span><span class="tx"><b>' + U.esc(o.title) + '</b><span>' + U.esc(o.sub || '') + '</span>' + (o.prog !== undefined ? '<div class="prog"><i style="width:' + Math.round(o.prog * 100) + '%"></i></div>' : '') + '</span>' + (o.right ? '<span style="font-weight:700">' + U.esc(o.right) + '</span>' : '');
    if (o.fn) c.onclick = o.fn;
    return c;
  }
  ui.li = li;
  const grid = (body) => { const g = document.createElement('div'); g.className = 'grid'; body.appendChild(g); return g; };
  const list = (body) => { const g = document.createElement('div'); g.className = 'list'; body.appendChild(g); return g; };
  const note = (body, txt) => { const n = document.createElement('p'); n.className = 'note'; n.textContent = txt; body.appendChild(n); return n; };
  ui.grid = grid; ui.list = list; ui.note = note;

  /* ---- Feed ---- */
  ui.feedSheet = function () {
    ui.sheet({
      title: 'Food & treats', render(body) {
        const s = G.state;
        note(body, 'Kibble goes in the bowl. Treats you hand-feed: pick one, then tap your pet.');
        const g = grid(body);
        const owned = Object.keys(G.ITEMS).filter((k) => (G.ITEMS[k].cat === 'food' || G.ITEMS[k].cat === 'treat') && s.inv[k] > 0);
        if (!owned.length) note(body, 'Your pantry is empty! Visit the Pet Shop on a walk or from Go Out.');
        owned.forEach((k) => g.appendChild(card({ img: G.M.icons.item(k), name: G.ITEMS[k].name, sub: G.ITEMS[k].cat === 'food' ? 'Fill bowl' : 'Hand-feed', badge: s.inv[k], fn: () => { ui.closeSheet(true); G.cur.useFood && G.cur.useFood(k); } })));
        const l = list(body); l.style.marginTop = '12px';
        l.appendChild(li({ icon: 'water', title: 'Refill water bowl', sub: 'Fresh water, always free.', right: Math.round(s.water * 100) + '%', fn: () => { ui.closeSheet(true); G.cur.refillWater && G.cur.refillWater(); } }));
      },
    });
  };
  /* ---- Toys ---- */
  ui.toySheet = function () {
    ui.sheet({
      title: 'Toy box', render(body) {
        note(body, 'Pick a toy, then flick it upward to throw. Squeaky toys squeak when tapped. Hold the rope and drag back to play tug.');
        const g = grid(body);
        Object.keys(G.state.toys).filter((k) => G.state.toys[k] > 0 && G.ITEMS[k]).forEach((k) => g.appendChild(card({ img: G.M.icons.item(k), name: G.ITEMS[k].name, sub: { throw: 'Throw', disc: 'Throw', squeak: 'Squeak', tug: 'Tug' }[G.ITEMS[k].toy], fn: () => { ui.closeSheet(true); G.cur.holdToy && G.cur.holdToy(k); } })));
      },
    });
  };
  /* ---- Tricks ---- */
  ui.trickSheet = function () {
    const p = G.activePet(); if (!p) return;
    ui.sheet({
      title: p.name + '’s tricks', render(body) {
        note(body, 'Teach tricks by touch: do the gesture on your pet, then tap "Good job!" to praise. Three praises and the trick is learned. Learned tricks can be called from here anytime.');
        const l = list(body);
        G.TRICKS.forEach((tr) => {
          if (p.cat && (tr.id === 'beg' || tr.id === 'rollover' || tr.id === 'dead')) return;
          const prog = Math.min(1, p.d.tricks[tr.id] || 0); const learned = prog >= 1;
          l.appendChild(li({ icon: 'star', title: tr.name + (learned ? '' : ' (learning)'), sub: learned ? 'Learned! Tap to call it out.' : 'How: ' + tr.hint, prog, lock: !learned && prog === 0, fn: learned ? () => { ui.closeSheet(true); G.cur.command && G.cur.command(tr.id); } : null }));
        });
      },
    });
  };
  /* ---- Care ---- */
  ui.careSheet = function () {
    const p = G.activePet(); if (!p) return;
    ui.sheet({
      title: 'Care for ' + p.name, render(body) {
        const l = list(body);
        l.appendChild(li({ icon: 'brush', title: 'Brush', sub: 'Stroke with the brush to fluff up the coat. Clean +', fn: () => { ui.closeSheet(true); G.cur.startBrush && G.cur.startBrush(); } }));
        const sh = G.state.inv.shampoo || 0;
        l.appendChild(li({ icon: 'bath', title: 'Bath time', sub: sh ? 'Uses 1 shampoo (' + sh + ' left). Scrub, rinse, shake!' : 'You need shampoo. Buy some at the Pet Shop.', lock: !sh, fn: sh ? () => { ui.closeSheet(true); G.cur.startBath && G.cur.startBath(); } : null }));
        l.appendChild(li({ icon: 'info', title: 'Pet info', sub: 'Stats, personality, tricks and trophies.', fn: () => ui.petInfo(p.d) }));
      },
    });
  };
  /* ---- Dress ---- */
  ui.dressSheet = function () {
    const p = G.activePet(); if (!p) return;
    const slots = [{ id: 'head', name: 'Hats' }, { id: 'neck', name: 'Neck' }, { id: 'collar', name: 'Collars' }, { id: 'face', name: 'Glasses' }];
    if (G.cur.focusPet) G.cur.focusPet(p, 1);
    ui.sheet({
      title: 'Dress up ' + p.name, tabs: slots, render(body, tab) {
        const g = grid(body);
        const cur = p.d.acc[tab];
        g.appendChild(card({ img: 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="32" cy="32" r="22" fill="none" stroke="#c9b8a3" stroke-width="5"/><path d="M17 47L47 17" stroke="#c9b8a3" stroke-width="5"/></svg>'), name: 'None', on: !cur, fn: () => { delete p.d.acc[tab]; p.applyAcc(); G.audio.play('tick'); ui.resheet(); ui.refresh(true); } }));
        const owned = Object.keys(G.state.acc).filter((k) => G.ITEMS[k] && G.ITEMS[k].slot === tab);
        owned.forEach((k) => g.appendChild(card({ img: G.M.icons.item(k), name: G.ITEMS[k].name, on: cur === k, fn: () => { p.d.acc[tab] = k; p.applyAcc(); G.audio.play('sparkle'); p.happy(2); p.excite = 0.8; ui.resheet(); ui.refresh(true); } })));
        if (!owned.length) note(body, 'Nothing here yet. The Pet Shop sells lots of cute things!');
      }, onClose() { if (G.cur.focusPet) G.cur.focusPet(null); },
    });
  };
  /* ---- Go out ---- */
  ui.goSheet = function () {
    const p = G.activePet();
    ui.sheet({
      title: 'Go out', render(body) {
        const l = list(body);
        const dog = p && !p.cat;
        l.appendChild(li({ icon: 'paw', title: 'Walk around Maple Hill', sub: dog ? 'Take ' + p.name + ' on a walk. Meet neighbors, find presents, visit the café.' : 'Cats prefer to stay home. Pick a dog from the top bar to walk.', lock: !dog, fn: dog ? () => { ui.closeSheet(true); G.go('walk'); } : null }));
        l.appendChild(li({ icon: 'disc', title: 'Disc Cup', sub: dog ? 'Flying disc contests. Win prizes and trophies!' : 'Dogs only.', lock: !dog, fn: dog ? () => { ui.closeSheet(true); G.go('frisbee'); } : null }));
        l.appendChild(li({ icon: 'bag', title: 'Pet Shop', sub: 'Food, toys, hats and more.', fn: () => ui.shop() }));
        l.appendChild(li({ icon: 'cup', title: 'Paw & Bean Café', sub: 'Treats for you and your pet.', fn: () => { ui.closeSheet(true); G.go('cafe'); } }));
        l.appendChild(li({ icon: 'kennel', title: 'Kennel', sub: 'Adopt a new puppy or kitten (' + G.state.pets.length + '/4 pets).', fn: () => { ui.closeSheet(true); G.go('kennel'); } }));
      },
    });
  };
  /* ---- Shop ---- */
  ui.shop = function (tab) {
    const port = G.M.icons.person('daisuke');
    const greet = U.pick(['Welcome to Maple Pets! Fresh stock today.', 'Ah, a regular! Have a look around.', 'Hats are 100% guaranteed to be adorable.', 'The frog hat is our bestseller. Ribbit.']);
    ui.sheet({
      title: 'Maple Pets', tabs: G.SHOP_TABS, tab: tab || 'food', render(body, tb) {
        const hd = document.createElement('div'); hd.className = 'row'; hd.style.marginBottom = '10px';
        hd.innerHTML = '<img src="' + port + '" style="width:54px;height:54px;border-radius:16px;background:#fbe9cf" alt=""><div><b>Daisuke</b><div class="note" style="margin:0">' + U.esc(greet) + '</div></div>';
        body.appendChild(hd);
        const g = grid(body); const cats = G.SHOP_TABS.find((t) => t.id === tb).cats;
        Object.keys(G.ITEMS).filter((k) => cats.includes(G.ITEMS[k].cat) && G.ITEMS[k].price > 0 && k !== 'crown' || (tb === 'acc' && k === 'crown')).forEach((k) => {
          const it = G.ITEMS[k]; const unique = it.cat === 'acc' || it.cat === 'toy';
          const have = it.cat === 'toy' ? G.state.toys[k] : it.cat === 'acc' ? G.state.acc[k] : G.state.inv[k];
          const owned = unique && have;
          const c = card({ img: G.M.icons.item(k), name: it.name, sub: it.desc, badge: !unique && have ? have : undefined });
          const b = document.createElement('button'); b.className = 'buy'; b.textContent = owned ? 'Owned' : it.price + ' coins';
          b.disabled = owned || G.state.coins < it.price;
          b.onclick = (e) => { e.stopPropagation(); if (G.state.coins < it.price) return; G.state.coins -= it.price; G.addItem(k, 1); G.audio.play('coin'); ui.toast('Bought ' + it.name + '!'); ui.refresh(); ui.resheet(); G.save(); };
          c.appendChild(b); g.appendChild(c);
        });
      },
    });
  };
  /* ---- Pet info ---- */
  ui.petInfo = function (d) {
    const p = G.petObj(d.id);
    ui.sheet({
      title: d.name, render(body) {
        const top = document.createElement('div'); top.className = 'row'; top.style.alignItems = 'flex-start';
        const days = Math.max(1, Math.floor((Date.now() - d.born) / 86400000) + 1);
        const learned = G.TRICKS.filter((t) => (d.tricks[t.id] || 0) >= 1).map((t) => t.name);
        top.innerHTML = '<img src="' + G.M.icons.pet(d) + '" style="width:96px;height:96px;border-radius:24px;background:#fbe9cf" alt="">' +
          '<div class="kv"><b>Breed</b><span>' + U.esc(G.BREEDS[d.breed].name) + ' (' + U.esc(G.COATS[d.coat].name) + ')</span><b>Sex</b><span>' + (d.sex === 'boy' ? 'Boy' : 'Girl') + '</span><b>Personality</b><span>' + U.esc(G.PERSONALITIES[d.personality].name) + '</span><b>Together</b><span>' + days + ' day' + (days > 1 ? 's' : '') + '</span><b>Walks</b><span>' + (d.walks || 0) + '</span><b>Bond</b><span>' + Math.round(d.bond || 0) + '/100</span>' + (p && !p.cat ? '<b>Disc skill</b><span>' + Math.round(d.disc || 0) + '/100</span>' : '') + '</div>';
        body.appendChild(top);
        note(body, G.PERSONALITIES[d.personality].desc);
        const h = document.createElement('h3'); h.textContent = 'Tricks learned'; body.appendChild(h);
        note(body, learned.length ? learned.join(', ') : 'None yet. Open Tricks to see how to teach them.');
        const r = document.createElement('div'); r.className = 'mrow';
        const rn = document.createElement('button'); rn.className = 'btn ghost'; rn.textContent = 'Rename';
        rn.onclick = () => ui.nameModal({ title: 'Rename ' + d.name, value: d.name, sex: false }).then((v) => { if (v) { d.name = v.name; ui.refresh(true); ui.closeSheet(true); G.save(); } });
        const act = document.createElement('button'); act.className = 'btn'; act.textContent = G.state.active === d.id ? 'Active pet' : 'Make active';
        act.onclick = () => { G.state.active = d.id; ui.refresh(true); ui.closeSheet(true); };
        r.append(rn, act); body.appendChild(r);
      },
    });
  };
  /* ---- Settings ---- */
  ui.settings = function () {
    const s = G.state.settings;
    ui.sheet({
      title: 'Settings', render(body) {
        body.innerHTML = '<h3>Sound</h3><div class="kv" style="align-items:center"><b>Music</b><input type="range" id="sMus" min="0" max="1" step="0.05" value="' + s.music + '"><b>Effects</b><input type="range" id="sSfx" min="0" max="1" step="0.05" value="' + s.sfx + '"></div>' +
          '<h3>How to play</h3><div class="note" style="line-height:1.6">' +
          '<b>Pet</b>: press and stroke on your pet. Try head, chin, back and belly (when lying down).<br>' +
          '<b>Call</b>: tap the floor and your active pet trots over.<br><b>Throw</b>: pick a toy, then flick upward. Faster flick, farther throw.<br>' +
          '<b>Tricks</b>: stroke down on a standing pup to make them sit, circle them to spin, and more (see Tricks). Tap "Good job!" to teach.<br>' +
          '<b>Walks</b>: hold on the ground to lead the way, or use WASD / arrow keys. Tap people to chat.<br><b>Zoom</b>: pinch or scroll at home.</div>' +
          '<h3>Save</h3><p class="note">Your game saves automatically in this browser.</p><button class="btn ghost" id="sReset">Start over</button>';
        body.querySelector('#sMus').oninput = (e) => { s.music = +e.target.value; G.audio.applyVolumes(); };
        body.querySelector('#sSfx').oninput = (e) => { s.sfx = +e.target.value; G.audio.applyVolumes(); };
        body.querySelector('#sReset').onclick = () => ui.confirm('Start over?', 'This erases your pets, coins and items in this browser.', 'Erase and restart').then((ok) => { if (ok) { G.wipe(); G.state = null; location.reload(); } });
      }, onClose: () => G.save(),
    });
  };

  /* ---------------- modal ---------------- */
  ui.modal = function (html, bind) {
    const w = $('#modalWrap'); const m = $('#modal'); m.innerHTML = html; w.classList.remove('hidden'); G.blockInput = true;
    return new Promise((res) => { bind(m, (v) => { w.classList.add('hidden'); G.blockInput = false; res(v); }); });
  };
  ui.confirm = (title, txt, ok) => ui.modal('<h2>' + U.esc(title) + '</h2><p class="note">' + U.esc(txt) + '</p><div class="mrow"><button class="btn ghost" id="mNo">Cancel</button><button class="btn orange" id="mYes">' + U.esc(ok) + '</button></div>', (m, done) => { m.querySelector('#mNo').onclick = () => done(false); m.querySelector('#mYes').onclick = () => done(true); });
  ui.nameModal = function (o) {
    let sex = o.sexVal || 'boy';
    return ui.modal('<h2>' + U.esc(o.title) + '</h2>' + (o.sub ? '<p class="note">' + U.esc(o.sub) + '</p>' : '') + '<input type="text" id="mName" maxlength="12" value="' + U.esc(o.value || '') + '" autocomplete="off" aria-label="Name">' +
      (o.sex !== false ? '<div class="seg"><button id="sB">Boy</button><button id="sG">Girl</button></div>' : '') +
      '<div class="mrow"><button class="btn ghost" id="mRnd">Random</button>' + (o.cancel !== false ? '<button class="btn ghost" id="mNo">Back</button>' : '') + '<button class="btn orange" id="mYes">OK</button></div>', (m, done) => {
      const inp = m.querySelector('#mName'); setTimeout(() => { try { inp.focus(); inp.select(); } catch (e) { } }, 50);
      const seg = () => { if (o.sex === false) return; m.querySelector('#sB').classList.toggle('on', sex === 'boy'); m.querySelector('#sG').classList.toggle('on', sex === 'girl'); };
      if (o.sex !== false) { m.querySelector('#sB').onclick = () => { sex = 'boy'; seg(); }; m.querySelector('#sG').onclick = () => { sex = 'girl'; seg(); }; seg(); }
      m.querySelector('#mRnd').onclick = () => { inp.value = U.pick(G.PET_NAMES); };
      const ok = () => { const v = inp.value.trim().slice(0, 12); if (!v) { inp.focus(); return; } done({ name: v, sex }); };
      m.querySelector('#mYes').onclick = ok; inp.onkeydown = (e) => { if (e.key === 'Enter') ok(); };
      const no = m.querySelector('#mNo'); if (no) no.onclick = () => done(null);
    });
  };

  /* ---------------- dialogue ---------------- */
  function typeText(el, text) {
    return new Promise((res) => {
      let i = 0; el.textContent = '';
      const step = () => { i = Math.min(text.length, i + 2); el.textContent = text.slice(0, i); if (i % 6 === 0) G.audio.play('tick'); if (i >= text.length) { typing = null; res(); } else typing.t = setTimeout(step, 22); };
      typing = { t: 0, skip() { clearTimeout(typing.t); el.textContent = text; typing = null; res(); } };
      step();
    });
  }
  ui.say = async function (who, text, port) {
    const d = $('#dialog'); d.classList.remove('hidden'); G.blockInput = true;
    $('#dlgName').textContent = who; $('#dlgPort').src = port || ''; $('#dlgPort').style.visibility = port ? 'visible' : 'hidden';
    $('#dlgChoices').innerHTML = ''; $('#dlgMore').classList.add('hidden');
    await typeText($('#dlgText'), text);
    $('#dlgMore').classList.remove('hidden');
    await new Promise((res) => { const h = () => { d.removeEventListener('click', h); res(); }; setTimeout(() => d.addEventListener('click', h), 60); });
    $('#dlgMore').classList.add('hidden');
  };
  ui.ask = async function (who, text, opts, port) {
    const d = $('#dialog'); d.classList.remove('hidden'); G.blockInput = true;
    $('#dlgName').textContent = who; $('#dlgPort').src = port || ''; $('#dlgPort').style.visibility = port ? 'visible' : 'hidden';
    $('#dlgChoices').innerHTML = ''; $('#dlgMore').classList.add('hidden');
    await typeText($('#dlgText'), text);
    return new Promise((res) => {
      opts.forEach((o, i) => { const b = document.createElement('button'); b.textContent = o; b.onclick = (e) => { e.stopPropagation(); G.audio.play('pop'); $('#dlgChoices').innerHTML = ''; res(i); }; $('#dlgChoices').appendChild(b); });
    });
  };
  ui.endDialog = function () { $('#dialog').classList.add('hidden'); G.blockInput = false; };
  ui.talk = async function (key, ctx = {}) {
    const N = G.NPCS[key]; if (!N || !N.talk) return;
    const st = G.state.npc[key] = G.state.npc[key] || {}; st.f = st.f || 0; st.flags = st.flags || {};
    const port = N.cat ? G.M.icons.pet({ breed: 'cat', coat: 'black' }) : G.M.icons.person(N.look || key);
    const pet = ctx.pet || G.activePet();
    const noop = () => { };
    const D = {
      say: (t) => ui.say(N.name, t, port), ask: (t, o) => ui.ask(N.name, t, o, port),
      give(id, n = 1) { G.addItem(id, n); G.audio.play('gift'); ui.toast('Received ' + G.ITEMS[id].name + (n > 1 ? ' x' + n : '') + '!', 'gold'); },
      coins(n, msg) { G.addCoins(n, msg); }, friend(n) { st.f += n; },
      get f() { return st.f; }, flag: (k) => !!st.flags[k], setFlag: (k) => { st.flags[k] = 1; },
      once(k, fn) { const kk = 'once_' + k + '_' + (G.walkSession || 0); if (!st.flags[kk]) { st.flags[kk] = 1; fn(); } },
      name: pet ? pet.name : 'your pup', pet, today: G.today(), timeWord: G.timeWord(), season: G.season(),
      play: ctx.play || noop, petBy: ctx.petBy || noop, race: ctx.race || noop, paint: ctx.paint || noop, music: ctx.music || noop, howl: ctx.howl || noop,
    };
    G.blockInput = true;
    try { await N.talk(D); } catch (e) { console.error(e); }
    ui.endDialog(); G.save(); ui.refresh();
    for (const k in st.flags) if (k.startsWith('once_') && !k.endsWith('_' + (G.walkSession || 0))) delete st.flags[k];
  };
  return ui;
})();
