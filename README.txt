PURE20 — Build a Box translation fix

Replace these 2 files in the root of Gaelensg/pure20-site:
- build-a-box.html
- build-a-box.js

What is fixed:
- NL/EN now works for the complete Build a Box page.
- Dynamic texts no longer overwrite the selected language.
- Product buttons, stock status, categories, progress, drawer, errors, toast messages,
  order copy and WhatsApp order text all switch language.
- Title and subtitle use the bilingual Build a Box values now stored in Supabase.
- Existing visual CSS does not need to be replaced.

After upload, reload the page once. If iPhone Safari still shows the cached version,
close the tab and reopen /build-a-box.
