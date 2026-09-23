(() => {
  const cfg = window.PURE20_SUPABASE_CONFIG || {};
  if (!cfg.url || !cfg.key || !window.supabase?.createClient) return;

  const client = window.supabase.createClient(cfg.url, cfg.key, {
    auth: { persistSession: true, autoRefreshToken: true }
  });

  const num = text => {
    if (!text) return 0;
    let s = String(text).replace(/[^\d,.\-]/g, "");
    if (s.includes(",") && s.includes(".")) s = s.replace(/\./g, "").replace(",", ".");
    else if (s.includes(",")) s = s.replace(",", ".");
    const n = Number(s);
    return Number.isFinite(n) ? n : 0;
  };

  const val = id => document.getElementById(id)?.value?.trim?.() || "";
  const txt = id => document.getElementById(id)?.textContent?.trim?.() || "";

  function currentChannel() {
    return location.pathname.toLowerCase().includes("wholesale") ? "wholesale" : "retail";
  }

  function collectItems() {
    return [...document.querySelectorAll("#orderLines .order-line")].map(line => {
      const name = line.querySelector(".order-line-name")?.textContent?.trim() || "";
      const meta = line.querySelector(".order-line-meta")?.textContent?.trim() || "";
      const totalText = line.querySelector(".order-line-total")?.textContent?.trim() || "";
      const m = meta.match(/(\d+)\s*×/);
      const quantity = m ? Number(m[1]) : 1;
      return {
        name,
        quantity,
        meta,
        line_total: num(totalText)
      };
    }).filter(x => x.name);
  }

  function collectCustomer() {
    return {
      name: val("fullName"),
      company: val("company"),
      vat_number: val("vat"),
      address: val("address"),
      postal_code: val("zip"),
      country: val("country"),
      email: val("email"),
      phone: val("phone")
    };
  }

  function fingerprint(payload) {
    return JSON.stringify({
      c: payload.p_channel,
      e: payload.p_customer.email,
      i: payload.p_items,
      t: payload.p_total
    });
  }

  async function record(source) {
    try {
      const items = collectItems();
      if (!items.length) return;

      const payload = {
        p_channel: currentChannel(),
        p_customer: collectCustomer(),
        p_items: items,
        p_subtotal: num(txt("drawerSubtotal")),
        p_discount: Math.abs(num(txt("drawerDiscount"))),
        p_shipping: num(txt("drawerShipping")),
        p_total: num(txt("drawerTotal")),
        p_currency: "EUR",
        p_coupon_code: val("couponInput").toUpperCase(),
        p_source: source
      };

      const fp = fingerprint(payload);
      const now = Date.now();
      const prev = JSON.parse(localStorage.getItem("pure20_last_recorded_order") || "null");

      if (prev && prev.fp === fp && now - prev.at < 10 * 60 * 1000) return;

      const { error } = await client.rpc("pure20_record_order", payload);
      if (error) throw error;

      localStorage.setItem("pure20_last_recorded_order", JSON.stringify({ fp, at: now }));
    } catch (err) {
      console.warn("PURE20 order history:", err?.message || err);
    }
  }

  document.addEventListener("click", e => {
    const button = e.target.closest("#copyOrder, #whatsappOrder");
    if (!button) return;
    record(button.id === "whatsappOrder" ? "whatsapp" : "copy");
  }, true);
})();