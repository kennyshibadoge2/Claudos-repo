'use strict';
/* =========================================================
   Shiba Days — voice: teach names & trick commands by speaking.
   Engines: claude.ai dictation → browser speech recognition →
   local sound-matching (DTW over spectral fingerprints, offline)
   ========================================================= */
G.voice = (() => {
  const V = { on: false, engine: null, level: 0, train: null, dict: null };
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  let rec = null, stream = null, ctx = null, an = null, timer = null, fbuf = null, tbuf = null;
  // dictation capability (inside claude.ai)
  try { if (window.claude && window.claude.use) window.claude.use('dictation').then((d) => { V.dict = d; if (d) { d.onFinal(({ text }) => emit({ text })); d.onState(({ state }) => { if (state === 'idle' && V.on && V.engine === 'dict') { V.on = false; ui(); } }); } ui(); }).catch(() => { }); } catch (e) { /* not in claude.ai */ }
  V.supported = () => !!(V.dict || SR || (navigator.mediaDevices && navigator.mediaDevices.getUserMedia));
  const pref = () => (G.state && G.state.settings.voiceEngine) || 'auto';
  V.toggle = function () {
    if (V.on) { V.stop(); return; }
    const p = pref();
    if (p !== 'match' && V.dict) {
      V.engine = 'dict'; V.on = true; ui();
      V.dict.start().catch((e) => { V.on = false; ui(); const m = String((e && (e.code || e.message)) || e); G.ui.toast(m.includes('not_granted') ? 'Microphone permission was declined.' : 'Voice could not start here. Try the sound-matching engine in Settings.'); });
      return;
    }
    if (p !== 'match' && SR) {
      try {
        rec = new SR(); rec.continuous = true; rec.interimResults = false; rec.lang = navigator.language || 'en-US';
        rec.onresult = (ev) => { for (let i = ev.resultIndex; i < ev.results.length; i++) if (ev.results[i].isFinal) emit({ text: ev.results[i][0].transcript }); };
        rec.onerror = (ev) => { if (ev.error === 'not-allowed' || ev.error === 'service-not-allowed') { V.on = false; rec = null; ui(); startMatch(); } };
        rec.onend = () => { if (V.on && V.engine === 'sr' && rec) { try { rec.start(); } catch (e) { /* ignore */ } } };
        rec.start(); V.engine = 'sr'; V.on = true; ui(); return;
      } catch (e) { rec = null; }
    }
    startMatch();
  };
  function startMatch() {
    if (!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)) { G.ui.toast('Voice isn’t available in this browser.'); return; }
    navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } }).then((s) => {
      stream = s; ctx = G.audio.ctx || new (window.AudioContext || window.webkitAudioContext)();
      const src = ctx.createMediaStreamSource(s); an = ctx.createAnalyser(); an.fftSize = 1024; an.smoothingTimeConstant = 0.2; src.connect(an);
      fbuf = new Float32Array(an.frequencyBinCount); tbuf = new Float32Array(an.fftSize);
      V.engine = 'match'; V.on = true; ui(); timer = setInterval(frame, 20);
    }).catch(() => { V.on = false; ui(); G.ui.toast('Microphone unavailable here (the claude.ai viewer may block it). It works when the game is hosted on its own page.'); });
  }
  V.stop = function () {
    V.on = false;
    if (V.engine === 'dict' && V.dict) V.dict.stop().catch(() => { });
    if (rec) { try { rec.onend = null; rec.stop(); } catch (e) { } rec = null; }
    if (timer) { clearInterval(timer); timer = null; }
    if (stream) { stream.getTracks().forEach((t) => t.stop()); stream = null; }
    V.engine = null; ui();
  };
  /* ---------- local sound matcher: VAD + 18 mel-ish bands ---------- */
  let floor = 0.01, speaking = false, quiet = 0, loud = 0, cur = [];
  const BANDS = 18; let edges = null;
  function bandEdges() { const sr = ctx.sampleRate, n = an.frequencyBinCount; const mel = (f) => 2595 * Math.log10(1 + f / 700), imel = (m) => 700 * (Math.pow(10, m / 2595) - 1); const lo = mel(120), hi = mel(4500); const e = []; for (let i = 0; i <= BANDS; i++) e.push(Math.min(n - 1, Math.round(imel(lo + (hi - lo) * i / BANDS) / (sr / 2) * n))); return e; }
  function frame() {
    if (!an) return;
    an.getFloatTimeDomainData(tbuf); let rms = 0; for (let i = 0; i < tbuf.length; i++) rms += tbuf[i] * tbuf[i]; rms = Math.sqrt(rms / tbuf.length);
    V.level = U.clamp(rms * 12, 0, 1);
    const thr = Math.max(0.012, floor * 3.2);
    if (!speaking) { floor = U.lerp(floor, rms, 0.02); if (rms > thr) { if (++loud >= 2) { speaking = true; cur = []; quiet = 0; } } else loud = 0; }
    if (speaking) {
      an.getFloatFrequencyData(fbuf); if (!edges) edges = bandEdges();
      const f = new Float32Array(BANDS); for (let b = 0; b < BANDS; b++) { let e = 0; for (let k = edges[b]; k <= Math.max(edges[b], edges[b + 1] - 1); k++) e += Math.pow(10, fbuf[k] / 10); f[b] = Math.log10(e + 1e-12); }
      cur.push(f);
      if (rms < thr) quiet++; else quiet = 0;
      if (quiet > 18 || cur.length > 150) { speaking = false; loud = 0; const fr = cur.slice(0, Math.max(0, cur.length - quiet)); if (fr.length >= 8) emit({ feats: normalize(fr) }); }
    }
  }
  function normalize(fr) {
    const out = []; for (let i = 0; i < fr.length; i += 2) out.push(Array.from(fr[i]));
    const mean = new Array(BANDS).fill(0); for (const f of out) for (let b = 0; b < BANDS; b++) mean[b] += f[b] / out.length;
    let v = 0; for (const f of out) for (let b = 0; b < BANDS; b++) { f[b] -= mean[b]; v += f[b] * f[b]; } const sd = Math.sqrt(v / (out.length * BANDS)) || 1;
    return out.map((f) => f.map((x) => Math.round(x / sd * 100) / 100));
  }
  function dtw(a, b) {
    const n = a.length, m = b.length, W = Math.max(4, Math.round(Math.max(n, m) * 0.35)); const INF = 1e9;
    let prev = new Float64Array(m + 1).fill(INF), cur2 = new Float64Array(m + 1).fill(INF); prev[0] = 0;
    for (let i = 1; i <= n; i++) {
      cur2.fill(INF); const c = Math.round(i * m / n);
      for (let j = Math.max(1, c - W); j <= Math.min(m, c + W); j++) { let d = 0; const x = a[i - 1], y = b[j - 1]; for (let k = 0; k < x.length; k++) { const t = x[k] - y[k]; d += t * t; } d = Math.sqrt(d); cur2[j] = d + Math.min(prev[j], prev[j - 1], cur2[j - 1]); }
      const t = prev; prev = cur2; cur2 = t;
    }
    return prev[m] / (n + m);
  }
  /* ---------- text similarity ---------- */
  const norm = (s) => String(s).toLowerCase().normalize('NFKD').replace(/[^\p{L}\p{N} ]/gu, ' ').replace(/\s+/g, ' ').trim();
  function lev(a, b) { const m = a.length, n = b.length; if (!m || !n) return Math.max(m, n); let p = Array.from({ length: n + 1 }, (_, i) => i); for (let i = 1; i <= m; i++) { const c = [i]; for (let j = 1; j <= n; j++) c[j] = Math.min(p[j] + 1, c[j - 1] + 1, p[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); p = c; } return p[n]; }
  function textSim(utt, tpl) {
    const u = norm(utt), t = norm(tpl); if (!u || !t) return 0;
    const ws = u.split(' '); const cands = [u, ...ws]; for (let i = 0; i < ws.length - 1; i++) cands.push(ws[i] + ' ' + ws[i + 1], ws[i] + ws[i + 1]);
    let best = 0; for (const c of cands) best = Math.max(best, 1 - lev(c, t) / Math.max(c.length, t.length)); return best;
  }
  /* ---------- templates ---------- */
  function store(petId) { const s = G.state; s.voice = s.voice || {}; return (s.voice[petId] = s.voice[petId] || { name: [], tricks: {} }); }
  V.store = store;
  function thrOf(list) { const f = list.filter((t) => t.f); if (f.length < 2) return 2.2; let sum = 0, n = 0; for (let i = 0; i < f.length; i++) for (let j = i + 1; j < f.length; j++) { sum += dtw(f[i].f, f[j].f); n++; } return U.clamp((sum / n) * 1.5, 0.6, 3.2); }
  function score(utt, list) {
    let best = null;
    for (const t of list) {
      if (utt.text !== undefined && t.t) { const s = textSim(utt.text, t.t); const ok = s >= (norm(t.t).length <= 3 ? 0.66 : 0.6); if (ok && (!best || s > best.s)) best = { s, d: 1 - s }; }
      if (utt.feats && t.f) { const d = dtw(utt.feats, t.f); if (!best || d < best.d) best = { d, s: 0, feat: true }; }
    }
    return best;
  }
  V.classify = function (utt, pet) {
    const st = store(pet.d.id); const cands = [];
    if (st.name.length) cands.push({ kind: 'name', id: 'name', list: st.name });
    else if (utt.text !== undefined) cands.push({ kind: 'name', id: 'name', list: [{ t: pet.name }], weak: true });
    for (const k in st.tricks) if (st.tricks[k].length) cands.push({ kind: 'trick', id: k, list: st.tricks[k] });
    const res = cands.map((c) => ({ c, r: score(utt, c.list) })).filter((x) => x.r);
    if (!res.length) return null;
    res.sort((a, b) => a.r.d - b.r.d); const b0 = res[0];
    if (b0.r.feat) { const thr = b0.c.thr || (b0.c.thr = thrOf(b0.c.list)); if (b0.r.d > thr) return null; if (res[1] && res[1].r.feat && b0.r.d > res[1].r.d * 0.88) return null; }
    return { kind: b0.c.kind, id: b0.c.id, weak: b0.c.weak };
  };
  V.trainStart = function (opts) { V.train = Object.assign({ until: G.time + (opts.timeout || 9) }, opts); };
  /* ---------- dispatch ---------- */
  function emit(utt) {
    if (utt.text !== undefined && !norm(utt.text)) return;
    G.ui.voiceHeard(utt);
    if (V.train && G.time < V.train.until) { const t = V.train; V.train = null; try { t.cb(utt); } catch (e) { console.error(e); } return; }
    V.train = null;
    const pet = G.activePet(); if (!pet || !pet.root.parent) return;
    const m = V.classify(utt, pet);
    if (!m) { pet.tiltT = 1.2; pet.tiltDir = U.chance(0.5) ? 1 : -1; pet.emote('q', 1); pet.lookCam = 2; return; }
    if (m.kind === 'name' && m.weak && (pet.d.nameLearn || 0) < 1) { pet.emote('q', 1); pet.tiltT = 1.2; G.ui.toast(pet.name + ' doesn’t know that name yet. Press Call to teach it by voice!'); return; }
    const sc = G.cur; if (sc && sc.onVoice && sc.onVoice(m.kind, m.id, pet) !== false) return;
    if (m.kind === 'name') { pet.emote('bang', 0.8); pet.lookCam = 3; pet.excite = 1; pet.voice(); }
    else { pet.do((function* () { pet.lookCam = 3; yield* pet.trick(m.id); pet.happy(2); })()); }
  }
  V.emit = emit; V.textSim = textSim; V.dtw = dtw;
  /* ---------- HUD ---------- */
  function ui() { const b = $('#btnMic'); if (!b) return; b.classList.toggle('hidden', !V.supported()); b.classList.toggle('listening', V.on); b.title = V.on ? 'Listening (' + V.engine + ') — tap to stop' : 'Voice commands: tap to start'; }
  V.ui = ui;
  setInterval(() => { const r = $('#micRing'); if (r) r.style.transform = 'scale(' + (1 + (V.on ? (V.engine === 'match' ? V.level * 0.7 : 0.15 + Math.abs(Math.sin(G.time * 3)) * 0.15) : 0)) + ')'; }, 60);
  return V;
})();

