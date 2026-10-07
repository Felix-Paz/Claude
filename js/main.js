/* =====================================================================
   MUSEUM OF DESIGN · front door
   fonts → loader → the room behind the gate mounts → ticket → in
   ===================================================================== */
(function () {
  'use strict';
  const { $, reduced } = P;

  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

  P.initScroll();
  P.stopScroll();
  P.initCursor();
  MUSEUM.initChrome();
  S3D.init();

  const fonts = Promise.all([
    document.fonts.load('830 expanded 100px "Mona Sans"'),
    document.fonts.load('italic 400 100px "Instrument Serif"'),
    document.fonts.load('500 12px "Geist Mono"')
  ].map(p => p.catch(() => {}))).then(() => document.fonts.ready);

  function ticket() {
    const gate = $('#gate');
    let seen = false;
    try { seen = sessionStorage.getItem('mod-ticket') === '1'; } catch (e) {}
    if (seen || location.hash.length > 2) { gate.remove(); return Promise.resolve(); }
    gate.hidden = false;
    $('.t-date', gate).textContent = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
    $('.t-num', gate).textContent = String(Math.floor(Math.random() * 899999) + 100000);
    const t = $('.ticket', gate), main = $('.ticket-main', gate), stub = $('.ticket-stub', gate);
    gsap.set($('.gate-veil', gate), { opacity: 0 });
    gsap.timeline()
      .to($('.gate-veil', gate), { opacity: 1, duration: 0.6 })
      .fromTo(t, { y: 120, rotate: -10, opacity: 0 }, { y: 0, rotate: -4, opacity: 1, duration: 1.1, ease: 'back.out(1.4)' }, 0.1)
      .fromTo($('.gate-hint', gate), { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.6 }, 0.6);
    // the stub leans as you approach — tear it by clicking or dragging
    const lean = e => {
      const r = t.getBoundingClientRect();
      const k = Math.max(0, Math.min(1, (e.clientX - (r.right - r.width * 0.32)) / (r.width * 0.32)));
      gsap.to(stub, { rotate: k * 6, x: k * 6, duration: 0.4, ease: 'power3.out' });
    };
    t.addEventListener('pointermove', lean);
    return new Promise(resolve => {
      let done = false;
      const tear = () => {
        if (done) return;
        done = true;
        t.removeEventListener('pointermove', lean);
        try { sessionStorage.setItem('mod-ticket', '1'); } catch (e) {}
        const pass = $('.hdr-pass').getBoundingClientRect(), mr = main.getBoundingClientRect();
        const tl = gsap.timeline({ onComplete: () => { gate.remove(); resolve(); } });
        tl.to(stub, { x: 80, y: 340, rotate: 38, opacity: 0, duration: reduced ? 0 : 0.95, ease: 'power2.in' }, 0)
          .to(t, { rotate: 0, duration: 0.25, ease: 'power2.out' }, 0)
          // the ticket flies into your pocket (the passport in the header)
          .to(main, { x: pass.left + pass.width / 2 - (mr.left + mr.width / 2), y: pass.top + pass.height / 2 - (mr.top + mr.height / 2), scale: 0.06, rotate: 12, duration: reduced ? 0 : 0.85, ease: 'power3.inOut' }, 0.22)
          .to(main, { opacity: 0, duration: 0.2 }, reduced ? 0 : 0.92)
          .to($('.gate-hint', gate), { opacity: 0, duration: 0.3 }, 0)
          .to($('.gate-veil', gate), { opacity: 0, duration: 0.6 }, 0.55)
          .fromTo('.hdr-pass', { scale: 1 }, { scale: 1.25, duration: 0.18, yoyo: true, repeat: 1, ease: 'power2.out' }, 1.0);
      };
      t.addEventListener('click', tear);
      t.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tear(); } });
      setTimeout(() => t.focus({ preventScroll: true }), 900);
    });
  }

  P.runLoader(fonts).then(() => {
    MUSEUM.route(true);
    P.body.classList.remove('is-loading');
    gsap.from('.hdr', { y: -80, opacity: 0, duration: 1, ease: 'museum', delay: 0.2, clearProps: 'transform,opacity' });
    return ticket();
  }).then(() => {
    P.startScroll();
    ScrollTrigger.refresh();
  });
})();
