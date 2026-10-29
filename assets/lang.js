// Hebrew / English switch, shared by every page.
// Order: #en / #he in the address, then the visitor's last choice, then Hebrew.
// Load in <head> (not deferred) so the right language shows on first paint.
(function () {
  var root = document.documentElement;
  var LANGS = { he: 'rtl', en: 'ltr' };

  function fromHash() {
    var h = location.hash.slice(1);
    return LANGS[h] ? h : null;
  }
  function saved() {
    try { var s = localStorage.getItem('lang'); return LANGS[s] ? s : null; } catch (e) { return null; }
  }
  function apply(lang) {
    root.setAttribute('data-lang', lang);
    root.lang = lang;
    root.dir = LANGS[lang];
    var title = root.getAttribute('data-title-' + lang);
    if (title) document.title = title;
  }

  apply(fromHash() || saved() || 'he');

  document.addEventListener('click', function (e) {
    var link = e.target.closest('[data-set-lang]');
    if (!link) return;
    e.preventDefault();
    var lang = link.getAttribute('data-set-lang');
    apply(lang);
    try { localStorage.setItem('lang', lang); } catch (err) {}
    history.replaceState(null, '', location.pathname + location.search + '#' + lang);
    window.scrollTo(0, 0);
    var next = document.querySelector('[data-set-lang][data-l="' + lang + '"]');
    if (next) next.focus({ preventScroll: true });
  });

  window.addEventListener('hashchange', function () {
    var lang = fromHash();
    if (lang) apply(lang);
  });
})();
