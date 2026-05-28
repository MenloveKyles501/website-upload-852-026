(function () {
    var menuButton = document.querySelector(".menu-toggle");
    var mainNav = document.querySelector(".main-nav");

    if (menuButton && mainNav) {
        menuButton.addEventListener("click", function () {
            mainNav.classList.toggle("is-open");
        });
    }

    var slides = Array.prototype.slice.call(document.querySelectorAll(".hero-slide"));
    var dots = Array.prototype.slice.call(document.querySelectorAll(".hero-dot"));
    var activeIndex = 0;
    var timer = null;

    function showSlide(index) {
        if (!slides.length) {
            return;
        }

        activeIndex = (index + slides.length) % slides.length;

        slides.forEach(function (slide, slideIndex) {
            slide.classList.toggle("is-active", slideIndex === activeIndex);
        });

        dots.forEach(function (dot, dotIndex) {
            dot.classList.toggle("is-active", dotIndex === activeIndex);
        });
    }

    function startSlider() {
        if (slides.length < 2) {
            return;
        }

        timer = window.setInterval(function () {
            showSlide(activeIndex + 1);
        }, 5600);
    }

    dots.forEach(function (dot, index) {
        dot.addEventListener("click", function () {
            if (timer) {
                window.clearInterval(timer);
            }

            showSlide(index);
            startSlider();
        });
    });

    startSlider();

    var input = document.getElementById("filterInput");
    var region = document.getElementById("filterRegion");
    var type = document.getElementById("filterType");
    var year = document.getElementById("filterYear");
    var empty = document.getElementById("filterEmpty");
    var cards = Array.prototype.slice.call(document.querySelectorAll(".searchable-grid .movie-card"));

    function valueOf(element) {
        return element ? element.value.trim().toLowerCase() : "";
    }

    function cardText(card) {
        return [
            card.getAttribute("data-title") || "",
            card.getAttribute("data-region") || "",
            card.getAttribute("data-type") || "",
            card.getAttribute("data-year") || "",
            card.getAttribute("data-tags") || ""
        ].join(" ").toLowerCase();
    }

    function filterCards() {
        if (!cards.length) {
            return;
        }

        var query = valueOf(input);
        var selectedRegion = valueOf(region);
        var selectedType = valueOf(type);
        var selectedYear = valueOf(year);
        var visible = 0;

        cards.forEach(function (card) {
            var text = cardText(card);
            var cardRegion = (card.getAttribute("data-region") || "").toLowerCase();
            var cardType = (card.getAttribute("data-type") || "").toLowerCase();
            var cardYear = (card.getAttribute("data-year") || "").toLowerCase();
            var matchesQuery = !query || text.indexOf(query) !== -1;
            var matchesRegion = !selectedRegion || cardRegion.indexOf(selectedRegion) !== -1;
            var matchesType = !selectedType || cardType.indexOf(selectedType) !== -1;
            var matchesYear = !selectedYear || cardYear === selectedYear;
            var show = matchesQuery && matchesRegion && matchesType && matchesYear;

            card.style.display = show ? "" : "none";

            if (show) {
                visible += 1;
            }
        });

        if (empty) {
            empty.classList.toggle("is-visible", visible === 0);
        }
    }

    [input, region, type, year].forEach(function (element) {
        if (element) {
            element.addEventListener("input", filterCards);
            element.addEventListener("change", filterCards);
        }
    });
})();
