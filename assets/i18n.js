(function () {
  var I18N = window.I18N;
  var STORE_KEY = 'lang';
  var current = 'en';
  var copyButtons = Array.prototype.slice.call(document.querySelectorAll('.copy'));
  var toggle = document.getElementById('lang-toggle');
  var menu = document.getElementById('lang-menu');
  var currentLabel = document.getElementById('lang-current');
  var options = Array.prototype.slice.call(menu.querySelectorAll('li'));
  var meta = document.querySelector('meta[name="description"]');

  function pick() {
    var fromUrl = new URLSearchParams(location.search).get('lang');
    if (I18N[fromUrl]) return fromUrl;
    try { var saved = localStorage.getItem(STORE_KEY); if (I18N[saved]) return saved; } catch (e) {}
    var prefs = navigator.languages || [navigator.language || 'en'];
    for (var i = 0; i < prefs.length; i++) {
      var code = String(prefs[i]).toLowerCase().split('-')[0];
      if (I18N[code]) return code;
    }
    return 'en';
  }

  var COPY_TEXT = {
    idle: function (d) { return d.copy; },
    ok: function (d) { return d.copied; },
    fail: function (d) { return d.copy_fail || d.copy; }
  };

  function renderCopy(btn) {
    var d = I18N[current];
    var label = btn.querySelector('.copy-label') || btn.querySelector('#copy-label');
    var state = btn.getAttribute('data-copy-state') || 'idle';
    label.textContent = COPY_TEXT[state](d);
    label.style.minWidth = Math.max(d.copy.length, d.copied.length, (d.copy_fail || '').length) + 'ch';
    btn.classList.toggle('is-copied', state === 'ok');
    btn.classList.toggle('is-failed', state === 'fail');
  }

  function setCopyState(btn, state) {
    btn.setAttribute('data-copy-state', state);
    renderCopy(btn);
    clearTimeout(btn.copyTimer);
    if (state !== 'idle') {
      btn.copyTimer = setTimeout(function () { setCopyState(btn, 'idle'); }, 1800);
    }
  }

  function apply(lang) {
    var d = I18N[lang];
    current = lang;
    document.documentElement.lang = lang;
    document.title = d.title;
    meta.setAttribute('content', d.desc);
    document.querySelectorAll('[data-i18n]').forEach(function (el) { el.textContent = d[el.getAttribute('data-i18n')]; });
    document.querySelectorAll('[data-i18n-aria]').forEach(function (el) { el.setAttribute('aria-label', d[el.getAttribute('data-i18n-aria')]); });
    options.forEach(function (o) {
      var on = o.getAttribute('data-lang') === lang;
      o.setAttribute('aria-selected', String(on));
      if (on) { currentLabel.textContent = o.textContent; }
    });
    document.querySelectorAll('[data-keep-lang]').forEach(function (el) {
      el.setAttribute('href', el.getAttribute('data-keep-lang') + (lang === 'en' ? '' : '?lang=' + lang));
    });
    document.querySelectorAll('[data-i18n-href]').forEach(function (el) {
      var bodyKey = el.getAttribute('data-i18n-body');
      var body = bodyKey && d[bodyKey] ? '&body=' + encodeURIComponent(d[bodyKey]) : '';
      el.setAttribute('href', 'mailto:hello@rimovy.ch?subject=' + encodeURIComponent(d[el.getAttribute('data-i18n-href')]) + body);
    });
    copyButtons.forEach(renderCopy);
    document.documentElement.classList.remove('i18n-wait');
  }

  function choose(lang) {
    apply(lang);
    try { localStorage.setItem(STORE_KEY, lang); } catch (e) {}
    var url = new URL(location.href);
    if (lang === 'en') { url.searchParams.delete('lang'); } else { url.searchParams.set('lang', lang); }
    history.replaceState(null, '', url);
  }

  function focusOption(i) {
    var n = options.length;
    var o = options[(i + n) % n];
    options.forEach(function (x) { x.classList.toggle('is-active', x === o); });
    o.focus();
  }

  function openMenu() {
    menu.classList.add('is-open');
    toggle.setAttribute('aria-expanded', 'true');
    var selected = options.findIndex(function (o) { return o.getAttribute('aria-selected') === 'true'; });
    requestAnimationFrame(function () { focusOption(selected); });
  }

  function closeMenu(returnFocus) {
    menu.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    options.forEach(function (x) { x.classList.remove('is-active'); });
    if (returnFocus) { toggle.focus(); }
  }

  toggle.addEventListener('click', function () {
    if (menu.classList.contains('is-open')) { closeMenu(false); } else { openMenu(); }
  });
  options.forEach(function (o) {
    o.addEventListener('click', function () { choose(o.getAttribute('data-lang')); closeMenu(true); });
    o.addEventListener('mouseenter', function () { focusOption(options.indexOf(o)); });
  });
  var KEYS = {
    ArrowDown: function (i) { focusOption(i + 1); },
    ArrowUp: function (i) { focusOption(i - 1); },
    Home: function () { focusOption(0); },
    End: function () { focusOption(options.length - 1); },
    Enter: function (i) { selectAt(i); },
    ' ': function (i) { selectAt(i); },
    Escape: function () { closeMenu(true); },
    Tab: function () { closeMenu(false); }
  };
  function selectAt(i) {
    if (i < 0) { closeMenu(true); return; }
    choose(options[i].getAttribute('data-lang'));
    closeMenu(true);
  }
  menu.parentNode.addEventListener('keydown', function (e) {
    var isOpen = menu.classList.contains('is-open');
    if (!isOpen && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) { e.preventDefault(); openMenu(); return; }
    var handler = KEYS[e.key];
    if (!isOpen || !handler) { return; }
    if (e.key !== 'Tab') { e.preventDefault(); }
    handler(options.indexOf(document.activeElement));
  });
  document.addEventListener('click', function (e) {
    if (!e.target.closest('.lang')) { closeMenu(false); }
  });

  copyButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      function ok() { setCopyState(btn, 'ok'); }
      function fail() { setCopyState(btn, 'fail'); }
      if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText('hello@rimovy.ch').then(ok, fail); } else { fail(); }
    });
  });

  apply(pick());
})();
