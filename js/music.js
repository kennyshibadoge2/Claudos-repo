'use strict';
/* =========================================================
   Shiba Days — music engine: composed loops per scene,
   plucked guitar (Karplus-Strong), e-piano, pad, chip lead, drums,
   plus Kenji's busking songs (public-domain melodies)
   ========================================================= */
(() => {
  const A = G.audio;
  const NOTE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
  const midi = (tok) => { const m = /^([A-G])([#b]?)(\d)$/.exec(tok); if (!m) return null; return 12 * (+m[3] + 1) + NOTE[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0); };
  const CH = { '': [0, 4, 7], m: [0, 3, 7], '7': [0, 4, 7, 10], maj7: [0, 4, 7, 11], m7: [0, 3, 7, 10], '6': [0, 4, 7, 9], sus: [0, 5, 7] };
  const chord = (sym) => { const m = /^([A-G])([#b]?)(.*)$/.exec(sym); const root = 48 + NOTE[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0); return { root, notes: (CH[m[3]] || CH['']).map((i) => root + i) }; };
  // melody: array of bars, each "tok tok ..." with 8 tokens (8th notes). "-" sustains, "." rests
  function mel(bars, per = 8) {
    const ev = []; const stepPer = 16 / per; let last = null;
    bars.forEach((bar, b) => bar.trim().split(/\s+/).forEach((tok, i) => {
      const st = b * 16 + i * stepPer;
      if (tok === '-') { if (last) last.len += stepPer; return; }
      if (tok === '.') { last = null; return; }
      const m = midi(tok); if (m === null) return; last = { step: st, m, len: stepPer }; ev.push(last);
    }));
    return ev;
  }
  // songs
  const SONGS = {
    home: { bpm: 86, inst: 'ep', night: true, chords: ['F', 'Am7', 'Bbmaj7', 'C7', 'F', 'Dm7', 'Gm7', 'C7'],
      lead: mel(['A4 - C5 - F5 - E5 C5', 'E5 - - D5 C5 - A4 -', 'D5 - F5 - A5 - G5 F5', 'E5 - - - G4 - . .', 'A4 - C5 - F5 - G5 A5', 'F5 - E5 D5 C5 - A4 -', 'Bb4 - D5 - C5 - Bb4 A4', 'G4 - - - . . . .']),
      bass: 'R . . . 5 . . . R . . . 5 . 3 .', drums: { kick: 'x.......x.......', hat: '..x...x...x...x.', shaker: 'x.x.x.x.x.x.x.x.' }, arp: true },
    walk: { bpm: 112, inst: 'square', night: true, swing: 0.12, chords: ['C', 'G', 'Am', 'F', 'C', 'G', 'F', 'C'],
      lead: mel(['E5 G5 E5 C5 D5 E5 - C5', 'D5 - B4 G4 A4 B4 - G4', 'C5 E5 A5 - G5 E5 - C5', 'F5 - E5 - D5 - C5 -', 'E5 G5 C6 - B5 G5 E5 G5', 'D5 - G5 - F5 D5 B4 -', 'A4 C5 F5 - E5 C5 D5 E5', 'C5 - - - G4 - C5 .']),
      bass: 'R . R . 5 . R . R . R . 5 . 8 .', drums: { kick: 'x...x...x...x...', snare: '....x.......x...', hat: 'x.x.x.x.x.x.x.x.' }, pluckCh: true },
    cafe: { bpm: 92, inst: 'ep', swing: 0.22, chords: ['Dm7', 'G7', 'Cmaj7', 'A7', 'Dm7', 'G7', 'Cmaj7', 'A7'],
      lead: mel(['A4 - C5 - F5 E5 - D5', 'B4 - D5 F5 - E5 D5 -', 'E5 - G5 B5 - A5 G5 E5', 'C#5 - E5 - G5 - E5 -', 'F5 - - E5 D5 - C5 A4', 'B4 - D5 - F5 - A5 G5', 'E5 - - - D5 C5 B4 -', 'A4 - C#5 - E5 - . .']),
      bass: 'R . . . 3 . . . 5 . . . 6 . . .', drums: { kick: 'x.......x.......', rim: '....x.......x...', hat: 'x..x..x.x..x..x.' }, pad: true },
    contest: { bpm: 138, inst: 'square', chords: ['G', 'D', 'Em', 'C', 'G', 'D', 'C', 'G'],
      lead: mel(['G5 - D5 G5 B5 - A5 G5', 'F#5 - A5 - D6 - A5 F#5', 'G5 - E5 G5 B5 - G5 E5', 'C6 - B5 A5 G5 - E5 -', 'D5 G5 B5 D6 - B5 G5 B5', 'A5 - F#5 A5 D6 - C6 A5', 'E5 G5 C6 - D5 F#5 A5 -', 'G5 - - - D5 - G5 .']),
      bass: 'R . 8 . R . 8 . R . 8 . R . 5 8', drums: { kick: 'x...x...x...x..x', snare: '....x.......x...', hat: 'xxxxxxxxxxxxxxxx', clap: '....x.......x...' }, pluckCh: true },
    contestIntro: { bpm: 100, inst: 'square', chords: ['C', 'F', 'G', 'C'],
      lead: mel(['C5 - E5 G5 - - E5 -', 'F5 - A5 C6 - - A5 -', 'G5 - B5 D6 - C6 B5 -', 'C6 - - - G5 - - .']),
      bass: 'R . . . R . . . 5 . . . R . . .', drums: { kick: 'x.......x.......', snare: '............x.x.', hat: 'x...x...x...x...' } },
    victory: { bpm: 128, inst: 'square', chords: ['C', 'F', 'G', 'C'],
      lead: mel(['C5 E5 G5 C6 - - G5 C6', 'A5 - F5 A5 C6 - A5 -', 'B5 - G5 B5 D6 - B5 D6', 'C6 - - - - - . .']),
      bass: 'R . 8 . R . 8 . R . 8 . R . 8 .', drums: { kick: 'x...x...x...x...', snare: '....x.......x...', hat: 'x.x.x.x.x.x.x.x.' }, pluckCh: true },
    title: { bpm: 76, inst: 'pluck', chords: ['Cmaj7', 'Am7', 'Fmaj7', 'G6'],
      lead: mel(['E5 - - G5 - - D5 -', 'C5 - - E5 - - A4 -', 'A4 - C5 - E5 - G5 -', 'D5 - - - B4 - . .']),
      bass: 'R . . . . . . . 5 . . . . . . .', drums: { shaker: '..x...x...x...x.' }, arp: true, pad: true },
    kennel: { bpm: 104, inst: 'ep', chords: ['F', 'C', 'Dm', 'Bb'],
      lead: mel(['C5 F5 A5 F5 C5 F5 A5 -', 'C5 E5 G5 E5 C5 E5 G5 -', 'D5 F5 A5 F5 D5 F5 A5 C6', 'Bb5 - A5 - G5 - F5 .']),
      bass: 'R . 5 . R . 5 . R . 5 . R . 8 .', drums: { kick: 'x.......x.......', snare: '....x.......x...', shaker: 'x.x.x.x.x.x.x.x.' } },
    shop: { bpm: 98, inst: 'ep', swing: 0.15, chords: ['C', 'Am', 'Dm7', 'G7'],
      lead: mel(['G4 C5 E5 - D5 C5 A4 -', 'A4 C5 E5 - D5 C5 E5 -', 'F5 - E5 D5 C5 - A4 -', 'B4 - D5 - G5 - . .']),
      bass: 'R . . . 5 . . . R . . . 5 . . .', drums: { kick: 'x.......x.......', rim: '....x.......x...', shaker: 'x.x.x.x.x.x.x.x.' } },
  };
  // Kenji's public-domain busking songs
  const BUSK = {
    sakura: { bpm: 70, chords: ['Am', 'Am', 'Am', 'Dm', 'Am', 'E', 'Am', 'Dm', 'Am', 'E', 'Am', 'Am', 'Dm', 'E'],
      lead: mel(['A4 - A4 - B4 - - -', 'A4 - A4 - B4 - - -', 'A4 - B4 - C5 - B4 -', 'A4 - B4 A4 F4 - - -', 'E4 - C4 - E4 - F4 -', 'E4 - E4 C4 B3 - - -', 'A4 - B4 - C5 - B4 -', 'A4 - B4 A4 F4 - - -', 'E4 - C4 - E4 - F4 -', 'E4 - E4 C4 B3 - - -', 'A4 - A4 - B4 - - -', 'A4 - A4 - B4 - - -', 'E4 - F4 - B4 A4 F4 -', 'E4 - - - - - - -']) },
    twinkle: { bpm: 84, chords: ['C', 'F', 'C', 'G', 'C', 'G', 'C', 'G', 'C', 'F', 'C', 'G'],
      lead: mel(['C5 - C5 - G5 - G5 -', 'A5 - A5 - G5 - - -', 'F5 - F5 - E5 - E5 -', 'D5 - D5 - C5 - - -', 'G5 - G5 - F5 - F5 -', 'E5 - E5 - D5 - - -', 'G5 - G5 - F5 - F5 -', 'E5 - E5 - D5 - - -', 'C5 - C5 - G5 - G5 -', 'A5 - A5 - G5 - - -', 'F5 - F5 - E5 - E5 -', 'D5 - D5 - C5 - - -']) },
    ode: { bpm: 132, chords: ['C', 'G', 'C', 'G', 'C', 'G', 'C', 'G7', 'C'],
      lead: mel(['E5 - E5 - F5 - G5 -', 'G5 - F5 - E5 - D5 -', 'C5 - C5 - D5 - E5 -', 'E5 - - D5 D5 - - -', 'E5 - E5 - F5 - G5 -', 'G5 - F5 - E5 - D5 -', 'C5 - C5 - D5 - E5 -', 'D5 - - C5 C5 - - -', '. . . . . . . .']) },
  };
  const BUSK_NAMES = { sakura: 'Sakura Sakura', twinkle: 'Twinkle Twinkle Little Star', ode: 'Ode to Joy' };
  G.BUSK_NAMES = BUSK_NAMES;

  /* ---------------- instruments ---------------- */
  let mainBus = null, buskBus = null, verb = null;
  function buses() {
    if (mainBus) return true; if (!A.ctx) return false;
    const c = A.ctx; const { mus, delay } = A.bus();
    mainBus = c.createGain(); mainBus.gain.value = 1; mainBus.connect(mus);
    buskBus = c.createGain(); buskBus.gain.value = 0; buskBus.connect(mus); buskBus.connect(delay);
    verb = delay; return true;
  }
  const ks = {};
  function ksBuf(m) {
    if (ks[m]) return ks[m];
    const c = A.ctx, sr = c.sampleRate, N = Math.max(2, Math.round(sr / mtof(m))), len = Math.floor(sr * 1.8);
    const buf = c.createBuffer(1, len, sr), d = buf.getChannelData(0), ring = new Float32Array(N);
    for (let i = 0; i < N; i++) ring[i] = Math.random() * 2 - 1;
    const decay = 0.9965 - Math.max(0, m - 64) * 0.0006; let idx = 0;
    for (let i = 0; i < len; i++) { const nx = (idx + 1) % N; const v = ring[idx]; d[i] = v; ring[idx] = decay * 0.5 * (v + ring[nx]); idx = nx; }
    return (ks[m] = buf);
  }
  function env(g, t, a, peak, dur) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + dur); }
  function pluck(m, t, vol, dest, bright = 3200) { const c = A.ctx; const s = c.createBufferSource(); s.buffer = ksBuf(m); const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = bright; const g = c.createGain(); g.gain.value = vol; s.connect(f); f.connect(g); g.connect(dest); s.start(t); s.stop(t + 1.8); }
  function ep(m, t, dur, vol, dest) { const c = A.ctx; for (const [mul, v, dec] of [[1, 1, 1.2], [2.001, 0.35, 0.5], [3.998, 0.08, 0.25]]) { const o = c.createOscillator(); o.type = 'sine'; o.frequency.value = mtof(m) * mul; const g = c.createGain(); env(g, t, 0.008, vol * v, Math.max(0.25, dur) * dec); o.connect(g); g.connect(dest); o.start(t); o.stop(t + dur * dec + 0.4); } }
  function chip(m, t, dur, vol, dest, type = 'square') { const c = A.ctx; const o = c.createOscillator(); o.type = type; o.frequency.value = mtof(m); const vib = c.createOscillator(); vib.frequency.value = 5.5; const vg = c.createGain(); vg.gain.value = mtof(m) * 0.006; vib.connect(vg); vg.connect(o.frequency); const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 2600; const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01); g.gain.setValueAtTime(vol * 0.8, t + Math.max(0.02, dur - 0.05)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.08); o.connect(f); f.connect(g); g.connect(dest); o.start(t); vib.start(t + 0.12); o.stop(t + dur + 0.1); vib.stop(t + dur + 0.1); }
  function pad(notes, t, dur, vol, dest) { const c = A.ctx; const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 900; const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + dur * 0.3); g.gain.linearRampToValueAtTime(0.0001, t + dur); f.connect(g); g.connect(dest); for (const m of notes) for (const det of [-6, 6]) { const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = mtof(m); o.detune.value = det; o.connect(f); o.start(t); o.stop(t + dur + 0.05); } }
  function bass(m, t, dur, vol, dest) { const c = A.ctx; const o = c.createOscillator(); o.type = 'triangle'; o.frequency.value = mtof(m); const o2 = c.createOscillator(); o2.type = 'sine'; o2.frequency.value = mtof(m) / 2; const g = c.createGain(); env(g, t, 0.01, vol, dur * 0.9); o.connect(g); o2.connect(g); g.connect(dest); o.start(t); o2.start(t); o.stop(t + dur + 0.1); o2.stop(t + dur + 0.1); }
  function noiseHit(t, vol, type, freq, q, dur, dest) { const c = A.ctx; const s = c.createBufferSource(); s.buffer = A._noise || (A._noise = (() => { const b = c.createBuffer(1, c.sampleRate, c.sampleRate); const d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; return b; })()); const f = c.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q; const g = c.createGain(); env(g, t, 0.002, vol, dur); s.connect(f); f.connect(g); g.connect(dest); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.05); }
  const DR = {
    kick(t, v, d) { const c = A.ctx; const o = c.createOscillator(); o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.12); const g = c.createGain(); env(g, t, 0.003, v * 0.9, 0.18); o.connect(g); g.connect(d); o.start(t); o.stop(t + 0.25); },
    snare(t, v, d) { noiseHit(t, v * 0.5, 'bandpass', 1800, 0.8, 0.14, d); const c = A.ctx; const o = c.createOscillator(); o.frequency.value = 190; const g = c.createGain(); env(g, t, 0.002, v * 0.25, 0.07); o.connect(g); g.connect(d); o.start(t); o.stop(t + 0.1); },
    clap(t, v, d) { for (let i = 0; i < 3; i++) noiseHit(t + i * 0.011, v * 0.3, 'bandpass', 1200, 1.2, 0.06, d); },
    hat(t, v, d) { noiseHit(t, v * 0.18, 'highpass', 7500, 0.7, 0.035, d); },
    shaker(t, v, d) { noiseHit(t, v * 0.1, 'highpass', 5500, 0.6, 0.06, d); },
    rim(t, v, d) { noiseHit(t, v * 0.25, 'bandpass', 3200, 4, 0.03, d); },
  };

  /* ---------------- scheduler ---------------- */
  let cur = null, curName = null, nextT = 0, step = 0, fadeT = 0;
  let busk = null, bNext = 0, bStep = 0, buskMix = 0;
  function loopLen(song) { return song.chords.length * 16; }
  function playStep(song, s, t, spb, night, dest) {
    const bar = Math.floor(s / 16) % song.chords.length, st = s % 16; const ch = chord(song.chords[bar]);
    const mainVol = night ? 0.7 : 1;
    for (const e of song.lead) if (e.step === s % loopLen(song)) {
      const dur = e.len * spb; const v = 0.09 * mainVol;
      if (song.inst === 'ep' || night) ep(e.m, t, dur, v * 0.9, dest); else if (song.inst === 'pluck') pluck(e.m, t, v * 1.6, dest); else chip(e.m, t, dur * 0.92, v * 0.45, dest, 'square');
      if (song.inst !== 'pluck' && !night && Math.random() < 0.25) A.bus().delay && chip(e.m + 12, t, dur * 0.5, v * 0.06, verb, 'triangle');
    }
    if (st === 0) { if (song.pad || night) pad(ch.notes, t, spb * 16, 0.016 * (night ? 1.4 : 1), dest); }
    if (song.pluckCh && !night && (st === 2 || st === 6 || st === 10 || st === 14)) ch.notes.forEach((m, i) => pluck(m + 12, t + i * 0.012, 0.05, dest));
    if (song.arp && st % 2 === 0) { const n = ch.notes; pluck(n[(st / 2) % n.length] + 12, t, night ? 0.05 : 0.07, dest, 2400); }
    const bt = song.bass.split(/\s+/)[st];
    if (bt && bt !== '.') { const off = { R: 0, '3': ch.notes[1] - ch.root, '5': 7, '6': 9, '8': 12, b7: 10 }[bt] || 0; bass(ch.root - 12 + off, t, spb * 3, 0.16 * mainVol, dest); }
    if (song.drums) for (const k in song.drums) { if (night && k !== 'shaker' && k !== 'kick') continue; if (song.drums[k][st] === 'x') DR[k](t, (night ? 0.5 : 1) * (k === 'kick' ? 0.8 : 0.7), dest); }
  }
  function schedule() {
    if (!A.ctx || !buses()) return;
    const now = A.ctx.currentTime;
    if (cur) {
      const night = cur.night && G.daylight() < 0.3;
      const spb = 60 / (cur.bpm * (night ? 0.88 : 1)) / 4;
      if (nextT < now) nextT = now + 0.05;
      while (nextT < now + 0.2) { const sw = cur.swing && step % 2 ? spb * cur.swing * 2 : 0; try { playStep(cur, step, nextT + sw, spb, night, mainBus); } catch (e) { if (!A._mErr) { A._mErr = 1; console.error("music", e); } } nextT += spb; step++; }
    }
    if (busk) {
      const b = BUSK[busk]; const spb = 60 / b.bpm / 4; if (bNext < now) bNext = now + 0.05;
      while (bNext < now + 0.2) {
        const s = bStep % loopLen(b), st = s % 16, ch = chord(b.chords[Math.floor(s / 16)]);
        if (buskMix > 0.02) {
          for (const e of b.lead) if (e.step === s) pluck(e.m, bNext, 0.22, buskBus, 4200);
          if (st === 0 || st === 8) ch.notes.forEach((m, i) => pluck(m, bNext + i * 0.018, 0.09, buskBus, 2600));
          if (st === 4 || st === 12) ch.notes.slice().reverse().forEach((m, i) => pluck(m + 12, bNext + i * 0.012, 0.05, buskBus, 2200));
          if (st === 0) pluck(ch.root - 12, bNext, 0.16, buskBus, 1500);
        }
        bNext += spb; bStep++;
      }
    }
    if (mainBus) { mainBus.gain.setTargetAtTime(1 - buskMix * 0.88, now, 0.3); buskBus.gain.setTargetAtTime(buskMix * 1.1, now, 0.3); }
  }
  setInterval(schedule, 50);
  A.track = function (name) {
    if (name === curName) return; curName = name; cur = SONGS[name] || null; step = 0; nextT = A.ctx ? A.ctx.currentTime + 0.25 : 0;
  };
  A.busk = function (song, mix) { if (song !== busk) { busk = song; bStep = 0; bNext = A.ctx ? A.ctx.currentTime + 0.1 : 0; } buskMix = song ? U.clamp(mix, 0, 1) : 0; };
  A.buskSong = () => busk;
})();
