/* =====================================================================
   PRINCIPIA · main — boot order
   ===================================================================== */
(function () {
  'use strict';
  const { $, $$ } = P;

  // always start at the top: the story has a beginning
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  if (!location.hash) window.scrollTo(0, 0);

  P.initScroll();
  P.stopScroll();
  P.initCursor();
  P.initClock();
  P.initMenu();
  P.initAnchors();
  P.initGrid();
  P.initCopy();

  let hero = null;
  const heroSec = $('#top');

  // fit the hero lines to the measure (the width axis does the work)
  function fitHero() {
    const l1 = $('.hl-1'), l3 = $('.hl-3');
    const f = P.fit(l1, { box: $('.hero-type'), vw: 12, min: 125, max: 125, maxSize: P.vw() * 0.2 });
    l3.style.fontSize = f.size + 'px';
    l3.style.fontStretch = '125%';
    $('.hl-2').style.fontSize = (f.size * 1.1) + 'px';
  }

  function boot() {
    fitHero();
    if (!P.reduced) {
      try { hero = P.HeroGL.create(heroSec); } catch (e) { console.warn('[principia] webgl unavailable', e); hero = null; }
    }
    if (hero) { hero.setIntro(0); hero.renderOnce(); }

    // chapters
    const chapters = (P.chapters || []);
    chapters.forEach(fn => { try { fn(); } catch (e) { console.error('[principia] chapter failed', e); } });

    P.initThemes();
    P.reveals();
    P.initMagnetic();

    let rT;
    addEventListener('resize', () => {
      clearTimeout(rT);
      rT = setTimeout(() => {
        fitHero();
        if (hero) hero.resize();
        P.emit('resize');
        ScrollTrigger.refresh();
      }, 150);
    });
  }

  function heroIn() {
    const items = $$('[data-hero-in]');
    const tl = gsap.timeline();
    tl.from('.hdr', { y: -80, opacity: 0, duration: 1.1, ease: 'principia', clearProps: 'transform' }, 0.2)
      .from(items, { y: 24, opacity: 0, duration: 1.2, ease: 'principia', stagger: 0.08 }, 0.35);
    if (hero) tl.add(hero.intro(2.4), 0);
    else tl.from('.hero-type .hl', { yPercent: 40, opacity: 0, duration: 1.4, ease: 'principia', stagger: 0.1 }, 0.1);
    return tl;
  }

  // each load is caught on its own, so one bad face can't cut the wait short for the others
  const fontsLoaded = Promise.all([
    document.fonts.load('830 expanded 100px "Mona Sans"'),
    document.fonts.load('italic 400 100px "Instrument Serif"'),
    document.fonts.load('400 100px "Instrument Serif"'),
    document.fonts.load('500 12px "Geist Mono"')
  ].map(p => p.catch(() => {}))).then(() => document.fonts.ready);
  const timeout = new Promise(r => setTimeout(r, 4000));

  Promise.race([fontsLoaded, timeout]).then(() => {
    boot();
    P.on('reveal', () => { P.startScroll(); if (hero) hero.start(); heroIn(); });
    P.runLoader().then(() => {
      ScrollTrigger.refresh();
      if (location.hash && $(location.hash)) setTimeout(() => P.scrollTo(location.hash, { duration: 0.01 }), 50);
    });
  });
})();
