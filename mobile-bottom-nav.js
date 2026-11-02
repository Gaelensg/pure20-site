(() => {
  if (window.__PURE20_BOTTOM_NAV__) return;
  window.__PURE20_BOTTOM_NAV__ = true;

  const path = location.pathname.replace(/\/+$/, '') || '/';
  const routes = [
    { key:'shop', href:'/shop', nl:'Shop', en:'Shop', icon:'<path d="M3 9.5h18l-1.5 11h-15L3 9.5Z"/><path d="M7 9.5 9 3h6l2 6.5M9 13v4M15 13v4"/>' },
    { key:'box', href:'/build-a-box', nl:'Box', en:'Build', icon:'<path d="M4 7.5 12 3l8 4.5v9L12 21l-8-4.5v-9Z"/><path d="m4.5 7.8 7.5 4.4 7.5-4.4M12 12.2V21M8 5.2l8 4.5"/>' },
    { key:'calculator', href:'/calculator', nl:'Rekenen', en:'Calc', icon:'<rect x="5" y="2.5" width="14" height="19" rx="2"/><path d="M8 6h8M8 11h2M14 11h2M8 15h2M14 15h2M8 18.5h2M14 18.5h2"/>' }
  ];

  const privatePath = /^\/(admin|wholesale-admin|dashboard|portal|supplier-order)(\/|$)/i.test(path);
  if (privatePath) return;

  function activeKey() {
    if (path === '/shop' || path === '/shop.html') return 'shop';
    if (path.startsWith('/build-a-box')) return 'box';
    if (path.startsWith('/calculator')) return 'calculator';
    return '';
  }

  function language() {
    return localStorage.getItem('pure20_lang_v1') === 'en' ||
      localStorage.getItem('pure20_language') === 'en' ? 'en' : 'nl';
  }

  const style = document.createElement('style');
  style.id = 'pure20BottomNavStyles';
  style.textContent = `
    .p20-bottom-nav {
      position: fixed !important;
      left: 12px !important;
      right: 12px !important;
      bottom: calc(9px + env(safe-area-inset-bottom, 0px)) !important;
      z-index: 105 !important;
      display: grid !important;
      grid-template-columns: repeat(4, minmax(0,1fr)) !important;
      align-items: stretch !important;
      min-height: 66px !important;
      padding: 7px 5px !important;
      border: 1px solid rgba(197,206,224,.18) !important;
      border-radius: 18px !important;
      background: rgba(25,28,31,.96) !important;
      box-shadow: 0 12px 36px rgba(0,0,0,.38) !important;
      backdrop-filter: blur(18px) !important;
      -webkit-backdrop-filter: blur(18px) !important;
    }
    .p20-bottom-nav a, .p20-bottom-nav button {
      min-width: 0 !important;
      display: flex !important;
      flex-direction: column !important;
      align-items: center !important;
      justify-content: center !important;
      gap: 4px !important;
      padding: 3px 1px !important;
      border: 0 !important;
      border-radius: 12px !important;
      background: transparent !important;
      color: #aeb6c4 !important;
      text-decoration: none !important;
      font: 500 9px/1.1 "JetBrains Mono", monospace !important;
      letter-spacing: -.02em !important;
      -webkit-tap-highlight-color: transparent !important;
    }
    .p20-bottom-nav a[aria-current="page"] {
      background: rgba(197,206,224,.13) !important;
      color: #e5eaf3 !important;
    }
    .p20-bottom-nav svg {
      width: 20px !important;
      height: 20px !important;
      fill: none !important;
      stroke: currentColor !important;
      stroke-width: 1.65 !important;
      stroke-linecap: round !important;
      stroke-linejoin: round !important;
    }
    .p20-bottom-nav .p20-bottom-more {
      cursor: pointer !important;
    }
    body.p20-has-bottom-nav {
      padding-bottom: calc(92px + env(safe-area-inset-bottom, 0px)) !important;
    }
    @media (min-width: 769px) {
      .p20-bottom-nav { display: none !important; }
      body.p20-has-bottom-nav { padding-bottom: initial !important; }
    }
  `;
  document.head.appendChild(style);

  function render() {
    if (document.querySelector('.p20-bottom-nav')) return;
    const nav = document.createElement('nav');
    nav.className = 'p20-bottom-nav';
    nav.setAttribute('aria-label', 'PURE20 mobile navigation');
    const active = activeKey();

    const links = routes.map(item => `
      <a href="${item.href}" ${active === item.key ? 'aria-current="page"' : ''}>
        <svg viewBox="0 0 24 24" aria-hidden="true">${item.icon}</svg>
        <span>${language() === 'en' ? item.en : item.nl}</span>
      </a>
    `).join('');

    nav.innerHTML = links + `
      <button type="button" class="p20-bottom-more" aria-label="${language() === 'en' ? 'More menu' : 'Meer menu'}">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
        <span>${language() === 'en' ? 'More' : 'Meer'}</span>
      </button>`;
    document.body.appendChild(nav);
    document.body.classList.add('p20-has-bottom-nav');

    nav.querySelector('.p20-bottom-more').addEventListener('click', () => {
      const menuButton = document.querySelector('.p20-menu-button');
      if (menuButton) menuButton.click();
      else {
        const panel = document.getElementById('p20MainMenu');
        if (panel) panel.classList.add('open');
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', render, { once:true });
  } else {
    render();
  }
})();
