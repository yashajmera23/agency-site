import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

const isPhone = () => window.innerWidth < 640;
const finePointer = () => window.matchMedia('(pointer: fine)').matches;

// Before/after slider works with or without motion.
const sliders = [...document.querySelectorAll('.ba')].map((ba) => {
  const input = ba.querySelector('input');
  const set = (v) => {
    if (v !== undefined) input.value = v;
    ba.style.setProperty('--pos', `${input.value}%`);
  };
  input.addEventListener('input', () => set());
  set();
  return { ba, input, set };
});

const mm = gsap.matchMedia();

mm.add('(prefers-reduced-motion: no-preference)', () => {
  // The page turns motion on before first paint (see index.astro).
  if (!document.documentElement.classList.contains('motion')) return;

  // Smooth scrolling, driven by GSAP's clock so the two stay in step.
  const lenis = new Lenis();
  lenis.on('scroll', ScrollTrigger.update);
  const tick = (t) => lenis.raf(t * 1000);
  gsap.ticker.add(tick);
  gsap.ticker.lagSmoothing(0);

  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (id.length < 2) return;
      const target = document.querySelector(id);
      if (!target) return;
      // while the intro holds the page still, let the browser jump there itself
      if (lenis.isStopped) return;
      e.preventDefault();
      lenis.scrollTo(target);
    });
  });

  const dots = dotField(document.querySelector('.hero__dots'));

  intro(lenis);
  hero(dots);
  header();
  progress();
  statement();
  marquee(lenis);
  headings();
  reveals();
  slider();
  processScroll();
  work();
  about();
  countUp();
  cta();
  buttons();
  cards();
  compare();
  pointer();

  if (document.fonts?.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());

  return () => {
    gsap.ticker.remove(tick);
    dots.stop();
    lenis.destroy();
  };
});

/* 0. Loading curtain counts the days, lifts, then the headline rises. */
function intro(lenis) {
  const loader = document.querySelector('.loader');
  const chars = '.hero .ch';
  if (window.scrollY > 20) {
    loader.remove();
    gsap.set(chars, { y: 0 });
    return;
  }
  const n = loader.querySelector('[data-loader]');
  const o = { v: 1 };
  const total = Number(document.querySelector('.days')?.dataset.total) || 7;
  lenis.stop();
  // The page is usable the moment the cover has lifted; the rest of the
  // intro plays on top without holding scroll or clicks.
  gsap.timeline()
    .to(o, { v: total, duration: 1.1, ease: 'power1.inOut', onUpdate: () => { n.textContent = Math.round(o.v); } })
    .to(loader, { yPercent: -100, duration: 0.9, ease: 'power4.inOut' }, '+=0.15')
    .call(() => { loader.remove(); lenis.start(); })
    .to(chars, { y: 0, duration: 1.1, ease: 'power4.out', stagger: 0.045 }, '-=0.45')
    .from('.hero__eyebrow, .hero__hint', { opacity: 0, y: 12, duration: 0.8, ease: 'power2.out', stagger: 0.15, clearProps: 'transform' }, '-=0.7')
    .from('.top > *', { opacity: 0, y: -12, duration: 0.6, ease: 'power2.out', stagger: 0.08, clearProps: 'all' }, '-=0.8');
}

