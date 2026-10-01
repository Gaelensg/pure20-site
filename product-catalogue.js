(() => {
  'use strict';

  if(window.__PURE20_SHOP_THUMBNAILS_CSS_V6__)return;
  window.__PURE20_SHOP_THUMBNAILS_CSS_V6__=true;

  let compoundSlugs=new Map();

  function cssString(value){
    return String(value ?? '')
      .replace(/\\/g,'\\\\')
      .replace(/"/g,'\\"')
      .replace(/\r?\n/g,' ');
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

  async function waitForConfig(){
    for(let i=0;i<160;i++){
      const cfg=window.PURE20_SUPABASE_CONFIG;
      if(cfg?.url&&cfg?.key)return cfg;
      await new Promise(r=>setTimeout(r,50));
    }
    return null;
  }

  async function fetchImages(cfg){
    const base=String(cfg.url||'').replace(/\/+$/,'');
    const url=
      base+
      '/rest/v1/pure20_products'+
      '?select=id,product_name,variant,image_url,active'+
      '&active=eq.true';

    const response=await fetch(url,{
      method:'GET',
      cache:'no-store',
      headers:{
        apikey:cfg.key,
        Accept:'application/json'
      }
    });

    if(!response.ok){
      throw new Error(`thumbnail query ${response.status}`);
    }

    return await response.json();
  }


  async function fetchCompoundSlugs(cfg){
    const base=String(cfg.url||'').replace(/\/+$/,'');
    const url=
      base+
      '/rest/v1/pure20_compounds'+
      '?select=product_name,slug,active'+
      '&active=eq.true';

    const response=await fetch(url,{
      method:'GET',
      cache:'no-store',
      headers:{
        apikey:cfg.key,
        Accept:'application/json'
      }
    });

    if(!response.ok){
      throw new Error(`compound slug query ${response.status}`);
    }

    const rows=await response.json();
    compoundSlugs=new Map(
      (rows||[])
        .filter(r=>r?.product_name&&r?.slug)
        .map(r=>[String(r.product_name),String(r.slug)])
    );
  }

  function productNameFromRow(row){
    return row.querySelector('.product-name')?.textContent?.trim()||'';
  }

  function productHref(row){
    const product=productNameFromRow(row);
    const slug=compoundSlugs.get(product);
    const id=String(row.dataset.id||'').trim();
    if(!slug)return'';
    return `/product?slug=${encodeURIComponent(slug)}${id?`&variant=${encodeURIComponent(id)}`:''}`;
  }

  function installNavigation(){
    const catalogue=document.getElementById('catalogue');
    if(!catalogue||catalogue.dataset.p20ProductNavV6==='1')return;
    catalogue.dataset.p20ProductNavV6='1';

    catalogue.addEventListener('click',event=>{
      if(event.target.closest('a,button,input,select,textarea,label'))return;

      const main=event.target.closest('.variant-row .product-main');
      if(!main)return;

      const row=main.closest('.variant-row[data-id]');
      if(!row)return;

      const href=productHref(row);
      if(href)location.href=href;
    });

    catalogue.addEventListener('keydown',event=>{
      if(event.key!=='Enter'&&event.key!==' ')return;

      const main=event.target.closest('.variant-row .product-main');
      if(!main)return;

      event.preventDefault();

      const row=main.closest('.variant-row[data-id]');
      if(!row)return;

      const href=productHref(row);
      if(href)location.href=href;
    });
  }

  function makeRowsAccessible(){
    document.querySelectorAll('#catalogue .variant-row .product-main').forEach(main=>{
      main.setAttribute('role','link');
      main.setAttribute('tabindex','0');
      main.setAttribute('aria-label','Open productpagina');
    });
  }

  function installStyles(rows){
    const existing=document.getElementById('p20ThumbnailCssV6');
    if(existing)existing.remove();

    const rules=[];

    rules.push(`
      #catalogue .variant-row .product-main{
        cursor:pointer;
      }

      #catalogue .variant-row .product-main:focus-visible{
        outline:2px solid currentColor;
        outline-offset:4px;
      }

      #catalogue .variant-row .product-main::before{
        box-sizing:border-box;
      }
    `);

    for(const row of rows||[]){
      const id=String(row.id||'').trim();
      const image=safeUrl(row.image_url);
      if(!id||!image)continue;

      const idEsc=cssString(id);
      const imageEsc=cssString(image);

      rules.push(`
        #catalogue .variant-row[data-id="${idEsc}"] .product-main::before{
          content:"";
          display:block;
          width:58px;
          height:58px;
          flex:0 0 58px;
          border:1px solid var(--line,#d6d3cb);
          background-image:url("${imageEsc}");
          background-size:cover;
          background-position:center;
          background-repeat:no-repeat;
        }
      `);
    }

    rules.push(`
      html[data-p20-theme="dark"] #catalogue .variant-row .product-main::before{
        border-color:#303632;
      }

      @media(max-width:850px){
        #catalogue .variant-row .product-main::before{
          width:50px!important;
          height:50px!important;
          flex-basis:50px!important;
        }
      }

      @media(max-width:520px){
        #catalogue .variant-row .product-main::before{
          width:46px!important;
          height:46px!important;
          flex-basis:46px!important;
        }
      }
    `);

    const style=document.createElement('style');
    style.id='p20ThumbnailCssV6';
    style.textContent=rules.join('\n');
    document.head.appendChild(style);

    document.documentElement.dataset.p20ThumbV6='ready';
  }

  async function boot(){
    const cfg=await waitForConfig();
    if(!cfg){
      console.warn('PURE20 thumbnail v6: Supabase config niet gevonden.');
      return;
    }

    try{
      const [rows]=await Promise.all([
        fetchImages(cfg),
        fetchCompoundSlugs(cfg)
      ]);
      installStyles(rows);
      installNavigation();
      makeRowsAccessible();

      const catalogue=document.getElementById('catalogue');
      if(catalogue){
        const observer=new MutationObserver(()=>makeRowsAccessible());
        observer.observe(catalogue,{childList:true,subtree:true});
      }
    }catch(err){
      console.warn('PURE20 thumbnail v6:',err);
    }
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',boot,{once:true});
  }else{
    boot();
  }
})();