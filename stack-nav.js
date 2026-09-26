(() => {
  if (window.__PURE20_STACK_NAV__) return;
  window.__PURE20_STACK_NAV__ = true;

  const path = location.pathname.replace(/\/+$/, '') || '/';
  if (/^\/(admin|wholesale-admin|dashboard|portal)(\/|$)/i.test(path)) return;

  function addStyle() {
    if (document.getElementById('pure20StackNavStyle')) return;
    const s = document.createElement('style');
    s.id = 'pure20StackNavStyle';
    s.textContent = `
      .pure20-stack-global-link{white-space:nowrap}
      .account-header-inner>.pure20-stack-global-link{
        justify-self:center;color:inherit;text-decoration:none;text-transform:uppercase;
        letter-spacing:.08em;font-size:10px;padding:8px 0;border-bottom:1px solid transparent
      }
      .account-header-inner>.pure20-stack-global-link[aria-current="page"]{border-bottom-color:currentColor}
      @media(max-width:850px){
        .header-nav,.home-nav,header nav{min-width:0}
      }
      @media(max-width:560px){
        .home-nav .pure20-stack-global-link{grid-column:1/-1}
        .account-header-inner>.pure20-stack-global-link{
          grid-area:stack;justify-self:start
        }
        .account-header-inner{
          grid-template-areas:"brand lang" "back back" "stack stack" !important
        }
      }
    `;
    document.head.appendChild(s);
  }

  function makeLink() {
    const a = document.createElement('a');
    a.href = '/stack-builder';
    a.textContent = 'Stack Builder';
    a.className = 'pure20-stack-global-link';
    if (path === '/stack-builder' || path === '/stack-builder.html') {
      a.setAttribute('aria-current','page');
    }
    return a;
  }

  function inject() {
    addStyle();

    const existing = document.querySelector(
      'a[href="/stack-builder"],a[href="/stack-builder.html"],a[href="stack-builder.html"]'
    );
    if (existing) {
      existing.classList.add('pure20-stack-global-link');
      if (path === '/stack-builder' || path === '/stack-builder.html') {
        existing.setAttribute('aria-current','page');
      }
      return;
    }

    const nav =
      document.querySelector('.home-nav') ||
      document.querySelector('.header-nav') ||
      document.querySelector('header nav');

    if (nav) {
      nav.appendChild(makeLink());
      return;
    }

    const accountHeader = document.querySelector('.account-header-inner');
    if (accountHeader) {
      const link = makeLink();
      const back = accountHeader.querySelector('.back-link');
      if (back) back.insertAdjacentElement('afterend', link);
      else accountHeader.appendChild(link);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inject, {once:true});
  } else {
    inject();
  }
})();