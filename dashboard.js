(async()=>{
  const cfg=window.PURE20_SUPABASE_CONFIG||{};
  const client=window.supabase.createClient(cfg.url,cfg.key,{auth:{persistSession:true,autoRefreshToken:true}});
  const $=id=>document.getElementById(id);
  const E={
    gate:$('loginGate'),email:$('loginEmail'),pass:$('loginPassword'),login:$('loginButton'),err:$('loginError'),signOut:$('signOut'),
    statOrders:$('statOrders'),statRevenue:$('statRevenue'),statCustomers:$('statCustomers'),statAverage:$('statAverage'),
    recent:$('recentOrders'),popular:$('popularProducts'),channels:$('channelStats'),orders:$('ordersList'),customers:$('customersList'),
    orderSearch:$('orderSearch'),orderChannel:$('orderChannel'),orderStatus:$('orderStatus'),customerSearch:$('customerSearch'),planSearch:$('planSearch'),plansList:$('plansList'),planModal:$('planModal'),planModalBackdrop:$('planModalBackdrop'),closePlanModal:$('closePlanModal'),cancelPlan:$('cancelPlan'),sendPlan:$('sendPlan'),addPlanItem:$('addPlanItem'),planItems:$('planItems'),planCustomerId:$('planCustomerId'),planRecipient:$('planRecipient'),planTitle:$('planTitle'),planGoal:$('planGoal'),planGeneralNote:$('planGeneralNote'),planSourceReference:$('planSourceReference')
  };
  let orders=[],customers=[],plans=[];
  let planItemSeq=0;
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const money=v=>`€${Number(v||0).toFixed(2)}`;
  const date=v=>new Intl.DateTimeFormat('nl-BE',{dateStyle:'short',timeStyle:'short'}).format(new Date(v));

  async function isAdmin(){
    const {data,error}=await client.rpc('is_pure20_admin');
    if(error)throw error;
    if(data!==true)throw new Error('This account is not a PURE20 administrator.');
  }

  async function load(){
    await isAdmin();
    const [o,c,p]=await Promise.all([
      client.from('pure20_orders').select('*').order('created_at',{ascending:false}).limit(1000),
      client.from('pure20_customers').select('*').order('updated_at',{ascending:false}).limit(1000),
      client.from('pure20_customer_plans').select('*').order('sent_at',{ascending:false}).limit(1000)
    ]);
    if(o.error)throw o.error;if(c.error)throw c.error;if(p.error)throw p.error;
    orders=o.data||[];customers=c.data||[];plans=p.data||[];
    renderAll();
  }

  function liveOrders(){return orders.filter(o=>o.status!=='cancelled')}
  function renderStats(){
    const live=liveOrders(),value=live.reduce((s,o)=>s+Number(o.total_eur||0),0);
    E.statOrders.textContent=orders.length;
    E.statRevenue.textContent=money(value);
    E.statCustomers.textContent=customers.length;
    E.statAverage.textContent=money(live.length?value/live.length:0);
  }

  function itemsHtml(o){
    const items=Array.isArray(o.items)?o.items:[];
    return items.map(i=>`${esc(i.quantity||1)} × ${esc(i.name||'Item')} <span style="color:#888">${esc(i.meta||'')}</span>`).join('<br>');
  }

  function orderCard(o){
    const who=o.company||o.customer_name||o.customer_email||'Unknown customer';
    return `<article class="order-card" data-order="${o.id}">
      <div class="order-head">
        <div>
          <div class="order-id">${esc(o.channel)} · ${date(o.created_at)} · ${esc(o.source)}</div>
          <div class="order-name">${esc(who)}</div>
          <div class="order-meta">${esc(o.customer_email||'')} ${o.coupon_code?`· coupon ${esc(o.coupon_code)}`:''}</div>
        </div>
        <div class="order-total">${money(o.total_eur)}</div>
      </div>
      <div class="order-items">${itemsHtml(o)||'No item snapshot'}</div>
      <div class="order-actions">
        <select data-order-status>
          ${['placed','accepted','paid','packed','shipped','delivered','cancelled'].map(s=>`<option value="${s}" ${s===o.status?'selected':''}>${s[0].toUpperCase()+s.slice(1)}</option>`).join('')}
        </select>
        <input data-tracking-number value="${esc(o.tracking_number||'')}" placeholder="Tracking number">
        <input data-tracking-carrier value="${esc(o.tracking_carrier||'')}" placeholder="Carrier">
        <input data-status-note value="${esc(o.status_note||'')}" placeholder="Customer status message">
        <button class="save-btn" data-save-order type="button">Save order</button>
      </div>
    </article>`;
  }

  function filteredOrders(){
    const q=E.orderSearch.value.trim().toLowerCase(),channel=E.orderChannel.value,status=E.orderStatus.value;
    return orders.filter(o=>{
      const itemText=(Array.isArray(o.items)?o.items:[]).map(i=>`${i.name||''} ${i.meta||''}`).join(' ');
      const hay=`${o.customer_name} ${o.customer_email} ${o.company} ${itemText}`.toLowerCase();
      return(!q||hay.includes(q))&&(channel==='all'||o.channel===channel)&&(status==='all'||o.status===status);
    });
  }

  function renderOrders(){
    const rows=filteredOrders();
    E.orders.innerHTML=rows.length?rows.map(orderCard).join(''):'<div class="empty">No orders match these filters.</div>';
    E.recent.innerHTML=orders.slice(0,5).map(orderCard).join('')||'<div class="empty">No orders yet.</div>';
  }

  function renderPopular(){
    const m=new Map();
    liveOrders().forEach(o=>(Array.isArray(o.items)?o.items:[]).forEach(i=>{
      const name=i.name||'Unknown item',q=Number(i.quantity||1);
      m.set(name,(m.get(name)||0)+q);
    }));
    const rows=[...m.entries()].sort((a,b)=>b[1]-a[1]).slice(0,10);
    E.popular.innerHTML=rows.length?rows.map(([n,q])=>`<div class="popular-row"><span>${esc(n)}</span><strong>${q}</strong></div>`).join(''):'<div class="empty">No order data yet.</div>';

    const retail=orders.filter(o=>o.channel==='retail').length,wholesale=orders.filter(o=>o.channel==='wholesale').length;
    E.channels.innerHTML=`<div class="popular-row"><span>Retail</span><strong>${retail}</strong></div><div class="popular-row"><span>Wholesale</span><strong>${wholesale}</strong></div>`;
  }

  function customerMetrics(c){
    const list=orders.filter(o=>o.customer_id===c.id&&o.status!=='cancelled');
    return{count:list.length,total:list.reduce((s,o)=>s+Number(o.total_eur||0),0)};
  }

  function filteredCustomers(){
    const q=E.customerSearch.value.trim().toLowerCase();
    return customers.filter(c=>!q||`${c.name} ${c.company} ${c.email} ${c.phone}`.toLowerCase().includes(q));
  }

  function renderCustomers(){
    const rows=filteredCustomers();
    E.customers.innerHTML=rows.length?rows.map(c=>{
      const m=customerMetrics(c);
      return `<article class="customer-card" data-customer="${c.id}">
        <div class="customer-head">
          <div>
            <div class="customer-name">${esc(c.company||c.name||c.email||'Customer')}</div>
            <div class="customer-meta">${esc(c.name||'')} ${c.email?`· ${esc(c.email)}`:''}<br>${esc(c.phone||'')} ${c.country?`· ${esc(c.country)}`:''}</div>
          </div>
          <div style="text-align:right"><strong>${m.count} orders</strong><div class="customer-meta">${money(m.total)}</div></div>
        </div>
        <div class="customer-edit">
          <select data-customer-status>
            ${['active','vip','inactive'].map(s=>`<option value="${s}" ${s===c.status?'selected':''}>${s.toUpperCase()}</option>`).join('')}
          </select>
          <textarea data-customer-notes placeholder="Notes">${esc(c.notes||'')}</textarea>
          <button class="save-btn" data-save-customer type="button">Save</button>
        </div>
        <div class="customer-plan-row">
          <button class="send-plan-btn" data-send-plan="${c.id}" type="button" ${c.auth_user_id?'':'disabled'} title="${c.auth_user_id?'Send shared plan':'Customer must create an account first'}">
            ${c.auth_user_id?'Send plan':'No account yet'}
          </button>
        </div>
      </article>`;
    }).join(''):'<div class="empty">No customers yet.</div>';
  }

  function customerLabel(id){
    const c=customers.find(x=>x.id===id);
    return c?.company||c?.name||c?.email||'Customer';
  }

  function renderPlans(){
    if(!E.plansList)return;
    const q=(E.planSearch?.value||'').trim().toLowerCase();
    const rows=plans.filter(p=>!q||`${p.title||''} ${customerLabel(p.customer_id)}`.toLowerCase().includes(q));
    E.plansList.innerHTML=rows.length?rows.map(p=>{
      const items=Array.isArray(p.items)?p.items:[];
      return `<article class="plan-admin-card" data-plan="${p.id}">
        <div class="plan-admin-head">
          <div>
            <div class="order-id">${date(p.sent_at||p.created_at)} · ${esc(customerLabel(p.customer_id))}</div>
            <div class="plan-admin-title">${esc(p.title||'Plan')}</div>
            <div class="plan-admin-meta">${p.viewed_at?`Viewed ${date(p.viewed_at)}`:'Not viewed yet'}</div>
          </div>
          <span class="plan-admin-status">${esc(p.status||'sent')}</span>
        </div>
        ${p.goal?`<div class="order-meta" style="margin-top:10px">${esc(p.goal)}</div>`:''}
        <div class="plan-admin-items">${items.map((i,idx)=>`${idx+1}. <strong>${esc(i.compound||'Compound')}</strong>${i.amount?` · ${esc(i.amount)}`:''}${i.frequency?` · ${esc(i.frequency)}`:''}`).join('<br>')}</div>
        ${p.status!=='archived'?`<div class="plan-admin-actions"><button class="send-plan-btn" data-archive-plan="${p.id}" type="button">Archive</button></div>`:''}
      </article>`;
    }).join(''):'<div class="empty">No shared plans match.</div>';
  }

  function addPlanItem(data={}){
    const id=++planItemSeq;
    const row=document.createElement('div');
    row.className='admin-plan-item';
    row.dataset.planItem=id;
    row.innerHTML=`
      <div class="admin-plan-item-head"><strong>Compound ${id}</strong><button type="button" data-remove-plan-item>×</button></div>
      <div class="admin-plan-grid">
        <input data-pf="compound" placeholder="Compound / peptide" value="${esc(data.compound||'')}">
        <input data-pf="amount" placeholder="Amount / dose" value="${esc(data.amount||'')}">
        <input data-pf="frequency" placeholder="Frequency" value="${esc(data.frequency||'')}">
        <input data-pf="timing" placeholder="Timing" value="${esc(data.timing||'')}">
        <input data-pf="route" placeholder="Route" value="${esc(data.route||'')}">
        <input data-pf="duration" placeholder="Duration" value="${esc(data.duration||'')}">
        <textarea data-pf="note" rows="2" placeholder="Compound-specific note">${esc(data.note||'')}</textarea>
      </div>`;
    E.planItems.appendChild(row);
  }

  function openPlanModal(customerId){
    const c=customers.find(x=>x.id===customerId);
    if(!c||!c.auth_user_id)return alert('Customer must create an account first.');
    E.planCustomerId.value=customerId;
    E.planRecipient.textContent=`Recipient: ${c.company||c.name||c.email||customerId}`;
    E.planTitle.value='';
    E.planGoal.value='';
    E.planGeneralNote.value='';
    E.planSourceReference.value='';
    E.planItems.innerHTML='';
    planItemSeq=0;
    addPlanItem();
    E.planModalBackdrop.hidden=false;
    requestAnimationFrame(()=>E.planModal.classList.add('open'));
    E.planModal.setAttribute('aria-hidden','false');
  }

  function closePlanModal(){
    E.planModal.classList.remove('open');
    E.planModal.setAttribute('aria-hidden','true');
    setTimeout(()=>E.planModalBackdrop.hidden=true,220);
  }

  function collectPlanItems(){
    return [...E.planItems.querySelectorAll('.admin-plan-item')].map(row=>{
      const get=k=>row.querySelector(`[data-pf="${k}"]`)?.value.trim()||'';
      return {
        compound:get('compound'),
        amount:get('amount'),
        frequency:get('frequency'),
        timing:get('timing'),
        route:get('route'),
        duration:get('duration'),
        note:get('note')
      };
    }).filter(x=>x.compound);
  }

  async function sendPlan(){
    const customerId=E.planCustomerId.value;
    const title=E.planTitle.value.trim();
    const items=collectPlanItems();
    if(!title)return alert('Add a plan title.');
    if(!items.length)return alert('Add at least one compound.');
    E.sendPlan.disabled=true;
    const {data,error}=await client.rpc('pure20_admin_send_customer_plan',{
      p_customer_id:customerId,
      p_title:title,
      p_goal:E.planGoal.value.trim(),
      p_items:items,
      p_general_note:E.planGeneralNote.value.trim(),
      p_source_reference:E.planSourceReference.value.trim()
    });
    E.sendPlan.disabled=false;
    if(error)return alert(error.message);
    closePlanModal();
    await load();
    document.querySelector('[data-view="plans"]')?.click();
  }

  async function archivePlan(id){
    if(!confirm('Archive this shared plan?'))return;
    const {error}=await client.rpc('pure20_admin_archive_customer_plan',{p_plan_id:id});
    if(error)return alert(error.message);
    await load();
  }

  function renderAll(){renderStats();renderOrders();renderPopular();renderCustomers();renderPlans()}

  document.querySelectorAll('.subtab').forEach(b=>b.addEventListener('click',()=>{
    document.querySelectorAll('.subtab').forEach(x=>x.classList.toggle('active',x===b));
    document.querySelectorAll('.view').forEach(v=>v.classList.toggle('active',v.id===`view-${b.dataset.view}`));
  }));

  [E.orderSearch,E.orderChannel,E.orderStatus].forEach(x=>x.addEventListener('input',renderOrders));
  E.customerSearch.addEventListener('input',renderCustomers);
  E.planSearch?.addEventListener('input',renderPlans);

  async function saveOrder(button){
    const card=button.closest('[data-order]'),id=card.dataset.order,status=card.querySelector('[data-order-status]').value;
    const tracking_number=card.querySelector('[data-tracking-number]').value.trim();
    const tracking_carrier=card.querySelector('[data-tracking-carrier]').value.trim();
    const status_note=card.querySelector('[data-status-note]').value.trim();
    button.disabled=true;
    const {error}=await client.from('pure20_orders').update({status,tracking_number,tracking_carrier,status_note}).eq('id',id);
    button.disabled=false;
    if(error)return alert(error.message);
    await load();
  }

  async function saveCustomer(button){
    const card=button.closest('[data-customer]'),id=card.dataset.customer;
    const status=card.querySelector('[data-customer-status]').value,notes=card.querySelector('[data-customer-notes]').value;
    button.disabled=true;
    const {error}=await client.from('pure20_customers').update({status,notes}).eq('id',id);
    button.disabled=false;
    if(error)return alert(error.message);
    await load();
  }

  document.addEventListener('click',e=>{
    const ob=e.target.closest('[data-save-order]');if(ob)saveOrder(ob);
    const cb=e.target.closest('[data-save-customer]');if(cb)saveCustomer(cb);
    const sp=e.target.closest('[data-send-plan]');if(sp&&!sp.disabled)openPlanModal(sp.dataset.sendPlan);
    const rp=e.target.closest('[data-remove-plan-item]');if(rp)rp.closest('.admin-plan-item')?.remove();
    const ap=e.target.closest('[data-archive-plan]');if(ap)archivePlan(ap.dataset.archivePlan);
  });

  E.addPlanItem?.addEventListener('click',()=>addPlanItem());
  E.closePlanModal?.addEventListener('click',closePlanModal);
  E.cancelPlan?.addEventListener('click',closePlanModal);
  E.planModalBackdrop?.addEventListener('click',closePlanModal);
  E.sendPlan?.addEventListener('click',sendPlan);

  E.login.addEventListener('click',async()=>{
    E.err.textContent='';
    try{
      const {data,error}=await client.auth.signInWithPassword({email:E.email.value.trim(),password:E.pass.value});
      if(error)throw error;
      await isAdmin();
      E.gate.style.display='none';
      await load();
    }catch(err){E.err.textContent=err.message||'Sign in failed.'}
  });

  E.signOut.addEventListener('click',async()=>{await client.auth.signOut();location.reload()});

  const {data:{session}}=await client.auth.getSession();
  if(session){
    try{await isAdmin();E.gate.style.display='none';await load()}
    catch(err){await client.auth.signOut();E.err.textContent=err.message}
  }
})();