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

  /* First-visit 18+ / research-use gate */
  if (!document.querySelector('script[data-pure20-access-gate]')) {
    const gate = document.createElement('script');
    gate.src = '/site-gate.js';
    gate.dataset.pure20AccessGate = '1';
    document.head.appendChild(gate);
  }

  const path = location.pathname.replace(/\/+$/, '') || '/';
  const isPrivate = /^\/(admin|wholesale-admin|dashboard|portal|supplier-order)(\/|$)/i.test(path);
  const THEME_KEY = 'pure20_theme';

  const ROUTES = [
    {key:'shop', href:'/shop'},
    {key:'box', href:'/build-a-box'},
    {key:'knowledge', href:'/knowledge'},
    {key:'calculator', href:'/calculator'},
    {key:'stack', href:'/stack-builder'},
    {key:'wholesale', href:'/wholesale'}
  ];

  const COPY = {
    nl: {
      menu:'MENU',
      close:'Sluiten',
      nav:'Navigatie',
      shop:'Shop',
      box:'Stel je box samen',
      knowledge:'Kennisbank',
      calculator:'Calculator',
      stack:'Stack Builder',
      wholesale:'Groothandel',
      search:'Zoeken in kennisbank',
      account:'Mijn account',
      themeLight:'Lichte modus',
      themeDark:'Donkere modus'
    },
    en: {
      menu:'MENU',
      close:'Close',
      nav:'Navigation',
      shop:'Shop',
      box:'Build a Box',
      knowledge:'Knowledge',
      calculator:'Calculator',
      stack:'Stack Builder',
      wholesale:'Wholesale',
      search:'Search knowledge',
      account:'My account',
      themeLight:'Light mode',
      themeDark:'Dark mode'
    }
  };

  function language(){
    return localStorage.getItem('pure20_language') === 'en' ? 'en' : 'nl';
  }
  function t(key){ return COPY[language()][key] || key; }

  function currentTheme() {
    return localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light';
  }

  function icon(type) {
    if (type === 'search') return '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.6"></circle><path d="M16 16l4.2 4.2"></path></svg>';
    if (type === 'account') return '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.2"></circle><path d="M5.5 19c.8-4 3-6 6.5-6s5.7 2 6.5 6"></path></svg>';
    if (type === 'cart') return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 5h2l1.7 9.2h9.7l2-6.5H7"></path><circle cx="9" cy="18.5" r="1"></circle><circle cx="17" cy="18.5" r="1"></circle></svg>';
    if (type === 'sun') return '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3.5"></circle><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M18.7 5.3l-1.4 1.4M6.7 17.3l-1.4 1.4"></path></svg>';
    if (type === 'moon') return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19.2 15.1A7.6 7.6 0 0 1 8.9 4.8 8 8 0 1 0 19.2 15.1z"></path></svg>';
    if (type === 'menu') return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7.5h16M4 12h16M4 16.5h16"></path></svg>';
    if (type === 'close') return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19"></path></svg>';
    if (type === 'arrow') return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M14 7l5 5-5 5"></path></svg>';
    return '';
  }

  function applyTheme(theme, button) {
    const next = theme === 'dark' ? 'dark' : 'light';
    document.documentElement.dataset.p20Theme = next;
    document.documentElement.style.colorScheme = next;
    localStorage.setItem(THEME_KEY, next);

    if (button) {
      const isDark = next === 'dark';
      button.innerHTML = icon(isDark ? 'moon' : 'sun');
      button.setAttribute('aria-label', isDark ? t('themeDark') : t('themeLight'));
      button.title = isDark ? t('themeDark') : t('themeLight');
      button.setAttribute('aria-pressed', String(isDark));
    }
    window.dispatchEvent(new CustomEvent('pure20:themechange', {detail:{theme:next}}));
  }

  function makeThemeButton() {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'p20-icon-button p20-theme-toggle';
    button.dataset.p20ThemeToggle = '1';
    button.addEventListener('click', () => applyTheme(currentTheme() === 'dark' ? 'light' : 'dark', button));
    applyTheme(currentTheme(), button);
    return button;
  }

  if (!isPrivate) applyTheme(currentTheme());

  function isKnowledgePage() {
    if (path === '/knowledge' || path === '/knowledge.html') return true;
    const known = ['/', '/shop', '/shop.html', '/build-a-box', '/build-a-box.html', '/calculator', '/calculator.html', '/stack-builder', '/stack-builder.html', '/wholesale', '/wholesale.html', '/account', '/account.html'];
    if (known.includes(path)) return false;
    if (path.endsWith('.html')) return true;
    return false;
  }

  function activeSection() {
    if (path === '/shop' || path === '/shop.html') return 'shop';
    if (path === '/build-a-box' || path === '/build-a-box.html') return 'box';
    if (path === '/calculator' || path === '/calculator.html') return 'calculator';
    if (path === '/stack-builder' || path === '/stack-builder.html') return 'stack';
    if (path === '/wholesale' || path === '/wholesale.html') return 'wholesale';
    if (isKnowledgePage()) return 'knowledge';
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

  function focusKnowledgeSearch() {
    closeMenu();
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

  let menuPanel = null;
  let menuBackdrop = null;
  let menuButton = null;
  let themeButton = null;
  let languageHost = null;

  function openMenu(){
    if (!menuPanel || !menuBackdrop || !menuButton) return;
    menuPanel.classList.add('open');
    menuBackdrop.classList.add('open');
    menuPanel.setAttribute('aria-hidden','false');
    menuButton.setAttribute('aria-expanded','true');
    document.body.classList.add('p20-menu-open');
    const close = menuPanel.querySelector('.p20-menu-close');
    setTimeout(()=>close?.focus(), 30);
  }

  function closeMenu(){
    if (!menuPanel || !menuBackdrop || !menuButton) return;
    menuPanel.classList.remove('open');
    menuBackdrop.classList.remove('open');
    menuPanel.setAttribute('aria-hidden','true');
    menuButton.setAttribute('aria-expanded','false');
    document.body.classList.remove('p20-menu-open');
  }

  function updateMenuLanguage(){
    if (!menuPanel) return;
    menuPanel.querySelector('[data-menu-kicker]').textContent = `PURE20 / ${t('nav').toUpperCase()}`;
    menuPanel.querySelector('.p20-menu-close').setAttribute('aria-label',t('close'));
    menuPanel.querySelector('.p20-menu-close').title = t('close');

    ROUTES.forEach(route=>{
      const link = menuPanel.querySelector(`[data-menu-route="${route.key}"]`);
      if (link) link.querySelector('.p20-menu-link-label').textContent = t(route.key);
    });

    const search = menuPanel.querySelector('[data-menu-search]');
    if (search) search.querySelector('span').textContent=t('search');
    const account = menuPanel.querySelector('[data-menu-account]');
    if (account) account.querySelector('span').textContent=t('account');

    if (menuButton) {
      menuButton.querySelector('.p20-menu-button-label').textContent=t('menu');
      menuButton.setAttribute('aria-label',t('menu'));
    }
    if (themeButton) applyTheme(currentTheme(), themeButton);
  }

  function buildMenu(){
    menuBackdrop=document.createElement('div');
    menuBackdrop.className='p20-menu-backdrop';
    menuBackdrop.addEventListener('click',closeMenu);

    menuPanel=document.createElement('aside');
    menuPanel.id='p20MainMenu';
    menuPanel.className='p20-menu-panel';
    menuPanel.setAttribute('aria-hidden','true');
    menuPanel.setAttribute('aria-label','PURE20 menu');

    const links=ROUTES.map((route,index)=>{
      const active=activeSection()===route.key;
      return `<a href="${route.href}" class="p20-menu-link" data-menu-route="${route.key}" ${active?'aria-current="page"':''}>
        <span class="p20-menu-index">${String(index+1).padStart(2,'0')}</span>
        <span class="p20-menu-link-label">${t(route.key)}</span>
        <span class="p20-menu-arrow">${icon('arrow')}</span>
      </a>`;
    }).join('');

    menuPanel.innerHTML=`
      <div class="p20-menu-head">
        <span class="p20-menu-kicker" data-menu-kicker>PURE20 / ${t('nav').toUpperCase()}</span>
        <button class="p20-icon-button p20-menu-close" type="button" aria-label="${t('close')}" title="${t('close')}">${icon('close')}</button>
      </div>
      <nav class="p20-menu-nav" aria-label="${t('nav')}">${links}</nav>
      <div class="p20-menu-utilities">
        <button class="p20-menu-utility" type="button" data-menu-search>${icon('search')}<span>${t('search')}</span></button>
        <a class="p20-menu-utility" href="/account" data-menu-account>${icon('account')}<span>${t('account')}</span></a>
      </div>
      <div class="p20-menu-footer">
        <div class="p20-menu-language" data-menu-language></div>
        <span class="p20-menu-footnote">PURE20.</span>
      </div>`;

    document.body.append(menuBackdrop,menuPanel);
    menuPanel.querySelector('.p20-menu-close').addEventListener('click',closeMenu);
    menuPanel.querySelector('[data-menu-search]').addEventListener('click',focusKnowledgeSearch);
    menuPanel.querySelectorAll('.p20-menu-link,.p20-menu-utility[href]').forEach(a=>a.addEventListener('click',closeMenu));
    languageHost=menuPanel.querySelector('[data-menu-language]');
  }

  function moveLanguageControl(){
    if (!languageHost) return;
    const candidates=[
      document.getElementById('pure20LangSwitch'),
      document.getElementById('langSwitch'),
      document.querySelector('.pure20-lang-switch')
    ].filter(Boolean);
    const control=candidates[0];
    if (!control || control.closest('.p20-menu-language')===languageHost) return;
    control.classList.add('p20-language-control');
    languageHost.appendChild(control);
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

    while (inner.firstChild) inner.removeChild(inner.firstChild);

    const top=document.createElement('div');
    top.className='p20-header-top';

    const actions=document.createElement('div');
    actions.className='p20-header-actions header-controls';

    themeButton=makeThemeButton();
    const account=makeIconLink('/account',t('account'),'account');

    menuButton=document.createElement('button');
    menuButton.type='button';
    menuButton.className='p20-menu-button';
    menuButton.setAttribute('aria-controls','p20MainMenu');
    menuButton.setAttribute('aria-expanded','false');
    menuButton.setAttribute('aria-label',t('menu'));
    menuButton.innerHTML=`<span class="p20-menu-button-icon">${icon('menu')}</span><span class="p20-menu-button-label">${t('menu')}</span>`;
    menuButton.addEventListener('click',()=>{
      if(menuPanel?.classList.contains('open')) closeMenu(); else openMenu();
    });

    top.appendChild(brand);
    actions.appendChild(themeButton);
    actions.appendChild(account);

    if (oldCart) {
      oldCart.classList.add('p20-icon-button','p20-cart-button');
      oldCart.setAttribute('aria-label','Cart');
      oldCart.title='Cart';
      if (!oldCart.querySelector('svg')) oldCart.insertAdjacentHTML('afterbegin',icon('cart'));
      actions.appendChild(oldCart);
    } else {
      actions.appendChild(makeIconLink('/shop#catalogueSection','Cart','cart'));
    }

    if (oldSignOut) {
      oldSignOut.classList.add('p20-signout-button');
      oldSignOut.setAttribute('aria-label','Sign out');
      oldSignOut.title='Sign out';
      actions.appendChild(oldSignOut);
    }
    if (oldAccountEmail) oldAccountEmail.hidden=true;

    actions.appendChild(menuButton);
    top.appendChild(actions);
    inner.appendChild(top);

    buildMenu();

    if(existingLanguage){
      existingLanguage.classList.add('p20-language-control');
      languageHost?.appendChild(existingLanguage);
    }

    const observer=new MutationObserver(moveLanguageControl);
    observer.observe(document.body,{childList:true,subtree:true});
    moveLanguageControl();

    document.addEventListener('keydown',e=>{
      if(e.key==='Escape'&&menuPanel?.classList.contains('open')){
        closeMenu();
        menuButton?.focus();
      }
    });

    window.addEventListener('pure20:languagechange',()=>{
      updateMenuLanguage();
      moveLanguageControl();
    });

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
