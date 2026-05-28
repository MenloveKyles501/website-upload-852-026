(function () {
    var info = window.playInfo || {};
    var video = document.getElementById("moviePlayer");
    var cover = document.querySelector(".player-cover");
    var button = document.querySelector(".play-button");
    var hls = null;
    var ready = false;

    if (!video || !info.url) {
        return;
    }

    function attach() {
        if (ready) {
            return;
        }

        ready = true;

        if (video.canPlayType("application/vnd.apple.mpegurl")) {
            video.src = info.url;
            return;
        }

        if (window.Hls && window.Hls.isSupported()) {
            hls = new window.Hls({
                maxBufferLength: 30,
                enableWorker: true
            });
            hls.loadSource(info.url);
            hls.attachMedia(video);
            return;
        }

        video.src = info.url;
    }

    function start() {
        attach();
        video.controls = true;

        if (cover) {
            cover.classList.add("is-hidden");
        }

        var task = video.play();

        if (task && typeof task.catch === "function") {
            task.catch(function () {
                if (cover) {
                    cover.classList.remove("is-hidden");
                }
            });
        }
    }

    if (cover) {
        cover.addEventListener("click", start);
    }

    if (button) {
        button.addEventListener("click", function (event) {
            event.stopPropagation();
            start();
        });
    }

    video.addEventListener("click", function () {
        if (video.paused) {
            start();
        }
    });
})();
