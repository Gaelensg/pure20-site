/* PURE20 Supplier Sync v1 — INSERT only, isolated from the existing admin save flow. */
(() => {
  'use strict';
  const core = window.PURE20_SUPPLIER_SYNC;
  const $ = id => document.getElementById(id);
  const panel = $('panel-supplier-sync');
  if (!panel || !core) return;
  const state = { preview: null, selected: new Set(), busy: false };
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const client = () => window.PURE20_API?.client;
  function message(value, error = false) { $('ss-message').textContent = value; $('ss-message').classList.toggle('ss-error', error); }
  function dirty() { return Boolean(document.querySelector('#productsBody .p20-inline-dirty, #productsBody .p20-inline-saving, body.saving')); }
  async function authorize() {
    if (!window.PURE20_API?.configured || !client()) throw new Error('Supplier Sync vereist een live Supabase-verbinding.');
    if (!await window.PURE20_API.isAdmin()) throw new Error('Meld je aan met een bevoegd PURE20-adminaccount.');
  }
  // Count + stable ordering: never compare against a silently truncated catalogue.
  async function readAll(table, columns, orders, filters = []) {
    const rows = []; let total;
    for (;;) {
      let query = client().from(table).select(columns, { count: 'exact' });
      for (const [field, value] of filters) query = query.eq(field, value);
      for (const field of orders) query = query.order(field, { ascending: true });
      const { data, count, error } = await query.range(rows.length, rows.length + 499);
      if (error) throw error;
      if (!Array.isArray(data) || !Number.isInteger(count)) throw new Error('Volledigheid van de catalogus kon niet gecontroleerd worden.');
      if (total !== undefined && count !== total) throw new Error('De catalogus veranderde tijdens het laden. Vernieuw de preview.');
      total = count;
      rows.push(...data);
      if (rows.length === total) return rows;
      if (!data.length || rows.length > total) throw new Error('Onvolledige catalogus; toevoegen is geblokkeerd.');
    }
  }
  async function snapshot() {
    await authorize();
    const [products, catalogue, suppliers] = await Promise.all([
      readAll('pure20_products', 'id,product_name,variant,code,category,active,sort_order', ['id']),
      readAll('pure20_supplier_catalogue', 'supplier_key,category,code,product_name,specification,unit_label,active', ['supplier_key', 'category', 'code'], [['category', 'peptides'], ['active', true]]),
      readAll('pure20_suppliers', 'supplier_key,name,sort_order,active', ['supplier_key'], [['active', true]])
    ]);
    if (new Set(products.map(p => p.id)).size !== products.length) throw new Error('Catalogus veranderde tijdens het laden; vernieuw de preview.');
    return { ...core.preview(products, catalogue, suppliers), maxSortOrder: Math.max(0, ...products.map(p => Number(p.sort_order) || 0)) };
  }
  function visibleRows() {
    const query = $('ss-search').value.trim().toLowerCase(), status = $('ss-filter').value;
    return (state.preview?.rows || []).filter(row => (!status || status === row.status) && (!query || `${row.name} ${row.variant} ${row.sources.map(s => `${s.supplier} ${s.code}`).join(' ')}`.toLowerCase().includes(query)));
  }
  function controls() {
    $('ss-add').disabled = state.busy || !state.selected.size;
    $('ss-add').textContent = state.busy ? 'Bezig…' : `Geselecteerde regels toevoegen (${state.selected.size})`;
    for (const id of ['ss-refresh', 'ss-select', 'ss-clear']) $(id).disabled = state.busy;
    panel.setAttribute('aria-busy', String(state.busy));
  }
  function render() {
    const preview = state.preview;
    $('ss-counts').innerHTML = preview ? Object.entries(preview.counts).map(([status, count]) => `<div><strong>${count}</strong><span>${esc(status)}</span></div>`).join('') : '';
    $('ss-summary').textContent = preview ? `${preview.retailCount} retailregels gecontroleerd · ${preview.sourceCount} supplierregels (peptides) · ${preview.mergedCount} dubbele supplierregels samengevoegd · ${preview.rows.length} unieke kandidaten` : 'Laad de preview om je volledige retailcatalogus te vergelijken.';
    const rows = visibleRows();
    $('ss-rows').innerHTML = rows.map(row => `<article class="ss-row">
      <label class="ss-choice"><input type="checkbox" data-ss-key="${esc(row.key)}" ${state.selected.has(row.key) ? 'checked' : ''} ${!row.payload || state.busy ? 'disabled' : ''} aria-label="Selecteer ${esc(row.name)} ${esc(row.variant)}"><span><strong>${esc(row.name)}</strong><span class="ss-variant">${esc(row.variant)}</span></span></label>
      <div><span class="ss-badge ${row.status === 'Controleren' ? 'ss-review' : ''}">${esc(row.status)}</span><p>${esc(row.reason)}</p>${row.payload ? `<p>Categorie: ${esc(row.payload.category)} · code: <strong>${esc(row.payload.code)}</strong> · verborgen · €0 · voorraad 0</p>` : ''}</div>
      <div class="ss-sources">${row.sources.map(s => `<div><strong>${esc(s.supplier)}</strong> · ${esc(s.code)}<br>${esc(s.product_name)} · ${esc(s.specification)}</div>`).join('')}</div>
    </article>`).join('') || '<p class="ss-empty">Geen regels voor deze selectie.</p>';
    controls();
  }
  async function refresh() {
    if (state.busy) return;
    state.busy = true; state.selected.clear(); render(); message('Volledige catalogi laden…');
    try { state.preview = await snapshot(); message('Preview klaar. Selecteer de gewenste nieuwe regels.'); }
    catch (error) { state.preview = null; message(`Laden mislukt: ${error.message || error}`, true); }
    finally { state.busy = false; render(); }
  }
  async function rowId(key) {
    // Same semantic variant gets the same primary key across browsers and retries.
    const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`pure20-supplier-sync-v1|${key}`));
    return 'supplier-sync-' + Array.from(new Uint8Array(hash), b => b.toString(16).padStart(2, '0')).join('');
  }
  async function add() {
    if (state.busy || !state.selected.size) return;
    if (dirty()) { message('Sla eerst je gewijzigde prijzen/voorraad op. Daarna kun je de geselecteerde regels toevoegen.', true); return; }
    state.busy = true;
    const selected = state.preview.rows.filter(row => state.selected.has(row.key) && row.payload);
    render(); message('Selectie opnieuw controleren tegen de actuele database…');
    let attempted = false;
    try {
      const fresh = await snapshot();
      const current = new Map(fresh.rows.map(row => [row.key, row]));
      if (selected.some(row => !current.get(row.key)?.payload || current.get(row.key).fingerprint !== row.fingerprint)) {
        state.preview = fresh; state.selected.clear();
        message('De catalogus is gewijzigd. Er is niets toegevoegd. Controleer de vernieuwde preview en selecteer opnieuw.', true);
        return;
      }
      // No upsert, update, delete, supplier writes, or existing product IDs.
      const payload = await Promise.all(selected.map(async (row, index) => ({ id: await rowId(row.key), ...current.get(row.key).payload, sort_order: fresh.maxSortOrder + index + 1, badge: '', note: '', coa_url: '' })));
      if (dirty()) throw new Error('Er zijn niet-opgeslagen productwijzigingen. Sla die eerst op.');
      attempted = true;
      const { data, error } = await client().from('pure20_products').insert(payload).select('id,product_name,variant,code,category,unit,price_eur,stock,active,sort_order,badge,note,coa_url');
      if (error) throw error;
      if (!Array.isArray(data) || data.length !== payload.length || payload.some(expected => {
        const actual = data.find(row => row.id === expected.id);
        return !actual || Object.keys(expected).some(field => actual[field] !== expected[field]);
      })) throw new Error('De databasebevestiging is onvolledig. Vernieuw de preview voordat je opnieuw toevoegt.');
      document.dispatchEvent(new CustomEvent('pure20:supplier-sync-added', { detail: data }));
      state.selected.clear();
      // Use the confirmed rows immediately; a failed post-write refresh must not imply a failed insert.
      state.preview = { ...fresh, rows: fresh.rows.map(row => selected.some(s => s.key === row.key) ? { ...row, status: 'Bestaat', payload: null, reason: 'Toegevoegd en door Supabase bevestigd.' } : row) };
      state.preview.retailCount += data.length;
      state.preview.maxSortOrder += data.length;
      for (const status of Object.keys(state.preview.counts)) state.preview.counts[status] = state.preview.rows.filter(row => row.status === status).length;
      message(`${data.length} regels toegevoegd en bevestigd. Ze staan verborgen in Products, met prijs €0 en voorraad 0. Bestaande retailregels zijn niet aangepast.`);
    } catch (error) {
      state.selected.clear();
      // Fail closed after an uncertain response. Never automatically retry a write.
      if (attempted) state.preview = null;
      message(`${attempted ? 'Toevoegen niet bevestigd. Vernieuw de preview; mogelijk zijn de regels al toegevoegd.' : 'Niets toegevoegd.'} ${error.message || error}`, true);
    } finally { state.busy = false; render(); }
  }
  $('ss-refresh').addEventListener('click', refresh);
  $('ss-add').addEventListener('click', add);
  $('ss-search').addEventListener('input', render);
  $('ss-filter').addEventListener('change', render);
  $('ss-select').addEventListener('click', () => { visibleRows().filter(row => row.payload).forEach(row => state.selected.add(row.key)); render(); });
  $('ss-clear').addEventListener('click', () => { state.selected.clear(); render(); });
  $('ss-rows').addEventListener('change', event => {
    const key = event.target.dataset.ssKey;
    if (state.busy || !state.preview?.rows.some(row => row.key === key && row.payload)) return;
    if (event.target.checked) state.selected.add(key); else state.selected.delete(key);
    controls();
  });
  document.querySelector('[data-tab="supplier-sync"]').addEventListener('click', () => { if (!state.preview) refresh(); });
  render();
})();
