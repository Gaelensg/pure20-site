(() => {
  'use strict';

  // Prevent duplicate boot if an older dynamic loader also tries to load this file.
  if(window.__PURE20_SHOP_THUMBNAILS_V4__)return;
  window.__PURE20_SHOP_THUMBNAILS_V4__=true;

  const PATH=(location.pathname.replace(/\/+$/,'')||'/').toLowerCase();
  if(PATH!=='/shop'&&PATH!=='/shop.html')return;

  let products=[];
  let observer=null;
  let decorateTimer=null;

  function safe(value){
    return String(value??'').replace(/[&<>"']/g,ch=>({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'
    }[ch]));
  }

  function safeUrl(value){
    const raw=String(value||'').trim();
    if(!raw)return'';
    try{
      const u=new URL(raw,location.href);
      return (u.protocol==='https:'||u.protocol==='http:')?u.href:'';
    }catch(_){
      return'';
    }
  }

  function ensureStyles(){
    if(document.getElementById('p20ThumbV4Styles'))return;

    const style=document.createElement('style');
    style.id='p20ThumbV4Styles';
    style.textContent=`
      .p20-catalogue-thumb,
      .p20-catalogue-thumb-spacer{
        display:block!important;
        width:58px!important;
        height:58px!important;
        flex:0 0 58px!important;
      }

      .p20-catalogue-thumb{
        overflow:hidden!important;
        border:1px solid var(--line,#d6d3cb)!important;
        background:transparent!important;
      }

      .p20-catalogue-thumb img{
        display:block!important;
        width:100%!important;
        height:100%!important;
        object-fit:cover!important;
      }

      .p20-catalogue-thumb-spacer{
        visibility:hidden!important;
        border:0!important;
      }

      html[data-p20-theme="dark"] .p20-catalogue-thumb{
        border-color:#303632!important;
      }

      @media(max-width:850px){
        .p20-catalogue-thumb,
        .p20-catalogue-thumb-spacer{
          width:50px!important;
          height:50px!important;
          flex-basis:50px!important;
        }
      }

      @media(max-width:520px){
        .p20-catalogue-thumb,
        .p20-catalogue-thumb-spacer{
          width:46px!important;
          height:46px!important;
          flex-basis:46px!important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  async function waitForConfig(){
    for(let i=0;i<200;i++){
      const cfg=window.PURE20_SUPABASE_CONFIG;
      if(cfg?.url&&cfg?.key&&document.getElementById('catalogue'))return cfg;
      await new Promise(r=>setTimeout(r,50));
    }
    return null;
  }

  async function loadProducts(cfg){
    const base=String(cfg.url||'').replace(/\/+$/,'');
    const endpoint=
      base+
      '/rest/v1/pure20_products'+
      '?select=id,product_name,image_url,sort_order,active'+
      '&active=eq.true'+
      '&order=sort_order.asc';

    const response=await fetch(endpoint,{
      method:'GET',
      cache:'no-store',
      headers:{
        apikey:cfg.key,
        Authorization:`Bearer ${cfg.key}`,
        Accept:'application/json'
      }
    });

    if(!response.ok){
      throw new Error(`Productfoto's konden niet worden gelezen (${response.status})`);
    }

    products=await response.json();
  }

  function firstImageMap(){
    const map=new Map();
    for(const p of products){
      const product=String(p.product_name||'');
      const url=safeUrl(p.image_url);
      if(product&&url&&!map.has(product)){
        map.set(product,url);
      }
    }
    return map;
  }

  function rowProductName(row){
    return row.querySelector('.product-name')?.textContent?.trim()||'';
  }

  function putAfterIndex(main,node){
    const index=main.querySelector('.product-index');
    if(index?.nextSibling){
      main.insertBefore(node,index.nextSibling);
    }else if(index){
      main.appendChild(node);
    }else{
      main.prepend(node);
    }
  }

  function decorate(){
    if(!products.length)return;

    const imageByProduct=firstImageMap();
    const seen=new Set();
    const rows=[...document.querySelectorAll('#catalogue .variant-row[data-id]')];

    for(const row of rows){
      const product=rowProductName(row);
      if(!product)continue;

      const url=imageByProduct.get(product)||'';
      const main=row.querySelector('.product-main');
      if(!main)continue;

      let slot=main.querySelector(':scope > .p20-catalogue-thumb, :scope > .p20-catalogue-thumb-spacer');

      // No uploaded photo for this peptide.
      if(!url){
        if(slot)slot.remove();
        continue;
      }

      const show=!seen.has(product);
      seen.add(product);

      if(show){
        if(!slot||!slot.classList.contains('p20-catalogue-thumb')){
          const fresh=document.createElement('span');
          fresh.className='p20-catalogue-thumb';
          if(slot)slot.replaceWith(fresh);
          else putAfterIndex(main,fresh);
          slot=fresh;
        }

        let img=slot.querySelector('img');
        if(!img){
          img=document.createElement('img');
          img.loading='eager';
          img.decoding='async';
          slot.appendChild(img);
        }

        img.src=url;
        img.alt=`${product} productfoto`;
      }else{
        if(!slot||!slot.classList.contains('p20-catalogue-thumb-spacer')){
          const spacer=document.createElement('span');
          spacer.className='p20-catalogue-thumb-spacer';
          spacer.setAttribute('aria-hidden','true');
          if(slot)slot.replaceWith(spacer);
          else putAfterIndex(main,spacer);
        }
      }
    }
  }

  function scheduleDecorate(){
    clearTimeout(decorateTimer);
    decorateTimer=setTimeout(decorate,80);
  }

  async function boot(){
    ensureStyles();

    const cfg=await waitForConfig();
    if(!cfg){
      console.warn('PURE20 thumbnails v4: config niet gevonden.');
      return;
    }

    try{
      await loadProducts(cfg);
    }catch(err){
      console.warn('PURE20 thumbnails v4:',err);
      return;
    }

    const catalogue=document.getElementById('catalogue');
    if(!catalogue)return;

    // If app.js already rendered, show immediately.
    decorate();

    // If app.js renders a moment later, catch that render and later filters/search rerenders.
    observer=new MutationObserver(scheduleDecorate);
    observer.observe(catalogue,{childList:true,subtree:true});

    // A few finite retries cover the async first shop render without polling forever.
    [150,400,900,1600].forEach(ms=>setTimeout(decorate,ms));
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',boot,{once:true});
  }else{
    boot();
  }
})();