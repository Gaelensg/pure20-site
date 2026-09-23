(async()=>{
  const cfg=window.PURE20_SUPABASE_CONFIG||{};
  const client=window.supabase.createClient(cfg.url,cfg.key,{auth:{persistSession:true,autoRefreshToken:true}});
  const $=id=>document.getElementById(id);
  const E={
    gate:$('loginGate'),email:$('loginEmail'),pass:$('loginPassword'),login:$('loginButton'),err:$('loginError'),signOut:$('signOut'),
    statOrders:$('statOrders'),statRevenue:$('statRevenue'),statCustomers:$('statCustomers'),statAverage:$('statAverage'),
    recent:$('recentOrders'),popular:$('popularProducts'),channels:$('channelStats'),orders:$('ordersList'),customers:$('customersList'),
    orderSearch:$('orderSearch'),orderChannel:$('orderChannel'),orderStatus:$('orderStatus'),customerSearch:$('customerSearch')
  };
  let orders=[],customers=[];
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
    const [o,c]=await Promise.all([
      client.from('pure20_orders').select('*').order('created_at',{ascending:false}).limit(1000),
      client.from('pure20_customers').select('*').order('updated_at',{ascending:false}).limit(1000)
    ]);
    if(o.error)throw o.error;if(c.error)throw c.error;
    orders=o.data||[];customers=c.data||[];
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
          ${['new','processing','completed','cancelled'].map(s=>`<option value="${s}" ${s===o.status?'selected':''}>${s[0].toUpperCase()+s.slice(1)}</option>`).join('')}
        </select>
        <button class="save-btn" data-save-order type="button">Save status</button>
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
      </article>`;
    }).join(''):'<div class="empty">No customers yet.</div>';
  }

  function renderAll(){renderStats();renderOrders();renderPopular();renderCustomers()}

  document.querySelectorAll('.subtab').forEach(b=>b.addEventListener('click',()=>{
    document.querySelectorAll('.subtab').forEach(x=>x.classList.toggle('active',x===b));
    document.querySelectorAll('.view').forEach(v=>v.classList.toggle('active',v.id===`view-${b.dataset.view}`));
  }));

  [E.orderSearch,E.orderChannel,E.orderStatus].forEach(x=>x.addEventListener('input',renderOrders));
  E.customerSearch.addEventListener('input',renderCustomers);

  async function saveOrder(button){
    const card=button.closest('[data-order]'),id=card.dataset.order,status=card.querySelector('[data-order-status]').value;
    button.disabled=true;
    const {error}=await client.from('pure20_orders').update({status}).eq('id',id);
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
  });

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