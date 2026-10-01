(() => {
  'use strict';
  const PATH=(location.pathname.replace(/\/+$/,'')||'/').toLowerCase();
  if(PATH!=='/admin'&&PATH!=='/admin.html')return;

  const $=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const BUCKET='pure20-products';

  let compounds=[];
  let productCounts=new Map();
  let selected=null;
  let selectedFile=null;
  let removeImage=false;
  let previewObjectUrl='';

  function slugify(value){
    return String(value||'file')
      .normalize('NFKD').replace(/[\u0300-\u036f]/g,'')
      .toLowerCase().replace(/[^a-z0-9._-]+/g,'-')
      .replace(/^-+|-+$/g,'').slice(0,90)||'file';
  }

  function client(){return window.PURE20_API?.client}

  async function waitForApi(){
    for(let i=0;i<100;i++){
      if(window.PURE20_API?.client)return true;
      await new Promise(r=>setTimeout(r,50));
    }
    return false;
  }

  function inject(){
    if($('panel-productpages'))return;

    const tabs=document.querySelector('.admin-tabs');
    const productPanel=$('panel-products');
    if(!tabs||!productPanel)return;

    const tab=document.createElement('button');
    tab.className='admin-tab';
    tab.dataset.tab='productpages';
    tab.type='button';
    tab.textContent='Product pages';
    tabs.insertBefore(tab,tabs.children[1]||null);

    const panel=document.createElement('section');
    panel.id='panel-productpages';
    panel.className='admin-panel';
    panel.innerHTML=`
      <div class="admin-card p20-compound-card">
        <div class="admin-card-head p20-compound-head">
          <div>
            <h2>Product pages</h2>
            <p class="admin-note">Eén foto en productpagina per peptide, ongeacht het aantal sterktes.</p>
          </div>
          <button id="syncCompounds" class="admin-btn" type="button">Catalogus synchroniseren</button>
        </div>

        <div class="p20-compound-toolbar">
          <input id="compoundSearch" type="search" placeholder="Zoek peptide…" />
          <select id="compoundFilter">
            <option value="all">Alle productpagina’s</option>
            <option value="with-image">Met foto</option>
            <option value="without-image">Zonder foto</option>
            <option value="featured">Featured</option>
            <option value="hidden">Verborgen</option>
          </select>
          <span id="compoundCount" class="p20-compound-count"></span>
        </div>

        <div id="compoundGrid" class="p20-compound-grid"></div>
        <div id="compoundEmpty" class="admin-empty" hidden>Geen productpagina’s gevonden.</div>
      </div>`;

    productPanel.insertAdjacentElement('afterend',panel);

    const backdrop=document.createElement('div');
    backdrop.id='compoundBackdrop';
    backdrop.className='p20-compound-backdrop';

    const modal=document.createElement('div');
    modal.id='compoundModal';
    modal.className='p20-compound-modal';
    modal.setAttribute('aria-hidden','true');
    modal.innerHTML=`
      <div class="p20-compound-modal-head">
        <div>
          <p class="eyebrow">PRODUCT PAGE</p>
          <h3 id="compoundModalTitle">Productpagina</h3>
        </div>
        <button id="closeCompoundModal" class="icon-btn" type="button" aria-label="Sluiten">×</button>
      </div>

      <div class="p20-compound-modal-scroll">
        <div class="p20-compound-editor">
          <section class="p20-compound-image-editor">
            <div id="compoundImagePreview" class="p20-compound-image-preview"></div>
            <input id="compoundImageFile" type="file" accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" hidden />
            <div class="p20-compound-image-actions">
              <button id="chooseCompoundImage" class="admin-btn primary" type="button">Foto uploaden</button>
              <button id="removeCompoundImage" class="admin-btn danger" type="button">Foto verwijderen</button>
            </div>
            <small>JPG, PNG of WEBP · max. 5 MB · dezelfde foto wordt als miniatuur én op de productpagina gebruikt.</small>
          </section>

          <section class="p20-compound-fields">
            <label class="admin-field wide">Technische productnaam
              <input id="compoundSourceName" readonly />
            </label>
            <label class="admin-field">Weergavenaam NL
              <input id="compoundNameNl" placeholder="bv. Retatrutide" />
            </label>
            <label class="admin-field">Display name EN
              <input id="compoundNameEn" placeholder="e.g. Retatrutide" />
            </label>
            <label class="admin-field">Categorie
              <input id="compoundCategory" />
            </label>
            <label class="admin-field">Slug
              <input id="compoundSlug" readonly />
            </label>
            <label class="admin-field wide">Korte omschrijving NL
              <textarea id="compoundDescNl" rows="3"></textarea>
            </label>
            <label class="admin-field wide">Short description EN
              <textarea id="compoundDescEn" rows="3"></textarea>
            </label>
            <label class="admin-field wide">Research info NL
              <textarea id="compoundResearchNl" rows="7" placeholder="Tekst die onderaan de productpagina verschijnt."></textarea>
            </label>
            <label class="admin-field wide">Research info EN
              <textarea id="compoundResearchEn" rows="7"></textarea>
            </label>
            <label class="admin-field">Alt-tekst foto NL
              <input id="compoundAltNl" />
            </label>
            <label class="admin-field">Image alt text EN
              <input id="compoundAltEn" />
            </label>
            <label class="admin-field">Zichtbaarheid
              <select id="compoundActive">
                <option value="true">Actief</option>
                <option value="false">Verborgen</option>
              </select>
            </label>
            <label class="admin-field">Featured
              <select id="compoundFeatured">
                <option value="false">Nee</option>
                <option value="true">Ja</option>
              </select>
            </label>
          </section>
        </div>
      </div>

      <div class="p20-compound-modal-actions">
        <a id="previewCompoundPage" class="admin-btn" target="_blank" rel="noopener noreferrer">Preview ↗</a>
        <button id="cancelCompoundEdit" class="admin-btn" type="button">Annuleren</button>
        <button id="saveCompound" class="admin-btn primary" type="button">Opslaan</button>
      </div>`;

    document.body.append(backdrop,modal);

    tab.addEventListener('click',async()=>{
      document.querySelectorAll('.admin-tab').forEach(x=>x.classList.toggle('active',x===tab));
      document.querySelectorAll('.admin-panel').forEach(x=>x.classList.toggle('active',x===panel));
      await load();
    });

    $('compoundSearch').addEventListener('input',render);
    $('compoundFilter').addEventListener('change',render);
    $('syncCompounds').addEventListener('click',syncWithCatalogue);
    $('compoundGrid').addEventListener('click',e=>{
      const card=e.target.closest('[data-compound-slug]');
      if(card)openEditor(card.dataset.compoundSlug);
    });

    $('closeCompoundModal').addEventListener('click',closeEditor);
    $('cancelCompoundEdit').addEventListener('click',closeEditor);
    backdrop.addEventListener('click',closeEditor);
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&modal.classList.contains('open'))closeEditor()});

    $('chooseCompoundImage').addEventListener('click',()=>$('compoundImageFile').click());
    $('compoundImageFile').addEventListener('change',handleImageSelection);
    $('removeCompoundImage').addEventListener('click',()=>{
      selectedFile=null;
      removeImage=true;
      $('compoundImageFile').value='';
      renderImagePreview();
    });
    $('saveCompound').addEventListener('click',save);
  }

  function activateOwnTab(){
    const tab=document.querySelector('.admin-tab[data-tab="productpages"]');
    const panel=$('panel-productpages');
    if(!tab||!panel)return;
    document.querySelectorAll('.admin-tab').forEach(x=>x.classList.toggle('active',x===tab));
    document.querySelectorAll('.admin-panel').forEach(x=>x.classList.toggle('active',x===panel));
  }

  async function authorised(){
    if(!await waitForApi())return false;
    try{
      const session=await window.PURE20_API.getSession();
      if(!session?.user)return false;
      return await window.PURE20_API.isAdmin();
    }catch(_){return false}
  }

  async function load(){
    if(!await authorised()){
      $('compoundGrid').innerHTML='<div class="admin-empty">Log eerst in als PURE20 admin.</div>';
      return;
    }
    const c=client();
    const [compoundRes,productRes]=await Promise.all([
      c.from('pure20_compounds').select('*').order('sort_order',{ascending:true}).order('product_name',{ascending:true}),
      c.from('pure20_products').select('product_name,active').order('product_name',{ascending:true})
    ]);
    if(compoundRes.error)throw compoundRes.error;
    if(productRes.error)throw productRes.error;

    compounds=compoundRes.data||[];
    productCounts=new Map();
    for(const p of productRes.data||[]){
      if(!p.active)continue;
      productCounts.set(p.product_name,(productCounts.get(p.product_name)||0)+1);
    }
    render();
  }

  function shownName(c){
    return String(c.display_name_nl||'').trim()||c.product_name;
  }

  function filtered(){
    const q=$('compoundSearch').value.trim().toLowerCase();
    const mode=$('compoundFilter').value;
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

  function fallback(c){
    return `<div class="p20-compound-card-fallback"><b>20.</b><span>${esc(shownName(c))}</span></div>`;
  }

  function render(){
    const rows=filtered();
    $('compoundCount').textContent=`${rows.length} / ${compounds.length}`;
    $('compoundEmpty').hidden=rows.length>0;
    $('compoundGrid').innerHTML=rows.map(c=>`
      <article class="p20-compound-item ${c.active?'':'is-hidden'}" data-compound-slug="${esc(c.slug)}">
        <div class="p20-compound-thumb">
          ${c.image_url?`<img src="${esc(c.image_url)}" alt="${esc(c.image_alt_nl||shownName(c))}">`:fallback(c)}
        </div>
        <div class="p20-compound-item-copy">
          <div class="p20-compound-item-top">
            <span>${esc(c.category||'Other')}</span>
            <span>${productCounts.get(c.product_name)||0} varianten</span>
          </div>
          <h3>${esc(shownName(c))}</h3>
          <p>${esc(c.short_description_nl||'Nog geen korte omschrijving.')}</p>
          <div class="p20-compound-badges">
            ${c.image_url?'<span>FOTO</span>':'<span class="muted">GEEN FOTO</span>'}
            ${c.featured?'<span>FEATURED</span>':''}
            ${c.active?'<span>ACTIEF</span>':'<span class="muted">VERBORGEN</span>'}
          </div>
        </div>
        <span class="p20-compound-chevron">›</span>
      </article>`).join('');
  }

  function clearPreviewObject(){
    if(previewObjectUrl){URL.revokeObjectURL(previewObjectUrl);previewObjectUrl=''}
  }

  function renderImagePreview(){
    const box=$('compoundImagePreview');
    clearPreviewObject();

    if(selectedFile){
      previewObjectUrl=URL.createObjectURL(selectedFile);
      box.innerHTML=`<img src="${previewObjectUrl}" alt="Nieuwe productfoto preview">`;
      $('removeCompoundImage').disabled=false;
      return;
    }

    if(selected?.image_url&&!removeImage){
      box.innerHTML=`<img src="${esc(selected.image_url)}" alt="${esc(selected.image_alt_nl||shownName(selected))}">`;
      $('removeCompoundImage').disabled=false;
      return;
    }

    box.innerHTML=selected?fallback(selected):'<div class="p20-compound-card-fallback"><b>20.</b></div>';
    $('removeCompoundImage').disabled=true;
  }

  function openEditor(slug){
    selected=compounds.find(c=>c.slug===slug);
    if(!selected)return;
    selectedFile=null;removeImage=false;$('compoundImageFile').value='';

    $('compoundModalTitle').textContent=shownName(selected);
    $('compoundSourceName').value=selected.product_name||'';
    $('compoundNameNl').value=selected.display_name_nl||'';
    $('compoundNameEn').value=selected.display_name_en||'';
    $('compoundCategory').value=selected.category||'';
    $('compoundSlug').value=selected.slug||'';
    $('compoundDescNl').value=selected.short_description_nl||'';
    $('compoundDescEn').value=selected.short_description_en||'';
    $('compoundResearchNl').value=selected.research_summary_nl||'';
    $('compoundResearchEn').value=selected.research_summary_en||'';
    $('compoundAltNl').value=selected.image_alt_nl||'';
    $('compoundAltEn').value=selected.image_alt_en||'';
    $('compoundActive').value=String(selected.active!==false);
    $('compoundFeatured').value=String(Boolean(selected.featured));

    const preview=$('previewCompoundPage');
    preview.href=`/product/${encodeURIComponent(selected.slug)}`;
    preview.classList.toggle('disabled-link',!selected.active);
    preview.title=selected.active?'Open publieke productpagina':'Deze productpagina is momenteel verborgen';

    renderImagePreview();
    $('compoundBackdrop').classList.add('open');
    $('compoundModal').classList.add('open');
    $('compoundModal').setAttribute('aria-hidden','false');
    document.body.classList.add('p20-compound-modal-open');
  }

  function closeEditor(){
    clearPreviewObject();
    selectedFile=null;selected=null;removeImage=false;
    $('compoundBackdrop')?.classList.remove('open');
    $('compoundModal')?.classList.remove('open');
    $('compoundModal')?.setAttribute('aria-hidden','true');
    document.body.classList.remove('p20-compound-modal-open');
  }

  function handleImageSelection(){
    const file=$('compoundImageFile').files?.[0]||null;
    if(!file){selectedFile=null;renderImagePreview();return}
    const allowed=['image/jpeg','image/png','image/webp'];
    if(!allowed.includes(file.type)){
      alert('Gebruik JPG, PNG of WEBP.');
      $('compoundImageFile').value='';return;
    }
    if(file.size>5*1024*1024){
      alert('De afbeelding mag maximaal 5 MB zijn.');
      $('compoundImageFile').value='';return;
    }
    selectedFile=file;removeImage=false;renderImagePreview();
  }

  function pathFromPublicUrl(value){
    try{
      const u=new URL(String(value||''));
      const marker='/storage/v1/object/public/pure20-products/';
      const i=u.pathname.indexOf(marker);
      return i<0?'':decodeURIComponent(u.pathname.slice(i+marker.length));
    }catch(_){return''}
  }

  async function deleteOldImage(url){
    const path=pathFromPublicUrl(url);
    if(!path)return;
    const {error}=await client().storage.from(BUCKET).remove([path]);
    if(error)console.warn('Oude productfoto kon niet worden verwijderd:',error.message);
  }

  async function uploadImage(file,slug){
    const name=`${slug}/${Date.now()}-${slugify(file.name||'product.webp')}`;
    const {data,error}=await client().storage.from(BUCKET).upload(name,file,{
      cacheControl:'31536000',
      upsert:false,
      contentType:file.type
    });
    if(error)throw error;
    const pub=client().storage.from(BUCKET).getPublicUrl(data.path);
    if(!pub.data?.publicUrl)throw new Error('Geen publieke URL voor de afbeelding ontvangen.');
    return pub.data.publicUrl;
  }

  async function save(){
    if(!selected)return;
    const button=$('saveCompound');
    const oldImage=selected.image_url||'';
    let newImage=removeImage?'':oldImage;

    button.disabled=true;button.textContent=selectedFile?'Foto uploaden…':'Opslaan…';
    try{
      if(selectedFile)newImage=await uploadImage(selectedFile,selected.slug);

      const payload={
        display_name_nl:$('compoundNameNl').value.trim()||null,
        display_name_en:$('compoundNameEn').value.trim()||null,
        category:$('compoundCategory').value.trim()||'Other',
        image_url:newImage||null,
        image_alt_nl:$('compoundAltNl').value.trim()||null,
        image_alt_en:$('compoundAltEn').value.trim()||null,
        short_description_nl:$('compoundDescNl').value.trim()||null,
        short_description_en:$('compoundDescEn').value.trim()||null,
        research_summary_nl:$('compoundResearchNl').value.trim()||null,
        research_summary_en:$('compoundResearchEn').value.trim()||null,
        active:$('compoundActive').value==='true',
        featured:$('compoundFeatured').value==='true',
        updated_at:new Date().toISOString()
      };

      const {error}=await client().from('pure20_compounds').update(payload).eq('slug',selected.slug);
      if(error)throw error;

      if(oldImage&&oldImage!==newImage)await deleteOldImage(oldImage);

      closeEditor();
      await load();
    }catch(err){
      console.error(err);
      alert(`Kon productpagina niet opslaan: ${err.message||err}`);
    }finally{
      button.disabled=false;button.textContent='Opslaan';
    }
  }

  function makeSlug(name){
    return String(name||'product')
      .normalize('NFKD').replace(/[\u0300-\u036f]/g,'')
      .toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'')||'product';
  }

  async function syncWithCatalogue(){
    const button=$('syncCompounds');
    button.disabled=true;button.textContent='Synchroniseren…';
    try{
      if(!await authorised())throw new Error('Geen admin-toegang.');
      const {data,error}=await client().from('pure20_products')
        .select('product_name,category,sort_order,active')
        .order('sort_order',{ascending:true});
      if(error)throw error;

      const grouped=new Map();
      for(const p of data||[]){
        if(!grouped.has(p.product_name))grouped.set(p.product_name,{
          product_name:p.product_name,
          category:p.category||'Other',
          sort_order:Number(p.sort_order||1000),
          active:Boolean(p.active)
        });
      }

      const existing=new Set(compounds.map(c=>c.product_name));
      const usedSlugs=new Set(compounds.map(c=>c.slug));
      const additions=[];

      for(const row of grouped.values()){
        if(existing.has(row.product_name))continue;
        let slug=makeSlug(row.product_name),base=slug,n=2;
        while(usedSlugs.has(slug))slug=`${base}-${n++}`;
        usedSlugs.add(slug);
        additions.push({slug,...row});
      }

      if(additions.length){
        const {error:insertError}=await client().from('pure20_compounds').insert(additions);
        if(insertError)throw insertError;
      }
      await load();
      alert(additions.length?`${additions.length} nieuwe productpagina('s) toegevoegd.`:'Alles is al gesynchroniseerd.');
    }catch(err){
      console.error(err);alert(`Synchroniseren mislukt: ${err.message||err}`);
    }finally{
      button.disabled=false;button.textContent='Catalogus synchroniseren';
    }
  }

  async function boot(){
    inject();
    // Loading is deferred until the tab is opened, so the normal admin login remains untouched.
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();