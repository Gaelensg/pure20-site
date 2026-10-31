(function(){
  const root = document.documentElement;
  const key = 'pure20_lang_v1';
  const langButtons = [...document.querySelectorAll('[data-lang]')];
  const textNodes = [...document.querySelectorAll('[data-nl][data-en]')];

  function apply(lang) {
    root.lang = lang;
    document.body.dataset.lang = lang;
    localStorage.setItem(key, lang);
    textNodes.forEach(el => {
      const value = el.getAttribute('data-' + lang);
      if (value != null) el.textContent = value;
    });
    langButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.lang === lang));
    window.dispatchEvent(new CustomEvent('pure20:languagechange', { detail: { language: lang } }));
  }

  langButtons.forEach(btn => btn.addEventListener('click', () => apply(btn.dataset.lang)));
  apply(localStorage.getItem(key) || 'nl');

  function loadScript(src, marker) {
    if (document.querySelector('script[' + marker + ']')) return;
    const script = document.createElement('script');
    script.src = src;
    script.setAttribute(marker, '1');
    document.body.appendChild(script);
  }

  loadScript('/site-header.js?v=20261101-3', 'data-pure20-universal-header');
  loadScript('/mobile-bottom-nav.js?v=20261101-1', 'data-pure20-bottom-navigation');
})();
