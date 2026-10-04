const { test } = require('node:test');
const assert = require('node:assert/strict');
const core = require('../supplier-sync-core.js');
const suppliers = [{ supplier_key: 'hhpeptide', name: 'HHPeptide', active: true, sort_order: 1 }, { supplier_key: 'emlins', name: 'Emlins', active: true, sort_order: 2 }];
const retail = (name = 'BPC 157', variant = '5mg', code = 'BP5') => ({ id: 'existing', product_name: name, variant, code, category: 'Recovery', active: false, price_eur: 99, stock: 7 });
const supplier = (name = 'BPC157', specification = '5mg*10vials', code = 'BP5', extra = {}) => ({ supplier_key: 'hhpeptide', category: 'peptides', active: true, product_name: name, specification, code, unit_label: 'vials', ...extra });
const row = (p, s) => core.preview(p, s, suppliers).rows[0];
test('aliases and code differences match hidden retail rows', () => {
  for (const [r, s] of [['BPC 157', 'BPC157'], ['Epitalon', 'Epithalon'], ['Adipotide', 'FTPP(Adi)'], ['GHK-CU', 'GHK Cu']]) {
    assert.equal(row([retail(r, '50mg', 'CU')], [supplier(s, '50 mg', 'CU50')]).status, 'Bestaat');
  }
});
test('other strengths inherit exact retail name/category and safe defaults', () => {
  const result = row([retail()], [supplier('BPC157', '20mg', 'BP20')]);
  assert.equal(result.status, 'Nieuwe variant');
  assert.deepEqual(result.payload, { product_name: 'BPC 157', category: 'Recovery', variant: '20mg', code: 'BP20', price_eur: 0, stock: 0, active: false, unit: 'vial' });
});
test('new product, supplier deduplication and original code preservation', () => {
  const result = core.preview([], [supplier('AICAR', '100mg', 'AC100'), supplier('AICAR', '0.1g', 'AI100', { supplier_key: 'emlins' })], suppliers);
  assert.equal(result.rows.length, 1); assert.equal(result.mergedCount, 1);
  assert.equal(result.rows[0].status, 'Nieuw product'); assert.equal(result.rows[0].payload.code, 'AC100');
});
test('orals, oils, inactive suppliers and inactive catalogue rows excluded', () => {
  assert.equal(core.preview([], [supplier('A', '5mg', 'A', { category: 'orals' }), supplier('B', '5mg', 'B', { category: 'oils' }), supplier('C', '5mg', 'C', { active: false }), supplier('D', '5mg', 'D', { supplier_key: 'missing' })], suppliers).rows.length, 0);
});
test('ambiguous doses, blends, suspicious names and packaging fail closed', () => {
  for (const spec of ['', '5mg + 5mg', '10mg/10vials', '10mg/ml', 'kit', '0mg', '-5mg']) assert.equal(row([], [supplier('X', spec, 'X')]).status, 'Controleren', spec);
  assert.equal(row([], [supplier('5-Amino-10MQ')]).status, 'Controleren');
  assert.equal(row([], [supplier('BPC157', '5mg', 'BP5', { unit_label: 'tablets' })]).status, 'Controleren');
  assert.equal(row([], [supplier('BPC 157 (5mg)')]).status, 'Controleren');
});
test('equivalent units and per-vial pack notation normalize', () => {
  for (const value of ['5mg', '5 mg/vial', '5mg × 10 vials', '5mg*10vials', '5000mcg', '0,005g', '5 mg (10 vials)']) assert.equal(core.strength(value).key, '5mg', value);
  assert.equal(core.strength('100 IU').key, '100iu'); assert.equal(core.strength('10 ml').key, '10ml');
  assert.notEqual(core.strength('10iu').key, core.strength('10mg').key);
});
test('same code with conflicting strength or name is review, never insert', () => {
  assert.equal(row([retail()], [supplier('BPC157', '20mg', 'BP5')]).status, 'Controleren');
  assert.equal(row([retail()], [supplier('Different', '5mg', 'BP5')]).status, 'Controleren');
  const result = core.preview([], [supplier(), supplier('Other', '10mg', 'BP5', { supplier_key: 'emlins' })], suppliers);
  assert.ok(result.rows.every(r => r.status === 'Controleren' && !r.payload));
});
test('uncertain existing variants and category disagreements block inheritance', () => {
  assert.equal(row([retail('BPC 157', 'unknown')], [supplier('BPC157', '20mg', 'BP20')]).status, 'Controleren');
  assert.equal(row([retail(), { ...retail('BPC 157', '10mg', 'BP10'), category: 'Other' }], [supplier('BPC157', '20mg', 'BP20')]).status, 'Controleren');
});
test('strength repeated in product name must agree', () => {
  assert.equal(row([retail()], [supplier('BPC157 5mg')]).status, 'Bestaat');
  assert.equal(row([], [supplier('BPC157 10mg')]).status, 'Controleren');
});
test('matching never mutates current retail or supplier rows', () => {
  const p = [retail()], s = [supplier(), supplier('BPC157', '20mg', 'BP20')];
  const before = JSON.stringify({ p, s }); core.preview(p, s, suppliers); assert.equal(JSON.stringify({ p, s }), before);
});
test('repeat import becomes Bestaat', () => {
  const s = [supplier('BPC157', '20mg', 'BP20')]; const first = row([retail()], s);
  assert.equal(row([retail(), { ...first.payload, id: 'new' }], s).status, 'Bestaat');
});
test('review reason preserves the actionable source problem', () => {
  assert.match(row([], [supplier('5-Amino-10MQ')]).reason, /5-Amino-10MQ/);
  assert.match(row([], [supplier('Blend', '5mg+5mg')]).reason, /samenstelling/);
});
