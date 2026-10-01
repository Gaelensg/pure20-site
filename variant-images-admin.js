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
  let currentProduct='';
  let selectedVariant=null;

  function client(){ return window.PURE20_API?.client; }

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
    }catch(_){ return ''; }
  }

  async function waitForBaseUi(){
    for(let i=0;i<120;i++){
      if($('#compoundModal')&&$('#compoundSourceName')&&client()) return true;
      await new Promise(r=>setTimeout(r,75));
    }
    return false;
  }

  function patchBaseCopy(){
    const note=document.querySelector('#panel-productpages .p20-compound-head .admin-note');
    if(note){
      note.textContent='Eén productpagina per peptide. De shop gebruikt één miniatuur; iedere sterkte kan daarnaast een eigen foto krijgen.';
    }

    const imageEditor=$('#compoundModal .p20-compound-image-editor');
    const button=$('chooseCompoundImage');
    if(button) button.textContent='Shopminiatuur uploaden';

    const helper=imageEditor?.querySelector('small');
    if(helper){
      helper.textContent='Algemene shopminiatuur / fallback. Foto’s per sterkte beheer je via “Sterktes & foto’s” bovenaan.';
    }
  }

  function inject(){
    if($('#openVariantImages'))return;

    patchBaseCopy();

    const head=$('#compoundModal .p20-compound-modal-head > div:first-child');
    if(head){
      const launch=document.createElement('button');
      launch.id='openVariantImages';
      launch.type='button';
      launch.className='admin-btn p20-variant-launch';
      launch.textContent='STERKTES & FOTO’S';
      launch.disabled=true;
      head.appendChild(launch);
      launch.addEventListener('click',openSheet);
    }

    const backdrop=document.createElement('div');
    backdrop.id='variantSheetBackdrop';
    backdrop.className='p20-variant-sheet-backdrop';

    const sheet=document.createElement('aside');
    sheet.id='variantSheet';
    sheet.className='p20-variant-sheet';
    sheet.setAttribute('aria-hidden','true');
    sheet.innerHTML=`
      <div class="p20-variant-sheet-head">
        <div>
          <span class="p20-variant-sheet-kicker">PRODUCTVARIANTEN</span>
          <h3 id="variantSheetTitle">Sterktes & foto’s</h3>
          <p id="variantSheetSubtitle"></p>
        </div>
        <button id="closeVariantSheet" type="button" class="icon-btn" aria-label="Sluiten">×</button>
      </div>

      <div class="p20-variant-sheet-body">
        <div class="p20-variant-explainer">
          <strong>Per sterkte een eigen foto.</strong>
          <span>Deze foto verschijnt op de productpagina zodra de klant die sterkte selecteert. De algemene shopminiatuur blijft apart.</span>
        </div>
        <div id="variantImagesStatus" class="p20-variant-images-status"></div>
        <div id="variantImagesGrid" class="p20-variant-images-grid"></div>
      </div>

      <input id="variantImageFile" type="file"
        accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" hidden>
    `;

    document.body.append(backdrop,sheet);

    $('#closeVariantSheet').addEventListener('click',closeSheet);
    backdrop.addEventListener('click',closeSheet);
    $('#variantImagesGrid').addEventListener('click',handleGridClick);
    $('#variantImageFile').addEventListener('change',handleFileChange);

    document.addEventListener('keydown',e=>{
      if(e.key==='Escape'&&sheet.classList.contains('open')) closeSheet();
    });
  }

  async function authorised(){
    try{
      const session=await window.PURE20_API.getSession();
      if(!session?.user)return false;
      return await window.PURE20_API.isAdmin();
    }catch(_){ return false; }
  }

  function variantTitle(v){
    return String(v.variant||'').trim() || String(v.code||'').trim() || 'Variant';
  }

  function defaultAlt(v){
    return `PURE20 ${v.product_name} ${variantTitle(v)}`.trim();
  }

  async function loadForCurrentProduct(force=false){
    const modal=$('compoundModal');
    if(!modal?.classList.contains('open'))return;

    const product=String($('#compoundSourceName')?.value||'').trim();
    if(!product)return;

    if(!force&&product===currentProduct&&variants.length){
      updateLaunch();
      return;
    }

    currentProduct=product;
    variants=[];
    updateLaunch(true);

    if(!await authorised()){
      setStatus('Geen admin-toegang.');
      return;
    }

    const {data,error}=await client().from('pure20_products')
      .select('id,product_name,variant,code,sort_order,active,image_url,image_alt_nl,image_alt_en')
      .eq('product_name',product)
      .order('sort_order',{ascending:true});

    if(error){
      setStatus(`Kon varianten niet laden: ${error.message}`);
      return;
    }

    variants=data||[];
    updateLaunch();
    render();
  }

  function updateLaunch(loading=false){
    const btn=$('openVariantImages');
    if(!btn)return;
    if(loading){
      btn.textContent='STERKTES LADEN…';
      btn.disabled=true;
      return;
    }
    const n=variants.length;
    btn.textContent=n
      ? `${n} ${n===1?'STERKTE':'STERKTES'} & FOTO’S`
      : 'STERKTES & FOTO’S';
    btn.disabled=n===0;
  }

  function setStatus(text){
    const status=$('variantImagesStatus');
    if(status) status.textContent=text;
  }

  function render(){
    const grid=$('variantImagesGrid');
    if(!grid)return;

    setStatus(variants.length
      ? `${variants.length} ${variants.length===1?'variant':'varianten'}`
      : 'Geen varianten gevonden.');

    grid.innerHTML=variants.map(v=>{
      const url=safeUrl(v.image_url);
      return `
        <article class="p20-variant-image-card ${v.active===false?'is-inactive':''}" data-variant-id="${esc(v.id)}">
          <div class="p20-variant-image-preview">
            ${url
              ? `<img src="${esc(url)}" alt="${esc(v.image_alt_nl||defaultAlt(v))}">`
              : `<span>GEEN FOTO</span>`}
          </div>

          <div class="p20-variant-image-copy">
            <div class="p20-variant-image-meta">
              ${v.code?`<span>${esc(v.code)}</span>`:''}
              ${v.active===false?'<span>VERBORGEN</span>':''}
              ${url?'<span class="has-image">FOTO</span>':''}
            </div>
            <strong>${esc(variantTitle(v))}</strong>
          </div>

          <div class="p20-variant-image-actions">
            <button class="admin-btn ${url?'':'primary'}" type="button" data-variant-action="upload">
              ${url?'Foto vervangen':'Foto uploaden'}
            </button>
            <button class="admin-btn danger" type="button" data-variant-action="remove" ${url?'':'disabled'}>
              Verwijderen
            </button>
          </div>
        </article>
      `;
    }).join('');
  }

  function openSheet(){
    if(!variants.length)return;

    $('#variantSheetTitle').textContent=`${currentProduct}`;
    $('#variantSheetSubtitle').textContent=`${variants.length} ${variants.length===1?'sterkte':'sterktes'}`;
    render();

    $('#variantSheetBackdrop').classList.add('open');
    $('#variantSheet').classList.add('open');
    $('#variantSheet').setAttribute('aria-hidden','false');
    document.body.classList.add('p20-variant-sheet-open');
  }

  function closeSheet(){
    $('#variantSheetBackdrop')?.classList.remove('open');
    $('#variantSheet')?.classList.remove('open');
    $('#variantSheet')?.setAttribute('aria-hidden','true');
    document.body.classList.remove('p20-variant-sheet-open');
  }

  async function handleGridClick(event){
    const button=event.target.closest('[data-variant-action]');
    if(!button||button.disabled)return;

    const card=button.closest('[data-variant-id]');
    const v=variants.find(x=>String(x.id)===String(card?.dataset.variantId));
    if(!v)return;

    if(button.dataset.variantAction==='upload'){
      selectedVariant=v;
      $('#variantImageFile').value='';
      $('#variantImageFile').click();
      return;
    }

    if(button.dataset.variantAction==='remove'){
      const ok=confirm(`Foto verwijderen voor ${variantTitle(v)}?`);
      if(ok) await removeVariantImage(v);
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
    if(error){ alert(error); return; }
    if(!selectedVariant)return;
    await uploadVariantImage(selectedVariant,file);
  }

  function pathFromPublicUrl(value){
    try{
      const u=new URL(String(value||''));
      const marker='/storage/v1/object/public/pure20-products/';
      const i=u.pathname.indexOf(marker);
      return i<0?'':decodeURIComponent(u.pathname.slice(i+marker.length));
    }catch(_){ return ''; }
  }

  async function deleteStorageObject(url){
    const storagePath=pathFromPublicUrl(url);
    if(!storagePath)return;
    const {error}=await client().storage.from(BUCKET).remove([storagePath]);
    if(error) console.warn('Oude variantfoto kon niet verwijderd worden:',error.message);
  }

  async function uploadFile(file,v){
    const folder=`variants/${slugify(v.product_name)}/${slugify(v.id)}`;
    const filename=`${Date.now()}-${slugify(file.name||'variant.webp')}`;
    const objectPath=`${folder}/${filename}`;

    const {data,error}=await client().storage.from(BUCKET).upload(objectPath,file,{
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
    const grid=$('variantImagesGrid');
    grid?.classList.add('is-busy');

    const oldUrl=String(v.image_url||'');

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

      if(oldUrl&&oldUrl!==url) await deleteStorageObject(oldUrl);

      await loadForCurrentProduct(true);
    }catch(err){
      console.error(err);
      alert(`Foto uploaden mislukt: ${err.message||err}`);
    }finally{
      grid?.classList.remove('is-busy');
      selectedVariant=null;
    }
  }

  async function removeVariantImage(v){
    const oldUrl=String(v.image_url||'');
    try{
      const {error}=await client().from('pure20_products').update({
        image_url:null,
        image_alt_nl:null,
        image_alt_en:null,
        updated_at:new Date().toISOString()
      }).eq('id',v.id);

      if(error)throw error;
      if(oldUrl) await deleteStorageObject(oldUrl);

      await loadForCurrentProduct(true);
    }catch(err){
      console.error(err);
      alert(`Foto verwijderen mislukt: ${err.message||err}`);
    }
  }

  async function boot(){
    if(!await waitForBaseUi())return;

    inject();
    patchBaseCopy();

    const modal=$('compoundModal');

    const observer=new MutationObserver(()=>{
      if(modal.classList.contains('open')){
        patchBaseCopy();
        setTimeout(()=>loadForCurrentProduct(true),80);
      }else{
        closeSheet();
        currentProduct='';
        variants=[];
        updateLaunch();
      }
    });
    observer.observe(modal,{attributes:true,attributeFilter:['class']});

    document.addEventListener('click',event=>{
      if(event.target.closest('[data-compound-slug]')){
        setTimeout(()=>loadForCurrentProduct(true),130);
      }
    });
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',boot,{once:true});
  }else{
    boot();
  }
})();