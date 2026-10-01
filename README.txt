PURE20 SHOP THUMBNAIL FIX V3

Upload / vervang ALLEEN deze 2 bestanden in de root van GitHub:
1. product-catalogue.js
2. supabase-config.js

NIET vervangen:
- shop.html
- app.js
- api.js
- styles.css

Wat deze versie anders doet:
- leest de foto-URL rechtstreeks uit pure20_products via een aparte publieke Supabase-client;
- hangt dus NIET meer af van api.js dat image_url momenteel weggooit;
- koppelt elke rij via het exacte product-ID;
- toont in de shop één thumbnail per peptide;
- gebruikt de eerste beschikbare variantfoto als thumbnail;
- gebruikt een veilige MutationObserver die zijn eigen wijzigingen niet eindeloos opnieuw rendert;
- nieuwe cacheversie: 20261001-thumb3.

Voor HGH 191AA zijn 10iu, 12iu, 15iu, 24iu en 36iu momenteel voorzien van image_url.
De eerste beschikbare HGH-foto wordt dus als shopthumbnail gebruikt.
