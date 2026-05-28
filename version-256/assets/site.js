
(function () {
  function qs(sel, root) { return (root || document).querySelector(sel); }
  function qsa(sel, root) { return Array.from((root || document).querySelectorAll(sel)); }

  function initNav() {
    const path = location.pathname.split('/').pop() || 'index.html';
    qsa('.nav-link').forEach((a) => {
      const href = a.getAttribute('href') || '';
      if (href === path) a.classList.add('active');
      if (path === '' && href === 'index.html') a.classList.add('active');
    });
  }

  function normalize(text) {
    return (text || '').toLowerCase();
  }

  function filterCards(searchInput) {
    if (!searchInput) return;
    const targetSelector = searchInput.dataset.target || '.movie-card';
    const cards = qsa(targetSelector);
    const empty = qs(searchInput.dataset.empty || '.empty-state');
    const query = normalize(searchInput.value.trim());
    let shown = 0;
    cards.forEach((card) => {
      const hay = normalize(card.dataset.search || card.textContent);
      const ok = !query || hay.includes(query);
      card.classList.toggle('hidden', !ok);
      if (ok) shown += 1;
    });
    if (empty) empty.classList.toggle('hidden', shown !== 0);
    const counter = qs(searchInput.dataset.counter);
    if (counter) counter.textContent = String(shown);
  }

  function initSearch() {
    qsa('[data-search-input]').forEach((input) => {
      input.addEventListener('input', () => filterCards(input));
      input.addEventListener('change', () => filterCards(input));
      filterCards(input);
      const btnSelector = input.dataset.button;
      const btn = btnSelector ? qs(btnSelector) : null;
      if (btn) btn.addEventListener('click', () => filterCards(input));
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          filterCards(input);
        }
      });
    });
  }

  function initPlayer() {
    const wrap = qs('[data-player]');
    if (!wrap) return;
    const video = qs('video', wrap);
    const playBtn = qs('[data-play-button]', wrap);
    if (!video) return;
    const m3u8 = video.dataset.hls;
    const mp4 = video.dataset.mp4;

    // Real HLS binding: use the playlist on browsers that natively support it; otherwise fall back to MP4.
    const canNativeHls = video.canPlayType('application/vnd.apple.mpegurl') !== '';
    if (canNativeHls && m3u8) {
      video.src = m3u8;
    } else if (mp4) {
      video.src = mp4;
    }

    if (playBtn) {
      const hideOverlay = () => { playBtn.closest('.play-overlay')?.classList.add('hidden'); };
      const showOverlay = () => { playBtn.closest('.play-overlay')?.classList.remove('hidden'); };
      playBtn.addEventListener('click', async () => {
        try {
          await video.play();
          hideOverlay();
        } catch (e) {
          // ignore
        }
      });
      video.addEventListener('play', hideOverlay);
      video.addEventListener('pause', () => {
        if (video.currentTime < (video.duration || 0)) showOverlay();
      });
      video.addEventListener('ended', showOverlay);
    }
  }

  function initCopyLink() {
    qsa('[data-copy]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const text = btn.dataset.copy || location.href;
        try {
          await navigator.clipboard.writeText(text);
          const old = btn.textContent;
          btn.textContent = '已复制';
          setTimeout(() => (btn.textContent = old), 1200);
        } catch (e) {
          window.prompt('复制下面链接', text);
        }
      });
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    initNav();
    initSearch();
    initPlayer();
    initCopyLink();
  });
})();
