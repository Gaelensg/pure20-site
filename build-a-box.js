(async () => {
  'use strict';

  const $ = id => document.getElementById(id);
  const customerFields = ['fullName','address','zip','country','email','phone'];
  const state = {
    store: window.PURE20_FALLBACK_STORE,
    selected: {},
    category: 'All',
    query: '',
    source: 'demo'
  };

  const els = {
    title:$('boxTitle'), subtitle:$('boxSubtitle'), heroDiscount:$('boxHeroDiscount'), benefitCount:$('boxBenefitCount'),
    benefitDiscount:$('boxBenefitDiscount'), progressLabel:$('boxProgressLabel'), progressFill:$('boxProgressFill'), slots:$('boxSlots'),
    search:$('boxSearch'), clearSearch:$('boxClearSearch'), categories:$('boxCategories'), catalogue:$('boxCatalogue'), empty:$('boxEmpty'),
    productCount:$('boxProductCount'), variantCount:$('boxVariantCount'), bottomCount:$('boxBottomCount'), retailTotal:$('boxRetailTotal'),
    savings:$('boxSavings'), total:$('boxTotal'), review:$('boxReview'), drawer:$('orderDrawer'), backdrop:$('drawerBackdrop'),
    closeDrawer:$('closeDrawer'), orderLines:$('orderLines'), drawerEmpty:$('drawerEmpty'), drawerSubtotal:$('drawerSubtotal'),
    drawerDiscount:$('drawerDiscount'), drawerShipping:$('drawerShipping'), drawerTotal:$('drawerTotal'), drawerDiscountLabel:$('boxDrawerDiscountLabel'),
    researchConfirm:$('researchConfirm'), copyOrder:$('copyOrder'), whatsappOrder:$('whatsappOrder'), toast:$('toast')
  };

  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const config = () => ({
    enabled: state.store?.settings?.buildBox?.enabled !== false,
    size: Math.max(1, Number(state.store?.settings?.buildBox?.size || 4)),
    discountPct: Math.max(0, Math.min(100, Number(state.store?.settings?.buildBox?.discountPct || 15))),
    freeShipping: state.store?.settings?.buildBox?.freeShipping !== false,
    title: state.store?.settings?.buildBox?.title || 'Stel je box samen.',
    subtitle: state.store?.settings?.buildBox?.subtitle || 'Kies 4 geprijsde producten. Krijg 15% korting en gratis verzending.'
  });
  const money = value => `${state.store?.settings?.currencySymbol || '€'}${Number(value || 0).toFixed(2)}`;
  const activeProducts = () => (state.store?.products || []).filter(p => p.active).sort((a,b) => {
    const pc = String(a.product).localeCompare(String(b.product),'nl',{sensitivity:'base',numeric:true});
    return pc || String(a.variant).localeCompare(String(b.variant),'nl',{sensitivity:'base',numeric:true});
  });
  const selectedCount = () => Object.values(state.selected).reduce((sum,q) => sum + Number(q || 0), 0);
  const productById = id => activeProducts().find(p => p.id === id);
  const selectedLines = () => Object.entries(state.selected).map(([id,qty]) => ({product:productById(id),qty:Number(qty||0)})).filter(x => x.product && x.qty > 0);

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

  function renderBrand(){
    const c = config();
    els.title.textContent = c.title;
    els.subtitle.textContent = c.subtitle;
    els.heroDiscount.textContent = `${c.discountPct}%`;
    els.benefitCount.textContent = `Kies ${c.size} producten`;
    els.benefitDiscount.textContent = `Bespaar ${c.discountPct}%`;
    els.drawerDiscountLabel.textContent = `Boxkorting · ${c.discountPct}%`;
  }

  function expandedSelection(){
    const out=[];
    for(const {product,qty} of selectedLines()) for(let i=0;i<qty;i++) out.push(product);
    return out;
  }

  function renderSlots(){
    const c=config(), selected=expandedSelection();
    els.slots.innerHTML=Array.from({length:c.size},(_,i)=>{
      const p=selected[i];
      if(!p) return `<article class="box-slot"><span class="box-slot-index">${String(i+1).padStart(2,'0')}</span><div class="box-slot-empty">Selecteer product +</div></article>`;
      return `<article class="box-slot filled"><span class="box-slot-index">${String(i+1).padStart(2,'0')}</span><button class="box-slot-remove" type="button" data-remove-id="${esc(p.id)}" aria-label="Verwijder ${esc(p.product)} ${esc(p.variant)}">×</button><div class="box-slot-product"><strong>${esc(p.product)}</strong><span>${esc(p.variant)} · ${esc(p.code)}</span></div><div class="box-slot-price">${money(p.price)}</div></article>`;
    }).join('');
  }

  function categories(){return ['All',...new Set(activeProducts().map(p=>p.category).filter(Boolean))]}
  function categoryLabel(value){return value==='All'?'Alle':value}
  function renderCategories(){
    const cats=categories();
    if(!cats.includes(state.category)) state.category='All';
    els.categories.innerHTML=cats.map(c=>`<button class="pill ${c===state.category?'active':''}" type="button" data-category="${esc(c)}">${esc(categoryLabel(c))}</button>`).join('');
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
    const rows=filteredProducts(), groups=new Map(), c=config(), count=selectedCount();
    rows.forEach(p=>{if(!groups.has(p.product))groups.set(p.product,[]);groups.get(p.product).push(p)});
    els.catalogue.innerHTML=[...groups].map(([name,variants])=>`<section class="box-product-group"><div class="box-product-heading"><h3>${esc(name)}</h3><span>${variants.length} ${variants.length===1?'OPTIE':'OPTIES'}</span></div>${variants.map(p=>{
      const inBox=Number(state.selected[p.id]||0), priced=Number(p.price||0)>0, full=count>=c.size;
      return `<article class="box-variant ${priced?'':'disabled'}" data-id="${esc(p.id)}"><div class="box-variant-main"><strong>${esc(p.variant)}</strong><small>${esc(p.code)} · ${Number(p.stock||0)>0?'OP VOORRAAD':'BESTELBAAR'}</small>${inBox?`<span class="box-in-count">IN DE BOX × ${inBox}</span>`:''}</div><div class="box-variant-price"><strong>${priced?money(p.price):'Prijs volgt'}</strong><span>per ${esc(p.unit||'vial')}</span></div><button class="box-add-button" type="button" data-add-id="${esc(p.id)}" ${!priced||full?'disabled':''}>${inBox?'+ NOG EEN':'+ TOEVOEGEN'}</button></article>`;
    }).join('')}</section>`).join('');
    els.empty.hidden=rows.length>0;
    els.productCount.textContent=String(new Set(activeProducts().map(p=>p.product)).size);
    els.variantCount.textContent=String(activeProducts().length);
  }

  function renderSummary(){
    const c=config(), t=totals();
    els.progressLabel.textContent=`${t.count} / ${c.size}`;
    els.progressFill.style.width=`${Math.min(100,(t.count/c.size)*100)}%`;
    els.bottomCount.textContent=`${t.count} / ${c.size}`;
    els.retailTotal.textContent=money(t.retail);
    els.savings.textContent=money(t.discount);
    els.total.textContent=money(t.total);
    els.review.disabled=!t.complete;
    els.review.textContent=t.complete?'Bekijk box →':`nog ${c.size-t.count} te kiezen`;
    els.drawerSubtotal.textContent=money(t.retail);
    els.drawerDiscount.textContent=`-${money(t.discount)}`;
    els.drawerShipping.textContent=c.freeShipping&&t.complete?'Gratis':money(Number(state.store?.settings?.shippingFlat||0));
    els.drawerTotal.textContent=money(t.total);
    els.drawerEmpty.hidden=t.count>0;
    els.orderLines.innerHTML=selectedLines().map(({product,qty})=>{
      const discountedUnit=Number(product.price)*(1-c.discountPct/100);
      const lineTotal=t.complete?qty*discountedUnit:qty*Number(product.price);
      return `<div class="order-line" data-id="${esc(product.id)}"><div><div class="order-line-name">${esc(product.product)} / ${esc(product.variant)}</div><div class="order-line-meta">${esc(product.code)} · ${qty} × ${money(product.price)}</div></div><div class="order-line-right"><div class="order-line-total">${money(lineTotal)}</div></div></div>`;
    }).join('');
  }

  function renderAll(){renderBrand();renderSlots();renderCategories();renderCatalogue();renderSummary()}

  function add(id){
    const c=config(), p=productById(id);
    if(!p||Number(p.price||0)<=0)return;
    if(selectedCount()>=c.size){toast('Je box is al compleet.');return}
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
    if(!totals().complete){toast(`Kies eerst ${config().size} producten.`);return}
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
    if(!totals().complete){toast('Maak eerst je box compleet.');return false}
    if(!els.researchConfirm.checked){toast('Bevestig eerst de melding.');return false}
    saveCustomer();
    return true;
  }

  function orderText(){
    const c=config(),t=totals(),cust=Object.fromEntries(customerFields.map(id=>[id,$(id)?.value?.trim()||'-']));
    return [
      'PURE20. BOXBESTELLING','',
      ...selectedLines().map(({product,qty})=>`${qty} × ${product.product} ${product.variant} (${product.code}) — ${money(qty*Number(product.price))}`),
      '',
      `Normale prijs: ${money(t.retail)}`,
      `Boxkorting (${c.discountPct}%): -${money(t.discount)}`,
      `Verzending: ${c.freeShipping?'Gratis':money(Number(state.store?.settings?.shippingFlat||0))}`,
      `BOXTOTAAL: ${money(t.total)}`,
      '',
      'KLANTGEGEVENS',
      `Naam: ${cust.fullName}`,
      `Adres: ${cust.address}`,
      `Postcode: ${cust.zip}`,
      `Land: ${cust.country}`,
      `Email: ${cust.email}`,
      `Telefoon: ${cust.phone}`,
      '',
      'Beschikbaarheid, verzending en betaling worden afzonderlijk bevestigd.'
    ].join('\n');
  }

  async function copyOrder(){
    if(!canShare())return;
    const text=orderText();
    try{await navigator.clipboard.writeText(text)}catch(_){const ta=document.createElement('textarea');ta.value=text;document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove()}
    toast('Boxbestelling gekopieerd.');
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
      if(showToast)toast('Catalogus bijgewerkt.');
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
  window.addEventListener('pure20:languagechange',renderAll);

  function syncThemeColor(){
    const meta=document.querySelector('meta[name="theme-color"]');
    if(meta) meta.setAttribute('content',document.documentElement.dataset.p20Theme==='dark'?'#0f1210':'#f2f1ec');
  }
  window.addEventListener('pure20:themechange',syncThemeColor);
  syncThemeColor();

  loadCustomer();
  await loadStore(false);
  window.PURE20_API.subscribePublic(()=>loadStore(true));
})();
