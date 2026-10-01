PURE20 — afbeeldingen per sterkte / variant

DATABASE
De live Supabase-database is AL aangepast.
pure20_products heeft nu:
- image_url
- image_alt_nl
- image_alt_en

De meegeleverde migration SQL is alleen ter referentie. Je hoeft die niet opnieuw uit te voeren.

UPLOAD NAAR DE ROOT VAN Gaelensg/pure20-site

NIEUW
- variant-images-admin.js
- variant-images-admin.css
- variant-product-images.js

VERVANG
- supabase-config.js

WAAR BEHEER JE FOTO'S?
1. Open /admin
2. Ga naar Product pages
3. Open een peptide
4. Onderaan verschijnt 'Foto's per sterkte'
5. Daar zie je elke variant / sterkte apart
6. Upload per sterkte zijn eigen vialfoto

SHOPMINIATUUR
De normale shop blijft bewust maar ÉÉN miniatuur per peptide tonen.
Klik bij de gewenste sterkte op:
  Als shopminiatuur

Als er nog geen shopminiatuur bestaat, wordt de eerste geüploade variantfoto
automatisch als shopminiatuur gebruikt.

PRODUCTPAGINA
Op /product?slug=... verandert de grote productfoto automatisch wanneer de klant
een andere sterkte kiest.

Voorbeeld:
Retatrutide 10 mg -> retatrutide 10 mg foto
Retatrutide 20 mg -> retatrutide 20 mg foto
Retatrutide 30 mg -> retatrutide 30 mg foto

Als een bepaalde sterkte nog geen eigen foto heeft, valt de productpagina terug
op de gekozen shopminiatuur.

OPSLAG
Alle bestanden worden opgeslagen in de bestaande Supabase Storage bucket:
pure20-products

Structuur:
variants/<product>/<variant-id>/<bestand>

Toegestaan:
- JPG
- PNG
- WEBP
- maximaal 5 MB

UPLOADS blijven door de bestaande Storage/RLS-regels beperkt tot PURE20-admins.
