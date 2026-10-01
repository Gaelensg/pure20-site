(async () => {
  'use strict';

  const CART_KEY='pure20_retail_cart_v1';
  const $=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const lang=()=>window.PURE20_I18N?.language || (localStorage.getItem('pure20_language')==='en'?'en':'nl');

  const T={
    nl:{
      back:'← Terug naar shop',strength:'KIES STERKTE',variants:n=>`${n} ${n===1?'optie':'opties'}`,
      inStock:'Op voorraad',low:n=>`${n} op voorraad`,orderable:'Niet op voorraad · bestelbaar',
      pricePending:'Prijs volgt',add:'Toevoegen aan winkelmandje',added:n=>`${n} toegevoegd aan je winkelmandje.`,
      product:'PRODUCT',variant:'STERKTE',unit:'EENHEID',availability:'BESCHIKBAARHEID',
      notice:'Uitsluitend voor researchdoeleinden. Beschikbaarheid, verzending en betaling worden afzonderlijk bevestigd.',
      cart:'Bekijk winkelmandje',vials:'vials',notFound:'Product niet gevonden.',
      defaultDesc:'Kies hieronder de gewenste sterkte. Prijs en beschikbaarheid worden live uit de PURE20-catalogus geladen.',
      coa:'COA bekijken ↗'
    },
    en:{
      back:'← Back to shop',strength:'CHOOSE STRENGTH',variants:n=>`${n} ${n===1?'option':'options'}`,
      inStock:'In stock',low:n=>`${n} in stock`,orderable:'Out of stock · orderable',
      pricePending:'Price pending',add:'Add to cart',added:n=>`${n} added to your cart.`,
      product:'PRODUCT',variant:'STRENGTH',unit:'UNIT',availability:'AVAILABILITY',
      notice:'For research purposes only. Availability, shipping and payment are confirmed separately.',
      cart:'View cart',vials:'vials',notFound:'Product not found.',
      defaultDesc:'Choose the desired strength below. Price and availability are loaded live from the PURE20 catalogue.',
      coa:'View COA ↗'
    }
  };
  const tx=k=>T[lang()][k];

  const els={
    loading:$('productLoading'),content:$('productContent'),notFound:$('productNotFound'),
    image:$('productImageWrap'),category:$('productCategory'),name:$('productName'),description:$('productDescription'),
    back:$('backToShop'),strengthLabel:$('strengthLabel'),variantCount:$('variantCount'),variants:$('variantButtons'),
    code:$('selectedCode'),price:$('selectedPrice'),stockDot:$('stockDot'),stockText:$('stockText'),
    coaWrap:$('coaWrap'),coa:$('coaLink'),minus:$('qtyMinus'),qty:$('qtyInput'),plus:$('qtyPlus'),
    add:$('addToCart'),addLabel:$('addToCartLabel'),feedback:$('productFeedback'),
    detailProductLabel:$('detailProductLabel'),detailVariantLabel:$('detailVariantLabel'),detailUnitLabel:$('detailUnitLabel'),
    detailAvailabilityLabel:$('detailAvailabilityLabel'),detailProduct:$('detailProduct'),detailVariant:$('detailVariant'),
    detailUnit:$('detailUnit'),detailAvailability:$('detailAvailability'),notice:$('researchNotice'),
    cartBar:$('productCartBar'),cartCount:$('productCartCount'),cartTotal:$('productCartTotal'),
    cartUnitLabel:$('productCartUnitLabel'),viewCart:$('viewCart'),headerCart:$('headerCart'),headerCartCount:$('headerCartCount'),
    toast:$('productToast')
  };

  let compound=null, variants=[], selected=null, store=null;

  function slugFromLocation(){
    const q=new URLSearchParams(location.search).get('slug');
    if(q)return q;
    const m=location.pathname.match(/^\/product\/([^/?#]+)/i);
    return m?decodeURIComponent(m[1]):'';
  }

  function safeUrl(value){
    const raw=String(value||'').trim();
    if(!raw)return'';
    try{
      const u=new URL(raw,location.href);
      return ['http:','https:'].includes(u.protocol)?u.href:'';
    }catch(_){return''}
  }

  function cart(){
    try{
      const c=JSON.parse(localStorage.getItem(CART_KEY)||'{}');
      return c&&typeof c==='object'?c:{};
    }catch(_){return{}}
  }
  function saveCart(value){
    localStorage.setItem(CART_KEY,JSON.stringify(value));
    window.dispatchEvent(new CustomEvent('pure20:retailcartchange',{detail:{cart:value}}));
  }

  function money(v){
    const symbol=store?.settings?.currencySymbol||'€';
    return `${symbol}${Number(v||0).toFixed(2)}`;
  }
  function maxQty(v){const stock=Math.max(0,Number(v?.stock||0));return stock>0?stock:99}
  function availability(v){
    const stock=Math.max(0,Number(v?.stock||0));
    const low=Math.max(1,Number(store?.settings?.lowStockThreshold||5));
    if(stock<=0)return tx('orderable');
    if(stock<=low)return tx('low')(stock);
    return tx('inStock');
  }

  function productVisual(){
    const url=safeUrl(compound?.image_url);
    if(url){
      els.image.innerHTML=`<img src="${esc(url)}" alt="${esc((lang()==='en'?compound.image_alt_en:compound.image_alt_nl)||compound.product_name)}">`;
    }else{
      els.image.innerHTML=`<div class="p20-product-fallback">
        <div class="p20-product-fallback-top">PURE20 / ${esc(compound?.category||'PRODUCT')}</div>
        <div class="p20-product-fallback-vial" aria-hidden="true"></div>
        <div class="p20-product-fallback-name">${esc(compound?.product_name||'PURE20.')}</div>
      </div>`;
    }
  }

  function translatedDescription(){
    const d=lang()==='en'?compound?.short_description_en:compound?.short_description_nl;
    return String(d||'').trim()||tx('defaultDesc');
  }

  function renderLanguage(){
    document.documentElement.lang=lang();
    els.back.textContent=tx('back');
    els.strengthLabel.textContent=tx('strength');
    els.variantCount.textContent=tx('variants')(variants.length);
    els.addLabel.textContent=tx('add');
    els.detailProductLabel.textContent=tx('product');
    els.detailVariantLabel.textContent=tx('variant');
    els.detailUnitLabel.textContent=tx('unit');
    els.detailAvailabilityLabel.textContent=tx('availability');
    els.notice.textContent=tx('notice');
    els.viewCart.childNodes[0].textContent=`${tx('cart')} `;
    els.cartUnitLabel.textContent=tx('vials');
    els.coa.textContent=tx('coa');
    if(compound){
      els.description.textContent=translatedDescription();
      document.title=`PURE20. — ${compound.product_name}`;
      document.querySelector('meta[name="description"]')?.setAttribute('content',translatedDescription());
      productVisual();
    }
    renderSelected();
  }

  function variantLabel(v){return String(v.variant||v.code||'').trim()||v.code}

  function renderVariants(){
    els.variants.innerHTML=variants.map(v=>{
      const active=selected?.id===v.id;
      const price=Number(v.price||0);
      return `<button type="button" class="p20-variant-button ${active?'active':''} ${price<=0?'no-price':''}" data-id="${esc(v.id)}" aria-pressed="${active}">
        ${esc(variantLabel(v))}
      </button>`;
    }).join('');
  }

  function renderSelected(){
    if(!selected)return;
    const priced=Number(selected.price||0)>0;
    els.code.textContent=selected.code||'';
    els.price.textContent=priced?money(selected.price):tx('pricePending');
    els.stockText.textContent=availability(selected);
    els.stockDot.className=`p20-stock-dot ${Number(selected.stock||0)>0?'in':'out'}`;
    els.detailProduct.textContent=selected.product||compound?.product_name||'';
    els.detailVariant.textContent=variantLabel(selected);
    els.detailUnit.textContent=selected.unit||'vial';
    els.detailAvailability.textContent=availability(selected);
    const coa=safeUrl(selected.coaUrl);
    els.coaWrap.hidden=!coa;
    if(coa)els.coa.href=coa;
    els.add.disabled=!priced;
    els.qty.max=String(maxQty(selected));
    const q=Math.max(1,Math.min(maxQty(selected),Math.floor(Number(els.qty.value)||1)));
    els.qty.value=String(q);
    renderVariants();
  }

  function selectVariant(id,push=true){
    const next=variants.find(v=>v.id===id);
    if(!next)return;
    selected=next;
    els.feedback.textContent='';
    if(push){
      const u=new URL(location.href);
      u.searchParams.set('variant',id);
      history.replaceState(null,'',u.pathname+u.search);
    }
    renderSelected();
  }

  function toast(message){
    els.toast.textContent=message;els.toast.classList.add('show');
    clearTimeout(toast.t);toast.t=setTimeout(()=>els.toast.classList.remove('show'),1700);
  }

  function updateCartBar(){
    if(!store)return;
    const c=cart();
    const active=new Map((store.products||[]).filter(p=>p.active).map(p=>[p.id,p]));
    let count=0,total=0;
    for(const [id,qRaw] of Object.entries(c)){
      const p=active.get(id);if(!p)continue;
      const q=Math.max(0,Math.floor(Number(qRaw)||0));
      count+=q;total+=q*Number(p.price||0);
    }
    els.headerCartCount.textContent=String(count);
    els.cartCount.textContent=String(count);
    els.cartTotal.textContent=money(total);
    els.cartBar.hidden=count<=0;
  }

  function add(){
    if(!selected||Number(selected.price||0)<=0)return;
    const q=Math.max(1,Math.min(maxQty(selected),Math.floor(Number(els.qty.value)||1)));
    const c=cart();
    c[selected.id]=Math.min(maxQty(selected),Math.max(0,Number(c[selected.id]||0))+q);
    saveCart(c);
    updateCartBar();
    els.feedback.textContent=tx('added')(q);
    toast(tx('added')(q));
  }

  async function load(){
    const slug=slugFromLocation();
    if(!slug||!window.PURE20_API?.client)throw new Error('product');
    const client=window.PURE20_API.client;

    const [{data:c,error:ce},{store:s}]=await Promise.all([
      client.from('pure20_compounds').select('*').eq('slug',slug).eq('active',true).maybeSingle(),
      window.PURE20_API.loadPublicStore()
    ]);
    if(ce)throw ce;
    if(!c)throw new Error('not_found');

    compound=c;store=s;
    variants=(store.products||[]).filter(p=>p.active&&p.product===compound.product_name)
      .sort((a,b)=>Number(a.order||0)-Number(b.order||0)||String(a.variant).localeCompare(String(b.variant),'nl',{numeric:true}));

    if(!variants.length)throw new Error('not_found');

    const requested=new URLSearchParams(location.search).get('variant');
    selected=variants.find(v=>v.id===requested)||variants.find(v=>Number(v.price||0)>0)||variants[0];

    els.loading.hidden=true;els.content.hidden=false;
    els.category.textContent=compound.category||'';
    els.name.textContent=compound.product_name;
    renderLanguage();
    updateCartBar();
  }

  els.variants.addEventListener('click',e=>{
    const b=e.target.closest('[data-id]');if(b)selectVariant(b.dataset.id);
  });
  els.minus.addEventListener('click',()=>{els.qty.value=String(Math.max(1,Number(els.qty.value||1)-1))});
  els.plus.addEventListener('click',()=>{els.qty.value=String(Math.min(maxQty(selected),Number(els.qty.value||1)+1))});
  els.qty.addEventListener('change',()=>{els.qty.value=String(Math.max(1,Math.min(maxQty(selected),Math.floor(Number(els.qty.value)||1))))});
  els.add.addEventListener('click',add);
  els.viewCart.addEventListener('click',()=>location.href='/shop?cart=open');
  els.headerCart?.addEventListener('click',()=>location.href='/shop?cart=open');
  window.addEventListener('pure20:languagechange',renderLanguage);
  window.addEventListener('pure20:i18nready',renderLanguage);
  window.addEventListener('storage',e=>{if(e.key===CART_KEY)updateCartBar()});
  window.addEventListener('pure20:retailcartchange',updateCartBar);

  try{await load()}
  catch(err){
    console.error(err);
    els.loading.hidden=true;els.content.hidden=true;els.notFound.hidden=false;
  }
})();
