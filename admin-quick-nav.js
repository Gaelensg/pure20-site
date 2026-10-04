(() => {
  'use strict';

  if (window.__PURE20_ADMIN_QUICKNAV_V1__) return;
  window.__PURE20_ADMIN_QUICKNAV_V1__ = true;

  const normalizePath = value => {
    let p = String(value || '/').toLowerCase().replace(/\/+$/, '') || '/';
    if (p.endsWith('.html')) p = p.slice(0, -5) || '/';
    return p;
  };

  const current = normalizePath(location.pathname);

  const pages = [
    { path: '/portal', label: 'Command Center' },
    { path: '/admin', label: 'Retail Admin' },
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/wholesale-admin', label: 'Wholesale Admin' },
    { path: '/supplier-order', label: 'Supplier Hub' }
  ];

  if (!pages.some(page => page.path === current)) return;

  function installStyles() {
    if (document.getElementById('p20AdminQuickNavStyle')) return;

    const style = document.createElement('style');
    style.id = 'p20AdminQuickNavStyle';
    style.textContent = `
      .p20-admin-quicknav-shell{
        width:min(1320px,calc(100% - 40px));
        margin:14px auto 20px;
        position:relative;
        z-index:24;
      }
      .p20-admin-quicknav{
        display:grid;
        grid-template-columns:auto minmax(0,1fr);
        align-items:stretch;
        border:1px solid #bcb9b0;
        background:#f4f2ec;
        color:#111;
        box-shadow:0 5px 18px rgba(0,0,0,.035);
      }
      .p20-admin-quicknav-kicker{
        display:flex;
        align-items:center;
        padding:0 15px;
        border-right:1px solid #bcb9b0;
        font-family:inherit;
        font-size:8px;
        font-weight:700;
        letter-spacing:.16em;
        text-transform:uppercase;
        white-space:nowrap;
        color:#77746d;
      }
      .p20-admin-quicknav-scroll{
        min-width:0;
        display:flex;
        overflow-x:auto;
        overscroll-behavior-x:contain;
        scrollbar-width:none;
        -webkit-overflow-scrolling:touch;
      }
      .p20-admin-quicknav-scroll::-webkit-scrollbar{display:none}
      .p20-admin-quicknav a{
        flex:1 0 auto;
        min-height:43px;
        display:flex;
        align-items:center;
        justify-content:center;
        gap:7px;
        padding:0 15px;
        border-right:1px solid #d5d2ca;
        color:#111;
        text-decoration:none;
        font-family:inherit;
        font-size:9px;
        font-weight:650;
        letter-spacing:.075em;
        text-transform:uppercase;
        white-space:nowrap;
        transition:background .15s ease,color .15s ease;
      }
      .p20-admin-quicknav a:last-child{border-right:0}
      .p20-admin-quicknav a:hover,
      .p20-admin-quicknav a:focus-visible{
        background:#e7e4dc;
        outline:0;
      }
      .p20-admin-quicknav a[aria-current="page"]{
        background:#111;
        color:#f7f5ef;
        pointer-events:none;
      }
      .p20-admin-quicknav-arrow{
        font-size:12px;
        line-height:1;
        opacity:.7;
      }
      @media(max-width:720px){
        .p20-admin-quicknav-shell{
          width:calc(100% - 20px);
          margin:10px auto 16px;
        }
        .p20-admin-quicknav{
          grid-template-columns:1fr;
        }
        .p20-admin-quicknav-kicker{
          min-height:28px;
          padding:0 11px;
          border-right:0;
          border-bottom:1px solid #bcb9b0;
          font-size:7px;
        }
        .p20-admin-quicknav a{
          flex:0 0 auto;
          min-height:41px;
          padding:0 13px;
          font-size:8px;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function build() {
    if (document.getElementById('p20AdminQuickNav')) return;

    installStyles();

    const shell = document.createElement('div');
    shell.id = 'p20AdminQuickNav';
    shell.className = 'p20-admin-quicknav-shell';

    const nav = document.createElement('nav');
    nav.className = 'p20-admin-quicknav';
    nav.setAttribute('aria-label', 'PURE20 admin navigation');

    const kicker = document.createElement('div');
    kicker.className = 'p20-admin-quicknav-kicker';
    kicker.textContent = 'ADMIN NAV';

    const scroll = document.createElement('div');
    scroll.className = 'p20-admin-quicknav-scroll';

    pages.forEach(page => {
      const a = document.createElement('a');
      a.href = page.path;
      a.title = page.label;
      a.innerHTML = `<span>${page.label}</span><span class="p20-admin-quicknav-arrow">→</span>`;

      if (page.path === current) {
        a.setAttribute('aria-current', 'page');
        a.querySelector('.p20-admin-quicknav-arrow').textContent = '•';
      }

      scroll.appendChild(a);
    });

    nav.append(kicker, scroll);
    shell.appendChild(nav);

    const header = document.querySelector('header.admin-header, header');
    const main = document.querySelector('main');

    if (header && header.parentNode) {
      header.insertAdjacentElement('afterend', shell);
    } else if (main && main.parentNode) {
      main.parentNode.insertBefore(shell, main);
    } else {
      document.body.insertBefore(shell, document.body.firstChild);
    }

    requestAnimationFrame(() => {
      const active = scroll.querySelector('[aria-current="page"]');
      if (!active) return;
      scroll.scrollLeft = Math.max(0, active.offsetLeft - 12);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', build, { once:true });
  } else {
    build();
  }
})();