/* Background: a field of dots that bends away from the mouse and ripples. */
function dotField(canvas) {
  const ctx = canvas.getContext('2d');
  const GAP = 30;
  const mouse = { x: -9999, y: -9999 };
  let w = 0, h = 0, pts = [], running = false, raf = 0;
  let pulseAt = -1, px = 0, py = 0;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.clientWidth; h = canvas.clientHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    pts = [];
    for (let y = GAP / 2; y < h; y += GAP) for (let x = GAP / 2; x < w; x += GAP) pts.push({ x, y, ox: 0, oy: 0 });
  }

  function frame() {
    if (!running) return;
    ctx.clearRect(0, 0, w, h);
    const R = 160;
    let ring = -1;
    if (pulseAt >= 0) {
      ring = ((performance.now() - pulseAt) / 1000) * 950;
      if (ring > Math.hypot(w, h)) { pulseAt = -1; ring = -1; }
    }
    for (const p of pts) {
      const dx = p.x - mouse.x, dy = p.y - mouse.y;
      const d = Math.hypot(dx, dy) || 1;
      let tx = 0, ty = 0, k = 0, g = 0;
      if (d < R) { k = 1 - d / R; const f = k * k * 30; tx = (dx / d) * f; ty = (dy / d) * f; }
      if (ring >= 0) {
        const ex = p.x - px, ey = p.y - py;
        const pd = Math.hypot(ex, ey) || 1;
        g = 1 - Math.min(1, Math.abs(pd - ring) / 80);
        if (g > 0) { tx += (ex / pd) * g * 16; ty += (ey / pd) * g * 16; }
      }
      p.ox += (tx - p.ox) * 0.14; p.oy += (ty - p.oy) * 0.14;
      const s = Math.max(k, g);
      ctx.fillStyle = g > k && g > 0.05 ? `rgba(24,184,92,${0.3 + g * 0.7})`
        : k > 0.05 ? `rgba(255,79,26,${0.25 + k * 0.75})` : 'rgba(17,17,17,0.17)';
      ctx.beginPath();
      ctx.arc(p.x + p.ox, p.y + p.oy, 1.1 + s * 2.4, 0, 6.2832);
      ctx.fill();
    }
    raf = requestAnimationFrame(frame);
  }

  const onMove = (e) => { const r = canvas.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; };
  window.addEventListener('pointermove', onMove, { passive: true });
  window.addEventListener('resize', resize);
  resize();

  return {
    start() { if (!running) { running = true; raf = requestAnimationFrame(frame); } },
    stop() { running = false; cancelAnimationFrame(raf); },
    pulse(x, y) { px = x; py = y; pulseAt = performance.now(); },
  };
}

