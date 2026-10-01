PURE20 — fix voor Product pages / foto's per sterkte

DATABASE
De permission error is AL LIVE opgelost in Supabase.

pure20_compounds:
- anon: SELECT
- authenticated: SELECT / INSERT / UPDATE / DELETE
- RLS blijft actief
- de bestaande admin-policy bepaalt nog steeds wie effectief mag schrijven

Je hoeft dus GEEN SQL uit te voeren.

UPLOAD NAAR DE ROOT VAN GITHUB

VERVANG:
- variant-images-admin.js
- variant-images-admin.css
- supabase-config.js

Wat verandert er?

1. STERKTES ZIJN ZICHTBAAR
Open:
Admin > Product pages > kies een peptide

Bovenaan de editor verschijnt nu bijvoorbeeld:
5 STERKTES & FOTO'S

Tik daarop en er schuift een aparte lade omhoog met alle sterktes.

2. FOTO PER STERKTE
Elke sterkte heeft:
- Foto uploaden
- Foto vervangen
- Foto verwijderen

3. SHOPMINIATUUR BLIJFT APART
De grote foto bovenaan de gewone Product page-editor heet nu:
Shopminiatuur uploaden

Dat is de ene afbeelding die je in de shoplijst wilt tonen.

De foto's in 'Sterktes & foto's' worden alleen gebruikt voor de exacte variant
op de productpagina.

4. PRODUCTPAGINA
variant-product-images.js blijft automatisch de juiste foto kiezen wanneer een
klant bijvoorbeeld van 10 mg naar 20 mg wisselt.

Als een variant geen eigen foto heeft, gebruikt de productpagina de algemene
shopminiatuur als fallback.

Safari:
Na Vercel deployment de adminpagina één keer volledig vernieuwen.
De bestanden hebben ook een nieuwe ?v=20261001-2 cacheversie gekregen.
