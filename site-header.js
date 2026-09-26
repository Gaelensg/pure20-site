(() => {
  if (window.__PURE20_UNIVERSAL_HEADER__) return;
  window.__PURE20_UNIVERSAL_HEADER__ = true;

  const THEME_ID = 'pure20SiteTheme';
  if (!document.getElementById(THEME_ID)) {
    const link = document.createElement('link');
    link.id = THEME_ID;
    link.rel = 'stylesheet';
    link.href = '/site-theme.css';
    document.head.appendChild(link);
  }

  const path = location.pathname.replace(/\/+$/, '') || '/';
  const isPrivate = /^\/(admin|wholesale-admin|dashboard|portal)(\/|$)/i.test(path);

  const THEME_KEY = 'pure20_theme';

  function currentTheme() {
    return localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light';
  }

  function applyTheme(theme, button) {
    const next = theme === 'dark' ? 'dark' : 'light';
    document.documentElement.dataset.p20Theme = next;
    document.documentElement.style.colorScheme = next;
    localStorage.setItem(THEME_KEY, next);

    if (button) {
      const isDark = next === 'dark';
      button.innerHTML = icon(isDark ? 'moon' : 'sun');
      button.setAttribute(
        'aria-label',
        isDark
          ? 'Donkere modus actief. Schakel naar lichte modus.'
          : 'Lichte modus actief. Schakel naar donkere modus.'
      );
      button.title = isDark ? 'Donkere modus' : 'Lichte modus';
      button.setAttribute('aria-pressed', String(isDark));
    }

    window.dispatchEvent(new CustomEvent('pure20:themechange', {detail:{theme:next}}));
  }

  function makeThemeButton() {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'p20-icon-button p20-theme-toggle';
    button.dataset.p20ThemeToggle = '1';
    button.addEventListener('click', () => {
      applyTheme(currentTheme() === 'dark' ? 'light' : 'dark', button);
    });
    applyTheme(currentTheme(), button);
    return button;
  }

  if (!isPrivate) applyTheme(currentTheme());

  function isKnowledgePage() {
    if (path === '/knowledge' || path === '/knowledge.html') return true;
    const known = ['/','/shop','/calculator','/stack-builder','/wholesale','/account'];
    if (known.includes(path)) return false;
    if (path.endsWith('.html')) return true;
    return false;
  }

  function activeSection() {
    if (path === '/shop' || path === '/shop.html') return 'shop';
    if (path === '/calculator' || path === '/calculator.html') return 'calculator';
    if (path === '/stack-builder' || path === '/stack-builder.html') return 'stack';
    if (path === '/wholesale' || path === '/wholesale.html') return 'wholesale';
    if (isKnowledgePage()) return 'knowledge';
    return '';
  }

  function icon(type) {
    if (type === 'search') return '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.6"></circle><path d="M16 16l4.2 4.2"></path></svg>';
    if (type === 'account') return '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.2"></circle><path d="M5.5 19c.8-4 3-6 6.5-6s5.7 2 6.5 6"></path></svg>';
    if (type === 'cart') return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 5h2l1.7 9.2h9.7l2-6.5H7"></path><circle cx="9" cy="18.5" r="1"></circle><circle cx="17" cy="18.5" r="1"></circle></svg>';
    if (type === 'sun') return '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3.5"></circle><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M18.7 5.3l-1.4 1.4M6.7 17.3l-1.4 1.4"></path></svg>';
    if (type === 'moon') return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19.2 15.1A7.6 7.6 0 0 1 8.9 4.8 8 8 0 1 0 19.2 15.1z"></path></svg>';
    return '';
  }

  function makeIconLink(href, title, type) {
    const a = document.createElement('a');
    a.href = href;
    a.className = `p20-icon-button p20-${type}-link`;
    a.setAttribute('aria-label', title);
    a.title = title;
    a.innerHTML = icon(type);
    return a;
  }

  function normalizeHref(name) {
    const map = {
      shop:'/shop',
      knowledge:'/knowledge',
      calculator:'/calculator',
      stack:'/stack-builder',
      wholesale:'/wholesale'
    };
    return map[name];
  }

  function buildNav() {
    const nav = document.createElement('nav');
    nav.className = 'p20-header-nav header-nav';
    nav.setAttribute('aria-label','Main navigation');

    [
      ['shop','Shop'],
      ['knowledge','Knowledge'],
      ['calculator','Calculator'],
      ['stack','Stack Builder'],
      ['wholesale','Wholesale']
    ].forEach(([key,label]) => {
      const a = document.createElement('a');
      a.href = normalizeHref(key);
      a.textContent = label;
      a.dataset.p20Nav = key;
      if (activeSection() === key) a.setAttribute('aria-current','page');
      nav.appendChild(a);
    });
    return nav;
  }

  function moveLanguageControl(actions) {
    const candidates = [
      document.getElementById('pure20LangSwitch'),
      document.getElementById('langSwitch'),
      document.querySelector('.account-header .language'),
      document.querySelector('.pure20-lang-switch')
    ].filter(Boolean);

    const control = candidates[0];
    if (!control || control.closest('.p20-header-actions') === actions) return;
    control.classList.add('p20-language-control');
    actions.insertBefore(control, actions.firstChild);
  }

  function prepareExistingCart(actions) {
    const cart = document.getElementById('headerCart');
    if (!cart) return false;

    cart.classList.add('p20-icon-button','p20-cart-button');
    cart.setAttribute('aria-label','Open cart');
    cart.title = 'Cart';

    if (!cart.querySelector('svg')) {
      cart.insertAdjacentHTML('afterbegin', icon('cart'));
    }
    actions.appendChild(cart);
    return true;
  }

  function focusKnowledgeSearch() {
    const search = document.getElementById('peptide-search');
    if (search) {
      const tools = search.closest('.tools');
      if (tools) tools.hidden = false;
      search.scrollIntoView({behavior:'smooth',block:'center'});
      setTimeout(()=>search.focus(),250);
      return;
    }
    location.href = '/knowledge?focus=search';
  }

  function build() {
    if (isPrivate) return;

    const header =
      document.querySelector('.home-header') ||
      document.querySelector('.site-header') ||
      document.querySelector('.account-header') ||
      document.querySelector('body > header');

    if (!header || header.dataset.p20Universal === '1') return;
    header.dataset.p20Universal = '1';
    header.classList.add('p20-global-header','site-header');

    const inner =
      header.querySelector('.header-grid') ||
      header.querySelector('.header-inner') ||
      header.querySelector('.account-header-inner') ||
      header.querySelector('.shell.header') ||
      header.querySelector('.shell') ||
      header.firstElementChild;

    if (!inner) return;
    inner.classList.add('p20-header-shell','header-inner');

    const brand =
      inner.querySelector('.home-brand') ||
      inner.querySelector('.brand') ||
      header.querySelector('.home-brand') ||
      header.querySelector('.brand');

    if (!brand) return;
    brand.classList.add('p20-brand');
    brand.href = '/';

    const oldCart = document.getElementById('headerCart');
    const oldSignOut = document.getElementById('signOutBtn');
    const oldAccountEmail = document.getElementById('accountEmail');
    const existingLanguage =
      document.getElementById('pure20LangSwitch') ||
      document.getElementById('langSwitch') ||
      header.querySelector('.language') ||
      document.querySelector('.pure20-lang-switch');

    // Clear the original header shell only after keeping references to functional controls.
    while (inner.firstChild) inner.removeChild(inner.firstChild);

    const top = document.createElement('div');
    top.className = 'p20-header-top';

    const actions = document.createElement('div');
    actions.className = 'p20-header-actions header-controls';

    const searchBtn = document.createElement('button');
    searchBtn.type = 'button';
    searchBtn.className = 'p20-icon-button p20-search-button';
    searchBtn.setAttribute('aria-label','Search');
    searchBtn.title = 'Search';
    searchBtn.innerHTML = icon('search');
    searchBtn.addEventListener('click', focusKnowledgeSearch);

    const account = makeIconLink('/account','Account','account');
    const themeButton = makeThemeButton();

    top.appendChild(brand);
    actions.appendChild(themeButton);
    actions.appendChild(searchBtn);
    actions.appendChild(account);

    // Keep existing language controls functional by moving the same DOM node.
    if (existingLanguage) {
      existingLanguage.classList.add('p20-language-control');
      actions.insertBefore(existingLanguage, searchBtn);
    }

    // Reuse the existing shop/wholesale cart button so current JS event handlers keep working.
    if (oldCart) {
      oldCart.classList.add('p20-icon-button','p20-cart-button');
      oldCart.setAttribute('aria-label','Open cart');
      oldCart.title = 'Cart';
      if (!oldCart.querySelector('svg')) oldCart.insertAdjacentHTML('afterbegin', icon('cart'));
      actions.appendChild(oldCart);
    } else {
      actions.appendChild(makeIconLink('/shop#catalogueSection','Cart','cart'));
    }

    // Wholesale sign-out stays available but becomes a compact utility.
    if (oldSignOut) {
      oldSignOut.classList.add('p20-signout-button');
      oldSignOut.setAttribute('aria-label','Sign out');
      oldSignOut.title = 'Sign out';
      actions.appendChild(oldSignOut);
    }
    if (oldAccountEmail) oldAccountEmail.hidden = true;

    top.appendChild(actions);
    inner.appendChild(top);
    inner.appendChild(buildNav());

    // Language.js may inject its switch after this header is built.
    const observer = new MutationObserver(() => moveLanguageControl(actions));
    observer.observe(document.body,{childList:true,subtree:true});
    moveLanguageControl(actions);

    if (new URLSearchParams(location.search).get('focus') === 'search') {
      setTimeout(focusKnowledgeSearch,350);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', build, {once:true});
  } else {
    build();
  }
})();