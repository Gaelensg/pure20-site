(() => {
  'use strict';

  if (window.__PURE20_SUPPLIER_COMPARE_V1__) return;
  window.__PURE20_SUPPLIER_COMPARE_V1__ = true;

  const $ = id => document.getElementById(id);
  const CATEGORY_LABELS = {all:'Alle',peptides:'Peptides',orals:'Orals',oils:'Oliën'};

  const state = {
    loaded:false,
    loading:false,
    suppliers:new Map(),
    rows:[],
    category:'peptides',
    search:'',
    matchedOnly:true,
    hhMode:'wholesale',
    sort:'product'
  };

  let client = null;

  function esc(value){
    return String(value ?? '').replace(/[&<>"']/g, c => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[c]));
  }

  function num(value){
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }

  function money(value, symbol='$'){
    if (value == null || !Number.isFinite(Number(value))) return '—';
    return `${symbol}${Number(value).toFixed(2)}`;
  }

  function pct(value){
    if (value == null || !Number.isFinite(Number(value))) return '';
    return `${Math.abs(Number(value)).toFixed(1)}%`;
  }

  function norm(value){
    return String(value || '')
      .toLowerCase()
      .replace(/somatropin/g,'')
      .replace(/bpc[\s-]*157/g,'bpc157')
      .replace(/tb[\s-]*500/g,'tb500')
      .replace(/[^a-z0-9]+/g,'');
  }

  function exactKey(row){
    const code = String(row.code || '').trim().toUpperCase().replace(/\s+/g,'');
    return code ? `${row.category}::${code}` : '';
  }

  function fallbackKey(row){
    return `${row.category}::${norm(row.product_name)}::${norm(row.specification)}`;
  }

  function supplierName(key){
    return state.suppliers.get(key)?.name || key;
  }

  function supplierSymbol(key){
    return state.suppliers.get(key)?.currency_symbol || '$';
  }

  function hhPrice(row){
    if (!row) return null;
    if (state.hhMode === 'retail') return num(row.retail_price);
    return num(row.wholesale_price);
  }

  function emlinPrice(row){
    return row ? num(row.list_price) : null;
  }

  function perUnit(price,row){
    const count = Number(row?.unit_count || 0);
    return price != null && count > 0 ? price / count : null;
  }

  function comparePrice(pair){
    const hp = hhPrice(pair.hh);
    const ep = emlinPrice(pair.emlins);
    if (hp == null || ep == null) return {winner:'none',delta:null,pct:null};

    const hu = perUnit(hp,pair.hh) ?? hp;
    const eu = perUnit(ep,pair.emlins) ?? ep;
    const delta = eu - hu;

    if (Math.abs(delta) < 0.000001) return {winner:'equal',delta:0,pct:0};

    const low = Math.min(hu,eu);
    const percentage = low > 0 ? (Math.abs(delta) / low) * 100 : null;
    return {winner:delta > 0 ? 'hh' : 'emlins',delta:Math.abs(delta),pct:percentage};
  }

  function matchRows(){
    const hh = state.rows.filter(r=>r.supplier_key==='hhpeptide' && r.active!==false);
    const em = state.rows.filter(r=>r.supplier_key==='emlins' && r.active!==false);

    const emExact = new Map();
    const emFallback = new Map();

    for (const row of em){
      const ek=exactKey(row);
      const fk=fallbackKey(row);
      if (ek && !emExact.has(ek)) emExact.set(ek,row);
      if (fk && !emFallback.has(fk)) emFallback.set(fk,row);
    }

    const usedEm = new Set();
    const pairs=[];

    for (const row of hh){
      let mate = null;
      const ek=exactKey(row);
      if (ek) mate=emExact.get(ek)||null;
      if (!mate) mate=emFallback.get(fallbackKey(row))||null;
      if (mate) usedEm.add(mate);
      pairs.push({key:ek||fallbackKey(row),hh:row,emlins:mate});
    }

    for (const row of em){
      if (usedEm.has(row)) continue;
      pairs.push({key:exactKey(row)||fallbackKey(row),hh:null,emlins:row});
    }

    return pairs;
  }

  function displayName(pair){
    return pair.hh?.product_name || pair.emlins?.product_name || 'Product';
  }

  function displaySpec(pair){
    const a=pair.hh?.specification||'';
    const b=pair.emlins?.specification||'';
    return a || b;
  }

  function displayCode(pair){
    return pair.hh?.code || pair.emlins?.code || '';
  }

  function categoryOf(pair){
    return pair.hh?.category || pair.emlins?.category || '';
  }

  function visiblePairs(){
    const q=state.search.trim().toLowerCase();

    let rows=matchRows().filter(pair=>{
      const category=categoryOf(pair);
      if (state.category!=='all' && category!==state.category) return false;
      if (state.matchedOnly && !(pair.hh && pair.emlins)) return false;
      if (!q) return true;
      const hay=[
        displayName(pair),
        displaySpec(pair),
        displayCode(pair),
        pair.hh?.product_name,
        pair.emlins?.product_name,
        pair.hh?.specification,
        pair.emlins?.specification
      ].join(' ').toLowerCase();
      return hay.includes(q);
    });

    if (state.sort==='difference'){
      rows.sort((a,b)=>{
        const ad=comparePrice(a).delta ?? -1;
        const bd=comparePrice(b).delta ?? -1;
        return bd-ad;
      });
    } else if (state.sort==='hh'){
      rows.sort((a,b)=>{
        const aw=comparePrice(a).winner==='hh'?0:1;
        const bw=comparePrice(b).winner==='hh'?0:1;
        return aw-bw || displayName(a).localeCompare(displayName(b));
      });
    } else if (state.sort==='emlins'){
      rows.sort((a,b)=>{
        const aw=comparePrice(a).winner==='emlins'?0:1;
        const bw=comparePrice(b).winner==='emlins'?0:1;
        return aw-bw || displayName(a).localeCompare(displayName(b));
      });
    } else {
      rows.sort((a,b)=>displayName(a).localeCompare(displayName(b),undefined,{numeric:true,sensitivity:'base'}));
    }

    return rows;
  }

  function injectStyles(){
    if ($('supplierCompareStyles')) return;
    const style=document.createElement('style');
    style.id='supplierCompareStyles';
    style.textContent=`
      .supplier-view-switch{
        display:grid;grid-template-columns:1fr 1fr;border:1px solid #111;
        margin:0 0 18px;background:#fff
      }
      .supplier-view-switch button{
        min-height:48px;border:0;background:#fff;color:#111;font:inherit;
        font-size:10px;letter-spacing:.12em;text-transform:uppercase;cursor:pointer
      }
      .supplier-view-switch button+button{border-left:1px solid #111}
      .supplier-view-switch button.active{background:#111;color:#fff}

      body.p20-compare-mode .supplier-switcher,
      body.p20-compare-mode #supplierCategorySection,
      body.p20-compare-mode #supplierPricingCard,
      body.p20-compare-mode .supplier-toolbar,
      body.p20-compare-mode .supplier-layout,
      body.p20-compare-mode .supplier-bottom-bar{display:none!important}
      body:not(.p20-compare-mode) #supplierComparePanel{display:none!important}

      #supplierComparePanel{padding-bottom:40px}
      .compare-head{
        display:flex;justify-content:space-between;gap:24px;align-items:end;
        padding:22px 0;border-bottom:1px solid #111
      }
      .compare-head h2{
        margin:5px 0 0;font-size:clamp(34px,5vw,58px);font-weight:500;
        line-height:.95;letter-spacing:-.045em
      }
      .compare-head p{margin:0;max-width:540px;color:#6f6d67;font-size:12px;line-height:1.55}
      .compare-note{
        margin:14px 0 0;padding:13px 15px;border:1px solid #d6d3cb;background:#fff;
        color:#6f6d67;font-size:10px;line-height:1.55
      }

      .compare-controls{
        display:grid;grid-template-columns:minmax(240px,1fr) auto auto;gap:10px;
        align-items:center;padding:18px 0
      }
      .compare-controls input[type=search]{
        min-height:48px;width:100%;border:1px solid #d6d3cb;background:#fff;
        padding:0 14px;font:inherit;font-size:14px;color:#111
      }
      .compare-segment{
        display:flex;border:1px solid #111;background:#fff
      }
      .compare-segment button{
        min-height:46px;border:0;background:transparent;padding:0 13px;color:#111;
        font:inherit;font-size:9px;letter-spacing:.08em;cursor:pointer
      }
      .compare-segment button+button{border-left:1px solid #d6d3cb}
      .compare-segment button.active{background:#111;color:#fff}
      .compare-select{
        min-height:48px;border:1px solid #d6d3cb;background:#fff;color:#111;
        padding:0 34px 0 12px;font:inherit;font-size:10px
      }

      .compare-subcontrols{
        display:flex;justify-content:space-between;gap:12px;align-items:center;
        padding-bottom:16px;flex-wrap:wrap
      }
      .compare-cats{display:flex;gap:6px;flex-wrap:wrap}
      .compare-cat{
        min-height:36px;padding:0 12px;border:1px solid #d6d3cb;background:#fff;
        color:#111;font:inherit;font-size:9px;cursor:pointer
      }
      .compare-cat.active{background:#111;color:#fff;border-color:#111}
      .compare-check{
        display:flex;align-items:center;gap:8px;font-size:10px;color:#6f6d67;cursor:pointer
      }

      .compare-stats{
        display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:#d6d3cb;
        border:1px solid #d6d3cb;margin-bottom:16px
      }
      .compare-stat{background:#fff;padding:14px}
      .compare-stat span{display:block;font-size:8px;letter-spacing:.11em;color:#777;text-transform:uppercase}
      .compare-stat strong{display:block;margin-top:5px;font-size:24px;letter-spacing:-.03em}

      .compare-table-head,
      .compare-row{
        display:grid;grid-template-columns:minmax(250px,1.35fr) minmax(170px,.72fr) minmax(170px,.72fr) minmax(150px,.62fr);
        gap:14px
      }
      .compare-table-head{
        padding:10px 14px;border-bottom:1px solid #111;color:#777;
        font-size:8px;letter-spacing:.12em
      }
      .compare-row{
        align-items:center;padding:15px 14px;border-bottom:1px solid #d6d3cb;background:#fff
      }
      .compare-row:hover{background:#f7f5ef}
      .compare-product strong{display:block;font-size:14px;line-height:1.3}
      .compare-product small{display:block;margin-top:5px;color:#777;font-size:9px;line-height:1.4}
      .compare-code{
        display:inline-block;margin-top:7px;padding:3px 6px;border:1px solid #d6d3cb;
        font-size:8px;letter-spacing:.08em
      }
      .compare-price strong{display:block;font-size:16px}
      .compare-price small{display:block;margin-top:4px;color:#777;font-size:9px;line-height:1.4}
      .compare-price .secondary-price{font-size:10px;color:#777;font-weight:500;margin-top:3px}
      .compare-result strong{display:block;font-size:11px}
      .compare-result small{display:block;margin-top:4px;color:#777;font-size:9px}
      .compare-result-badge{
        display:inline-flex;margin-top:6px;padding:4px 7px;border:1px solid #111;
        font-size:8px;letter-spacing:.08em;text-transform:uppercase
      }
      .compare-result-badge.hh{background:#111;color:#fff}
      .compare-result-badge.emlins{background:#fff;color:#111}
      .compare-pack-warning{color:#9b5f37!important}
      .compare-empty{padding:45px 16px;text-align:center;color:#777;background:#fff}
      .compare-loading{padding:50px;text-align:center;color:#777;background:#fff;border:1px solid #d6d3cb}

      @media(max-width:900px){
        .compare-controls{grid-template-columns:1fr}
        .compare-segment{width:100%}
        .compare-segment button{flex:1}
        .compare-select{width:100%}
        .compare-stats{grid-template-columns:1fr 1fr}
        .compare-table-head{display:none}
        .compare-row{grid-template-columns:1fr 1fr}
        .compare-product{grid-column:1/-1;padding-bottom:8px}
      }
      @media(max-width:560px){
        .compare-head{display:block}
        .compare-head p{margin-top:14px}
        .compare-row{grid-template-columns:1fr}
        .compare-product{grid-column:auto}
        .compare-price,.compare-result{padding-top:10px;border-top:1px solid #e9e7e0}
        .compare-stats{grid-template-columns:1fr 1fr}
        .supplier-view-switch button{font-size:9px}
      }
    `;
    document.head.appendChild(style);
  }

  function injectUi(){
    const hero=document.querySelector('#supplierApp .supplier-hero');
    if (!hero || $('supplierComparePanel')) return false;

    const switcher=document.createElement('section');
    switcher.className='supplier-view-switch';
    switcher.innerHTML=`
      <button type="button" class="active" data-supplier-view="order">Bestellen</button>
      <button type="button" data-supplier-view="compare">Prijzen vergelijken</button>
    `;
    hero.insertAdjacentElement('afterend',switcher);

    const panel=document.createElement('section');
    panel.id='supplierComparePanel';
    panel.innerHTML=`
      <div class="compare-head">
        <div>
          <p class="eyebrow">SUPPLIER PRICE INTELLIGENCE</p>
          <h2>Prijsvergelijker.</h2>
        </div>
        <p>Vergelijk dezelfde productcode bij HHPeptide Factory en Emlin's. De prijzen worden live vanuit de private leveranciersdatabase geladen.</p>
      </div>

      <div id="supplierCompareNote" class="compare-note"></div>

      <div class="compare-controls">
        <input id="supplierCompareSearch" type="search" placeholder="Zoek product, specificatie of code…" autocomplete="off">
        <div class="compare-segment" aria-label="HH-prijsbasis">
          <button type="button" data-hh-mode="retail">HH retail</button>
          <button type="button" class="active" data-hh-mode="wholesale">HH wholesale</button>
        </div>
        <select id="supplierCompareSort" class="compare-select" aria-label="Sorteren">
          <option value="product">Productnaam</option>
          <option value="difference">Grootste prijsverschil</option>
          <option value="hh">HH lager eerst</option>
          <option value="emlins">Emlin's lager eerst</option>
        </select>
      </div>

      <div class="compare-subcontrols">
        <div id="supplierCompareCats" class="compare-cats"></div>
        <label class="compare-check">
          <input id="supplierCompareMatched" type="checkbox" checked>
          Alleen producten die beide leveranciers hebben
        </label>
      </div>

      <div id="supplierCompareStats" class="compare-stats"></div>

      <div class="compare-table-head">
        <span>PRODUCT / SPECIFICATIE</span>
        <span>HHPEPTIDE</span>
        <span>EMLIN'S</span>
        <span>VERSCHIL</span>
      </div>
      <div id="supplierCompareRows">
        <div class="compare-loading">Vergelijkmodule laden…</div>
      </div>
    `;
    switcher.insertAdjacentElement('afterend',panel);

    switcher.addEventListener('click',e=>{
      const b=e.target.closest('[data-supplier-view]');
      if(!b)return;
      switcher.querySelectorAll('button').forEach(x=>x.classList.toggle('active',x===b));
      const compare=b.dataset.supplierView==='compare';
      document.body.classList.toggle('p20-compare-mode',compare);
      if(compare) loadData();
    });

    $('supplierCompareSearch').addEventListener('input',e=>{
      state.search=e.target.value||'';
      render();
    });

    panel.addEventListener('click',e=>{
      const mode=e.target.closest('[data-hh-mode]');
      if(mode){
        state.hhMode=mode.dataset.hhMode;
        panel.querySelectorAll('[data-hh-mode]').forEach(x=>x.classList.toggle('active',x===mode));
        render();
        return;
      }
      const cat=e.target.closest('[data-compare-category]');
      if(cat){
        state.category=cat.dataset.compareCategory;
        render();
      }
    });

    $('supplierCompareMatched').addEventListener('change',e=>{
      state.matchedOnly=Boolean(e.target.checked);
      render();
    });

    $('supplierCompareSort').addEventListener('change',e=>{
      state.sort=e.target.value;
      render();
    });

    return true;
  }

  function renderCats(){
    const host=$('supplierCompareCats');
    if(!host)return;
    const cats=['all',...new Set(state.rows.map(r=>r.category).filter(Boolean))];
    host.innerHTML=cats.map(cat=>`
      <button type="button"
        class="compare-cat ${state.category===cat?'active':''}"
        data-compare-category="${esc(cat)}">
        ${esc(CATEGORY_LABELS[cat]||cat)}
      </button>
    `).join('');
  }

  function renderStats(rows){
    const host=$('supplierCompareStats');
    if(!host)return;
    const matched=rows.filter(x=>x.hh&&x.emlins);
    const hh=matched.filter(x=>comparePrice(x).winner==='hh').length;
    const em=matched.filter(x=>comparePrice(x).winner==='emlins').length;
    const equal=matched.filter(x=>comparePrice(x).winner==='equal').length;

    host.innerHTML=`
      <div class="compare-stat"><span>Vergelijkbare regels</span><strong>${matched.length}</strong></div>
      <div class="compare-stat"><span>HH lager</span><strong>${hh}</strong></div>
      <div class="compare-stat"><span>Emlin's lager</span><strong>${em}</strong></div>
      <div class="compare-stat"><span>Gelijk</span><strong>${equal}</strong></div>
    `;
  }

  function hhMarkup(row){
    if(!row)return `<div class="compare-price"><strong>—</strong><small>Niet in HH-catalogus</small></div>`;
    const retail=num(row.retail_price);
    const wholesale=num(row.wholesale_price);
    const chosen=state.hhMode==='retail'?retail:wholesale;
    const unit=perUnit(chosen,row);
    return `<div class="compare-price">
      <strong>${money(chosen,supplierSymbol('hhpeptide'))}</strong>
      <div class="secondary-price">Retail ${money(retail,supplierSymbol('hhpeptide'))} · Wholesale ${money(wholesale,supplierSymbol('hhpeptide'))}</div>
      <small>${unit!=null?`${money(unit,supplierSymbol('hhpeptide'))} / ${esc((row.unit_label||'unit').replace(/s$/,''))}`:'Packprijs'} · ${row.unit_count||'—'} ${esc(row.unit_label||'units')}</small>
    </div>`;
  }

  function emMarkup(row){
    if(!row)return `<div class="compare-price"><strong>—</strong><small>Niet in Emlin's catalogus</small></div>`;
    const price=num(row.list_price);
    const unit=perUnit(price,row);
    return `<div class="compare-price">
      <strong>${money(price,supplierSymbol('emlins'))}</strong>
      <small>${unit!=null?`${money(unit,supplierSymbol('emlins'))} / ${esc((row.unit_label||'unit').replace(/s$/,''))}`:'Packprijs'} · ${row.unit_count||'—'} ${esc(row.unit_label||'units')}</small>
    </div>`;
  }

  function resultMarkup(pair){
    if(!(pair.hh&&pair.emlins)){
      return `<div class="compare-result"><strong>Geen directe match</strong><small>Slechts bij één leverancier gevonden.</small></div>`;
    }

    const c=comparePrice(pair);
    const hhCount=Number(pair.hh.unit_count||0);
    const emCount=Number(pair.emlins.unit_count||0);
    const packDiff=hhCount&&emCount&&hhCount!==emCount;

    if(c.winner==='equal'){
      return `<div class="compare-result">
        <strong>Zelfde prijs per unit</strong>
        <span class="compare-result-badge">Gelijk</span>
        ${packDiff?'<small class="compare-pack-warning">Packgrootte verschilt.</small>':''}
      </div>`;
    }

    if(c.winner==='none'){
      return `<div class="compare-result"><strong>Niet berekenbaar</strong><small>Prijs ontbreekt aan één zijde.</small></div>`;
    }

    const label=c.winner==='hh'?'HH lager':"Emlin's lager";
    const symbol=c.winner==='hh'?supplierSymbol('hhpeptide'):supplierSymbol('emlins');
    return `<div class="compare-result">
      <strong>${esc(label)}</strong>
      <small>${money(c.delta,symbol)} / unit ${c.pct!=null?`· ${pct(c.pct)}`:''}</small>
      <span class="compare-result-badge ${c.winner}">${esc(label)}</span>
      ${packDiff?'<small class="compare-pack-warning">Packgrootte verschilt, vergelijking is per unit.</small>':''}
    </div>`;
  }

  function renderRows(rows){
    const host=$('supplierCompareRows');
    if(!host)return;

    if(!rows.length){
      host.innerHTML=`<div class="compare-empty">Geen producten gevonden voor deze filters.</div>`;
      return;
    }

    host.innerHTML=rows.map(pair=>{
      const hhSpec=pair.hh?.specification||'';
      const emSpec=pair.emlins?.specification||'';
      const specs=hhSpec&&emSpec&&hhSpec!==emSpec
        ? `HH: ${hhSpec} · Emlin's: ${emSpec}`
        : (hhSpec||emSpec);
      return `<article class="compare-row">
        <div class="compare-product">
          <strong>${esc(displayName(pair))}</strong>
          <small>${esc(specs)}</small>
          <span class="compare-code">${esc(displayCode(pair))}</span>
        </div>
        ${hhMarkup(pair.hh)}
        ${emMarkup(pair.emlins)}
        ${resultMarkup(pair)}
      </article>`;
    }).join('');
  }

  function renderNote(){
    const note=$('supplierCompareNote');
    if(!note)return;
    const hh=state.suppliers.get('hhpeptide');
    const threshold=Number(hh?.wholesale_threshold||0);
    const mode=state.hhMode==='wholesale'?'wholesale':'retail';
    note.innerHTML=`Prijsverschillen worden berekend op <strong>prijs per unit</strong> met HH <strong>${mode}</strong> als gekozen basis. `+
      (threshold?`HH-wholesale geldt volgens de leveranciersregel vanaf <strong>${money(threshold,hh?.currency_symbol||'$')}</strong> wholesale-waarde. `:'')+
      `Beide huidige leverancierscatalogi staan in USD.`;
  }

  function render(){
    if(!state.loaded)return;
    renderCats();
    renderNote();
    const rows=visiblePairs();
    renderStats(rows);
    renderRows(rows);
  }

  async function loadData(){
    if(state.loaded||state.loading)return;
    state.loading=true;

    try{
      if(!client){
        const cfg=window.PURE20_SUPABASE_CONFIG||{};
        if(!cfg.url||!cfg.key||!window.supabase?.createClient)throw new Error('Supabase is niet beschikbaar.');
        client=window.supabase.createClient(cfg.url,cfg.key,{
          auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}
        });
      }

      const {data:{session}}=await client.auth.getSession();
      if(!session?.user)throw new Error('Log eerst in als beheerder.');

      const [suppliersRes,rowsRes]=await Promise.all([
        client.from('pure20_suppliers')
          .select('supplier_key,name,currency_code,currency_symbol,pricing_mode,wholesale_threshold,active,sort_order')
          .eq('active',true)
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
      state.loaded=true;
      render();
    }catch(err){
      console.error('PURE20 supplier compare:',err);
      const host=$('supplierCompareRows');
      if(host)host.innerHTML=`<div class="compare-empty">Vergelijkmodule kon niet laden: ${esc(err?.message||err)}</div>`;
    }finally{
      state.loading=false;
    }
  }

  function boot(){
    injectStyles();

    let tries=0;
    const timer=setInterval(()=>{
      tries++;
      if(injectUi()||tries>160)clearInterval(timer);
    },50);
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',boot,{once:true});
  }else{
    boot();
  }
})();