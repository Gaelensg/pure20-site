(() => {
  'use strict';

  const PATH=(location.pathname.replace(/\/+$/,'')||'/').toLowerCase();
  if(PATH!=='/admin'&&PATH!=='/admin.html')return;

  const BUCKET='pure20-products';
  const $=id=>document.getElementById(id);

  let current=null;
  let compound=null;

  function client(){return window.PURE20_API?.client}

  function safeUrl(value){
    const raw=String(value||'').trim();
    if(!raw)return'';
    try{
      const u=new URL(raw,location.href);
      return ['http:','https:'].includes(u.protocol)?u.href:'';
    }catch(_){return''}
  }

  function slugify(value){
    return String(value||'file')
      .normalize('NFKD').replace(/[\u0300-\u036f]/g,'')
      .toLowerCase().replace(/[^a-z0-9._-]+/g,'-')
      .replace(/^-+|-+$/g,'').slice(0,100)||'file';
  }

  function formIdentity(){
    return {
      id:String($('#prodId')?.value||'').trim(),
      product:String($('#prodName')?.value||'').trim(),
      variant:String($('#prodVariant')?.value||'').trim(),
      code:String($('#prodCode')?.value||'').trim(),
      category:String($('#prodCategory')?.value||'').trim()
    };
  }

  function defaultAlt(){
    const f=formIdentity();
    return `PURE20 ${f.product||current?.product_name||''} ${f.variant||current?.variant||''}`.trim();
  }

  function inject(){
    if($('#variantPhotoAdminField'))return true;

    const coa=document.querySelector('#productForm .coa-admin-field');
    if(!coa)return false;

    const block=document.createElement('div');
    block.id='variantPhotoAdminField';
    block.className='admin-field wide variant-photo-admin-field';
    block.innerHTML=`
      <span>PRODUCTFOTO</span>

      <div id="variantPhotoPreview" class="variant-photo-preview">
        <span>GEEN FOTO</span>
      </div>

      <input id="variantPhotoFile" class="variant-photo-file-input" type="file"
        accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" />

      <div class="variant-photo-actions">
        <label id="chooseVariantPhoto" for="variantPhotoFile" class="admin-btn primary variant-photo-picker">
          Foto uploaden
        </label>
        <button id="makeVariantShopCover" class="admin-btn" type="button" disabled>
          Gebruik als shopminiatuur
        </button>
        <button id="removeVariantPhoto" class="admin-btn danger" type="button" disabled>
          Foto verwijderen
        </button>
      </div>

      <div id="variantPhotoStatus" class="variant-photo-status">
        Variant wordt gekoppeld…
      </div>

      <small class="admin-note">
        JPG, PNG of WEBP · max. 5 MB. Deze foto hoort bij deze exacte sterkte/variant.
      </small>
    `;

    coa.insertAdjacentElement('afterend',block);

    $('#variantPhotoFile').addEventListener('change',handleFile);
    $('#removeVariantPhoto').addEventListener('click',removePhoto);
    $('#makeVariantShopCover').addEventListener('click',makeShopCover);

    return true;
  }

  async function resolveCurrent(){
    if(!client())throw new Error('Databaseverbinding niet beschikbaar.');

    const f=formIdentity();

    // Preferred path: exact database id from the existing admin form.
    if(f.id){
      const {data,error}=await client().from('pure20_products')
        .select('id,product_name,variant,code,category,image_url,image_alt_nl,image_alt_en')
        .eq('id',f.id)
        .maybeSingle();
      if(error)throw error;
      if(data){
        current=data;
        return data;
      }
    }

    // iPhone/admin fallback: resolve the exact variant by its visible form fields.
    if(!f.product)throw new Error('Geen productnaam gevonden.');

    let q=client().from('pure20_products')
      .select('id,product_name,variant,code,category,image_url,image_alt_nl,image_alt_en')
      .eq('product_name',f.product);

    if(f.variant)q=q.eq('variant',f.variant);
    if(f.code)q=q.eq('code',f.code);

    const {data,error}=await q.limit(3);
    if(error)throw error;

    if(!data?.length){
      throw new Error(`Variant niet gevonden: ${f.product}${f.variant?' · '+f.variant:''}`);
    }

    current=data[0];

    // Backfill the hidden form id so later operations use the canonical id.
    if($('#prodId')&&!$('#prodId').value){
      $('#prodId').value=current.id;
    }

    return current;
  }

  async function loadCompound(){
    compound=null;
    if(!current?.product_name)return;

    const {data,error}=await client().from('pure20_compounds')
      .select('slug,product_name,image_url,image_alt_nl,image_alt_en')
      .eq('product_name',current.product_name)
      .maybeSingle();

    if(error)console.warn('Shopminiatuur kon niet gelezen worden:',error.message);
    compound=data||null;
  }

  function render(){
    const preview=$('variantPhotoPreview');
    const status=$('variantPhotoStatus');
    const remove=$('removeVariantPhoto');
    const cover=$('makeVariantShopCover');
    const picker=$('chooseVariantPhoto');
    if(!preview||!status||!remove||!cover||!picker)return;

    if(!current){
      preview.innerHTML='<span>GEEN FOTO</span>';
      status.textContent='Variant wordt gekoppeld…';
      remove.disabled=true;
      cover.disabled=true;
      picker.textContent='Foto uploaden';
      return;
    }

    const url=safeUrl(current.image_url);
    const isCover=Boolean(url&&compound?.image_url&&url===compound.image_url);

    if(url){
      preview.innerHTML=`<img src="${url}" alt="">`;
      picker.textContent='Foto vervangen';
      remove.disabled=false;
      cover.disabled=isCover;
      cover.textContent=isCover?'Shopminiatuur ✓':'Gebruik als shopminiatuur';
      status.textContent=`Gekoppeld aan ${current.product_name} · ${current.variant||current.code||'variant'}.`;
    }else{
      preview.innerHTML='<span>GEEN FOTO</span>';
      picker.textContent='Foto uploaden';
      remove.disabled=true;
      cover.disabled=true;
      cover.textContent='Gebruik als shopminiatuur';
      status.textContent=`Klaar voor upload: ${current.product_name} · ${current.variant||current.code||'variant'}.`;
    }
  }

  async function load(){
    if(!inject())return;
    current=null;
    compound=null;
    render();

    try{
      await resolveCurrent();
      await loadCompound();
      render();
    }catch(err){
      console.error(err);
      $('#variantPhotoStatus').textContent=`Kon variant niet koppelen: ${err.message||err}`;
    }
  }

  function validate(file){
    if(!file)return'Geen bestand geselecteerd.';
    if(!['image/jpeg','image/png','image/webp'].includes(file.type))return'Gebruik JPG, PNG of WEBP.';
    if(file.size>5*1024*1024)return'De afbeelding mag maximaal 5 MB zijn.';
    return'';
  }

  function storagePathFromUrl(value){
    try{
      const u=new URL(String(value||''));
      const marker='/storage/v1/object/public/pure20-products/';
      const i=u.pathname.indexOf(marker);
      return i<0?'':decodeURIComponent(u.pathname.slice(i+marker.length));
    }catch(_){return''}
  }

  async function deleteStorage(url){
    const path=storagePathFromUrl(url);
    if(!path)return;
    const {error}=await client().storage.from(BUCKET).remove([path]);
    if(error)console.warn('Oude productfoto kon niet verwijderd worden:',error.message);
  }

  async function uploadStorage(file){
    if(!current?.id)await resolveCurrent();
    const path=`variants/${slugify(current.product_name)}/${slugify(current.id)}/${Date.now()}-${slugify(file.name||'photo.webp')}`;

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

  async function ensureCompound(){
    if(compound)return compound;
    if(!current)await resolveCurrent();

    const {data,error}=await client().from('pure20_compounds')
      .select('slug,product_name,image_url,image_alt_nl,image_alt_en')
      .eq('product_name',current.product_name)
      .maybeSingle();
    if(error)throw error;

    if(data){
      compound=data;
      return data;
    }

    const slug=slugify(current.product_name).replace(/\./g,'-');
    const {data:created,error:createError}=await client().from('pure20_compounds')
      .insert({
        slug,
        product_name:current.product_name,
        category:current.category||formIdentity().category||'Other',
        active:true
      })
      .select('slug,product_name,image_url,image_alt_nl,image_alt_en')
      .single();

    if(createError)throw createError;
    compound=created;
    return created;
  }

  async function setCompoundCover(url,alt){
    await ensureCompound();

    const {error}=await client().from('pure20_compounds').update({
      image_url:url,
      image_alt_nl:alt,
      image_alt_en:alt,
      updated_at:new Date().toISOString()
    }).eq('product_name',current.product_name);

    if(error)throw error;
    compound={...compound,image_url:url,image_alt_nl:alt,image_alt_en:alt};
  }

  async function handleFile(){
    const input=$('variantPhotoFile');
    const file=input.files?.[0]||null;
    const problem=validate(file);
    if(problem){
      if(file)alert(problem);
      input.value='';
      return;
    }

    $('#variantPhotoStatus').textContent='Productfoto uploaden…';

    try{
      if(!current)await resolveCurrent();

      const oldUrl=safeUrl(current.image_url);
      const url=await uploadStorage(file);
      const alt=defaultAlt();

      const {error}=await client().from('pure20_products').update({
        image_url:url,
        image_alt_nl:alt,
        image_alt_en:alt,
        updated_at:new Date().toISOString()
      }).eq('id',current.id);

      if(error)throw error;

      if(oldUrl&&oldUrl!==url)await deleteStorage(oldUrl);

      current={...current,image_url:url,image_alt_nl:alt,image_alt_en:alt};

      await loadCompound();

      // First uploaded variant becomes the shop thumbnail if none exists yet.
      if(!safeUrl(compound?.image_url)){
        await setCompoundCover(url,alt);
      }

      render();
    }catch(err){
      console.error(err);
      alert(`Foto uploaden mislukt: ${err.message||err}`);
      $('#variantPhotoStatus').textContent=`Upload mislukt: ${err.message||err}`;
    }finally{
      input.value='';
    }
  }

  async function makeShopCover(){
    try{
      if(!current)await resolveCurrent();
      const url=safeUrl(current.image_url);
      if(!url)return;

      const button=$('makeVariantShopCover');
      button.disabled=true;
      button.textContent='Instellen…';

      await setCompoundCover(url,current.image_alt_nl||defaultAlt());
      render();
    }catch(err){
      console.error(err);
      alert(`Shopminiatuur instellen mislukt: ${err.message||err}`);
      render();
    }
  }

  async function removePhoto(){
    try{
      if(!current)await resolveCurrent();
      const oldUrl=safeUrl(current.image_url);
      if(!oldUrl)return;
      if(!confirm('Deze productfoto verwijderen?'))return;

      const wasCover=Boolean(compound?.image_url&&oldUrl===compound.image_url);

      const {error}=await client().from('pure20_products').update({
        image_url:null,
        image_alt_nl:null,
        image_alt_en:null,
        updated_at:new Date().toISOString()
      }).eq('id',current.id);
      if(error)throw error;

      if(wasCover){
        const {error:coverError}=await client().from('pure20_compounds').update({
          image_url:null,
          image_alt_nl:null,
          image_alt_en:null,
          updated_at:new Date().toISOString()
        }).eq('product_name',current.product_name);
        if(coverError)throw coverError;
        compound={...compound,image_url:null,image_alt_nl:null,image_alt_en:null};
      }

      await deleteStorage(oldUrl);
      current={...current,image_url:null,image_alt_nl:null,image_alt_en:null};
      render();
    }catch(err){
      console.error(err);
      alert(`Foto verwijderen mislukt: ${err.message||err}`);
    }
  }

  function watchModal(){
    const modal=$('productModal');
    if(!modal)return;

    const observer=new MutationObserver(()=>{
      if(modal.classList.contains('open')){
        // Give admin.js time to populate product, variant and code.
        setTimeout(load,120);
      }else{
        current=null;
        compound=null;
      }
    });

    observer.observe(modal,{attributes:true,attributeFilter:['class']});
  }

  function boot(){
    if(!inject())return;
    watchModal();

    document.addEventListener('click',e=>{
      if(e.target.closest('#productsBody tr[data-id]')){
        setTimeout(()=>{
          if($('#productModal')?.classList.contains('open'))load();
        },180);
      }
    });
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',boot,{once:true});
  }else{
    boot();
  }
})();