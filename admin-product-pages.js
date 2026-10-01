(() => {
  'use strict';

  const PATH=(location.pathname.replace(/\/+$/,'')||'/').toLowerCase();
  if(PATH!=='/admin'&&PATH!=='/admin.html') return;

  const BUCKET='pure20-products';
  const $=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/[&<>"']/g,ch=>({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[ch]));

  let compounds=[];
  let variantsByProduct=new Map();
  let selected=null;
  let shopFile=null;
  let removeShopImage=false;
  let shopPreviewUrl='';
  let selectedVariant=null;

  function client(){ return window.PURE20_API?.client; }

  async function waitForBase(){
    for(let i=0;i<180;i++){
      if(document.querySelector('.admin-tabs')&&$('#panel-products')&&client()) return true;
      await new Promise(r=>setTimeout(r,50));
    }
    return false;
  }

  function slugify(value){
    return String(value||'file')
      .normalize('NFKD').replace(/[\u0300-\u036f]/g,'')
      .toLowerCase().replace(/[^a-z0-9._-]+/g,'-')
      .replace(/^-+|-+$/g,'').slice(0,100)||'file';
  }

  function makeSlug(value){
    return String(value||'product')
      .normalize('NFKD').replace(/[\u0300-\u036f]/g,'')
      .toLowerCase().replace(/[^a-z0-9]+/g,'-')
      .replace(/^-+|-+$/g,'')||'product';
  }

  function safeUrl(value){
    const raw=String(value||'').trim();
    if(!raw)return'';
    try{
      const u=new URL(raw,location.href);
      return ['http:','https:'].includes(u.protocol)?u.href:'';
    }catch(_){ return ''; }
  }

  function shownName(c){
    return String(c?.display_name_nl||'').trim()||c?.product_name||'Product';
  }

  function variantName(v){
    return String(v?.variant||'').trim()||String(v?.code||'').trim()||'Variant';
  }

  function defaultVariantAlt(v){
    return `PURE20 ${v.product_name} ${variantName(v)}`.trim();
  }

  async function authorised(){
    try{
      const session=await window.PURE20_API.getSession();
      if(!session?.user)return false;
      return await window.PURE20_API.isAdmin();
    }catch(_){ return false; }
  }

  function inject(){
    if($('#panel-productpages')) return;

    const tabs=document.querySelector('.admin-tabs');
    const productPanel=$('panel-products');
    if(!tabs||!productPanel)return;

    const tab=document.createElement('button');
    tab.type='button';
    tab.className='admin-tab';
    tab.dataset.tab='productpages';
    tab.textContent='Product pages';
    tabs.insertBefore(tab,tabs.children[1]||null);

    const panel=document.createElement('section');
    panel.id='panel-productpages';
    panel.className='admin-panel';
    panel.innerHTML=`
      <div class="admin-card p20-pp-card">
        <div class="admin-card-head p20-pp-head">
          <div>
            <h2>Product pages</h2>
            <p class="admin-note">Eén productpagina per peptide, met één shopminiatuur en aparte foto's per sterkte.</p>
          </div>
          <button id="syncProductPages" class="admin-btn" type="button">Catalogus synchroniseren</button>
        </div>

        <div class="p20-pp-toolbar">
          <input id="productPageSearch" type="search" placeholder="Zoek peptide…" />
          <select id="productPageFilter">
            <option value="all">Alle productpagina’s</option>
            <option value="with-image">Met shopminiatuur</option>
            <option value="without-image">Zonder shopminiatuur</option>
            <option value="featured">Featured</option>
            <option value="hidden">Verborgen</option>
          </select>
          <span id="productPageCount"></span>
        </div>

        <div id="productPageGrid" class="p20-pp-grid"></div>
        <div id="productPageEmpty" class="admin-empty" hidden>Geen productpagina’s gevonden.</div>
      </div>
    `;
    productPanel.insertAdjacentElement('afterend',panel);

    const backdrop=document.createElement('div');
    backdrop.id='productPageBackdrop';
    backdrop.className='p20-pp-backdrop';

    const modal=document.createElement('aside');
    modal.id='productPageModal';
    modal.className='p20-pp-modal';
    modal.setAttribute('aria-hidden','true');
    modal.innerHTML=`
      <div class="p20-pp-modal-head">
        <div>
          <span class="p20-pp-kicker">PRODUCT PAGE</span>
          <h3 id="productPageModalTitle">Product</h3>
          <div id="productPageVariantSummary" class="p20-pp-variant-summary"></div>
        </div>
        <button id="closeProductPageModal" class="icon-btn" type="button" aria-label="Sluiten">×</button>
      </div>

      <div class="p20-pp-modal-scroll">
        <section class="p20-pp-variants">
          <div class="p20-pp-section-head">
            <div>
              <span>STERKTES & FOTO'S</span>
              <h4>Afbeelding per variant</h4>
              <p>Elke sterkte kan zijn eigen vialfoto krijgen. Die afbeelding wisselt automatisch mee op de productpagina.</p>
            </div>
            <strong id="variantCountBadge">0</strong>
          </div>
          <div id="variantPhotoStatus" class="p20-pp-status">Varianten laden…</div>
          <div id="variantPhotoGrid" class="p20-variant-grid"></div>
          <input id="variantPhotoFile" type="file" accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" hidden />
        </section>

        <section class="p20-pp-main-editor">
          <div class="p20-pp-shop-image">
            <span class="p20-pp-field-label">SHOPMINIATUUR / FALLBACK</span>
            <div id="shopImagePreview" class="p20-pp-shop-preview"></div>
            <input id="shopImageFile" type="file" accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" hidden />
            <div class="p20-pp-image-actions">
              <button id="chooseShopImage" class="admin-btn primary" type="button">Shopminiatuur uploaden</button>
              <button id="removeShopImage" class="admin-btn danger" type="button">Verwijderen</button>
            </div>
            <small>Deze ene foto verschijnt in de shoplijst en wordt gebruikt als fallback wanneer een sterkte nog geen eigen foto heeft.</small>
          </div>

          <div class="p20-pp-fields">
            <label class="admin-field wide">Technische productnaam
              <input id="ppSourceName" readonly />
            </label>
            <label class="admin-field">Weergavenaam NL
              <input id="ppNameNl" />
            </label>
            <label class="admin-field">Display name EN
              <input id="ppNameEn" />
            </label>
            <label class="admin-field">Categorie
              <input id="ppCategory" />
            </label>
            <label class="admin-field">Slug
              <input id="ppSlug" readonly />
            </label>
            <label class="admin-field wide">Korte omschrijving NL
              <textarea id="ppDescNl" rows="3"></textarea>
            </label>
            <label class="admin-field wide">Short description EN
              <textarea id="ppDescEn" rows="3"></textarea>
            </label>
            <label class="admin-field wide">Research info NL
              <textarea id="ppResearchNl" rows="6"></textarea>
            </label>
            <label class="admin-field wide">Research info EN
              <textarea id="ppResearchEn" rows="6"></textarea>
            </label>
            <label class="admin-field">Alt-tekst shopfoto NL
              <input id="ppAltNl" />
            </label>
            <label class="admin-field">Image alt text EN
              <input id="ppAltEn" />
            </label>
            <label class="admin-field">Zichtbaarheid
              <select id="ppActive">
                <option value="true">Actief</option>
                <option value="false">Verborgen</option>
              </select>
            </label>
            <label class="admin-field">Featured
              <select id="ppFeatured">
                <option value="false">Nee</option>
                <option value="true">Ja</option>
              </select>
            </label>
          </div>
        </section>
      </div>

      <div class="p20-pp-modal-actions">
        <a id="previewProductPage" class="admin-btn" target="_blank" rel="noopener noreferrer">Preview ↗</a>
        <button id="cancelProductPage" class="admin-btn" type="button">Annuleren</button>
        <button id="saveProductPage" class="admin-btn primary" type="button">Opslaan</button>
      </div>
    `;

    document.body.append(backdrop,modal);

    tab.addEventListener('click',async()=>{
      document.querySelectorAll('.admin-tab').forEach(x=>x.classList.toggle('active',x===tab));
      document.querySelectorAll('.admin-panel').forEach(x=>x.classList.toggle('active',x===panel));
      await loadAll();
    });

    $('#productPageSearch').addEventListener('input',renderGrid);
    $('#productPageFilter').addEventListener('change',renderGrid);
    $('#syncProductPages').addEventListener('click',syncCatalogue);
    $('#productPageGrid').addEventListener('click',e=>{
      const card=e.target.closest('[data-product-page-slug]');
      if(card)openEditor(card.dataset.productPageSlug);
    });

    $('#closeProductPageModal').addEventListener('click',closeEditor);
    $('#cancelProductPage').addEventListener('click',closeEditor);
    backdrop.addEventListener('click',closeEditor);
    document.addEventListener('keydown',e=>{
      if(e.key==='Escape'&&modal.classList.contains('open'))closeEditor();
    });

    $('#chooseShopImage').addEventListener('click',()=>$('#shopImageFile').click());
    $('#shopImageFile').addEventListener('change',handleShopFile);
    $('#removeShopImage').addEventListener('click',()=>{
      shopFile=null;
      removeShopImage=true;
      $('#shopImageFile').value='';
      renderShopPreview();
    });

    $('#variantPhotoGrid').addEventListener('click',handleVariantAction);
    $('#variantPhotoFile').addEventListener('change',handleVariantFile);

    $('#saveProductPage').addEventListener('click',saveCompound);
  }

  async function loadAll(){
    const grid=$('productPageGrid');
    if(!grid)return;

    if(!await authorised()){
      grid.innerHTML='<div class="admin-empty">Log eerst in als PURE20 admin.</div>';
      return;
    }

    const [compoundRes,productRes]=await Promise.all([
      client().from('pure20_compounds').select('*').order('sort_order',{ascending:true}).order('product_name',{ascending:true}),
      client().from('pure20_products')
        .select('id,product_name,variant,code,sort_order,active,image_url,image_alt_nl,image_alt_en')
        .order('sort_order',{ascending:true})
    ]);

    if(compoundRes.error){
      grid.innerHTML=`<div class="admin-empty">${esc(compoundRes.error.message)}</div>`;
      return;
    }
    if(productRes.error){
      grid.innerHTML=`<div class="admin-empty">${esc(productRes.error.message)}</div>`;
      return;
    }

    compounds=compoundRes.data||[];
    variantsByProduct=new Map();

    for(const v of productRes.data||[]){
      if(!variantsByProduct.has(v.product_name))variantsByProduct.set(v.product_name,[]);
      variantsByProduct.get(v.product_name).push(v);
    }

    renderGrid();
  }

  function filteredCompounds(){
    const q=String($('#productPageSearch')?.value||'').trim().toLowerCase();
    const mode=$('#productPageFilter')?.value||'all';

    return compounds.filter(c=>{
      const text=`${c.product_name} ${c.display_name_nl||''} ${c.display_name_en||''} ${c.category||''}`.toLowerCase();
      const search=!q||text.includes(q);
      const filter=
        mode==='all' ||
        (mode==='with-image'&&c.image_url) ||
        (mode==='without-image'&&!c.image_url) ||
        (mode==='featured'&&c.featured) ||
        (mode==='hidden'&&!c.active);
      return search&&filter;
    });
  }

  function renderGrid(){
    const rows=filteredCompounds();
    $('#productPageCount').textContent=`${rows.length} / ${compounds.length}`;
    $('#productPageEmpty').hidden=rows.length>0;

    $('#productPageGrid').innerHTML=rows.map(c=>{
      const vars=variantsByProduct.get(c.product_name)||[];
      const activeVariants=vars.filter(v=>v.active!==false);
      const withPhotos=vars.filter(v=>safeUrl(v.image_url)).length;
      return `
        <article class="p20-pp-item ${c.active?'':'is-hidden'}" data-product-page-slug="${esc(c.slug)}">
          <div class="p20-pp-thumb">
            ${safeUrl(c.image_url)
              ? `<img src="${esc(c.image_url)}" alt="${esc(c.image_alt_nl||shownName(c))}">`
              : `<span>GEEN<br>FOTO</span>`}
          </div>
          <div class="p20-pp-item-copy">
            <div class="p20-pp-item-meta">
              <span>${esc(c.category||'Other')}</span>
              <span>${activeVariants.length} varianten</span>
            </div>
            <h3>${esc(shownName(c))}</h3>
            <p>${esc(c.short_description_nl||'Nog geen korte omschrijving.')}</p>
            <div class="p20-pp-badges">
              <span>${withPhotos}/${vars.length} VARIANTFOTO'S</span>
              ${c.image_url?'<span>SHOPFOTO</span>':'<span class="muted">GEEN SHOPFOTO</span>'}
              ${c.active?'<span>ACTIEF</span>':'<span class="muted">VERBORGEN</span>'}
            </div>
          </div>
          <span class="p20-pp-chevron">›</span>
        </article>
      `;
    }).join('');
  }

  function clearShopPreview(){
    if(shopPreviewUrl){
      URL.revokeObjectURL(shopPreviewUrl);
      shopPreviewUrl='';
    }
  }

  function renderShopPreview(){
    clearShopPreview();
    const box=$('shopImagePreview');
    if(!box||!selected)return;

    if(shopFile){
      shopPreviewUrl=URL.createObjectURL(shopFile);
      box.innerHTML=`<img src="${shopPreviewUrl}" alt="Nieuwe shopfoto">`;
      $('#removeShopImage').disabled=false;
      return;
    }

    if(selected.image_url&&!removeShopImage){
      box.innerHTML=`<img src="${esc(selected.image_url)}" alt="${esc(selected.image_alt_nl||shownName(selected))}">`;
      $('#removeShopImage').disabled=false;
      return;
    }

    box.innerHTML='<span>GEEN SHOPFOTO</span>';
    $('#removeShopImage').disabled=true;
  }

  function renderVariants(){
    const vars=variantsByProduct.get(selected?.product_name)||[];

    $('#variantCountBadge').textContent=String(vars.length);
    $('#productPageVariantSummary').textContent=`${vars.length} ${vars.length===1?'sterkte':'sterktes'}`;
    $('#variantPhotoStatus').textContent=vars.length
      ? `${vars.length} ${vars.length===1?'variant':'varianten'} beschikbaar`
      : 'Geen varianten gevonden.';

    $('#variantPhotoGrid').innerHTML=vars.map(v=>{
      const url=safeUrl(v.image_url);
      return `
        <article class="p20-variant-card ${v.active===false?'is-hidden':''}" data-variant-id="${esc(v.id)}">
          <div class="p20-variant-preview">
            ${url
              ? `<img src="${esc(url)}" alt="${esc(v.image_alt_nl||defaultVariantAlt(v))}">`
              : '<span>GEEN FOTO</span>'}
          </div>
          <div class="p20-variant-copy">
            <div class="p20-variant-meta">
              ${v.code?`<span>${esc(v.code)}</span>`:''}
              ${v.active===false?'<span>VERBORGEN</span>':''}
              ${url?'<span class="has-photo">FOTO</span>':''}
            </div>
            <strong>${esc(variantName(v))}</strong>
          </div>
          <div class="p20-variant-actions">
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

  function openEditor(slug){
    selected=compounds.find(c=>c.slug===slug);
    if(!selected)return;

    shopFile=null;
    removeShopImage=false;
    $('#shopImageFile').value='';

    $('#productPageModalTitle').textContent=shownName(selected);
    $('#ppSourceName').value=selected.product_name||'';
    $('#ppNameNl').value=selected.display_name_nl||'';
    $('#ppNameEn').value=selected.display_name_en||'';
    $('#ppCategory').value=selected.category||'';
    $('#ppSlug').value=selected.slug||'';
    $('#ppDescNl').value=selected.short_description_nl||'';
    $('#ppDescEn').value=selected.short_description_en||'';
    $('#ppResearchNl').value=selected.research_summary_nl||'';
    $('#ppResearchEn').value=selected.research_summary_en||'';
    $('#ppAltNl').value=selected.image_alt_nl||'';
    $('#ppAltEn').value=selected.image_alt_en||'';
    $('#ppActive').value=String(selected.active!==false);
    $('#ppFeatured').value=String(Boolean(selected.featured));

    $('#previewProductPage').href=`/product?slug=${encodeURIComponent(selected.slug)}`;

    renderVariants();
    renderShopPreview();

    $('#productPageBackdrop').classList.add('open');
    $('#productPageModal').classList.add('open');
    $('#productPageModal').setAttribute('aria-hidden','false');
    document.body.classList.add('p20-pp-open');
  }

  function closeEditor(){
    clearShopPreview();
    shopFile=null;
    removeShopImage=false;
    selectedVariant=null;
    selected=null;

    $('#productPageBackdrop')?.classList.remove('open');
    $('#productPageModal')?.classList.remove('open');
    $('#productPageModal')?.setAttribute('aria-hidden','true');
    document.body.classList.remove('p20-pp-open');
  }

  function validateImage(file){
    if(!file)return 'Geen bestand geselecteerd.';
    if(!['image/jpeg','image/png','image/webp'].includes(file.type))return 'Gebruik JPG, PNG of WEBP.';
    if(Number(file.size||0)>5*1024*1024)return 'De afbeelding mag maximaal 5 MB zijn.';
    return '';
  }

  function handleShopFile(){
    const file=$('#shopImageFile').files?.[0]||null;
    const error=validateImage(file);
    if(error){alert(error);$('#shopImageFile').value='';return}
    shopFile=file;
    removeShopImage=false;
    renderShopPreview();
  }

  async function handleVariantAction(e){
    const button=e.target.closest('[data-variant-action]');
    if(!button||button.disabled)return;

    const card=button.closest('[data-variant-id]');
    const vars=variantsByProduct.get(selected?.product_name)||[];
    const v=vars.find(x=>String(x.id)===String(card?.dataset.variantId));
    if(!v)return;

    if(button.dataset.variantAction==='upload'){
      selectedVariant=v;
      $('#variantPhotoFile').value='';
      $('#variantPhotoFile').click();
      return;
    }

    if(button.dataset.variantAction==='remove'){
      if(confirm(`Foto verwijderen voor ${variantName(v)}?`)){
        await removeVariantPhoto(v);
      }
    }
  }

  async function handleVariantFile(){
    const file=$('#variantPhotoFile').files?.[0]||null;
    const error=validateImage(file);
    if(error){alert(error);return}
    if(!selectedVariant)return;
    await uploadVariantPhoto(selectedVariant,file);
  }

  function storagePathFromUrl(value){
    try{
      const u=new URL(String(value||''));
      const marker='/storage/v1/object/public/pure20-products/';
      const i=u.pathname.indexOf(marker);
      return i<0?'':decodeURIComponent(u.pathname.slice(i+marker.length));
    }catch(_){ return ''; }
  }

  async function deleteStorage(url){
    const path=storagePathFromUrl(url);
    if(!path)return;
    const {error}=await client().storage.from(BUCKET).remove([path]);
    if(error)console.warn('Afbeelding kon niet uit Storage verwijderd worden:',error.message);
  }

  async function uploadStorage(file,path){
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

  async function uploadVariantPhoto(v,file){
    const grid=$('variantPhotoGrid');
    grid.classList.add('is-busy');
    const oldUrl=String(v.image_url||'');

    try{
      const path=`variants/${slugify(v.product_name)}/${slugify(v.id)}/${Date.now()}-${slugify(file.name||'variant.webp')}`;
      const url=await uploadStorage(file,path);
      const alt=defaultVariantAlt(v);

      const {error}=await client().from('pure20_products').update({
        image_url:url,
        image_alt_nl:alt,
        image_alt_en:alt,
        updated_at:new Date().toISOString()
      }).eq('id',v.id);
      if(error)throw error;

      if(oldUrl&&oldUrl!==url)await deleteStorage(oldUrl);

      v.image_url=url;
      v.image_alt_nl=alt;
      v.image_alt_en=alt;
      renderVariants();
      renderGrid();
    }catch(err){
      console.error(err);
      alert(`Foto uploaden mislukt: ${err.message||err}`);
    }finally{
      grid.classList.remove('is-busy');
      selectedVariant=null;
    }
  }

  async function removeVariantPhoto(v){
    const oldUrl=String(v.image_url||'');
    try{
      const {error}=await client().from('pure20_products').update({
        image_url:null,
        image_alt_nl:null,
        image_alt_en:null,
        updated_at:new Date().toISOString()
      }).eq('id',v.id);
      if(error)throw error;

      if(oldUrl)await deleteStorage(oldUrl);

      v.image_url=null;
      v.image_alt_nl=null;
      v.image_alt_en=null;
      renderVariants();
      renderGrid();
    }catch(err){
      console.error(err);
      alert(`Foto verwijderen mislukt: ${err.message||err}`);
    }
  }

  async function saveCompound(){
    if(!selected)return;

    const button=$('saveProductPage');
    const oldImage=String(selected.image_url||'');
    let newImage=removeShopImage?'':oldImage;

    button.disabled=true;
    button.textContent=shopFile?'Foto uploaden…':'Opslaan…';

    try{
      if(shopFile){
        const path=`covers/${slugify(selected.slug)}/${Date.now()}-${slugify(shopFile.name||'cover.webp')}`;
        newImage=await uploadStorage(shopFile,path);
      }

      const payload={
        display_name_nl:$('#ppNameNl').value.trim()||null,
        display_name_en:$('#ppNameEn').value.trim()||null,
        category:$('#ppCategory').value.trim()||'Other',
        image_url:newImage||null,
        image_alt_nl:$('#ppAltNl').value.trim()||null,
        image_alt_en:$('#ppAltEn').value.trim()||null,
        short_description_nl:$('#ppDescNl').value.trim()||null,
        short_description_en:$('#ppDescEn').value.trim()||null,
        research_summary_nl:$('#ppResearchNl').value.trim()||null,
        research_summary_en:$('#ppResearchEn').value.trim()||null,
        active:$('#ppActive').value==='true',
        featured:$('#ppFeatured').value==='true',
        updated_at:new Date().toISOString()
      };

      const {error}=await client().from('pure20_compounds').update(payload).eq('slug',selected.slug);
      if(error)throw error;

      if(oldImage&&oldImage!==newImage)await deleteStorage(oldImage);

      Object.assign(selected,payload);
      shopFile=null;
      removeShopImage=false;
      renderShopPreview();
      renderGrid();

      button.textContent='Opgeslagen ✓';
      setTimeout(()=>{button.textContent='Opslaan'},1100);
    }catch(err){
      console.error(err);
      alert(`Kon productpagina niet opslaan: ${err.message||err}`);
      button.textContent='Opslaan';
    }finally{
      button.disabled=false;
    }
  }

  async function syncCatalogue(){
    const button=$('syncProductPages');
    button.disabled=true;
    button.textContent='Synchroniseren…';

    try{
      if(!await authorised())throw new Error('Geen admin-toegang.');

      const {data,error}=await client().from('pure20_products')
        .select('product_name,category,sort_order,active')
        .order('sort_order',{ascending:true});
      if(error)throw error;

      const grouped=new Map();
      for(const p of data||[]){
        if(!grouped.has(p.product_name)){
          grouped.set(p.product_name,{
            product_name:p.product_name,
            category:p.category||'Other',
            sort_order:Number(p.sort_order||1000),
            active:Boolean(p.active)
          });
        }
      }

      const existing=new Set(compounds.map(c=>c.product_name));
      const usedSlugs=new Set(compounds.map(c=>c.slug));
      const additions=[];

      for(const row of grouped.values()){
        if(existing.has(row.product_name))continue;
        let slug=makeSlug(row.product_name);
        const root=slug;
        let i=2;
        while(usedSlugs.has(slug))slug=`${root}-${i++}`;
        usedSlugs.add(slug);
        additions.push({slug,...row});
      }

      if(additions.length){
        const {error:insertError}=await client().from('pure20_compounds').insert(additions);
        if(insertError)throw insertError;
      }

      await loadAll();
      alert(additions.length
        ? `${additions.length} nieuwe productpagina('s) toegevoegd.`
        : 'Alles is al gesynchroniseerd.');
    }catch(err){
      console.error(err);
      alert(`Synchroniseren mislukt: ${err.message||err}`);
    }finally{
      button.disabled=false;
      button.textContent='Catalogus synchroniseren';
    }
  }

  async function boot(){
    if(!await waitForBase())return;
    inject();
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',boot,{once:true});
  }else{
    boot();
  }
})();