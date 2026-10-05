/* Rinaldo Caporal — interactions. Everything here is progressive
   enhancement: the page is fully readable without JavaScript. */
(function () {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const desktopMq = window.matchMedia('(min-width: 960px)');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ─── Footer year ─── */
  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ─── Mobile menu ─── */
  const menuBtn = $('#menuBtn');
  const menu = $('#mobileMenu');
  function setMenu(open) {
    if (!menuBtn || !menu) return;
    menu.classList.toggle('open', open);
    menu.setAttribute('aria-hidden', String(!open));
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    document.body.classList.toggle('menu-open', open);
  }
  if (menuBtn && menu) {
    menuBtn.addEventListener('click', () => setMenu(!menu.classList.contains('open')));
    $$('a', menu).forEach((a) => a.addEventListener('click', () => setMenu(false)));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });
  }

  /* ─── Single sticky action bar (mobile) ───
     Shows once the hero CTAs leave the screen; hides over the final CTA. */
  const bar = $('#actionBar');
  const heroCtas = $('#heroCtas');
  const finalCta = $('#final');
  if (bar && heroCtas && 'IntersectionObserver' in window) {
    let heroVisible = true;
    let finalVisible = false;
    const update = () => bar.classList.toggle('show', !heroVisible && !finalVisible);
    new IntersectionObserver(([e]) => {
      heroVisible = e.isIntersecting || e.boundingClientRect.top > 0;
      update();
    }).observe(heroCtas);
    if (finalCta) {
      new IntersectionObserver(([e]) => { finalVisible = e.isIntersecting; update(); }, { threshold: 0.15 }).observe(finalCta);
    }
  } else if (bar) {
    bar.classList.add('show');
  }

  /* ─── Accordions that are always open on desktop ─── */
  function syncDesktopDetails() {
    $$('[data-desktop-open] > details').forEach((d) => {
      if (desktopMq.matches) d.open = true;
    });
  }
  syncDesktopDetails();
  // Safari < 14 only supports addListener on MediaQueryList
  function onBreakpointChange(fn) {
    if (desktopMq.addEventListener) desktopMq.addEventListener('change', fn);
    else if (desktopMq.addListener) desktopMq.addListener(fn);
  }
  onBreakpointChange(() => {
    syncDesktopDetails();
    if (desktopMq.matches) setMenu(false);
  });
  // On desktop these sections are always expanded — block collapsing via keyboard too
  $$('[data-desktop-open] > details > summary').forEach((sum) => {
    sum.addEventListener('click', (e) => { if (desktopMq.matches) e.preventDefault(); });
  });

  /* FAQ: keep only one answer open at a time */
  const faqItems = $$('#faqList details');
  faqItems.forEach((d) => d.addEventListener('toggle', () => {
    if (d.open) faqItems.forEach((o) => { if (o !== d) o.open = false; });
  }));

  /* ─── Rails: dots + active slide ─── */
  function initRail(rail) {
    const slides = Array.from(rail.children);
    const dotsWrap = $(`[data-dots-for="${rail.id}"]`);
    const dots = [];
    if (dotsWrap) {
      slides.forEach((slide, i) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.setAttribute('aria-label', `Ir para item ${i + 1} de ${slides.length}`);
        b.addEventListener('click', () => scrollToSlide(rail, slide));
        dotsWrap.appendChild(b);
        dots.push(b);
      });
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        const i = slides.indexOf(e.target);
        e.target.classList.toggle('is-active', e.isIntersecting);
        if (dots[i]) dots[i].setAttribute('aria-current', String(e.isIntersecting));
      });
      rail.dispatchEvent(new CustomEvent('rail:change'));
    }, { root: rail, threshold: 0.6 });
    slides.forEach((s) => io.observe(s));
    return slides;
  }
  function scrollToSlide(rail, slide, behavior) {
    const padLeft = parseFloat(getComputedStyle(rail).paddingLeft) || 0;
    rail.scrollTo({ left: slide.offsetLeft - rail.offsetLeft - padLeft, behavior: behavior || (reduceMotion ? 'auto' : 'smooth') });
  }

  const railsReady = 'IntersectionObserver' in window;
  const athletesRail = $('#athletesRail');
  const testisRail = $('#testisRail');
  const plansRail = $('#plansRail');
  if (railsReady) {
    if (athletesRail) initRail(athletesRail);
    if (testisRail) initRail(testisRail);
  }

  /* ─── Plans: tabs synced with the swipeable cards ─── */
  if (plansRail && railsReady) {
    const tabs = $$('.plan-tabs button');
    tabs.forEach((t) => { t.hidden = false; });
    const plans = Array.from(plansRail.children);
    const select = (id) => tabs.forEach((t) => t.setAttribute('aria-current', String(t.dataset.target === id)));

    tabs.forEach((t) => t.addEventListener('click', () => {
      const target = document.getElementById(t.dataset.target);
      if (target) { select(t.dataset.target); scrollToSlide(plansRail, target); }
    }));

    const ratios = new Map();
    const plansIO = new IntersectionObserver((entries) => {
      entries.forEach((e) => ratios.set(e.target.id, e.intersectionRatio));
      let best = null;
      let bestR = 0;
      ratios.forEach((r, id) => { if (r > bestR) { bestR = r; best = id; } });
      if (best && bestR > 0.55) select(best);
    }, { root: plansRail, threshold: [0, 0.25, 0.55, 0.75, 1] });
    plans.forEach((p) => plansIO.observe(p));

    // Open on the VIP card on mobile (best value first)
    const vip = $('#plano-vip');
    if (vip && !desktopMq.matches) requestAnimationFrame(() => scrollToSlide(plansRail, vip, 'auto'));
  }

  /* ─── Testimonials: read more ─── */
  $$('.testi').forEach((card) => {
    const text = $('.testi-text', card);
    const btn = $('.read-more', card);
    if (!text || !btn) return;
    btn.addEventListener('click', () => {
      const expanded = text.classList.toggle('clamped') === false;
      btn.setAttribute('aria-expanded', String(expanded));
      btn.textContent = expanded ? 'Ler menos' : 'Ler mais';
    });
  });

  /* ─── Subtle lift on scroll (content is never hidden) ─── */
  if ('IntersectionObserver' in window && !reduceMotion) {
    const liftIO = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); liftIO.unobserve(e.target); } });
    }, { rootMargin: '0px 0px 20% 0px' });
    $$('.lift').forEach((el) => liftIO.observe(el));
  }

  /* ─── Desktop nav: highlight current section ─── */
  const navLinks = $$('.nav a');
  if (navLinks.length && 'IntersectionObserver' in window) {
    const navIO = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        navLinks.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === `#${e.target.id}`));
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    navLinks.forEach((a) => {
      const s = document.getElementById(a.getAttribute('href').slice(1));
      if (s) navIO.observe(s);
    });
  }

  /* ─── Analytics: which CTA brought the WhatsApp click ─── */
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[data-wa], a[data-ig]');
    if (!link || typeof window.gtag !== 'function') return;
    const isWa = link.hasAttribute('data-wa');
    window.gtag('event', isWa ? 'whatsapp_click' : 'instagram_click', {
      cta_location: isWa ? link.dataset.wa : link.dataset.ig,
    });
  });
})();
