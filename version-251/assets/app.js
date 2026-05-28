function getQueryParameter(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name) || '';
}

function normalizeText(value) {
  return String(value || '').trim().toLowerCase();
}

function initMobileMenu() {
  const button = document.querySelector('[data-mobile-menu-toggle]');
  const panel = document.querySelector('[data-mobile-menu]');

  if (!button || !panel) {
    return;
  }

  button.addEventListener('click', () => {
    panel.classList.toggle('is-open');
  });
}

function initSearchForms() {
  document.querySelectorAll('.js-search-form').forEach((form) => {
    form.addEventListener('submit', (event) => {
      const input = form.querySelector('input[name="q"]');
      if (!input || !input.value.trim()) {
        event.preventDefault();
        input && input.focus();
      }
    });
  });
}

function initHeroSlider() {
  const hero = document.querySelector('[data-hero-slider]');
  if (!hero) {
    return;
  }

  const slides = Array.from(hero.querySelectorAll('[data-hero-slide]'));
  const dots = Array.from(hero.querySelectorAll('[data-hero-dot]'));
  const previous = hero.querySelector('[data-hero-prev]');
  const next = hero.querySelector('[data-hero-next]');
  let currentIndex = 0;
  let timer = null;

  function showSlide(index) {
    currentIndex = (index + slides.length) % slides.length;
    slides.forEach((slide, slideIndex) => {
      slide.classList.toggle('is-active', slideIndex === currentIndex);
    });
    dots.forEach((dot, dotIndex) => {
      dot.classList.toggle('is-active', dotIndex === currentIndex);
    });
  }

  function start() {
    stop();
    timer = window.setInterval(() => showSlide(currentIndex + 1), 5000);
  }

  function stop() {
    if (timer) {
      window.clearInterval(timer);
      timer = null;
    }
  }

  previous && previous.addEventListener('click', () => {
    showSlide(currentIndex - 1);
    start();
  });

  next && next.addEventListener('click', () => {
    showSlide(currentIndex + 1);
    start();
  });

  dots.forEach((dot, index) => {
    dot.addEventListener('click', () => {
      showSlide(index);
      start();
    });
  });

  hero.addEventListener('mouseenter', stop);
  hero.addEventListener('mouseleave', start);
  showSlide(0);
  start();
}

function initCardFilters() {
  document.querySelectorAll('[data-filter-box]').forEach((box) => {
    const keywordInput = box.querySelector('[data-filter-keyword]');
    const regionSelect = box.querySelector('[data-filter-region]');
    const yearSelect = box.querySelector('[data-filter-year]');
    const grid = document.querySelector(box.getAttribute('data-filter-box'));
    const cards = grid ? Array.from(grid.querySelectorAll('.movie-card')) : [];
    const counter = document.querySelector('[data-filter-count]');

    function applyFilter() {
      const keyword = normalizeText(keywordInput && keywordInput.value);
      const region = regionSelect ? regionSelect.value : '';
      const year = yearSelect ? yearSelect.value : '';
      let visibleCount = 0;

      cards.forEach((card) => {
        const haystack = normalizeText([
          card.dataset.title,
          card.dataset.region,
          card.dataset.year,
          card.dataset.genre,
          card.dataset.tags,
        ].join(' '));
        const matchedKeyword = !keyword || haystack.includes(keyword);
        const matchedRegion = !region || card.dataset.region === region;
        const matchedYear = !year || card.dataset.year === year;
        const visible = matchedKeyword && matchedRegion && matchedYear;
        card.style.display = visible ? '' : 'none';
        if (visible) {
          visibleCount += 1;
        }
      });

      if (counter) {
        counter.textContent = String(visibleCount);
      }
    }

    [keywordInput, regionSelect, yearSelect].forEach((control) => {
      control && control.addEventListener('input', applyFilter);
      control && control.addEventListener('change', applyFilter);
    });

    applyFilter();
  });
}

