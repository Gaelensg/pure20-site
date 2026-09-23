/* PURE20 v4 cloud config
   1) Create a Supabase project.
   2) Paste your Project URL and publishable/anon key below.
   Never put a service_role key in this browser file. */
window.PURE20_SUPABASE_CONFIG = {
  url: "https://wvprnzgzqyyecbqiroij.supabase.co",
  key: "sb_publishable_djQWgeLRZuCljskve0i8iA_rLabxtvS"
};

/* PURE20 global language loader */
(() => {
  if (document.querySelector('script[data-pure20-language]')) return;
  const s = document.createElement('script');
  s.src = '/language.js';
  s.dataset.pure20Language = '1';
  document.head.appendChild(s);
})();
