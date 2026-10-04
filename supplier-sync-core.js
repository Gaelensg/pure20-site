/* PURE20 Supplier Sync: pure matching logic; never mutates input rows. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.PURE20_SUPPLIER_SYNC = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const text = value => String(value ?? '').trim();
  const compact = value => text(value).normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const codeKey = value => text(value).toUpperCase();
  const aliases = { epithalon: 'epitalon', ftpp: 'adipotide', ftppadi: 'adipotide', adipotideftpp: 'adipotide', adipotideftppadi: 'adipotide', ghkcu: 'ghkcu' };
  function nameKey(value) { const key = compact(value); return aliases[key] || key; }

  // Only unambiguous per-vial strengths. Never infer a dose from a code or a pack total.
  function strength(value) {
    let raw = text(value).toLowerCase().replace(/µ|μ/g, 'u').replace(/,/g, '.').replace(/\s+/g, ' ');
    raw = raw.replace(/\s*(?:[x×*]\s*\d+\s*(?:vials?|bottles?)|\/\s*vial|per\s+vial|\(\s*\d+\s*vials?\s*\))\s*$/i, '').trim();
    const match = raw.match(/^(\d+(?:\.\d+)?)\s*(mcg|ug|mg|g|iu|i\.u\.|ml)\s*(?:\/\s*1\s*vial|vial)?$/i);
    if (!match || Number(match[1]) <= 0) return null;
    let amount = Number(match[1]), unit = match[2];
    if (unit === 'g') { amount *= 1000; unit = 'mg'; }
    if (unit === 'ug' || unit === 'mcg') { amount /= 1000; unit = 'mg'; }
    if (unit === 'i.u.') unit = 'iu';
    amount = Number(amount.toPrecision(12));
    return { key: `${amount}${unit}`, label: `${amount}${unit}` };
  }
  function identity(row, supplier = false) {
    let name = text(row.product_name);
    const rawVariant = text(supplier ? row.specification : row.variant);
    const dose = strength(rawVariant);
    // A strength repeated in the name must agree with the variant column.
    const suffix = name.match(/\s+(\d+(?:[.,]\d+)?\s*(?:mcg|ug|µg|μg|mg|g|iu|ml))\s*$/i);
    let error = '';
    if (suffix) {
      const namedDose = strength(suffix[1]);
      if (!dose || namedDose?.key !== dose.key) error = 'Sterkte in productnaam en variant komen niet overeen.';
      name = name.slice(0, suffix.index).trim();
    }
    if (/\d+(?:[.,]\d+)?\s*(?:mcg|ug|µg|μg|mg|iu|ml)\b/i.test(name)) error = 'Sterkte in de productnaam is niet eenduidig; controleer de bron.';
    const family = nameKey(name);
    if (!name || !family) error = 'Productnaam ontbreekt.';
    if (/5amino10mq/.test(family)) error = 'Onzekere productnaam (5-Amino-10MQ); eerst bron controleren.';
    if (!dose) error = 'Sterkte of samenstelling is niet eenduidig; controleer de bron.';
    if (supplier && !text(row.code)) error = 'Suppliercode ontbreekt.';
    if (supplier && row.unit_label && !/^(vials?|bottles?)$/i.test(text(row.unit_label))) error = 'Verpakking is geen herkenbare vial; controleer de bron.';
    return { family, dose, name, error, key: family && dose ? `${family}|${dose.key}` : '' };
  }
  function preview(products, catalogue, suppliers) {
    const allowed = new Map(suppliers.filter(s => s.active !== false).map(s => [text(s.supplier_key), s]));
    const source = catalogue.filter(s => s.category === 'peptides' && s.active !== false && allowed.has(text(s.supplier_key)));
    const retail = products.map(row => ({ row, ...identity(row) }));
    const sourceInfo = source.map(row => ({ row, ...identity(row, true) }));
    const groups = new Map();
    sourceInfo.forEach((item, index) => {
      const key = item.key || `review:${index}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(item);
    });
    const rows = [];
    for (const [key, group] of groups) {
      group.sort((a, b) => Number(allowed.get(a.row.supplier_key)?.sort_order || 0) - Number(allowed.get(b.row.supplier_key)?.sort_order || 0) || text(a.row.supplier_key).localeCompare(text(b.row.supplier_key)) || codeKey(a.row.code).localeCompare(codeKey(b.row.code)));
      const first = group[0];
      const family = retail.filter(p => p.family === first.family);
      const equivalent = retail.filter(p => p.key && p.key === first.key && !p.error);
      const codes = new Set(group.map(p => codeKey(p.row.code)).filter(Boolean));
      const codeMatches = retail.filter(p => codes.has(codeKey(p.row.code)));
      let reason = group.find(p => p.error)?.error || '';
      if (!reason && sourceInfo.some(p => codes.has(codeKey(p.row.code)) && (p.error || p.key !== first.key))) reason = 'Suppliercode wordt gebruikt voor verschillende of onduidelijke varianten.';
      if (codeMatches.some(p => p.error || p.key !== first.key)) reason = 'Codeconflict met retail: naam of sterkte wijkt af.';
      let status = 'Nieuw product', payload = null;
      if (reason) status = 'Controleren';
      else if (equivalent.length) { status = 'Bestaat'; reason = codeMatches.length ? 'Exacte code en product/sterkte bestaan al.' : 'Dezelfde productnaam/alias en sterkte bestaan al (ook verborgen producten tellen mee).'; }
      else {
        const signatures = new Set(family.map(p => JSON.stringify([p.row.product_name, p.row.category])));
        if (family.some(p => p.error) || signatures.size > 1 || family.some(p => !text(p.row.category))) {
          status = 'Controleren'; reason = 'Bestaande productfamilie heeft onduidelijke varianten, namen of categorieën.';
        } else {
          status = family.length ? 'Nieuwe variant' : 'Nieuw product';
          payload = {
            product_name: family.length ? family[0].row.product_name : first.name,
            category: family.length ? family[0].row.category : 'Peptides',
            variant: first.dose.label,
            code: text(first.row.code), unit: 'vial', price_eur: 0, stock: 0, active: false
          };
          reason = family.length ? 'Erft de bestaande PURE20-naam en categorie.' : 'Nieuwe productfamilie; categorie Peptides.';
        }
      }
      const sources = group.map(p => ({ supplier: allowed.get(p.row.supplier_key)?.name || p.row.supplier_key, supplier_key: p.row.supplier_key, code: p.row.code, specification: p.row.specification, product_name: p.row.product_name }));
      rows.push({ key, status, reason, payload, name: payload?.product_name || first.name, variant: first.dose?.label || text(first.row.specification), sources,
        fingerprint: JSON.stringify({ payload, sources }) });
    }
    rows.sort((a, b) => a.name.localeCompare(b.name, 'nl', { numeric: true }) || a.variant.localeCompare(b.variant, 'nl', { numeric: true }));
    return { rows, sourceCount: source.length, retailCount: products.length, mergedCount: source.length - rows.length,
      counts: Object.fromEntries(['Bestaat', 'Nieuwe variant', 'Nieuw product', 'Controleren'].map(status => [status, rows.filter(r => r.status === status).length])) };
  }
  return { strength, identity, nameKey, codeKey, preview };
});
