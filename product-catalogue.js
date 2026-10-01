(() => {
  'use strict';
  const PATH=(location.pathname.replace(/\/+$/,'')||'/').toLowerCase();
  if(PATH!=='/shop'&&PATH!=='/shop.html')return;

  let compounds=new Map(),observer=null,decorating=false;
  const safe=v=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const lang=()=>window.PURE20_I18N?.language || (localStorage.getItem('pure20_language')==='en'?'en':'nl');

  function safeUrl(value){
    const raw=String(value||'').trim();if(!raw)return'';
    try{const u=new URL(raw,location.href);return ['http:','https:'].includes(u.protocol)?u.href:''}catch(_){return''}
  }

  function displayName(c){
    const value=lang()==='en'?c.display_name_en:c.display_name_nl;
    return String(value||'').trim()||c.product_name;
  }

  function imageAlt(c){
    const value=lang()==='en'?c.image_alt_en:c.image_alt_nl;
    return String(value||'').trim()||displayName(c);
  }

  function visual(c){
    const img=safeUrl(c.image_url);
    return img?`<img src="${safe(img)}" alt="${safe(imageAlt(c))}">`:'';
  }

  function sourceName(row){
    if(row.dataset.p20SourceName)return row.dataset.p20SourceName;
    const original=row.querySelector('.product-name')?.textContent?.trim()||'';
    if(original)row.dataset.p20SourceName=original;
    return original;
  }

  function decorate(){
    if(decorating||!compounds.size)return;
    decorating=true;
    const seen=new Set();

    document.querySelectorAll('#catalogue .variant-row').forEach(row=>{
      const source=sourceName(row);
      const c=compounds.get(source);
      const main=row.querySelector('.product-main');
      if(!c||!main)return;

      const variantId=row.dataset.id||'';
      const href=`/product?slug=${encodeURIComponent(c.slug)}${variantId?`&variant=${encodeURIComponent(variantId)}`:''}`;
      const shownName=displayName(c);

      let link=row.querySelector('.p20-catalogue-product-link');
      const original=row.querySelector('.product-name');
      if(!link&&original){
        link=document.createElement('a');
        link.className='p20-catalogue-product-link';
        original.replaceWith(link);
      }
      if(link){
        link.href=href;
        link.textContent=shownName;
      }

      const key=c.product_name;
      const imageHtml=visual(c);
      let thumb=row.querySelector('.p20-catalogue-thumb,.p20-catalogue-thumb-spacer');

      if(!imageHtml){
        if(thumb)thumb.remove();
      }else if(!seen.has(key)){
        if(!thumb||thumb.tagName!=='A'){
          const fresh=document.createElement('a');
          fresh.className='p20-catalogue-thumb';
          if(thumb)thumb.replaceWith(fresh);
          else{
            const index=main.querySelector('.product-index');
            if(index?.nextSibling)main.insertBefore(fresh,index.nextSibling);
            else main.appendChild(fresh);
          }
          thumb=fresh;
        }
        thumb.className='p20-catalogue-thumb';
        thumb.href=href;
        thumb.setAttribute('aria-label',`${shownName} bekijken`);
        thumb.innerHTML=imageHtml;
        seen.add(key);
      }else{
        if(!thumb||!thumb.classList.contains('p20-catalogue-thumb-spacer')){
          const spacer=document.createElement('span');
          spacer.className='p20-catalogue-thumb-spacer';
          if(thumb)thumb.replaceWith(spacer);
          else{
            const index=main.querySelector('.product-index');
            if(index?.nextSibling)main.insertBefore(spacer,index.nextSibling);
            else main.appendChild(spacer);
          }
        }
      }

      row.dataset.p20ProductPage='1';
    });

    decorating=false;
  }

  async function load(){
    for(let i=0;i<80;i++){
      if(window.PURE20_API?.client)break;
      await new Promise(r=>setTimeout(r,50));
    }
    const client=window.PURE20_API?.client;if(!client)return;
    const {data,error}=await client.from('pure20_compounds')
      .select('slug,product_name,display_name_nl,display_name_en,image_url,image_alt_nl,image_alt_en')
      .eq('active',true)
      .order('sort_order',{ascending:true});
    if(error){console.warn('PURE20 product metadata:',error.message);return}
    compounds=new Map((data||[]).map(c=>[String(c.product_name),c]));
    decorate();

    const cat=document.getElementById('catalogue');
    if(cat){
      observer=new MutationObserver(()=>requestAnimationFrame(decorate));
      observer.observe(cat,{childList:true,subtree:true});
    }

    window.addEventListener('pure20:languagechange',()=>requestAnimationFrame(decorate));
    window.addEventListener('pure20:i18nready',()=>requestAnimationFrame(decorate));
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',load,{once:true});
  else load();
})();