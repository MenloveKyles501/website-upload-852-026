document.addEventListener("DOMContentLoaded", function () {
  var menuButton = document.querySelector(".mobile-menu-button");
  var mobileNav = document.querySelector(".mobile-nav");

  if (menuButton && mobileNav) {
    menuButton.addEventListener("click", function () {
      var open = mobileNav.classList.toggle("is-open");
      mobileNav.hidden = !open;
      menuButton.setAttribute("aria-expanded", String(open));
    });
  }

  document.querySelectorAll("[data-filter-panel]").forEach(function (panel) {
    var scope = panel.parentElement || document;
    var input = panel.querySelector(".filter-keyword");
    var genre = panel.querySelector(".filter-genre");
    var year = panel.querySelector(".filter-year");
    var cards = Array.prototype.slice.call(scope.querySelectorAll("[data-card]"));
    var params = new URLSearchParams(window.location.search);
    var q = params.get("q") || "";

    if (input && q) {
      input.value = q;
    }

    function matchCard(card) {
      var words = input ? input.value.trim().toLowerCase() : "";
      var genreValue = genre ? genre.value : "";
      var yearValue = year ? year.value : "";
      var haystack = (card.getAttribute("data-search") || "").toLowerCase();
      var cardGenre = card.getAttribute("data-genre") || "";
      var cardYear = card.getAttribute("data-year") || "";
      var okWords = !words || haystack.indexOf(words) !== -1;
      var okGenre = !genreValue || cardGenre.indexOf(genreValue) !== -1;
      var okYear = !yearValue || cardYear === yearValue;
      return okWords && okGenre && okYear;
    }

    function applyFilter() {
      var visible = 0;
      cards.forEach(function (card) {
        var ok = matchCard(card);
        card.classList.toggle("is-hidden", !ok);
        if (ok) visible += 1;
      });
      var empty = scope.querySelector("[data-empty]");
      if (empty) {
        empty.hidden = visible !== 0;
      }
    }

    [input, genre, year].forEach(function (control) {
      if (control) {
        control.addEventListener("input", applyFilter);
        control.addEventListener("change", applyFilter);
      }
    });

    applyFilter();
  });

  var video = document.getElementById("movie-player");
  var overlay = document.getElementById("player-start");
  var message = document.getElementById("player-message");

  if (video && overlay) {
    var media = video.getAttribute("data-m3u8");
    var attached = false;

    function setMessage(text) {
      if (message) {
        message.textContent = text || "";
      }
    }

    function attachMedia() {
      if (attached) {
        return;
      }
      attached = true;
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = media;
      } else if (window.Hls && window.Hls.isSupported()) {
        var hls = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true
        });
        hls.loadSource(media);
        hls.attachMedia(video);
        hls.on(window.Hls.Events.ERROR, function (event, data) {
          if (data && data.fatal) {
            setMessage("播放暂时不可用，请稍后再试");
          }
        });
      } else {
        video.src = media;
      }
    }

    function startPlay() {
      attachMedia();
      overlay.hidden = true;
      var playPromise = video.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(function () {
          overlay.hidden = false;
          setMessage("点击播放按钮开始观看");
        });
      }
    }

    overlay.addEventListener("click", startPlay);
    video.addEventListener("click", function () {
      if (video.paused) {
        startPlay();
      } else {
        video.pause();
      }
    });
  }
});
