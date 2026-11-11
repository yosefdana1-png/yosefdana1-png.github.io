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
    // Same for aria-label on elements shared by both languages.
    var labelled = document.querySelectorAll('[data-aria-en]');
    for (var j = 0; j < labelled.length; j++) {
      var el = labelled[j];
      if (!el.hasAttribute('data-aria-he')) el.setAttribute('data-aria-he', el.getAttribute('aria-label'));
      el.setAttribute('aria-label', el.getAttribute('data-aria-' + root.lang));
    }
  }
  document.addEventListener('DOMContentLoaded', localizeAlts);

  var saved = load('lang');
  applyLang(fromHash() || (LANGS[saved] ? saved : 'he'));

  // ===== Theme =====
  // Light, dark or automatic (follows the device). Automatic until the visitor picks;
  // the choice is remembered. The button opens a small menu with the three options.
  var COLORS = { light: '#FFFFFF', dark: '#0A0A0A' };
  var CHOICES = ['light', 'dark', 'auto'];

  function applyTheme(choice) {
    root.setAttribute('data-theme-choice', choice);
    if (choice === 'auto') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', choice);
    // The address-bar color: fixed for light / dark, by device setting for automatic
    var metas = document.querySelectorAll('meta[name="theme-color"]');
    for (var i = 0; i < metas.length; i++) {
      var m = metas[i];
      if (!m.hasAttribute('data-media')) {
        m.setAttribute('data-media', m.getAttribute('media') || '');
        m.setAttribute('data-content', m.getAttribute('content'));
      }
      if (choice === 'auto') {
        m.setAttribute('media', m.getAttribute('data-media'));
        m.setAttribute('content', m.getAttribute('data-content'));
      } else {
        m.removeAttribute('media');
        m.setAttribute('content', COLORS[choice]);
      }
    }
    var items = document.querySelectorAll('.theme-menu [data-theme-pick]');
    for (var j = 0; j < items.length; j++) {
      items[j].setAttribute('aria-checked', items[j].getAttribute('data-theme-pick') === choice ? 'true' : 'false');
    }
  }

  var savedTheme = load('theme');
  applyTheme(CHOICES.indexOf(savedTheme) >= 0 ? savedTheme : 'auto');

  var ICON_AUTO = '<svg class="i-auto" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 3.5a8.5 8.5 0 0 1 0 17z" fill="currentColor" stroke="none"/></svg>';
  var ICON_SUN = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/></svg>';
  var ICON_MOON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/></svg>';
  var CHECK = '<svg class="check" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
  var MENU_ITEMS = [
    ['light', ICON_SUN, 'בהיר', 'Light'],
    ['dark', ICON_MOON, 'כהה', 'Dark'],
    ['auto', ICON_AUTO, 'אוטומטי', 'Automatic']
  ];

  function buildThemeMenus() {
    var btns = document.querySelectorAll('[data-toggle-theme]');
    for (var i = 0; i < btns.length; i++) {
      var btn = btns[i];
      btn.insertAdjacentHTML('beforeend', ICON_AUTO);
      btn.setAttribute('aria-haspopup', 'true');
      btn.setAttribute('aria-expanded', 'false');
      btn.setAttribute('aria-label', 'מצב תצוגה');
      btn.setAttribute('data-aria-en', 'Appearance');
      var wrap = document.createElement('span');
      wrap.className = 'theme-wrap';
      btn.parentNode.insertBefore(wrap, btn);
      wrap.appendChild(btn);
      var menu = document.createElement('div');
      menu.className = 'theme-menu';
      menu.setAttribute('role', 'menu');
      menu.hidden = true;
      menu.innerHTML = MENU_ITEMS.map(function (it) {
        return '<button type="button" role="menuitemradio" data-theme-pick="' + it[0] + '">' + it[1] +
          '<span data-l="he">' + it[2] + '</span><span data-l="en" lang="en">' + it[3] + '</span>' + CHECK + '</button>';
      }).join('');
      wrap.appendChild(menu);
    }
    applyTheme(root.getAttribute('data-theme-choice'));
    localizeAlts();
  }
  document.addEventListener('DOMContentLoaded', buildThemeMenus);

  function openMenu(btn, open) {
    var menu = btn.parentNode.querySelector('.theme-menu');
    menu.hidden = !open;
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open) {
      var checked = menu.querySelector('[aria-checked="true"]') || menu.querySelector('button');
      checked.focus();
    }
  }
  function closeMenus(returnFocus) {
    var open = document.querySelectorAll('.theme-menu:not([hidden])');
    for (var i = 0; i < open.length; i++) {
      var btn = open[i].parentNode.querySelector('[data-toggle-theme]');
      openMenu(btn, false);
      if (returnFocus) btn.focus();
    }
  }
  document.addEventListener('keydown', function (e) {
    var menu = e.target.closest && e.target.closest('.theme-menu');
    if (e.key === 'Escape') { closeMenus(true); return; }
    if (!menu || (e.key !== 'ArrowDown' && e.key !== 'ArrowUp')) return;
    e.preventDefault();
    var items = Array.prototype.slice.call(menu.querySelectorAll('button'));
    var i = items.indexOf(e.target) + (e.key === 'ArrowDown' ? 1 : -1);
    items[(i + items.length) % items.length].focus();
  });

  // ===== Motion =====
  // Sections fade and rise into view as you scroll. Off with "reduce motion",
  // and without IntersectionObserver everything simply shows.
  var still = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (!still.matches && 'IntersectionObserver' in window) root.classList.add('motion');
  function setupReveal() {
    var marks = [];
    Array.prototype.forEach.call(document.querySelectorAll('.home-head > *'), function (el, i) {
      el.style.setProperty('--delay', (i * 0.12) + 's');
      marks.push(el);
    });
    Array.prototype.forEach.call(document.querySelectorAll('.app-text, .shots-box'), function (el) {
      if (el.classList.contains('shots-box')) el.style.setProperty('--delay', '.15s');
      marks.push(el);
    });
    marks.forEach(function (el) { el.setAttribute('data-reveal', ''); });
    if (!root.classList.contains('motion')) {
      marks.forEach(function (el) { el.classList.add('in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('in');
        io.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    marks.forEach(function (el) { io.observe(el); });
  }
  document.addEventListener('DOMContentLoaded', setupReveal);

  // The top bar gets a hairline under it once the page scrolls
  function onScroll() { root.classList.toggle('scrolled', window.scrollY > 8); }
  window.addEventListener('scroll', onScroll, { passive: true });
  document.addEventListener('DOMContentLoaded', onScroll);

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
    var pick = e.target.closest('[data-theme-pick]');
    if (pick) {
      var choice = pick.getAttribute('data-theme-pick');
      applyTheme(choice);
      save('theme', choice);
      closeMenus(true);
      return;
    }
    var themeBtn = e.target.closest('[data-toggle-theme]');
    if (themeBtn) {
      var isOpen = themeBtn.getAttribute('aria-expanded') === 'true';
      closeMenus(false);
      if (!isOpen) openMenu(themeBtn, true);
      return;
    }
    if (!e.target.closest('.theme-menu')) closeMenus(false);
  });

  // ===== Screenshots =====
  // One shot at a time inside the phone frame: swipe on the phone, or use the
  // arrows (mouse, keyboard) and the dots under it.
  var DOT_LABEL = { he: 'צילום מסך {n} מתוך {t}', en: 'Screenshot {n} of {t}' };
  function setupCarousel(box) {
    var screen = box.querySelector('.shots-screen');
    if (!screen) return;
    var prev = document.createElement('button');
    var next = document.createElement('button');
    prev.type = next.type = 'button';
    prev.className = 'shots-nav prev'; next.className = 'shots-nav next';
    prev.innerHTML = next.innerHTML = CHEVRON;
    var dots = document.createElement('div');
    dots.className = 'shots-dots';
    box.insertBefore(prev, box.firstChild);
    box.appendChild(next);
    box.appendChild(dots);

    function visible() {
      return Array.prototype.filter.call(screen.querySelectorAll('img'), function (el) {
        var l = el.getAttribute('data-l');
        return !l || l === root.lang;
      });
    }
    function current() {
      return Math.round(Math.abs(screen.scrollLeft) / (screen.clientWidth || 1));
    }
    function go(i) {
      var imgs = visible();
      i = Math.max(0, Math.min(imgs.length - 1, i));
      var delta = imgs[i].getBoundingClientRect().left - screen.getBoundingClientRect().left;
      screen.scrollBy({ left: delta, behavior: reduceMotion.matches ? 'auto' : 'smooth' });
    }
    function render() {
      var imgs = visible(), t = LABELS[root.lang] || LABELS.he;
      var dl = DOT_LABEL[root.lang] || DOT_LABEL.he;
      if (dots.children.length !== imgs.length) {
        dots.innerHTML = '';
        imgs.forEach(function (img, n) {
          var d = document.createElement('button');
          d.type = 'button';
          d.addEventListener('click', function () { go(n); });
          dots.appendChild(d);
        });
      }
      var i = current();
      Array.prototype.forEach.call(dots.children, function (d, n) {
        d.setAttribute('aria-label', dl.replace('{n}', n + 1).replace('{t}', imgs.length));
        d.setAttribute('aria-current', n === i ? 'true' : 'false');
      });
      prev.setAttribute('aria-label', t.prev);
      next.setAttribute('aria-label', t.next);
      prev.disabled = i <= 0;
      next.disabled = i >= imgs.length - 1;
    }
    prev.addEventListener('click', function () { go(current() - 1); });
    next.addEventListener('click', function () { go(current() + 1); });
    var pending;
    screen.addEventListener('scroll', function () {
      cancelAnimationFrame(pending);
      pending = requestAnimationFrame(render);
    }, { passive: true });
    // Language switch: other shots, other labels; start again from the first one
    new MutationObserver(function () { screen.scrollLeft = 0; render(); })
      .observe(root, { attributes: true, attributeFilter: ['lang'] });
    render();
  }
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  document.addEventListener('DOMContentLoaded', function () {
    Array.prototype.forEach.call(document.querySelectorAll('.shots-box'), setupCarousel);
  });

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

    // Every shot of this app in the page's language, also the ones hidden on wide screens
    shots = Array.prototype.filter.call(img.parentNode.querySelectorAll('img'), function (el) {
      var l = el.getAttribute('data-l');
      return !l || l === root.lang;
    });
    viewer.classList.toggle('single', shots.length < 2);
    show(Math.max(0, shots.indexOf(img)));
    viewer.showModal();
  }

  window.addEventListener('hashchange', function () {
    var lang = fromHash();
    if (lang) applyLang(lang);
  });
})();
