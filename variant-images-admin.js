(() => {
  'use strict';

  const path=(location.pathname.replace(/\/+$/,'')||'/').toLowerCase();
  if(path!=='/admin'&&path!=='/admin.html')return;

  const BUCKET='pure20-products';
  const $=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/[&<>"']/g,ch=>({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[ch]));

  let variants=[];
  let compound=null;
  let currentProduct='';
  let selectedVariant=null;
  let selectedFile=null;

  function client(){return window.PURE20_API?.client}

  function slugify(value){
    return String(value||'file')
      .normalize('NFKD').replace(/[\u0300-\u036f]/g,'')
      .toLowerCase().replace(/[^a-z0-9._-]+/g,'-')
      .replace(/^-+|-+$/g,'').slice(0,100)||'file';
  }

  function safeUrl(value){
    const raw=String(value||'').trim();
    if(!raw)return'';
    try{
      const u=new URL(raw,location.href);
      return ['http:','https:'].includes(u.protocol)?u.href:'';
    }catch(_){return''}
  }

  async function waitForUi(){
    for(let i=0;i<120;i++){
      if($('#compoundModal')&&$('#compoundSourceName')&&client())return true;
      await new Promise(r=>setTimeout(r,75));
    }
    return false;
  }

  function inject(){
    if($('#variantImageSection'))return;

    const scroll=$('#compoundModal .p20-compound-modal-scroll');
    if(!scroll)return;

    const section=document.createElement('section');
    section.id='variantImageSection';
    section.className='p20-variant-images-section';
    section.innerHTML=`
      <div class="p20-variant-images-head">
        <div>
          <span class="p20-variant-images-kicker">FOTO'S PER STERKTE</span>
          <h4>Variantafbeeldingen</h4>
          <p>
            Elke sterkte kan een eigen vialfoto krijgen. Op de productpagina verandert de
            foto automatisch wanneer de klant van sterkte wisselt.
          </p>
        </div>
        <div class="p20-variant-images-hint">
          De shop toont maar één miniatuur per peptide. Kies daarvoor bij één sterkte
          <strong>Als shopminiatuur</strong>.
        </div>
      </div>

      <div id="variantImagesStatus" class="p20-variant-images-status">Varianten laden…</div>
      <div id="variantImagesGrid" class="p20-variant-images-grid"></div>

      <input id="variantImageFile" type="file"
        accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" hidden>
    `;

    scroll.appendChild(section);

    $('#variantImagesGrid').addEventListener('click',handleGridClick);
    $('#variantImageFile').addEventListener('change',handleFileChange);
  }

  async function authorised(){
    try{
      const session=await window.PURE20_API.getSession();
      if(!session?.user)return false;
      return await window.PURE20_API.isAdmin();
    }catch(_){return false}
  }

  function variantTitle(v){
    return String(v.variant||'').trim() || String(v.code||'').trim() || 'Variant';
  }

  function defaultAlt(v){
    return `PURE20 ${v.product_name} ${variantTitle(v)}`.trim();
  }

  async function loadForCurrentProduct(force=false){
    const modal=$('#compoundModal');
    if(!modal?.classList.contains('open'))return;

    const product=String($('#compoundSourceName')?.value||'').trim();
    if(!product)return;
    if(!force&&product===currentProduct&&variants.length)return;

    currentProduct=product;
    variants=[];
    compound=null;
    renderLoading();

    if(!await authorised()){
      renderError('Geen admin-toegang.');
      return;
    }

    const c=client();
    const [variantRes,compoundRes]=await Promise.all([
      c.from('pure20_products')
        .select('id,product_name,variant,code,sort_order,active,image_url,image_alt_nl,image_alt_en')
        .eq('product_name',product)
        .order('sort_order',{ascending:true}),
      c.from('pure20_compounds')
        .select('slug,product_name,image_url,image_alt_nl,image_alt_en')
        .eq('product_name',product)
        .maybeSingle()
    ]);

    if(variantRes.error){renderError(variantRes.error.message);return}
    if(compoundRes.error){renderError(compoundRes.error.message);return}

    variants=variantRes.data||[];
    compound=compoundRes.data||null;
    render();
  }

  function renderLoading(){
    const status=$('#variantImagesStatus');
    const grid=$('#variantImagesGrid');
    if(status)status.textContent='Varianten laden…';
    if(grid)grid.innerHTML='';
  }

  function renderError(message){
    const status=$('#variantImagesStatus');
    const grid=$('#variantImagesGrid');
    if(status)status.textContent=`Kon variantfoto's niet laden: ${message}`;
    if(grid)grid.innerHTML='';
  }

  function render(){
    const status=$('#variantImagesStatus');
    const grid=$('#variantImagesGrid');
    if(!status||!grid)return;

    status.textContent=variants.length
      ? `${variants.length} ${variants.length===1?'sterkte':'sterktes'}`
      : 'Geen varianten gevonden.';

    grid.innerHTML=variants.map(v=>{
      const url=safeUrl(v.image_url);
      const isCover=Boolean(url&&compound?.image_url&&url===compound.image_url);
      const inactive=v.active===false;
      return `
        <article class="p20-variant-image-card ${inactive?'is-inactive':''}" data-variant-id="${esc(v.id)}">
          <div class="p20-variant-image-preview">
            ${url
              ? `<img src="${esc(url)}" alt="${esc(v.image_alt_nl||defaultAlt(v))}">`
              : `<span>GEEN FOTO</span>`}
          </div>

          <div class="p20-variant-image-copy">
            <div class="p20-variant-image-meta">
              <span>${esc(v.code||'')}</span>
              ${inactive?'<span>VERBORGEN</span>':''}
              ${isCover?'<span class="is-cover">SHOPMINIATUUR</span>':''}
            </div>
            <strong>${esc(variantTitle(v))}</strong>
          </div>

          <div class="p20-variant-image-actions">
            <button class="admin-btn ${url?'':'primary'}"
              type="button" data-variant-action="upload">
              ${url?'Vervangen':'Uploaden'}
            </button>
            <button class="admin-btn"
              type="button" data-variant-action="cover"
              ${url&&!isCover?'':'disabled'}>
              ${isCover?'Shopminiatuur ✓':'Als shopminiatuur'}
            </button>
            <button class="admin-btn danger"
              type="button" data-variant-action="remove"
              ${url?'':'disabled'}>
              Verwijderen
            </button>
          </div>
        </article>
      `;
    }).join('');
  }

  async function handleGridClick(event){
    const button=event.target.closest('[data-variant-action]');
    if(!button||button.disabled)return;

    const card=button.closest('[data-variant-id]');
    const v=variants.find(x=>String(x.id)===String(card?.dataset.variantId));
    if(!v)return;

    const action=button.dataset.variantAction;

    if(action==='upload'){
      selectedVariant=v;
      selectedFile=null;
      $('#variantImageFile').value='';
      $('#variantImageFile').click();
      return;
    }

    if(action==='cover'){
      await setAsCover(v);
      return;
    }

    if(action==='remove'){
      const ok=confirm(`Foto verwijderen voor ${variantTitle(v)}?`);
      if(ok)await removeVariantImage(v);
    }
  }

  function validateFile(file){
    if(!file)return 'Geen bestand geselecteerd.';
    if(!['image/jpeg','image/png','image/webp'].includes(file.type)){
      return 'Gebruik JPG, PNG of WEBP.';
    }
    if(file.size>5*1024*1024){
      return 'De afbeelding mag maximaal 5 MB zijn.';
    }
    return '';
  }

  async function handleFileChange(){
    const file=$('#variantImageFile').files?.[0]||null;
    const error=validateFile(file);
    if(error){alert(error);return}
    if(!selectedVariant)return;

    selectedFile=file;
    await uploadVariantImage(selectedVariant,file);
  }

  function pathFromPublicUrl(value){
    try{
      const u=new URL(String(value||''));
      const marker='/storage/v1/object/public/pure20-products/';
      const i=u.pathname.indexOf(marker);
      return i<0?'':decodeURIComponent(u.pathname.slice(i+marker.length));
    }catch(_){return''}
  }

  async function maybeDeleteStorageObject(url){
    const path=pathFromPublicUrl(url);
    if(!path)return;
    const {error}=await client().storage.from(BUCKET).remove([path]);
    if(error)console.warn('Oude variantfoto niet verwijderd:',error.message);
  }

  async function uploadFile(file,v){
    const folder=`variants/${slugify(v.product_name)}/${slugify(v.id)}`;
    const filename=`${Date.now()}-${slugify(file.name||'variant.webp')}`;
    const path=`${folder}/${filename}`;

    const {data,error}=await client().storage.from(BUCKET).upload(path,file,{
      cacheControl:'31536000',
      upsert:false,
      contentType:file.type
    });
    if(error)throw error;

    const pub=client().storage.from(BUCKET).getPublicUrl(data.path);
    const url=pub.data?.publicUrl||'';
    if(!url)throw new Error('Geen publieke URL ontvangen.');
    return url;
  }

  async function uploadVariantImage(v,file){
    const grid=$('#variantImagesGrid');
    grid?.classList.add('is-busy');

    const oldUrl=String(v.image_url||'');
    const wasCover=Boolean(oldUrl&&compound?.image_url===oldUrl);

    try{
      const url=await uploadFile(file,v);
      const alt=defaultAlt(v);

      const {error}=await client().from('pure20_products').update({
        image_url:url,
        image_alt_nl:alt,
        image_alt_en:alt,
        updated_at:new Date().toISOString()
      }).eq('id',v.id);
      if(error)throw error;

      if(wasCover||!compound?.image_url){
        const {error:coverError}=await client().from('pure20_compounds').update({
          image_url:url,
          image_alt_nl:alt,
          image_alt_en:alt,
          updated_at:new Date().toISOString()
        }).eq('product_name',v.product_name);
        if(coverError)throw coverError;
      }

      if(oldUrl&&oldUrl!==url)await maybeDeleteStorageObject(oldUrl);

      await loadForCurrentProduct(true);
      refreshVisibleCompoundCard();
    }catch(err){
      console.error(err);
      alert(`Upload mislukt: ${err.message||err}`);
    }finally{
      grid?.classList.remove('is-busy');
      selectedVariant=null;
      selectedFile=null;
    }
  }

  async function setAsCover(v){
    const url=safeUrl(v.image_url);
    if(!url)return;

    const alt=v.image_alt_nl||defaultAlt(v);
    try{
      const {error}=await client().from('pure20_compounds').update({
        image_url:url,
        image_alt_nl:alt,
        image_alt_en:v.image_alt_en||alt,
        updated_at:new Date().toISOString()
      }).eq('product_name',v.product_name);
      if(error)throw error;

      await loadForCurrentProduct(true);
      refreshVisibleCompoundCard();
    }catch(err){
      console.error(err);
      alert(`Shopminiatuur instellen mislukt: ${err.message||err}`);
    }
  }

  async function removeVariantImage(v){
    const oldUrl=String(v.image_url||'');
    const wasCover=Boolean(oldUrl&&compound?.image_url===oldUrl);

    try{
      const {error}=await client().from('pure20_products').update({
        image_url:null,
        image_alt_nl:null,
        image_alt_en:null,
        updated_at:new Date().toISOString()
      }).eq('id',v.id);
      if(error)throw error;

      if(wasCover){
        const replacement=variants.find(x=>x.id!==v.id&&safeUrl(x.image_url));
        const payload=replacement ? {
          image_url:replacement.image_url,
          image_alt_nl:replacement.image_alt_nl||defaultAlt(replacement),
          image_alt_en:replacement.image_alt_en||replacement.image_alt_nl||defaultAlt(replacement),
          updated_at:new Date().toISOString()
        } : {
          image_url:null,
          image_alt_nl:null,
          image_alt_en:null,
          updated_at:new Date().toISOString()
        };

        const {error:coverError}=await client().from('pure20_compounds')
          .update(payload)
          .eq('product_name',v.product_name);
        if(coverError)throw coverError;
      }

      if(oldUrl)await maybeDeleteStorageObject(oldUrl);

      await loadForCurrentProduct(true);
      refreshVisibleCompoundCard();
    }catch(err){
      console.error(err);
      alert(`Foto verwijderen mislukt: ${err.message||err}`);
    }
  }

  function refreshVisibleCompoundCard(){
    if(!compound)return;
    const card=document.querySelector(`[data-compound-slug="${CSS.escape(compound.slug)}"]`);
    if(!card)return;

    const thumb=card.querySelector('.p20-compound-thumb');
    if(thumb){
      if(compound.image_url){
        thumb.innerHTML=`<img src="${esc(compound.image_url)}" alt="${esc(compound.image_alt_nl||compound.product_name)}">`;
      }else{
        thumb.innerHTML='<div class="p20-variant-no-cover">GEEN FOTO</div>';
      }
    }
  }

  async function boot(){
    if(!await waitForUi())return;
    inject();

    const modal=$('#compoundModal');
    const observer=new MutationObserver(()=>{
      if(modal.classList.contains('open')){
        setTimeout(()=>loadForCurrentProduct(false),60);
      }else{
        currentProduct='';
        variants=[];
        compound=null;
      }
    });
    observer.observe(modal,{attributes:true,attributeFilter:['class']});

    document.addEventListener('click',e=>{
      if(e.target.closest('[data-compound-slug]')){
        setTimeout(()=>loadForCurrentProduct(false),100);
      }
    });
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',boot,{once:true});
  }else{
    boot();
  }
})();