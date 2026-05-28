(function () {
    var menuButton = document.querySelector('[data-menu-toggle]');
    var mobileNav = document.querySelector('[data-mobile-nav]');

    if (menuButton && mobileNav) {
        menuButton.addEventListener('click', function () {
            mobileNav.classList.toggle('is-open');
        });
    }

    document.querySelectorAll('[data-hero]').forEach(function (hero) {
        var cells = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-cell]'));
        var dots = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-dot]'));
        var cards = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-card]'));
        var index = 0;

        function show(nextIndex) {
            if (!cells.length) {
                return;
            }
            index = (nextIndex + cells.length) % cells.length;
            cells.forEach(function (cell, i) {
                cell.style.opacity = i === index || window.innerWidth > 900 ? '1' : '0';
            });
            dots.forEach(function (dot, i) {
                dot.classList.toggle('is-active', i === index);
            });
            cards.forEach(function (card, i) {
                card.style.transform = i === index ? 'translateY(-3px)' : '';
            });
        }

        dots.forEach(function (dot, i) {
            dot.addEventListener('click', function () {
                show(i);
            });
        });

        cards.forEach(function (card, i) {
            card.addEventListener('mouseenter', function () {
                show(i);
            });
        });

        show(0);
        window.setInterval(function () {
            show(index + 1);
        }, 5200);
    });

    document.querySelectorAll('[data-filter-scope]').forEach(function (scope) {
        var input = scope.querySelector('[data-filter-input]');
        var cards = Array.prototype.slice.call(scope.querySelectorAll('[data-card]'));
        var buttons = Array.prototype.slice.call(scope.querySelectorAll('[data-filter-tag]'));
        var empty = scope.querySelector('[data-no-results]');
        var activeTag = 'all';

        function applyFilter() {
            var query = input ? input.value.trim().toLowerCase() : '';
            var visible = 0;

            cards.forEach(function (card) {
                var text = ((card.getAttribute('data-title') || '') + ' ' + (card.getAttribute('data-tags') || '')).toLowerCase();
                var tags = (card.getAttribute('data-tags') || '').toLowerCase();
                var tagMatch = activeTag === 'all' || tags.indexOf(activeTag.toLowerCase()) !== -1;
                var queryMatch = !query || text.indexOf(query) !== -1;
                var ok = tagMatch && queryMatch;
                card.style.display = ok ? '' : 'none';
                if (ok) {
                    visible += 1;
                }
            });

            if (empty) {
                empty.classList.toggle('is-visible', visible === 0);
            }
        }

        if (input) {
            input.addEventListener('input', applyFilter);
        }

        buttons.forEach(function (button) {
            button.addEventListener('click', function () {
                activeTag = button.getAttribute('data-filter-tag') || 'all';
                buttons.forEach(function (item) {
                    item.classList.toggle('is-active', item === button);
                });
                applyFilter();
            });
        });

        applyFilter();
    });

    document.querySelectorAll('[data-player]').forEach(function (wrap) {
        var video = wrap.querySelector('video');
        var button = wrap.querySelector('[data-play-trigger]');
        var status = wrap.querySelector('[data-player-status]');

        if (!video) {
            return;
        }

        var url = video.getAttribute('data-video') || '';
        var hasLoaded = false;
        var hlsInstance = null;

        function prepare() {
            if (hasLoaded || !url) {
                return;
            }
            hasLoaded = true;

            if (window.Hls && window.Hls.isSupported()) {
                hlsInstance = new window.Hls({
                    enableWorker: true,
                    lowLatencyMode: true
                });
                hlsInstance.loadSource(url);
                hlsInstance.attachMedia(video);
                hlsInstance.on(window.Hls.Events.ERROR, function () {
                    if (status) {
                        status.textContent = '播放加载失败，请刷新重试';
                    }
                });
            } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                video.src = url;
            } else {
                video.src = url;
            }
        }

        function start() {
            prepare();
            var promise = video.play();
            if (promise && typeof promise.catch === 'function') {
                promise.catch(function () {
                    if (status) {
                        status.textContent = '请再次点击播放';
                    }
                });
            }
        }

        if (button) {
            button.addEventListener('click', function (event) {
                event.preventDefault();
                start();
            });
        }

        video.addEventListener('play', function () {
            wrap.classList.add('is-playing');
            if (status) {
                status.textContent = '';
            }
        });

        video.addEventListener('pause', function () {
            if (video.currentTime === 0 || video.ended) {
                wrap.classList.remove('is-playing');
            }
        });

        video.addEventListener('ended', function () {
            wrap.classList.remove('is-playing');
        });

        window.addEventListener('beforeunload', function () {
            if (hlsInstance) {
                hlsInstance.destroy();
            }
        });
    });
})();
