PURE20 — BUILD A BOX UPDATE

Upload these files to the ROOT of Gaelensg/pure20-site:

NEW:
- build-a-box.html
- build-a-box.css
- build-a-box.js
- build-box-nav.js

REPLACE EXISTING:
- supabase-config.js

After Vercel deploys, the page is available at:
/build-a-box

Current rules are loaded from Supabase:
- 4 products per box
- 15% Build a Box discount
- free shipping on a completed box

Only products with a price above €0 can be added. Products with a missing/€0 price stay visible as "Price pending" and cannot be selected.

The box order uses the same customer-detail storage and order recording mechanism as the current PURE20 shop. Copy and WhatsApp buttons work with the existing order flow.

Rewards / PURE20+ database preparation is already live in Supabase, but rewards are disabled until the membership UI/billing flow is added later.
