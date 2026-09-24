(() => {
  const CFG = window.PURE20_SUPABASE_CONFIG || {};
  const FALLBACK_KEY = 'pure20_store_v4_demo';
  const clone = value => JSON.parse(JSON.stringify(value));
  const configured = Boolean(CFG.url && CFG.key && window.supabase?.createClient);
  const client = configured ? window.supabase.createClient(CFG.url, CFG.key, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  }) : null;

  function normalizeProduct(p, index = 0) {
    return {
      id: String(p.id || crypto.randomUUID()),
      order: Number(p.sort_order ?? p.order ?? index + 1) || index + 1,
      category: String(p.category || 'Other'),
      product: String(p.product_name ?? p.product ?? p.name ?? 'Untitled'),
      variant: String(p.variant || ''),
      code: String(p.code || ''),
      unit: String(p.unit || 'vial'),
      price: Math.max(0, Number(p.price_eur ?? p.price ?? 0) || 0),
      stock: Math.max(0, Math.floor(Number(p.stock ?? 0) || 0)),
      active: p.active !== false && String(p.active).toLowerCase() !== 'false',
      badge: String(p.badge || ''),
      note: String(p.note || ''),
      coaUrl: String(p.coa_url ?? p.coaUrl ?? '')
    };
  }

  function normalizeCoupon(c, index = 0) {
    return {
      id: String(c.id || `coupon-${index}`),
      code: String(c.code || '').trim().toUpperCase(),
      type: c.discount_type === 'fixed' || c.type === 'fixed' ? 'fixed' : 'percent',
      value: Math.max(0, Number(c.discount_value ?? c.value ?? 0) || 0),
      active: c.active !== false && String(c.active).toLowerCase() !== 'false',
      minSubtotal: Math.max(0, Number(c.min_subtotal ?? c.minSubtotal ?? 0) || 0)
    };
  }

  function normalizeStore(store) {
    const base = clone(window.PURE20_FALLBACK_STORE);
    const src = store && typeof store === 'object' ? store : base;
    return {
      version: 4,
      settings: { ...base.settings, ...(src.settings || {}) },
      products: (src.products || []).map(normalizeProduct),
      coupons: (src.coupons || []).map(normalizeCoupon)
    };
  }

  function demoGet() {
    try {
      const raw = localStorage.getItem(FALLBACK_KEY);
      if (raw) return normalizeStore(JSON.parse(raw));
    } catch (_) {}
    return normalizeStore(window.PURE20_FALLBACK_STORE);
  }

  function demoSave(store) {
    const normalized = normalizeStore(store);
    localStorage.setItem(FALLBACK_KEY, JSON.stringify(normalized));
    window.dispatchEvent(new CustomEvent('pure20-demo-updated'));
    return normalized;
  }

  async function loadPublicStore() {
    if (!configured) return { store: demoGet(), source: 'demo' };
    const [productsRes, settingsRes] = await Promise.all([
      client.from('pure20_products').select('*').eq('active', true).order('sort_order', { ascending: true }),
      client.from('pure20_settings').select('data').eq('id', 'store').single()
    ]);
    if (productsRes.error) throw productsRes.error;
    if (settingsRes.error) throw settingsRes.error;
    return {
      store: normalizeStore({ settings: settingsRes.data?.data || {}, products: productsRes.data || [], coupons: [] }),
      source: 'cloud'
    };
  }

  async function validateCoupon(code, subtotal) {
    code = String(code || '').trim().toUpperCase();
    if (!code) return null;
    if (!configured) {
      const c = demoGet().coupons.find(x => x.active && x.code === code && subtotal >= x.minSubtotal);
      return c || null;
    }
    const { data, error } = await client.rpc('pure20_validate_coupon', { p_code: code, p_subtotal: Number(subtotal || 0) });
    if (error) throw error;
    const row = Array.isArray(data) ? data[0] : data;
    return row ? normalizeCoupon(row) : null;
  }

  function subscribePublic(onChange) {
    if (!configured) {
      const handler = () => onChange?.();
      window.addEventListener('pure20-demo-updated', handler);
      return () => window.removeEventListener('pure20-demo-updated', handler);
    }
    let timer;
    const trigger = () => { clearTimeout(timer); timer = setTimeout(() => onChange?.(), 180); };
    const channel = client.channel('pure20-public-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pure20_products' }, trigger)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pure20_settings' }, trigger)
      .subscribe();
    return () => client.removeChannel(channel);
  }

  async function signIn(email, password) {
    if (!configured) return { demo: true, user: { email: 'demo@pure20.local' } };
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }

  async function signOut() {
    if (!configured) return;
    const { error } = await client.auth.signOut();
    if (error) throw error;
  }

  async function getSession() {
    if (!configured) return { demo: true, user: { email: 'demo@pure20.local' } };
    const { data, error } = await client.auth.getSession();
    if (error) throw error;
    return data.session || null;
  }

  async function isAdmin() {
    if (!configured) return true;
    const { data, error } = await client.rpc('is_pure20_admin');
    if (error) throw error;
    return data === true;
  }

  async function adminLoadAll() {
    if (!configured) return { store: demoGet(), source: 'demo' };
    const [productsRes, couponsRes, settingsRes] = await Promise.all([
      client.from('pure20_products').select('*').order('sort_order', { ascending: true }),
      client.from('pure20_coupons').select('*').order('code', { ascending: true }),
      client.from('pure20_settings').select('data').eq('id', 'store').single()
    ]);
    for (const r of [productsRes, couponsRes, settingsRes]) if (r.error) throw r.error;
    return { store: normalizeStore({ settings: settingsRes.data?.data || {}, products: productsRes.data || [], coupons: couponsRes.data || [] }), source: 'cloud' };
  }

  function productDb(p) {
    return {
      id: p.id,
      sort_order: Number(p.order || 0),
      category: p.category || 'Other',
      product_name: p.product || 'Untitled',
      variant: p.variant || '',
      code: p.code || '',
      unit: p.unit || 'vial',
      price_eur: Number(p.price || 0),
      stock: Math.max(0, Math.floor(Number(p.stock || 0))),
      active: p.active !== false,
      badge: p.badge || '',
      note: p.note || '',
      coa_url: p.coaUrl || ''
    };
  }

  function couponDb(c) {
    return {
      id: c.id,
      code: String(c.code || '').trim().toUpperCase(),
      discount_type: c.type === 'fixed' ? 'fixed' : 'percent',
      discount_value: Number(c.value || 0),
      min_subtotal: Number(c.minSubtotal || 0),
      active: c.active !== false
    };
  }

  async function adminUpsertProduct(p) {
    if (!configured) {
      const s = demoGet();
      const i = s.products.findIndex(x => x.id === p.id);
      if (i >= 0) s.products[i] = normalizeProduct(p, i); else s.products.push(normalizeProduct(p, s.products.length));
      demoSave(s); return;
    }
    const { error } = await client.from('pure20_products').upsert(productDb(p));
    if (error) throw error;
  }

  async function adminDeleteProduct(id) {
    if (!configured) { const s = demoGet(); s.products = s.products.filter(x => x.id !== id); demoSave(s); return; }
    const { error } = await client.from('pure20_products').delete().eq('id', id);
    if (error) throw error;
  }


  function coaSlug(value) {
    return String(value || 'file')
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9._-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80) || 'file';
  }

  async function adminUploadCoa(product, file) {
    if (!configured) throw new Error('COA uploads require cloud mode.');
    if (!file) throw new Error('Choose a COA file first.');

    const allowed = new Set(['application/pdf', 'image/jpeg', 'image/png', 'image/webp']);
    const type = String(file.type || '').toLowerCase();
    if (!allowed.has(type)) throw new Error('Use a PDF, JPG, PNG or WEBP file.');
    if (Number(file.size || 0) > 10 * 1024 * 1024) throw new Error('The COA file must be 10 MB or smaller.');

    const folder = coaSlug(product?.code || `${product?.product || 'product'}-${product?.variant || ''}`);
    const fileName = `${Date.now()}-${coaSlug(file.name || 'coa.pdf')}`;
    const path = `${folder}/${fileName}`;

    const { error } = await client.storage
      .from('pure20-coa')
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: type
      });
    if (error) throw error;

    const { data } = client.storage.from('pure20-coa').getPublicUrl(path);
    if (!data?.publicUrl) throw new Error('The COA was uploaded but no public link could be generated.');
    return { publicUrl: data.publicUrl, path };
  }

  function coaPathFromUrl(value) {
    try {
      const url = new URL(String(value || ''));
      const marker = '/storage/v1/object/public/pure20-coa/';
      const index = url.pathname.indexOf(marker);
      if (index < 0) return '';
      return decodeURIComponent(url.pathname.slice(index + marker.length));
    } catch (_) {
      return '';
    }
  }

  async function adminDeleteCoa(url) {
    if (!configured) return;
    const path = coaPathFromUrl(url);
    if (!path) return;
    const { error } = await client.storage.from('pure20-coa').remove([path]);
    if (error) throw error;
  }

  async function adminUpsertCoupon(c) {
    if (!configured) {
      const s = demoGet();
      const i = s.coupons.findIndex(x => x.id === c.id);
      if (i >= 0) s.coupons[i] = normalizeCoupon(c, i); else s.coupons.push(normalizeCoupon(c, s.coupons.length));
      demoSave(s); return;
    }
    const { error } = await client.from('pure20_coupons').upsert(couponDb(c));
    if (error) throw error;
  }

  async function adminDeleteCoupon(id) {
    if (!configured) { const s = demoGet(); s.coupons = s.coupons.filter(x => x.id !== id); demoSave(s); return; }
    const { error } = await client.from('pure20_coupons').delete().eq('id', id);
    if (error) throw error;
  }

  async function adminSaveSettings(settings) {
    if (!configured) { const s = demoGet(); s.settings = { ...s.settings, ...settings }; demoSave(s); return; }
    const { error } = await client.from('pure20_settings').upsert({ id: 'store', data: settings });
    if (error) throw error;
  }

  async function adminReplaceProducts(products) {
    if (!configured) { const s = demoGet(); s.products = products.map(normalizeProduct); demoSave(s); return; }
    const rows = products.map(productDb);
    const { error: delError } = await client.from('pure20_products').delete().neq('id', '__never__');
    if (delError) throw delError;
    if (rows.length) {
      const { error } = await client.from('pure20_products').insert(rows);
      if (error) throw error;
    }
  }

  window.PURE20_API = {
    configured, client, loadPublicStore, validateCoupon, subscribePublic,
    signIn, signOut, getSession, isAdmin, adminLoadAll,
    adminUpsertProduct, adminDeleteProduct, adminUploadCoa, adminDeleteCoa,
    adminUpsertCoupon, adminDeleteCoupon, adminSaveSettings, adminReplaceProducts, normalizeStore
  };
})();
