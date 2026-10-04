(() => {
  'use strict';

  if(window.__PURE20_ADMIN_INLINE_PRICE_STOCK_V1__)return;
  window.__PURE20_ADMIN_INLINE_PRICE_STOCK_V1__=true;

  const PATH=(location.pathname.replace(/\/+$/,'')||'/').toLowerCase();
  if(PATH!=='/admin'&&PATH!=='/admin.html')return;

  const DRAFT_KEY='pure20_admin_inline_price_stock_v1';
  const $=id=>document.getElementById(id);

  let observer=null;
  let saveBusy=false;
  let decorateTimer=null;

  function readDraft(){
    try{
      const x=JSON.parse(sessionStorage.getItem(DRAFT_KEY)||'{}');
      return x&&typeof x==='object'?x:{};
    }catch(_){return{}}
  }

  function writeDraft(draft){
    try{sessionStorage.setItem(DRAFT_KEY,JSON.stringify(draft))}catch(_){}
  }

  function clearDraft(){
    try{sessionStorage.removeItem(DRAFT_KEY)}catch(_){}
  }

  function priceNumber(value){
    let s=String(value??'').trim().replace(/[^\d,.\-]/g,'');
    if(!s)return 0;

    if(s.includes(',')&&s.includes('.')){
      if(s.lastIndexOf(',')>s.lastIndexOf('.')){
        s=s.replace(/\./g,'').replace(',','.');
      }else{
        s=s.replace(/,/g,'');
      }
    }else if(s.includes(',')){
      s=s.replace(',','.');
    }

    const n=Number(s);
    return Number.isFinite(n)?Math.max(0,n):0;
  }

  function stockNumber(value){
    const n=Number(value);
    return Number.isFinite(n)?Math.max(0,Math.floor(n)):0;
  }

  function samePrice(a,b){
    return Math.abs(Number(a||0)-Number(b||0))<0.0001;
  }

  function injectStyles(){
    if($('p20InlineProductEditStyles'))return;

    const style=document.createElement('style');
    style.id='p20InlineProductEditStyles';
    style.textContent=`
      #productsBody .p20-inline-cell{
        vertical-align:middle;
      }

      #productsBody .p20-inline-input{
        box-sizing:border-box;
        width:100%;
        min-width:82px;
        max-width:118px;
        height:40px;
        border:1px solid #c9c6be;
        background:#fff;
        color:#111;
        padding:0 9px;
        font:inherit;
        font-size:12px;
        text-align:right;
        outline:none;
        border-radius:0;
        -webkit-appearance:none;
        appearance:none;
      }

      #productsBody .p20-inline-input:focus{
        border-color:#111;
        box-shadow:0 0 0 1px #111;
      }

      #productsBody .p20-inline-stock{
        max-width:82px;
      }

      #productsBody tr.p20-inline-dirty{
        background:#f7f3e9!important;
      }

      #productsBody tr.p20-inline-dirty .p20-inline-input{
        border-color:#111;
      }

      #productsBody tr.p20-inline-saving{
        opacity:.58;
        pointer-events:none;
      }

      #productsBody tr.p20-inline-saved{
        animation:p20InlineSaved .8s ease;
      }

      @keyframes p20InlineSaved{
        0%{background:#e9f4eb}
        100%{background:inherit}
      }

      .p20-inline-savebar{
        position:sticky;
        bottom:12px;
        z-index:35;
        margin:18px 0 0;
        border:1px solid #111;
        background:rgba(17,17,17,.97);
        color:#fff;
        box-shadow:0 12px 34px rgba(0,0,0,.16);
        backdrop-filter:blur(14px);
      }

      .p20-inline-savebar-inner{
        min-height:66px;
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:18px;
        padding:10px 12px 10px 16px;
      }

      .p20-inline-savebar-copy{
        min-width:0;
      }

      .p20-inline-savebar-copy span{
        display:block;
        font-size:9px;
        letter-spacing:.13em;
        color:rgba(255,255,255,.58);
        text-transform:uppercase;
      }

      .p20-inline-savebar-copy strong{
        display:block;
        margin-top:4px;
        font-size:12px;
        line-height:1.3;
        font-weight:600;
      }

      .p20-inline-savebar button{
        flex:0 0 auto;
        min-height:44px;
        border:1px solid #fff;
        background:#fff;
        color:#111;
        padding:0 17px;
        font:inherit;
        font-size:10px;
        font-weight:700;
        letter-spacing:.08em;
        text-transform:uppercase;
        cursor:pointer;
      }

      .p20-inline-savebar button:disabled{
        opacity:.38;
        cursor:not-allowed;
      }

      .p20-inline-savebar.error{
        background:#331d1d;
      }

      .p20-inline-savebar.success{
        background:#183023;
      }

      .p20-inline-price-wrap{
        display:flex;
        align-items:center;
        justify-content:flex-end;
        gap:5px;
      }

      .p20-inline-currency{
        font-size:11px;
        color:#777;
      }

      html[data-p20-theme="dark"] #productsBody .p20-inline-input{
        background:#151916;
        color:#f4f3ee;
        border-color:#505752;
      }

      html[data-p20-theme="dark"] #productsBody .p20-inline-input:focus{
        border-color:#f4f3ee;
        box-shadow:0 0 0 1px #f4f3ee;
      }

      html[data-p20-theme="dark"] #productsBody tr.p20-inline-dirty{
        background:#1d211c!important;
      }

      @media(max-width:760px){
        #productsBody .p20-inline-input{
          max-width:none;
          width:100%;
          min-width:0;
          height:42px;
          font-size:13px;
        }

        #productsBody .p20-inline-stock{
          max-width:none;
        }

        .p20-inline-price-wrap{
          justify-content:stretch;
        }

        .p20-inline-savebar{
          bottom:8px;
          margin-left:-2px;
          margin-right:-2px;
        }

        .p20-inline-savebar-inner{
          min-height:70px;
          padding:10px;
        }

        .p20-inline-savebar button{
          min-height:48px;
          padding:0 13px;
          font-size:9px;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function ensureSaveBar(){
    if($('p20InlineSaveBar'))return;

    const tableWrap=document.querySelector('#panel-products .admin-table-wrap');
    const card=tableWrap?.closest('.admin-card');
    if(!card)return;

    const bar=document.createElement('div');
    bar.id='p20InlineSaveBar';
    bar.className='p20-inline-savebar';
    bar.innerHTML=`
      <div class="p20-inline-savebar-inner">
        <div class="p20-inline-savebar-copy">
          <span>SNEL BEWERKEN</span>
          <strong id="p20InlineSaveText">Geen niet-opgeslagen wijzigingen.</strong>
        </div>
        <button id="p20InlineSaveButton" type="button" disabled>Wijzigingen opslaan</button>
      </div>
    `;
    tableWrap.insertAdjacentElement('afterend',bar);

    $('p20InlineSaveButton')?.addEventListener('click',saveAll);

    const hint=document.querySelector('#panel-products .product-list-hint');
    if(hint){
      hint.textContent='Prijs en stock kun je rechtstreeks in de lijst aanpassen. Gebruik Edit voor de overige productgegevens.';
    }

    updateSaveBar();
  }

  function rowValues(row){
    const priceInput=row.querySelector('[data-inline-field="price"]');
    const stockInput=row.querySelector('[data-inline-field="stock"]');

    return {
      price:priceNumber(priceInput?.value),
      stock:stockNumber(stockInput?.value)
    };
  }

  function originalValues(row){
    return {
      price:priceNumber(row.dataset.inlineOriginalPrice),
      stock:stockNumber(row.dataset.inlineOriginalStock)
    };
  }

  function isDirty(row){
    const now=rowValues(row);
    const original=originalValues(row);
    return !samePrice(now.price,original.price)||now.stock!==original.stock;
  }

  function rememberRow(row){
    const id=String(row.dataset.id||'');
    if(!id)return;

    const draft=readDraft();

    if(isDirty(row)){
      const value=rowValues(row);
      draft[id]=value;
    }else{
      delete draft[id];
    }

    writeDraft(draft);
    row.classList.toggle('p20-inline-dirty',isDirty(row));
    updateSaveBar();
    updateStatusPreview(row);
  }

  function updateStatusPreview(row){
    const stockInput=row.querySelector('[data-inline-field="stock"]');
    const chip=row.querySelector('.status-chip');
    if(!stockInput||!chip)return;

    const stock=stockNumber(stockInput.value);
    const originallyHidden=chip.classList.contains('chip-off');

    if(originallyHidden && !row.dataset.inlineWasActive){
      row.dataset.inlineWasActive='false';
    }else if(!row.dataset.inlineWasActive){
      row.dataset.inlineWasActive='true';
    }

    const active=row.dataset.inlineWasActive!=='false';
    if(!active){
      chip.textContent='Hidden';
      chip.classList.remove('chip-on');
      chip.classList.add('chip-off');
      return;
    }

    chip.textContent=stock>0?'Active':'Out of stock';
    chip.classList.remove('chip-off');
    chip.classList.add('chip-on');
  }

  function decorateRow(row){
    if(!row?.dataset?.id||row.dataset.inlineReady==='1')return;

    const cells=row.querySelectorAll(':scope > td');
    if(cells.length<7)return;

    const priceCell=cells[5];
    const stockCell=cells[6];

    const originalPrice=priceNumber(priceCell.textContent);
    const originalStock=stockNumber(stockCell.textContent);

    row.dataset.inlineOriginalPrice=String(originalPrice);
    row.dataset.inlineOriginalStock=String(originalStock);

    const chip=row.querySelector('.status-chip');
    row.dataset.inlineWasActive=chip?.textContent?.trim()==='Hidden'?'false':'true';

    const draft=readDraft()[String(row.dataset.id)]||null;
    const shownPrice=draft?.price!=null?priceNumber(draft.price):originalPrice;
    const shownStock=draft?.stock!=null?stockNumber(draft.stock):originalStock;

    priceCell.classList.add('p20-inline-cell');
    stockCell.classList.add('p20-inline-cell');

    priceCell.innerHTML=`
      <div class="p20-inline-price-wrap">
        <span class="p20-inline-currency">€</span>
        <input
          class="p20-inline-input"
          data-inline-field="price"
          type="number"
          min="0"
          step="0.01"
          inputmode="decimal"
          value="${shownPrice.toFixed(2)}"
          aria-label="Prijs">
      </div>
    `;

    stockCell.innerHTML=`
      <input
        class="p20-inline-input p20-inline-stock"
        data-inline-field="stock"
        type="number"
        min="0"
        step="1"
        inputmode="numeric"
        value="${shownStock}"
        aria-label="Stock">
    `;

    row.dataset.inlineReady='1';
    row.classList.toggle('p20-inline-dirty',Boolean(draft));

    priceCell.querySelector('input')?.addEventListener('input',()=>rememberRow(row));
    priceCell.querySelector('input')?.addEventListener('change',()=>rememberRow(row));
    stockCell.querySelector('input')?.addEventListener('input',()=>rememberRow(row));
    stockCell.querySelector('input')?.addEventListener('change',()=>rememberRow(row));

    updateStatusPreview(row);
  }

  function decorateRows(){
    document.querySelectorAll('#productsBody tr[data-id]').forEach(decorateRow);
    updateSaveBar();
  }

  function scheduleDecorate(){
    clearTimeout(decorateTimer);
    decorateTimer=setTimeout(decorateRows,30);
  }

  function updateSaveBar(message='',mode=''){
    ensureSaveBar();

    const draft=readDraft();
    const count=Object.keys(draft).length;
    const text=$('p20InlineSaveText');
    const button=$('p20InlineSaveButton');
    const bar=$('p20InlineSaveBar');

    if(!text||!button||!bar)return;

    bar.classList.remove('error','success');
    if(mode)bar.classList.add(mode);

    if(message){
      text.textContent=message;
    }else if(count===0){
      text.textContent='Geen niet-opgeslagen wijzigingen.';
    }else if(count===1){
      text.textContent='1 product aangepast. Nog niet opgeslagen.';
    }else{
      text.textContent=`${count} producten aangepast. Nog niet opgeslagen.`;
    }

    button.disabled=saveBusy||count===0;
    button.textContent=saveBusy?'Opslaan…':'Wijzigingen opslaan';
  }

  async function waitForClient(){
    for(let i=0;i<160;i++){
      const api=window.PURE20_API;
      if(api?.client)return api.client;
      await new Promise(r=>setTimeout(r,50));
    }
    return null;
  }

  async function saveAll(){
    if(saveBusy)return;

    const draft=readDraft();
    const entries=Object.entries(draft);
    if(!entries.length)return;

    const client=await waitForClient();
    if(!client){
      updateSaveBar('Opslaan mislukt: databaseverbinding niet beschikbaar.','error');
      return;
    }

    saveBusy=true;
    updateSaveBar(`${entries.length} wijziging${entries.length===1?'':'en'} opslaan…`);

    document.querySelectorAll('#productsBody tr.p20-inline-dirty').forEach(row=>{
      row.classList.add('p20-inline-saving');
    });

    try{
      const results=await Promise.all(entries.map(async ([id,value])=>{
        const payload={
          price_eur:priceNumber(value.price),
          stock:stockNumber(value.stock),
          updated_at:new Date().toISOString()
        };

        const {error}=await client
          .from('pure20_products')
          .update(payload)
          .eq('id',id);

        if(error)throw new Error(`${id}: ${error.message||error}`);
        return id;
      }));

      clearDraft();

      document.querySelectorAll('#productsBody tr.p20-inline-dirty').forEach(row=>{
        row.classList.remove('p20-inline-dirty','p20-inline-saving');
        row.classList.add('p20-inline-saved');
      });

      updateSaveBar(
        `${results.length} product${results.length===1?'':'en'} opgeslagen ✓`,
        'success'
      );

      // admin.js keeps its own store in a closure.
      // One controlled reload guarantees Edit/modal, filters and stats all use the new values.
      setTimeout(()=>location.reload(),700);
    }catch(err){
      console.error('PURE20 inline save:',err);

      document.querySelectorAll('#productsBody tr.p20-inline-saving').forEach(row=>{
        row.classList.remove('p20-inline-saving');
      });

      updateSaveBar(
        `Opslaan mislukt: ${err?.message||err}`,
        'error'
      );
    }finally{
      saveBusy=false;
    }
  }

  function boot(){
    injectStyles();

    const body=$('productsBody');
    if(!body)return;

    ensureSaveBar();
    decorateRows();

    observer=new MutationObserver(scheduleDecorate);
    observer.observe(body,{childList:true,subtree:false});

    // If filtering/rerendering happens during initial load.
    [100,300,700,1400].forEach(ms=>setTimeout(decorateRows,ms));

    // Warn before leaving with unsaved work.
    window.addEventListener('beforeunload',e=>{
      if(!Object.keys(readDraft()).length||saveBusy)return;
      e.preventDefault();
      e.returnValue='';
    });
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',boot,{once:true});
  }else{
    boot();
  }
})();