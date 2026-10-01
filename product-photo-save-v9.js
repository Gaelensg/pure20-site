(() => {
  'use strict';

  const PATH=(location.pathname.replace(/\/+$/,'')||'/').toLowerCase();
  if(PATH!=='/admin'&&PATH!=='/admin.html')return;

  const BUCKET='pure20-products';
  const $=id=>document.getElementById(id);

  let currentRow=null;
  let originalImageUrl='';
  let originalCoaUrlFromDb='';
  let removeImage=false;
  let objectPreviewUrl='';

  function client(){return window.PURE20_API?.client}

  function formProduct(){
    const id=String($('#prodId')?.value||'').trim();
    return {
      id:id || `product-${crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36)}`,
      product:String($('#prodName')?.value||'').trim(),
      variant:String($('#prodVariant')?.value||'').trim(),
      code:String($('#prodCode')?.value||'').trim(),
      category:String($('#prodCategory')?.value||'').trim()||'Other',
      unit:String($('#prodUnit')?.value||'').trim()||'vial',
      price:Math.max(0,Number($('#prodPrice')?.value)||0),
      stock:Math.max(0,Math.floor(Number($('#prodStock')?.value)||0)),
      order:Number($('#prodOrder')?.value)||1,
      badge:String($('#prodBadge')?.value||'').trim(),
      note:String($('#prodNote')?.value||'').trim(),
      coaUrl:String($('#prodCoaUrl')?.value||'').trim(),
      active:String($('#prodActive')?.value||'true')==='true'
    };
  }

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

  function clearObjectPreview(){
    if(objectPreviewUrl){
      URL.revokeObjectURL(objectPreviewUrl);
      objectPreviewUrl='';
    }
  }

  function renderPhoto(){
    const preview=$('prodImagePreviewV9');
    const status=$('prodImageStatusV9');
    const remove=$('removeProdImageV9');
    if(!preview||!status||!remove)return;

    clearObjectPreview();

    const file=$('prodImageFileV9')?.files?.[0]||null;
    const currentUrl=removeImage?'':safeUrl($('#prodImageUrlV9')?.value);

    if(file){
      objectPreviewUrl=URL.createObjectURL(file);
      preview.innerHTML=`<img src="${objectPreviewUrl}" alt="">`;
      status.textContent=`Nieuwe foto geselecteerd: ${file.name}. Druk op SAVE PRODUCT om te uploaden.`;
      remove.disabled=false;
      return;
    }

    if(currentUrl){
      preview.innerHTML=`<img src="${currentUrl}" alt="">`;
      status.textContent='Huidige productfoto. Kies een ander bestand om ze te vervangen.';
      remove.disabled=false;
      return;
    }

    preview.innerHTML='<span>GEEN FOTO</span>';
    status.textContent=removeImage
      ? 'De foto wordt verwijderd wanneer je op SAVE PRODUCT drukt.'
      : 'Geen productfoto gekoppeld. Kies een bestand en druk daarna op SAVE PRODUCT.';
    remove.disabled=true;
  }

  function validateImage(file){
    if(!file)return'';
    if(!['image/jpeg','image/png','image/webp'].includes(String(file.type||'').toLowerCase())){
      return'Gebruik JPG, PNG of WEBP.';
    }
    if(Number(file.size||0)>5*1024*1024){
      return'De afbeelding mag maximaal 5 MB zijn.';
    }
    return'';
  }

  async function findCurrentRow(){
    const f=formProduct();
    if(!client())return null;

    if(String($('#prodId')?.value||'').trim()){
      const {data,error}=await client().from('pure20_products')
        .select('id,product_name,variant,code,category,coa_url,image_url,image_alt_nl,image_alt_en')
        .eq('id',$('#prodId').value.trim())
        .maybeSingle();
      if(error)throw error;
      if(data)return data;
    }

    if(!f.product)return null;

    let q=client().from('pure20_products')
      .select('id,product_name,variant,code,category,coa_url,image_url,image_alt_nl,image_alt_en')
      .eq('product_name',f.product);

    if(f.variant)q=q.eq('variant',f.variant);
    if(f.code)q=q.eq('code',f.code);

    const {data,error}=await q.limit(2);
    if(error)throw error;
    return data?.[0]||null;
  }

  async function loadPhotoForOpenProduct(){
    currentRow=null;
    originalImageUrl='';
    originalCoaUrlFromDb='';
    removeImage=false;
    $('#prodImageFileV9').value='';
    $('#prodImageUrlV9').value='';
    $('#prodImageShopCoverV9').checked=false;
    renderPhoto();

    try{
      currentRow=await findCurrentRow();
      if(!currentRow)return;

      if(!String($('#prodId').value||'').trim()){
        $('#prodId').value=currentRow.id;
      }

      originalImageUrl=String(currentRow.image_url||'');
      originalCoaUrlFromDb=String(currentRow.coa_url||'');
      $('#prodImageUrlV9').value=originalImageUrl;

      const {data:compound,error}=await client().from('pure20_compounds')
        .select('image_url')
        .eq('product_name',currentRow.product_name)
        .maybeSingle();

      if(!error&&compound?.image_url&&originalImageUrl&&compound.image_url===originalImageUrl){
        $('#prodImageShopCoverV9').checked=true;
      }

      renderPhoto();
    }catch(err){
      console.error(err);
      $('#prodImageStatusV9').textContent=`Foto kon niet geladen worden: ${err.message||err}`;
    }
  }

  function storagePathFromUrl(url,bucket){
    try{
      const u=new URL(String(url||''));
      const marker=`/storage/v1/object/public/${bucket}/`;
      const i=u.pathname.indexOf(marker);
      return i<0?'':decodeURIComponent(u.pathname.slice(i+marker.length));
    }catch(_){return''}
  }

  async function deleteStorageUrl(url,bucket){
    const path=storagePathFromUrl(url,bucket);
    if(!path)return;
    const {error}=await client().storage.from(bucket).remove([path]);
    if(error)console.warn(`Kon oud bestand uit ${bucket} niet verwijderen:`,error.message);
  }

  async function uploadProductImage(file,p){
    const path=`variants/${slugify(p.product)}/${slugify(p.id)}/${Date.now()}-${slugify(file.name||'product.webp')}`;
    const {data,error}=await client().storage.from(BUCKET).upload(path,file,{
      cacheControl:'31536000',
      upsert:false,
      contentType:file.type
    });
    if(error)throw error;

    const pub=client().storage.from(BUCKET).getPublicUrl(data.path);
    const url=pub.data?.publicUrl||'';
    if(!url)throw new Error('De foto is geüpload maar er kon geen publieke URL worden gemaakt.');
    return url;
  }

  async function saveCompoundCover(productName,category,imageUrl,alt,enabled,oldImageUrl){
    const {data:existing,error:readError}=await client().from('pure20_compounds')
      .select('slug,product_name,image_url')
      .eq('product_name',productName)
      .maybeSingle();
    if(readError)throw readError;

    if(enabled&&imageUrl){
      if(existing){
        const {error}=await client().from('pure20_compounds').update({
          image_url:imageUrl,
          image_alt_nl:alt,
          image_alt_en:alt,
          updated_at:new Date().toISOString()
        }).eq('product_name',productName);
        if(error)throw error;
      }else{
        const {error}=await client().from('pure20_compounds').insert({
          slug:slugify(productName).replace(/\./g,'-'),
          product_name:productName,
          category:category||'Other',
          image_url:imageUrl,
          image_alt_nl:alt,
          image_alt_en:alt,
          active:true
        });
        if(error)throw error;
      }
      return;
    }

    // If the removed/replaced variant was the shop cover and the checkbox is off, clear it.
    if(existing?.image_url&&oldImageUrl&&existing.image_url===oldImageUrl&&(!imageUrl||oldImageUrl!==imageUrl)){
      const {error}=await client().from('pure20_compounds').update({
        image_url:null,
        image_alt_nl:null,
        image_alt_en:null,
        updated_at:new Date().toISOString()
      }).eq('product_name',productName);
      if(error)throw error;
    }
  }

  function closeProductModal(){
    $('#modalBackdrop')?.classList.remove('open');
    $('#productModal')?.classList.remove('open');
  }

  async function saveEverything(event){
    const button=event.target.closest('#saveProduct');
    if(!button)return;

    // Take over the existing Save Product action before admin.js handles it.
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    const p=formProduct();
    if(!p.product){
      alert('Product name is required.');
      return;
    }

    const imageFile=$('prodImageFileV9')?.files?.[0]||null;
    const imageProblem=validateImage(imageFile);
    if(imageProblem){
      alert(imageProblem);
      return;
    }

    const coaFile=$('prodCoaFile')?.files?.[0]||null;

    button.disabled=true;
    button.textContent=imageFile?'FOTO UPLOADEN & OPSLAAN…':'OPSLAAN…';

    try{
      // Refresh DB state once more before saving, in case this modal was opened via mobile shortcut.
      const dbRow=await findCurrentRow();
      if(dbRow){
        p.id=dbRow.id;
        originalImageUrl=String(dbRow.image_url||originalImageUrl||'');
        originalCoaUrlFromDb=String(dbRow.coa_url||originalCoaUrlFromDb||'');
      }

      let nextImageUrl=removeImage?'':(originalImageUrl||'');
      const alt=`PURE20 ${p.product} ${p.variant}`.trim();

      if(imageFile){
        nextImageUrl=await uploadProductImage(imageFile,p);
      }

      if(coaFile){
        const uploaded=await window.PURE20_API.adminUploadCoa(p,coaFile);
        p.coaUrl=uploaded.publicUrl;
      }

      // Save all standard product fields through the existing, proven API.
      await window.PURE20_API.adminUpsertProduct(p);

      // Save the exact variant image separately.
      const {error:imageUpdateError}=await client().from('pure20_products').update({
        image_url:nextImageUrl||null,
        image_alt_nl:nextImageUrl?alt:null,
        image_alt_en:nextImageUrl?alt:null,
        updated_at:new Date().toISOString()
      }).eq('id',p.id);
      if(imageUpdateError)throw imageUpdateError;

      await saveCompoundCover(
        p.product,
        p.category,
        nextImageUrl,
        alt,
        Boolean($('#prodImageShopCoverV9')?.checked),
        originalImageUrl
      );

      if(originalImageUrl&&originalImageUrl!==nextImageUrl){
        await deleteStorageUrl(originalImageUrl,BUCKET);
      }

      if(originalCoaUrlFromDb&&originalCoaUrlFromDb!==p.coaUrl){
        try{
          await window.PURE20_API.adminDeleteCoa(originalCoaUrlFromDb);
        }catch(err){
          console.warn('Oude COA kon niet verwijderd worden:',err);
        }
      }

      closeProductModal();

      // Robust refresh: guarantees the admin list and image state are re-read.
      location.reload();
    }catch(err){
      console.error(err);
      alert(`Opslaan mislukt: ${err.message||err}`);
      button.disabled=false;
      button.textContent='SAVE PRODUCT';
    }
  }

  function boot(){
    const modal=$('productModal');
    if(!modal||!$('#prodImageFileV9'))return;

    $('#prodImageFileV9').addEventListener('change',()=>{
      removeImage=false;
      renderPhoto();
    });

    $('#removeProdImageV9').addEventListener('click',()=>{
      $('#prodImageFileV9').value='';
      removeImage=true;
      $('#prodImageUrlV9').value='';
      $('#prodImageShopCoverV9').checked=false;
      renderPhoto();
    });

    const observer=new MutationObserver(()=>{
      if(modal.classList.contains('open')){
        setTimeout(loadPhotoForOpenProduct,100);
      }else{
        clearObjectPreview();
      }
    });
    observer.observe(modal,{attributes:true,attributeFilter:['class']});

    document.addEventListener('click',saveEverything,true);
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',boot,{once:true});
  }else{
    boot();
  }
})();