/* ---------- training flows (used by scenes) ---------- */
G.voiceTeachName = function (pet, onProgress) {
  const st = G.voice.store(pet.d.id);
  G.ui.hint('Say ' + pet.name + '’s name into the mic!', 6000);
  pet.lookCam = 3; pet.emote('dots', 6);
  G.voice.trainStart({ timeout: 9, cb: (utt) => {
    const tpl = utt.feats ? { f: utt.feats } : { t: utt.text };
    if (st.name.length && utt.text !== undefined) { const ok = st.name.some((t) => t.t && G.voice.textSim(utt.text, t.t) >= 0.55) || G.voice.textSim(utt.text, pet.name) >= 0.55; if (!ok) { pet.tiltT = 1.2; pet.emote('q'); G.ui.toast('Hmm, that sounded different. Say the same name each time!'); return; } }
    st.name.push(tpl); if (st.name.length > 5) st.name.shift(); delete st.thr;
    pet.d.nameLearn = Math.min(1, (pet.d.nameLearn || 0) + 0.34);
    if (onProgress) onProgress(pet.d.nameLearn);
  } });
};
G.voiceTeachTrick = function (pet, trickId, n = 0) {
  const st = G.voice.store(pet.d.id); const tr = G.TRICKS.find((t) => t.id === trickId);
  if (n === 0) st.tricks[trickId] = [];
  G.ui.hint('Say your command for "' + tr.name + '" (' + (n + 1) + '/2)', 6000);
  pet.lookCam = 3; pet.emote('dots', 6);
  G.voice.trainStart({ timeout: 9, cb: (utt) => {
    st.tricks[trickId].push(utt.feats ? { f: utt.feats } : { t: utt.text });
    pet.tiltT = 1; pet.emote('bang', 0.8);
    if (st.tricks[trickId].length < 2) setTimeout(() => G.voiceTeachTrick(pet, trickId, 1), 700);
    else { G.audio.play('chime'); G.ui.banner(pet.name + ' knows the word', 'for ' + tr.name + '!', 2000); pet.happy(4); G.save(); }
  } });
};
G.ui.voiceHeard = function (utt) { const el = $('#voiceHeard'); if (!el) return; el.textContent = utt.text !== undefined ? 'Heard: “' + utt.text.trim().slice(0, 40) + '”' : 'Heard a sound'; el.style.opacity = 1; clearTimeout(G.ui._vh); G.ui._vh = setTimeout(() => (el.style.opacity = 0), 1800); };
