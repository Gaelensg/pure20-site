PURE20 — Rebirth-inspired navigation menu

Upload/replace these files in the root of Gaelensg/pure20-site:
1. site-header.js
2. site-theme.css
3. supabase-config.js

What changes:
- Removes the long horizontal public navigation bar.
- Compact header: PURE20. + theme + account + cart + MENU.
- Language switch moves inside the menu.
- Right-side drawer on desktop.
- Full-width menu on mobile.
- Routes included:
  Shop
  Stel je box samen / Build a Box
  Kennisbank / Knowledge
  Calculator
  Stack Builder
  Groothandel / Wholesale
- Active page is visually marked.
- NL/EN labels update with the site's existing language switch.
- Light/dark mode supported.
- Existing shop cart button is re-used, so current cart event handlers stay intact.
- Private admin/portal/supplier-order pages are not changed.

build-box-nav.js is no longer needed after this update. You can leave it in GitHub,
but supabase-config.js no longer loads it.
