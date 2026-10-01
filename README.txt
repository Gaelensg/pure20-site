PURE20 — Productfoto rechtstreeks in Edit product (v7)

DIT VERVANGT DE OMSLACHTIGE ROUTE VIA 'PRODUCT PAGES' VOOR FOTO'S PER STERKTE.

UPLOAD / VERVANG IN DE ROOT VAN GITHUB:
- admin.html
- variant-photo-editor.js
- variant-photo-editor.css

NA VERCEL DEPLOY:
1. sluit /admin volledig
2. open /admin opnieuw
3. ga naar Producten
4. open bijvoorbeeld HGH 191AA 10iu

ONDER HET COA-BLOK ZIE JE NU:
PRODUCTFOTO

Met:
- Foto uploaden
- Foto vervangen
- Foto verwijderen
- Gebruik als shopminiatuur

Elke rij in Producten is al één exacte variant, dus:
HGH 191AA 10iu = eigen foto
HGH 191AA 12iu = eigen foto
Retatrutide 10mg = eigen foto
Retatrutide 20mg = eigen foto
enz.

De foto wordt direct opgeslagen in pure20_products.image_url.

SHOPMINIATUUR
De eerste variantfoto wordt automatisch de shopminiatuur als er nog geen bestaat.
Je kunt later een andere sterkte kiezen en op 'Gebruik als shopminiatuur' tikken.

PRODUCTPAGINA
De bestaande variant-product-images.js gebruikt de variantfoto wanneer de klant
op de productpagina van sterkte wisselt.

DATABASE
Geen SQL nodig. De vereiste kolommen, grants en Storage policies zijn al live.
