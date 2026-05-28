
(function () {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function setupMenu() {
    const btn = $('.menu-btn');
    const nav = $('.nav');
    if (!btn || !nav) return;
    btn.addEventListener('click', () => nav.classList.toggle('open'));
    document.addEventListener('click', (e) => {
      if (!nav.contains(e.target) && !btn.contains(e.target)) nav.classList.remove('open');
    });
  }

  function setupHero() {
    const root = $('.hero');
    if (!root) return;
    const slides = $$('.hero-slide', root);
    const dots = $$('.hero-dot', root);
    if (!slides.length) return;
    let idx = 0;
    let timer = null;

    function show(next) {
      idx = (next + slides.length) % slides.length;
      slides.forEach((el, i) => el.classList.toggle('active', i === idx));
      dots.forEach((el, i) => el.classList.toggle('active', i === idx));
    }
    function start() {
      timer = setInterval(() => show(idx + 1), 5500);
    }
    function stop() {
      if (timer) clearInterval(timer);
    }
    root.addEventListener('mouseenter', stop);
    root.addEventListener('mouseleave', start);
    const prev = $('.hero-prev', root);
    const next = $('.hero-next', root);
    if (prev) prev.addEventListener('click', () => { show(idx - 1); stop(); start(); });
    if (next) next.addEventListener('click', () => { show(idx + 1); stop(); start(); });
    dots.forEach((el, i) => el.addEventListener('click', () => { show(i); stop(); start(); }));
    show(0);
    start();
  }

  function setupFilter() {
    const input = $('.search');
    const select = $('.select');
    const cards = $$('.movie-card');
    if (!input && !select) return;

    function match(card) {
      const q = (input?.value || '').trim().toLowerCase();
      const cat = (select?.value || '').trim();
      const data = [card.dataset.title, card.dataset.region, card.dataset.genre, card.dataset.tags, card.dataset.year, card.dataset.category].join(' ').toLowerCase();
      const okQ = !q || data.includes(q);
      const okC = !cat || card.dataset.category === cat || card.dataset.categorySlug === cat;
      return okQ && okC;
    }
    function apply() {
      cards.forEach(card => {
        const ok = match(card);
        card.style.display = ok ? '' : 'none';
      });
    }
    input && input.addEventListener('input', apply);
    select && select.addEventListener('change', apply);
    apply();
  }

  function setupPlayer() {
    const video = $('#movie-player');
    if (!video) return;
    const src = video.dataset.src;
    const poster = video.dataset.poster;
    const overlay = $('.play-overlay');
    const cta = $('.play-cta');

    function boot() {
      if (!src) return;
      if (window.Hls && Hls.isSupported()) {
        const hls = new Hls({
          maxBufferLength: 30,
          capLevelToPlayerSize: true
        });
        hls.loadSource(src);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, function () {
          video.play().catch(() => {});
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = src;
        video.play().catch(() => {});
      } else {
        // fallback for environments without HLS support
        video.src = src;
        video.play().catch(() => {});
      }
      overlay && (overlay.style.display = 'none');
      cta && cta.blur();
    }

    if (poster && !video.getAttribute('poster')) video.setAttribute('poster', poster);
    if (cta) cta.addEventListener('click', boot);
    video.addEventListener('click', boot, { once: true });
  }

  document.addEventListener('DOMContentLoaded', function () {
    setupMenu();
    setupHero();
    setupFilter();
    setupPlayer();
  });
})();
