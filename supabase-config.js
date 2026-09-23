/* PURE20 v4 cloud config
   Browser-safe publishable configuration.
   Never put a service_role key in this file. */
window.PURE20_SUPABASE_CONFIG = {
  url: "https://wvprnzgzqyyecbqiroij.supabase.co",
  key: "sb_publishable_djQWgeLRZuCljskve0i8iA_rLabxtvS"
};

/*
  Public catalogue hotfix:
  The public shop must not inherit an existing admin/customer session while
  reading public products. A separate anonymous Supabase client prevents a
  token-refresh race from turning a public catalogue request into a 401.
*/
(() => {
  const cfg = window.PURE20_SUPABASE_CONFIG || {};
  const canCreate = Boolean(cfg.url && cfg.key && window.supabase?.createClient);

  const publicClient = canCreate
    ? window.supabase.createClient(cfg.url, cfg.key, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
          storageKey: "pure20-public-anon"
        }
      })
    : null;

  function patchPublicApi(api) {
    if (!api || !publicClient || api.__pure20PublicAnonPatched) return;

    api.loadPublicStore = async () => {
      const [productsRes, settingsRes] = await Promise.all([
        publicClient
          .from("pure20_products")
          .select("*")
          .eq("active", true)
          .order("sort_order", { ascending: true }),
        publicClient
          .from("pure20_settings")
          .select("data")
          .eq("id", "store")
          .single()
      ]);

      if (productsRes.error) throw productsRes.error;
      if (settingsRes.error) throw settingsRes.error;

      return {
        store: api.normalizeStore({
          settings: settingsRes.data?.data || {},
          products: productsRes.data || [],
          coupons: []
        }),
        source: "cloud"
      };
    };

    api.subscribePublic = (onChange) => {
      let timer;
      const trigger = () => {
        clearTimeout(timer);
        timer = setTimeout(() => onChange?.(), 180);
      };

      const channel = publicClient
        .channel("pure20-public-live-anon")
        .on("postgres_changes", { event: "*", schema: "public", table: "pure20_products" }, trigger)
        .on("postgres_changes", { event: "*", schema: "public", table: "pure20_settings" }, trigger)
        .subscribe();

      return () => publicClient.removeChannel(channel);
    };

    api.__pure20PublicAnonPatched = true;
  }

  if (window.PURE20_API) {
    patchPublicApi(window.PURE20_API);
  } else {
    let pendingApi;
    Object.defineProperty(window, "PURE20_API", {
      configurable: true,
      enumerable: true,
      get() {
        return pendingApi;
      },
      set(value) {
        pendingApi = value;
        patchPublicApi(value);
        Object.defineProperty(window, "PURE20_API", {
          value,
          writable: true,
          configurable: true,
          enumerable: true
        });
      }
    });
  }

  /* Global NL / EN switcher */
  if (!document.querySelector("script[data-pure20-language]")) {
    const s = document.createElement("script");
    s.src = "/language.js";
    s.dataset.pure20Language = "1";
    document.head.appendChild(s);
  }
})();
