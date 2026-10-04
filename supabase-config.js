/* PURE20 v4 cloud config
   Browser-safe publishable configuration.
   Never put a service_role key in this file. */
window.PURE20_SUPABASE_CONFIG = {
  url: "https://wvprnzgzqyyecbqiroij.supabase.co",
  key: "sb_publishable_djQWgeLRZuCljskve0i8iA_rLabxtvS"
};

(() => {
  const cfg = window.PURE20_SUPABASE_CONFIG || {};
  const canCreate = Boolean(cfg.url && cfg.key && window.supabase?.createClient);
  const publicClient = canCreate
    ? window.supabase.createClient(cfg.url, cfg.key, {
        auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false,storageKey:"pure20-public-anon"}
      })
    : null;

  function patchPublicApi(api) {
    if (!api || !publicClient || api.__pure20PublicAnonPatched) return;
    api.loadPublicStore = async () => {
      const [productsRes, settingsRes] = await Promise.all([
        publicClient.from("pure20_products").select("*").eq("active", true).order("sort_order", {ascending:true}),
        publicClient.from("pure20_settings").select("data").eq("id", "store").single()
      ]);
      if (productsRes.error) throw productsRes.error;
      if (settingsRes.error) throw settingsRes.error;
      return {
        store:api.normalizeStore({settings:settingsRes.data?.data||{},products:productsRes.data||[],coupons:[]}),
        source:"cloud"
      };
    };
    api.subscribePublic = onChange => {
      let timer;
      const trigger=()=>{clearTimeout(timer);timer=setTimeout(()=>onChange?.(),180)};
      const channel=publicClient.channel("pure20-public-live-anon")
        .on("postgres_changes",{event:"*",schema:"public",table:"pure20_products"},trigger)
        .on("postgres_changes",{event:"*",schema:"public",table:"pure20_settings"},trigger)
        .subscribe();
      return ()=>publicClient.removeChannel(channel);
    };
    api.__pure20PublicAnonPatched=true;
  }

  if(window.PURE20_API)patchPublicApi(window.PURE20_API);
  else{
    let pendingApi;
    Object.defineProperty(window,"PURE20_API",{
      configurable:true,enumerable:true,
      get(){return pendingApi},
      set(value){
        pendingApi=value;patchPublicApi(value);
        Object.defineProperty(window,"PURE20_API",{value,writable:true,configurable:true,enumerable:true});
      }
    });
  }

  if(!document.querySelector("script[data-pure20-language]")){
    const s=document.createElement("script");
    s.src="/language.js";
    s.dataset.pure20Language="1";
    document.head.appendChild(s);
  }
})();

(() => {
  if(document.querySelector('script[data-pure20-site-header]'))return;
  const s=document.createElement('script');
  s.src='/site-header.js';
  s.dataset.pure20SiteHeader='1';
  document.head.appendChild(s);
})();

(() => {
  const p=(location.pathname.replace(/\/+$/,'')||'/').toLowerCase();
  const yes=['/shop','/shop.html','/wholesale','/wholesale.html','/supplier-order','/supplier-order.html'].includes(p);
  if(!yes)return;

  if(!document.querySelector('link[data-pure20-order-ux]')){
    const l=document.createElement('link');
    l.rel='stylesheet';
    l.href='/order-ux.css';
    l.dataset.pure20OrderUx='1';
    document.head.appendChild(l);
  }
  if(!document.querySelector('script[data-pure20-order-ux]')){
    const s=document.createElement('script');
    s.src='/order-ux.js';
    s.defer=true;
    s.dataset.pure20OrderUx='1';
    document.head.appendChild(s);
  }
})();

/* Retail product-page layer */
(() => {
  const p=(location.pathname.replace(/\/+$/,'')||'/').toLowerCase();
  const shop=p==='/shop'||p==='/shop.html';
  if(!shop)return;

  if(!document.querySelector('link[data-pure20-product-catalogue]')){
    const l=document.createElement('link');
    l.rel='stylesheet';
    l.href='/product-catalogue.css?v=20261001-thumb3';
    l.dataset.pure20ProductCatalogue='1';
    document.head.appendChild(l);
  }

  for(const src of ['/retail-cart-bridge.js','/product-catalogue.js?v=20261001-thumb3']){
    const base=src.split('?')[0];
    if([...document.scripts].some(s=>s.src&&new URL(s.src,location.href).pathname===base))continue;
    const s=document.createElement('script');
    s.src=src;
    s.defer=true;
    document.head.appendChild(s);
  }
})();

/* Exact image per selected strength on public product page */
(() => {
  const p=(location.pathname.replace(/\/+$/,'')||'/').toLowerCase();
  if(p!=='/product'&&p!=='/product.html')return;

  if(document.querySelector('script[data-pure20-variant-product-images]'))return;
  const s=document.createElement('script');
  s.src='/variant-product-images.js?v=20261001-list2';
  s.defer=true;
  s.dataset.pure20VariantProductImages='1';
  document.head.appendChild(s);
})();

/* Admin product thumbnails */
(() => {
  const p=(location.pathname.replace(/\/+$/,'')||'/').toLowerCase();
  if(p!=='/admin'&&p!=='/admin.html')return;

  if(document.querySelector('script[data-pure20-admin-thumbnails]'))return;
  const s=document.createElement('script');
  s.src='/admin-product-thumbnails.js?v=20261001-list2';
  s.defer=true;
  s.dataset.pure20AdminThumbnails='1';
  document.head.appendChild(s);
})();

/* Integrated Product Pages admin */
(() => {
  const p=(location.pathname.replace(/\/+$/,'')||'/').toLowerCase();
  if(p!=='/admin'&&p!=='/admin.html')return;

  if(!document.querySelector('link[data-pure20-admin-product-pages]')){
    const l=document.createElement('link');
    l.rel='stylesheet';
    l.href='/admin-product-pages.css?v=20261001-5';
    l.dataset.pure20AdminProductPages='1';
    document.head.appendChild(l);
  }

  if(!document.querySelector('script[data-pure20-admin-product-pages]')){
    const s=document.createElement('script');
    s.src='/admin-product-pages.js?v=20261001-5';
    s.defer=true;
    s.dataset.pure20AdminProductPages='1';
    document.head.appendChild(s);
  }
})();

/* Fast inline retail price + stock editor in Admin */
(() => {
  const p=(location.pathname.replace(/\/+$/,'')||'/').toLowerCase();
  if(p!=='/admin'&&p!=='/admin.html')return;

  if(document.querySelector('script[data-pure20-admin-inline-edit]'))return;

  const s=document.createElement('script');
  s.src='/admin-inline-edit.js?v=20261004-6';
  s.defer=true;
  s.dataset.pure20AdminInlineEdit='1';
  document.head.appendChild(s);
})();
