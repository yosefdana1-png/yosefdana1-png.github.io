// Shared by every page: Hebrew / English switch and light / dark switch.
// Load in <head> (not deferred) so the right language and theme show on first paint.
(function () {
  var root = document.documentElement;

  function load(key) { try { return localStorage.getItem(key); } catch (e) { return null; } }
  function save(key, value) { try { localStorage.setItem(key, value); } catch (e) {} }

  // ===== Language =====
  // Order: #en / #he in the address, then the visitor's last choice, then Hebrew.
  var LANGS = { he: 'rtl', en: 'ltr' };

  function fromHash() {
    var h = location.hash.slice(1);
    return LANGS[h] ? h : null;
  }
  function applyLang(lang) {
    root.setAttribute('data-lang', lang);
    root.lang = lang;
    root.dir = LANGS[lang];
    var title = root.getAttribute('data-title-' + lang);
    if (title) document.title = title;
  }

  var saved = load('lang');
  applyLang(fromHash() || (LANGS[saved] ? saved : 'he'));

  // ===== Theme =====
  // Follows the device until the visitor picks one; the choice is remembered.
  var COLORS = { light: '#FFFFFF', dark: '#0A0A0A' };
  var system = window.matchMedia('(prefers-color-scheme: dark)');

  function currentTheme() {
    return root.getAttribute('data-theme') || (system.matches ? 'dark' : 'light');
  }
  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
    var metas = document.querySelectorAll('meta[name="theme-color"]');
    for (var i = 0; i < metas.length; i++) {
      metas[i].removeAttribute('media');
      metas[i].setAttribute('content', COLORS[theme]);
    }
  }

  var savedTheme = load('theme');
  if (COLORS[savedTheme]) applyTheme(savedTheme);

  // ===== Buttons =====
  document.addEventListener('click', function (e) {
    var langLink = e.target.closest('[data-set-lang]');
    if (langLink) {
      e.preventDefault();
      var lang = langLink.getAttribute('data-set-lang');
      applyLang(lang);
      save('lang', lang);
      history.replaceState(null, '', location.pathname + location.search + '#' + lang);
      window.scrollTo(0, 0);
      var next = document.querySelector('[data-set-lang][data-l="' + lang + '"]');
      if (next) next.focus({ preventScroll: true });
      return;
    }
    var shot = e.target.closest('.shots img');
    if (shot) {
      openViewer(shot);
      return;
    }
    if (e.target.closest('[data-toggle-theme]')) {
      var theme = currentTheme() === 'dark' ? 'light' : 'dark';
      applyTheme(theme);
      save('theme', theme);
    }
  });

  // ===== Screenshots =====
  // Always open on wide screens; on phones they stay folded until tapped.
  var wide = window.matchMedia('(min-width: 900px)');
  function openShotsOnWide() {
    if (!wide.matches) return;
    var boxes = document.querySelectorAll('.shots-box');
    for (var i = 0; i < boxes.length; i++) boxes[i].open = true;
  }
  document.addEventListener('DOMContentLoaded', openShotsOnWide);
  wide.addEventListener('change', openShotsOnWide);

  // Tap a screenshot to see it large; arrows move within the same app, Esc closes.
  var viewer, viewerImg, shots = [], index = 0;
  function show(i) {
    index = (i + shots.length) % shots.length;
    viewerImg.src = shots[index].getAttribute('data-full') || shots[index].src;
    viewerImg.alt = shots[index].alt;
  }
  function openViewer(img) {
    if (!viewer) {
      viewer = document.createElement('dialog');
      viewer.className = 'viewer';
      viewer.innerHTML = '<img alt=""><button type="button" aria-label="Close">×</button>';
      viewerImg = viewer.querySelector('img');
      viewer.addEventListener('click', function () { viewer.close(); });
      viewer.addEventListener('keydown', function (e) {
        var step = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
        if (!step) return;
        if (root.dir === 'rtl') step = -step;
        show(index + step);
      });
      document.body.appendChild(viewer);
    }
    shots = Array.prototype.filter.call(img.parentNode.querySelectorAll('img'), function (el) {
      return el.offsetParent !== null;
    });
    show(shots.indexOf(img));
    viewer.showModal();
  }

  window.addEventListener('hashchange', function () {
    var lang = fromHash();
    if (lang) applyLang(lang);
  });
})();
