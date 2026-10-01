(() => {
  'use strict';
  const PATH=(location.pathname.replace(/\/+$/,'')||'/').toLowerCase();
  if(PATH!=='/shop'&&PATH!=='/shop.html')return;

  const KEY='pure20_retail_cart_v1';
  let hydrated=false, hydrating=false, openHandled=false;

  function read(){
    try{const x=JSON.parse(localStorage.getItem(KEY)||'{}');return x&&typeof x==='object'?x:{}}catch(_){return{}}
  }
  function write(c){
    try{localStorage.setItem(KEY,JSON.stringify(c));window.dispatchEvent(new CustomEvent('pure20:retailcartchange',{detail:{cart:c}}))}catch(_){}
  }
  function set(id,q){
    if(!id)return;
    const c=read(),n=Math.max(0,Math.floor(Number(q)||0));
    if(n)c[id]=n;else delete c[id];
    write(c);
  }

  function row(id){return [...document.querySelectorAll('#catalogue .variant-row[data-id]')].find(x=>x.dataset.id===id)||null}

  async function hydrate(force=false){
    if(hydrating||(!force&&hydrated))return;
    const catalogue=document.getElementById('catalogue');
    if(!catalogue?.querySelector('.variant-row'))return;
    hydrating=true;
    const entries=Object.entries(read()).filter(([,q])=>Number(q)>0);

    for(const [id,qRaw] of entries){
      const r=row(id);if(!r)continue;
      const input=r.querySelector('.qty-control input');if(!input)continue;
      const max=Math.max(0,Number(input.max||99));
      const q=Math.max(0,Math.min(max,Math.floor(Number(qRaw)||0)));
      if(Number(input.value)!==q){
        input.value=String(q);
        input.dispatchEvent(new Event('change',{bubbles:true}));
        await new Promise(res=>requestAnimationFrame(res));
      }
    }
    hydrated=true;hydrating=false;
    maybeOpen();
  }

  function maybeOpen(){
    if(openHandled)return;
    if(new URLSearchParams(location.search).get('cart')!=='open')return;
    const button=document.getElementById('reviewOrder');
    if(!button)return;
    openHandled=true;
    setTimeout(()=>button.click(),120);
  }

  document.addEventListener('click',e=>{
    const clear=e.target.closest('#clearCart');
    if(clear){write({});return}

    const catBtn=e.target.closest('#catalogue [data-action]');
    if(catBtn){
      const r=catBtn.closest('.variant-row[data-id]'),input=r?.querySelector('.qty-control input');
      if(r&&input){
        const cur=Number(input.value||0),next=catBtn.dataset.action==='plus'?cur+1:cur-1;
        set(r.dataset.id,next);
      }
      return;
    }

    const drawerBtn=e.target.closest('#orderLines [data-drawer-action],#orderLines [data-da]');
    if(drawerBtn){
      const line=drawerBtn.closest('.order-line[data-id]');if(!line)return;
      const c=read(),cur=Number(c[line.dataset.id]||0);
      const action=drawerBtn.dataset.drawerAction||drawerBtn.dataset.da;
      set(line.dataset.id,action==='plus'?cur+1:cur-1);
    }
  },true);

  document.addEventListener('change',e=>{
    const input=e.target.closest('#catalogue .qty-control input');
    if(input){
      const r=input.closest('.variant-row[data-id]');
      if(r)set(r.dataset.id,input.value);
      return;
    }
    const drawer=e.target.closest('#orderLines .p20-cart-qty');
    if(drawer){
      const line=drawer.closest('.order-line[data-id]');
      if(line)set(line.dataset.id,drawer.value);
    }
  },true);

  const observer=new MutationObserver(()=>{
    if(!hydrated)hydrate();
    maybeOpen();
  });

  function init(){
    const catalogue=document.getElementById('catalogue');
    if(catalogue)observer.observe(catalogue,{childList:true,subtree:true});
    hydrate();
    window.addEventListener('pageshow',()=>{hydrated=false;hydrate(true)});
    window.addEventListener('storage',e=>{if(e.key===KEY){hydrated=false;hydrate(true)}});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
