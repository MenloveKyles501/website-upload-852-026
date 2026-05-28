(function () {
  function qs(sel, root) { return (root || document).querySelector(sel); }
  function qsa(sel, root) { return Array.from((root || document).querySelectorAll(sel)); }
  function toggleMobileNav() {
    const btn = qs('[data-nav-toggle]');
    const panel = qs('[data-mobile-panel]');
    if (!btn || !panel) return;
    btn.addEventListener('click', function () {
      panel.classList.toggle('open');
      const expanded = panel.classList.contains('open');
      btn.setAttribute('aria-expanded', expanded ? 'true' : 'false');
    });
  }

  function filterLocalCards() {
    const input = qs('[data-local-filter]');
    const cards = qsa('[data-card-search]');
    if (!input || !cards.length) return;
    const apply = () => {
      const kw = input.value.trim().toLowerCase();
      cards.forEach(card => {
        const text = (card.getAttribute('data-card-search') || '').toLowerCase();
        card.classList.toggle('hidden', kw && !text.includes(kw));
      });
    };
    input.addEventListener('input', apply);
    apply();
  }

  function initPlayer() {
    const video = qs('[data-player-video]');
    const overlayBtn = qs('[data-player-start]');
    const sourceButtons = qsa('[data-source-url]');
    if (!video) return;
    const trySource = (src) => {
      if (!src) return;
      if (window.Hls && Hls.isSupported()) {
        if (video._hlsInstance) {
          try { video._hlsInstance.destroy(); } catch (e) {}
        }
        const hls = new Hls({ enableWorker: true, lowLatencyMode: true });
        video._hlsInstance = hls;
        hls.loadSource(src);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, function () {
          if (overlayBtn) overlayBtn.classList.remove('hidden');
        });
        hls.on(Hls.Events.ERROR, function (_, data) {
          if (data && data.fatal) {
            console.warn('HLS fatal error', data);
          }
        });
      } else {
        video.src = src;
      }
      video.dataset.src = src;
    };

    const initial = video.getAttribute('data-m3u8');
    trySource(initial);

    if (overlayBtn) {
      overlayBtn.addEventListener('click', async function () {
        try {
          await video.play();
          overlayBtn.classList.add('hidden');
        } catch (e) {
          console.warn(e);
        }
      });
      video.addEventListener('play', () => overlayBtn.classList.add('hidden'));
      video.addEventListener('pause', () => overlayBtn.classList.remove('hidden'));
    }

    sourceButtons.forEach(btn => {
      btn.addEventListener('click', function () {
        sourceButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const src = btn.getAttribute('data-source-url');
        trySource(src);
        if (video.paused) {
          video.play().catch(() => {});
        }
      });
    });
  }

  function initSearchPage() {
    const mount = qs('[data-search-results]');
    if (!mount || !window.MOVIE_CATALOG) return;
    const input = qs('[data-search-input]');
    const genreSel = qs('[data-search-genre]');
    const yearSel = qs('[data-search-year]');
    const stats = qs('[data-search-stats]');

    const params = new URLSearchParams(location.search);
    if (input && params.get('kw')) input.value = params.get('kw');
    if (genreSel && params.get('genre')) genreSel.value = params.get('genre');
    if (yearSel && params.get('year')) yearSel.value = params.get('year');

    const fmtCard = (m) => `
      <a class="movie-card" href="${m.page}" data-card-search="${escapeHtml([m.title, m.region, m.type, m.genre, m.tags, m.summary].join(' '))}">
        <div class="poster" data-id="${String(m.id).padStart(4, '0')}">
          <div class="poster-core">
            <div>
              <small>${escapeHtml(m.primary_genre)}</small>
            </div>
            <div>
              <b>${escapeHtml(m.title)}</b>
            </div>
            <small>${escapeHtml(m.year + ' · ' + m.region)}</small>
          </div>
        </div>
        <div class="movie-body">
          <h3 class="movie-title">${escapeHtml(m.title)}</h3>
          <div class="meta">${escapeHtml(m.type)} · ${escapeHtml(m.genre_raw)}</div>
          <div class="meta-row">${(m.tags || []).slice(0,3).map(t => `<span class="meta-chip">${escapeHtml(t)}</span>`).join('')}</div>
        </div>
      </a>`;

    const render = () => {
      const kw = (input && input.value || '').trim().toLowerCase();
      const genre = (genreSel && genreSel.value || '').trim();
      const year = (yearSel && yearSel.value || '').trim();
      const list = window.MOVIE_CATALOG.filter(m => {
        const hay = [m.title, m.region, m.type, m.genre_raw, m.tags.join(' '), m.summary, m.one_line].join(' ').toLowerCase();
        if (kw && !hay.includes(kw)) return false;
        if (genre && m.primary_genre !== genre) return false;
        if (year && String(m.year) !== year) return false;
        return true;
      });
      mount.innerHTML = list.slice(0, 240).map(fmtCard).join('') || '<div class="panel"><h3>没有匹配结果</h3><p>请尝试更换关键词、年份或分类筛选。</p></div>';
      if (stats) stats.textContent = `已找到 ${list.length.toLocaleString()} 部影片，当前展示前 ${Math.min(list.length, 240)} 条。`;
    };
    [input, genreSel, yearSel].forEach(el => el && el.addEventListener('input', render));
    [genreSel, yearSel].forEach(el => el && el.addEventListener('change', render));
    render();
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  document.addEventListener('DOMContentLoaded', function () {
    toggleMobileNav();
    filterLocalCards();
    initPlayer();
    initSearchPage();
  });
})();