/* 1. Hero: the wireframe becomes a finished site, then we fly into it. */
function hero(dots) {
  const q = gsap.utils.selector('.hero');
  const panels = q('.sk[data-s="1"]');
  const bars = q('.sk[data-s="2"]');
  const day = q('[data-day]')[0];
  const stage = q('.stage')[0];
  const zoom = q('.zoom')[0];
  const totalDays = Number(q('.days')[0].dataset.total) || 7;

  gsap.set(q('.hero__title'), { yPercent: -50, y: 0 });
  gsap.set(stage, { xPercent: -50, x: 0 });
  gsap.set(bars, { transformOrigin: '100% 50%' });

  // The point of the example site we fly into: a clear patch of its dark green panel.
  // Measured from the layout: the empty green space just right of its button.
  const focus = () => {
    const btn = q('.mock__copy .mock__btn')[0];
    let x = 0, y = 0, el = btn;
    while (el && el !== stage) { x += el.offsetLeft; y += el.offsetTop; el = el.offsetParent; }
    const free = btn.parentElement.offsetWidth - btn.offsetLeft - btn.offsetWidth;
    return [(x + btn.offsetWidth + free * 0.5) / stage.offsetWidth, (y + btn.offsetHeight / 2) / stage.offsetHeight];
  };
  const setOrigin = () => { const [fx, fy] = focus(); gsap.set(zoom, { transformOrigin: `${fx * 100}% ${fy * 100}%` }); };
  setOrigin();
  ScrollTrigger.addEventListener('refreshInit', setOrigin);

  ScrollTrigger.create({
    trigger: '.hero', start: 'top bottom', end: 'bottom top',
    onToggle: (self) => (self.isActive ? dots.start() : dots.stop()),
  });

  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    // Day counter follows the build, from the first cursor to the approval.
    onUpdate: () => {
      const p = gsap.utils.clamp(0, 1, (tl.time() - 0.18) / 0.66);
      day.textContent = Math.min(totalDays, Math.floor(p * totalDays) + 1);
    },
    scrollTrigger: {
      trigger: '.hero',
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.8,
      invalidateOnRefresh: true,
    },
  });

  const flyIn = (sel, from, at, dur = 0.07) =>
    tl.fromTo(q(sel), { autoAlpha: 0, scale: 0.7, ...from }, { autoAlpha: 1, scale: 1, x: 0, y: 0, rotation: 0, duration: dur, ease: 'back.out(1.6)' }, at);

  // Title shrinks to the top; the dot field and the empty wireframe arrive.
  tl.to(q('.hero__hint'), { autoAlpha: 0, duration: 0.04 }, 0)
    .to(q('.hero__eyebrow'), { autoAlpha: 0, duration: 0.06 }, 0)
    .to(q('.hero__title'), {
      scale: () => (isPhone() ? 0.5 : 0.3),
      y: () => -window.innerHeight * (isPhone() ? 0.36 : 0.375),
      duration: 0.16, ease: 'power2.inOut',
    }, 0)
    .to(q('.hero__dots'), { opacity: 1, duration: 0.12 }, 0.02)
    .fromTo(q('.browser'),
      { autoAlpha: 0, y: () => window.innerHeight * 0.5, rotationX: 32, scale: 0.84 },
      { autoAlpha: 1, y: 0, rotationX: 0, scale: 1, duration: 0.17, ease: 'power3.out' }, 0.02)
    .to(q('.days'), { autoAlpha: 1, duration: 0.04 }, 0.14)
    .fromTo(q('.days__bar i'), { scaleX: 0 }, { scaleX: 1, duration: 0.66 }, 0.18);

  // The wireframe shows its layout columns until colour arrives.
  tl.to(q('.guides'), { opacity: 1, duration: 0.04 }, 0.16)
    .to(q('.guides'), { opacity: 0, duration: 0.05 }, 0.3);

  // "Research" arrives first with the search, checks the menu, then stays close.
  tl.fromTo(q('.cursor--research'), { left: '8%', top: '-46%', autoAlpha: 0 }, { left: '25%', top: '-4%', autoAlpha: 1, duration: 0.06, ease: 'power2.out' }, 0.13)
    .to(q('.cursor--research'), { left: '55%', top: '9%', duration: 0.06, ease: 'power2.inOut' }, 0.23)
    .to(q('.cursor--research'), { left: '-6%', top: '72%', duration: 0.09, ease: 'power1.inOut' }, 0.38)
    .to(q('.cursor--research'), { left: '-8%', top: '58%', duration: 0.1, ease: 'power1.inOut' }, 0.6);

  flyIn('.float--search', { y: -120, rotation: -8 }, 0.15);
  flyIn('.float--type', { x: 220, y: -80, rotation: 14 }, 0.17);

  // "Design" drags in the colours, paints the page, then picks the headline.
  tl.fromTo(q('.cursor--design'), { left: '-34%', top: '74%', autoAlpha: 0 }, { left: '-6%', top: '26%', autoAlpha: 1, duration: 0.07, ease: 'power2.out' }, 0.19);
  flyIn('.float--palette', { x: -240, y: 300, rotation: -18 }, 0.19);
  tl.to(q('.cursor--design'), { left: '74%', top: '44%', duration: 0.05, ease: 'power2.inOut' }, 0.265)
    .fromTo(panels, { clipPath: 'inset(0% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 100%)', duration: 0.06, stagger: 0.012, ease: 'power2.inOut' }, 0.3)
    // the photo settles into place as its placeholder wipes away
    .fromTo(q('.mock__img img'), { scale: 1.3 }, { scale: 1, duration: 0.1, ease: 'power2.out', force3D: false }, 0.3)
    .to(q('.cursor--design'), { left: '30%', top: '56%', duration: 0.05, ease: 'power2.inOut' }, 0.37)
    .fromTo(q('.select'), { autoAlpha: 0, scale: 1.12 }, { autoAlpha: 1, scale: 1, duration: 0.025, ease: 'power2.out' }, 0.405)
    .to(q('.cursor--design'), { left: '-7%', top: '46%', duration: 0.06, ease: 'power1.inOut' }, 0.45)
    .to(q('.cursor--design'), { left: '60%', top: '24%', duration: 0.09, ease: 'power1.inOut' }, 0.6);

  // "Writing" turns the grey bars in the headline and the cards into real words.
  tl.fromTo(q('.cursor--words'), { left: '-34%', top: '34%', autoAlpha: 0 }, { left: '37%', top: '50%', autoAlpha: 1, duration: 0.07, ease: 'power2.out' }, 0.46)
    .to(q('.cursor--words'), { left: '20%', top: '93%', duration: 0.08, ease: 'power1.inOut' }, 0.56)
    .to(q('.cursor--words'), { left: '52%', top: '97%', duration: 0.07, ease: 'power1.inOut' }, 0.67);

  // "Build" types the grey bars into real words and buttons.
  tl.fromTo(q('.cursor--build'), { left: '116%', top: '10%', autoAlpha: 0 }, { left: '32%', top: '13%', autoAlpha: 1, duration: 0.07, ease: 'power2.out' }, 0.44)
    .to(q('.select'), { autoAlpha: 0, duration: 0.02 }, 0.5)
    .to(bars, { scaleX: 0, duration: 0.035, stagger: 0.011, ease: 'power1.in' }, 0.5)
    .to(q('.cursor--build'), { left: '72%', top: '58%', duration: 0.08, ease: 'power1.inOut' }, 0.5)
    .to(q('.cursor--build'), { left: '84%', top: '90%', duration: 0.08, ease: 'power1.inOut' }, 0.59)
    .to(q('.cursor--build'), { left: '100%', top: '30%', duration: 0.06, ease: 'power1.inOut' }, 0.68)
    // the small details drop in one by one: stars, badges, icons
    .fromTo(q('.mock [data-pop]'), { autoAlpha: 0, scale: 0.4 }, { autoAlpha: 1, scale: 1, duration: 0.03, stagger: 0.012, ease: 'back.out(2.2)', force3D: false }, 0.57);

  // "Testing" checks it on a phone.
  tl.fromTo(q('.cursor--test'), { left: '132%', top: '112%', autoAlpha: 0 }, { left: '103%', top: '70%', autoAlpha: 1, duration: 0.07, ease: 'power2.out' }, 0.58)
    .to(q('.cursor--test'), { left: '92%', top: '52%', duration: 0.07, ease: 'power1.inOut' }, 0.7);
  flyIn('.float--phone', { x: 200, y: 160, rotation: 12 }, 0.58);
  flyIn('.float--toast', { x: -200, y: 80, rotation: -6 }, 0.69, 0.05);

  // "You" approve it, and the site goes live with a ripple through the dots.
  let rippled = false;
  tl.fromTo(q('.approve'), { autoAlpha: 0, scale: 0.7 }, { autoAlpha: 1, scale: 1, duration: 0.04, ease: 'back.out(2)' }, 0.73)
    .fromTo(q('.cursor--you'), { left: '30%', top: '128%', autoAlpha: 0 }, { left: () => (isPhone() ? '86%' : '77%'), top: () => (isPhone() ? '103%' : '101%'), autoAlpha: 1, duration: 0.09, ease: 'power2.out' }, 0.74)
    .to(q('.approve'), { scale: 0.9, duration: 0.012 }, 0.84)
    .to(q('.approve'), { scale: 1, backgroundColor: '#18b85c', duration: 0.02, ease: 'back.out(3)' }, 0.852)
    .to(q('.approve__a'), { opacity: 0, duration: 0.008 }, 0.852)
    .to(q('.approve__b'), { opacity: 1, duration: 0.008 }, 0.856)
    .to(q('.browser__live'), { opacity: 1, duration: 0.015 }, 0.856)
    .to(q('.browser'), { scale: 1.025, boxShadow: '0 0 0 8px rgba(24,184,92,0.16), 0 50px 110px -30px rgba(0,0,0,0.32)', duration: 0.04, ease: 'power2.out' }, 0.856)
    .call(() => {
      // fire once each time we cross the approval going down
      if (rippled) { rippled = false; return; }
      rippled = true;
      const r = q('.approve')[0].getBoundingClientRect();
      const c = q('.hero__dots')[0].getBoundingClientRect();
      dots.pulse(r.left + r.width / 2 - c.left, r.top + r.height / 2 - c.top);
    }, null, 0.856)
    .to(q('.float--palette, .float--toast'), { x: -22, duration: 0.05, ease: 'power2.out' }, 0.86)
    .to(q('.float--type, .float--phone'), { x: 22, duration: 0.05, ease: 'power2.out' }, 0.86)
    .to({}, { duration: 0.06 }, 0.94);

  // Fly-through: everything clears and the camera dives into the finished site.
  const out = 1.0;
  tl.to(q('.float--palette, .float--toast'), { x: -420, autoAlpha: 0, rotation: -20, duration: 0.07, ease: 'power2.in' }, out)
    .to(q('.float--type, .float--phone'), { x: 420, autoAlpha: 0, rotation: 20, duration: 0.07, ease: 'power2.in' }, out)
    .to(q('.float--search'), { y: -300, autoAlpha: 0, duration: 0.07, ease: 'power2.in' }, out)
    .to(q('.cursor, .approve, .days'), { autoAlpha: 0, duration: 0.04 }, out)
    .to(q('.hero__title'), { autoAlpha: 0, y: () => -window.innerHeight * 0.6, duration: 0.07, ease: 'power2.in' }, out)
    .to(q('.hero__dots'), { opacity: 0, duration: 0.12 }, out + 0.04)
    // Before diving, drop the GPU-layer hints and 3D so the browser repaints the
    // site at its real zoomed size (sharp text) instead of stretching a small bitmap.
    .set(stage, { perspective: 'none' }, out)
    .set(zoom, { willChange: 'auto', transformStyle: 'flat' }, out)
    .set(q('.browser'), { willChange: 'auto', rotationX: 0, rotationY: 0, force3D: false }, out)
    .to(zoom, {
      force3D: false,
      scale: () => (isPhone() ? 26 : 16),
      x: () => (0.5 - focus()[0]) * stage.offsetWidth,
      y: () => window.innerHeight * 0.5 - (stage.offsetTop + focus()[1] * stage.offsetHeight),
      duration: 0.24, ease: 'power3.in',
    }, out + 0.02)
    .to(q('.hero__flood'), { opacity: 1, duration: 0.05 }, out + 0.2)
    .to({}, { duration: 0.03 }, out + 0.26);

  // Floating pieces lean away from the mouse.
  if (finePointer()) {
    const pin = q('.hero__pin')[0];
    const movers = q('.float').map((f) => {
      const inner = f.querySelector('.float__in');
      const depth = parseFloat(f.dataset.depth || 1);
      return { depth, x: gsap.quickTo(inner, 'x', { duration: 0.8, ease: 'power3' }), y: gsap.quickTo(inner, 'y', { duration: 0.8, ease: 'power3' }) };
    });
    const tiltX = gsap.quickTo(q('.browser')[0], 'rotationY', { duration: 0.9, ease: 'power3' });
    pin.addEventListener('pointermove', (e) => {
      const nx = e.clientX / window.innerWidth - 0.5;
      const ny = e.clientY / window.innerHeight - 0.5;
      movers.forEach((m) => { m.x(-nx * 46 * m.depth); m.y(-ny * 34 * m.depth); });
      if (tl.time() < out) tiltX(nx * 5);
    });
  }
}

