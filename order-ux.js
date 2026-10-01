(() => {
'use strict';
const p=(location.pathname.replace(/\/+$/,'')||'/').toLowerCase();
const retail=p==='/shop'||p==='/shop.html';
const wholesale=p==='/wholesale'||p==='/wholesale.html';
const supplier=p==='/supplier-order'||p==='/supplier-order.html';
if(!retail&&!wholesale&&!supplier)return;

const $=id=>document.getElementById(id);
const n=v=>Math.max(0,Math.min(999,Math.floor(Number(v)||0)));
let raf=false, supplierSheet=null;

function selected(){
  document.querySelectorAll('.product-card').forEach(card=>{
    const q=n(card.querySelector('.qty-control input')?.value);
    card.classList.toggle('p20-selected-product',q>0);
  });
  document.querySelectorAll('.supplier-variant-row').forEach(row=>{
    const q=n(row.querySelector('.supplier-qty input')?.value);
    row.classList.toggle('p20-selected-product',q>0);
  });
}

function lineQty(line){
  const id=line?.dataset.id;
  if(id){
    const row=[...document.querySelectorAll('.variant-row[data-id]')].find(x=>x.dataset.id===id);
    const inp=row?.querySelector('.qty-control input');
    if(inp)return n(inp.value);
  }
  const t=line?.querySelector('.order-line-meta')?.textContent||'';
  return n((t.match(/·\s*(\d+)\s*×/)||t.match(/^\s*(\d+)\s*×/)||[])[1]);
}

function enhanceLines(){
  if(retail||wholesale){
    document.querySelectorAll('#orderLines .order-line').forEach(line=>{
      const actions=line.querySelector('.order-line-actions');
      if(!actions||actions.querySelector('.p20-cart-qty'))return;
      const input=document.createElement('input');
      input.type='number'; input.min='0'; input.step='1'; input.inputMode='numeric';
      input.className='p20-cart-qty'; input.value=String(lineQty(line));
      input.setAttribute('aria-label','Aantal aanpassen');
      const plus=actions.querySelector('[data-drawer-action="plus"],[data-da="plus"]');
      actions.insertBefore(input,plus||null);
    });
  }

  if(supplier){
    document.querySelectorAll('#supplierOrderLines .supplier-order-line').forEach(line=>{
      if(line.querySelector('.p20-supplier-cart-controls'))return;
      const right=line.querySelector('.supplier-order-line-price');
      const code=(line.querySelector('strong')?.textContent||'').split('·')[0].trim();
      if(!right||!code)return;
      const meta=line.querySelector('small')?.textContent||'';
      const qty=n((meta.match(/·\s*(\d+)\s*×/)||[])[1]);
      const wrap=document.createElement('div');
      wrap.className='p20-supplier-cart-controls';
      wrap.dataset.code=code;
      wrap.innerHTML=`<button type="button" data-p20-supplier="minus">−</button>
        <input type="number" min="0" max="999" step="1" inputmode="numeric" value="${qty}" aria-label="Aantal ${code}">
        <button type="button" data-p20-supplier="plus">+</button>`;
      right.appendChild(wrap);
    });
  }
}

function normaliseCartCopy(){
  const lang=window.PURE20_I18N?.language || (localStorage.getItem('pure20_language')==='en'?'en':'nl');
  const productsLabel=lang==='en'?'Products':'Producten';

  if(retail||wholesale){
    const heading=document.querySelector('#orderDrawer .first-block .section-heading h3');
    if(heading)heading.textContent=productsLabel;
  }

  if(supplier){
    document.querySelectorAll('#supplierSummaryMeta > div > span').forEach(span=>{
      const text=(span.textContent||'').trim().toLowerCase();
      if(
        text==='geselecteerde regels' ||
        text==='selected rows' ||
        text==='selected items' ||
        text==='geselecteerde producten'
      ) span.textContent=productsLabel;
    });
  }
}

function refresh(){
  if(raf)return;
  raf=true;
  requestAnimationFrame(()=>{raf=false;selected();enhanceLines();normaliseCartCopy();});
}

function findRow(id){
  return [...document.querySelectorAll('.variant-row[data-id]')].find(x=>x.dataset.id===id)||null;
}

function exposeRow(id){
  let row=findRow(id); if(row)return row;
  const s=$('search');
  if(s?.value){s.value='';s.dispatchEvent(new Event('input',{bubbles:true}));}
  const all=document.querySelector('[data-category="All"],[data-cat="All"]');
  if(all&&!all.classList.contains('active'))all.click();
  const stock=document.querySelector('[data-stock-filter="all"]');
  if(stock&&!stock.classList.contains('active'))stock.click();
  return findRow(id);
}

function setShopQty(line,target){
  const id=line?.dataset.id; if(!id)return;
  const input=exposeRow(id)?.querySelector('.qty-control input');
  if(input){
    input.value=String(target);
    input.dispatchEvent(new Event('change',{bubbles:true}));
  }
}

function supplierCodeRow(code){
  return [...document.querySelectorAll('.supplier-variant-row')].find(r=>
    (r.querySelector('.supplier-code')?.textContent||'').trim()===code
  )||null;
}

function supplierKey(code){
  try{
    const active=localStorage.getItem('pure20_supplier_hub_active_v1')||'hhpeptide';
    const d=JSON.parse(localStorage.getItem('pure20_supplier_hub_draft_v3')||'{}');
    return Object.keys(d||{}).find(k=>k.startsWith(active+'::')&&k.endsWith('::'+code))||'';
  }catch(_){return''}
}

function exposeSupplier(code){
  let row=supplierCodeRow(code); if(row)return row;
  const key=supplierKey(code);
  const cat=key.split('::')[1]||'';
  if(cat){
    const tab=[...document.querySelectorAll('[data-category]')].find(x=>x.dataset.category===cat);
    if(tab&&!tab.classList.contains('active'))tab.click();
  }
  const s=$('supplierSearch');
  if(s?.value){s.value='';s.dispatchEvent(new Event('input',{bubbles:true}));}
  return supplierCodeRow(code);
}

function setSupplierQty(code,target){
  const input=exposeSupplier(code)?.querySelector('.supplier-qty input');
  if(input){
    input.value=String(target);
    input.dispatchEvent(new Event('change',{bubbles:true}));
  }
}

function setupBars(){
  if(retail||wholesale){
    const bar=$('cartBar'), review=$('reviewOrder');
    if(!bar||!review||bar.dataset.p20Ready)return;
    bar.dataset.p20Ready='1';
    bar.classList.add('p20-clickable-cart');
    bar.addEventListener('click',e=>{
      if(e.target.closest('#clearCart,#reviewOrder,button,input,a,select,textarea'))return;
      review.click();
    });
  }
  if(supplier)setupSupplierSheet();
}

function setupSupplierSheet(){
  if(supplierSheet)return;
  const bar=document.querySelector('.supplier-bottom-bar');
  const summary=document.querySelector('.supplier-summary');
  if(!bar||!summary)return;

  const mark=document.createElement('span'); mark.hidden=true;
  summary.parentNode.insertBefore(mark,summary);

  const back=document.createElement('div');
  back.className='p20-supplier-sheet-backdrop'; back.hidden=true;
  document.body.appendChild(back);

  const close=document.createElement('button');
  close.type='button'; close.className='p20-supplier-sheet-close';
  close.textContent='×'; close.setAttribute('aria-label','Winkelmandje sluiten');
  summary.querySelector('.supplier-summary-head')?.appendChild(close);

  function open(){
    if(summary.classList.contains('p20-supplier-sheet'))return;
    back.hidden=false;
    requestAnimationFrame(()=>back.classList.add('visible'));
    document.body.appendChild(summary);
    summary.classList.add('p20-supplier-sheet');
    document.body.classList.add('p20-supplier-sheet-open');
    requestAnimationFrame(()=>summary.classList.add('open'));
    refresh();
  }
  function shut(){
    if(!summary.classList.contains('p20-supplier-sheet'))return;
    summary.classList.remove('open'); back.classList.remove('visible');
    document.body.classList.remove('p20-supplier-sheet-open');
    setTimeout(()=>{
      mark.parentNode?.insertBefore(summary,mark.nextSibling);
      summary.classList.remove('p20-supplier-sheet');
      back.hidden=true; refresh();
    },240);
  }
  bar.classList.add('p20-clickable-cart');
  bar.addEventListener('click',e=>{
    if(e.target.closest('button,input,a,select,textarea'))return;
    open();
  });
  close.addEventListener('click',shut);
  back.addEventListener('click',shut);
  document.addEventListener('keydown',e=>{if(e.key==='Escape')shut();});
  supplierSheet={open,shut};
}

function events(){
  document.addEventListener('change',e=>{
    if(e.target.matches('.p20-cart-qty')){
      setShopQty(e.target.closest('.order-line'),n(e.target.value));
    }
    if(e.target.matches('.p20-supplier-cart-controls input')){
      const w=e.target.closest('.p20-supplier-cart-controls');
      setSupplierQty(w?.dataset.code||'',n(e.target.value));
    }
  });

  document.addEventListener('click',e=>{
    const b=e.target.closest('[data-p20-supplier]');
    if(!b)return;
    const w=b.closest('.p20-supplier-cart-controls');
    const input=w?.querySelector('input'); if(!w||!input)return;
    const cur=n(input.value);
    setSupplierQty(w.dataset.code,b.dataset.p20Supplier==='plus'?cur+1:Math.max(0,cur-1));
  });
}

function init(){
  events(); setupBars(); refresh();
  new MutationObserver(refresh).observe(document.body,{childList:true,subtree:true});
  window.addEventListener('pure20:languagechange',refresh);
  window.addEventListener('pure20:i18nready',refresh);
  document.addEventListener('input',e=>{
    if(e.target.matches('.qty-control input,.supplier-qty input'))refresh();
  });
  document.addEventListener('change',e=>{
    if(e.target.matches('.qty-control input,.supplier-qty input'))refresh();
  });
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
else init();
})();