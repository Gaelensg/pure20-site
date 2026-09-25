(async () => {
  const state = { store: window.PURE20_FALLBACK_STORE, selectedCategory: 'All', query: '', cart: {}, coupon: null, source: 'demo', member:{loggedIn:false,discountPct:0,creditBalance:0,useCredit:false} };
  const $ = id => document.getElementById(id);
  const els = {
    eyebrow:$('eyebrow'),pageTitle:$('pageTitle'),pageSubtitle:$('pageSubtitle'),search:$('search'),clearSearch:$('clearSearch'),categoryPills:$('categoryPills'),catalogue:$('catalogue'),emptyState:$('emptyState'),productCount:$('productCount'),variantCount:$('variantCount'),shippingText:$('shippingText'),footerNotice:$('footerNotice'),cartUnits:$('cartUnits'),cartSubtotal:$('cartSubtotal'),headerCartCount:$('headerCartCount'),clearCart:$('clearCart'),reviewOrder:$('reviewOrder'),headerCart:$('headerCart'),drawer:$('orderDrawer'),backdrop:$('drawerBackdrop'),closeDrawer:$('closeDrawer'),orderLines:$('orderLines'),drawerEmpty:$('drawerEmpty'),drawerSubtotal:$('drawerSubtotal'),discountRow:$('discountRow'),drawerDiscount:$('drawerDiscount'),drawerShipping:$('drawerShipping'),drawerTotal:$('drawerTotal'),couponInput:$('couponInput'),applyCoupon:$('applyCoupon'),couponMessage:$('couponMessage'),researchConfirm:$('researchConfirm'),copyOrder:$('copyOrder'),whatsappOrder:$('whatsappOrder'),toast:$('toast'),cloudDot:$('cloudDot'),cloudStatus:$('cloudStatus'),connectionError:$('connectionError')
  };
  const customerFields=['fullName','address','zip','country','email','phone'];

  function setupHeaderCart(){
    if(!els.headerCart) return;
    const headerInner=document.querySelector('.site-header .header-inner');
    if(headerInner){
      let controls=headerInner.querySelector('.header-controls');
      if(!controls){controls=document.createElement('div');controls.className='header-controls';headerInner.appendChild(controls);}
      if(els.headerCart.parentElement!==controls) controls.prepend(els.headerCart);
    }
    if(!els.headerCart.dataset.iconized){
      const currentCount=els.headerCartCount?els.headerCartCount.textContent:'0';
      els.headerCart.innerHTML=`<svg class="cart-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M3 4H5.4L7.2 13H18.3L20.3 7H8.1" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><circle cx="9.1" cy="18.2" r="1.45" fill="currentColor"/><circle cx="17.25" cy="18.2" r="1.45" fill="currentColor"/></svg><span id="headerCartCount">${currentCount}</span>`;
      els.headerCartCount=document.getElementById('headerCartCount');
      els.headerCart.setAttribute('aria-label','Open cart');
      els.headerCart.dataset.iconized='1';
    }
  }

  function setupAccountLink(){
    const headerInner=document.querySelector('.site-header .header-inner');
    if(!headerInner)return;
    let controls=headerInner.querySelector('.header-controls');
    if(!controls){controls=document.createElement('div');controls.className='header-controls';headerInner.appendChild(controls);}
    if(controls.querySelector('.account-icon-link'))return;
    const a=document.createElement('a');
    a.href='/account';
    a.className='account-icon-link';
    a.setAttribute('aria-label','Account');
    a.title='Account';
    a.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.2"></circle><path d="M5.5 19c.8-4 3-6 6.5-6s5.7 2 6.5 6"></path></svg>';
    controls.appendChild(a);
  }

  function setupMemberBenefitsUI(){
    const couponBlock=els.couponInput?.closest('.drawer-block');
    const totalsCard=document.querySelector('.totals-card');
    if(couponBlock&&!document.getElementById('memberBenefitsBlock')){
      const section=document.createElement('section');
      section.id='memberBenefitsBlock';
      section.className='drawer-block member-benefits';
      section.hidden=true;
      section.innerHTML=`
        <div class="section-heading"><span>04</span><h3>Account benefits</h3></div>
        <div class="member-benefit-copy" id="memberBenefitCopy"></div>
        <label class="credit-toggle" id="creditToggleWrap" hidden>
          <input id="useReferralCredit" type="checkbox">
          <span>Use available referral credit on this order</span>
          <strong id="creditAvailable">€0.00</strong>
        </label>
        <a class="member-account-link" href="/account">View account & referral dashboard →</a>`;
      couponBlock.insertAdjacentElement('afterend',section);
      els.memberBenefitsBlock=section;
      els.memberBenefitCopy=document.getElementById('memberBenefitCopy');
      els.creditToggleWrap=document.getElementById('creditToggleWrap');
      els.useReferralCredit=document.getElementById('useReferralCredit');
      els.creditAvailable=document.getElementById('creditAvailable');
      els.useReferralCredit?.addEventListener('change',()=>{
        state.member.useCredit=Boolean(els.useReferralCredit.checked);
        renderCart();
      });
    }
    if(totalsCard&&!document.getElementById('memberDiscountRow')){
      const shippingRow=[...totalsCard.children].find(x=>x.textContent.includes('Shipping'));
      const memberRow=document.createElement('div');
      memberRow.id='memberDiscountRow';
      memberRow.hidden=true;
      memberRow.innerHTML='<span>Referral discount</span><strong id="drawerMemberDiscount">-€0.00</strong>';
      const creditRow=document.createElement('div');
      creditRow.id='creditUsedRow';
      creditRow.hidden=true;
      creditRow.innerHTML='<span>Referral credit</span><strong id="drawerCreditUsed">-€0.00</strong>';
      if(shippingRow){
        totalsCard.insertBefore(memberRow,shippingRow);
        totalsCard.insertBefore(creditRow,shippingRow);
      }else{
        totalsCard.append(memberRow,creditRow);
      }
      els.memberDiscountRow=memberRow;
      els.drawerMemberDiscount=document.getElementById('drawerMemberDiscount');
      els.creditUsedRow=creditRow;
      els.drawerCreditUsed=document.getElementById('drawerCreditUsed');
    }
  }

  async function loadMemberBenefits(){
    try{
      const b=await window.PURE20_API.getCheckoutBenefits();
      state.member.loggedIn=Boolean(b?.logged_in);
      state.member.discountPct=Math.max(0,Number(b?.referral_discount_pct||0));
      state.member.creditBalance=Math.max(0,Number(b?.credit_balance_eur||0));
      if(!state.member.loggedIn)state.member.useCredit=false;
    }catch(err){
      console.warn('PURE20 member benefits:',err?.message||err);
      state.member={loggedIn:false,discountPct:0,creditBalance:0,useCredit:false};
    }
    if(els.memberBenefitsBlock){
      const hasBenefits=state.member.loggedIn&&(state.member.discountPct>0||state.member.creditBalance>0);
      els.memberBenefitsBlock.hidden=!hasBenefits;
      if(els.memberBenefitCopy){
        const bits=[];
        if(state.member.discountPct>0)bits.push(`${state.member.discountPct}% referral discount is automatically applied.`);
        if(state.member.creditBalance>0)bits.push(`${money(state.member.creditBalance)} referral credit is available.`);
        els.memberBenefitCopy.textContent=bits.join(' ');
      }
      if(els.creditToggleWrap){
        els.creditToggleWrap.hidden=state.member.creditBalance<=0;
        if(els.creditAvailable)els.creditAvailable.textContent=money(state.member.creditBalance);
        if(els.useReferralCredit)els.useReferralCredit.checked=state.member.useCredit&&state.member.creditBalance>0;
      }
    }
    renderCart();
  }

  const esc=v=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const settings=()=>state.store.settings||{};
  const money=v=>`${settings().currencySymbol||'€'}${Number(v||0).toFixed(2)}`;

  function safeCoaUrl(value){
    const raw=String(value||'').trim();
    if(!raw)return'';
    try{
      const url=new URL(raw,location.href);
      if(url.protocol!=='http:'&&url.protocol!=='https:')return'';
      return url.href;
    }catch(_){return''}
  }

  function setCloudStatus(source, extra='') {
    state.source = source;
    els.cloudDot.className = `cloud-dot ${source==='cloud'?'live':source==='error'?'error':'demo'}`;
    if (source === 'cloud') els.cloudStatus.innerHTML = `<strong>Live catalogue</strong> · synced with database${extra?` · ${esc(extra)}`:''}`;
    else if (source === 'error') els.cloudStatus.innerHTML = `<strong>Connection issue</strong> · showing fallback data`;
    else els.cloudStatus.innerHTML = `<strong>Demo mode</strong> · connect Supabase to make updates live for everyone`;
  }

  function activeProducts(){return (state.store.products||[]).filter(p=>p.active).sort((a,b)=>a.order-b.order||a.product.localeCompare(b.product));}
  function selectedRows(){return activeProducts().filter(r=>{
    const cat=state.selectedCategory==='All'||r.category===state.selectedCategory;
    const q=state.query.trim().toLowerCase();
    const text=`${r.product} ${r.variant} ${r.code} ${r.category} ${r.note}`.toLowerCase();
    return cat&&(!q||text.includes(q));
  });}
  function renderBrand(){const s=settings();els.eyebrow.textContent=s.eyebrow||'';els.pageTitle.textContent=s.title||'PURE20.';els.pageSubtitle.textContent=s.subtitle||'';els.shippingText.textContent=shippingDisplay(0,false);els.footerNotice.textContent=s.footerNotice||'';document.title=`${s.brandName||'PURE20.'} — Order`;}
  function renderCategories(){const cats=['All',...new Set(activeProducts().map(p=>p.category).filter(Boolean))];if(!cats.includes(state.selectedCategory))state.selectedCategory='All';els.categoryPills.innerHTML=cats.map(c=>`<button class="pill ${c===state.selectedCategory?'active':''}" data-category="${esc(c)}" type="button">${esc(c)}</button>`).join('');}
  function stockClass(p){const n=Number(p.stock||0),low=Number(settings().lowStockThreshold||5);return n<=0?'stock-out':n<=low?'stock-low':'stock-ok'}
  function stockLabel(p){const n=Number(p.stock||0),low=Number(settings().lowStockThreshold||5);return n<=0?'Out of stock':n<=low?`${n} left`:'In stock'}
  function renderCatalogue(){const rows=selectedRows();const groups=new Map();rows.forEach(r=>{if(!groups.has(r.category))groups.set(r.category,[]);groups.get(r.category).push(r)});els.catalogue.innerHTML=[...groups.entries()].map(([category,items])=>`<section class="category-block"><div class="category-heading"><h2>${esc(category)}</h2><span>${items.length} ${items.length===1?'option':'options'}</span></div>${items.map((r,idx)=>{const qty=Number(state.cart[r.id]||0),out=r.stock<=0;return `<article class="product-card ${out?'out':''}"><div class="product-row variant-row" data-id="${esc(r.id)}"><div class="product-main"><div class="product-index">${String(idx+1).padStart(2,'0')}</div><div class="product-text"><div class="product-name-line"><span class="product-name">${esc(r.product)}</span><span class="product-variant">${esc(r.variant)}</span>${r.badge?`<span class="badge">${esc(r.badge)}</span>`:''}</div><div class="product-meta-row"><div class="product-code">${esc(r.code)}${r.note?` / ${esc(r.note)}`:''}</div>${safeCoaUrl(r.coaUrl)?`<a class="coa-link" href="${esc(safeCoaUrl(r.coaUrl))}" target="_blank" rel="noopener noreferrer" aria-label="COA for ${esc(r.product)} ${esc(r.variant)}">COA ↗</a>`:''}</div><div class="stockline ${stockClass(r)}">${stockLabel(r)}</div></div></div><div class="product-price"><strong>${money(r.price)}</strong><span>per ${esc(r.unit)}</span></div><div class="qty-control"><button type="button" data-action="minus" ${qty<=0?'disabled':''}>−</button><input type="number" min="0" max="${r.stock}" value="${qty}" inputmode="numeric" ${out?'disabled':''}/><button type="button" data-action="plus" ${out||qty>=r.stock?'disabled':''}>+</button></div></div></article>`}).join('')}</section>`).join('');els.emptyState.hidden=rows.length>0;els.productCount.textContent=new Set(activeProducts().map(r=>r.product)).size;els.variantCount.textContent=activeProducts().length;}
  function cartRows(){return activeProducts().filter(r=>Number(state.cart[r.id]||0)>0)}
  function totals(){
    const rows=cartRows();
    const units=rows.reduce((s,r)=>s+Number(state.cart[r.id]||0),0);
    const subtotal=rows.reduce((s,r)=>s+Number(state.cart[r.id]||0)*r.price,0);
    const c=state.coupon;
    let couponDiscount=0;
    if(c&&subtotal>=Number(c.minSubtotal||0)){
      couponDiscount=c.type==='fixed'?Math.min(subtotal,c.value):subtotal*(c.value/100);
    }
    const afterCoupon=Math.max(0,subtotal-couponDiscount);
    const referralDiscount=state.member.loggedIn?afterCoupon*(Math.max(0,state.member.discountPct)/100):0;
    const afterDiscounts=Math.max(0,afterCoupon-referralDiscount);
    const creditUsed=state.member.loggedIn&&state.member.useCredit
      ?Math.min(afterDiscounts,Math.max(0,state.member.creditBalance))
      :0;
    const afterCredit=Math.max(0,afterDiscounts-creditUsed);
    const s=settings();
    let shipping=units?Number(s.shippingFlat||0):0;
    if(Number(s.freeShippingThreshold||0)>0&&afterCredit>=Number(s.freeShippingThreshold))shipping=0;
    return{
      rows,units,subtotal,
      couponDiscount,referralDiscount,creditUsed,
      discount:couponDiscount+referralDiscount,
      shipping,total:afterCredit+shipping,c
    };
  }
  function shippingDisplay(subtotal=0,hasItems=true){const s=settings();if(Number(s.freeShippingThreshold||0)>0&&subtotal>=Number(s.freeShippingThreshold))return'Free';if(Number(s.shippingFlat||0)>0)return money(s.shippingFlat);return s.shippingText||'Confirmed separately';}
  function renderCart(){
    const t=totals();
    els.cartUnits.textContent=t.units;
    els.headerCartCount.textContent=t.units;
    els.cartSubtotal.textContent=money(t.subtotal-t.couponDiscount-t.referralDiscount-t.creditUsed);
    els.drawerSubtotal.textContent=money(t.subtotal);
    els.drawerDiscount.textContent=`-${money(t.couponDiscount)}`;
    els.discountRow.hidden=t.couponDiscount<=0;
    if(els.memberDiscountRow){
      els.memberDiscountRow.hidden=t.referralDiscount<=0;
      els.drawerMemberDiscount.textContent=`-${money(t.referralDiscount)}`;
    }
    if(els.creditUsedRow){
      els.creditUsedRow.hidden=t.creditUsed<=0;
      els.drawerCreditUsed.textContent=`-${money(t.creditUsed)}`;
    }
    els.drawerShipping.textContent=t.units?shippingDisplay(t.subtotal-t.discount-t.creditUsed,true):shippingDisplay(0,false);
    els.drawerTotal.textContent=money(t.total);
    els.drawerEmpty.hidden=t.rows.length>0;
    els.orderLines.innerHTML=t.rows.map(r=>{
      const q=Number(state.cart[r.id]||0);
      return `<div class="order-line" data-id="${esc(r.id)}"><div><div class="order-line-name">${esc(r.product)} / ${esc(r.variant)}</div><div class="order-line-meta">${esc(r.code)} · ${q} × ${money(r.price)}</div></div><div class="order-line-right"><div class="order-line-total">${money(q*r.price)}</div><div class="order-line-actions"><button class="mini-btn" data-drawer-action="minus" type="button">−</button><button class="mini-btn" data-drawer-action="plus" type="button" ${q>=r.stock?'disabled':''}>+</button></div></div></div>`;
    }).join('');
  }
  function setQty(id,qty){const p=(state.store.products||[]).find(x=>x.id===id);if(!p)return;qty=Math.max(0,Math.min(Math.floor(Number(qty)||0),Number(p.stock||0)));if(qty===0)delete state.cart[id];else state.cart[id]=qty;renderCatalogue();renderCart();}
  function clampCartToStock(){for(const [id,q] of Object.entries(state.cart)){const p=(state.store.products||[]).find(x=>x.id===id&&x.active);if(!p){delete state.cart[id];continue}state.cart[id]=Math.min(Number(q||0),Number(p.stock||0));if(state.cart[id]<=0)delete state.cart[id];}}
  function clearCart(){state.cart={};state.coupon=null;els.couponInput.value='';els.couponMessage.textContent='';els.researchConfirm.checked=false;renderCatalogue();renderCart();}
  function openDrawer(){els.backdrop.hidden=false;requestAnimationFrame(()=>els.backdrop.classList.add('visible'));els.drawer.classList.add('open');els.drawer.setAttribute('aria-hidden','false');document.body.style.overflow='hidden'}
  function closeDrawer(){els.drawer.classList.remove('open');els.drawer.setAttribute('aria-hidden','true');els.backdrop.classList.remove('visible');document.body.style.overflow='';setTimeout(()=>{if(!els.drawer.classList.contains('open'))els.backdrop.hidden=true},220)}
  function toast(msg){els.toast.textContent=msg;els.toast.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>els.toast.classList.remove('show'),1800)}
  function saveCustomer(){const d=Object.fromEntries(customerFields.map(id=>[id,$(id).value]));localStorage.setItem('pure20_customer_v4',JSON.stringify(d))}
  function loadCustomer(){try{const d=JSON.parse(localStorage.getItem('pure20_customer_v4')||'{}');customerFields.forEach(id=>{if(typeof d[id]==='string')$(id).value=d[id]})}catch(_){} }

  async function applyCoupon(){
    const code=els.couponInput.value.trim().toUpperCase();
    els.couponMessage.classList.remove('success');
    if(!code){state.coupon=null;els.couponMessage.textContent='';renderCart();return;}
    els.applyCoupon.disabled=true;els.applyCoupon.textContent='Checking…';
    try{
      const c=await window.PURE20_API.validateCoupon(code,totals().subtotal);
      if(!c){state.coupon=null;els.couponMessage.textContent='Code not recognised or minimum order not reached.';}
      else{state.coupon=c;els.couponMessage.textContent=c.type==='fixed'?`${money(c.value)} discount applied.`:`${c.value}% discount applied.`;els.couponMessage.classList.add('success');}
      renderCart();
    }catch(err){state.coupon=null;els.couponMessage.textContent='Could not validate this code right now.';console.error(err);renderCart();}
    finally{els.applyCoupon.disabled=false;els.applyCoupon.textContent='Apply';}
  }

  function buildOrderText(){
    const t=totals(),s=settings(),cust=Object.fromEntries(customerFields.map(id=>[id,$(id).value.trim()]));
    return [
      `${s.brandName||'PURE20.'} ORDER REQUEST`,'',
      ...t.rows.map(r=>{const q=Number(state.cart[r.id]||0);return `${q} × ${r.product} ${r.variant} (${r.code}) — ${money(q*r.price)}`}),
      '',
      `Subtotal: ${money(t.subtotal)}`,
      ...(t.couponDiscount>0?[`Coupon (${state.coupon?.code||''}): -${money(t.couponDiscount)}`]:[]),
      ...(t.referralDiscount>0?[`Referral discount: -${money(t.referralDiscount)}`]:[]),
      ...(t.creditUsed>0?[`Referral credit used: -${money(t.creditUsed)}`]:[]),
      `Shipping: ${t.units?shippingDisplay(t.subtotal-t.discount-t.creditUsed,true):shippingDisplay(0,false)}`,
      `Current total ${s.currency||'EUR'}: ${money(t.total)}`,
      '',
      'CUSTOMER DETAILS',
      `Name: ${cust.fullName||'-'}`,
      `Address: ${cust.address||'-'}`,
      `Postal code: ${cust.zip||'-'}`,
      `Country: ${cust.country||'-'}`,
      `Email: ${cust.email||'-'}`,
      `Phone: ${cust.phone||'-'}`,
      '',
      'Availability, shipping and payment to be confirmed separately.'
    ].join('\n');
  }
  function canShare(){if(!totals().rows.length){toast('Add at least one item first.');return false}if(!els.researchConfirm.checked){toast('Confirm the notice first.');return false}saveCustomer();return true}
  async function copy(){if(!canShare())return;const text=buildOrderText();try{await navigator.clipboard.writeText(text)}catch(_){const t=document.createElement('textarea');t.value=text;document.body.appendChild(t);t.select();document.execCommand('copy');t.remove()}toast('Order copied.')}
  function whatsapp(){if(!canShare())return;const text=encodeURIComponent(buildOrderText());const n=String(settings().whatsappNumber||'').replace(/\D/g,'');window.open(n?`https://wa.me/${n}?text=${text}`:`https://wa.me/?text=${text}`,'_blank','noopener')}

  function renderAll(){renderBrand();renderCategories();renderCatalogue();renderCart();}
  async function reloadFromSource(showToast=false){
    try{
      const {store,source}=await window.PURE20_API.loadPublicStore();
      state.store=store;clampCartToStock();
      if(state.coupon){try{state.coupon=await window.PURE20_API.validateCoupon(state.coupon.code,totals().subtotal)}catch(_){state.coupon=null}}
      setCloudStatus(source);
      els.connectionError.hidden=true;
      renderAll();
      if(showToast)toast('Catalogue updated.');
    }catch(err){
      console.error(err);
      state.store=window.PURE20_API.normalizeStore(window.PURE20_FALLBACK_STORE);
      clampCartToStock();setCloudStatus('error');renderAll();
      els.connectionError.hidden=false;els.connectionError.textContent='The live database could not be reached, so the packaged fallback catalogue is shown for now.';
    }
  }

  els.search.addEventListener('input',e=>{state.query=e.target.value;renderCatalogue()});
  els.clearSearch.addEventListener('click',()=>{state.query='';els.search.value='';renderCatalogue()});
  els.categoryPills.addEventListener('click',e=>{const b=e.target.closest('[data-category]');if(!b)return;state.selectedCategory=b.dataset.category;renderCategories();renderCatalogue()});
  els.catalogue.addEventListener('click',e=>{const row=e.target.closest('.variant-row');const b=e.target.closest('button[data-action]');if(!row||!b)return;const id=row.dataset.id,q=Number(state.cart[id]||0);setQty(id,q+(b.dataset.action==='plus'?1:-1))});
  els.catalogue.addEventListener('change',e=>{const row=e.target.closest('.variant-row');if(row&&e.target.matches('input'))setQty(row.dataset.id,e.target.value)});
  els.orderLines.addEventListener('click',e=>{const line=e.target.closest('.order-line');const b=e.target.closest('[data-drawer-action]');if(!line||!b)return;const id=line.dataset.id,q=Number(state.cart[id]||0);setQty(id,q+(b.dataset.drawerAction==='plus'?1:-1))});
  els.clearCart.addEventListener('click',clearCart);[els.reviewOrder,els.headerCart].forEach(x=>x.addEventListener('click',openDrawer));[els.closeDrawer,els.backdrop].forEach(x=>x.addEventListener('click',closeDrawer));els.applyCoupon.addEventListener('click',applyCoupon);els.couponInput.addEventListener('keydown',e=>{if(e.key==='Enter')applyCoupon()});customerFields.forEach(id=>$(id).addEventListener('change',saveCustomer));els.copyOrder.addEventListener('click',copy);els.whatsappOrder.addEventListener('click',whatsapp);

  setupHeaderCart();
  setupAccountLink();
  setupMemberBenefitsUI();
  loadCustomer();
  await reloadFromSource(false);
  await loadMemberBenefits();
  window.PURE20_API.subscribePublic(()=>reloadFromSource(true));
  document.addEventListener('visibilitychange',async()=>{if(!document.hidden&&window.PURE20_API.configured){await reloadFromSource(false);await loadMemberBenefits();}});
})();
