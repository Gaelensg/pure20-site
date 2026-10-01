PURE20 — Product pages integrated v4

WAAROM DE VORIGE VERSIE NIET BETROUWBAAR WAS
De sterktes zaten in een tweede JavaScript-module die achteraf probeerde aan te
haken op de Product pages-editor. Op jouw live admin werd die koppeling niet
betrouwbaar uitgevoerd.

Deze versie verwijdert die afhankelijkheid volledig.

UPLOAD / VERVANG IN DE ROOT VAN GITHUB:
- admin-product-pages.js
- admin-product-pages.css
- supabase-config.js

Het oude bestand variant-images-admin.js mag in de repo blijven staan.
Het wordt na deze update NIET meer geladen.

DATABASE
De databasefix is al live uitgevoerd.
Je hoeft geen SQL uit te voeren.

WAT JE NU ZIET
Admin > Product pages > open een peptide.

DIRECT BOVENAAN DE EDITOR staat:
STERKTES & FOTO'S

Daaronder staan ALLE varianten uit pure20_products voor dat peptide, bijvoorbeeld:
HGH 191AA:
- 6 IU
- 10 IU
- 12 IU
- 15 IU
- 24 IU
- 36 IU
(alleen wat werkelijk in jouw database staat wordt getoond)

Retatrutide, BPC-157, Semaglutide enz. werken exact hetzelfde.

PER VARIANT:
- Foto uploaden
- Foto vervangen
- Foto verwijderen

SHOPMINIATUUR
Verder naar beneden staat apart:
SHOPMINIATUUR / FALLBACK

Dat is de ene afbeelding die in de shoplijst verschijnt.
Als een specifieke sterkte geen eigen foto heeft, gebruikt de publieke
productpagina deze shopminiatuur als fallback.

CACHE
supabase-config.js laadt de nieuwe adminbestanden met:
?v=20261001-4

Na Vercel deployment Safari één keer volledig vernieuwen.
