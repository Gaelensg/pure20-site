(async () => {
  'use strict';

  const $ = id => document.getElementById(id);
  const customerFields = ['fullName','address','zip','country','email','phone'];

  const I18N = {
    nl: {
      documentTitle:'PURE20. — Stel je box samen',
      description:'Stel je PURE20 researchbox samen met vier producten.',
      eyebrow:'PURE20 / BOX SAMENSTELLEN',
      heroAside:'BOX<br>VOORDEEL',
      sectionEyebrow:'JOUW BOX',
      sectionTitle:'Kies er vier.',
      chooseProducts:n=>`Kies ${n} producten`,
      savePct:n=>`Bespaar ${n}%`,
      freeShipping:'Gratis verzending',
      searchLabel:'Zoek in de catalogus',
      searchPlaceholder:'Zoek product, sterkte of code',
      clearSearch:'Zoekopdracht wissen',
      products:'producten',
      options:'opties',
      noMatches:'Geen resultaten.',
      noMatchesText:'Probeer een ander product, sterkte of code.',
      note:'De boxkorting wordt alleen toegepast wanneer alle plaatsen zijn gevuld. Voor deze actie is geen kortingscode nodig.',
      selected:'GESELECTEERD',
      regular:'NORMAAL',
      youSave:'JE BESPAART',
      boxTotal:'BOXTOTAAL',
      reviewBox:'Bekijk box →',
      remaining:n=>`nog ${n} te kiezen`,
      emptySlot:'Selecteer product +',
      removeProduct:'Verwijder',
      optionOne:'OPTIE',
      optionMany:'OPTIES',
      all:'Alle',
      inStock:'OP VOORRAAD',
      orderable:'BESTELBAAR',
      pricePending:'Prijs volgt',
      per:'per',
      inBox:'IN BOX',
      addAnother:'+ NOG EEN',
      addToBox:'+ TOEVOEGEN',
      boxComplete:'Je box is al compleet.',
      chooseFirst:n=>`Kies eerst ${n} producten.`,
      completeFirst:'Maak eerst je box compleet.',
      confirmFirst:'Bevestig eerst de melding.',
      drawerTitle:'Bekijk je box',
      selectedProducts:'Geselecteerde producten',
      emptyBox:'Je box is nog leeg.',
      details:'Gegevens',
      savedDevice:'Opgeslagen op dit toestel',
      fullName:'Volledige naam',
      address:'Adres',
      addressPlaceholder:'Straat en huisnummer',
      postalCode:'Postcode',
      country:'Land',
      countryPlaceholder:'België',
      email:'E-mail',
      phone:'Telefoon',
      boxBenefit:'Boxvoordeel',
      boxDiscount:n=>`Boxkorting · ${n}%`,
      shipping:'Verzending',
      free:'Gratis',
      retailSubtotal:'Normale prijs',
      confirmText:'Ik begrijp dat beschikbaarheid, verzending en betaling afzonderlijk worden bevestigd.',
      copyOrder:'Bestelling kopiëren',
      orderHeader:'PURE20. BOXBESTELLING',
      orderRetail:'Normale prijs',
      orderDiscount:n=>`Boxkorting (${n}%)`,
      orderTotal:'BOXTOTAAL',
      customerDetails:'KLANTGEGEVENS',
      name:'Naam',
      copied:'Boxbestelling gekopieerd.',
      catalogueUpdated:'Catalogus bijgewerkt.'
    },
    en: {
      documentTitle:'PURE20. — Build a Box',
      description:'Build your PURE20 research box with four products.',
      eyebrow:'PURE20 / BUILD A BOX',
      heroAside:'BOX<br>ADVANTAGE',
      sectionEyebrow:'YOUR BOX',
      sectionTitle:'Choose four.',
      chooseProducts:n=>`Choose ${n} products`,
      savePct:n=>`Save ${n}%`,
      freeShipping:'Free shipping',
      searchLabel:'Search catalogue',
      searchPlaceholder:'Search product, strength or code',
      clearSearch:'Clear search',
      products:'products',
      options:'options',
      noMatches:'No matches.',
      noMatchesText:'Try another product, strength or code.',
      note:'The box discount only applies when every slot is filled. No coupon code is required for this offer.',
      selected:'SELECTED',
      regular:'RETAIL',
      youSave:'YOU SAVE',
      boxTotal:'BOX TOTAL',
      reviewBox:'Review box →',
      remaining:n=>`${n} to go`,
      emptySlot:'Select product +',
      removeProduct:'Remove',
      optionOne:'OPTION',
      optionMany:'OPTIONS',
      all:'All',
      inStock:'IN STOCK',
      orderable:'ORDERABLE',
      pricePending:'Price pending',
      per:'per',
      inBox:'IN BOX',
      addAnother:'+ ADD ANOTHER',
      addToBox:'+ ADD TO BOX',
      boxComplete:'Your box is already complete.',
      chooseFirst:n=>`Choose ${n} products first.`,
      completeFirst:'Complete your box first.',
      confirmFirst:'Confirm the notice first.',
      drawerTitle:'Review your box',
      selectedProducts:'Selected products',
      emptyBox:'Your box is still empty.',
      details:'Details',
      savedDevice:'Saved on this device',
      fullName:'Full name',
      address:'Address',
      addressPlaceholder:'Street and house number',
      postalCode:'Postal code',
      country:'Country',
      countryPlaceholder:'Belgium',
      email:'Email',
      phone:'Phone',
      boxBenefit:'Box advantage',
      boxDiscount:n=>`Build a Box · ${n}%`,
      shipping:'Shipping',
      free:'Free',
      retailSubtotal:'Retail subtotal',
      confirmText:'I understand availability, shipping and payment are confirmed separately.',
      copyOrder:'Copy order',
      orderHeader:'PURE20. BUILD A BOX ORDER',
      orderRetail:'Retail subtotal',
      orderDiscount:n=>`Build a Box (${n}%)`,
      orderTotal:'BOX TOTAL',
      customerDetails:'CUSTOMER DETAILS',
      name:'Name',
      copied:'Box order copied.',
      catalogueUpdated:'Catalogue updated.'
    }
  };

  const state = {
    store: window.PURE20_FALLBACK_STORE,
    selected: {},
    category: 'All',
    query: '',
    source: 'demo'
  };

  const els = {
    eyebrow:$('boxEyebrow'), title:$('boxTitle'), subtitle:$('boxSubtitle'), heroDiscount:$('boxHeroDiscount'),
    heroAside:$('boxHeroAside'), benefitCount:$('boxBenefitCount'), benefitDiscount:$('boxBenefitDiscount'),
    benefitShipping:$('boxBenefitShipping'), sectionEyebrow:$('boxSectionEyebrow'), sectionTitle:$('boxSectionTitle'),
    progressLabel:$('boxProgressLabel'), progressFill:$('boxProgressFill'), slots:$('boxSlots'),
    search:$('boxSearch'), searchLabel:$('boxSearchLabel'), clearSearch:$('boxClearSearch'), categories:$('boxCategories'),
    catalogue:$('boxCatalogue'), empty:$('boxEmpty'), emptyTitle:$('boxEmptyTitle'), emptyText:$('boxEmptyText'),
    productCount:$('boxProductCount'), variantCount:$('boxVariantCount'), productsWord:$('boxProductsWord'), optionsWord:$('boxOptionsWord'),
    note:$('boxNote'), bottomSelectedLabel:$('boxBottomSelectedLabel'), bottomRetailLabel:$('boxBottomRetailLabel'),
    bottomSavingsLabel:$('boxBottomSavingsLabel'), bottomTotalLabel:$('boxBottomTotalLabel'), bottomCount:$('boxBottomCount'),
    retailTotal:$('boxRetailTotal'), savings:$('boxSavings'), total:$('boxTotal'), review:$('boxReview'),
    drawer:$('orderDrawer'), backdrop:$('drawerBackdrop'), closeDrawer:$('closeDrawer'), drawerTitle:$('boxDrawerTitle'),
    drawerItemsTitle:$('boxDrawerItemsTitle'), orderLines:$('orderLines'), drawerEmpty:$('drawerEmpty'),
    drawerDetailsTitle:$('boxDrawerDetailsTitle'), savedDevice:$('boxSavedDevice'),
    fullNameLabel:$('boxFullNameLabel'), addressLabel:$('boxAddressLabel'), postalLabel:$('boxPostalLabel'),
    countryLabel:$('boxCountryLabel'), emailLabel:$('boxEmailLabel'), phoneLabel:$('boxPhoneLabel'),
    benefitDrawerTitle:$('boxBenefitDrawerTitle'), drawerSubtotal:$('drawerSubtotal'), drawerDiscount:$('drawerDiscount'),
    drawerShipping:$('drawerShipping'), drawerTotal:$('drawerTotal'), drawerDiscountLabel:$('boxDrawerDiscountLabel'),
    shippingLabel:$('boxShippingLabel'), retailSubtotalLabel:$('boxRetailSubtotalLabel'), drawerTotalLabel:$('boxDrawerTotalLabel'),
    confirmText:$('boxConfirmText'), researchConfirm:$('researchConfirm'), copyOrder:$('copyOrder'),
    whatsappOrder:$('whatsappOrder'), toast:$('toast')
  };

  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const lang = () => window.PURE20_I18N?.language || (localStorage.getItem('pure20_language') === 'en' ? 'en' : 'nl');
  const tx = key => I18N[lang()][key];
  const config = () => {
    const b = state.store?.settings?.buildBox || {};
    const l = lang();
    return {
      enabled: b.enabled !== false,
      size: Math.max(1, Number(b.size || 4)),
      discountPct: Math.max(0, Math.min(100, Number(b.discountPct || 15))),
      freeShipping: b.freeShipping !== false,
      title: l === 'en' ? (b.titleEn || 'Build your box.') : (b.titleNl || b.title || 'Stel je box samen.'),
      subtitle: l === 'en'
        ? (b.subtitleEn || 'Choose 4 priced products. Save 15% and get free shipping.')
        : (b.subtitleNl || b.subtitle || 'Kies 4 geprijsde producten. Krijg 15% korting en gratis verzending.')
    };
  };

  const money = value => `${state.store?.settings?.currencySymbol || '€'}${Number(value || 0).toFixed(2)}`;
  const activeProducts = () => (state.store?.products || []).filter(p => p.active).sort((a,b) => {
    const pc = String(a.product).localeCompare(String(b.product), lang()==='nl'?'nl':'en', {sensitivity:'base',numeric:true});
    return pc || String(a.variant).localeCompare(String(b.variant), lang()==='nl'?'nl':'en', {sensitivity:'base',numeric:true});
  });
  const selectedCount = () => Object.values(state.selected).reduce((sum,q) => sum + Number(q || 0), 0);
  const productById = id => activeProducts().find(p => p.id === id);
  const selectedLines = () => Object.entries(state.selected).map(([id,qty]) => ({product:productById(id),qty:Number(qty||0)})).filter(x => x.product && x.qty > 0);

  function localizedCategory(value){
    if(value === 'All') return tx('all');
    return window.PURE20_I18N?.mapText?.(value, lang()) || value;
  }

  function totals(){
    const c = config();
    const count = selectedCount();
    const retail = selectedLines().reduce((sum,line) => sum + line.qty * Number(line.product.price || 0), 0);
    const complete = count === c.size;
    const discount = complete ? retail * c.discountPct / 100 : 0;
    return {count,retail,complete,discount,total:Math.max(0,retail-discount)};
  }

  function toast(message){
    els.toast.textContent = message;
    els.toast.classList.add('show');
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => els.toast.classList.remove('show'),1800);
  }

  function renderStaticLanguage(){
    const c=config(), l=lang(), d=I18N[l];
    document.documentElement.lang=l;
    document.title=d.documentTitle;
    document.querySelector('meta[name="description"]')?.setAttribute('content',d.description);

    els.eyebrow.textContent=d.eyebrow;
    els.title.textContent=c.title;
    els.subtitle.textContent=c.subtitle;
    els.heroDiscount.textContent=`${c.discountPct}%`;
    els.heroAside.innerHTML=d.heroAside;
    els.benefitCount.textContent=d.chooseProducts(c.size);
    els.benefitDiscount.textContent=d.savePct(c.discountPct);
    els.benefitShipping.textContent=d.freeShipping;
    els.sectionEyebrow.textContent=d.sectionEyebrow;
    els.sectionTitle.textContent=d.sectionTitle;
    els.searchLabel.textContent=d.searchLabel;
    els.search.placeholder=d.searchPlaceholder;
    els.clearSearch.setAttribute('aria-label',d.clearSearch);
    els.productsWord.textContent=d.products;
    els.optionsWord.textContent=d.options;
    els.emptyTitle.textContent=d.noMatches;
    els.emptyText.textContent=d.noMatchesText;
    els.note.textContent=d.note;
    els.bottomSelectedLabel.textContent=d.selected;
    els.bottomRetailLabel.textContent=d.regular;
    els.bottomSavingsLabel.textContent=d.youSave;
    els.bottomTotalLabel.textContent=d.boxTotal;
    els.drawerTitle.textContent=d.drawerTitle;
    els.closeDrawer.setAttribute('aria-label', l==='nl'?'Sluiten':'Close');
    els.drawerItemsTitle.textContent=d.selectedProducts;
    els.drawerEmpty.textContent=d.emptyBox;
    els.drawerDetailsTitle.textContent=d.details;
    els.savedDevice.textContent=d.savedDevice;
    els.fullNameLabel.textContent=d.fullName;
    $('fullName').placeholder=d.fullName;
    els.addressLabel.textContent=d.address;
    $('address').placeholder=d.addressPlaceholder;
    els.postalLabel.textContent=d.postalCode;
    els.countryLabel.textContent=d.country;
    $('country').placeholder=d.countryPlaceholder;
    els.emailLabel.textContent=d.email;
    els.phoneLabel.textContent=d.phone;
    els.benefitDrawerTitle.textContent=d.boxBenefit;
    els.drawerDiscountLabel.textContent=d.boxDiscount(c.discountPct);
    els.shippingLabel.textContent=d.shipping;
    els.retailSubtotalLabel.textContent=d.retailSubtotal;
    els.drawerTotalLabel.textContent=d.boxTotal;
    els.confirmText.textContent=d.confirmText;
    els.copyOrder.textContent=d.copyOrder;
  }

  function expandedSelection(){
    const out=[];
    for(const {product,qty} of selectedLines()) for(let i=0;i<qty;i++) out.push(product);
    return out;
  }

  function renderSlots(){
    const c=config(), selected=expandedSelection(), d=I18N[lang()];
    els.slots.innerHTML=Array.from({length:c.size},(_,i)=>{
      const p=selected[i];
      if(!p) return `<article class="box-slot"><span class="box-slot-index">${String(i+1).padStart(2,'0')}</span><div class="box-slot-empty">${d.emptySlot}</div></article>`;
      return `<article class="box-slot filled"><span class="box-slot-index">${String(i+1).padStart(2,'0')}</span><button class="box-slot-remove" type="button" data-remove-id="${esc(p.id)}" aria-label="${d.removeProduct} ${esc(p.product)} ${esc(p.variant)}">×</button><div class="box-slot-product"><strong>${esc(p.product)}</strong><span>${esc(p.variant)} · ${esc(p.code)}</span></div><div class="box-slot-price">${money(p.price)}</div></article>`;
    }).join('');
  }

  function categories(){ return ['All',...new Set(activeProducts().map(p=>p.category).filter(Boolean))]; }
  function renderCategories(){
    const cats=categories();
    if(!cats.includes(state.category)) state.category='All';
    els.categories.innerHTML=cats.map(c=>`<button class="pill ${c===state.category?'active':''}" type="button" data-category="${esc(c)}">${esc(localizedCategory(c))}</button>`).join('');
  }

  function filteredProducts(){
    const q=state.query.trim().toLowerCase();
    return activeProducts().filter(p=>{
      const cat=state.category==='All'||p.category===state.category;
      const text=`${p.product} ${p.variant} ${p.code} ${p.category}`.toLowerCase();
      return cat&&(!q||text.includes(q));
    });
  }

  function renderCatalogue(){
    const rows=filteredProducts(), groups=new Map(), c=config(), count=selectedCount(), d=I18N[lang()];
    rows.forEach(p=>{if(!groups.has(p.product))groups.set(p.product,[]);groups.get(p.product).push(p)});
    els.catalogue.innerHTML=[...groups].map(([name,variants])=>`<section class="box-product-group"><div class="box-product-heading"><h3>${esc(name)}</h3><span>${variants.length} ${variants.length===1?d.optionOne:d.optionMany}</span></div>${variants.map(p=>{
      const inBox=Number(state.selected[p.id]||0), priced=Number(p.price||0)>0, full=count>=c.size;
      return `<article class="box-variant ${priced?'':'disabled'}" data-id="${esc(p.id)}"><div class="box-variant-main"><strong>${esc(p.variant)}</strong><small>${esc(p.code)} · ${Number(p.stock||0)>0?d.inStock:d.orderable}</small>${inBox?`<span class="box-in-count">${d.inBox} × ${inBox}</span>`:''}</div><div class="box-variant-price"><strong>${priced?money(p.price):d.pricePending}</strong><span>${d.per} ${esc(p.unit||'vial')}</span></div><button class="box-add-button" type="button" data-add-id="${esc(p.id)}" ${!priced||full?'disabled':''}>${inBox?d.addAnother:d.addToBox}</button></article>`;
    }).join('')}</section>`).join('');
    els.empty.hidden=rows.length>0;
    els.productCount.textContent=String(new Set(activeProducts().map(p=>p.product)).size);
    els.variantCount.textContent=String(activeProducts().length);
  }

  function renderSummary(){
    const c=config(), t=totals(), d=I18N[lang()];
    els.progressLabel.textContent=`${t.count} / ${c.size}`;
    els.progressFill.style.width=`${Math.min(100,(t.count/c.size)*100)}%`;
    els.bottomCount.textContent=`${t.count} / ${c.size}`;
    els.retailTotal.textContent=money(t.retail);
    els.savings.textContent=money(t.discount);
    els.total.textContent=money(t.total);
    els.review.disabled=!t.complete;
    els.review.textContent=t.complete?d.reviewBox:d.remaining(c.size-t.count);
    els.drawerSubtotal.textContent=money(t.retail);
    els.drawerDiscount.textContent=`-${money(t.discount)}`;
    els.drawerShipping.textContent=c.freeShipping&&t.complete?d.free:money(Number(state.store?.settings?.shippingFlat||0));
    els.drawerTotal.textContent=money(t.total);
    els.drawerEmpty.hidden=t.count>0;
    els.orderLines.innerHTML=selectedLines().map(({product,qty})=>{
      const discountedUnit=Number(product.price)*(1-c.discountPct/100);
      const lineTotal=t.complete?qty*discountedUnit:qty*Number(product.price);
      return `<div class="order-line" data-id="${esc(product.id)}"><div><div class="order-line-name">${esc(product.product)} / ${esc(product.variant)}</div><div class="order-line-meta">${esc(product.code)} · ${qty} × ${money(product.price)}</div></div><div class="order-line-right"><div class="order-line-total">${money(lineTotal)}</div></div></div>`;
    }).join('');
  }

  function renderAll(){
    renderStaticLanguage();
    renderSlots();
    renderCategories();
    renderCatalogue();
    renderSummary();
  }

  function add(id){
    const c=config(), p=productById(id), d=I18N[lang()];
    if(!p||Number(p.price||0)<=0)return;
    if(selectedCount()>=c.size){toast(d.boxComplete);return}
    state.selected[id]=Number(state.selected[id]||0)+1;
    renderAll();
  }

  function removeOne(id){
    const current=Number(state.selected[id]||0);
    if(current<=1) delete state.selected[id]; else state.selected[id]=current-1;
    renderAll();
  }

  function saveCustomer(){
    const d=Object.fromEntries(customerFields.map(id=>[id,$(id)?.value||'']));
    localStorage.setItem('pure20_customer_v4',JSON.stringify(d));
  }
  function loadCustomer(){
    try{const d=JSON.parse(localStorage.getItem('pure20_customer_v4')||'{}');customerFields.forEach(id=>{if(typeof d[id]==='string'&&$(id))$(id).value=d[id]})}catch(_){}
  }

  function openDrawer(){
    const d=I18N[lang()];
    if(!totals().complete){toast(d.chooseFirst(config().size));return}
    renderSummary();
    els.backdrop.hidden=false;
    requestAnimationFrame(()=>els.backdrop.classList.add('visible'));
    els.drawer.classList.add('open');
    els.drawer.setAttribute('aria-hidden','false');
    document.body.style.overflow='hidden';
  }
  function closeDrawer(){
    els.drawer.classList.remove('open');
    els.drawer.setAttribute('aria-hidden','true');
    els.backdrop.classList.remove('visible');
    document.body.style.overflow='';
    setTimeout(()=>{if(!els.drawer.classList.contains('open'))els.backdrop.hidden=true},220);
  }

  function canShare(){
    const d=I18N[lang()];
    if(!totals().complete){toast(d.completeFirst);return false}
    if(!els.researchConfirm.checked){toast(d.confirmFirst);return false}
    saveCustomer();
    return true;
  }

  function orderText(){
    const c=config(),t=totals(),d=I18N[lang()],cust=Object.fromEntries(customerFields.map(id=>[id,$(id)?.value?.trim()||'-']));
    return [
      d.orderHeader,'',
      ...selectedLines().map(({product,qty})=>`${qty} × ${product.product} ${product.variant} (${product.code}) — ${money(qty*Number(product.price))}`),
      '',
      `${d.orderRetail}: ${money(t.retail)}`,
      `${d.orderDiscount(c.discountPct)}: -${money(t.discount)}`,
      `${d.shipping}: ${c.freeShipping?d.free:money(Number(state.store?.settings?.shippingFlat||0))}`,
      `${d.orderTotal}: ${money(t.total)}`,
      '',
      d.customerDetails,
      `${d.name}: ${cust.fullName}`,
      `${d.address}: ${cust.address}`,
      `${d.postalCode}: ${cust.zip}`,
      `${d.country}: ${cust.country}`,
      `${d.email}: ${cust.email}`,
      `${d.phone}: ${cust.phone}`,
      '',
      d.confirmText
    ].join('\n');
  }

  async function copyOrder(){
    if(!canShare())return;
    const text=orderText();
    try{await navigator.clipboard.writeText(text)}catch(_){const ta=document.createElement('textarea');ta.value=text;document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove()}
    toast(I18N[lang()].copied);
  }

  function whatsappOrder(){
    if(!canShare())return;
    const n=String(state.store?.settings?.whatsappNumber||'').replace(/\D/g,'');
    const text=encodeURIComponent(orderText());
    window.open(n?`https://wa.me/${n}?text=${text}`:`https://wa.me/?text=${text}`,'_blank','noopener');
  }

  async function loadStore(showToast=false){
    try{
      const {store,source}=await window.PURE20_API.loadPublicStore();
      state.store=store;state.source=source;
      const ids=new Set(activeProducts().map(p=>p.id));
      Object.keys(state.selected).forEach(id=>{if(!ids.has(id)||Number(productById(id)?.price||0)<=0)delete state.selected[id]});
      renderAll();
      if(showToast)toast(I18N[lang()].catalogueUpdated);
    }catch(err){
      console.error(err);
      state.store=window.PURE20_API.normalizeStore(window.PURE20_FALLBACK_STORE);
      renderAll();
    }
  }

  els.search.addEventListener('input',e=>{state.query=e.target.value;renderCatalogue()});
  els.clearSearch.addEventListener('click',()=>{state.query='';els.search.value='';renderCatalogue();els.search.focus()});
  els.categories.addEventListener('click',e=>{const b=e.target.closest('[data-category]');if(!b)return;state.category=b.dataset.category;renderCategories();renderCatalogue()});
  els.catalogue.addEventListener('click',e=>{const b=e.target.closest('[data-add-id]');if(b)add(b.dataset.addId)});
  els.slots.addEventListener('click',e=>{const b=e.target.closest('[data-remove-id]');if(b)removeOne(b.dataset.removeId)});
  els.review.addEventListener('click',openDrawer);
  els.closeDrawer.addEventListener('click',closeDrawer);
  els.backdrop.addEventListener('click',closeDrawer);
  els.copyOrder.addEventListener('click',copyOrder);
  els.whatsappOrder.addEventListener('click',whatsappOrder);
  customerFields.forEach(id=>$(id)?.addEventListener('change',saveCustomer));

  window.addEventListener('pure20:languagechange',()=>renderAll());
  window.addEventListener('pure20:i18nready',()=>renderAll());

  loadCustomer();
  await loadStore(false);
  window.PURE20_API.subscribePublic(()=>loadStore(true));
})();
