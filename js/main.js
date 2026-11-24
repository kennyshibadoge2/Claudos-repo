'use strict';
/* =========================================================
   Shiba Days — boot + main loop
   ========================================================= */
(function boot() {
  try {
    G.mobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) || Math.min(innerWidth, innerHeight) < 600;
    if (!G.state) G.state = G.load() || G.newState();
    G.initRenderer();
  } catch (e) {
    $('#loading').textContent = 'This device could not start 3D graphics (WebGL). Try another browser.';
    return;
  }
  G.makeFxTextures();
  G.state = G.load() || G.newState();
  G.ui.init();
  G.input.attach($('#gl'));
  // title scene behind the logo
  const ts = G.scenes.title; ts.init(); ts.inited = true; G.cur = ts; G.curName = 'title'; G.fx.attach(ts.scene); G.onResize();
  const fresh = !G.state.pets.length;
  $('#loading').classList.add('hidden');
  const btn = $('#btnStart'); btn.classList.remove('hidden');
  btn.textContent = fresh ? 'Tap to start' : 'Continue';
  btn.onclick = () => {
    G.audio.init(); G.audio.play('chime');
    $('#title').style.transition = 'opacity .5s'; $('#title').style.opacity = '0';
    setTimeout(() => $('#title').classList.add('hidden'), 500);
    if (fresh) G.go('kennel', { first: true });
    else {
      const mins = G.offlineDecay();
      G.go('home');
      if (mins > 60) setTimeout(() => G.ui.toast('Welcome back! Your pets missed you.'), 1400);
    }
  };
  G.audio.track('title');

  let last = performance.now(), saveT = 0, fpsAcc = 0, frames = 0, lowered = false;
  function frame(now) {
    requestAnimationFrame(frame);
    let dt = (now - last) / 1000; last = now;
    if (dt > 0.1) dt = 0.1;
    G.time += dt;
    try { if (G.cur && G.cur.update) G.cur.update(dt); } catch (e) { console.error(e); }
    G.fx.update(dt); G.dreams.update(dt);
    if (G.cur) { G.renderer.render(G.cur.scene, G.cur.camera); G.photos.afterRender(); }
    saveT += dt; if (saveT > 15) { saveT = 0; G.save(); G.checkStamps(); }
    // adaptive quality: drop pixel ratio if the device struggles
    fpsAcc += dt; frames++;
    if (fpsAcc > 4) { const fps = frames / fpsAcc; fpsAcc = 0; frames = 0; if (fps < 32 && !lowered && !G.QUALITY[G.state.settings.quality]) { lowered = true; G.renderer.setPixelRatio(Math.max(1, G.renderer.getPixelRatio() * 0.7)); G.onResize(); } }
  }
  requestAnimationFrame(frame);
  addEventListener('visibilitychange', () => { if (document.hidden) G.save(); });
  addEventListener('pagehide', () => G.save());
  window.__ready = true;
})();
