(() => {
  'use strict';
  const path=(location.pathname.replace(/\/+$/,'')||'/').toLowerCase();

  function addLink(){
    document.querySelectorAll('.p20-header-nav, .header-nav').forEach(nav=>{
      if(nav.querySelector('[data-p20-build-box], a[href="/build-a-box"], a[href="/build-a-box.html"]')) return;
      const a=document.createElement('a');
      a.href='/build-a-box';
      a.textContent='Stel je box samen';
      a.dataset.p20BuildBox='1';
      if(path==='/build-a-box'||path==='/build-a-box.html')a.setAttribute('aria-current','page');
      const shop=nav.querySelector('[data-p20-nav="shop"], a[href="/shop"], a[href="/shop.html"]');
      if(shop&&shop.nextSibling)nav.insertBefore(a,shop.nextSibling);
      else if(shop)nav.appendChild(a);
      else nav.prepend(a);
    });
  }

  addLink();
  const observer=new MutationObserver(addLink);
  observer.observe(document.documentElement,{childList:true,subtree:true});
  setTimeout(addLink,100);
  setTimeout(addLink,500);
  setTimeout(()=>observer.disconnect(),4000);
})();
