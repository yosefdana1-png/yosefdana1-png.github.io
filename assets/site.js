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
    localizeAlts();
  }
  // Pictures shared by both languages keep their Hebrew alt and carry the English one in data-alt-en.
  function localizeAlts() {
    var imgs = document.querySelectorAll('img[data-alt-en]');
    for (var i = 0; i < imgs.length; i++) {
      var img = imgs[i];
      if (!img.hasAttribute('data-alt-he')) img.setAttribute('data-alt-he', img.alt);
      img.alt = img.getAttribute('data-alt-' + root.lang);
    }
  }
  document.addEventListener('DOMContentLoaded', localizeAlts);

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

  // Screenshots open with the keyboard too: Tab to one, then Enter or Space.
  document.addEventListener('DOMContentLoaded', function () {
    var imgs = document.querySelectorAll('.shots img');
    for (var i = 0; i < imgs.length; i++) {
      imgs[i].tabIndex = 0;
      imgs[i].setAttribute('role', 'button');
    }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    var shot = e.target.closest && e.target.closest('.shots img');
    if (!shot) return;
    e.preventDefault();
    openViewer(shot);
  });

  // Tap a screenshot to see it large. Next / previous with the side buttons,
  // the arrow keys or a swipe; Esc, × or a tap outside the picture closes.
  var CHEVRON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>';
  var LABELS = {
    he: { close: 'סגירה', prev: 'הקודם', next: 'הבא' },
    en: { close: 'Close', prev: 'Previous', next: 'Next' }
  };
  var viewer, viewerImg, viewerCount, shots = [], index = 0;

  function show(i) {
    index = (i + shots.length) % shots.length;
    viewerImg.src = shots[index].getAttribute('data-full') || shots[index].src;
    viewerImg.alt = shots[index].alt;
    viewerCount.textContent = (index + 1) + ' / ' + shots.length;
  }
  // step +1 is always "next" in reading order; on screen that is left in Hebrew, right in English.
  function screenStep(towardRight) {
    return (root.dir === 'rtl') === towardRight ? -1 : 1;
  }
  function buildViewer() {
    viewer = document.createElement('dialog');
    viewer.className = 'viewer';
    viewer.innerHTML =
      '<figure><img alt=""><figcaption></figcaption></figure>' +
      '<button type="button" class="v-close">×</button>' +
      '<button type="button" class="v-nav v-prev" data-step="-1">' + CHEVRON + '</button>' +
      '<button type="button" class="v-nav v-next" data-step="1">' + CHEVRON + '</button>';
    viewerImg = viewer.querySelector('img');
    viewerCount = viewer.querySelector('figcaption');

    viewer.addEventListener('click', function (e) {
      var nav = e.target.closest('.v-nav');
      if (nav) { show(index + Number(nav.getAttribute('data-step'))); return; }
      if (e.target === viewerImg) return;
      viewer.close();
    });
    viewer.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') show(index + screenStep(true));
      else if (e.key === 'ArrowLeft') show(index + screenStep(false));
    });

    var startX = null, startY = 0;
    viewer.addEventListener('touchstart', function (e) {
      startX = e.touches[0].clientX; startY = e.touches[0].clientY;
    }, { passive: true });
    viewer.addEventListener('touchend', function (e) {
      if (startX === null) return;
      var dx = e.changedTouches[0].clientX - startX, dy = e.changedTouches[0].clientY - startY;
      startX = null;
      if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy)) return;
      // Swiping the picture to the left brings in the one on its right, and vice versa.
      show(index + screenStep(dx < 0));
    });

    document.body.appendChild(viewer);
  }
  function openViewer(img) {
    if (!viewer) buildViewer();
    var t = LABELS[root.lang] || LABELS.he;
    viewer.querySelector('.v-close').setAttribute('aria-label', t.close);
    viewer.querySelector('.v-prev').setAttribute('aria-label', t.prev);
    viewer.querySelector('.v-next').setAttribute('aria-label', t.next);

    shots = Array.prototype.filter.call(img.parentNode.querySelectorAll('img'), function (el) {
      return el.offsetParent !== null;
    });
    viewer.classList.toggle('single', shots.length < 2);
    show(shots.indexOf(img));
    viewer.showModal();
  }

  window.addEventListener('hashchange', function () {
    var lang = fromHash();
    if (lang) applyLang(lang);
  });
})();