/* Header: out of the way while reading down, back when scrolling up. */
function header() {
  const top = document.querySelector('.top');
  const heroEl = document.querySelector('.hero');
  ScrollTrigger.create({
    start: 0,
    end: 'max',
    onUpdate: (self) => {
      const pastHero = self.scroll() > heroEl.offsetHeight - window.innerHeight * 1.6;
      top.classList.toggle('top--hidden', pastHero && self.direction === 1);
      top.classList.toggle('top--solid', self.scroll() > heroEl.offsetHeight - 70);
    },
  });
  // White header text while a dark section sits under it.
  let dark = 0;
  document.querySelectorAll('.band, .nudge__in, .cta').forEach((el) => {
    ScrollTrigger.create({
      trigger: el, start: 'top 40px', end: 'bottom 40px',
      onToggle: (self) => { dark += self.isActive ? 1 : -1; top.classList.toggle('top--light', dark > 0); },
    });
  });
}

/* Thin bar at the top shows how far down the page you are. */
function progress() {
  gsap.to('.progress i', { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.3 } });
}

/* 2. Statement: words go from faint to solid. */
function statement() {
  const words = gsap.utils.toArray('[data-words] .w');
  gsap.fromTo(words, { opacity: 0.14, y: 14 }, {
    opacity: 1, y: 0, stagger: 0.1, ease: 'none',
    scrollTrigger: { trigger: '[data-words]', start: 'top 82%', end: 'bottom 50%', scrub: 0.5 },
  });
}

