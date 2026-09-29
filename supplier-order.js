(() => {
  'use strict';

  const THRESHOLD = 500;
  const DRAFT_KEY = 'pure20_supplier_order_draft_v1';
  const $ = id => document.getElementById(id);
  const money = value => new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', minimumFractionDigits: 2
  }).format(Number(value || 0));

  const els = {
    gate:$('supplierLoginGate'), app:$('supplierApp'), email:$('supplierEmail'), password:$('supplierPassword'),
    login:$('supplierLoginButton'), loginError:$('supplierLoginError'), status:$('supplierStatus'), user:$('supplierUser'),
    signOut:$('supplierSignOut'), search:$('supplierSearch'), clearSearch:$('supplierClearSearch'), catalogue:$('supplierCatalogue'),
    empty:$('supplierEmpty'), productCount:$('supplierProductCount'), variantCount:$('supplierVariantCount'),
    thresholdMessage:$('supplierThresholdMessage'), tierBadge:$('supplierTierBadge'), progressFill:$('supplierProgressFill'),
    progressValue:$('supplierProgressValue'), lines:$('supplierOrderLines'), packCount:$('supplierPackCount'), vialCount:$('supplierVialCount'),
    retailSubtotal:$('supplierRetailSubtotal'), wholesaleSubtotal:$('supplierWholesaleSubtotal'), totalLabel:$('supplierTotalLabel'),
    total:$('supplierTotal'), savings:$('supplierSavings'), clearOrder:$('supplierClearOrder'), copyOrder:$('supplierCopyOrder'),
    copyStatus:$('supplierCopyStatus')
  };

  const state = { products:[], qty:loadDraft() };

  function esc(value){return String(value??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;')}
  function loadDraft(){try{const raw=JSON.parse(localStorage.getItem(DRAFT_KEY)||'{}');if(!raw||typeof raw!=='object')return{};return Object.fromEntries(Object.entries(raw).map(([code,qty])=>[code,Math.max(0,Math.floor(Number(qty)||0))]).filter(([,qty])=>qty>0))}catch(_){return{}}}
  function saveDraft(){try{localStorage.setItem(DRAFT_KEY,JSON.stringify(Object.fromEntries(Object.entries(state.qty).filter(([,qty])=>Number(qty)>0))))}catch(_){}}
  function setStatus(label,mode=''){if(!els.status)return;els.status.classList.toggle('error',mode==='error');const x=els.status.querySelector('span:last-child');if(x)x.textContent=label}
  function normalizedProduct(row){return{code:String(row.code||''),order:Number(row.sort_order||0),product:String(row.product_name||''),specification:String(row.specification||''),retail:Number(row.retail_price_usd||0),wholesale:Number(row.wholesale_price_usd||0)}}
  function selectedRows(){return state.products.map(product=>({product,qty:Math.max(0,Math.floor(Number(state.qty[product.code])||0))})).filter(line=>line.qty>0)}
  function totals(){const lines=selectedRows();const packs=lines.reduce((s,l)=>s+l.qty,0);const retail=lines.reduce((s,l)=>s+l.qty*l.product.retail,0);const wholesale=lines.reduce((s,l)=>s+l.qty*l.product.wholesale,0);const wholesaleActive=wholesale>=THRESHOLD;const total=wholesaleActive?wholesale:retail;return{lines,packs,vials:packs*10,retail,wholesale,wholesaleActive,total,savings:wholesaleActive?Math.max(0,retail-wholesale):0}}
  function groupsForSearch(){const q=els.search.value.trim().toLowerCase();const filtered=state.products.filter(p=>!q||`${p.product} ${p.specification} ${p.code}`.toLowerCase().includes(q));const groups=new Map();for(const p of filtered){if(!groups.has(p.product))groups.set(p.product,[]);groups.get(p.product).push(p)}return groups}

  function renderCatalogue(){
    const groups=groupsForSearch(),markup=[];
    for(const [name,variants] of groups){
      markup.push(`<section class="supplier-product-card"><div class="supplier-product-title"><h3>${esc(name)}</h3><span>${variants.length} ${variants.length===1?'OPTION':'OPTIONS'}</span></div>${variants.map(p=>{const qty=Math.max(0,Math.floor(Number(state.qty[p.code])||0));return `<div class="supplier-variant-row" data-code="${esc(p.code)}"><div class="supplier-variant-meta"><strong>${esc(p.specification)}</strong><span class="supplier-code">${esc(p.code)}</span></div><div class="supplier-price"><span class="supplier-price-retail">${money(p.retail)}</span><span class="supplier-price-wholesale">(${money(p.wholesale)} wholesale)</span></div><div class="supplier-qty"><button type="button" data-qty-action="minus" aria-label="Decrease ${esc(p.code)}">−</button><input type="number" min="0" max="999" step="1" inputmode="numeric" value="${qty}" aria-label="Quantity ${esc(p.code)}" /><button type="button" data-qty-action="plus" aria-label="Increase ${esc(p.code)}">+</button></div></div>`}).join('')}</section>`)
    }
    els.catalogue.innerHTML=markup.join('');els.empty.hidden=groups.size>0;
  }

  function renderSummary(){
    const t=totals();document.body.classList.toggle('wholesale-active',t.wholesaleActive);
    const remaining=Math.max(0,THRESHOLD-t.wholesale),progress=Math.max(0,Math.min(100,(t.wholesale/THRESHOLD)*100));
    els.progressFill.style.width=`${progress}%`;els.progressValue.textContent=`${money(Math.min(t.wholesale,THRESHOLD))} / ${money(THRESHOLD)}`;
    els.tierBadge.textContent=t.wholesaleActive?'WHOLESALE':'RETAIL';els.thresholdMessage.textContent=t.wholesaleActive?'Wholesale pricing unlocked':`${money(remaining)} to wholesale pricing`;
    els.packCount.textContent=String(t.packs);els.vialCount.textContent=String(t.vials);els.retailSubtotal.textContent=money(t.retail);els.wholesaleSubtotal.textContent=money(t.wholesale);els.totalLabel.textContent=t.wholesaleActive?'Wholesale total':'Retail total';els.total.textContent=money(t.total);
    if(t.wholesaleActive&&t.savings>0){els.savings.hidden=false;els.savings.textContent=`You save ${money(t.savings)} vs. retail`}else{els.savings.hidden=true;els.savings.textContent=''}
    els.copyOrder.disabled=t.lines.length===0;
    if(!t.lines.length){els.lines.innerHTML='<div class="supplier-order-empty">No products selected yet.</div>';return}
    els.lines.innerHTML=t.lines.map(({product,qty})=>{const unit=t.wholesaleActive?product.wholesale:product.retail;return `<div class="supplier-order-line"><div><strong>${esc(product.code)} · ${esc(product.product)}</strong><small>${esc(product.specification)} · ${qty} × 10 vials</small></div><div class="supplier-order-line-price">${qty} × ${money(unit)}<br><strong>${money(qty*unit)}</strong></div></div>`}).join('')
  }
  function renderAll(){renderCatalogue();renderSummary()}
  function setQty(code,next){const qty=Math.max(0,Math.min(999,Math.floor(Number(next)||0)));if(qty>0)state.qty[code]=qty;else delete state.qty[code];saveDraft();renderAll()}

  async function copyText(text){if(navigator.clipboard&&window.isSecureContext){await navigator.clipboard.writeText(text);return}const ta=document.createElement('textarea');ta.value=text;ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove()}
  async function copyOrder(){const t=totals();if(!t.lines.length)return;const tier=t.wholesaleActive?'WHOLESALE':'RETAIL';const body=t.lines.map(({product,qty})=>{const unit=t.wholesaleActive?product.wholesale:product.retail;return `${qty} x ${product.code} | ${product.product} | ${product.specification} | ${money(unit)} = ${money(qty*unit)}`});const text=['PURE20 / SUPPLIER ORDER',`Pricing: ${tier}`,'',...body,'',`Packs: ${t.packs}`,`Vials: ${t.vials}`,`TOTAL: ${money(t.total)}`].join('\n');try{await copyText(text);els.copyStatus.textContent='Order copied to clipboard.';setTimeout(()=>{els.copyStatus.textContent=''},2200)}catch(err){console.error(err);els.copyStatus.textContent='Could not copy the order.'}}

  async function loadProducts(){const client=window.PURE20_API?.client;if(!client)throw new Error('Supabase is not configured.');const{data,error}=await client.from('pure20_supplier_products').select('code,sort_order,product_name,specification,retail_price_usd,wholesale_price_usd').eq('active',true).order('sort_order',{ascending:true});if(error)throw error;state.products=(data||[]).map(normalizedProduct);els.productCount.textContent=String(new Set(state.products.map(p=>p.product)).size);els.variantCount.textContent=String(state.products.length);const allowed=new Set(state.products.map(p=>p.code));for(const code of Object.keys(state.qty))if(!allowed.has(code))delete state.qty[code];saveDraft();renderAll()}
  async function verifiedAdmin(){const client=window.PURE20_API?.client;if(!client)return null;const{data,error}=await client.auth.getUser();if(error||!data?.user)return null;const ok=await window.PURE20_API.isAdmin();return ok?data.user:null}
  async function enter(user){els.gate.classList.add('hidden');els.app.hidden=false;els.user.textContent=user?.email||'Admin';setStatus('Private');await loadProducts()}
  async function signIn(){els.loginError.textContent='';els.login.disabled=true;els.login.textContent='Signing in…';try{await window.PURE20_API.signIn(els.email.value.trim(),els.password.value);const user=await verifiedAdmin();if(!user){await window.PURE20_API.signOut();throw new Error('This account is not authorised for the supplier order page.')}await enter(user)}catch(err){els.loginError.textContent=err?.message||'Sign-in failed.';setStatus('Locked','error')}finally{els.login.disabled=false;els.login.textContent='Sign in'}}

  els.login.addEventListener('click',signIn);els.password.addEventListener('keydown',e=>{if(e.key==='Enter')signIn()});els.signOut.addEventListener('click',async()=>{try{await window.PURE20_API.signOut()}catch(_){}location.reload()});els.search.addEventListener('input',renderCatalogue);els.clearSearch.addEventListener('click',()=>{els.search.value='';renderCatalogue();els.search.focus()});
  els.catalogue.addEventListener('click',e=>{const row=e.target.closest('.supplier-variant-row[data-code]'),button=e.target.closest('[data-qty-action]');if(!row||!button)return;const code=row.dataset.code,current=Number(state.qty[code]||0);setQty(code,button.dataset.qtyAction==='plus'?current+1:current-1)});
  els.catalogue.addEventListener('change',e=>{const input=e.target.closest('.supplier-qty input'),row=e.target.closest('.supplier-variant-row[data-code]');if(!input||!row)return;setQty(row.dataset.code,input.value)});
  els.clearOrder.addEventListener('click',()=>{if(!Object.keys(state.qty).length)return;if(!confirm('Clear the complete supplier order?'))return;state.qty={};saveDraft();renderAll()});els.copyOrder.addEventListener('click',copyOrder);

  async function bootstrap(){if(!window.PURE20_API?.configured){els.loginError.textContent='Supabase is not configured.';setStatus('Offline','error');return}try{const user=await verifiedAdmin();if(user)await enter(user);else setStatus('Locked')}catch(err){console.error(err);els.loginError.textContent=err?.message||'Could not verify admin access.';setStatus('Error','error')}}
  bootstrap();
})();
