/* Test-only database. No network and no production writes. */
(function (root) {
  const retail = [{ id: 'existing-bpc', product_name: 'BPC 157', category: 'Recovery', variant: '5mg', code: 'BP5', unit: 'vial', price_eur: 39.99, stock: 9, active: false, sort_order: 12 }];
  const source = (product_name, specification, code, extra = {}) => ({ supplier_key: 'hhpeptide', category: 'peptides', product_name, specification, code, unit_label: 'vials', active: true, ...extra });
  root.createSyncFixture = function () {
    const db = {
      pure20_products: structuredClone(retail),
      pure20_suppliers: [{ supplier_key: 'hhpeptide', name: 'HHPeptide', active: true, sort_order: 1 }, { supplier_key: 'emlins', name: 'Emlin’s', active: true, sort_order: 2 }],
      pure20_supplier_catalogue: [source('BPC157', '5mg*10vials', 'BP5'), source('BPC157', '20mg*10vials', 'BP20'), source('BPC 157', '20mg', 'BPC20', { supplier_key: 'emlins' }), source('AICAR', '100mg', 'AC100'), source('5-Amino-10MQ', '5mg', 'AM5'), source('Blend', '5mg+5mg', 'BL10'), source('Excluded oral', '5mg', 'O5', { category: 'orals' }), source('Excluded oil', '10ml', 'OI10', { category: 'oils' })]
    };
    const state = { db, calls: [], insertCalls: 0, failRead: false, failInsert: false, uncertain: false, allowed: true, pageCap: 500, delay: 0, countMissing: false };
    const client = { from(table) {
      const filters = [], orders = []; let start = 0, end = Infinity, payload;
      const q = {
        select() { return q; }, order(field) { orders.push(field); return q; }, eq(field, value) { filters.push([field, value]); return q; }, range(a, b) { start = a; end = b; return q; },
        insert(value) { payload = value; return q; },
        async then(resolve, reject) {
          try {
            if (state.delay) await new Promise(r => setTimeout(r, state.delay));
            state.calls.push({ table, operation: payload ? 'insert' : 'select', start, end });
            if (payload) {
              state.insertCalls++;
              if (state.failInsert) return resolve({ data: null, error: { message: 'RLS denied' } });
              if (payload.some(p => db[table].some(row => row.id === p.id))) return resolve({ data: null, error: { message: 'duplicate key' } });
              db[table].push(...structuredClone(payload));
              if (state.uncertain) throw new Error('Network response lost');
              return resolve({ data: structuredClone(payload), error: null });
            }
            if (state.failRead) return resolve({ data: null, error: { message: 'Read denied' } });
            const all = db[table].filter(row => filters.every(([field, value]) => row[field] === value)).sort((a,b) => { for (const field of orders) { const n = String(a[field]).localeCompare(String(b[field])); if(n) return n; } return 0; });
            return resolve({ data: structuredClone(all.slice(start, Math.min(end + 1, start + state.pageCap))), count: state.countMissing ? null : all.length, error: null });
          } catch (error) { return reject(error); }
        }
      }; return q;
    } };
    return { state, client };
  };
})(globalThis);
