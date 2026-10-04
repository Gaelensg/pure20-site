const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const crypto = require('node:crypto').webcrypto;
const path = require('node:path');
const { parseHTML } = require(process.env.PURE20_LINKEDOM || 'linkedom');
const root = path.join(__dirname, '..');
async function setup(shared) {
  const { window } = parseHTML(fs.readFileSync(path.join(root, 'admin.html'), 'utf8'));
  const document = window.document;
  // Linkedom does not implement native select.value setter.
  Object.defineProperty(document.getElementById('ss-filter'), 'value', { value: '', writable: true });
  const context = vm.createContext({ window, document, console, crypto, TextEncoder, structuredClone, CustomEvent: window.CustomEvent, setTimeout, clearTimeout });
  vm.runInContext(fs.readFileSync(path.join(__dirname, 'supplier-sync-fixture.js'), 'utf8'), context);
  const fixture = shared || context.createSyncFixture();
  window.PURE20_API = { configured: true, client: fixture.client, isAdmin: async () => fixture.state.allowed };
  window.PURE20_SUPPLIER_SYNC = require('../supplier-sync-core.js');
  vm.runInContext(fs.readFileSync(path.join(root, 'admin-supplier-sync.js'), 'utf8'), context);
  const click = id => document.getElementById(id).dispatchEvent(new window.Event('click', { bubbles: true }));
  const wait = async () => { for (let i=0; i<200; i++) { await new Promise(r => setTimeout(r, 3)); if(document.getElementById('panel-supplier-sync').getAttribute('aria-busy') !== 'true') return; } throw Error('test timed out'); };
  const refresh = async () => { click('ss-refresh'); await wait(); };
  const msg = () => document.getElementById('ss-message').textContent;
  return { fixture, document, window, click, wait, refresh, msg };
}
test('one click adds selected rows only and leaves existing rows byte-for-byte unchanged', async () => {
  const h = await setup(); const before = JSON.stringify(h.fixture.state.db.pure20_products);
  await h.refresh(); h.click('ss-select'); h.click('ss-add'); await h.wait();
  const products = h.fixture.state.db.pure20_products;
  assert.equal(products.length, 3); assert.equal(JSON.stringify(products.slice(0, 1)), before);
  assert.equal(h.fixture.state.insertCalls, 1); assert.match(h.msg(), /2 regels toegevoegd en bevestigd/);
  assert.ok(products.slice(1).every(p => p.active === false && p.price_eur === 0 && p.stock === 0 && p.unit === 'vial'));
  assert.ok(products.slice(1).every(p => p.sort_order > 12));
  await h.refresh(); h.click('ss-select'); h.click('ss-add'); await h.wait();
  assert.equal(h.fixture.state.insertCalls, 1);
});
test('double clicks serialize to one insert', async () => {
  const h = await setup(); h.fixture.state.delay=10; await h.refresh(); h.click('ss-select'); h.click('ss-add'); h.click('ss-add'); await h.wait(); assert.equal(h.fixture.state.insertCalls,1);
});
test('fresh check invalidates changed source or already-created retail variant', async () => {
  for (const existing of [false, true]) {
    const h = await setup(); await h.refresh(); h.click('ss-select');
    if(existing) h.fixture.state.db.pure20_products.push({ id: 'other-admin', product_name: 'BPC 157', variant: '20mg', code: 'BP20', category: 'Recovery' });
    else h.fixture.state.db.pure20_supplier_catalogue[1].specification = '30mg';
    h.click('ss-add'); await h.wait(); assert.equal(h.fixture.state.insertCalls,0); assert.match(h.msg(), /catalogus is gewijzigd/);
  }
});
test('read failure, missing count and unauthorized account prevent inserts', async () => {
  for (const key of ['failRead', 'countMissing', 'allowed']) {
    const h=await setup(); h.fixture.state[key] = key !== 'allowed'; await h.refresh(); h.click('ss-select'); h.click('ss-add'); await h.wait(); assert.equal(h.fixture.state.insertCalls,0); assert.match(h.msg(), /Laden mislukt/);
  }
});
test('paginated reads include all rows despite a server cap smaller than requested', async () => {
  const h=await setup(); h.fixture.state.pageCap=1; await h.refresh(); assert.match(h.document.getElementById('ss-summary').textContent, /6 supplierregels/); assert.ok(h.fixture.state.calls.some(c=>c.start>=4));
});
test('RLS errors never show success', async () => {
  const h=await setup(); await h.refresh(); h.click('ss-select'); h.fixture.state.failInsert=true; h.click('ss-add'); await h.wait(); assert.match(h.msg(), /niet bevestigd/); assert.equal(h.fixture.state.db.pure20_products.length,1);
});
test('lost insert response does not retry; refresh detects inserted hidden rows', async () => {
  const h=await setup(); await h.refresh(); h.click('ss-select'); h.fixture.state.uncertain=true; h.click('ss-add'); await h.wait(); assert.match(h.msg(), /mogelijk zijn de regels al toegevoegd/);
  await h.refresh(); h.click('ss-select'); h.click('ss-add'); await h.wait(); assert.equal(h.fixture.state.insertCalls,1); assert.equal(h.fixture.state.db.pure20_products.length,3);
});
test('pending inline edits block adding', async () => {
  const h=await setup(); await h.refresh(); h.click('ss-select'); h.document.getElementById('productsBody').innerHTML='<tr class="p20-inline-dirty"></tr>'; h.click('ss-add'); await h.wait(); assert.equal(h.fixture.state.insertCalls,0); assert.match(h.msg(), /Sla eerst/);
});
test('supplier-controlled markup is escaped', async () => {
  const h=await setup(); h.fixture.state.db.pure20_supplier_catalogue.push({ supplier_key:'hhpeptide', category:'peptides', code:'X', product_name:'<img src=x onerror=alert(1)>', specification:'5mg', active:true }); await h.refresh(); assert.equal(h.document.querySelectorAll('#ss-rows img').length,0);
});
test('two simultaneous sync sessions cannot insert the same semantic variants twice', async () => {
  const a=await setup(), b=await setup(a.fixture); a.fixture.state.delay=10;
  await Promise.all([a.refresh(),b.refresh()]); a.click('ss-select'); b.click('ss-select');
  a.click('ss-add'); b.click('ss-add'); await Promise.all([a.wait(),b.wait()]);
  assert.equal(a.fixture.state.db.pure20_products.length,3);
  assert.equal(new Set(a.fixture.state.db.pure20_products.map(p=>p.id)).size,3);
  assert.equal([a.msg(),b.msg()].filter(s=>s.includes('2 regels toegevoegd en bevestigd')).length,1);
});
