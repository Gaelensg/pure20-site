(() => {
  'use strict';
  const PATH=(location.pathname.replace(/\/+$/,'')||'/').toLowerCase();
  if(PATH!=='/shop'&&PATH!=='/shop.html')return;

  let compounds=new Map(), observer=null, decorating=false;
  const safe=v=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));

  function safeUrl(value){
    const raw=String(value||'').trim();if(!raw)return'';
    try{const u=new URL(raw,location.href);return ['http:','https:'].includes(u.protocol)?u.href:''}catch(_){return''}
  }

  function visual(c){
    const img=safeUrl(c.image_url);
    if(img)return `<img src="${safe(img)}" alt="${safe(c.image_alt_nl||c.product_name)}">`;
    return `<span class="p20-catalogue-thumb-fallback"><b>20.</b><small>${safe(c.product_name)}</small></span>`;
  }

  function decorate(){
    if(decorating||!compounds.size)return;
    decorating=true;
    const seen=new Set();
    document.querySelectorAll('#catalogue .variant-row').forEach(row=>{
      if(row.dataset.p20ProductPage==='1')return;
      const nameEl=row.querySelector('.product-name');
      const main=row.querySelector('.product-main');
      if(!nameEl||!main)return;
      const name=(nameEl.textContent||'').trim();
      const c=compounds.get(name);
      if(!c)return;

      const variantId=row.dataset.id||'';
      const href=`/product/${encodeURIComponent(c.slug)}${variantId?`?variant=${encodeURIComponent(variantId)}`:''}`;

      const link=document.createElement('a');
      link.className='p20-catalogue-product-link';
      link.href=href;
      link.textContent=name;
      nameEl.replaceWith(link);

      const index=main.querySelector('.product-index');
      const key=c.product_name;
      const thumb=document.createElement(seen.has(key)?'span':'a');
      thumb.className=seen.has(key)?'p20-catalogue-thumb-spacer':'p20-catalogue-thumb';
      if(!seen.has(key)){
        thumb.href=href;
        thumb.setAttribute('aria-label',`${name} bekijken`);
        thumb.innerHTML=visual(c);
        seen.add(key);
      }
      if(index?.nextSibling)main.insertBefore(thumb,index.nextSibling);
      else main.appendChild(thumb);

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
      .select('slug,product_name,image_url,image_alt_nl,image_alt_en')
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
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',load,{once:true});
  else load();
})();
