(() => {
  'use strict';

  const KEY='pure20_language';
  const FEATURED=['HGH 191AA','Retatrutide','BPC 157','GHK-CU'];

  function getLanguage(){
    return localStorage.getItem(KEY)==='en'?'en':'nl';
  }

  function apply(lang){
    lang=lang==='en'?'en':'nl';
    document.documentElement.lang=lang;
    localStorage.setItem(KEY,lang);

    document.querySelectorAll('[data-nl][data-en]').forEach(node=>{
      const text=node.dataset[lang];
      if(typeof text==='string')node.textContent=text;
    });

    document.querySelectorAll('#pure20LangSwitch [data-lang]').forEach(button=>{
      button.setAttribute('aria-pressed',String(button.dataset.lang===lang));
    });

    document.title=lang==='nl'
      ?'PURE20. — Onderzoek, helder georganiseerd.'
      :'PURE20. — Research, clearly organized.';
  }

  document.querySelectorAll('#pure20LangSwitch [data-lang]').forEach(button=>{
    button.addEventListener('click',()=>{
      apply(button.dataset.lang);
      renderFeatured(window.__PURE20_HOME_PRODUCTS__||[]);
    });
  });

  function safeUrl(value){
    const raw=String(value||'').trim();
    if(!raw)return'';
    try{
      const u=new URL(raw,location.href);
      return ['https:','http:'].includes(u.protocol)?u.href:'';
    }catch(_){return''}
  }

  function esc(v){
    return String(v??'').replace(/[&<>"']/g,ch=>({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[ch]));
  }

  function placeholder(name){
    return `<div class="featured-placeholder" aria-hidden="true">
      <div class="p20">PURE20.</div>
      <div class="placeholder-mark"></div>
      <div class="placeholder-note">${esc(name)}</div>
    </div>`;
  }

  function renderFeatured(products){
    const root=document.getElementById('featuredProducts');
    if(!root)return;

    const currentLang=getLanguage();

    if(!products.length){
      root.innerHTML=`<div class="featured-loading">${
        currentLang==='en'?'Featured products are being prepared.':'Uitgelichte producten worden voorbereid.'
      }</div>`;
      return;
    }

    root.innerHTML=products.map(p=>{
      const image=safeUrl(p.image_url);
      const display=String(
        currentLang==='en'
          ?(p.display_name_en||p.product_name)
          :(p.display_name_nl||p.product_name)
      ).trim();

      return `<a class="featured-card" href="/product?slug=${encodeURIComponent(p.slug)}">
        <div class="featured-image">
          ${image
            ?`<img src="${esc(image)}" alt="${esc(display)}" loading="lazy" decoding="async">`
            :placeholder(display)}
        </div>
        <div class="featured-body">
          <div class="featured-category">${esc(p.category||'PURE20')}</div>
          <h3>${esc(display)}</h3>
          <div class="featured-bottom">
            <span>${currentLang==='en'?'View product':'Bekijk product'}</span>
            <span>↗</span>
          </div>
        </div>
      </a>`;
    }).join('');
  }

  async function loadFeatured(){
    const root=document.getElementById('featuredProducts');
    const cfg=window.PURE20_SUPABASE_CONFIG||{};
    if(!cfg.url||!cfg.key||!root){
      renderFeatured([]);
      return;
    }

    const base=String(cfg.url).replace(/\/+$/,'');
    const headers={apikey:cfg.key,Accept:'application/json'};

    try{
      const [compoundRes,productRes]=await Promise.all([
        fetch(
          base+'/rest/v1/pure20_compounds?select=slug,product_name,display_name_nl,display_name_en,category,image_url,active&active=eq.true',
          {cache:'no-store',headers}
        ),
        fetch(
          base+'/rest/v1/pure20_products?select=product_name,image_url,sort_order,active&active=eq.true&order=sort_order.asc',
          {cache:'no-store',headers}
        )
      ]);

      if(!compoundRes.ok||!productRes.ok)throw new Error('catalogue');

      const compounds=await compoundRes.json();
      const variants=await productRes.json();

      const variantImages=new Map();
      for(const v of variants||[]){
        const image=safeUrl(v.image_url);
        if(image&&!variantImages.has(v.product_name)){
          variantImages.set(v.product_name,image);
        }
      }

      const byName=new Map((compounds||[]).map(c=>[String(c.product_name),c]));
      const selected=[];

      for(const name of FEATURED){
        const c=byName.get(name);
        if(!c)continue;
        selected.push({
          ...c,
          image_url:safeUrl(c.image_url)||variantImages.get(c.product_name)||''
        });
      }

      // If one of the preferred products disappears, fill the grid from live catalogue entries.
      for(const c of compounds||[]){
        if(selected.length>=4)break;
        if(selected.some(x=>x.product_name===c.product_name))continue;
        selected.push({
          ...c,
          image_url:safeUrl(c.image_url)||variantImages.get(c.product_name)||''
        });
      }

      window.__PURE20_HOME_PRODUCTS__=selected.slice(0,4);
      renderFeatured(window.__PURE20_HOME_PRODUCTS__);
    }catch(err){
      console.warn('PURE20 home featured:',err);
      renderFeatured([]);
    }
  }

  apply(getLanguage());
  loadFeatured();
})();
