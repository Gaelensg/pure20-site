(() => {
  'use strict';

  if(window.__PURE20_ADMIN_INLINE_PRICE_STOCK_V6__)return;
  window.__PURE20_ADMIN_INLINE_PRICE_STOCK_V6__=true;

  const PATH=(location.pathname.replace(/\/+$/,'')||'/').toLowerCase();
  if(PATH!=='/admin'&&PATH!=='/admin.html')return;

  const DRAFT_KEY='pure20_admin_inline_price_stock_v6';
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

      .p20-inline-savebar[hidden]{
        display:none!important;
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
        /* Keep the existing mobile product-card layout compact. */
        #panel-products .admin-table td:nth-child(6),
        #panel-products .admin-table td:nth-child(7){
          width:132px;
          justify-self:end;
        }

        #panel-products .admin-table td:nth-child(6){
          text-align:right;
        }

        #panel-products .admin-table td:nth-child(7){
          display:flex!important;
          align-items:center;
          justify-content:flex-end;
          gap:7px;
          text-align:right;
        }

        #panel-products .admin-table td:nth-child(7)::before{
          content:"Stock";
          flex:0 0 auto;
          margin:0;
          font-size:10px;
          font-weight:500;
          color:#777;
        }

        #productsBody .p20-inline-price-wrap{
          display:flex;
          justify-content:flex-end;
          align-items:center;
          gap:5px;
          width:132px;
        }

        #productsBody .p20-inline-input{
          width:88px!important;
          min-width:88px!important;
          max-width:88px!important;
          height:36px;
          padding:0 8px;
          font-size:12px;
        }

        #productsBody .p20-inline-stock{
          width:62px!important;
          min-width:62px!important;
          max-width:62px!important;
        }

        #productsBody .p20-inline-currency{
          font-size:10px;
        }

        .p20-inline-savebar{
          bottom:6px;
          margin:12px -4px 0;
        }

        .p20-inline-savebar-inner{
          min-height:54px;
          padding:7px 8px 7px 12px;
          gap:8px;
        }

        .p20-inline-savebar-copy span{
          display:none;
        }

        .p20-inline-savebar-copy strong{
          margin-top:0;
          font-size:10px;
          line-height:1.25;
          max-width:180px;
        }

        .p20-inline-savebar button{
          min-height:40px;
          padding:0 10px;
          font-size:8px;
          letter-spacing:.06em;
          white-space:nowrap;
        }
      }

      @media(max-width:390px){
        #panel-products .admin-table td:nth-child(6),
        #panel-products .admin-table td:nth-child(7),
        #productsBody .p20-inline-price-wrap{
          width:116px;
        }

        #productsBody .p20-inline-input{
          width:74px!important;
          min-width:74px!important;
          max-width:74px!important;
        }

        #productsBody .p20-inline-stock{
          width:54px!important;
          min-width:54px!important;
          max-width:54px!important;
        }

        .p20-inline-savebar-copy strong{
          max-width:142px;
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
    bar.hidden=true;
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

    const cached=window.PURE20_ADMIN_SAVED_CACHE?.[String(row.dataset.id)]||null;

    if(cached){
      const name=cells[1]?.querySelector('strong');
      if(name&&cached.product_name!=null)name.textContent=String(cached.product_name);
      if(cells[2]&&cached.variant!=null)cells[2].textContent=String(cached.variant);
    }

    const originalPrice=cached?.price_eur!=null
      ? priceNumber(cached.price_eur)
      : priceNumber(priceCell.textContent);
    const originalStock=cached?.stock!=null
      ? stockNumber(cached.stock)
      : stockNumber(stockCell.textContent);

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

  function productSortParts(row){
    const name=String(row.querySelector('td:nth-child(2) strong')?.textContent||'').trim();
    const variant=String(row.querySelector('td:nth-child(3)')?.textContent||'').trim();
    const code=String(row.querySelector('td:nth-child(5)')?.textContent||'').trim();
    return {name,variant,code};
  }

  function compareText(a,b){
    return String(a||'').localeCompare(String(b||''),'nl',{
      sensitivity:'base',
      numeric:true,
      ignorePunctuation:true
    });
  }

  function sortRowsAlphabetically(){
    const body=$('productsBody');
    if(!body)return;

    const rows=[...body.querySelectorAll(':scope > tr[data-id]')];
    if(rows.length<2)return;

    const sorted=[...rows].sort((a,b)=>{
      const aa=productSortParts(a);
      const bb=productSortParts(b);
      return compareText(aa.name,bb.name)
        ||compareText(aa.variant,bb.variant)
        ||compareText(aa.code,bb.code);
    });

    const changed=rows.some((row,index)=>row!==sorted[index]);
    if(!changed)return;

    const fragment=document.createDocumentFragment();
    sorted.forEach(row=>fragment.appendChild(row));
    body.appendChild(fragment);
  }

  function decorateRows(){
    sortRowsAlphabetically();
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

    // No edits = no bar. It only appears when there is something actionable.
    if(count===0 && !message && !saveBusy){
      bar.hidden=true;
      text.textContent='';
      button.disabled=true;
      button.textContent='Wijzigingen opslaan';
      return;
    }

    bar.hidden=false;

    if(message){
      text.textContent=message;
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

  function captureVisibleInputs(){
    const draft=readDraft();

    document.querySelectorAll('#productsBody tr[data-id]').forEach(row=>{
      const id=String(row.dataset.id||'');
      const priceInput=row.querySelector('[data-inline-field="price"]');
      const stockInput=row.querySelector('[data-inline-field="stock"]');
      if(!id||!priceInput||!stockInput)return;

      const now={
        price:priceNumber(priceInput.value),
        stock:stockNumber(stockInput.value)
      };
      const original=originalValues(row);

      if(!samePrice(now.price,original.price)||now.stock!==original.stock){
        draft[id]=now;
      }else{
        delete draft[id];
      }
    });

    writeDraft(draft);
    return draft;
  }

  async function saveAll(){
    if(saveBusy)return;

    // Important on mobile: read the inputs again at the exact moment Save is tapped.
    if(document.activeElement instanceof HTMLElement){
      try{document.activeElement.blur()}catch(_){}
    }
    await new Promise(resolve=>setTimeout(resolve,0));

    const draft=captureVisibleInputs();
    const entries=Object.entries(draft);
    if(!entries.length){
      updateSaveBar();
      return;
    }

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
      const results=[];

      for(const [id,value] of entries){
        const expectedPrice=priceNumber(value.price);
        const expectedStock=stockNumber(value.stock);
        const payload={
          price_eur:expectedPrice,
          stock:expectedStock,
          updated_at:new Date().toISOString()
        };

        const {data,error}=await client
          .from('pure20_products')
          .update(payload)
          .eq('id',id)
          .select('id,price_eur,stock,updated_at')
          .maybeSingle();

        if(error)throw new Error(`${id}: ${error.message||error}`);
        if(!data){
          throw new Error(`${id}: Supabase heeft 0 rijen aangepast. De wijziging is NIET opgeslagen.`);
        }

        const actualPrice=priceNumber(data.price_eur);
        const actualStock=stockNumber(data.stock);

        if(!samePrice(actualPrice,expectedPrice)||actualStock!==expectedStock){
          throw new Error(
            `${id}: databasecontrole mislukt. Verwacht €${expectedPrice.toFixed(2)} / stock ${expectedStock}, `+
            `maar Supabase gaf €${actualPrice.toFixed(2)} / stock ${actualStock}.`
          );
        }

        window.PURE20_ADMIN_SAVED_CACHE=window.PURE20_ADMIN_SAVED_CACHE||{};
        window.PURE20_ADMIN_SAVED_CACHE[String(id)]={
          ...(window.PURE20_ADMIN_SAVED_CACHE[String(id)]||{}),
          id:String(id),
          price_eur:actualPrice,
          stock:actualStock
        };
        results.push({id:String(id),price:actualPrice,stock:actualStock});
      }

      clearDraft();

      for(const saved of results){
        const row=document.querySelector(`#productsBody tr[data-id="${CSS.escape(saved.id)}"]`);
        if(!row)continue;

        const priceInput=row.querySelector('[data-inline-field="price"]');
        const stockInput=row.querySelector('[data-inline-field="stock"]');
        if(priceInput)priceInput.value=Number(saved.price).toFixed(2);
        if(stockInput)stockInput.value=String(saved.stock);

        row.dataset.inlineOriginalPrice=String(saved.price);
        row.dataset.inlineOriginalStock=String(saved.stock);
        row.classList.remove('p20-inline-dirty','p20-inline-saving');
        row.classList.add('p20-inline-saved');
        updateStatusPreview(row);
      }

      updateSaveBar(
        `${results.length} product${results.length===1?'':'en'} opgeslagen ✓`,
        'success'
      );

      setTimeout(()=>{
        const bar=$('p20InlineSaveBar');
        if(bar)bar.hidden=true;
      },650);
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