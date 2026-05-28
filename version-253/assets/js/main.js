(function () {
  var header = document.getElementById('siteHeader');
  var menuButton = document.getElementById('mobileMenuBtn');
  var mobileNav = document.getElementById('mobileNav');

  function updateHeader() {
    if (!header || !header.classList.contains('is-transparent')) {
      return;
    }
    if (window.scrollY > 20) {
      header.classList.add('is-scrolled');
    } else {
      header.classList.remove('is-scrolled');
    }
  }

  if (menuButton && mobileNav) {
    menuButton.addEventListener('click', function () {
      mobileNav.classList.toggle('open');
    });
  }

  window.addEventListener('scroll', updateHeader, { passive: true });
  updateHeader();

  var hero = document.getElementById('homeHero');
  if (hero) {
    var slides = Array.prototype.slice.call(hero.querySelectorAll('.hero-slide'));
    var dots = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-dot]'));
    var prev = document.getElementById('heroPrev');
    var next = document.getElementById('heroNext');
    var current = 0;
    var timer = null;

    function showSlide(index) {
      if (!slides.length) {
        return;
      }
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, idx) {
        slide.classList.toggle('active', idx === current);
      });
      dots.forEach(function (dot, idx) {
        dot.classList.toggle('active', idx === current);
      });
    }

    function startHero() {
      clearInterval(timer);
      timer = setInterval(function () {
        showSlide(current + 1);
      }, 5000);
    }

    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        showSlide(Number(dot.getAttribute('data-hero-dot')) || 0);
        startHero();
      });
    });

    if (prev) {
      prev.addEventListener('click', function () {
        showSlide(current - 1);
        startHero();
      });
    }

    if (next) {
      next.addEventListener('click', function () {
        showSlide(current + 1);
        startHero();
      });
    }

    showSlide(0);
    startHero();
  }

  var searchInput = document.getElementById('siteSearch');
  var typeFilter = document.getElementById('typeFilter');
  var yearFilter = document.getElementById('yearFilter');
  var regionFilter = document.getElementById('regionFilter');
  var filterGrid = document.getElementById('filterGrid');
  var emptyState = document.getElementById('emptyState');

  function applyFilters() {
    if (!filterGrid) {
      return;
    }
    var cards = Array.prototype.slice.call(filterGrid.querySelectorAll('.filterable-card'));
    var query = searchInput ? searchInput.value.trim().toLowerCase() : '';
    var type = typeFilter ? typeFilter.value : '';
    var year = yearFilter ? yearFilter.value : '';
    var region = regionFilter ? regionFilter.value : '';
    var visible = 0;

    cards.forEach(function (card) {
      var text = [
        card.getAttribute('data-title'),
        card.getAttribute('data-region'),
        card.getAttribute('data-type'),
        card.getAttribute('data-year'),
        card.getAttribute('data-tags')
      ].join(' ').toLowerCase();
      var match = true;
      if (query && text.indexOf(query) === -1) {
        match = false;
      }
      if (type && card.getAttribute('data-type') !== type) {
        match = false;
      }
      if (year && card.getAttribute('data-year') !== year) {
        match = false;
      }
      if (region && card.getAttribute('data-region') !== region) {
        match = false;
      }
      card.hidden = !match;
      if (match) {
        visible += 1;
      }
    });

    if (emptyState) {
      emptyState.hidden = visible !== 0;
    }
  }

  [searchInput, typeFilter, yearFilter, regionFilter].forEach(function (control) {
    if (control) {
      control.addEventListener('input', applyFilters);
      control.addEventListener('change', applyFilters);
    }
  });

  if (searchInput) {
    var params = new URLSearchParams(window.location.search);
    var q = params.get('q');
    if (q) {
      searchInput.value = q;
      applyFilters();
    }
  }
})();

function initPlayer(config) {
  var video = document.getElementById('movieVideo');
  var button = document.getElementById('moviePlayButton');
  var loading = document.getElementById('playerLoading');
  var error = document.getElementById('playerError');
  var hls = null;

  if (!video || !config || !config.url) {
    return;
  }

  function setLoading(value) {
    if (loading) {
      loading.hidden = !value;
    }
  }

  function setError(value) {
    if (error) {
      error.hidden = !value;
    }
  }

  function hideCover() {
    if (button) {
      button.classList.add('hidden');
    }
  }

  function loadSource() {
    setError(false);
    setLoading(true);

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = config.url;
      return;
    }

    if (window.Hls && window.Hls.isSupported()) {
      hls = new window.Hls({
        enableWorker: true,
        lowLatencyMode: true
      });
      hls.loadSource(config.url);
      hls.attachMedia(video);
      hls.on(window.Hls.Events.ERROR, function (event, data) {
        if (data && data.fatal) {
          setLoading(false);
          setError(true);
        }
      });
      return;
    }

    setLoading(false);
    setError(true);
  }

  function playVideo() {
    hideCover();
    setLoading(true);
    var result = video.play();
    if (result && typeof result.catch === 'function') {
      result.catch(function () {
        setLoading(false);
      });
    }
  }

  video.addEventListener('loadedmetadata', function () {
    setLoading(false);
  });

  video.addEventListener('canplay', function () {
    setLoading(false);
  });

  video.addEventListener('playing', function () {
    hideCover();
    setLoading(false);
  });

  video.addEventListener('error', function () {
    setLoading(false);
    setError(true);
  });

  video.addEventListener('click', function () {
    if (video.paused) {
      playVideo();
    }
  });

  if (button) {
    button.addEventListener('click', playVideo);
  }

  window.addEventListener('beforeunload', function () {
    if (hls) {
      hls.destroy();
    }
  });

  loadSource();
}
