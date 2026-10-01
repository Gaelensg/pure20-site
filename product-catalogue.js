(() => {
  'use strict';

  if(window.__PURE20_SHOP_THUMBNAILS_CSS_V5__)return;
  window.__PURE20_SHOP_THUMBNAILS_CSS_V5__=true;

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

  function installStyles(rows){
    const existing=document.getElementById('p20ThumbnailCssV5');
    if(existing)existing.remove();

    const rules=[];

    rules.push(`
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
    style.id='p20ThumbnailCssV5';
    style.textContent=rules.join('\n');
    document.head.appendChild(style);

    document.documentElement.dataset.p20ThumbV5='ready';
  }

  async function boot(){
    const cfg=await waitForConfig();
    if(!cfg){
      console.warn('PURE20 thumbnail v5: Supabase config niet gevonden.');
      return;
    }

    try{
      const rows=await fetchImages(cfg);
      installStyles(rows);
    }catch(err){
      console.warn('PURE20 thumbnail v5:',err);
    }
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',boot,{once:true});
  }else{
    boot();
  }
})();