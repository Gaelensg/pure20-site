(() => {
  if (window.__PURE20_BOTTOM_NAV__) return;
  window.__PURE20_BOTTOM_NAV__ = true;

  const path = location.pathname.replace(/\\/+$/, '') || '/';
  const privatePath = /^\\/(admin|wholesale-admin|dashboard|portal|supplier-order)(\\/|$)/i.test(path);
  if (privatePath) return;

  // Apply the shared design system even on pages that do not use the shared header.
  if (!document.getElementById('pure20SiteTheme')) {
    const theme = document.createElement('link');
    theme.id = 'pure20SiteTheme';
    theme.rel = 'stylesheet';
    theme.href = '/site-theme.css?v=20261102-2';
    document.head.appendChild(theme);
  }

  const routes = [
    { key:'home', href:'/', nl:'Home', en:'Home', icon:'<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>' },
    { key:'shop', href:'/shop', nl:'Shop', en:'Shop', icon:'<path d="M3 9.5h18l-1.5 11h-15L3 9.5Z"/><path d="M7 9.5 9 3h6l2 6.5M9 13v4M15 13v4"/>' },
    { key:'box', href:'/build-a-box', nl:'Box', en:'Build', icon:'<path d="M4 7.5 12 3l8 4.5v9L12 21l-8-4.5v-9Z"/><path d="m4.5 7.8 7.5 4.4 7.5-4.4M12 12.2V21"/>' },
    { key:'calculator', href:'/calculator', nl:'Rekenen', en:'Calc', icon:'<rect x="5" y="2.5" width="14" height="19" rx="2"/><path d="M8 6h8M8 11h2M14 11h2M8 15h2M14 15h2M8 18.5h2M14 18.5h2"/>' }
  ];

  const lang = () => (localStorage.getItem('pure20_lang_v1') === 'en' || localStorage.getItem('pure20_language') === 'en') ? 'en' : 'nl';
  const active = () => {
    if (path === '/') return 'home';
    if (path === '/shop' || path === '/shop.html' || path.startsWith('/product')) return 'shop';
    if (path.startsWith('/build-a-box')) return 'box';
    if (path.startsWith('/calculator')) return 'calculator';
    return '';
  };
  const copy = {
    nl:{more:'Meer',menu:'Navigatie',stack:'Stack Builder',wholesale:'Groothandel',account:'Mijn account',faq:'Veelgestelde vragen',knowledge:'Kennisbank',close:'Sluiten'},
    en:{more:'More',menu:'Navigation',stack:'Stack Builder',wholesale:'Wholesale',account:'My account',faq:'FAQ',knowledge:'Knowledge',close:'Close'}
  };
  const t = key => copy[lang()][key] || key;

  const style = document.createElement('style');
  style.id = 'pure20BottomNavStyles';
  style.textContent = `
    .p20-bottom-nav{position:fixed!important;left:10px!important;right:10px!important;bottom:calc(8px + env(safe-area-inset-bottom,0px))!important;z-index:105!important;display:grid!important;grid-template-columns:repeat(5,minmax(0,1fr))!important;align-items:stretch!important;min-height:66px!important;padding:7px 5px!important;border:1px solid rgba(197,206,224,.18)!important;border-radius:18px!important;background:rgba(25,28,31,.97)!important;box-shadow:0 12px 36px rgba(0,0,0,.38)!important;backdrop-filter:blur(18px)!important;-webkit-backdrop-filter:blur(18px)!important}
    .p20-bottom-nav a,.p20-bottom-nav button{min-width:0!important;display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;gap:4px!important;padding:3px 1px!important;border:0!important;border-radius:12px!important;background:transparent!important;color:#aeb6c4!important;text-decoration:none!important;font:500 9px/1.1 "JetBrains Mono",monospace!important;letter-spacing:-.02em!important;-webkit-tap-highlight-color:transparent!important}
    .p20-bottom-nav a[aria-current=page]{background:rgba(197,206,224,.13)!important;color:#e5eaf3!important}
    .p20-bottom-nav svg{width:20px!important;height:20px!important;fill:none!important;stroke:currentColor!important;stroke-width:1.65!important;stroke-linecap:round!important;stroke-linejoin:round!important}
    body.p20-has-bottom-nav{padding-bottom:calc(94px + env(safe-area-inset-bottom,0px))!important}
    .p20-mobile-menu-backdrop{position:fixed;inset:0;z-index:119;background:rgba(0,0,0,.58);opacity:0;pointer-events:none;transition:opacity .22s}
    .p20-mobile-menu-backdrop.open{opacity:1;pointer-events:auto}
    .p20-mobile-menu{position:fixed;left:10px;right:10px;bottom:calc(84px + env(safe-area-inset-bottom,0px));z-index:120;padding:18px;border:1px solid #383e44;border-radius:18px;background:#202326;color:#f2f2f4;box-shadow:0 16px 42px rgba(0,0,0,.4);transform:translateY(12px);opacity:0;pointer-events:none;transition:transform .22s,opacity .22s}
    .p20-mobile-menu.open{transform:translateY(0);opacity:1;pointer-events:auto}
    .p20-mobile-menu-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;font:600 10px "JetBrains Mono",monospace;letter-spacing:.12em;text-transform:uppercase;color:#aeb6c4}
    .p20-mobile-menu a{display:flex;align-items:center;min-height:48px;padding:0 4px;border-top:1px solid #383e44;color:#f2f2f4;text-decoration:none;font:500 12px "JetBrains Mono",monospace}
    .p20-mobile-menu button{border:0;background:transparent;color:#f2f2f4;font:500 10px "JetBrains Mono",monospace}
    @media(min-width:769px) and (pointer:fine){.p20-bottom-nav,.p20-mobile-menu,.p20-mobile-menu-backdrop{display:none!important}body.p20-has-bottom-nav{padding-bottom:initial!important}}
  `;
  document.head.appendChild(style);

  function render(){
    if(document.querySelector('.p20-bottom-nav')) return;
    const nav=document.createElement('nav');
    nav.className='p20-bottom-nav';
    nav.setAttribute('aria-label','PURE20 mobile navigation');
    nav.innerHTML=routes.map(item=>'<a href="'+item.href+'" '+(active()===item.key?'aria-current="page"':'')+'><svg viewBox="0 0 24 24" aria-hidden="true">'+item.icon+'</svg><span>'+ (lang()==='en'?item.en:item.nl) +'</span></a>').join('')+
      '<button type="button" class="p20-bottom-more" aria-expanded="false"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg><span>'+t('more')+'</span></button>';
    const backdrop=document.createElement('div');
    backdrop.className='p20-mobile-menu-backdrop';
    const menu=document.createElement('aside');
    menu.className='p20-mobile-menu';
    menu.setAttribute('aria-hidden','true');
    menu.innerHTML='<div class="p20-mobile-menu-head"><span>PURE20 / '+t('menu')+'</span><button type="button">'+t('close')+'</button></div>'+
      '<a href="/stack-builder">'+t('stack')+'</a><a href="/knowledge">'+t('knowledge')+'</a><a href="/wholesale">'+t('wholesale')+'</a><a href="/account">'+t('account')+'</a><a href="/faq">'+t('faq')+'</a>';
    const toggle=()=>{const open=!menu.classList.contains('open');menu.classList.toggle('open',open);backdrop.classList.toggle('open',open);menu.setAttribute('aria-hidden',String(!open));nav.querySelector('.p20-bottom-more').setAttribute('aria-expanded',String(open));};
    nav.querySelector('.p20-bottom-more').addEventListener('click',toggle);
    backdrop.addEventListener('click',toggle);
    menu.querySelector('button').addEventListener('click',toggle);
    menu.querySelectorAll('a').forEach(a=>a.addEventListener('click',toggle));
    document.body.append(nav,backdrop,menu);
    document.body.classList.add('p20-has-bottom-nav');
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',render,{once:true}); else render();
})();