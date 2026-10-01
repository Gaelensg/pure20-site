(() => {
  'use strict';

  const PATH=(location.pathname.replace(/\/+$/,'')||'/').toLowerCase();
  if(PATH!=='/admin'&&PATH!=='/admin.html')return;

  const BUCKET='pure20-products';
  const $=id=>document.getElementById(id);

  let current=null;
  let compound=null;
  let previewUrl='';

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

  function defaultAlt(){
    const product=String($('#prodName')?.value||current?.product_name||'').trim();
    const variant=String($('#prodVariant')?.value||current?.variant||'').trim();
    return `PURE20 ${product} ${variant}`.trim();
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

      <input id="variantPhotoFile" class="hidden" type="file"
        accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" />

      <div class="variant-photo-actions">
        <button id="chooseVariantPhoto" class="admin-btn primary" type="button">Foto uploaden</button>
        <button id="makeVariantShopCover" class="admin-btn" type="button" disabled>Gebruik als shopminiatuur</button>
        <button id="removeVariantPhoto" class="admin-btn danger" type="button" disabled>Foto verwijderen</button>
      </div>

      <div id="variantPhotoStatus" class="variant-photo-status">
        Open een bestaand product om de foto te beheren.
      </div>

      <small class="admin-note">
        JPG, PNG of WEBP · max. 5 MB. Deze foto hoort bij deze exacte sterkte/variant.
      </small>
    `;

    coa.insertAdjacentElement('afterend',block);

    $('#chooseVariantPhoto').addEventListener('click',()=>{
      const id=String($('#prodId')?.value||'').trim();
      if(!id){
        alert('Sla het nieuwe product eerst één keer op. Daarna kun je een foto toevoegen.');
        return;
      }
      $('#variantPhotoFile').value='';
      $('#variantPhotoFile').click();
    });

    $('#variantPhotoFile').addEventListener('change',handleFile);
    $('#removeVariantPhoto').addEventListener('click',removePhoto);
    $('#makeVariantShopCover').addEventListener('click',makeShopCover);

    return true;
  }

  function clearObjectPreview(){
    if(previewUrl){
      URL.revokeObjectURL(previewUrl);
      previewUrl='';
    }
  }

  function render(){
    const preview=$('variantPhotoPreview');
    const status=$('variantPhotoStatus');
    const remove=$('removeVariantPhoto');
    const cover=$('makeVariantShopCover');
    const choose=$('chooseVariantPhoto');
    if(!preview||!status||!remove||!cover||!choose)return;

    clearObjectPreview();

    const id=String($('#prodId')?.value||'').trim();
    if(!id){
      preview.innerHTML='<span>NIEUW PRODUCT</span>';
      status.textContent='Sla het product eerst op. Daarna wordt foto-upload beschikbaar.';
      remove.disabled=true;
      cover.disabled=true;
      choose.textContent='Foto uploaden';
      return;
    }

    const url=safeUrl(current?.image_url);
    const isCover=Boolean(url&&compound?.image_url&&url===compound.image_url);

    if(url){
      preview.innerHTML=`<img src="${url}" alt="">`;
      choose.textContent='Foto vervangen';
      remove.disabled=false;
      cover.disabled=isCover;
      cover.textContent=isCover?'Shopminiatuur ✓':'Gebruik als shopminiatuur';
      status.textContent=isCover
        ? 'Deze variant heeft een eigen foto en is momenteel ook de shopminiatuur.'
        : 'Deze variant heeft een eigen foto.';
    }else{
      preview.innerHTML='<span>GEEN FOTO</span>';
      choose.textContent='Foto uploaden';
      remove.disabled=true;
      cover.disabled=true;
      cover.textContent='Gebruik als shopminiatuur';
      status.textContent='Nog geen productfoto gekoppeld aan deze sterkte.';
    }
  }

  async function load(){
    if(!inject())return;

    const id=String($('#prodId')?.value||'').trim();
    current=null;
    compound=null;

    if(!id||!client()){
      render();
      return;
    }

    $('#variantPhotoStatus').textContent='Foto laden…';

    try{
      const {data,error}=await client().from('pure20_products')
        .select('id,product_name,variant,category,image_url,image_alt_nl,image_alt_en')
        .eq('id',id)
        .maybeSingle();

      if(error)throw error;
      current=data||null;

      if(current?.product_name){
        const {data:c,error:ce}=await client().from('pure20_compounds')
          .select('slug,product_name,image_url,image_alt_nl,image_alt_en')
          .eq('product_name',current.product_name)
          .maybeSingle();
        if(ce)console.warn('Shopminiatuur kon niet gelezen worden:',ce.message);
        compound=c||null;
      }

      render();
    }catch(err){
      console.error(err);
      $('#variantPhotoStatus').textContent=`Kon productfoto niet laden: ${err.message||err}`;
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

  async function uploadStorage(file,id){
    const product=String($('#prodName')?.value||current?.product_name||'product').trim();
    const path=`variants/${slugify(product)}/${slugify(id)}/${Date.now()}-${slugify(file.name||'photo.webp')}`;

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

  async function handleFile(){
    const file=$('variantPhotoFile').files?.[0]||null;
    const problem=validate(file);
    if(problem){alert(problem);return}

    const id=String($('#prodId')?.value||'').trim();
    if(!id){alert('Sla het product eerst op.');return}

    const button=$('chooseVariantPhoto');
    const oldUrl=String(current?.image_url||'');

    button.disabled=true;
    button.textContent='Uploaden…';
    $('#variantPhotoStatus').textContent='Productfoto uploaden…';

    try{
      const url=await uploadStorage(file,id);
      const alt=defaultAlt();

      const {error}=await client().from('pure20_products').update({
        image_url:url,
        image_alt_nl:alt,
        image_alt_en:alt,
        updated_at:new Date().toISOString()
      }).eq('id',id);
      if(error)throw error;

      if(oldUrl&&oldUrl!==url)await deleteStorage(oldUrl);

      current={...(current||{}),image_url:url,image_alt_nl:alt,image_alt_en:alt};

      // If this peptide has no shop cover yet, use the first uploaded variant automatically.
      if(current?.product_name){
        await ensureCompound();
        if(compound&&!safeUrl(compound.image_url)){
          await setCompoundCover(url,alt);
        }
      }

      render();
    }catch(err){
      console.error(err);
      alert(`Foto uploaden mislukt: ${err.message||err}`);
      $('#variantPhotoStatus').textContent=`Upload mislukt: ${err.message||err}`;
    }finally{
      button.disabled=false;
    }
  }

  async function ensureCompound(){
    if(compound||!current?.product_name)return compound;

    const name=current.product_name;
    const {data,error}=await client().from('pure20_compounds')
      .select('slug,product_name,image_url,image_alt_nl,image_alt_en')
      .eq('product_name',name)
      .maybeSingle();
    if(error)throw error;

    if(data){
      compound=data;
      return compound;
    }

    let slug=slugify(name).replace(/\./g,'-');
    const payload={
      slug,
      product_name:name,
      category:current.category||String($('#prodCategory')?.value||'Other').trim()||'Other',
      active:true
    };

    const {data:created,error:createError}=await client().from('pure20_compounds')
      .insert(payload)
      .select('slug,product_name,image_url,image_alt_nl,image_alt_en')
      .single();

    if(createError)throw createError;
    compound=created;
    return compound;
  }

  async function setCompoundCover(url,alt){
    await ensureCompound();
    if(!compound)return;

    const {error}=await client().from('pure20_compounds').update({
      image_url:url,
      image_alt_nl:alt,
      image_alt_en:alt,
      updated_at:new Date().toISOString()
    }).eq('product_name',current.product_name);

    if(error)throw error;

    compound={...compound,image_url:url,image_alt_nl:alt,image_alt_en:alt};
  }

  async function makeShopCover(){
    const url=safeUrl(current?.image_url);
    if(!url)return;

    const button=$('makeVariantShopCover');
    button.disabled=true;
    button.textContent='Instellen…';

    try{
      await setCompoundCover(url,current.image_alt_nl||defaultAlt());
      render();
    }catch(err){
      console.error(err);
      alert(`Shopminiatuur instellen mislukt: ${err.message||err}`);
      button.disabled=false;
      button.textContent='Gebruik als shopminiatuur';
    }
  }

  async function removePhoto(){
    const id=String($('#prodId')?.value||'').trim();
    const oldUrl=safeUrl(current?.image_url);
    if(!id||!oldUrl)return;

    if(!confirm('Deze productfoto verwijderen?'))return;

    const wasCover=Boolean(compound?.image_url&&oldUrl===compound.image_url);

    try{
      const {error}=await client().from('pure20_products').update({
        image_url:null,
        image_alt_nl:null,
        image_alt_en:null,
        updated_at:new Date().toISOString()
      }).eq('id',id);
      if(error)throw error;

      if(wasCover&&current?.product_name){
        const {error:coverError}=await client().from('pure20_compounds').update({
          image_url:null,
          image_alt_nl:null,
          image_alt_en:null,
          updated_at:new Date().toISOString()
        }).eq('product_name',current.product_name);
        if(coverError)throw coverError;

        compound={...(compound||{}),image_url:null,image_alt_nl:null,image_alt_en:null};
      }

      await deleteStorage(oldUrl);
      current={...(current||{}),image_url:null,image_alt_nl:null,image_alt_en:null};
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
        setTimeout(load,40);
      }else{
        current=null;
        compound=null;
        clearObjectPreview();
      }
    });

    observer.observe(modal,{attributes:true,attributeFilter:['class']});
  }

  function boot(){
    if(!inject())return;
    watchModal();

    // Extra safety for the mobile row-click shortcut.
    document.addEventListener('click',e=>{
      const row=e.target.closest('#productsBody tr[data-id]');
      if(row)setTimeout(()=>{
        if($('#productModal')?.classList.contains('open'))load();
      },80);
    });
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',boot,{once:true});
  }else{
    boot();
  }
})();