/* Bands of trades: always moving, faster and leaning with your scroll. */
function marquee(lenis) {
  const rows = [...document.querySelectorAll('.marquee__track')].map((track) => ({
    track, set: track.querySelector('.marquee__set'), base: +track.dataset.dir || -1, x: 0,
  }));
  if (!rows.length) return;
  let flip = 1, skew = 0;
  gsap.ticker.add((_, dt) => {
    const v = lenis.velocity || 0;
    if (Math.abs(v) > 0.5) flip = v > 0 ? 1 : -1;
    skew += (gsap.utils.clamp(-9, 9, v * 0.35) - skew) * 0.12;
    rows.forEach((r) => {
      const w = r.set.offsetWidth;
      r.x += r.base * flip * (0.06 * dt + Math.abs(v) * 0.9);
      if (r.x <= -w) r.x += w;
      if (r.x > 0) r.x -= w;
      r.track.style.transform = `translate3d(${r.x}px,0,0) skewX(${-skew * r.base}deg)`;
    });
  });
}

/* Section headings slide up word by word. */
function headings() {
  document.querySelectorAll('.h2').forEach((h) => {
    h.removeAttribute('data-reveal');
    const label = h.textContent.trim();
    h.setAttribute('aria-label', label);
    h.innerHTML = label.split(/\s+/).map((w) => `<span class="hw" aria-hidden="true"><span>${w}</span></span>`).join(' ');
    gsap.fromTo(h.querySelectorAll('.hw > span'), { yPercent: 115, rotation: 6 }, {
      yPercent: 0, rotation: 0, duration: 1.1, ease: 'power4.out', stagger: 0.06,
      scrollTrigger: { trigger: h, start: 'top 88%', once: true },
    });
  });
}

