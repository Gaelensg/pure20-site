(() => {
  const KEY = 'pure20_language';
  const buttons = [...document.querySelectorAll('#pure20LangSwitch [data-lang]')];
  const nodes = [...document.querySelectorAll('[data-nl][data-en]')];

  function getLanguage() {
    const saved = localStorage.getItem(KEY);
    return saved === 'en' ? 'en' : 'nl';
  }

  function apply(lang) {
    lang = lang === 'en' ? 'en' : 'nl';
    document.documentElement.lang = lang;
    localStorage.setItem(KEY, lang);

    nodes.forEach(node => {
      const text = node.dataset[lang];
      if (typeof text === 'string') node.textContent = text;
    });

    buttons.forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.lang === lang));
    });

    document.title = lang === 'nl'
      ? 'PURE20. — Onderzoek, helder georganiseerd.'
      : 'PURE20. — Research, clearly organized.';
  }

  buttons.forEach(button => {
    button.addEventListener('click', () => apply(button.dataset.lang));
  });

  apply(getLanguage());
})();


/* PURE20 global Stack Builder navigation */
(() => {
  if (document.querySelector('script[data-pure20-stack-nav]')) return;
  const s = document.createElement('script');
  s.src = '/stack-nav.js';
  s.dataset.pure20StackNav = '1';
  document.head.appendChild(s);
})();
