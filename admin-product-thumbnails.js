(() => {
  'use strict';

  const path=(location.pathname.replace(/\/+$/,'')||'/').toLowerCase();
  if(path!=='/admin'&&path!=='/admin.html')return;

  const $=id=>document.getElementById(id);
  let images=new Map();
  let observer=null;
  let channel=null;

  function safeUrl(value){
    const raw=String(value||'').trim();
    if(!raw)return'';
    try{
      const u=new URL(raw,location.href);
      return ['http:','https:'].includes(u.protocol)?u.href:'';
    }catch(_){return''}
  }

  function ensureStyle(){
    if(document.getElementById('p20AdminThumbStyle'))return;
    const style=document.createElement('style');
    style.id='p20AdminThumbStyle';
    style.textContent=`
      .p20-admin-product-thumb{
        width:38px;
        height:38px;
        object-fit:cover;
        display:inline-block;
        vertical-align:middle;
        margin-right:9px;
        border:1px solid #d0cec8;
        background:#f2f1ec;
      }

      @media(max-width:680px){
        #panel-products .admin-table tr[data-id].p20-has-product-thumb{
          padding-left:78px!important;
          min-height:76px;
        }

        #panel-products .admin-table tr[data-id] .p20-admin-product-thumb{
          position:absolute;
          left:14px;
          top:14px;
          width:50px;
          height:50px;
          margin:0;
        }
      }
    `;
    document.head.appendChild(style);
  }

  async function waitForApi(){
    for(let i=0;i<160;i++){
      if(window.PURE20_API?.client&&$('productsBody'))return true;
      await new Promise(r=>setTimeout(r,50));
    }
    return false;
  }

  function decorate(){
    const tbody=$('productsBody');
    if(!tbody)return;

    tbody.querySelectorAll('tr[data-id]').forEach(row=>{
      const id=String(row.dataset.id||'');
      const url=safeUrl(images.get(id));

      let img=row.querySelector('.p20-admin-product-thumb');

      if(!url){
        img?.remove();
        row.classList.remove('p20-has-product-thumb');
        return;
      }

      if(!img){
        img=document.createElement('img');
        img.className='p20-admin-product-thumb';
        img.alt='';
        img.loading='lazy';

        const productCell=row.querySelector('td:nth-child(2)');
        if(productCell){
          productCell.insertBefore(img,productCell.firstChild);
        }else{
          row.appendChild(img);
        }
      }

      if(img.src!==url)img.src=url;
      row.classList.add('p20-has-product-thumb');
    });
  }

  async function loadImages(){
    const client=window.PURE20_API?.client;
    if(!client)return;

    const {data,error}=await client.from('pure20_products')
      .select('id,image_url')
      .order('sort_order',{ascending:true});

    if(error){
      console.warn('PURE20 admin thumbnails:',error.message);
      return;
    }

    images=new Map((data||[]).map(row=>[String(row.id),row.image_url||'']));
    decorate();
  }

  async function boot(){
    if(!await waitForApi())return;

    ensureStyle();
    await loadImages();

    const tbody=$('productsBody');
    observer=new MutationObserver(()=>requestAnimationFrame(decorate));
    observer.observe(tbody,{childList:true,subtree:true});

    const client=window.PURE20_API.client;
    channel=client.channel('pure20-admin-product-thumbnails')
      .on('postgres_changes',
        {event:'*',schema:'public',table:'pure20_products'},
        ()=>setTimeout(loadImages,120)
      )
      .subscribe();
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',boot,{once:true});
  }else{
    boot();
  }
})();