/* Everything else: a soft rise as it enters the screen. */
function reveals() {
  gsap.set('[data-reveal]', { autoAlpha: 0 });
  ScrollTrigger.batch('[data-reveal]', {
    start: 'top 90%',
    once: true,
    onEnter: (els) => gsap.fromTo(els, { y: 48, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 1, ease: 'power3.out', stagger: 0.09, overwrite: true }),
  });
}

/* Scrolling wipes the old site into the new one. Dragging takes over. */
function slider() {
  sliders.forEach(({ ba, input, set }) => {
    const o = { v: 94 };
    set(94);
    const tween = gsap.to(o, {
      v: 10, ease: 'none', onUpdate: () => set(o.v),
      scrollTrigger: { trigger: ba, start: 'top 78%', end: 'bottom 38%', scrub: 0.6 },
    });
    const takeOver = () => { tween.scrollTrigger?.kill(); tween.kill(); };
    input.addEventListener('pointerdown', takeOver, { once: true });
    input.addEventListener('keydown', takeOver, { once: true });
  });
}

/* Steps: lock and slide sideways on wide screens; a drawn line on small ones. */
function processScroll() {
  const bars = gsap.utils.toArray('.plan__bar i');
  const meter = document.querySelector('[data-meter]');
  const meterBar = document.querySelector('.art__meter div i');
  const built = { v: 0 };
  const showBuilt = () => {
    if (meter) meter.textContent = `${Math.round(built.v)}%`;
    if (meterBar) meterBar.style.transform = `scaleX(${built.v / 100})`;
  };
  // The plan fills day by day: brief, research, four days of building, go live.
  const fill = (el, dur, at, tl) => tl.fromTo(el, { clipPath: 'inset(0% 100% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: dur }, at);
  const fillPlan = (tl, at, span) => {
    const d = span / 7;
    fill(bars[0], d, at, tl);
    fill(bars[1], d, at + d, tl);
    fill(bars[2], d * 4, at + d * 2, tl);
    tl.fromTo(built, { v: 0 }, { v: 100, duration: d * 4, onUpdate: showBuilt }, at + d * 2);
    fill(bars[3], d, at + d * 6, tl);
  };
  const m = gsap.matchMedia();
  m.add('(min-width: 861px)', () => {
    const steps = document.querySelector('.steps');
    const wrap = steps.parentElement;
    const rows = document.querySelector('.plan__rows');
    const dist = () => Math.max(0, steps.scrollWidth - wrap.clientWidth);
    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: { trigger: '.process', start: 'top top', end: 'bottom bottom', scrub: 0.7, invalidateOnRefresh: true },
    })
      .to(steps, { x: () => -dist(), duration: 1 }, 0.06)
      .fromTo('.plan__now', { x: 0 }, { x: () => rows.offsetWidth - 2, duration: 1 }, 0.06)
      .to({}, { duration: 0.06 });
    fillPlan(tl, 0.06, 1);
  });
  m.add('(max-width: 860px)', () => {
    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: { trigger: '.plan', start: 'top 85%', end: 'top 35%', scrub: 0.6 },
    });
    fillPlan(tl, 0, 1);
    gsap.from('.step', { y: 60, autoAlpha: 0, duration: 0.9, ease: 'power3.out', stagger: 0.12, scrollTrigger: { trigger: '.steps', start: 'top 82%', once: true } });
  });
}

