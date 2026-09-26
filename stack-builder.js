(() => {
  const $=id=>document.getElementById(id);
  const PENDING_KEY='pure20_stack_pending_login_v1', LANGKEY='pure20_language';
  let lang=localStorage.getItem(LANGKEY)==='en'?'en':'nl';
  let products=[], stack=[];
  let cloudStackId='';

  const copy={
    nl:{
      eyebrow:'PURE20 / STACK BUILDER',heroA:'Build it.',heroB:'Keep it clear.',
      heroText:'Stel meerdere compounds samen in één overzicht, voer je eigen onderzoekswaarden en planning in, controleer de rekenkundige conversies en print het resultaat.',
      compounds:'COMPOUNDS IN DEZE STACK',stackDetails:'STACK DETAILS',stackName:'Naam van de stack',reference:'Naam / referentie',startDate:'Startdatum',duration:'Duur',weeks:'weken',
      purpose:'Onderzoeksdoel / notitie',builder:'BUILDER',compose:'Stel je stack samen.',addCompound:'Compound toevoegen',clear:'Wissen',loadingCatalogue:'Catalogus laden…',
      emptyTitle:'Nog geen compounds.',emptyText:'Voeg een compound toe om je research stack op te bouwen.',addFirst:'Eerste compound toevoegen',overview:'OVERZICHT',
      totalCompounds:'Compounds',scheduledMoments:'Geplande momenten / week',savedLocally:'Opslaan',local:'Account',ready:'KLAAR OM TE BEWAREN',
      printTitle:'Bewaar in je account of print als PDF.',saveAccount:'Opslaan in account',myStacks:'Mijn stacks',accountSaved:'Opgeslagen in je account.',accountUpdated:'Stack in je account bijgewerkt.',loginToSave:'Log eerst in om in je account te bewaren.',cloudLoaded:'Opgeslagen stack geladen.',printText:'Op iPhone kun je via de printweergave ook als PDF bewaren of delen.',save:'Lokaal bewaren',print:'Print / PDF',
      boundary:'Deze tool organiseert waarden die je zelf invoert en voert uitsluitend rekenkundige conversies uit. Hij kiest geen compounds, stack, dosis, frequentie, toedieningswijze of behandeling en controleert geen interacties. Combineer experimentele stoffen niet op basis van deze planner alleen.',
      product:'Product / variant',customName:'Naam bij handmatige invoer',vialAmount:'Hoeveelheid in vial',liquidVolume:'Totale vloeistof',
      plannedAmount:'Zelf ingevoerde hoeveelheid / moment',timeNote:'Moment / korte notitie',days:'Dagen',notes:'Notities',
      u100:'U-100 markering',concentration:'Concentratie',volume:'Volume / moment',portions:'Theoretische porties / vial',
      custom:'Handmatige invoer',catalogueLive:'Live catalogus geladen.',catalogueFallback:'Catalogus niet bereikbaar. Handmatige invoer blijft beschikbaar.',
      incompatible:'De gekozen eenheden zijn niet rechtstreeks compatibel. Gebruik mg ↔ mcg of IU ↔ IU.',
      over100:'De berekende markering is groter dan 100 U. Controleer je invoer en gebruikte spuit.',
      saved:'Stack lokaal bewaard.',cleared:'Stack gewist.',daysShort:['Zo','Ma','Di','Wo','Do','Vr','Za']
    },
    en:{
      eyebrow:'PURE20 / STACK BUILDER',heroA:'Build it.',heroB:'Keep it clear.',
      heroText:'Organize multiple compounds in one place, enter your own research values and schedule, verify transparent arithmetic and print the result.',
      compounds:'COMPOUNDS IN THIS STACK',stackDetails:'STACK DETAILS',stackName:'Stack name',reference:'Name / reference',startDate:'Start date',duration:'Duration',weeks:'weeks',
      purpose:'Research purpose / note',builder:'BUILDER',compose:'Compose your stack.',addCompound:'Add compound',clear:'Clear',loadingCatalogue:'Loading catalogue…',
      emptyTitle:'No compounds yet.',emptyText:'Add a compound to start building your research stack.',addFirst:'Add first compound',overview:'OVERVIEW',
      totalCompounds:'Compounds',scheduledMoments:'Scheduled moments / week',savedLocally:'Save',local:'Account',ready:'READY TO SAVE',
      printTitle:'Save to your account or print as PDF.',saveAccount:'Save to account',myStacks:'My stacks',accountSaved:'Saved to your account.',accountUpdated:'Stack updated in your account.',loginToSave:'Sign in first to save to your account.',cloudLoaded:'Saved stack loaded.',printText:'On iPhone, the print sheet can also be used to save or share a PDF.',save:'Save locally',print:'Print / PDF',
      boundary:'This tool organizes values you enter yourself and performs arithmetic conversions only. It does not choose compounds, a stack, dose, frequency, route or treatment and it does not check interactions. Do not combine experimental compounds based on this planner alone.',
      product:'Product / variant',customName:'Name for manual entry',vialAmount:'Amount in vial',liquidVolume:'Total liquid volume',
      plannedAmount:'User-entered amount / moment',timeNote:'Timing / short note',days:'Days',notes:'Notes',
      u100:'U-100 marking',concentration:'Concentration',volume:'Volume / moment',portions:'Theoretical portions / vial',
      custom:'Manual entry',catalogueLive:'Live catalogue loaded.',catalogueFallback:'Catalogue unavailable. Manual entry remains available.',
      incompatible:'The selected units are not directly compatible. Use mg ↔ mcg or IU ↔ IU.',
      over100:'The calculated marking is above 100 U. Verify your inputs and syringe.',
      saved:'Stack saved locally.',cleared:'Stack cleared.',daysShort:['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
    }
  };

  const t=k=>copy[lang][k]??k;
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const num=v=>{const n=Number(String(v??'').trim().replace(',','.'));return Number.isFinite(n)?n:NaN};
  const fmt=(n,max=3)=>Number.isFinite(n)?new Intl.NumberFormat(lang==='en'?'en-GB':'nl-BE',{maximumFractionDigits:max}).format(n):'—';
  const uid=()=>crypto.randomUUID?crypto.randomUUID():`s-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const slugify=v=>String(v||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');

  function knowledgeSlug(p){
    const aliases={
      'bpc-157':'bpc-157','tb500':'tb-500','tb-500':'tb-500','ghk-cu':'ghk-cu','retatrutide':'retatrutide',
      'tirzepatide':'tirzepatide','cagrilintide':'cagrilintide','mots-c':'mots-c','pt-141':'pt-141',
      'tesamorelin':'tesamorelin','ipamorelin':'ipamorelin','dsip':'dsip','selank':'selank','semax':'semax',
      'epitalon':'epitalon','ss-31':'ss-31','aod9604':'aod-9604','aod-9604':'aod-9604','kisspeptin-10':'kisspeptin-10','kpv':'kpv'
    };
    return aliases[slugify(p?.product)]||'';
  }
  function variantAmount(v){
    const m=String(v||'').trim().match(/^([\d.,]+)\s*(mg|mcg|iu)$/i);
    return m?{amount:num(m[1]),unit:m[2].toLowerCase()}:null;
  }
  function convert(v,from,to){
    if(from===to)return v;
    if(from==='mg'&&to==='mcg')return v*1000;
    if(from==='mcg'&&to==='mg')return v/1000;
    return NaN;
  }
  function fresh(){
    return {id:uid(),productId:'',customName:'',vialAmount:'',vialUnit:'mg',liquidMl:'',targetAmount:'',targetUnit:'mcg',timeNote:'',days:[],notes:''};
  }

  const apiClient=()=>window.PURE20_API?.client||null;
  function setCloudStatus(message,type=''){
    const el=$('accountSaveStatus');if(!el)return;
    el.textContent=message||'';el.className=`account-save-status ${type}`.trim();
  }
  function applySnapshot(raw){
    if(!raw||typeof raw!=='object')return;
    const m=raw.meta||{};
    $('stackName').value=m.name||'';$('stackReference').value=m.reference||'';$('startDate').value=m.startDate||'';$('durationWeeks').value=m.durationWeeks||'';$('stackPurpose').value=m.purpose||'';
    stack=Array.isArray(raw.stack)?raw.stack.map(x=>({...fresh(),...x,id:x.id||uid(),days:Array.isArray(x.days)?x.days:[]})):[];
  }
  async function session(){
    const client=apiClient();if(!client)return null;
    const {data,error}=await client.auth.getSession();if(error)throw error;return data?.session||null;
  }
  async function loadCloudStack(){
    const id=(new URLSearchParams(location.search).get('stack')||'').trim();
    if(!id)return false;
    const sess=await session();
    if(!sess){
      const next=`${location.pathname}${location.search}`;
      location.href=`/account?next=${encodeURIComponent(next)}`;
      return true;
    }
    const client=apiClient();
    const {data,error}=await client.from('pure20_saved_stacks').select('id,title,data').eq('id',id).single();
    if(error)throw error;
    cloudStackId=data.id;applySnapshot(data.data||{});setCloudStatus(t('cloudLoaded'),'success');return true;
  }
  async function saveToAccount(){
    try{
      const sess=await session();
      if(!sess){
        try{sessionStorage.setItem(PENDING_KEY,JSON.stringify(snapshot()))}catch(_){}
        localStorage.setItem('pure20_account_next',location.pathname+location.search);
        setCloudStatus(t('loginToSave'),'error');
        setTimeout(()=>location.href=`/account?next=${encodeURIComponent(location.pathname+location.search)}`,450);
        return;
      }
      const client=apiClient();
      const payload=snapshot();
      const title=String(payload.meta?.name||'').trim()||(lang==='en'?'Untitled stack':'Naamloze stack');
      let result;
      if(cloudStackId){
        result=await client.from('pure20_saved_stacks').update({title,data:payload}).eq('id',cloudStackId).select('id').single();
      }else{
        result=await client.from('pure20_saved_stacks').insert({user_id:sess.user.id,title,data:payload}).select('id').single();
      }
      if(result.error)throw result.error;
      const wasExisting=Boolean(cloudStackId);
      cloudStackId=result.data.id;
      history.replaceState(null,'',`/stack-builder?stack=${encodeURIComponent(cloudStackId)}`);
      setCloudStatus(wasExisting?t('accountUpdated'):t('accountSaved'),'success');
    }catch(err){setCloudStatus(err?.message||'Save failed.','error')}
  }

  async function loadProducts(){
    const status=$('catalogueStatus');
    try{
      if(!window.PURE20_API?.loadPublicStore)throw new Error('API unavailable');
      const result=await window.PURE20_API.loadPublicStore();
      products=(result?.store?.products||[]).filter(p=>p.active!==false);
      status.className='catalogue-status live';
      status.querySelector('span:last-child').textContent=t('catalogueLive');
    }catch(_){
      products=[];
      status.className='catalogue-status error';
      status.querySelector('span:last-child').textContent=t('catalogueFallback');
    }
  }

  function selected(item){return products.find(p=>p.id===item.productId)||null}
  function label(p){return `${p.product}${p.variant?` · ${p.variant}`:''}${p.code?` · ${p.code}`:''}`}

  function fillSelect(select,item){
    const groups=new Map();
    products.forEach(p=>{if(!groups.has(p.category))groups.set(p.category,[]);groups.get(p.category).push(p)});
    select.innerHTML=`<option value="">${esc(t('custom'))}</option>`;
    for(const [cat,list] of groups){
      const g=document.createElement('optgroup');g.label=cat;
      list.forEach(p=>{const o=document.createElement('option');o.value=p.id;o.textContent=label(p);g.appendChild(o)});
      select.appendChild(g);
    }
    select.value=item.productId||'';
  }

  function sync(item,card){
    card.querySelectorAll('[data-field]').forEach(el=>item[el.dataset.field]=el.value);
    item.days=[...card.querySelectorAll('[data-day]:checked')].map(x=>Number(x.dataset.day));
  }

  function applyProduct(item,card,autofill=false){
    const p=selected(item), head=card.querySelector('[data-role=heading]'), customWrap=card.querySelector('.custom-name-wrap');
    customWrap.style.display=p?'none':'block';
    if(p){
      head.textContent=`${p.product}${p.variant?` · ${p.variant}`:''}`;
      if(autofill){
        const parsed=variantAmount(p.variant);
        if(parsed){
          item.vialAmount=String(parsed.amount); item.vialUnit=parsed.unit;
          card.querySelector('[data-field=vialAmount]').value=item.vialAmount;
          card.querySelector('[data-field=vialUnit]').value=item.vialUnit;
          if(parsed.unit==='iu'){item.targetUnit='iu';card.querySelector('[data-field=targetUnit]').value='iu'}
        }
      }
      const slug=knowledgeSlug(p), know=card.querySelector('[data-role=knowledge]'), coa=card.querySelector('[data-role=coa]');
      know.hidden=!slug;if(slug)know.href=`/${slug}.html`;
      coa.hidden=!p.coaUrl;if(p.coaUrl)coa.href=p.coaUrl;
    }else{
      head.textContent=item.customName||t('custom');
      card.querySelector('[data-role=knowledge]').hidden=true;
      card.querySelector('[data-role=coa]').hidden=true;
    }
  }

  function calculate(item,card){
    const vial=num(item.vialAmount), water=num(item.liquidMl), target=num(item.targetAmount);
    const out=k=>card.querySelector(`[data-output=${k}]`), warn=card.querySelector('[data-role=warning]');
    warn.textContent='';
    if(!(vial>0&&water>0&&target>0)){
      ['units','concentration','volume','portions'].forEach(k=>out(k).textContent='—');return;
    }
    let targetInVial;
    if(item.vialUnit==='iu'||item.targetUnit==='iu'){
      if(item.vialUnit!=='iu'||item.targetUnit!=='iu'){
        warn.textContent=t('incompatible');['units','concentration','volume','portions'].forEach(k=>out(k).textContent='—');return;
      }
      targetInVial=target;
    }else targetInVial=convert(target,item.targetUnit,item.vialUnit);

    if(!Number.isFinite(targetInVial)||targetInVial<=0){
      warn.textContent=t('incompatible');return;
    }
    const concentration=vial/water, volume=targetInVial/concentration, units=volume*100, portions=vial/targetInVial;
    out('units').textContent=`${fmt(units,2)} U`;
    out('concentration').textContent=`${fmt(concentration,4)} ${item.vialUnit==='iu'?'IU':item.vialUnit}/mL`;
    out('volume').textContent=`${fmt(volume,4)} mL`;
    out('portions').textContent=fmt(portions,2);
    if(units>100)warn.textContent=t('over100');
  }

  function render(){
    const list=$('compoundList');list.innerHTML='';$('emptyState').hidden=stack.length>0;
    stack.forEach((item,i)=>{
      const frag=$('compoundTemplate').content.cloneNode(true), card=frag.querySelector('.compound-card');
      card.dataset.id=item.id;card.querySelector('.compound-index').textContent=String(i+1).padStart(2,'0');
      fillSelect(card.querySelector('[data-field=productId]'),item);
      ['customName','vialAmount','vialUnit','liquidMl','targetAmount','targetUnit','timeNote','notes'].forEach(k=>{const el=card.querySelector(`[data-field="${k}"]`);if(el)el.value=item[k]??''});
      item.days.forEach(d=>{const el=card.querySelector(`[data-day="${d}"]`);if(el)el.checked=true});
      applyProduct(item,card,false);calculate(item,card);

      card.addEventListener('input',e=>{
        if(!e.target.matches('[data-field],[data-day]'))return;
        const productChange=e.target.dataset.field==='productId';
        sync(item,card);applyProduct(item,card,productChange);calculate(item,card);update();
      });
      card.addEventListener('change',e=>{
        if(!e.target.matches('[data-field],[data-day]'))return;
        const productChange=e.target.dataset.field==='productId';
        sync(item,card);applyProduct(item,card,productChange);calculate(item,card);update();
      });
      card.querySelector('[data-action=remove]').addEventListener('click',()=>{stack=stack.filter(x=>x.id!==item.id);render()});
      list.appendChild(frag);
    });
    translate();update();
  }

  function update(){
    $('stackCount').textContent=stack.length;
    $('summaryCompounds').textContent=stack.length;
    $('summaryMoments').textContent=stack.reduce((s,x)=>s+(x.days?.length||0),0);
  }
  function snapshot(){return{version:1,meta:{name:$('stackName').value,reference:$('stackReference').value,startDate:$('startDate').value,durationWeeks:$('durationWeeks').value,purpose:$('stackPurpose').value},stack}}
  function loadPendingDraft(){
    try{
      const raw=JSON.parse(sessionStorage.getItem(PENDING_KEY)||'null');
      if(raw){
        applySnapshot(raw);
        sessionStorage.removeItem(PENDING_KEY);
      }
    }catch(_){}
  }
  function add(){
    stack.push(fresh());render();
    requestAnimationFrame(()=>document.querySelector(`[data-id="${stack.at(-1).id}"]`)?.scrollIntoView({behavior:'smooth',block:'center'}));
  }
  function translate(){
    document.querySelectorAll('[data-i18n]').forEach(el=>{const k=el.dataset.i18n;if(copy[lang][k]!=null)el.textContent=copy[lang][k]});
    document.querySelectorAll('[data-day-label]').forEach(el=>el.textContent=copy[lang].daysShort[Number(el.dataset.dayLabel)]);
    document.querySelectorAll('.compound-card').forEach(card=>{const item=stack.find(x=>x.id===card.dataset.id);if(!item)return;fillSelect(card.querySelector('[data-field=productId]'),item);applyProduct(item,card,false);calculate(item,card)});
    const status=$('catalogueStatus');status.querySelector('span:last-child').textContent=products.length?t('catalogueLive'):t('catalogueFallback');
  }
  function setLang(next){
    lang=next==='en'?'en':'nl';localStorage.setItem(LANGKEY,lang);document.documentElement.lang=lang;
    document.querySelectorAll('[data-lang]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.lang===lang)));translate();
  }

  $('langSwitch').addEventListener('click',e=>{const b=e.target.closest('[data-lang]');if(b)setLang(b.dataset.lang)});
  $('addCompound').addEventListener('click',add);$('emptyAdd').addEventListener('click',add);
  $('clearStack').addEventListener('click',()=>{if(stack.length&&confirm(lang==='en'?'Clear this entire stack?':'Volledige stack wissen?')){stack=[];render();flash(t('cleared'))}});
  $('saveAccount').addEventListener('click',saveToAccount);
  $('printStack').addEventListener('click',()=>window.print());

  (async()=>{loadPendingDraft();await loadProducts();try{await loadCloudStack()}catch(err){setCloudStatus(err?.message||'Could not load saved stack.','error')}render();setLang(lang)})();
})();