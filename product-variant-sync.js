(() => {
  'use strict';

  if(window.__PURE20_PRODUCT_VARIANT_SYNC_V1__)return;
  window.__PURE20_PRODUCT_VARIANT_SYNC_V1__=true;

  const $=id=>document.getElementById(id);
  let variants=new Map();
  let compound=null;
  let currencySymbol='€';
  let syncTimer=null;

  function lang(){
    return localStorage.getItem('pure20_language')==='en'?'en':'nl';
  }

  function esc(v){
    return String(v??'').replace(/[&<>"']/g,ch=>({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
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

  function slug(){
    const q=new URLSearchParams(location.search).get('slug');
    if(q)return q;
    const m=location.pathname.match(/^\/product\/([^/?#]+)/i);
    return m?decodeURIComponent(m[1]):'';
  }

  async function waitForConfig(){
    for(let i=0;i<160;i++){
      const cfg=window.PURE20_SUPABASE_CONFIG;
      if(cfg?.url&&cfg?.key&&$('variantButtons')&&$('selectedPrice')&&$('productImageWrap')){
        return cfg;
      }
      await new Promise(r=>setTimeout(r,50));
    }
    return null;
  }

  async function rest(cfg,path){
    const base=String(cfg.url||'').replace(/\/+$/,'');
    const response=await fetch(base+'/rest/v1/'+path,{
      method:'GET',
      cache:'no-store',
      headers:{
        apikey:cfg.key,
        Accept:'application/json'
      }
    });
    if(!response.ok)throw new Error(`REST ${response.status}`);
    return response.json();
  }

  function currentVariantId(){
    return $('variantButtons')?.querySelector('.p20-variant-button.active')?.dataset.id
      || new URLSearchParams(location.search).get('variant')
      || '';
  }

  function money(value){
    return `${currencySymbol}${Number(value||0).toFixed(2)}`;
  }

  function pricePending(){
    return lang()==='en'?'Price pending':'Prijs volgt';
  }

  function fallbackHtml(){
    const category=compound?.category||'PRODUCT';
    const name=(lang()==='en'?compound?.display_name_en:compound?.display_name_nl)
      || compound?.product_name
      || 'PURE20';
    return `<div class="p20-product-fallback">
      <div class="p20-product-fallback-top">PURE20 / ${esc(category)}</div>
      <div class="p20-product-fallback-vial" aria-hidden="true"></div>
      <div class="p20-product-fallback-name">${esc(name)}</div>
    </div>`;
  }

  function syncSelected(){
    const id=String(currentVariantId()||'');
    const row=variants.get(id);
    if(!row)return;

    const price=Number(row.price_eur||0);
    const priceEl=$('selectedPrice');
    if(priceEl){
      priceEl.textContent=price>0?money(price):pricePending();
      priceEl.dataset.variantPriceId=id;
    }

    const codeEl=$('selectedCode');
    if(codeEl)codeEl.textContent=row.code||'';

    const detailVariant=$('detailVariant');
    if(detailVariant)detailVariant.textContent=String(row.variant||row.code||'');

    const detailUnit=$('detailUnit');
    if(detailUnit)detailUnit.textContent=row.unit||'vial';

    const add=$('addToCart');
    if(add)add.disabled=price<=0;

    const imageWrap=$('productImageWrap');
    if(imageWrap){
      const variantUrl=safeUrl(row.image_url);
      const coverUrl=safeUrl(compound?.image_url);
      const url=variantUrl||coverUrl;

      if(url){
        const altNl=row.image_alt_nl
          || compound?.image_alt_nl
          || `${compound?.product_name||''} ${row.variant||''}`.trim();
        const altEn=row.image_alt_en
          || compound?.image_alt_en
          || altNl;

        imageWrap.innerHTML=`<img src="${esc(url)}" alt="${esc(lang()==='en'?altEn:altNl)}">`;
      }else{
        imageWrap.innerHTML=fallbackHtml();
      }

      imageWrap.dataset.variantImageId=id;
    }
  }

  function scheduleSync(){
    clearTimeout(syncTimer);
    syncTimer=setTimeout(syncSelected,30);
  }

  async function load(){
    const cfg=await waitForConfig();
    if(!cfg)return;

    const currentSlug=slug();
    if(!currentSlug)return;

    try{
      const compoundRows=await rest(
        cfg,
        'pure20_compounds?select=slug,product_name,category,image_url,image_alt_nl,image_alt_en,display_name_nl,display_name_en&active=eq.true&slug=eq.'
        + encodeURIComponent(currentSlug)
      );

      compound=Array.isArray(compoundRows)?compoundRows[0]:null;
      if(!compound?.product_name)return;

      const [variantRows,settingsRows]=await Promise.all([
        rest(
          cfg,
          'pure20_products?select=id,product_name,variant,code,unit,price_eur,stock,active,coa_url,image_url,image_alt_nl,image_alt_en&active=eq.true&product_name=eq.'
          + encodeURIComponent(compound.product_name)
        ),
        rest(cfg,'pure20_settings?select=data&id=eq.store')
      ]);

      variants=new Map(
        (variantRows||[]).map(v=>[String(v.id),v])
      );

      const settings=Array.isArray(settingsRows)?settingsRows[0]?.data:null;
      currencySymbol=String(settings?.currencySymbol||'€');

      syncSelected();

      const buttons=$('variantButtons');
      if(buttons){
        buttons.addEventListener('click',()=>{
          requestAnimationFrame(()=>requestAnimationFrame(syncSelected));
        });

        const observer=new MutationObserver(scheduleSync);
        observer.observe(buttons,{
          childList:true,
          subtree:true,
          attributes:true,
          attributeFilter:['class','aria-pressed']
        });
      }

      window.addEventListener('pure20:languagechange',scheduleSync);
      window.addEventListener('popstate',scheduleSync);

      [100,300,700].forEach(ms=>setTimeout(syncSelected,ms));
    }catch(err){
      console.warn('PURE20 product variant sync:',err);
    }
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',load,{once:true});
  }else{
    load();
  }
})();