/* Work cards: drift at different speeds and tilt toward the mouse. */
function work() {
  document.querySelectorAll('[data-work-feature]').forEach((feature) => {
    const browser = feature.querySelector('.work__browser');
    const phone = feature.querySelector('.work__phone');
    // The big screenshot opens up like a window as it scrolls in; the phone rides up past it.
    gsap.fromTo(browser, { clipPath: 'inset(12% 8% 12% 8% round 16px)', scale: 0.94 }, {
      clipPath: 'inset(0% 0% 0% 0% round 16px)', scale: 1, ease: 'none',
      scrollTrigger: { trigger: feature, start: 'top 90%', end: 'top 30%', scrub: 0.6 },
    });
    gsap.fromTo(phone, { y: 140, rotation: 6 }, {
      y: -30, rotation: 0, ease: 'none',
      scrollTrigger: { trigger: feature, start: 'top bottom', end: 'bottom top', scrub: 0.6 },
    });
  });
}

/* The price counts up. */
function countUp() {
  document.querySelectorAll('[data-count]').forEach((el) => {
    const m = el.textContent.trim().match(/^(\D*)(\d+)(\D*)$/);
    if (!m) return;
    const o = { v: 0 };
    const end = +m[2];
    gsap.to(o, {
      v: end, duration: 1.8, ease: 'power3.out',
      onUpdate: () => { el.textContent = `${m[1]}${Math.round(o.v)}${m[3]}`; },
      scrollTrigger: { trigger: el, start: 'top 85%', once: true },
    });
    el.textContent = `${m[1]}0${m[3]}`;
  });
}

