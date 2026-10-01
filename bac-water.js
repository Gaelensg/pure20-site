(() => {
  'use strict';

  if(window.__PURE20_BAC_WATER_V2__)return;
  window.__PURE20_BAC_WATER_V2__=true;

  const PATH=(location.pathname.replace(/\/+$/,'')||'/').toLowerCase();
  const IS_SHOP=PATH==='/shop'||PATH==='/shop.html';
  const IS_PRODUCT=PATH==='/product'||PATH==='/product.html'||PATH.startsWith('/product/');
  if(!IS_SHOP&&!IS_PRODUCT)return;

  const CART_KEY='pure20_retail_cart_v1';
  const OLD_BAC_KEY='pure20_bac_qty_v1';
  const DEFAULT_PRICE=4.50;
  const DEFAULT_FREE_FROM=5;

  const $=id=>document.getElementById(id);
  const lang=()=>window.PURE20_I18N?.language || (localStorage.getItem('pure20_language')==='en'?'en':'nl');

  let store=null;
  let productsById=new Map();
  let bacProduct=null;
  let cfg={enabled:true,unitPriceEur:DEFAULT_PRICE,freeFromPeptideVials:DEFAULT_FREE_FROM};
  let productChoice='without';
  let raf=false;
  let observer=null;

  function readCart(){
    try{
      const x=JSON.parse(localStorage.getItem(CART_KEY)||'{}');
      return x&&typeof x==='object'?x:{};
    }catch(_){return{}}
  }

  function writeCart(cart){
    localStorage.setItem(CART_KEY,JSON.stringify(cart));
    window.dispatchEvent(new CustomEvent('pure20:retailcartchange',{detail:{cart}}));
  }

  function qty(v){
    return Math.max(0,Math.floor(Number(v)||0));
  }

  function money(v){
    const symbol=store?.settings?.currencySymbol||'€';
    return `${symbol}${Number(v||0).toFixed(2)}`;
  }

  function safeNumber(text){
    let s=String(text||'').replace(/[^\d,.\-]/g,'');
    if(s.includes(',')&&s.includes('.')){
      if(s.lastIndexOf(',')>s.lastIndexOf('.'))s=s.replace(/\./g,'').replace(',','.');
      else s=s.replace(/,/g,'');
    }else if(s.includes(',')){
      s=s.replace(',','.');
    }
    const n=Number(s);
    return Number.isFinite(n)?n:0;
  }

  function esc(v){
    return String(v??'').replace(/[&<>"']/g,ch=>({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[ch]));
  }

  function isPeptide(p){
    if(!p||p.active===false)return false;
    if(String(p.id)===String(bacProduct?.id||''))return false;

    const category=String(p.category||'').toLowerCase();
    const name=String(p.product||'').toLowerCase();

    if(category==='supplies & solvents')return false;
    if(
      name.includes('bac water') ||
      name.includes('bacteriostatic') ||
      name.includes('benzyl alcohol') ||
      name.includes('acetic acid water')
    )return false;

    return String(p.unit||'vial').toLowerCase()==='vial';
  }

  function peptideVials(cart=readCart()){
    return Object.entries(cart).reduce((sum,[id,q])=>{
      const p=productsById.get(String(id));
      return sum+(isPeptide(p)?qty(q):0);
    },0);
  }

  function bacQty(cart=readCart()){
    return bacProduct?qty(cart[bacProduct.id]):0;
  }

  function bacFree(cart=readCart()){
    return peptideVials(cart)>=Number(cfg.freeFromPeptideVials||DEFAULT_FREE_FROM);
  }

  function bacCost(cart=readCart()){
    return bacFree(cart)?0:bacQty(cart)*Number(cfg.unitPriceEur||DEFAULT_PRICE);
  }

  function grossSubtotal(cart=readCart()){
    return Object.entries(cart).reduce((sum,[id,q])=>{
      const p=productsById.get(String(id));
      if(!p||p.active===false)return sum;
      return sum+qty(q)*Number(p.price||0);
    },0);
  }

  function addBac(amount){
    if(!bacProduct||amount<=0)return;
    const cart=readCart();
    cart[bacProduct.id]=qty(cart[bacProduct.id])+qty(amount);
    writeCart(cart);
  }

  function setBac(target){
    if(!bacProduct)return;
    const cart=readCart();
    target=qty(target);
    if(target>0)cart[bacProduct.id]=target;
    else delete cart[bacProduct.id];
    writeCart(cart);
  }

  function selectedVariantId(){
    return document.querySelector('#variantButtons .p20-variant-button.active')?.dataset.id
      || new URLSearchParams(location.search).get('variant')
      || '';
  }

  function selectedProduct(){
    return productsById.get(String(selectedVariantId()||''))||null;
  }

  function style(){
    if($('p20BacV2Style'))return;
    const el=document.createElement('style');
    el.id='p20BacV2Style';
    el.textContent=`
      .p20-bac-option{
        margin-top:18px;
        padding:18px 0;
        border-top:1px solid var(--prod-line,#d6d3cb);
        border-bottom:1px solid var(--prod-line,#d6d3cb);
      }
      .p20-bac-head{
        display:flex;justify-content:space-between;gap:14px;align-items:end;margin-bottom:12px
      }
      .p20-bac-head span{font-size:9px;letter-spacing:.14em;color:var(--prod-muted,#777)}
      .p20-bac-head small{font-size:9px;color:var(--prod-muted,#777)}
      .p20-bac-buttons{display:grid;grid-template-columns:1fr 1fr;gap:8px}
      .p20-bac-choice{
        min-height:50px;padding:10px 12px;border:1px solid var(--prod-ink,#111);
        background:transparent;color:inherit;font:inherit;font-size:10px;line-height:1.35;cursor:pointer
      }
      .p20-bac-choice.active{background:var(--prod-ink,#111);color:var(--prod-bg,#fff)}
      .p20-bac-note{margin:10px 0 0;font-size:10px;line-height:1.55;color:var(--prod-muted,#777)}
      .p20-bac-reminder{
        margin:0 0 16px;padding:14px;border:1px solid #c8c5bd;background:#f2f1ec;
        font-size:10px;line-height:1.55
      }
      .p20-bac-reminder strong{display:block;margin-bottom:4px;font-size:11px}
      .p20-bac-reminder-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}
      .p20-bac-reminder button{
        min-height:38px;padding:0 12px;border:1px solid #111;background:#111;color:#fff;
        font:inherit;font-size:9px;cursor:pointer
      }
      .p20-bac-reminder button.secondary{background:transparent;color:inherit}
      .p20-bac-free-row{
        margin:0 0 12px;padding:10px 12px;border:1px solid #b7b4ac;
        display:flex;justify-content:space-between;gap:12px;font-size:10px
      }
      html[data-p20-theme="dark"] .p20-bac-reminder{background:#151916;border-color:#303632}
      html[data-p20-theme="dark"] .p20-bac-reminder button{background:#f4f3ee;color:#0f1210;border-color:#f4f3ee}
      html[data-p20-theme="dark"] .p20-bac-reminder button.secondary{background:transparent;color:#f4f3ee}
      @media(max-width:560px){.p20-bac-buttons{grid-template-columns:1fr}}
    `;
    document.head.appendChild(el);
  }

  async function load(){
    for(let i=0;i<180&&!window.PURE20_API?.loadPublicStore;i++){
      await new Promise(r=>setTimeout(r,50));
    }
    if(!window.PURE20_API?.loadPublicStore)return false;

    const loaded=await window.PURE20_API.loadPublicStore();
    store=loaded?.store||null;
    productsById=new Map((store?.products||[]).map(p=>[String(p.id),p]));

    const settings=store?.settings?.bacWater||{};
    cfg={
      enabled:settings.enabled!==false,
      unitPriceEur:Number(settings.unitPriceEur||DEFAULT_PRICE),
      freeFromPeptideVials:Math.max(1,qty(settings.freeFromPeptideVials||DEFAULT_FREE_FROM))
    };

    bacProduct=(store?.products||[]).find(p=>
      String(p.code||'').toUpperCase()==='WAC3' ||
      (
        String(p.product||'').toLowerCase()==='bac water' &&
        String(p.variant||'').toLowerCase()==='3ml'
      )
    )||null;

    if(!bacProduct){
      console.warn('PURE20 BAC v2: BAC Water 3ml / WAC3 niet gevonden.');
      return false;
    }

    // Retire the old virtual-BAC state from v1.
    try{localStorage.removeItem(OLD_BAC_KEY)}catch(_){}

    return true;
  }

  function productWords(key,vars={}){
    const nl={
      title:'BACTERIOSTATISCH WATER',
      ratio:'1 × 3 ml per vial',
      without:'Zonder bacteriostatisch water',
      withPaid:`Met bacteriostatisch water · +${money(cfg.unitPriceEur)} per vial`,
      withFree:'Met bacteriostatisch water · GRATIS',
      note:`Vanaf ${cfg.freeFromPeptideVials} peptide-vials in je winkelmandje is het bacteriostatisch water gratis.`,
      added:n=>`${n} × BAC Water 3 ml mee toegevoegd.`
    };
    const en={
      title:'BACTERIOSTATIC WATER',
      ratio:'1 × 3 ml per vial',
      without:'Without bacteriostatic water',
      withPaid:`With bacteriostatic water · +${money(cfg.unitPriceEur)} per vial`,
      withFree:'With bacteriostatic water · FREE',
      note:`From ${cfg.freeFromPeptideVials} peptide vials in your cart, bacteriostatic water is free.`,
      added:n=>`${n} × BAC Water 3 ml added.`
    };
    const d=lang()==='en'?en:nl;
    const v=d[key];
    return typeof v==='function'?v(vars.n):v;
  }

  function ensureProductUi(){
    if(!IS_PRODUCT||!cfg.enabled)return;
    const variants=$('variantButtons');
    if(!variants||$('bacWaterOptionV2'))return;

    const box=document.createElement('section');
    box.id='bacWaterOptionV2';
    box.className='p20-bac-option';
    box.innerHTML=`
      <div class="p20-bac-head">
        <span id="bacTitleV2"></span>
        <small id="bacRatioV2"></small>
      </div>
      <div class="p20-bac-buttons">
        <button type="button" class="p20-bac-choice active" data-bac-v2="without"></button>
        <button type="button" class="p20-bac-choice" data-bac-v2="with"></button>
      </div>
      <p id="bacNoteV2" class="p20-bac-note"></p>
    `;
    variants.insertAdjacentElement('afterend',box);

    box.addEventListener('click',e=>{
      const b=e.target.closest('[data-bac-v2]');
      if(!b)return;
      productChoice=b.dataset.bacV2==='with'?'with':'without';
      refreshProduct();
    });
  }

  function refreshProduct(){
    if(!IS_PRODUCT||!store)return;

    ensureProductUi();

    const p=selectedProduct();
    const box=$('bacWaterOptionV2');
    if(!box)return;

    if(!isPeptide(p)){
      box.hidden=true;
      return;
    }

    box.hidden=false;

    const q=Math.max(1,qty($('qtyInput')?.value||1));
    const cart=readCart();
    const projected={...cart};
    projected[p.id]=qty(projected[p.id])+q;

    const free=peptideVials(projected)>=cfg.freeFromPeptideVials;
    const base=Number(p.price||0);

    $('bacTitleV2').textContent=productWords('title');
    $('bacRatioV2').textContent=productWords('ratio');
    $('bacNoteV2').textContent=productWords('note');

    const no=document.querySelector('[data-bac-v2="without"]');
    const yes=document.querySelector('[data-bac-v2="with"]');

    no.textContent=productWords('without');
    yes.textContent=free?productWords('withFree'):productWords('withPaid');

    no.classList.toggle('active',productChoice==='without');
    yes.classList.toggle('active',productChoice==='with');

    no.setAttribute('aria-pressed',String(productChoice==='without'));
    yes.setAttribute('aria-pressed',String(productChoice==='with'));

    const price=$('selectedPrice');
    if(price&&base>0){
      const shown=productChoice==='with'&&!free
        ? base+Number(cfg.unitPriceEur||DEFAULT_PRICE)
        : base;
      const wanted=money(shown);
      if(price.textContent!==wanted)price.textContent=wanted;
    }

    refreshProductCartBar();
  }

  function refreshProductCartBar(){
    if(!IS_PRODUCT||!store)return;
    const cart=readCart();
    const gross=grossSubtotal(cart);
    const discount=bacFree(cart)?bacQty(cart)*Number(bacProduct.price||cfg.unitPriceEur):0;
    const total=Math.max(0,gross-discount);
    const el=$('productCartTotal');
    if(el&&el.textContent!==money(total))el.textContent=money(total);
  }

  function captureProductAdd(e){
    if(!IS_PRODUCT)return;
    const btn=e.target.closest('#addToCart');
    if(!btn||btn.disabled||productChoice!=='with')return;

    const p=selectedProduct();
    if(!isPeptide(p))return;

    const q=Math.max(1,qty($('qtyInput')?.value||1));
    addBac(q);

    setTimeout(()=>{
      const feedback=$('productFeedback');
      if(feedback){
        const existing=feedback.textContent.trim();
        feedback.textContent=`${existing}${existing?' · ':''}${productWords('added',{n:q})}`;
      }
      refreshProduct();
    },0);
  }

  function setupProduct(){
    ensureProductUi();
    refreshProduct();

    document.addEventListener('click',captureProductAdd,true);
    $('qtyInput')?.addEventListener('input',refreshProduct);
    $('qtyInput')?.addEventListener('change',refreshProduct);
    $('qtyMinus')?.addEventListener('click',()=>setTimeout(refreshProduct,0));
    $('qtyPlus')?.addEventListener('click',()=>setTimeout(refreshProduct,0));
    $('variantButtons')?.addEventListener('click',()=>setTimeout(refreshProduct,0));

    observer=new MutationObserver(()=>schedule(refreshProduct));
    if($('variantButtons'))observer.observe($('variantButtons'),{childList:true,subtree:true,attributes:true,attributeFilter:['class','aria-pressed']});
    if($('selectedPrice'))observer.observe($('selectedPrice'),{childList:true,subtree:true,characterData:true});

    window.addEventListener('pure20:retailcartchange',()=>schedule(refreshProduct));
    window.addEventListener('storage',e=>{if(e.key===CART_KEY)schedule(refreshProduct)});
    window.addEventListener('pure20:languagechange',()=>schedule(refreshProduct));
  }

  function shopWords(key,vars={}){
    const nl={
      zeroTitle:'Reminder: bacteriostatisch water ontbreekt',
      partialTitle:'Reminder: niet genoeg bacteriostatisch water',
      zero:`Je hebt ${vars.vials} peptide-vials in je winkelmandje en geen bacteriostatisch water.`,
      partial:`Je hebt ${vars.vials} peptide-vials en ${vars.bac} × BAC Water 3 ml. Voor 1-op-1 ontbreken er nog ${vars.missing}.`,
      fill:vars.free?'Gratis BAC water toevoegen voor alle vials':'BAC water aanvullen tot 1 per vial',
      rule:`1 × BAC Water 3 ml per peptide-vial. Vanaf ${cfg.freeFromPeptideVials} peptide-vials is het gratis.`,
      freeLine:`BAC Water 3 ml is gratis vanaf ${cfg.freeFromPeptideVials} peptide-vials.`,
      remove:'BAC water verwijderen'
    };
    const en={
      zeroTitle:'Reminder: bacteriostatic water is missing',
      partialTitle:'Reminder: not enough bacteriostatic water',
      zero:`You have ${vars.vials} peptide vials in your cart and no bacteriostatic water.`,
      partial:`You have ${vars.vials} peptide vials and ${vars.bac} × BAC Water 3 ml. ${vars.missing} more are needed for a 1:1 ratio.`,
      fill:vars.free?'Add free BAC water for every vial':'Add BAC water up to 1 per vial',
      rule:`1 × BAC Water 3 ml per peptide vial. From ${cfg.freeFromPeptideVials} peptide vials it is free.`,
      freeLine:`BAC Water 3 ml is free from ${cfg.freeFromPeptideVials} peptide vials.`,
      remove:'Remove BAC water'
    };
    return (lang()==='en'?en:nl)[key];
  }

  function ensureReminder(){
    if(!IS_SHOP)return;
    const first=document.querySelector('#orderDrawer .first-block');
    if(!first||$('bacReminderV2'))return;

    const box=document.createElement('div');
    box.id='bacReminderV2';
    box.className='p20-bac-reminder';
    box.hidden=true;
    box.innerHTML=`
      <strong id="bacReminderTitleV2"></strong>
      <div id="bacReminderBodyV2"></div>
      <div id="bacReminderRuleV2" style="margin-top:5px;color:#777"></div>
      <div class="p20-bac-reminder-actions">
        <button id="bacFillV2" type="button"></button>
        <button id="bacRemoveV2" class="secondary" type="button"></button>
      </div>
    `;
    first.insertAdjacentElement('afterend',box);

    $('bacFillV2').addEventListener('click',()=>{
      const vials=peptideVials();
      setBac(vials);
      // Reload is deliberate: retail-cart-bridge will hydrate the real BAC row
      // into app.js with the correct quantity from localStorage.
      location.href='/shop?cart=open';
    });

    $('bacRemoveV2').addEventListener('click',()=>{
      setBac(0);
      location.href='/shop?cart=open';
    });
  }

  function appShipping(effectiveSubtotal,hasItems){
    if(!hasItems)return 0;
    const threshold=Number(store?.settings?.freeShippingThreshold||300);
    const flat=Number(store?.settings?.shippingFlat||17.95);
    return effectiveSubtotal>=threshold?0:flat;
  }

  function refreshShop(){
    if(!IS_SHOP||!store)return;

    ensureReminder();

    const cart=readCart();
    const vials=peptideVials(cart);
    const bac=bacQty(cart);
    const missing=Math.max(0,vials-bac);
    const free=bacFree(cart);

    const reminder=$('bacReminderV2');
    if(reminder){
      reminder.hidden=!(vials>0&&missing>0);

      if(vials>0&&missing>0){
        const zero=bac===0;
        $('bacReminderTitleV2').textContent=shopWords(zero?'zeroTitle':'partialTitle');
        $('bacReminderBodyV2').textContent=shopWords(zero?'zero':'partial',{vials,bac,missing});
        $('bacReminderRuleV2').textContent=shopWords('rule',{vials,bac,missing});
        $('bacFillV2').textContent=shopWords('fill',{free});
      }

      $('bacRemoveV2').hidden=bac<=0;
      $('bacRemoveV2').textContent=shopWords('remove');
    }

    const bacLine=document.querySelector(`#orderLines .order-line[data-id="${CSS.escape(String(bacProduct.id))}"]`);

    if(bacLine&&free&&bac>0){
      const meta=bacLine.querySelector('.order-line-meta');
      const total=bacLine.querySelector('.order-line-total');
      if(meta)meta.textContent=`${bacProduct.code} · ${bac} × ${lang()==='en'?'FREE':'GRATIS'}`;
      if(total)total.textContent=lang()==='en'?'FREE':'GRATIS';
    }

    if(free&&bac>0){
      const raw=grossSubtotal(cart);
      const freeValue=bac*Number(bacProduct.price||cfg.unitPriceEur);
      const effective=Math.max(0,raw-freeValue);

      const coupon=Math.abs(safeNumber($('drawerDiscount')?.textContent));
      const referral=Math.abs(safeNumber($('drawerMemberDiscount')?.textContent));
      const credit=Math.abs(safeNumber($('drawerCreditUsed')?.textContent));
      const shipping=appShipping(effective,Object.keys(cart).some(id=>qty(cart[id])>0));
      const after=Math.max(0,effective-coupon-referral-credit);

      if($('drawerSubtotal'))$('drawerSubtotal').textContent=money(effective);
      if($('drawerTotal'))$('drawerTotal').textContent=money(after+shipping);
      if($('cartSubtotal'))$('cartSubtotal').textContent=money(after);
      if($('drawerShipping')){
        $('drawerShipping').textContent=shipping<=0
          ? (lang()==='en'?'Free shipping':'Gratis verzending')
          : money(shipping);
      }

      let freeRow=$('bacFreeRowV2');
      const totals=document.querySelector('.totals-card');
      if(totals&&!freeRow){
        freeRow=document.createElement('div');
        freeRow.id='bacFreeRowV2';
        freeRow.className='p20-bac-free-row';
        const grand=totals.querySelector('.grand-total');
        totals.insertBefore(freeRow,grand||null);
      }
      if(freeRow){
        freeRow.innerHTML=`<span>${esc(shopWords('freeLine'))}</span><strong>-${esc(money(freeValue))}</strong>`;
        freeRow.hidden=false;
      }
    }else{
      $('bacFreeRowV2')?.remove();
    }
  }

  function buildFreeOrderText(){
    refreshShop();

    const s=store?.settings||{};
    const lines=[...document.querySelectorAll('#orderLines .order-line')].map(line=>{
      const name=line.querySelector('.order-line-name')?.textContent?.trim()||'';
      const meta=line.querySelector('.order-line-meta')?.textContent?.trim()||'';
      const total=line.querySelector('.order-line-total')?.textContent?.trim()||'';
      return `${name} · ${meta} — ${total}`;
    }).filter(Boolean);

    const v=id=>$(id)?.value?.trim?.()||'-';
    const en=lang()==='en';

    return [
      `${s.brandName||'PURE20.'} ${en?'ORDER REQUEST':'BESTELAANVRAAG'}`,'',
      ...lines,'',
      `${en?'Subtotal':'Subtotaal'}: ${$('drawerSubtotal')?.textContent||money(0)}`,
      ...(!$('discountRow')?.hidden?[`${en?'Coupon':'Kortingscode'}: ${$('drawerDiscount')?.textContent||''}`]:[]),
      ...(!$('memberDiscountRow')?.hidden?[`Referral discount: ${$('drawerMemberDiscount')?.textContent||''}`]:[]),
      ...(!$('creditUsedRow')?.hidden?[`Referral credit: ${$('drawerCreditUsed')?.textContent||''}`]:[]),
      `${en?'Shipping':'Verzending'}: ${$('drawerShipping')?.textContent||''}`,
      `${en?'Current total':'Huidig totaal'} ${s.currency||'EUR'}: ${$('drawerTotal')?.textContent||money(0)}`,
      '',
      en?'CUSTOMER DETAILS':'KLANTGEGEVENS',
      `${en?'Name':'Naam'}: ${v('fullName')}`,
      `${en?'Address':'Adres'}: ${v('address')}`,
      `${en?'Postal code':'Postcode'}: ${v('zip')}`,
      `${en?'Country':'Land'}: ${v('country')}`,
      `Email: ${v('email')}`,
      `${en?'Phone':'Telefoon'}: ${v('phone')}`
    ].join('\n');
  }

  async function recordFreeOrder(source){
    try{
      const cfg0=window.PURE20_SUPABASE_CONFIG||{};
      if(!cfg0.url||!cfg0.key||!window.supabase?.createClient)return;

      const items=[...document.querySelectorAll('#orderLines .order-line')].map(line=>{
        const name=line.querySelector('.order-line-name')?.textContent?.trim()||'';
        const meta=line.querySelector('.order-line-meta')?.textContent?.trim()||'';
        const total=line.querySelector('.order-line-total')?.textContent?.trim()||'';
        const m=meta.match(/(\d+)\s*×/);
        return {
          product_id:line.dataset.id||'',
          name,
          quantity:m?Number(m[1]):1,
          meta,
          line_total:safeNumber(total)
        };
      }).filter(x=>x.name);

      const customer={
        name:$('fullName')?.value?.trim?.()||'',
        company:'',
        vat_number:'',
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
        p_subtotal:safeNumber($('drawerSubtotal')?.textContent),
        p_discount:Math.abs(safeNumber($('drawerDiscount')?.textContent)),
        p_shipping:safeNumber($('drawerShipping')?.textContent),
        p_total:safeNumber($('drawerTotal')?.textContent),
        p_currency:store?.settings?.currency||'EUR',
        p_coupon_code:$('couponInput')?.value?.trim?.().toUpperCase()||'',
        p_source:source,
        p_use_credit:Boolean($('useReferralCredit')?.checked)
      };

      const client=window.supabase.createClient(cfg0.url,cfg0.key,{
        auth:{persistSession:true,autoRefreshToken:true}
      });
      const {error}=await client.rpc('pure20_record_order',payload);
      if(error)throw error;
    }catch(err){
      console.warn('PURE20 BAC v2 order history:',err?.message||err);
    }
  }

  async function captureFreeShare(e){
    if(!IS_SHOP)return;
    const button=e.target.closest('#copyOrder,#whatsappOrder');
    if(!button)return;

    const cart=readCart();
    if(!bacFree(cart)||bacQty(cart)<=0)return;

    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();

    if($('researchConfirm')&&!$('researchConfirm').checked){
      const toast=$('toast');
      if(toast){
        toast.textContent=lang()==='en'?'Confirm the notice first.':'Bevestig eerst de melding.';
        toast.classList.add('show');
        setTimeout(()=>toast.classList.remove('show'),1800);
      }
      return;
    }

    const text=buildFreeOrderText();
    const source=button.id==='whatsappOrder'?'whatsapp':'copy';

    if(source==='copy'){
      try{await navigator.clipboard.writeText(text)}
      catch(_){
        const ta=document.createElement('textarea');
        ta.value=text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
      }
    }else{
      const number=String(store?.settings?.whatsappNumber||'').replace(/\D/g,'');
      window.open(
        number
          ?`https://wa.me/${number}?text=${encodeURIComponent(text)}`
          :`https://wa.me/?text=${encodeURIComponent(text)}`,
        '_blank',
        'noopener'
      );
    }

    recordFreeOrder(source);
  }

  function setupShop(){
    ensureReminder();
    refreshShop();

    document.addEventListener('click',captureFreeShare,true);

    observer=new MutationObserver(()=>schedule(refreshShop));
    observer.observe(document.body,{childList:true,subtree:true,characterData:true});

    window.addEventListener('pure20:retailcartchange',()=>schedule(refreshShop));
    window.addEventListener('storage',e=>{if(e.key===CART_KEY)schedule(refreshShop)});
    window.addEventListener('pure20:languagechange',()=>schedule(refreshShop));
  }

  function schedule(fn){
    if(raf)return;
    raf=true;
    requestAnimationFrame(()=>{
      raf=false;
      (fn||refreshShop)();
    });
  }

  async function boot(){
    style();

    try{
      if(!await load())return;
      if(!cfg.enabled)return;

      if(IS_PRODUCT)setupProduct();
      if(IS_SHOP)setupShop();
    }catch(err){
      console.warn('PURE20 BAC v2:',err?.message||err);
    }
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',boot,{once:true});
  }else{
    boot();
  }
})();