function createSearchCard(movie) {
  const article = document.createElement('article');
  article.className = 'movie-card';
  article.dataset.title = movie.title;
  article.dataset.region = movie.region;
  article.dataset.year = movie.year;
  article.dataset.genre = movie.genre;
  article.dataset.tags = (movie.tags || []).join(' ');

  const tags = movie.genre ? `<span>${movie.genre}</span>` : '';
  const oneLine = movie.oneLine || movie.summary || '';

  article.innerHTML = `
    <a class="card-cover" href="${movie.url}" aria-label="观看 ${movie.title}">
      <img src="${movie.cover}" alt="${movie.title}封面" loading="lazy">
      <span class="card-play">▶</span>
    </a>
    <div class="card-body">
      <div class="card-meta">
        <span>${movie.region}</span>
        <span>${movie.year}</span>
        <span>${movie.type}</span>
      </div>
      <h3><a href="${movie.url}">${movie.title}</a></h3>
      <p>${oneLine}</p>
      <div class="card-tags">${tags}</div>
    </div>
  `;

  return article;
}

function initSearchPage() {
  const searchGrid = document.querySelector('[data-search-results]');
  const searchInput = document.querySelector('[data-search-input]');
  const countNode = document.querySelector('[data-search-count]');
  const titleNode = document.querySelector('[data-search-title]');

  if (!searchGrid || !window.MOVIE_SEARCH_DATA) {
    return;
  }

  const initialKeyword = getQueryParameter('q');
  if (searchInput) {
    searchInput.value = initialKeyword;
  }

  function render(keyword) {
    const normalized = normalizeText(keyword);
    const source = window.MOVIE_SEARCH_DATA;
    const results = normalized
      ? source.filter((movie) => normalizeText([
          movie.title,
          movie.region,
          movie.year,
          movie.type,
          movie.genre,
          (movie.tags || []).join(' '),
          movie.oneLine,
        ].join(' ')).includes(normalized))
      : source.slice(0, 48);

    searchGrid.innerHTML = '';
    results.slice(0, 240).forEach((movie) => {
      searchGrid.appendChild(createSearchCard(movie));
    });

    if (countNode) {
      countNode.textContent = String(results.length);
    }

    if (titleNode) {
      titleNode.textContent = normalized ? `搜索结果：${keyword}` : '热门内容推荐';
    }
  }

  if (searchInput) {
    searchInput.addEventListener('input', () => render(searchInput.value));
  }

  render(initialKeyword);
}

async function initHlsPlayers() {
  const players = Array.from(document.querySelectorAll('.js-hls-player'));
  if (!players.length) {
    return;
  }

  let Hls = null;
  try {
    const module = await import('./hls-vendor.js');
    Hls = module.H;
  } catch (error) {
    console.warn('HLS module failed to load, falling back to native playback.', error);
  }

  players.forEach((video) => {
    const source = video.dataset.src;
    const shell = video.closest('.player-shell');
    const overlayButton = shell ? shell.querySelector('[data-player-play]') : null;
    const status = document.querySelector('[data-player-status]');

    if (!source) {
      status && (status.textContent = '播放源未配置');
      return;
    }

    if (Hls && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
      });
      hls.loadSource(source);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        status && (status.textContent = '播放源已就绪');
      });
      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data && data.fatal) {
          status && (status.textContent = '播放源正在重试');
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
            hls.startLoad();
          } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
            hls.recoverMediaError();
          } else {
            hls.destroy();
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = source;
      status && (status.textContent = '播放源已就绪');
    } else {
      video.src = source;
      status && (status.textContent = '当前浏览器可能需要支持 HLS 的播放环境');
    }

    async function togglePlayback() {
      if (video.paused) {
        try {
          await video.play();
        } catch (error) {
          status && (status.textContent = '点击播放器控件可继续播放');
        }
      } else {
        video.pause();
      }
    }

    overlayButton && overlayButton.addEventListener('click', togglePlayback);
    video.addEventListener('click', togglePlayback);
    video.addEventListener('play', () => {
      overlayButton && overlayButton.classList.add('is-hidden');
      status && (status.textContent = '正在播放');
    });
    video.addEventListener('pause', () => {
      overlayButton && overlayButton.classList.remove('is-hidden');
    });
  });
}

function initBackToTop() {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'back-to-top';
  button.textContent = '↑';
  button.setAttribute('aria-label', '返回顶部');
  document.body.appendChild(button);

  window.addEventListener('scroll', () => {
    button.classList.toggle('is-visible', window.scrollY > 500);
  });

  button.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initMobileMenu();
  initSearchForms();
  initHeroSlider();
  initCardFilters();
  initSearchPage();
  initHlsPlayers();
  initBackToTop();
});