/* Final panel grows into place; giant name rises; button pulls toward the mouse. */
function cta() {
  gsap.fromTo('.cta', { scale: 0.88 }, {
    scale: 1, ease: 'none',
    scrollTrigger: { trigger: '.cta', start: 'top bottom', end: 'top 35%', scrub: true },
  });
  gsap.fromTo('.mega span', { yPercent: 110 }, {
    yPercent: 0, duration: 1.2, ease: 'power4.out', stagger: 0.04,
    scrollTrigger: { trigger: '.mega', start: 'top 96%', once: true },
  });
  gsap.fromTo('.badge', { scale: 0, rotation: -90 }, {
    scale: 1, rotation: 0, duration: 1, ease: 'back.out(1.6)',
    scrollTrigger: { trigger: '.cta', start: 'top 60%', once: true },
  });
  if (!finePointer()) return;
  document.querySelectorAll('.btn--lg').forEach((b) => {
    const x = gsap.quickTo(b, 'x', { duration: 0.5, ease: 'power3' });
    const y = gsap.quickTo(b, 'y', { duration: 0.5, ease: 'power3' });
    b.addEventListener('pointermove', (e) => {
      const r = b.getBoundingClientRect();
      x((e.clientX - r.left - r.width / 2) * 0.35);
      y((e.clientY - r.top - r.height / 2) * 0.5);
    });
    b.addEventListener('pointerleave', () => { x(0); y(0); });
  });
}

/* Buttons fill with colour from the spot where the pointer enters. */
function buttons() {
  document.querySelectorAll('.btn').forEach((b) => {
    b.addEventListener('pointerenter', (e) => {
      const r = b.getBoundingClientRect();
      b.style.setProperty('--x', `${e.clientX - r.left}px`);
      b.style.setProperty('--y', `${e.clientY - r.top}px`);
    });
  });
}

/* "What you get" cards glow under the pointer. */
function cards() {
  const grid = document.querySelector('.cols');
  if (!grid || !finePointer()) return;
  grid.addEventListener('pointermove', (e) => {
    grid.querySelectorAll(':scope > div').forEach((c) => {
      const r = c.getBoundingClientRect();
      c.style.setProperty('--mx', `${e.clientX - r.left}px`);
      c.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
  });
}

/* The photo is drawn in like the hero: an empty frame fills, then the colour comes in. */
function about() {
  const fig = document.querySelector('[data-photo]');
  if (!fig) return;
  const frame = fig.querySelector('.about__frame');
  const img = fig.querySelector('img');
  const tl = gsap.timeline({
    scrollTrigger: { trigger: fig, start: 'top 85%', end: 'center 45%', scrub: 0.8 },
  });
  tl.fromTo(frame, { clipPath: 'inset(100% 0% 0% 0% round 20px)' }, { clipPath: 'inset(0% 0% 0% 0% round 20px)', ease: 'power3.out', duration: 1 })
    .fromTo(img, { scale: 1.3, filter: 'grayscale(1) contrast(1.1)' }, { scale: 1, filter: 'grayscale(0) contrast(1) saturate(0.8)', ease: 'none', duration: 1.4 }, 0)
    .from(fig.querySelector('figcaption'), { autoAlpha: 0, y: 12, duration: 0.4 }, 0.8);
}

/* Compare cards: the time bars grow to show how long each option takes. */
function compare() {
  const bars = gsap.utils.toArray('.cmp__time');
  if (!bars.length) return;
  gsap.fromTo(bars, { clipPath: 'inset(0% 100% 0% 0% round 8px)' }, {
    clipPath: 'inset(0% 0% 0% 0% round 8px)', duration: 1.1, ease: 'power3.out', stagger: 0.14,
    scrollTrigger: { trigger: '.cmp', start: 'top 70%' },
  });
}

/* Custom pointer for mouse users. */
function pointer() {
  if (!finePointer()) return;
  const dot = document.createElement('div');
  dot.className = 'dot';
  dot.setAttribute('aria-hidden', 'true');
  dot.innerHTML = '<span>Drag ↔</span>';
  document.body.appendChild(dot);
  const x = gsap.quickTo(dot, 'x', { duration: 0.25, ease: 'power3' });
  const y = gsap.quickTo(dot, 'y', { duration: 0.25, ease: 'power3' });
  window.addEventListener('pointermove', (e) => {
    x(e.clientX); y(e.clientY);
    dot.classList.add('dot--on');
    const t = e.target instanceof Element ? e.target : null;
    dot.classList.toggle('dot--drag', !!t?.closest('.ba'));
    dot.classList.toggle('dot--link', !!t?.closest('a, button, summary') && !t?.closest('.ba'));
  });
  document.addEventListener('pointerleave', () => dot.classList.remove('dot--on'));
}
