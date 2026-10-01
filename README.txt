PURE20 Product Pages direct-load v6

Dit lost op dat de tab 'Product pages' niet zichtbaar is.

WAAROM
De juiste Product Pages-code stond al in GitHub, maar werd dynamisch geladen via
supabase-config.js. Op jouw live admin werd die dynamische injectie niet betrouwbaar uitgevoerd.

DEZE VERSIE
admin.html laadt nu DIRECT:
- /admin-product-pages.css?v=20261001-6
- /admin-product-pages.js?v=20261001-6

Daardoor hoeft supabase-config.js de module niet meer dynamisch te injecteren.
Het data-attribuut zorgt er bovendien voor dat de bestaande loader geen tweede
kopie probeert te laden.

UPLOAD / VERVANG DEZE 3 BESTANDEN IN DE ROOT VAN GITHUB:
- admin.html
- admin-product-pages.js
- admin-product-pages.css

Daarna:
1. wacht op de Vercel-deploy
2. sluit de adminpagina volledig
3. open /admin opnieuw

BOVENAAN MOET JE DAN TUSSEN DE TABS ZIEN:
PRODUCTEN | PRODUCT PAGES | KORTINGSCODES | INSTELLINGEN | BACKUP

In Product pages:
- open een peptide
- bovenaan staat STERKTES & FOTO'S
- daar kun je per sterkte een eigen foto uploaden
