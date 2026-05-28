(function () {
  'use strict';

  var hlsLoadPromise = null;
  var hlsCdnList = [
    'https://cdn.jsdelivr.net/npm/hls.js@1/dist/hls.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/hls.js/1.5.17/hls.min.js'
  ];

  function qs(selector, parent) {
    return (parent || document).querySelector(selector);
  }

  function qsa(selector, parent) {
    return Array.prototype.slice.call((parent || document).querySelectorAll(selector));
  }

  function setupNavigation() {
    var toggle = qs('[data-nav-toggle]');
    var menu = qs('[data-mobile-menu]');
    if (!toggle || !menu) {
      return;
    }
    toggle.addEventListener('click', function () {
      var open = menu.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(open));
    });
  }

  function setupHero() {
    var hero = qs('[data-hero]');
    if (!hero) {
      return;
    }
    var slides = qsa('[data-hero-slide]', hero);
    var dots = qsa('[data-hero-dot]', hero);
    if (slides.length <= 1) {
      return;
    }
    var current = 0;
    var timer = null;

    function show(index) {
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('is-active', slideIndex === current);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle('is-active', dotIndex === current);
      });
    }

    function start() {
      stop();
      timer = window.setInterval(function () {
        show(current + 1);
      }, 5200);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    }

    dots.forEach(function (dot, index) {
      dot.addEventListener('click', function () {
        show(index);
        start();
      });
    });

    hero.addEventListener('mouseenter', stop);
    hero.addEventListener('mouseleave', start);
    start();
  }

  function setupSearchFiltering() {
    var params = new URLSearchParams(window.location.search);
    var keyword = (params.get('keyword') || '').trim().toLowerCase();
    var cards = qsa('[data-movie-card]');
    var input = qs('[data-search-input]');
    var status = qs('[data-filter-status]');

    if (input && keyword) {
      input.value = keyword;
    }

    if (!keyword || cards.length === 0) {
      return;
    }

    cards.forEach(function (card) {
      var haystack = [
        card.getAttribute('data-title') || '',
        card.getAttribute('data-genre') || '',
        card.getAttribute('data-region') || '',
        card.getAttribute('data-year') || '',
        card.textContent || ''
      ].join(' ').toLowerCase();
      card.hidden = haystack.indexOf(keyword) === -1;
    });

    if (status) {
      status.textContent = '已根据关键词更新片库显示。';
    }
  }

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  function ensureHls() {
    if (window.Hls) {
      return Promise.resolve(window.Hls);
    }
    if (hlsLoadPromise) {
      return hlsLoadPromise;
    }
    hlsLoadPromise = hlsCdnList.reduce(function (promise, src) {
      return promise.catch(function () {
        return loadScript(src).then(function () {
          if (!window.Hls) {
            throw new Error('HLS library unavailable');
          }
          return window.Hls;
        });
      });
    }, Promise.reject());
    return hlsLoadPromise;
  }

  function preparePlayer(player) {
    if (!player || player.dataset.ready === 'true') {
      return Promise.resolve();
    }
    var video = qs('[data-video-element]', player);
    var message = qs('[data-player-message]', player);
    var src = player.getAttribute('data-video-src');

    if (!video || !src) {
      if (message) {
        message.textContent = '当前播放源暂不可用。';
      }
      return Promise.reject(new Error('Missing video source'));
    }

    player.dataset.ready = 'true';
    if (message) {
      message.textContent = '正在初始化播放器。';
    }

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src;
      if (message) {
        message.textContent = '播放器已就绪。';
      }
      return Promise.resolve();
    }

    return ensureHls().then(function (Hls) {
      if (!Hls.isSupported()) {
        throw new Error('HLS is not supported');
      }
      var hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true
      });
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, function () {
        if (message) {
          message.textContent = '播放器已就绪。';
        }
      });
      hls.on(Hls.Events.ERROR, function (eventName, data) {
        if (!data || !data.fatal) {
          return;
        }
        if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
          hls.startLoad();
        } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
          hls.recoverMediaError();
        } else {
          hls.destroy();
          if (message) {
            message.textContent = '播放器初始化失败，请稍后重试。';
          }
        }
      });
      player._hls = hls;
    }).catch(function () {
      player.dataset.ready = 'false';
      if (message) {
        message.textContent = '当前浏览器无法加载 HLS 播放器。';
      }
    });
  }

  function setupPlayers() {
    qsa('.js-video-player').forEach(function (player) {
      var video = qs('[data-video-element]', player);
      var button = qs('.js-play-video', player);
      if (!video) {
        return;
      }

      if (button) {
        button.addEventListener('click', function () {
          preparePlayer(player).then(function () {
            video.play().catch(function () {});
          });
        });
      }

      video.addEventListener('play', function () {
        player.classList.add('is-playing');
        preparePlayer(player);
      });

      video.addEventListener('pause', function () {
        if (!video.ended) {
          player.classList.remove('is-playing');
        }
      });
    });
  }

  function setupCardSearchIndex() {
    var searchForms = qsa('[data-search-form]');
    searchForms.forEach(function (form) {
      form.addEventListener('submit', function () {
        var input = qs('input[name="keyword"]', form);
        if (input) {
          input.value = input.value.trim();
        }
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    setupNavigation();
    setupHero();
    setupSearchFiltering();
    setupCardSearchIndex();
    setupPlayers();
  });
})();
