(() => {
  'use strict';

  const DRAFT_KEY = 'pure20_supplier_hub_draft_v3';
  const SUPPLIER_KEY = 'pure20_supplier_hub_active_v1';
  const CATEGORY_KEY = 'pure20_supplier_hub_category_v1';
  const $ = id => document.getElementById(id);
  const CATEGORY_LABELS = {peptides:'Peptides',orals:'Orals',oils:'Oliën'};

  const els = {
    gate:$('supplierLoginGate'), app:$('supplierApp'), email:$('supplierEmail'), password:$('supplierPassword'),
    login:$('supplierLoginButton'), loginError:$('supplierLoginError'), status:$('supplierStatus'), user:$('supplierUser'),
    signOut:$('supplierSignOut'), supplierTabs:$('supplierTabs'), categorySection:$('supplierCategorySection'),
    categoryTabs:$('supplierCategoryTabs'), heroText:$('supplierHeroText'), search:$('supplierSearch'),
    clearSearch:$('supplierClearSearch'), catalogue:$('supplierCatalogue'), empty:$('supplierEmpty'),
    productCount:$('supplierProductCount'), variantCount:$('supplierVariantCount'), packInfo:$('supplierPackInfo'),
    pricingKicker:$('supplierPricingKicker'), thresholdMessage:$('supplierThresholdMessage'), tierBadge:$('supplierTierBadge'),
    progressWrap:$('supplierProgressWrap'), progressFill:$('supplierProgressFill'), progressStart:$('supplierProgressStart'),
    progressValue:$('supplierProgressValue'), progressEnd:$('supplierProgressEnd'), currencyNote:$('supplierCurrencyNote'),
    priceHeading:$('supplierPriceHeading'), summaryTitle:$('supplierSummaryTitle'), lines:$('supplierOrderLines'),
    summaryMeta:$('supplierSummaryMeta'), totalLabel:$('supplierTotalLabel'), total:$('supplierTotal'),
    savings:$('supplierSavings'), clearOrder:$('supplierClearOrder'), copyOrder:$('supplierCopyOrder'),
    copyStatus:$('supplierCopyStatus'), bottomPrimaryLabel:$('supplierBottomPrimaryLabel'),
    bottomPrimary:$('supplierBottomPrimary'), bottomSecondaryLabel:$('supplierBottomSecondaryLabel'),
    bottomSecondary:$('supplierBottomSecondary'), bottomTier:$('supplierBottomTier'), bottomTotal:$('supplierBottomTotal')
  };

  const state = {
    suppliers:[],
    products:[],
    activeSupplier:localStorage.getItem(SUPPLIER_KEY) || 'hhpeptide',
    activeCategory:localStorage.getItem(CATEGORY_KEY) || 'peptides',
    qty:loadDraft()
  };

  function esc(value){return String(value??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;')}
  function keyFor(p){return `${p.supplierKey}::${p.category}::${p.code}`}
  function loadDraft(){try{const raw=JSON.parse(localStorage.getItem(DRAFT_KEY)||'{}');return raw&&typeof raw==='object'?raw:{}}catch(_){return{}}}
  function saveDraft(){try{localStorage.setItem(DRAFT_KEY,JSON.stringify(Object.fromEntries(Object.entries(state.qty).filter(([,v])=>Number(v)>0))))}catch(_){}}
  function setStatus(label,mode=''){if(!els.status)return;els.status.classList.toggle('error',mode==='error');const x=els.status.querySelector('span:last-child');if(x)x.textContent=label}
  function supplier(){return state.suppliers.find(s=>s.key===state.activeSupplier) || state.suppliers[0] || null}
  function supplierProducts(key=state.activeSupplier){return state.products.filter(p=>p.supplierKey===key)}
  function categoriesFor(key=state.activeSupplier){return [...new Set(supplierProducts(key).map(p=>p.category))]}
  function qtyOf(p){return Math.max(0,Math.floor(Number(state.qty[keyFor(p)])||0))}
  function selectedRows(key=state.activeSupplier){return supplierProducts(key).map(product=>({product,qty:qtyOf(product)})).filter(x=>x.qty>0)}

  function formatMoney(value,s=supplier()){
    const n=Number(value||0);
    if(s?.currencyCode){
      try{return new Intl.NumberFormat(s.currencyCode==='EUR'?'nl-BE':'en-US',{style:'currency',currency:s.currencyCode,minimumFractionDigits:2}).format(n)}
      catch(_){}
    }
    return `${s?.currencySymbol||''}${n.toFixed(2)}`;
  }

  function totals(s=supplier()){
    const lines=selectedRows(s?.key);
    const qty=lines.reduce((sum,l)=>sum+l.qty,0);
    const distinct=lines.length;
    const retail=lines.reduce((sum,l)=>sum+l.qty*Number(l.product.retail||0),0);
    const wholesale=lines.reduce((sum,l)=>sum+l.qty*Number(l.product.wholesale||0),0);
    const list=lines.reduce((sum,l)=>sum+l.qty*Number(l.product.listPrice||0),0);
    const threshold=Number(s?.wholesaleThreshold||0);
    const wholesaleActive=s?.pricingMode==='tiered' && threshold>0 && wholesale>=threshold;
    const total=s?.pricingMode==='tiered' ? (wholesaleActive?wholesale:retail) : list;
    const units=lines.reduce((sum,l)=>sum+l.qty*Number(l.product.unitCount||0),0);
    const savings=wholesaleActive?Math.max(0,retail-wholesale):0;
    return {lines,qty,distinct,units,retail,wholesale,list,threshold,wholesaleActive,total,savings};
  }

  function unitPrice(p,t=totals()){
    const s=supplier();
    if(s?.pricingMode==='tiered') return t.wholesaleActive?Number(p.wholesale||0):Number(p.retail||0);
    return Number(p.listPrice||0);
  }

  function normalizedSupplier(row){
    return {
      key:String(row.supplier_key||''),
      name:String(row.name||''),
      currencyCode:row.currency_code?String(row.currency_code):'',
      currencySymbol:String(row.currency_symbol||''),
      pricingMode:String(row.pricing_mode||'single'),
      wholesaleThreshold:Number(row.wholesale_threshold||0),
      sort:Number(row.sort_order||0),
      metadata:row.metadata||{}
    };
  }

  function normalizedProduct(row){
    return {
      supplierKey:String(row.supplier_key||''),
      category:String(row.category||'peptides'),
      code:String(row.code||''),
      order:Number(row.sort_order||0),
      product:String(row.product_name||''),
      specification:String(row.specification||''),
      listPrice:row.list_price==null?null:Number(row.list_price),
      retail:row.retail_price==null?null:Number(row.retail_price),
      wholesale:row.wholesale_price==null?null:Number(row.wholesale_price),
      priceLabel:String(row.price_label||''),
      unitCount:row.unit_count==null?null:Number(row.unit_count),
      unitLabel:String(row.unit_label||''),
      sourcePage:row.source_page==null?null:Number(row.source_page)
    };
  }

  function ensureActive(){
    if(!state.suppliers.some(s=>s.key===state.activeSupplier)) state.activeSupplier=state.suppliers[0]?.key||'';
    const cats=categoriesFor();
    if(!cats.includes(state.activeCategory)) state.activeCategory=cats[0]||'peptides';
    localStorage.setItem(SUPPLIER_KEY,state.activeSupplier);
    localStorage.setItem(CATEGORY_KEY,state.activeCategory);
  }

  function renderSupplierTabs(){
    els.supplierTabs.innerHTML=state.suppliers.map(s=>{
      const count=supplierProducts(s.key).length;
      return `<button type="button" class="supplier-tab ${s.key===state.activeSupplier?'active':''}" data-supplier="${esc(s.key)}"><strong>${esc(s.name)}</strong><small>${count} regels</small></button>`;
    }).join('');
  }

  function renderCategoryTabs(){
    const cats=categoriesFor();
    els.categorySection.hidden=cats.length<=1;
    els.categoryTabs.innerHTML=cats.map(c=>{
      const count=supplierProducts().filter(p=>p.category===c).length;
      return `<button type="button" class="supplier-category-tab ${c===state.activeCategory?'active':''}" data-category="${esc(c)}">${esc(CATEGORY_LABELS[c]||c)} · ${count}</button>`;
    }).join('');
  }

  function visibleProducts(){
    const q=els.search.value.trim().toLowerCase();
    return supplierProducts().filter(p=>p.category===state.activeCategory && (!q||`${p.product} ${p.specification} ${p.code}`.toLowerCase().includes(q)));
  }

  function groupsForSearch(){
    const filtered=visibleProducts(),groups=new Map();
    for(const p of filtered){
      if(!groups.has(p.product))groups.set(p.product,[]);
      groups.get(p.product).push(p);
    }
    return groups;
  }

  function priceMarkup(p){
    const s=supplier();
    if(s?.pricingMode==='tiered'){
      return `<span class="supplier-price-retail">${formatMoney(p.retail,s)}</span><span class="supplier-price-wholesale">(${formatMoney(p.wholesale,s)} wholesale)</span>`;
    }
    return `<span class="supplier-price-list">${formatMoney(p.listPrice,s)}</span>`;
  }

  function renderCatalogue(){
    const groups=groupsForSearch(),markup=[];
    for(const [name,variants] of groups){
      markup.push(`<section class="supplier-product-card"><div class="supplier-product-title"><h3>${esc(name)}</h3><span>${variants.length} ${variants.length===1?'OPTIE':'OPTIES'}</span></div>${variants.map(p=>`<div class="supplier-variant-row" data-key="${esc(keyFor(p))}"><div class="supplier-variant-meta"><strong>${esc(p.specification||p.product)}</strong><span class="supplier-code">${esc(p.code)}</span></div><div class="supplier-price">${priceMarkup(p)}</div><div class="supplier-qty"><button type="button" data-qty-action="minus" aria-label="Verminder ${esc(p.code)}">−</button><input type="number" min="0" max="999" step="1" inputmode="numeric" value="${qtyOf(p)}" aria-label="Aantal ${esc(p.code)}" /><button type="button" data-qty-action="plus" aria-label="Verhoog ${esc(p.code)}">+</button></div></div>`).join('')}</section>`);
    }
    els.catalogue.innerHTML=markup.join('');
    els.empty.hidden=groups.size>0;
    const current=supplierProducts().filter(p=>p.category===state.activeCategory);
    els.productCount.textContent=String(new Set(current.map(p=>p.product)).size);
    els.variantCount.textContent=String(current.length);
  }

  function categoryBreakdown(lines){
    const map=new Map();
    for(const line of lines){
      const c=line.product.category;
      if(!map.has(c))map.set(c,{qty:0,units:0,unitLabels:new Set()});
      const item=map.get(c);
      item.qty+=line.qty;
      item.units+=line.qty*Number(line.product.unitCount||0);
      if(line.product.unitLabel)item.unitLabels.add(line.product.unitLabel);
    }
    return map;
  }

  function renderPricing(){
    const s=supplier(),t=totals(s);
    document.body.classList.toggle('wholesale-active',Boolean(t.wholesaleActive));
    if(!s)return;

    if(s.pricingMode==='tiered'){
      els.heroText.textContent=`${s.name}: retailprijs standaard, wholesale wordt automatisch actief vanaf ${formatMoney(s.wholesaleThreshold,s)} wholesale-waarde.`;
      els.pricingKicker.textContent='WHOLESALE-DREMPEL';
      els.tierBadge.textContent=t.wholesaleActive?'WHOLESALE':'RETAIL';
      const remaining=Math.max(0,s.wholesaleThreshold-t.wholesale);
      els.thresholdMessage.textContent=t.wholesaleActive?'Wholesaleprijs actief':`${formatMoney(remaining,s)} tot wholesale`;
      els.progressWrap.hidden=false;
      const pct=Math.max(0,Math.min(100,(t.wholesale/s.wholesaleThreshold)*100));
      els.progressFill.style.width=`${pct}%`;
      els.progressStart.textContent=formatMoney(0,s);
      els.progressValue.textContent=`${formatMoney(Math.min(t.wholesale,s.wholesaleThreshold),s)} / ${formatMoney(s.wholesaleThreshold,s)}`;
      els.progressEnd.textContent=formatMoney(s.wholesaleThreshold,s);
      els.currencyNote.hidden=true;
      els.priceHeading.textContent='RETAIL / WHOLESALE';
      els.packInfo.innerHTML='1 qty = <strong>10 vials</strong>';
    }else{
      els.heroText.textContent=`${s.name}: één catalogusprijs per productregel. Je mandje blijft behouden wanneer je tussen Peptides, Orals en Oliën wisselt.`;
      els.pricingKicker.textContent='CATALOGUSPRIJS';
      els.tierBadge.textContent='LIJSTPRIJS';
      els.thresholdMessage.textContent='Prijs per vermelde kit / verpakking / vial';
      els.progressWrap.hidden=true;
      els.currencyNote.hidden=Boolean(s.currencyCode);
      els.currencyNote.textContent=s.currencyCode?'':`De aangeleverde prijslijsten vermelden geen valuta. Daarom toon ik de bedragen voorlopig zonder $- of €-symbool.`;
      els.priceHeading.textContent='LIJSTPRIJS';
      const info=state.activeCategory==='peptides'?'Kitgrootte volgens specificatie':state.activeCategory==='orals'?'Verpakking volgens prijslijst':'10 ml-vial / kit volgens prijslijst';
      els.packInfo.textContent=info;
    }
  }

  function renderSummary(){
    const s=supplier(),t=totals(s);
    els.summaryTitle.textContent=s?`${s.name}.`:'Huidig mandje.';
    els.copyOrder.disabled=t.lines.length===0;

    if(!t.lines.length){
      els.lines.innerHTML='<div class="supplier-order-empty">Nog geen producten geselecteerd.</div>';
    }else{
      const chunks=[];
      const cats=[...new Set(t.lines.map(l=>l.product.category))];
      for(const cat of cats){
        if(cats.length>1)chunks.push(`<div class="supplier-order-category">${esc((CATEGORY_LABELS[cat]||cat).toUpperCase())}</div>`);
        for(const {product,qty} of t.lines.filter(l=>l.product.category===cat)){
          const unit=unitPrice(product,t);
          const unitMeta=product.unitCount?` · ${qty*product.unitCount} ${product.unitLabel||'units'}`:'';
          chunks.push(`<div class="supplier-order-line"><div><strong>${esc(product.code)} · ${esc(product.product)}</strong><small>${esc(product.specification)} · ${qty}×${unitMeta}</small></div><div class="supplier-order-line-price">${qty} × ${formatMoney(unit,s)}<br><strong>${formatMoney(qty*unit,s)}</strong></div></div>`);
        }
      }
      els.lines.innerHTML=chunks.join('');
    }

    if(s?.pricingMode==='tiered'){
      els.summaryMeta.innerHTML=`
        <div><span>Boxes</span><strong>${t.qty}</strong></div>
        <div><span>Vials</span><strong>${t.qty*10}</strong></div>
        <div><span>Retail mandje</span><strong>${formatMoney(t.retail,s)}</strong></div>
        <div><span>Wholesale mandje</span><strong>${formatMoney(t.wholesale,s)}</strong></div>`;
      els.totalLabel.textContent=t.wholesaleActive?'Wholesale totaal':'Retail totaal';
      els.bottomPrimaryLabel.textContent='BOXES';els.bottomPrimary.textContent=String(t.qty);
      els.bottomSecondaryLabel.textContent='VIALS';els.bottomSecondary.textContent=String(t.qty*10);
      els.bottomTier.textContent=t.wholesaleActive?'WHOLESALE TOTAAL':'RETAIL TOTAAL';
      if(t.wholesaleActive&&t.savings>0){els.savings.hidden=false;els.savings.textContent=`Je bespaart ${formatMoney(t.savings,s)} t.o.v. retail`;}else{els.savings.hidden=true;els.savings.textContent='';}
    }else{
      const breakdown=categoryBreakdown(t.lines);
      const rows=[`<div><span>Geselecteerde regels</span><strong>${t.distinct}</strong></div><div><span>Totaal aantal</span><strong>${t.qty}</strong></div>`];
      for(const [cat,b] of breakdown){
        let extra='';
        if(cat==='peptides'&&b.units)extra=` · ${b.units} vials`;
        if(cat==='orals'&&b.units)extra=` · ${b.units} stuks`;
        rows.push(`<div><span>${esc(CATEGORY_LABELS[cat]||cat)}</span><strong>${b.qty}${extra}</strong></div>`);
      }
      els.summaryMeta.innerHTML=rows.join('');
      els.totalLabel.textContent=s?.currencyCode?'Totaal':'Totaal · valuta niet vermeld';
      els.bottomPrimaryLabel.textContent='AANTAL';els.bottomPrimary.textContent=String(t.qty);
      els.bottomSecondaryLabel.textContent='REGELS';els.bottomSecondary.textContent=String(t.distinct);
      els.bottomTier.textContent=s?.currencyCode?'TOTAAL':'TOTAAL*';
      els.savings.hidden=true;els.savings.textContent='';
    }

    els.total.textContent=formatMoney(t.total,s);
    els.bottomTotal.textContent=formatMoney(t.total,s);
  }

  function renderAll(){
    ensureActive();
    renderSupplierTabs();
    renderCategoryTabs();
    renderPricing();
    renderCatalogue();
    renderSummary();
  }

  function productByKey(k){return state.products.find(p=>keyFor(p)===k)}
  function setQty(k,next){
    const qty=Math.max(0,Math.min(999,Math.floor(Number(next)||0)));
    if(qty>0)state.qty[k]=qty;else delete state.qty[k];
    saveDraft();renderAll();
  }

  async function copyText(text){
    if(navigator.clipboard&&window.isSecureContext){await navigator.clipboard.writeText(text);return}
    const ta=document.createElement('textarea');ta.value=text;ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove();
  }

  async function copyOrder(){
    const s=supplier(),t=totals(s);if(!s||!t.lines.length)return;
    const out=[`PURE20 / SUPPLIER ORDER`,`Supplier: ${s.name}`];
    if(s.pricingMode==='tiered')out.push(`Pricing: ${t.wholesaleActive?'WHOLESALE':'RETAIL'}`);
    if(!s.currencyCode)out.push('Currency: not specified in supplier price list');
    out.push('');
    const cats=[...new Set(t.lines.map(l=>l.product.category))];
    for(const cat of cats){
      if(cats.length>1)out.push(`[${(CATEGORY_LABELS[cat]||cat).toUpperCase()}]`);
      for(const {product,qty} of t.lines.filter(l=>l.product.category===cat)){
        const unit=unitPrice(product,t);
        out.push(`${qty} x ${product.code} | ${product.product} | ${product.specification} | ${formatMoney(unit,s)} = ${formatMoney(qty*unit,s)}`);
      }
      out.push('');
    }
    out.push(`Quantity: ${t.qty}`,`Lines: ${t.distinct}`,`TOTAL: ${formatMoney(t.total,s)}`);
    try{await copyText(out.join('\n'));els.copyStatus.textContent='Bestelling gekopieerd.';setTimeout(()=>els.copyStatus.textContent='',2200)}
    catch(err){console.error(err);els.copyStatus.textContent='Kopiëren is mislukt.'}
  }

  async function loadData(){
    const client=window.PURE20_API?.client;if(!client)throw new Error('Supabase is niet geconfigureerd.');
    const [suppliersRes,productsRes]=await Promise.all([
      client.from('pure20_suppliers').select('supplier_key,name,currency_code,currency_symbol,pricing_mode,wholesale_threshold,sort_order,metadata').eq('active',true).order('sort_order',{ascending:true}),
      client.from('pure20_supplier_catalogue').select('supplier_key,category,code,sort_order,product_name,specification,list_price,retail_price,wholesale_price,price_label,unit_count,unit_label,source_page').eq('active',true).order('supplier_key',{ascending:true}).order('category',{ascending:true}).order('sort_order',{ascending:true})
    ]);
    if(suppliersRes.error)throw suppliersRes.error;if(productsRes.error)throw productsRes.error;
    state.suppliers=(suppliersRes.data||[]).map(normalizedSupplier);
    state.products=(productsRes.data||[]).map(normalizedProduct);
    const allowed=new Set(state.products.map(keyFor));for(const k of Object.keys(state.qty))if(!allowed.has(k))delete state.qty[k];saveDraft();
    renderAll();
  }

  async function verifiedAdmin(){
    const client=window.PURE20_API?.client;if(!client)return null;
    const{data,error}=await client.auth.getUser();if(error||!data?.user)return null;
    const ok=await window.PURE20_API.isAdmin();return ok?data.user:null;
  }

  async function enter(user){
    els.gate.classList.add('hidden');els.app.hidden=false;els.user.textContent=user?.email||'Admin';setStatus('Privé');
    await loadData();
  }

  async function signIn(){
    els.loginError.textContent='';els.login.disabled=true;els.login.textContent='Bezig met inloggen…';
    try{
      await window.PURE20_API.signIn(els.email.value.trim(),els.password.value);
      const user=await verifiedAdmin();
      if(!user){await window.PURE20_API.signOut();throw new Error('Dit account heeft geen toegang tot de supplier hub.')}
      await enter(user);
    }catch(err){els.loginError.textContent=err?.message||'Inloggen mislukt.';setStatus('Vergrendeld','error')}
    finally{els.login.disabled=false;els.login.textContent='Inloggen'}
  }

  els.login.addEventListener('click',signIn);
  els.password.addEventListener('keydown',e=>{if(e.key==='Enter')signIn()});
  els.signOut.addEventListener('click',async()=>{try{await window.PURE20_API.signOut()}catch(_){}location.reload()});

  els.supplierTabs.addEventListener('click',e=>{
    const b=e.target.closest('[data-supplier]');if(!b)return;
    state.activeSupplier=b.dataset.supplier;state.activeCategory=categoriesFor(state.activeSupplier)[0]||'peptides';
    els.search.value='';localStorage.setItem(SUPPLIER_KEY,state.activeSupplier);localStorage.setItem(CATEGORY_KEY,state.activeCategory);renderAll();
  });
  els.categoryTabs.addEventListener('click',e=>{
    const b=e.target.closest('[data-category]');if(!b)return;
    state.activeCategory=b.dataset.category;els.search.value='';localStorage.setItem(CATEGORY_KEY,state.activeCategory);renderAll();
  });

  els.search.addEventListener('input',renderCatalogue);
  els.clearSearch.addEventListener('click',()=>{els.search.value='';renderCatalogue();els.search.focus()});
  els.catalogue.addEventListener('click',e=>{
    const row=e.target.closest('.supplier-variant-row[data-key]'),button=e.target.closest('[data-qty-action]');if(!row||!button)return;
    const k=row.dataset.key,current=Number(state.qty[k]||0);setQty(k,button.dataset.qtyAction==='plus'?current+1:current-1);
  });
  els.catalogue.addEventListener('change',e=>{
    const input=e.target.closest('.supplier-qty input'),row=e.target.closest('.supplier-variant-row[data-key]');if(!input||!row)return;setQty(row.dataset.key,input.value);
  });
  els.clearOrder.addEventListener('click',()=>{
    const keys=supplierProducts().map(keyFor).filter(k=>Number(state.qty[k]||0)>0);if(!keys.length)return;
    if(!confirm(`Bestelling voor ${supplier()?.name||'deze leverancier'} volledig wissen?`))return;
    keys.forEach(k=>delete state.qty[k]);saveDraft();renderAll();
  });
  els.copyOrder.addEventListener('click',copyOrder);

  async function bootstrap(){
    if(!window.PURE20_API?.configured){els.loginError.textContent='Supabase is niet geconfigureerd.';setStatus('Offline','error');return}
    try{const user=await verifiedAdmin();if(user)await enter(user);else setStatus('Vergrendeld')}
    catch(err){console.error(err);els.loginError.textContent=err?.message||'Admin-toegang kon niet worden gecontroleerd.';setStatus('Fout','error')}
  }
  bootstrap();
})();
