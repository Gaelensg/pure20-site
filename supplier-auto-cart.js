(() => {
  'use strict';

  if(window.__PURE20_SUPPLIER_AUTO_CART_V1__)return;
  window.__PURE20_SUPPLIER_AUTO_CART_V1__=true;

  const DRAFT_KEY='pure20_supplier_hub_draft_v3';
  const SMART_KEY='pure20_supplier_smart_qty_v1';
  const MANAGED_KEY='pure20_supplier_smart_managed_v1';
  const SUPPLIER_KEY='pure20_supplier_hub_active_v1';

  const $=id=>document.getElementById(id);
  const CATEGORY_LABELS={all:'Alle',peptides:'Peptides',orals:'Orals',oils:'Oliën'};

  const state={
    suppliers:new Map(),
    rows:[],
    items:[],
    qty:readJson(SMART_KEY,{}),
    category:'peptides',
    search:'',
    matchedOnly:false,
    loaded:false,
    loading:false,
    dirtyOrderView:false,
    plan:null
  };

  let client=null;

  function readJson(key,fallback={}){
    try{
      const value=JSON.parse(localStorage.getItem(key)||'null');
      return value&&typeof value==='object'?value:fallback;
    }catch(_){return fallback}
  }

  function writeJson(key,value){
    try{localStorage.setItem(key,JSON.stringify(value))}catch(_){}
  }

  function esc(value){
    return String(value??'').replace(/[&<>"']/g,ch=>({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[ch]));
  }

  function n(value){
    return Math.max(0,Math.floor(Number(value)||0));
  }

  function price(value){
    const x=Number(value);
    return Number.isFinite(x)?x:null;
  }

  function money(value,symbol='$'){
    return value==null||!Number.isFinite(Number(value))?'—':`${symbol}${Number(value).toFixed(2)}`;
  }

  function exactKey(row){
    const code=String(row.code||'').trim().toUpperCase().replace(/\s+/g,'');
    return code?`${row.category}::${code}`:'';
  }

  function smartKey(item){
    return item.key;
  }

  function draftKey(row){
    return `${row.supplier_key}::${row.category}::${row.code}`;
  }

  function supplierSymbol(key){
    return state.suppliers.get(key)?.currency_symbol||'$';
  }

  function hhThreshold(){
    return Number(state.suppliers.get('hhpeptide')?.wholesale_threshold||0);
  }

  function qtyOf(item){
    return n(state.qty[smartKey(item)]);
  }

  function saveSmartQty(){
    const clean={};
    for(const [key,value] of Object.entries(state.qty)){
      const q=n(value);
      if(q>0)clean[key]=q;
    }
    state.qty=clean;
    writeJson(SMART_KEY,clean);
  }

  function buildItems(){
    const hh=new Map();
    const em=new Map();

    for(const row of state.rows){
      const key=exactKey(row);
      if(!key)continue;
      if(row.supplier_key==='hhpeptide'&&!hh.has(key))hh.set(key,row);
      if(row.supplier_key==='emlins'&&!em.has(key))em.set(key,row);
    }

    const keys=[...new Set([...hh.keys(),...em.keys()])];

    state.items=keys.map(key=>{
      const h=hh.get(key)||null;
      const e=em.get(key)||null;
      return {
        key,
        category:h?.category||e?.category||'',
        code:h?.code||e?.code||'',
        product:h?.product_name||e?.product_name||'Product',
        specification:h?.specification||e?.specification||'',
        hh:h,
        emlins:e
      };
    }).sort((a,b)=>
      a.category.localeCompare(b.category)||
      a.product.localeCompare(b.product,undefined,{numeric:true,sensitivity:'base'})||
      a.code.localeCompare(b.code,undefined,{numeric:true})
    );
  }

  function linePrices(item,q){
    const hhRetail=item.hh?price(item.hh.retail_price):null;
    const hhWholesale=item.hh?price(item.hh.wholesale_price):null;
    const emlin=item.emlins?price(item.emlins.list_price):null;

    return {
      hhRetail,
      hhWholesale,
      emlin,
      hhRetailTotal:hhRetail==null?null:hhRetail*q,
      hhWholesaleTotal:hhWholesale==null?null:hhWholesale*q,
      emlinTotal:emlin==null?null:emlin*q
    };
  }

  function selectedItems(){
    return state.items
      .map(item=>({item,qty:qtyOf(item)}))
      .filter(x=>x.qty>0);
  }

  // Retail scenario: HH uses retail pricing and each comparable line goes
  // to the cheaper supplier independently.
  function retailScenario(selected){
    const assignments=[];
    let total=0;

    for(const {item,qty} of selected){
      const p=linePrices(item,qty);

      if(item.hh&&!item.emlins){
        assignments.push({item,qty,supplier:'hhpeptide',unitPrice:p.hhRetail,reason:'Alleen bij HH'});
        total+=(p.hhRetailTotal||0);
        continue;
      }

      if(item.emlins&&!item.hh){
        assignments.push({item,qty,supplier:'emlins',unitPrice:p.emlin,reason:"Alleen bij Emlin's"});
        total+=(p.emlinTotal||0);
        continue;
      }

      if(p.hhRetail==null&&p.emlin==null)continue;

      if(p.emlin==null || (p.hhRetail!=null&&p.hhRetail<=p.emlin)){
        assignments.push({item,qty,supplier:'hhpeptide',unitPrice:p.hhRetail,reason:'HH retail is lager'});
        total+=(p.hhRetailTotal||0);
      }else{
        assignments.push({item,qty,supplier:'emlins',unitPrice:p.emlin,reason:"Emlin's is lager"});
        total+=(p.emlinTotal||0);
      }
    }

    return {mode:'retail',assignments,total,hhValue:0,thresholdActive:false,thresholdMoves:new Set()};
  }

  // Wholesale scenario:
  // 1. Price every matched line at min(HH wholesale, Emlin)
  // 2. HH-only lines must stay at HH
  // 3. If assigned HH wholesale value is below threshold, use sparse DP
  //    to move the cheapest possible combination of Emlin-assigned lines
  //    to HH until the threshold is reached.
  // This finds the cheapest threshold activation without splitting one line
  // across suppliers.
  function wholesaleScenario(selected){
    const threshold=hhThreshold();
    if(threshold<=0)return null;

    const assignments=[];
    const candidates=[];
    let baseTotal=0;
    let hhValue=0;

    for(const {item,qty} of selected){
      const p=linePrices(item,qty);

      if(item.hh&&!item.emlins){
        if(p.hhWholesale==null)return null;
        assignments.push({item,qty,supplier:'hhpeptide',unitPrice:p.hhWholesale,reason:'Alleen bij HH'});
        baseTotal+=p.hhWholesaleTotal;
        hhValue+=p.hhWholesaleTotal;
        continue;
      }

      if(item.emlins&&!item.hh){
        if(p.emlin==null)return null;
        assignments.push({item,qty,supplier:'emlins',unitPrice:p.emlin,reason:"Alleen bij Emlin's"});
        baseTotal+=p.emlinTotal;
        continue;
      }

      if(p.hhWholesale==null&&p.emlin==null)return null;

      if(p.emlin==null || (p.hhWholesale!=null&&p.hhWholesale<=p.emlin)){
        assignments.push({item,qty,supplier:'hhpeptide',unitPrice:p.hhWholesale,reason:'HH wholesale is lager'});
        baseTotal+=p.hhWholesaleTotal;
        hhValue+=p.hhWholesaleTotal;
      }else{
        const idx=assignments.length;
        assignments.push({item,qty,supplier:'emlins',unitPrice:p.emlin,reason:"Emlin's is lager"});
        baseTotal+=p.emlinTotal;

        if(p.hhWholesale!=null){
          candidates.push({
            assignmentIndex:idx,
            contribution:p.hhWholesaleTotal,
            penalty:p.hhWholesaleTotal-p.emlinTotal
          });
        }
      }
    }

    if(hhValue>=threshold){
      return {
        mode:'wholesale',
        assignments,
        total:baseTotal,
        hhValue,
        thresholdActive:true,
        thresholdMoves:new Set()
      };
    }

    const need=Math.max(0,threshold-hhValue);
    if(!candidates.length)return null;

    // Sparse DP. State key = capped HH value in cents, value = minimum penalty + moved indexes.
    const cap=Math.ceil(need*100);
    let dp=new Map([[0,{penalty:0,moves:[]}]]);

    candidates.forEach((candidate,candidateIndex)=>{
      const contribution=Math.max(0,Math.round(candidate.contribution*100));
      const penalty=Math.max(0,candidate.penalty);
      const next=new Map(dp);

      for(const [value,node] of dp){
        const nv=Math.min(cap,value+contribution);
        const np=node.penalty+penalty;
        const current=next.get(nv);
        if(!current || np<current.penalty){
          next.set(nv,{penalty:np,moves:[...node.moves,candidateIndex]});
        }
      }
      dp=next;
    });

    const solution=dp.get(cap);
    if(!solution)return null;

    const thresholdMoves=new Set();
    for(const candidateIndex of solution.moves){
      const c=candidates[candidateIndex];
      const a=assignments[c.assignmentIndex];
      const wholesale=price(a.item.hh?.wholesale_price);
      if(wholesale==null)continue;
      a.supplier='hhpeptide';
      a.unitPrice=wholesale;
      a.reason='Naar HH om wholesale-drempel voordelig te activeren';
      thresholdMoves.add(a.item.key);
      hhValue+=c.contribution;
    }

    return {
      mode:'wholesale',
      assignments,
      total:baseTotal+solution.penalty,
      hhValue,
      thresholdActive:hhValue>=threshold,
      thresholdMoves
    };
  }

  function optimize(){
    const selected=selectedItems();
    if(!selected.length){
      return {
        mode:'empty',
        assignments:[],
        total:0,
        hhTotal:0,
        emlinsTotal:0,
        hhValue:0,
        thresholdActive:false,
        savings:0,
        thresholdMoves:new Set()
      };
    }

    const retail=retailScenario(selected);
    const wholesale=wholesaleScenario(selected);

    let chosen=retail;
    if(wholesale?.thresholdActive && wholesale.total<retail.total){
      chosen=wholesale;
    }

    chosen.hhTotal=chosen.assignments
      .filter(a=>a.supplier==='hhpeptide')
      .reduce((sum,a)=>sum+a.qty*Number(a.unitPrice||0),0);

    chosen.emlinsTotal=chosen.assignments
      .filter(a=>a.supplier==='emlins')
      .reduce((sum,a)=>sum+a.qty*Number(a.unitPrice||0),0);

    // Reference: cost if each matched line were bought from the more expensive
    // available supplier under the chosen HH pricing tier.
    let expensiveReference=0;
    for(const {item,qty} of selected){
      const hp=chosen.mode==='wholesale'
        ? price(item.hh?.wholesale_price)
        : price(item.hh?.retail_price);
      const ep=price(item.emlins?.list_price);

      if(hp!=null&&ep!=null)expensiveReference+=Math.max(hp,ep)*qty;
      else if(hp!=null)expensiveReference+=hp*qty;
      else if(ep!=null)expensiveReference+=ep*qty;
    }
    chosen.savings=Math.max(0,expensiveReference-chosen.total);

    return chosen;
  }

  function syncSupplierDraft(plan){
    const draft=readJson(DRAFT_KEY,{});
    const previous=readJson(MANAGED_KEY,[]);

    // Remove keys that were previously controlled by Smart Order.
    for(const key of Array.isArray(previous)?previous:[]){
      delete draft[key];
    }

    const managed=[];
    for(const a of plan.assignments){
      const row=a.supplier==='hhpeptide'?a.item.hh:a.item.emlins;
      if(!row)continue;
      const key=draftKey(row);
      draft[key]=a.qty;
      managed.push(key);
    }

    writeJson(DRAFT_KEY,draft);
    writeJson(MANAGED_KEY,managed);
    state.dirtyOrderView=true;
  }

  function clearManagedDraft(){
    const draft=readJson(DRAFT_KEY,{});
    const previous=readJson(MANAGED_KEY,[]);
    for(const key of Array.isArray(previous)?previous:[])delete draft[key];
    writeJson(DRAFT_KEY,draft);
    writeJson(MANAGED_KEY,[]);
  }

  function recalc(){
    saveSmartQty();
    state.plan=optimize();
    syncSupplierDraft(state.plan);
    renderAll();
  }

  function setQty(key,value){
    const q=n(value);
    if(q>0)state.qty[key]=q;
    else delete state.qty[key];
    recalc();
  }

  function visibleItems(){
    const q=state.search.trim().toLowerCase();

    return state.items.filter(item=>{
      if(state.category!=='all'&&item.category!==state.category)return false;
      if(state.matchedOnly&&!(item.hh&&item.emlins))return false;
      if(!q)return true;
      return `${item.product} ${item.specification} ${item.code} ${item.hh?.product_name||''} ${item.emlins?.product_name||''}`
        .toLowerCase().includes(q);
    });
  }

  function currentBestMarkup(item){
    const p=linePrices(item,1);
    if(item.hh&&item.emlins){
      const retailBest=p.hhRetail!=null&&p.emlin!=null
        ? (p.hhRetail<=p.emlin?'HH retail':"Emlin's")
        :'—';
      return `<span>${esc(retailBest)}</span>`;
    }
    if(item.hh)return '<span>Alleen HH</span>';
    if(item.emlins)return "<span>Alleen Emlin's</span>";
    return '<span>—</span>';
  }

  function renderCategories(){
    const host=$('smartCats');
    if(!host)return;
    const cats=['all',...new Set(state.items.map(x=>x.category).filter(Boolean))];
    host.innerHTML=cats.map(cat=>`
      <button type="button" class="smart-cat ${state.category===cat?'active':''}" data-smart-category="${esc(cat)}">
        ${esc(CATEGORY_LABELS[cat]||cat)}
      </button>
    `).join('');
  }

  function renderMasterList(){
    const host=$('smartCatalogue');
    if(!host)return;
    const items=visibleItems();

    if(!items.length){
      host.innerHTML='<div class="smart-empty">Geen producten gevonden.</div>';
      return;
    }

    host.innerHTML=items.map(item=>{
      const q=qtyOf(item);
      const hhr=price(item.hh?.retail_price);
      const hhw=price(item.hh?.wholesale_price);
      const ep=price(item.emlins?.list_price);
      const matched=Boolean(item.hh&&item.emlins);

      return `<article class="smart-row ${q>0?'selected':''}" data-smart-key="${esc(item.key)}">
        <div class="smart-product">
          <strong>${esc(item.product)}</strong>
          <small>${esc(item.specification)}</small>
          <span class="smart-code">${esc(item.code)}</span>
        </div>
        <div class="smart-price">
          <span class="smart-price-label">HH</span>
          <strong>${hhr==null?'—':money(hhr,supplierSymbol('hhpeptide'))}</strong>
          <small>${hhw==null?'':`Wholesale ${money(hhw,supplierSymbol('hhpeptide'))}`}</small>
        </div>
        <div class="smart-price">
          <span class="smart-price-label">EMLIN'S</span>
          <strong>${ep==null?'—':money(ep,supplierSymbol('emlins'))}</strong>
          <small>${matched?'Exacte codematch':'Niet bij beide'}</small>
        </div>
        <div class="smart-best">${currentBestMarkup(item)}</div>
        <div class="smart-qty">
          <button type="button" data-smart-action="minus" aria-label="Verminder">−</button>
          <input type="number" min="0" max="999" inputmode="numeric" value="${q}" aria-label="Aantal">
          <button type="button" data-smart-action="plus" aria-label="Verhoog">+</button>
        </div>
      </article>`;
    }).join('');
  }

  function reasonClass(a){
    return a.supplier==='hhpeptide'?'hh':'emlins';
  }

  function renderCart(supplierKey,hostId,totalId){
    const host=$(hostId);
    const total=$(totalId);
    if(!host||!total)return;

    const lines=(state.plan?.assignments||[]).filter(a=>a.supplier===supplierKey);
    if(!lines.length){
      host.innerHTML='<div class="smart-cart-empty">Nog niets toegewezen.</div>';
      total.textContent=money(0,supplierSymbol(supplierKey));
      return;
    }

    host.innerHTML=lines.map(a=>`
      <div class="smart-cart-line">
        <div>
          <strong>${esc(a.item.product)}</strong>
          <small>${esc(a.item.code)} · ${a.qty} × ${money(a.unitPrice,supplierSymbol(supplierKey))}</small>
          <em class="${reasonClass(a)}">${esc(a.reason)}</em>
        </div>
        <b>${money(a.qty*Number(a.unitPrice||0),supplierSymbol(supplierKey))}</b>
      </div>
    `).join('');

    const sum=supplierKey==='hhpeptide'?state.plan.hhTotal:state.plan.emlinsTotal;
    total.textContent=money(sum,supplierSymbol(supplierKey));
  }

  function renderPlanSummary(){
    const plan=state.plan||optimize();
    const threshold=hhThreshold();
    const status=$('smartOptimizerStatus');
    const total=$('smartOverallTotal');
    const saving=$('smartSaving');
    const progress=$('smartThresholdFill');
    const progressText=$('smartThresholdText');

    if(total)total.textContent=money(plan.total,'$');
    if(saving)saving.textContent=plan.savings>0?`Automatisch voordeel: ${money(plan.savings,'$')}`:'';
    if(status){
      status.textContent=plan.mode==='wholesale'
        ?'Optimizer gebruikt HH-wholesale omdat dit de laagste totale bestelling oplevert.'
        :'Optimizer vergelijkt HH-retail met Emlin’s per regel.';
    }

    const hhValue=Number(plan.hhValue||0);
    const pct=threshold>0?Math.max(0,Math.min(100,(hhValue/threshold)*100)):0;
    if(progress)progress.style.width=`${pct}%`;
    if(progressText){
      progressText.textContent=threshold>0
        ?`${money(Math.min(hhValue,threshold),'$')} / ${money(threshold,'$')} HH wholesale-waarde`
        :'Geen wholesale-drempel';
    }

    document.body.classList.toggle('smart-wholesale-active',Boolean(plan.thresholdActive&&plan.mode==='wholesale'));
  }

  function renderStats(){
    const selected=selectedItems();
    const matched=selected.filter(x=>x.item.hh&&x.item.emlins).length;
    const units=selected.reduce((sum,x)=>sum+x.qty*Number(x.item.hh?.unit_count||x.item.emlins?.unit_count||0),0);

    $('smartSelectedLines').textContent=String(selected.length);
    $('smartSelectedPacks').textContent=String(selected.reduce((sum,x)=>sum+x.qty,0));
    $('smartSelectedUnits').textContent=String(units);
    $('smartMatchedLines').textContent=String(matched);
  }

  function renderAll(){
    if(!state.loaded)return;
    renderCategories();
    renderMasterList();
    renderCart('hhpeptide','smartHhLines','smartHhTotal');
    renderCart('emlins','smartEmlinLines','smartEmlinTotal');
    renderPlanSummary();
    renderStats();
  }

  function injectStyles(){
    if($('supplierAutoCartStyles'))return;
    const style=document.createElement('style');
    style.id='supplierAutoCartStyles';
    style.textContent=`
      .supplier-view-switch{grid-template-columns:repeat(3,1fr)!important}
      body.p20-smart-mode .supplier-switcher,
      body.p20-smart-mode #supplierCategorySection,
      body.p20-smart-mode #supplierPricingCard,
      body.p20-smart-mode .supplier-toolbar,
      body.p20-smart-mode .supplier-layout,
      body.p20-smart-mode .supplier-bottom-bar,
      body.p20-smart-mode #supplierComparePanel{display:none!important}
      body:not(.p20-smart-mode) #supplierSmartPanel{display:none!important}

      #supplierSmartPanel{padding-bottom:48px}
      .smart-head{
        display:flex;justify-content:space-between;align-items:end;gap:28px;
        padding:22px 0;border-bottom:1px solid #111
      }
      .smart-head h2{
        margin:5px 0 0;font-size:clamp(36px,5vw,60px);line-height:.94;
        letter-spacing:-.05em;font-weight:500
      }
      .smart-head p{max-width:570px;margin:0;color:#6f6d67;font-size:12px;line-height:1.55}
      .smart-explain{
        margin:14px 0;padding:13px 15px;border:1px solid #d6d3cb;background:#fff;
        color:#6f6d67;font-size:10px;line-height:1.55
      }
      .smart-controls{
        display:grid;grid-template-columns:minmax(240px,1fr) auto;gap:12px;
        align-items:center;padding:18px 0 10px
      }
      .smart-search{
        min-height:48px;border:1px solid #d6d3cb;background:#fff;color:#111;
        padding:0 14px;font:inherit;font-size:14px
      }
      .smart-control-actions{display:flex;gap:8px;align-items:center}
      .smart-button{
        min-height:44px;border:1px solid #111;background:#fff;color:#111;
        padding:0 13px;font:inherit;font-size:9px;letter-spacing:.08em;cursor:pointer
      }
      .smart-button.primary{background:#111;color:#fff}
      .smart-subcontrols{
        display:flex;justify-content:space-between;gap:12px;align-items:center;
        padding:0 0 16px;flex-wrap:wrap
      }
      .smart-cats{display:flex;gap:6px;flex-wrap:wrap}
      .smart-cat{
        min-height:36px;border:1px solid #d6d3cb;background:#fff;color:#111;
        padding:0 12px;font:inherit;font-size:9px;cursor:pointer
      }
      .smart-cat.active{background:#111;color:#fff;border-color:#111}
      .smart-check{display:flex;gap:8px;align-items:center;color:#6f6d67;font-size:10px}

      .smart-stats{
        display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:#d6d3cb;
        border:1px solid #d6d3cb;margin-bottom:16px
      }
      .smart-stat{background:#fff;padding:13px}
      .smart-stat span{display:block;font-size:8px;letter-spacing:.11em;color:#777;text-transform:uppercase}
      .smart-stat strong{display:block;margin-top:4px;font-size:23px}

      .smart-list-head,.smart-row{
        display:grid;grid-template-columns:minmax(250px,1.3fr) 150px 150px 120px 116px;
        gap:12px;align-items:center
      }
      .smart-list-head{
        padding:10px 12px;border-bottom:1px solid #111;color:#777;
        font-size:8px;letter-spacing:.1em
      }
      .smart-catalogue{border-bottom:1px solid #111}
      .smart-row{min-height:70px;padding:11px 12px;border-bottom:1px solid #d6d3cb;background:#fff}
      .smart-row.selected{background:#f5f3ed}
      .smart-product strong{display:block;font-size:13px;line-height:1.3}
      .smart-product small{display:block;margin-top:4px;color:#777;font-size:9px;line-height:1.35}
      .smart-code{
        display:inline-block;margin-top:5px;padding:2px 5px;border:1px solid #d6d3cb;
        font-size:8px;letter-spacing:.08em
      }
      .smart-price-label{display:block;font-size:7px;letter-spacing:.1em;color:#888;margin-bottom:3px}
      .smart-price strong{display:block;font-size:14px}
      .smart-price small{display:block;margin-top:3px;color:#777;font-size:8px}
      .smart-best span{font-size:9px;line-height:1.35}
      .smart-qty{display:grid;grid-template-columns:34px 44px 34px;justify-content:end}
      .smart-qty button,.smart-qty input{
        height:36px;border:1px solid #d6d3cb;background:#fff;color:#111;
        text-align:center;font:inherit
      }
      .smart-qty input{width:44px;border-left:0;border-right:0;appearance:textfield}
      .smart-qty button{font-size:17px;cursor:pointer}
      .smart-empty{padding:45px;text-align:center;color:#777;background:#fff}

      .smart-optimizer{
        margin:22px 0;border:1px solid #111;background:#fff;padding:18px
      }
      .smart-optimizer-top{
        display:flex;justify-content:space-between;gap:20px;align-items:start
      }
      .smart-optimizer-top span{font-size:9px;letter-spacing:.12em;color:#777}
      .smart-optimizer-top strong{display:block;margin-top:5px;font-size:16px}
      .smart-overall{text-align:right}
      .smart-overall b{display:block;font-size:30px;letter-spacing:-.04em}
      .smart-overall small{display:block;margin-top:4px;color:#777;font-size:9px}
      .smart-threshold-track{height:6px;background:#e9e7e0;margin-top:16px;overflow:hidden}
      .smart-threshold-track span{display:block;height:100%;width:0;background:#111;transition:width .2s}
      .smart-threshold-label{margin-top:6px;color:#777;font-size:9px}
      .smart-wholesale-active .smart-optimizer{outline:2px solid #111;outline-offset:2px}

      .smart-carts{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:18px}
      .smart-cart{border:1px solid #111;background:#fff;padding:17px}
      .smart-cart-head{
        display:flex;justify-content:space-between;gap:16px;align-items:end;
        padding-bottom:13px;border-bottom:1px solid #d6d3cb
      }
      .smart-cart-head span{display:block;font-size:8px;letter-spacing:.12em;color:#777}
      .smart-cart-head h3{margin:4px 0 0;font-size:22px;font-weight:500}
      .smart-cart-head strong{font-size:22px}
      .smart-cart-lines{padding-top:4px}
      .smart-cart-line{
        display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;
        padding:12px 0;border-bottom:1px solid #e9e7e0
      }
      .smart-cart-line strong{display:block;font-size:11px}
      .smart-cart-line small{display:block;margin-top:3px;color:#777;font-size:9px}
      .smart-cart-line em{display:inline-block;margin-top:5px;font-size:8px;font-style:normal}
      .smart-cart-line em.hh{color:#111}
      .smart-cart-line em.emlins{color:#555}
      .smart-cart-line b{font-size:11px;white-space:nowrap}
      .smart-cart-empty{padding:24px 0;color:#777;font-size:11px}
      .smart-sync-note{
        margin-top:12px;color:#777;font-size:9px;line-height:1.5
      }

      @media(max-width:980px){
        .smart-list-head{display:none}
        .smart-row{grid-template-columns:1fr 1fr 1fr}
        .smart-product{grid-column:1/-1}
        .smart-qty{justify-content:start}
      }
      @media(max-width:720px){
        .supplier-view-switch{grid-template-columns:1fr!important}
        .supplier-view-switch button+button{border-left:0!important;border-top:1px solid #111}
        .smart-head{display:block}
        .smart-head p{margin-top:14px}
        .smart-controls{grid-template-columns:1fr}
        .smart-control-actions{display:grid;grid-template-columns:1fr 1fr}
        .smart-button{width:100%}
        .smart-stats{grid-template-columns:1fr 1fr}
        .smart-carts{grid-template-columns:1fr}
      }
      @media(max-width:520px){
        .smart-row{grid-template-columns:1fr 1fr}
        .smart-product{grid-column:1/-1}
        .smart-best{display:none}
        .smart-qty{grid-column:1/-1}
        .smart-optimizer-top{display:block}
        .smart-overall{text-align:left;margin-top:14px}
      }
    `;
    document.head.appendChild(style);
  }

  function injectUi(){
    const switcher=document.querySelector('.supplier-view-switch');
    if(!switcher||$('supplierSmartPanel'))return false;

    const smartButton=document.createElement('button');
    smartButton.type='button';
    smartButton.dataset.supplierView='smart';
    smartButton.textContent='Slim bestellen';
    switcher.appendChild(smartButton);

    const panel=document.createElement('section');
    panel.id='supplierSmartPanel';
    panel.innerHTML=`
      <div class="smart-head">
        <div>
          <p class="eyebrow">AUTO PROCUREMENT</p>
          <h2>Slim bestellen.</h2>
        </div>
        <p>Kies één keer wat je wilt bestellen. PURE20 verdeelt de regels automatisch over HHPeptide en Emlin's op basis van de laagste totale kost.</p>
      </div>

      <div class="smart-explain">
        De optimizer vergelijkt eerst HH-retail met Emlin's. Daarna berekent hij ook of het voordeliger is om de HH-wholesalegrens te activeren. Indien nodig kan één regel bewust naar HH verschuiven om de totale bestelling goedkoper te maken. Exacte matches gebeuren op productcode.
      </div>

      <div class="smart-controls">
        <input id="smartSearch" class="smart-search" type="search" placeholder="Zoek product, specificatie of code…" autocomplete="off">
        <div class="smart-control-actions">
          <button id="smartClear" class="smart-button" type="button">Slimme lijst wissen</button>
          <button id="smartOpenCarts" class="smart-button primary" type="button">Open leveranciermandjes →</button>
        </div>
      </div>

      <div class="smart-subcontrols">
        <div id="smartCats" class="smart-cats"></div>
        <label class="smart-check">
          <input id="smartMatchedOnly" type="checkbox">
          Alleen producten die beide leveranciers hebben
        </label>
      </div>

      <div class="smart-stats">
        <div class="smart-stat"><span>Geselecteerde regels</span><strong id="smartSelectedLines">0</strong></div>
        <div class="smart-stat"><span>Packs / kits</span><strong id="smartSelectedPacks">0</strong></div>
        <div class="smart-stat"><span>Vials / units</span><strong id="smartSelectedUnits">0</strong></div>
        <div class="smart-stat"><span>Exact vergelijkbaar</span><strong id="smartMatchedLines">0</strong></div>
      </div>

      <div class="smart-list-head">
        <span>PRODUCT / SPECIFICATIE</span>
        <span>HHPEPTIDE</span>
        <span>EMLIN'S</span>
        <span>SNELSTE CHECK</span>
        <span>AANTAL</span>
      </div>
      <div id="smartCatalogue" class="smart-catalogue">
        <div class="smart-empty">Slimme prijslijst laden…</div>
      </div>

      <section class="smart-optimizer">
        <div class="smart-optimizer-top">
          <div>
            <span>OPTIMALISATIE</span>
            <strong id="smartOptimizerStatus">Selecteer producten om te starten.</strong>
          </div>
          <div class="smart-overall">
            <span>TOTAAL BEIDE LEVERANCIERS</span>
            <b id="smartOverallTotal">$0.00</b>
            <small id="smartSaving"></small>
          </div>
        </div>
        <div class="smart-threshold-track"><span id="smartThresholdFill"></span></div>
        <div id="smartThresholdText" class="smart-threshold-label">$0.00 / $500.00 HH wholesale-waarde</div>
      </section>

      <div class="smart-carts">
        <section class="smart-cart">
          <div class="smart-cart-head">
            <div>
              <span>WINKELMANDJE 01</span>
              <h3>HHPeptide Factory</h3>
            </div>
            <strong id="smartHhTotal">$0.00</strong>
          </div>
          <div id="smartHhLines" class="smart-cart-lines">
            <div class="smart-cart-empty">Nog niets toegewezen.</div>
          </div>
        </section>

        <section class="smart-cart">
          <div class="smart-cart-head">
            <div>
              <span>WINKELMANDJE 02</span>
              <h3>Emlin's</h3>
            </div>
            <strong id="smartEmlinTotal">$0.00</strong>
          </div>
          <div id="smartEmlinLines" class="smart-cart-lines">
            <div class="smart-cart-empty">Nog niets toegewezen.</div>
          </div>
        </section>
      </div>

      <p class="smart-sync-note">
        De twee slimme winkelmandjes worden automatisch naar de bestaande leveranciermandjes gesynchroniseerd. “Open leveranciermandjes” herlaadt de klassieke bestelmodus met dezelfde aantallen.
      </p>
    `;
    document.querySelector('#supplierComparePanel')?.insertAdjacentElement('afterend',panel);

    switcher.addEventListener('click',e=>{
      const button=e.target.closest('[data-supplier-view]');
      if(!button)return;
      const view=button.dataset.supplierView;
      const wasSmart=document.body.classList.contains('p20-smart-mode');

      document.body.classList.toggle('p20-smart-mode',view==='smart');
      if(view==='smart')loadData();

      if(view==='order'&&wasSmart&&state.dirtyOrderView){
        location.reload();
      }
    });

    $('smartSearch').addEventListener('input',e=>{
      state.search=e.target.value||'';
      renderMasterList();
    });

    $('smartMatchedOnly').addEventListener('change',e=>{
      state.matchedOnly=Boolean(e.target.checked);
      renderMasterList();
    });

    $('smartCats').addEventListener('click',e=>{
      const button=e.target.closest('[data-smart-category]');
      if(!button)return;
      state.category=button.dataset.smartCategory;
      renderAll();
    });

    $('smartCatalogue').addEventListener('click',e=>{
      const row=e.target.closest('.smart-row[data-smart-key]');
      const button=e.target.closest('[data-smart-action]');
      if(!row||!button)return;
      const key=row.dataset.smartKey;
      const current=n(state.qty[key]);
      setQty(key,button.dataset.smartAction==='plus'?current+1:Math.max(0,current-1));
    });

    $('smartCatalogue').addEventListener('change',e=>{
      const row=e.target.closest('.smart-row[data-smart-key]');
      const input=e.target.closest('input[type=number]');
      if(!row||!input)return;
      setQty(row.dataset.smartKey,input.value);
    });

    $('smartClear').addEventListener('click',()=>{
      if(!Object.keys(state.qty).length)return;
      if(!confirm('Slimme bestellijst en automatisch toegewezen supplierregels wissen?'))return;
      state.qty={};
      writeJson(SMART_KEY,{});
      clearManagedDraft();
      state.plan=optimize();
      state.dirtyOrderView=true;
      renderAll();
    });

    $('smartOpenCarts').addEventListener('click',()=>{
      const plan=state.plan||optimize();
      const hhHas=plan.assignments.some(a=>a.supplier==='hhpeptide');
      localStorage.setItem(SUPPLIER_KEY,hhHas?'hhpeptide':'emlins');
      location.reload();
    });

    return true;
  }

  async function loadData(){
    if(state.loaded||state.loading)return;
    state.loading=true;

    try{
      const cfg=window.PURE20_SUPABASE_CONFIG||{};
      if(!cfg.url||!cfg.key||!window.supabase?.createClient)throw new Error('Supabase is niet beschikbaar.');

      client=client||window.supabase.createClient(cfg.url,cfg.key,{
        auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}
      });

      const {data:{session}}=await client.auth.getSession();
      if(!session?.user)throw new Error('Log eerst in als beheerder.');

      const [suppliersRes,rowsRes]=await Promise.all([
        client.from('pure20_suppliers')
          .select('supplier_key,name,currency_code,currency_symbol,pricing_mode,wholesale_threshold,active,sort_order')
          .eq('active',true)
          .in('supplier_key',['hhpeptide','emlins'])
          .order('sort_order',{ascending:true}),
        client.from('pure20_supplier_catalogue')
          .select('supplier_key,category,code,sort_order,product_name,specification,list_price,retail_price,wholesale_price,price_label,unit_count,unit_label,active')
          .eq('active',true)
          .in('supplier_key',['hhpeptide','emlins'])
          .order('supplier_key',{ascending:true})
          .order('category',{ascending:true})
          .order('sort_order',{ascending:true})
      ]);

      if(suppliersRes.error)throw suppliersRes.error;
      if(rowsRes.error)throw rowsRes.error;

      state.suppliers=new Map((suppliersRes.data||[]).map(s=>[s.supplier_key,s]));
      state.rows=rowsRes.data||[];
      buildItems();
      state.loaded=true;
      state.plan=optimize();
      syncSupplierDraft(state.plan);
      renderAll();
    }catch(err){
      console.error('PURE20 smart order:',err);
      const host=$('smartCatalogue');
      if(host)host.innerHTML=`<div class="smart-empty">Slim bestellen kon niet laden: ${esc(err?.message||err)}</div>`;
    }finally{
      state.loading=false;
    }
  }

  function boot(){
    injectStyles();

    let tries=0;
    const timer=setInterval(()=>{
      tries++;
      if(injectUi()||tries>200)clearInterval(timer);
    },50);
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',boot,{once:true});
  }else{
    boot();
  }
})();