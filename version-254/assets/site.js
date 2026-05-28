
(function () {
  const toggle = document.getElementById('navToggle');
  const panel = document.getElementById('navPanel');
  if (toggle && panel) {
    toggle.addEventListener('click', function () {
      panel.classList.toggle('hidden');
    });
  }
})();
