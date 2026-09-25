(() => {
  const cfg=window.PURE20_SUPABASE_CONFIG||{};
  const client=window.supabase.createClient(cfg.url,cfg.key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
  const $=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const money=v=>`€${Number(v||0).toFixed(2)}`;
  const shortOrder=id=>`P20-${String(id||'').replace(/-/g,'').slice(0,8).toUpperCase()}`;
  const date=v=>new Intl.DateTimeFormat(document.documentElement.lang==='en'?'en-GB':'nl-BE',{dateStyle:'medium'}).format(new Date(v));
  const KEY='pure20_language';
  const REFKEY='pure20_pending_referral';
  const NEXTKEY='pure20_account_next';

  const copy={
    nl:{
      backShop:'Terug naar shop',accountTitle:'Je PURE20-account.',accountIntro:'Bekijk bestellingen, volg hun status en beheer je persoonlijke referral-link.',
      refActive:'Referral actief',refActiveText:'Na registratie krijg je automatisch 2% korting op retailbestellingen.',
      login:'Inloggen',register:'Registreren',email:'E-mail',password:'Wachtwoord',name:'Naam',createAccount:'Account aanmaken',
      welcome:'Welkom terug.',logout:'Uitloggen',orders:'Bestellingen',stacks:'Stacks',refer:'Referral',tracking:'Tracking',
      orderHistoryKicker:'ORDER HISTORY',yourOrders:'Jouw bestellingen.',orderHistoryText:'De status wordt aangepast zodra je bestelling verdergaat in het proces.',
      yourReferral:'JOUW REFERRAL',shareEarn:'Deel. Bouw krediet op.',refExplain:'Wie via jouw persoonlijke link registreert, krijgt standaard 2% korting. Zodra een referral-bestelling betaald is, ontvang jij 3% van de betaalde orderwaarde als krediet.',
      copy:'Kopieer',registrations:'Registraties',registrationHelp:'Bevestigde accounts die via jouw link geregistreerd zijn.',
      credit:'Beschikbaar krediet',creditHelp:'Kan in de winkelmand van een volgende retailbestelling worden gebruikt.',
      yourDiscount:'Jouw referral-korting',discountHelp:'Deze korting wordt automatisch toegepast wanneer je bent ingelogd.',
      stackKicker:'STACK BUILDER',savedStacks:'Jouw opgeslagen stacks.',savedStacksText:'Bewaar je eigen researchplanning in je account en open ze later opnieuw in de Stack Builder.',newStack:'Nieuwe stack maken ↗',openStack:'Openen',deleteStack:'Verwijderen',noStacks:'Nog geen stacks opgeslagen in je account.',compoundCount:'compounds',updated:'Bijgewerkt',trackPackage:'Volg een pakket.',trackHelp:'Voer een trackingcode in. De vervoerder wordt automatisch geprobeerd te herkennen.',track:'Track',
      noOrders:'Nog geen bestellingen gekoppeld aan dit account.',placed:'Geplaatst',accepted:'Aanvaard',paid:'Betaald',packed:'Verpakt',shipped:'Verzonden',delivered:'Geleverd',
      cancelled:'Geannuleerd',subtotal:'Subtotaal',discount:'Korting',creditUsed:'Krediet gebruikt',shipping:'Verzending',total:'Totaal',trackOrder:'Volg deze zending',
      msgs:{placed:'We hebben je bestelling ontvangen.',accepted:'Je bestelling is bevestigd.',paid:'Betaling ontvangen. Je bestelling wordt voorbereid.',packed:'Je bestelling is verpakt.',shipped:'Je pakket is verzonden.',delivered:'Je bestelling is geleverd.',cancelled:'Deze bestelling is geannuleerd.'}
    },
    en:{
      backShop:'Back to shop',accountTitle:'Your PURE20 account.',accountIntro:'View orders, follow their progress and manage your personal referral link.',
      refActive:'Referral active',refActiveText:'After registration you automatically receive 2% off retail orders.',
      login:'Sign in',register:'Register',email:'Email',password:'Password',name:'Name',createAccount:'Create account',
      welcome:'Welcome back.',logout:'Log out',orders:'Orders',stacks:'Stacks',refer:'Refer',tracking:'Tracking',
      orderHistoryKicker:'ORDER HISTORY',yourOrders:'Your orders.',orderHistoryText:'The status updates as your order moves through the process.',
      yourReferral:'YOUR REFERRAL',shareEarn:'Share. Build credit.',refExplain:'People who register through your personal link receive 2% off. Once a referral order is paid, you receive 3% of the paid order value as credit.',
      copy:'Copy',registrations:'Registrations',registrationHelp:'Confirmed accounts registered through your link.',
      credit:'Available credit',creditHelp:'Can be used in the cart on a future retail order.',
      yourDiscount:'Your referral discount',discountHelp:'This discount is automatically applied while you are signed in.',
      stackKicker:'STACK BUILDER',savedStacks:'Your saved stacks.',savedStacksText:'Save your own research plans to your account and reopen them later in the Stack Builder.',newStack:'Create new stack ↗',openStack:'Open',deleteStack:'Delete',noStacks:'No stacks have been saved to your account yet.',compoundCount:'compounds',updated:'Updated',trackPackage:'Track a package.',trackHelp:'Enter a tracking number. The carrier will be auto-detected where possible.',track:'Track',
      noOrders:'No orders are linked to this account yet.',placed:'Placed',accepted:'Accepted',paid:'Paid',packed:'Packed',shipped:'Shipped',delivered:'Delivered',
      cancelled:'Cancelled',subtotal:'Subtotal',discount:'Discount',creditUsed:'Credit used',shipping:'Shipping',total:'Total',trackOrder:'Track this shipment',
      msgs:{placed:'We received your order.',accepted:'Your order has been confirmed.',paid:'Payment received. Your order is being prepared.',packed:'Your order has been packed.',shipped:'Your package has shipped.',delivered:'Your order has been delivered.',cancelled:'This order has been cancelled.'}
    }
  };

  let lang=localStorage.getItem(KEY)==='en'?'en':'nl';
  let accountData=null;
  let trackingReady=null;
  let savedStacks=[];

  function t(k){return copy[lang][k]??k}
  function applyLanguage(next){
    lang=next==='en'?'en':'nl';
    localStorage.setItem(KEY,lang);
    document.documentElement.lang=lang;
    document.querySelectorAll('[data-i18n]').forEach(el=>{
      const key=el.dataset.i18n;if(copy[lang][key]!=null)el.textContent=copy[lang][key];
    });
    document.querySelectorAll('[data-lang]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.lang===lang)));
    if(accountData)renderAccount(accountData);
    renderStacks();
  }
  document.querySelectorAll('[data-lang]').forEach(b=>b.addEventListener('click',()=>applyLanguage(b.dataset.lang)));

  function toast(msg){const el=$('toast');el.textContent=msg;el.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove('show'),1800)}

  const incomingRef=(new URLSearchParams(location.search).get('ref')||'').trim().toUpperCase();
  if(incomingRef)localStorage.setItem(REFKEY,incomingRef);
  const pendingRef=()=>localStorage.getItem(REFKEY)||'';
  if(pendingRef())$('referralNotice').hidden=false;

  const requestedNext=(new URLSearchParams(location.search).get('next')||'').trim();
  if(requestedNext.startsWith('/')&&!requestedNext.startsWith('//'))localStorage.setItem(NEXTKEY,requestedNext);
  const consumeNext=()=>{const next=localStorage.getItem(NEXTKEY)||'';if(next)localStorage.removeItem(NEXTKEY);return next};

  document.querySelectorAll('[data-auth-view]').forEach(btn=>btn.addEventListener('click',()=>{
    document.querySelectorAll('[data-auth-view]').forEach(x=>x.classList.toggle('active',x===btn));
    document.querySelectorAll('.auth-view').forEach(v=>v.classList.toggle('active',v.id===`auth${btn.dataset.authView[0].toUpperCase()+btn.dataset.authView.slice(1)}`));
    $('authMessage').textContent='';$('authMessage').classList.remove('success');
  }));

  async function login(){
    const button=$('loginButton');$('authMessage').textContent='';button.disabled=true;
    try{
      const {data,error}=await client.auth.signInWithPassword({email:$('loginEmail').value.trim(),password:$('loginPassword').value});
      if(error)throw error;
      if(data.session)await enter();
    }catch(err){$('authMessage').textContent=err.message||'Sign in failed.'}
    finally{button.disabled=false}
  }

  async function register(){
    const button=$('registerButton');$('authMessage').textContent='';$('authMessage').classList.remove('success');
    const email=$('registerEmail').value.trim(),password=$('registerPassword').value,name=$('registerName').value.trim();
    if(!email||password.length<8){$('authMessage').textContent=lang==='en'?'Enter a valid email and a password of at least 8 characters.':'Vul een geldig e-mailadres en een wachtwoord van minstens 8 tekens in.';return}
    button.disabled=true;
    try{
      const {data,error}=await client.auth.signUp({email,password,options:{data:{full_name:name,referral_code:pendingRef()}}});
      if(error)throw error;
      localStorage.removeItem(REFKEY);
      if(data.session){await enter()}
      else{
        $('authMessage').classList.add('success');
        $('authMessage').textContent=lang==='en'?'Account created. Check your email to confirm your account.':'Account aangemaakt. Controleer je e-mail om je account te bevestigen.';
      }
    }catch(err){$('authMessage').textContent=err.message||'Registration failed.'}
    finally{button.disabled=false}
  }

  $('loginButton').addEventListener('click',login);
  $('loginPassword').addEventListener('keydown',e=>{if(e.key==='Enter')login()});
  $('registerButton').addEventListener('click',register);
  $('registerPassword').addEventListener('keydown',e=>{if(e.key==='Enter')register()});

  const STATUS=['placed','accepted','paid','packed','shipped','delivered'];

  function itemRows(order){
    const items=Array.isArray(order.items)?order.items:[];
    return items.map(i=>{
      const q=Number(i.quantity||1);
      const name=i.variant?`${i.name||'Item'} ${i.variant}`:(i.name||'Item');
      const total=Number(i.line_total||0);
      return `<div class="order-item"><span>${q}× ${esc(name)}</span><span>${total?money(total):''}</span></div>`;
    }).join('');
  }

  function orderCard(o){
    const cancelled=o.status==='cancelled';
    const idx=STATUS.indexOf(o.status);
    const message=o.status_note||copy[lang].msgs[o.status]||'';
    const segments=STATUS.map((s,i)=>`<span class="progress-segment ${!cancelled&&i<idx?'done':''} ${!cancelled&&i===idx?'current':''}"></span>`).join('');
    const labels=STATUS.map((s,i)=>`<span class="${!cancelled&&i<=idx?'active':''}">${esc(t(s))}</span>`).join('');
    return `<article class="order-card ${cancelled?'cancelled':''}" data-order="${esc(o.id)}">
      <div class="order-head">
        <div><div class="order-code">${shortOrder(o.id)}</div><div class="order-meta">${date(o.created_at)} · ${esc(o.channel||'retail')}</div></div>
        <div class="order-total"><span>${t('total')}</span><strong>${money(o.total_eur)}</strong></div>
      </div>
      ${cancelled?`<div class="status-message">${esc(message)}</div>`:`
        <div class="progress">${segments}</div>
        <div class="progress-labels">${labels}</div>
        <div class="status-message">${esc(message)}</div>`}
      <div class="order-body">
        <div><div class="order-items-title">${lang==='en'?'IN THIS ORDER':'IN DEZE BESTELLING'}</div>${itemRows(o)||'—'}</div>
        <aside class="order-summary">
          <div class="summary-row"><span>${t('subtotal')}</span><strong>${money(o.subtotal_eur)}</strong></div>
          ${Number(o.discount_eur||0)>0?`<div class="summary-row"><span>${t('discount')}</span><strong>-${money(o.discount_eur)}</strong></div>`:''}
          ${Number(o.credit_used_eur||0)>0?`<div class="summary-row"><span>${t('creditUsed')}</span><strong>-${money(o.credit_used_eur)}</strong></div>`:''}
          <div class="summary-row"><span>${t('shipping')}</span><strong>${money(o.shipping_eur)}</strong></div>
          <div class="summary-row total"><span>${t('total')}</span><strong>${money(o.total_eur)}</strong></div>
          ${o.tracking_number?`<div class="order-track"><button type="button" data-track="${esc(o.tracking_number)}">${t('trackOrder')} · ${esc(o.tracking_number)}</button></div>`:''}
        </aside>
      </div>
    </article>`;
  }

  function renderStacks(){
    const host=$('savedStacksList');
    if(!host)return;
    host.innerHTML=savedStacks.length?savedStacks.map((row,index)=>{
      const payload=row.data&&typeof row.data==='object'?row.data:{};
      const count=Array.isArray(payload.stack)?payload.stack.length:0;
      const title=row.title||payload.meta?.name||(lang==='en'?'Untitled stack':'Naamloze stack');
      return `<article class="saved-stack-card" data-stack-id="${esc(row.id)}">
        <div class="saved-stack-top"><span class="saved-stack-num">${String(index+1).padStart(2,'0')}</span><span class="saved-stack-meta">${esc(t('updated'))} ${date(row.updated_at)}</span></div>
        <h3>${esc(title)}</h3>
        <div class="saved-stack-meta">${count} ${esc(t('compoundCount'))}${payload.meta?.durationWeeks?` · ${esc(payload.meta.durationWeeks)} ${lang==='en'?'weeks':'weken'}`:''}</div>
        <div class="saved-stack-actions">
          <a href="/stack-builder?stack=${encodeURIComponent(row.id)}">${esc(t('openStack'))} ↗</a>
          <button type="button" data-delete-stack="${esc(row.id)}">${esc(t('deleteStack'))}</button>
        </div>
      </article>`;
    }).join(''):`<div class="stack-empty">${esc(t('noStacks'))}</div>`;
  }

  async function loadStacks(){
    const {data,error}=await client.from('pure20_saved_stacks').select('id,title,data,created_at,updated_at').order('updated_at',{ascending:false});
    if(error)throw error;
    savedStacks=data||[];
    renderStacks();
  }

  function renderAccount(data){
    accountData=data;
    const c=data.customer||{};
    $('customerName').textContent=c.name||'';
    $('customerEmail').textContent=c.email||'';
    $('referralCount').textContent=Number(data.referral_count||0);
    $('creditBalance').textContent=money(data.credit_balance_eur||0);
    const link=`${location.origin}/account?ref=${encodeURIComponent(c.referral_code||'')}`;
    $('referralLink').value=link;
    const pct=Number(c.referral_discount_pct||0);
    $('memberDiscountCard').hidden=pct<=0;
    $('memberDiscount').textContent=`${pct}%`;
    const orders=Array.isArray(data.orders)?data.orders:[];
    $('ordersList').innerHTML=orders.length?orders.map(orderCard).join(''):`<div class="empty">${t('noOrders')}</div>`;
  }

  async function loadAccount(){
    const {data,error}=await client.rpc('pure20_account_data');
    if(error)throw error;
    renderAccount(data||{});
  }

  async function enter(){
    $('authGate').style.display='none';
    $('accountMain').hidden=false;
    await Promise.all([loadAccount(),loadStacks()]);
    const next=consumeNext();
    if(next&&next!=='/account'&&!next.startsWith('/account?'))location.href=next;
  }

  $('signOut').addEventListener('click',async()=>{await client.auth.signOut();location.reload()});
  $('copyReferral').addEventListener('click',async()=>{
    try{await navigator.clipboard.writeText($('referralLink').value);toast(lang==='en'?'Referral link copied.':'Referral-link gekopieerd.')}
    catch(_){$('referralLink').select();document.execCommand('copy');toast(lang==='en'?'Referral link copied.':'Referral-link gekopieerd.')}
  });

  document.querySelectorAll('.account-tab').forEach(btn=>btn.addEventListener('click',()=>{
    document.querySelectorAll('.account-tab').forEach(x=>x.classList.toggle('active',x===btn));
    document.querySelectorAll('.view').forEach(v=>v.classList.toggle('active',v.id===`view-${btn.dataset.view}`));
  }));

  document.addEventListener('click',async e=>{
    const btn=e.target.closest('[data-delete-stack]');
    if(!btn)return;
    const id=btn.dataset.deleteStack;
    if(!confirm(lang==='en'?'Delete this saved stack?':'Deze opgeslagen stack verwijderen?'))return;
    btn.disabled=true;
    const {error}=await client.from('pure20_saved_stacks').delete().eq('id',id);
    if(error){btn.disabled=false;toast(error.message);return}
    await loadStacks();
    toast(lang==='en'?'Stack deleted.':'Stack verwijderd.');
  });

  const requestedView=(new URLSearchParams(location.search).get('view')||'').trim();
  if(['orders','stacks','refer','tracking'].includes(requestedView)){
    document.querySelector(`[data-view="${requestedView}"]`)?.click();
  }

  function loadTrackingScript(){
    if(trackingReady)return trackingReady;
    trackingReady=new Promise((resolve,reject)=>{
      if(window.YQV5)return resolve();
      const s=document.createElement('script');
      s.src='https://www.17track.net/externalcall.js';
      s.async=true;
      s.onload=()=>resolve();
      s.onerror=()=>reject(new Error('Tracking service could not be loaded.'));
      document.head.appendChild(s);
    });
    return trackingReady;
  }

  async function track(code){
    code=String(code||'').trim();
    if(!code)return;
    $('trackingInput').value=code;
    document.querySelector('[data-view="tracking"]').click();
    try{
      await loadTrackingScript();
      if(!window.YQV5?.trackSingle)throw new Error('Tracking service unavailable.');
      $('YQContainer').innerHTML='';
      window.YQV5.trackSingle({
        YQ_ContainerId:'YQContainer',
        YQ_Height:560,
        YQ_Fc:'0',
        YQ_Lang:lang,
        YQ_Num:code
      });
      setTimeout(()=>$('YQContainer').scrollIntoView({behavior:'smooth',block:'start'}),120);
    }catch(err){toast(err.message||'Tracking unavailable.')}
  }
  $('trackButton').addEventListener('click',()=>track($('trackingInput').value));
  $('trackingInput').addEventListener('keydown',e=>{if(e.key==='Enter')track(e.target.value)});
  document.addEventListener('click',e=>{const b=e.target.closest('[data-track]');if(b)track(b.dataset.track)});

  applyLanguage(lang);

  (async()=>{
    const {data:{session}}=await client.auth.getSession();
    if(session){
      try{await enter()}catch(err){$('authGate').style.display='grid';$('accountMain').hidden=true;$('authMessage').textContent=err.message||'Could not load account.'}
    }
  })();
})();
