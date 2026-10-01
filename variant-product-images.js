(() => {
  'use strict';

  const path=(location.pathname.replace(/\/+$/,'')||'/').toLowerCase();
  if(path!=='/product'&&path!=='/product.html')return;

  const $=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/[&<>"']/g,ch=>({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[ch]));
  const lang=()=>window.PURE20_I18N?.language || (localStorage.getItem('pure20_language')==='en'?'en':'nl');

  let compound=null;
  let variants=new Map();
  let observer=null;
  let lastVariantId='';

  function client(){return window.PURE20_API?.client}

  function safeUrl(value){
    const raw=String(value||'').trim();
    if(!raw)return'';
    try{
      const u=new URL(raw,location.href);
      return ['http:','https:'].includes(u.protocol)?u.href:'';
    }catch(_){return''}
  }

  function slugFromLocation(){
    return new URLSearchParams(location.search).get('slug')||'';
  }

  function displayName(){
    if(!compound)return'PURE20.';
    const value=lang()==='en'?compound.display_name_en:compound.display_name_nl;
    return String(value||'').trim()||compound.product_name||'PURE20.';
  }

  function fallback(){
    return `<div class="p20-product-fallback">
      <div class="p20-product-fallback-top">PURE20 / ${esc(compound?.category||'PRODUCT')}</div>
      <div class="p20-product-fallback-vial" aria-hidden="true"></div>
      <div class="p20-product-fallback-name">${esc(displayName())}</div>
    </div>`;
  }

  function currentVariantId(){
    return document.querySelector('#variantButtons .p20-variant-button.active')?.dataset.id||'';
  }

  function render(){
    const imageWrap=$('productImageWrap');
    if(!imageWrap||!compound)return;

    const id=currentVariantId();
    if(!id)return;

    const v=variants.get(String(id));
    const variantUrl=safeUrl(v?.image_url);
    const coverUrl=safeUrl(compound.image_url);
    const url=variantUrl||coverUrl;

    if(url){
      const altNl=v?.image_alt_nl||compound.image_alt_nl||`${displayName()} ${v?.variant||''}`.trim();
      const altEn=v?.image_alt_en||compound.image_alt_en||altNl;
      imageWrap.innerHTML=`<img src="${esc(url)}" alt="${esc(lang()==='en'?altEn:altNl)}">`;
      imageWrap.dataset.variantImageId=id;
    }else{
      imageWrap.innerHTML=fallback();
      imageWrap.dataset.variantImageId=id;
    }

    lastVariantId=id;
  }

  async function wait(){
    for(let i=0;i<120;i++){
      if(client()&&$('#variantButtons')&&$('#productImageWrap'))return true;
      await new Promise(r=>setTimeout(r,75));
    }
    return false;
  }

  async function load(){
    const slug=slugFromLocation();
    if(!slug)return;

    const c=client();
    const {data:compoundData,error:compoundError}=await c.from('pure20_compounds')
      .select('slug,product_name,category,image_url,image_alt_nl,image_alt_en,display_name_nl,display_name_en')
      .eq('slug',slug)
      .maybeSingle();

    if(compoundError||!compoundData)return;
    compound=compoundData;

    const {data,error}=await c.from('pure20_products')
      .select('id,variant,code,image_url,image_alt_nl,image_alt_en,active')
      .eq('product_name',compound.product_name)
      .eq('active',true)
      .order('sort_order',{ascending:true});

    if(error)return;
    variants=new Map((data||[]).map(v=>[String(v.id),v]));

    const buttons=$('variantButtons');
    observer?.disconnect();
    observer=new MutationObserver(()=>{
      const id=currentVariantId();
      if(id&&id!==lastVariantId)requestAnimationFrame(render);
    });
    observer.observe(buttons,{subtree:true,attributes:true,attributeFilter:['class'],childList:true});

    setTimeout(render,0);
  }

  async function boot(){
    if(!await wait())return;

    // Product.js may render a moment after this enhancement loads.
    for(let i=0;i<80;i++){
      if(document.querySelector('#variantButtons .p20-variant-button'))break;
      await new Promise(r=>setTimeout(r,75));
    }

    await load();

    window.addEventListener('pure20:languagechange',()=>setTimeout(render,0));
    window.addEventListener('pure20:i18nready',()=>setTimeout(render,0));

    // Re-read image data after returning to this page from admin in another tab.
    window.addEventListener('focus',async()=>{
      await load();
      setTimeout(render,0);
    });
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',boot,{once:true});
  }else{
    boot();
  }
})();