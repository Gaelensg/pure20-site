(() => {
  'use strict';

  const PATH=(location.pathname.replace(/\/+$/,'')||'/').toLowerCase();
  if(PATH!=='/shop'&&PATH!=='/shop.html')return;

  let rowsById=new Map();
  let firstImageByProduct=new Map();
  let observer=null;
  let timer=null;

  function safeUrl(value){
    const raw=String(value||'').trim();
    if(!raw)return'';
    try{
      const u=new URL(raw,location.href);
      return ['http:','https:'].includes(u.protocol)?u.href:'';
    }catch(_){
      return'';
    }
  }

  function ensureStyles(){
    if(document.getElementById('p20StableThumbStyles'))return;

    const style=document.createElement('style');
    style.id='p20StableThumbStyles';
    style.textContent=`
      .p20-catalogue-thumb,
      .p20-catalogue-thumb-spacer{
        width:58px;
        height:58px;
        flex:0 0 58px;
        display:block;
      }

      .p20-catalogue-thumb{
        overflow:hidden;
        border:1px solid var(--line,#d6d3cb);
        background:transparent;
      }

      .p20-catalogue-thumb img{
        width:100%;
        height:100%;
        display:block;
        object-fit:cover;
      }

      .p20-catalogue-thumb-spacer{
        visibility:hidden;
        border:0;
      }

      html[data-p20-theme="dark"] .p20-catalogue-thumb{
        border-color:#303632;
      }

      @media(max-width:850px){
        .p20-catalogue-thumb,
        .p20-catalogue-thumb-spacer{
          width:50px;
          height:50px;
          flex-basis:50px;
        }
      }

      @media(max-width:520px){
        .p20-catalogue-thumb,
        .p20-catalogue-thumb-spacer{
          width:46px;
          height:46px;
          flex-basis:46px;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function currentRows(){
    return [...document.querySelectorAll('#catalogue .variant-row[data-id]')];
  }

  function insertAfterIndex(main,node){
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
    const domRows=currentRows();
    if(!domRows.length||!rowsById.size)return;

    const seen=new Set();

    for(const row of domRows){
      const id=String(row.dataset.id||'');
      const db=rowsById.get(id);
      if(!db)continue;

      const product=String(db.product_name||'');
      const imageUrl=safeUrl(firstImageByProduct.get(product));
      if(!product||!imageUrl)continue;

      const main=row.querySelector('.product-main');
      if(!main)continue;

      const shouldShow=!seen.has(product);
      seen.add(product);

      let slot=main.querySelector(':scope > .p20-catalogue-thumb, :scope > .p20-catalogue-thumb-spacer');

      if(shouldShow){
        if(!slot||!slot.classList.contains('p20-catalogue-thumb')){
          const fresh=document.createElement('span');
          fresh.className='p20-catalogue-thumb';

          if(slot){
            slot.replaceWith(fresh);
          }else{
            insertAfterIndex(main,fresh);
          }
          slot=fresh;
        }

        let img=slot.querySelector('img');
        if(!img){
          img=document.createElement('img');
          img.loading='lazy';
          img.decoding='async';
          slot.appendChild(img);
        }

        const wanted=imageUrl;
        if(img.getAttribute('src')!==wanted){
          img.setAttribute('src',wanted);
        }

        const label=product + ' productfoto';
        if(img.getAttribute('alt')!==label){
          img.setAttribute('alt',label);
        }
      }else{
        if(!slot||!slot.classList.contains('p20-catalogue-thumb-spacer')){
          const spacer=document.createElement('span');
          spacer.className='p20-catalogue-thumb-spacer';
          spacer.setAttribute('aria-hidden','true');

          if(slot){
            slot.replaceWith(spacer);
          }else{
            insertAfterIndex(main,spacer);
          }
        }
      }
    }
  }

  function scheduleDecorate(){
    clearTimeout(timer);
    timer=setTimeout(decorate,60);
  }

  async function waitForSupabase(){
    for(let i=0;i<160;i++){
      if(window.supabase?.createClient&&window.PURE20_SUPABASE_CONFIG?.url&&document.getElementById('catalogue')){
        return true;
      }
      await new Promise(r=>setTimeout(r,50));
    }
    return false;
  }

  function makePublicClient(){
    const cfg=window.PURE20_SUPABASE_CONFIG||{};
    return window.supabase.createClient(cfg.url,cfg.key,{
      auth:{
        persistSession:false,
        autoRefreshToken:false,
        detectSessionInUrl:false,
        storageKey:'pure20-shop-thumbnails-anon'
      }
    });
  }

  async function loadImages(client){
    const {data,error}=await client
      .from('pure20_products')
      .select('id,product_name,image_url,sort_order,active')
      .eq('active',true)
      .order('sort_order',{ascending:true});

    if(error){
      console.warn('PURE20 thumbnails:',error.message);
      return false;
    }

    rowsById=new Map();
    firstImageByProduct=new Map();

    for(const item of data||[]){
      const id=String(item.id||'');
      if(id)rowsById.set(id,item);

      const product=String(item.product_name||'');
      const url=safeUrl(item.image_url);
      if(product&&url&&!firstImageByProduct.has(product)){
        firstImageByProduct.set(product,url);
      }
    }

    decorate();
    return true;
  }

  async function boot(){
    if(!await waitForSupabase())return;

    ensureStyles();

    const client=makePublicClient();
    await loadImages(client);

    const catalogue=document.getElementById('catalogue');
    if(!catalogue)return;

    observer=new MutationObserver(scheduleDecorate);
    observer.observe(catalogue,{childList:true,subtree:true});

    client
      .channel('pure20-shop-thumbnail-refresh')
      .on(
        'postgres_changes',
        {event:'*',schema:'public',table:'pure20_products'},
        ()=>setTimeout(()=>loadImages(client),180)
      )
      .subscribe();
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',boot,{once:true});
  }else{
    boot();
  }
})();