(() => {
  'use strict';

  if(window.__PURE20_BAC_WATER_V1__) return;
  window.__PURE20_BAC_WATER_V1__=true;

  const PATH=(location.pathname.replace(/\/+$/,'')||'/').toLowerCase();
  const IS_SHOP=PATH==='/shop'||PATH==='/shop.html';
  const IS_PRODUCT=PATH==='/product'||PATH==='/product.html'||PATH.startsWith('/product/');
  if(!IS_SHOP&&!IS_PRODUCT)return;

  const CART_KEY='pure20_retail_cart_v1';
  const BAC_KEY='pure20_bac_qty_v1';
  const DEFAULT_PRICE=4.50;
  const DEFAULT_FREE_FROM=5;

  const $=id=>document.getElementById(id);
  const lang=()=>window.PURE20_I18N?.language || (localStorage.getItem('pure20_language')==='en'?'en':'nl');

  let store=null;
  let productsById=new Map();
  let bacConfig={enabled:true,unitPriceEur:DEFAULT_PRICE,freeFromPeptideVials:DEFAULT_FREE_FROM};
  let scheduled=false;
  let productChoice='without';
  let productObserver=null;
  let shopObserver=null;

  function readJson(key,fallback={}){
    try{
      const value=JSON.parse(localStorage.getItem(key)||'null');
      return value&&typeof value==='object'?value:fallback;
    }catch(_){return fallback}
  }

  function writeJson(key,value){
    try{
      localStorage.setItem(key,JSON.stringify(value));
    }catch(_){}
  }

  function cart(){
    return readJson(CART_KEY,{});
  }

  function bacMap(){
    return readJson(BAC_KEY,{});
  }

  function saveBacMap(value){
    writeJson(BAC_KEY,value);
    window.dispatchEvent(new CustomEvent('pure20:bacchange',{detail:{bac:value}}));
  }

  function n(v){
    return Math.max(0,Math.floor(Number(v)||0));
  }

  function money(v){
    const symbol=store?.settings?.currencySymbol||'€';
    return `${symbol}${Number(v||0).toFixed(2)}`;
  }

  function parseMoney(text){
    let s=String(text||'').replace(/[^\d,.\-]/g,'');
    if(s.includes(',')&&s.includes('.')){
      if(s.lastIndexOf(',')>s.lastIndexOf('.'))s=s.replace(/\./g,'').replace(',','.');
      else s=s.replace(/,/g,'');
    }else if(s.includes(',')){
      s=s.replace(',','.');
    }
    const value=Number(s);
    return Number.isFinite(value)?value:0;
  }

  function isEligibleProduct(p){
    if(!p||p.active===false)return false;
    const category=String(p.category||'').trim().toLowerCase();
    const name=String(p.product||p.product_name||'').trim().toLowerCase();
    if(category==='supplies & solvents')return false;
    if(name.includes('bac water')||name.includes('bacteriostatic')||name.includes('benzyl alcohol')||name.includes('acetic acid water'))return false;
    return String(p.unit||'vial').toLowerCase()==='vial';
  }

  function eligibleCartEntries(){
    const c=cart();
    return Object.entries(c)
      .map(([id,q])=>({id,q:n(q),p:productsById.get(String(id))}))
      .filter(x=>x.q>0&&isEligibleProduct(x.p));
  }

  function peptideVials(){
    return eligibleCartEntries().reduce((sum,x)=>sum+x.q,0);
  }

  function clampBacMap(){
    const c=cart();
    const current=bacMap();
    const next={};
    let changed=false;

    for(const [id,raw] of Object.entries(current)){
      const p=productsById.get(String(id));
      const cartQty=n(c[id]);
      if(!isEligibleProduct(p)||cartQty<=0){
        changed=true;
        continue;
      }
      const qty=Math.min(cartQty,n(raw));
      if(qty>0)next[id]=qty;
      if(qty!==n(raw))changed=true;
    }

    if(changed||Object.keys(next).length!==Object.keys(current).length){
      writeJson(BAC_KEY,next);
    }
    return next;
  }

  function bacUnits(){
    const map=clampBacMap();
    return eligibleCartEntries().reduce((sum,x)=>sum+Math.min(x.q,n(map[x.id])),0);
  }

  function missingBacUnits(){
    return Math.max(0,peptideVials()-bacUnits());
  }

  function bacIsFree(totalPeptideVials=peptideVials()){
    return totalPeptideVials>=Number(bacConfig.freeFromPeptideVials||DEFAULT_FREE_FROM);
  }

  function bacCharge(){
    const units=bacUnits();
    return units>0&&!bacIsFree()?units*Number(bacConfig.unitPriceEur||DEFAULT_PRICE):0;
  }

  function setAllBac(){
    const next=bacMap();
    for(const x of eligibleCartEntries())next[x.id]=x.q;
    saveBacMap(next);
  }

  function removeAllBac(){
    const next=bacMap();
    for(const x of eligibleCartEntries())delete next[x.id];
    saveBacMap(next);
  }

  function esc(v){
    return String(v??'').replace(/[&<>"']/g,ch=>({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[ch]));
  }

  function ensureStyle(){
    if(document.getElementById('pure20BacWaterStyle'))return;
    const style=document.createElement('style');
    style.id='pure20BacWaterStyle';
    style.textContent=`
      .p20-bac-option{
        margin-top:20px;
        padding:18px 0;
        border-top:1px solid var(--prod-line,#d6d3cb);
        border-bottom:1px solid var(--prod-line,#d6d3cb);
      }
      .p20-bac-option-head{
        display:flex;
        justify-content:space-between;
        gap:16px;
        align-items:flex-end;
        margin-bottom:12px;
      }
      .p20-bac-option-head span{
        font-size:9px;
        letter-spacing:.14em;
        color:var(--prod-muted,#777);
      }
      .p20-bac-option-head small{
        font-size:9px;
        color:var(--prod-muted,#777);
      }
      .p20-bac-buttons{
        display:grid;
        grid-template-columns:1fr 1fr;
        gap:8px;
      }
      .p20-bac-choice{
        min-height:50px;
        padding:10px 12px;
        border:1px solid var(--prod-ink,#111);
        background:transparent;
        color:inherit;
        font:inherit;
        font-size:10px;
        line-height:1.35;
        cursor:pointer;
      }
      .p20-bac-choice.active{
        background:var(--prod-ink,#111);
        color:var(--prod-bg,#fff);
      }
      .p20-bac-note{
        margin:10px 0 0;
        font-size:10px;
        line-height:1.5;
        color:var(--prod-muted,#777);
      }

      .p20-bac-cart-block{
        border:1px solid #d6d3cb;
        padding:16px;
        margin:0 0 16px;
      }
      .p20-bac-cart-head{
        display:flex;
        justify-content:space-between;
        gap:16px;
        align-items:flex-start;
      }
      .p20-bac-cart-head strong{
        display:block;
        font-size:12px;
        margin-bottom:4px;
      }
      .p20-bac-cart-head span{
        font-size:10px;
        color:#777;
      }
      .p20-bac-pill{
        flex:0 0 auto;
        padding:5px 8px;
        border:1px solid currentColor;
        font-size:9px;
        letter-spacing:.08em;
      }
      .p20-bac-reminder{
        margin-top:12px;
        padding:12px;
        background:#f2f1ec;
        border:1px solid #c8c5bd;
        font-size:10px;
        line-height:1.55;
      }
      .p20-bac-reminder strong{display:block;margin-bottom:4px}
      .p20-bac-actions{
        display:flex;
        gap:8px;
        flex-wrap:wrap;
        margin-top:12px;
      }
      .p20-bac-actions button{
        min-height:38px;
        border:1px solid #111;
        background:#111;
        color:#fff;
        padding:0 12px;
        font:inherit;
        font-size:9px;
        cursor:pointer;
      }
      .p20-bac-actions button.secondary{
        background:transparent;
        color:inherit;
      }
      .order-line.p20-bac-line{
        border-top:1px dashed #aaa;
      }
      .order-line.p20-bac-line .order-line-name::after{
        content:"";
      }
      #bacWaterTotalRow[hidden]{display:none!important}

      html[data-p20-theme="dark"] .p20-bac-cart-block{
        border-color:#303632;
      }
      html[data-p20-theme="dark"] .p20-bac-reminder{
        background:#151916;
        border-color:#303632;
      }
      html[data-p20-theme="dark"] .p20-bac-actions button{
        border-color:#f4f3ee;
        background:#f4f3ee;
        color:#0f1210;
      }
      html[data-p20-theme="dark"] .p20-bac-actions button.secondary{
        background:transparent;
        color:#f4f3ee;
      }

      @media(max-width:560px){
        .p20-bac-buttons{grid-template-columns:1fr}
      }
    `;
    document.head.appendChild(style);
  }

  async function waitForApi(){
    for(let i=0;i<180;i++){
      if(window.PURE20_API?.loadPublicStore)return true;
      await new Promise(r=>setTimeout(r,50));
    }
    return false;
  }

  async function loadStore(){
    if(!await waitForApi())return false;
    try{
      const loaded=await window.PURE20_API.loadPublicStore();
      store=loaded?.store||null;
      productsById=new Map((store?.products||[]).map(p=>[String(p.id),p]));
      const cfg=store?.settings?.bacWater||{};
      bacConfig={
        enabled:cfg.enabled!==false,
        unitPriceEur:Number(cfg.unitPriceEur||DEFAULT_PRICE),
        freeFromPeptideVials:Math.max(1,n(cfg.freeFromPeptideVials||DEFAULT_FREE_FROM))
      };
      clampBacMap();
      return true;
    }catch(err){
      console.warn('PURE20 BAC water:',err?.message||err);
      return false;
    }
  }

  function currentVariantId(){
    return document.querySelector('#variantButtons .p20-variant-button.active')?.dataset.id
      || new URLSearchParams(location.search).get('variant')
      || '';
  }

  function projectedPeptideVials(addQty){
    return peptideVials()+Math.max(0,n(addQty));
  }

  function productText(key){
    const nl={
      title:'BACTERIOSTATISCH WATER',
      ratio:'1 per vial',
      without:'Zonder bacteriostatisch water',
      withPaid:`Met bacteriostatisch water · +${money(bacConfig.unitPriceEur)} per vial`,
      withFree:'Met bacteriostatisch water · GRATIS',
      freeNote:`Vanaf ${bacConfig.freeFromPeptideVials} peptide-vials in je winkelmandje is al het gekozen bacteriostatisch water gratis.`,
      included:`Bacteriostatisch water wordt 1-op-1 toegevoegd voor de vials die je nu toevoegt.`,
      pricePending:'Prijs volgt'
    };
    const en={
      title:'BACTERIOSTATIC WATER',
      ratio:'1 per vial',
      without:'Without bacteriostatic water',
      withPaid:`With bacteriostatic water · +${money(bacConfig.unitPriceEur)} per vial`,
      withFree:'With bacteriostatic water · FREE',
      freeNote:`From ${bacConfig.freeFromPeptideVials} peptide vials in your cart, all selected bacteriostatic water is free.`,
      included:'Bacteriostatic water is added 1:1 for the vials you add now.',
      pricePending:'Price pending'
    };
    return (lang()==='en'?en:nl)[key];
  }

  function ensureProductUi(){
    if(!IS_PRODUCT||!bacConfig.enabled)return;
    const variants=$('variantButtons');
    if(!variants)return;

    let box=$('bacWaterOption');
    if(!box){
      box=document.createElement('section');
      box.id='bacWaterOption';
      box.className='p20-bac-option';
      box.innerHTML=`
        <div class="p20-bac-option-head">
          <span id="bacOptionTitle"></span>
          <small id="bacOptionRatio"></small>
        </div>
        <div class="p20-bac-buttons">
          <button type="button" class="p20-bac-choice active" data-bac-choice="without"></button>
          <button type="button" class="p20-bac-choice" data-bac-choice="with"></button>
        </div>
        <p id="bacOptionNote" class="p20-bac-note"></p>
      `;
      variants.insertAdjacentElement('afterend',box);

      box.addEventListener('click',e=>{
        const b=e.target.closest('[data-bac-choice]');
        if(!b)return;
        productChoice=b.dataset.bacChoice==='with'?'with':'without';
        refreshProductUi();
      });
    }
  }

  function refreshProductUi(){
    if(!IS_PRODUCT||!store)return;
    const id=String(currentVariantId()||'');
    const p=productsById.get(id);
    const box=$('bacWaterOption');
    if(!p||!isEligibleProduct(p)){
      if(box)box.hidden=true;
      return;
    }

    ensureProductUi();
    if(!$('bacWaterOption'))return;
    $('bacWaterOption').hidden=false;

    const q=Math.max(1,n($('qtyInput')?.value||1));
    const free=bacIsFree(projectedPeptideVials(q));
    const base=Number(p.price||0);
    const priceEl=$('selectedPrice');

    $('bacOptionTitle').textContent=productText('title');
    $('bacOptionRatio').textContent=productText('ratio');

    const withoutBtn=document.querySelector('[data-bac-choice="without"]');
    const withBtn=document.querySelector('[data-bac-choice="with"]');
    if(withoutBtn){
      withoutBtn.textContent=productText('without');
      withoutBtn.classList.toggle('active',productChoice==='without');
      withoutBtn.setAttribute('aria-pressed',String(productChoice==='without'));
    }
    if(withBtn){
      withBtn.textContent=free?productText('withFree'):productText('withPaid');
      withBtn.classList.toggle('active',productChoice==='with');
      withBtn.setAttribute('aria-pressed',String(productChoice==='with'));
    }

    $('bacOptionNote').textContent=productChoice==='with'
      ? `${productText('included')} ${productText('freeNote')}`
      : productText('freeNote');

    if(priceEl){
      let expected;
      if(base<=0){
        expected=productText('pricePending');
      }else if(productChoice==='with'&&!free){
        expected=money(base+Number(bacConfig.unitPriceEur||DEFAULT_PRICE));
      }else{
        expected=money(base);
      }
      if(priceEl.textContent!==expected)priceEl.textContent=expected;
      priceEl.dataset.bacPrice='1';
    }

    patchProductCartBar();
  }

  function patchProductCartBar(){
    if(!IS_PRODUCT||!store)return;
    const c=cart();
    let base=0;
    for(const [id,qRaw] of Object.entries(c)){
      const p=productsById.get(String(id));
      if(!p||p.active===false)continue;
      base+=n(qRaw)*Number(p.price||0);
    }
    const total=base+bacCharge();
    const el=$('productCartTotal');
    if(el&&el.textContent!==money(total))el.textContent=money(total);
  }

  function productAddCapture(e){
    if(!IS_PRODUCT)return;
    const add=e.target.closest('#addToCart');
    if(!add||add.disabled)return;
    const id=String(currentVariantId()||'');
    const p=productsById.get(id);
    if(!isEligibleProduct(p))return;

    const q=Math.max(1,n($('qtyInput')?.value||1));
    const map=bacMap();
    if(productChoice==='with'){
      map[id]=n(map[id])+q;
      saveBacMap(map);
    }
  }

  function setupProduct(){
    ensureProductUi();
    refreshProductUi();

    document.addEventListener('click',productAddCapture,true);
    $('qtyInput')?.addEventListener('input',refreshProductUi);
    $('qtyInput')?.addEventListener('change',refreshProductUi);
    $('qtyMinus')?.addEventListener('click',()=>setTimeout(refreshProductUi,0));
    $('qtyPlus')?.addEventListener('click',()=>setTimeout(refreshProductUi,0));
    $('variantButtons')?.addEventListener('click',()=>setTimeout(refreshProductUi,0));

    const target=$('variantButtons');
    const price=$('selectedPrice');
    if(target||price){
      productObserver=new MutationObserver(()=>schedule(refreshProductUi));
      if(target)productObserver.observe(target,{childList:true,subtree:true,attributes:true,attributeFilter:['class','aria-pressed']});
      if(price)productObserver.observe(price,{childList:true,characterData:true,subtree:true});
    }

    window.addEventListener('pure20:languagechange',refreshProductUi);
    window.addEventListener('pure20:i18nready',refreshProductUi);
    window.addEventListener('pure20:retailcartchange',()=>schedule(refreshProductUi));
    window.addEventListener('pure20:bacchange',()=>schedule(refreshProductUi));
    window.addEventListener('storage',e=>{
      if(e.key===CART_KEY||e.key===BAC_KEY)schedule(refreshProductUi);
    });
  }

  function shopText(key,vars={}){
    const nl={
      heading:'Bacteriostatisch water',
      summary:`${vars.bac||0} voor ${vars.vials||0} peptide-vials`,
      free:'GRATIS',
      paid:money(vars.charge||0),
      zeroTitle:'Reminder: geen bacteriostatisch water geselecteerd',
      zeroBody:`Je hebt ${vars.vials||0} peptide-vials in je winkelmandje maar geen bacteriostatisch water. Voor een 1-op-1 verhouding ontbreken er ${vars.missing||0}.`,
      partialTitle:'Reminder: niet genoeg bacteriostatisch water',
      partialBody:`Je hebt ${vars.vials||0} peptide-vials en ${vars.bac||0} bacteriostatisch water. Voor 1-op-1 ontbreken er nog ${vars.missing||0}.`,
      fill:vars.free?'Gratis aanvullen tot 1 per vial':'Aanvullen tot 1 per vial',
      remove:'Bacteriostatisch water verwijderen',
      rule:`1 bacteriostatisch water per geselecteerde vial. Vanaf ${bacConfig.freeFromPeptideVials} peptide-vials is al het gekozen water gratis.`,
      line:'Bacteriostatisch water',
      lineFree:`${vars.bac||0} × GRATIS vanaf ${bacConfig.freeFromPeptideVials} peptide-vials`,
      linePaid:`${vars.bac||0} × ${money(bacConfig.unitPriceEur)}`,
      totalLabel:'Bacteriostatisch water'
    };
    const en={
      heading:'Bacteriostatic water',
      summary:`${vars.bac||0} for ${vars.vials||0} peptide vials`,
      free:'FREE',
      paid:money(vars.charge||0),
      zeroTitle:'Reminder: no bacteriostatic water selected',
      zeroBody:`You have ${vars.vials||0} peptide vials in your cart but no bacteriostatic water. ${vars.missing||0} are missing for a 1:1 ratio.`,
      partialTitle:'Reminder: not enough bacteriostatic water',
      partialBody:`You have ${vars.vials||0} peptide vials and ${vars.bac||0} bacteriostatic water. ${vars.missing||0} more are needed for a 1:1 ratio.`,
      fill:vars.free?'Add free water for every vial':'Add water for every vial',
      remove:'Remove bacteriostatic water',
      rule:`1 bacteriostatic water per selected vial. From ${bacConfig.freeFromPeptideVials} peptide vials, all selected water is free.`,
      line:'Bacteriostatic water',
      lineFree:`${vars.bac||0} × FREE from ${bacConfig.freeFromPeptideVials} peptide vials`,
      linePaid:`${vars.bac||0} × ${money(bacConfig.unitPriceEur)}`,
      totalLabel:'Bacteriostatic water'
    };
    return (lang()==='en'?en:nl)[key];
  }

  function ensureShopUi(){
    if(!IS_SHOP)return;

    const first=document.querySelector('#orderDrawer .first-block');
    if(first&&!$('bacWaterCartBlock')){
      const section=document.createElement('section');
      section.id='bacWaterCartBlock';
      section.className='drawer-block p20-bac-cart-block';
      section.innerHTML=`
        <div class="p20-bac-cart-head">
          <div>
            <strong id="bacCartHeading"></strong>
            <span id="bacCartSummary"></span>
          </div>
          <span id="bacCartPill" class="p20-bac-pill"></span>
        </div>
        <div id="bacCartReminder" class="p20-bac-reminder" hidden></div>
        <p id="bacCartRule" style="font-size:10px;line-height:1.5;color:#777;margin:12px 0 0"></p>
        <div class="p20-bac-actions">
          <button id="bacFillAll" type="button"></button>
          <button id="bacRemoveAll" class="secondary" type="button"></button>
        </div>
      `;
      first.insertAdjacentElement('afterend',section);

      $('bacFillAll')?.addEventListener('click',()=>{
        setAllBac();
        refreshShop();
      });
      $('bacRemoveAll')?.addEventListener('click',()=>{
        removeAllBac();
        refreshShop();
      });
    }

    const totals=document.querySelector('.totals-card');
    if(totals&&!$('bacWaterTotalRow')){
      const row=document.createElement('div');
      row.id='bacWaterTotalRow';
      row.hidden=true;
      row.innerHTML='<span></span><strong></strong>';
      const shipping=[...totals.children].find(x=>{
        const s=x.querySelector('span');
        const t=(s?.textContent||'').trim().toLowerCase();
        return t==='shipping'||t==='verzending';
      });
      if(shipping)totals.insertBefore(row,shipping);
      else totals.insertBefore(row,totals.lastElementChild||null);
    }
  }

  function ensureBacOrderLine(vials,bac,charge,free){
    const lines=$('orderLines');
    if(!lines)return;

    let line=lines.querySelector('.p20-bac-line');
    if(bac<=0){
      line?.remove();
      return;
    }

    if(!line){
      line=document.createElement('div');
      line.className='order-line p20-bac-line';
      line.dataset.id='bac-water-addon';
      lines.appendChild(line);
    }

    line.innerHTML=`
      <div>
        <div class="order-line-name">${esc(shopText('line'))}</div>
        <div class="order-line-meta">${esc(free?shopText('lineFree',{bac}):shopText('linePaid',{bac}))}</div>
      </div>
      <div class="order-line-right">
        <div class="order-line-total">${free?esc(shopText('free')):esc(money(charge))}</div>
      </div>
    `;
  }

  function baseSubtotal(){
    const c=cart();
    let total=0;
    for(const [id,qRaw] of Object.entries(c)){
      const p=productsById.get(String(id));
      if(!p||p.active===false)continue;
      total+=n(qRaw)*Number(p.price||0);
    }
    return total;
  }

  function currentDiscounts(){
    return {
      coupon:Math.abs(parseMoney($('drawerDiscount')?.textContent)),
      referral:Math.abs(parseMoney($('drawerMemberDiscount')?.textContent)),
      credit:Math.abs(parseMoney($('drawerCreditUsed')?.textContent))
    };
  }

  function shippingAmount(){
    const text=String($('drawerShipping')?.textContent||'').toLowerCase();
    if(text.includes('gratis')||text.includes('free'))return 0;
    return Math.max(0,parseMoney(text));
  }

  function refreshShop(){
    if(!IS_SHOP||!store)return;
    ensureShopUi();

    const vials=peptideVials();
    const bac=bacUnits();
    const missing=Math.max(0,vials-bac);
    const free=bacIsFree(vials);
    const charge=bac>0&&!free?bac*Number(bacConfig.unitPriceEur||DEFAULT_PRICE):0;
    const base=baseSubtotal();
    const discounts=currentDiscounts();
    const shipping=shippingAmount();
    const adjustedSubtotal=base+charge;
    const adjustedAfterDiscounts=Math.max(0,adjustedSubtotal-discounts.coupon-discounts.referral-discounts.credit);
    const adjustedTotal=adjustedAfterDiscounts+shipping;

    const block=$('bacWaterCartBlock');
    if(block)block.hidden=vials<=0&&bac<=0;

    if($('bacCartHeading'))$('bacCartHeading').textContent=shopText('heading');
    if($('bacCartSummary'))$('bacCartSummary').textContent=shopText('summary',{bac,vials});
    if($('bacCartPill'))$('bacCartPill').textContent=free&&bac>0?shopText('free'):shopText('paid',{charge});
    if($('bacCartRule'))$('bacCartRule').textContent=shopText('rule');

    const reminder=$('bacCartReminder');
    if(reminder){
      if(vials>0&&missing>0){
        reminder.hidden=false;
        const zero=bac===0;
        reminder.innerHTML=`<strong>${esc(shopText(zero?'zeroTitle':'partialTitle'))}</strong>${esc(shopText(zero?'zeroBody':'partialBody',{vials,bac,missing}))}`;
      }else{
        reminder.hidden=true;
        reminder.innerHTML='';
      }
    }

    if($('bacFillAll')){
      $('bacFillAll').hidden=vials<=0||missing<=0;
      $('bacFillAll').textContent=shopText('fill',{free});
    }
    if($('bacRemoveAll')){
      $('bacRemoveAll').hidden=bac<=0;
      $('bacRemoveAll').textContent=shopText('remove');
    }

    const totalRow=$('bacWaterTotalRow');
    if(totalRow){
      totalRow.hidden=bac<=0;
      totalRow.querySelector('span').textContent=shopText('totalLabel');
      totalRow.querySelector('strong').textContent=free?shopText('free'):money(charge);
    }

    ensureBacOrderLine(vials,bac,charge,free);

    const subtotalEl=$('drawerSubtotal');
    const totalEl=$('drawerTotal');
    const barSubtotal=$('cartSubtotal');
    if(subtotalEl&&subtotalEl.textContent!==money(adjustedSubtotal))subtotalEl.textContent=money(adjustedSubtotal);
    if(totalEl&&totalEl.textContent!==money(adjustedTotal))totalEl.textContent=money(adjustedTotal);
    if(barSubtotal&&barSubtotal.textContent!==money(adjustedAfterDiscounts))barSubtotal.textContent=money(adjustedAfterDiscounts);
  }

  function schedule(fn=refreshShop){
    if(scheduled)return;
    scheduled=true;
    requestAnimationFrame(()=>{
      scheduled=false;
      fn();
    });
  }

  function toast(message){
    const el=$('toast')||$('productToast');
    if(!el)return;
    el.textContent=message;
    el.classList.add('show');
    clearTimeout(toast.t);
    toast.t=setTimeout(()=>el.classList.remove('show'),1800);
  }

  function collectOrderLines(){
    return [...document.querySelectorAll('#orderLines .order-line')].map(line=>{
      const name=line.querySelector('.order-line-name')?.textContent?.trim()||'';
      const meta=line.querySelector('.order-line-meta')?.textContent?.trim()||'';
      const total=line.querySelector('.order-line-total')?.textContent?.trim()||'';
      return {id:line.dataset.id||'',name,meta,total};
    }).filter(x=>x.name);
  }

  function buildShareText(){
    refreshShop();
    const lines=collectOrderLines();
    const v=id=>$(id)?.value?.trim?.()||'-';
    const s=store?.settings||{};
    const isEn=lang()==='en';

    return [
      `${s.brandName||'PURE20.'} ${isEn?'ORDER REQUEST':'BESTELAANVRAAG'}`,'',
      ...lines.map(x=>`${x.name} · ${x.meta} — ${x.total}`),
      '',
      `${isEn?'Subtotal':'Subtotaal'}: ${$('drawerSubtotal')?.textContent||money(0)}`,
      ...(!$('discountRow')?.hidden?[`${isEn?'Coupon discount':'Kortingscode'}: ${$('drawerDiscount')?.textContent||''}`]:[]),
      ...(!$('memberDiscountRow')?.hidden?[`${isEn?'Referral discount':'Referral korting'}: ${$('drawerMemberDiscount')?.textContent||''}`]:[]),
      ...(!$('creditUsedRow')?.hidden?[`${isEn?'Referral credit':'Referral tegoed'}: ${$('drawerCreditUsed')?.textContent||''}`]:[]),
      `${isEn?'Shipping':'Verzending'}: ${$('drawerShipping')?.textContent||''}`,
      `${isEn?'Current total':'Huidig totaal'} ${s.currency||'EUR'}: ${$('drawerTotal')?.textContent||money(0)}`,
      '',
      isEn?'CUSTOMER DETAILS':'KLANTGEGEVENS',
      `${isEn?'Name':'Naam'}: ${v('fullName')}`,
      `${isEn?'Address':'Adres'}: ${v('address')}`,
      `${isEn?'Postal code':'Postcode'}: ${v('zip')}`,
      `${isEn?'Country':'Land'}: ${v('country')}`,
      `Email: ${v('email')}`,
      `${isEn?'Phone':'Telefoon'}: ${v('phone')}`,
      '',
      isEn
        ?'Availability, shipping and payment to be confirmed separately.'
        :'Beschikbaarheid, verzending en betaling worden afzonderlijk bevestigd.'
    ].join('\n');
  }

  function recordNumber(text){
    return parseMoney(text);
  }

  async function recordOrder(source){
    try{
      const cfg=window.PURE20_SUPABASE_CONFIG||{};
      if(!cfg.url||!cfg.key||!window.supabase?.createClient)return;

      const items=[...document.querySelectorAll('#orderLines .order-line')].map(line=>{
        const name=line.querySelector('.order-line-name')?.textContent?.trim()||'';
        const meta=line.querySelector('.order-line-meta')?.textContent?.trim()||'';
        const totalText=line.querySelector('.order-line-total')?.textContent?.trim()||'';
        const m=meta.match(/(\d+)\s*×/);
        return {
          product_id:line.dataset.id||'',
          name,
          quantity:m?Number(m[1]):1,
          meta,
          line_total:recordNumber(totalText)
        };
      }).filter(x=>x.name);

      if(!items.length)return;

      const customer={
        name:$('fullName')?.value?.trim?.()||'',
        company:$('company')?.value?.trim?.()||'',
        vat_number:$('vat')?.value?.trim?.()||'',
        address:$('address')?.value?.trim?.()||'',
        postal_code:$('zip')?.value?.trim?.()||'',
        country:$('country')?.value?.trim?.()||'',
        email:$('email')?.value?.trim?.()||'',
        phone:$('phone')?.value?.trim?.()||''
      };

      const payload={
        p_channel:'retail',
        p_customer:customer,
        p_items:items,
        p_subtotal:recordNumber($('drawerSubtotal')?.textContent),
        p_discount:Math.abs(recordNumber($('drawerDiscount')?.textContent)),
        p_shipping:recordNumber($('drawerShipping')?.textContent),
        p_total:recordNumber($('drawerTotal')?.textContent),
        p_currency:store?.settings?.currency||'EUR',
        p_coupon_code:$('couponInput')?.value?.trim?.().toUpperCase()||'',
        p_source:source,
        p_use_credit:Boolean($('useReferralCredit')?.checked)
      };

      const fp=JSON.stringify({c:payload.p_channel,e:payload.p_customer.email,i:payload.p_items,t:payload.p_total});
      const now=Date.now();
      const prev=readJson('pure20_last_recorded_order',null);
      if(prev&&prev.fp===fp&&now-Number(prev.at||0)<10*60*1000)return;

      const client=window.supabase.createClient(cfg.url,cfg.key,{
        auth:{persistSession:true,autoRefreshToken:true}
      });
      const {error}=await client.rpc('pure20_record_order',payload);
      if(error)throw error;
      writeJson('pure20_last_recorded_order',{fp,at:now});
    }catch(err){
      console.warn('PURE20 BAC order history:',err?.message||err);
    }
  }

  async function handleShare(e){
    if(!IS_SHOP)return;
    const button=e.target.closest('#copyOrder,#whatsappOrder');
    if(!button)return;

    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();

    if(!collectOrderLines().length){
      toast(lang()==='en'?'Add at least one item first.':'Voeg eerst minstens één product toe.');
      return;
    }
    if($('researchConfirm')&&!$('researchConfirm').checked){
      toast(lang()==='en'?'Confirm the notice first.':'Bevestig eerst de melding.');
      return;
    }

    const text=buildShareText();
    const source=button.id==='whatsappOrder'?'whatsapp':'copy';

    if(source==='copy'){
      try{
        await navigator.clipboard.writeText(text);
      }catch(_){
        const ta=document.createElement('textarea');
        ta.value=text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
      }
      toast(lang()==='en'?'Order copied.':'Bestelling gekopieerd.');
    }else{
      const number=String(store?.settings?.whatsappNumber||'').replace(/\D/g,'');
      const url=number
        ?`https://wa.me/${number}?text=${encodeURIComponent(text)}`
        :`https://wa.me/?text=${encodeURIComponent(text)}`;
      window.open(url,'_blank','noopener');
    }

    recordOrder(source);
  }

  function setupShop(){
    ensureShopUi();
    refreshShop();

    document.addEventListener('click',handleShare,true);

    const body=document.body;
    shopObserver=new MutationObserver(()=>schedule(refreshShop));
    shopObserver.observe(body,{childList:true,subtree:true,characterData:true});

    window.addEventListener('pure20:retailcartchange',()=>schedule(refreshShop));
    window.addEventListener('pure20:bacchange',()=>schedule(refreshShop));
    window.addEventListener('pure20:languagechange',()=>schedule(refreshShop));
    window.addEventListener('pure20:i18nready',()=>schedule(refreshShop));
    window.addEventListener('storage',e=>{
      if(e.key===CART_KEY||e.key===BAC_KEY)schedule(refreshShop);
    });

    document.addEventListener('click',e=>{
      if(e.target.closest('#catalogue [data-action],#orderLines [data-drawer-action],#orderLines [data-da]')){
        setTimeout(()=>schedule(refreshShop),0);
      }
    });
    document.addEventListener('change',e=>{
      if(e.target.closest('#catalogue .qty-control input,#orderLines .p20-cart-qty')){
        setTimeout(()=>schedule(refreshShop),0);
      }
    });
  }

  async function boot(){
    ensureStyle();
    if(!await loadStore())return;
    if(!bacConfig.enabled)return;

    if(IS_PRODUCT)setupProduct();
    if(IS_SHOP)setupShop();
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',boot,{once:true});
  }else{
    boot();
  }
})();