PURE20 product list images v1

UPLOAD / VERVANG IN GITHUB ROOT:

NIEUW:
- admin-product-thumbnails.js

VERVANG:
- product-catalogue.js
- supabase-config.js

WAT VERANDERT?

ADMIN > PRODUCTEN
Elke exacte variant die een image_url heeft krijgt nu een miniatuurfoto in de
productlijst. Dus HGH 10 IU, 12 IU, 15 IU enz. kunnen elk hun eigen foto tonen.

PUBLIEKE SHOP
De shop blijft bewust maar ÉÉN miniatuur per peptide tonen.

Volgorde:
1. Als pure20_compounds.image_url bestaat, wordt die shopminiatuur gebruikt.
2. Als die leeg is, wordt automatisch de eerste beschikbare variantfoto gebruikt.

De sterkte-specifieke foto op de productpagina blijft apart werken via
variant-product-images.js.

Na upload naar GitHub wacht je op Vercel en vernieuw je /admin en /shop.
