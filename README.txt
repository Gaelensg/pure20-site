PURE20 — Admin beheer voor productpagina's

DATABASE IS AL LIVE AANGEPAST
- pure20_compounds heeft nu weergavenamen NL/EN
- Storage bucket 'pure20-products' is aangemaakt
- bucket is publiek leesbaar voor productfoto's
- upload/update/delete is alleen toegestaan voor een geverifieerde PURE20-admin
- max afbeelding: 5 MB
- toegestaan: JPG, PNG, WEBP

UPLOAD NAAR DE ROOT VAN Gaelensg/pure20-site

NIEUW
- admin-product-pages.js
- admin-product-pages.css

VERVANG
- supabase-config.js
- product.js
- product.css
- product-catalogue.js

De overige bestanden in deze ZIP zijn meegestuurd als complete product-page set,
maar hoeven niet vervangen te worden als ze al identiek aanwezig zijn.

ADMIN
In /admin verschijnt een extra tab:
Product pages

Per hoofdproduct kun je beheren:
- productfoto
- weergavenaam NL
- display name EN
- categorie
- korte omschrijving NL/EN
- research info NL/EN
- alt-tekst NL/EN
- actief / verborgen
- featured
- preview naar de productpagina

De technische productnaam en slug zijn read-only zodat de koppeling met de
bestaande sterktevarianten niet kan breken.

CATALOGUS SYNCHRONISEREN
De knop 'Catalogus synchroniseren' voegt automatisch een hoofdproduct toe
wanneer later een nieuwe productnaam aan pure20_products wordt toegevoegd.

PRODUCTPAGINA
- Weergavenaam wisselt mee met NL/EN
- Korte omschrijving wisselt mee
- Research info wordt alleen getoond wanneer ingevuld
- Dezelfde foto verschijnt als shopminiatuur én grote productfoto
- Prijs/voorraad blijven uit pure20_products komen
