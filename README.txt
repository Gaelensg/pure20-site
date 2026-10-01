PURE20 — Productpagina's + miniaturen

DATABASE
De Supabase-database is al voorbereid:
- pure20_compounds is live
- 65 hoofdproducten zijn aangemaakt
- bestaande 122 retailvarianten blijven de enige bron voor prijs/voorraad
- afbeelding/omschrijving worden één keer per hoofdproduct opgeslagen

UPLOAD NAAR DE ROOT VAN Gaelensg/pure20-site

NIEUW:
- product.html
- product.css
- product.js
- product-catalogue.js
- product-catalogue.css
- retail-cart-bridge.js

VERVANG:
- supabase-config.js
- vercel.json

WAT HET DOET

SHOP
- Een peptide/product krijgt één miniatuurvisual, niet één per sterkte.
- De productnaam is aanklikbaar.
- Een klik opent /product/<slug>
- Wanneer je op een specifieke sterkte klikt, wordt die variant op de
  productpagina vooraf geselecteerd.

PRODUCTPAGINA
- Eén pagina per hoofdproduct.
- Alle actieve sterktes/varianten worden live uit pure20_products geladen.
- Sterkte wisselen verandert prijs, code, COA en voorraadstatus.
- Aantal kiezen en toevoegen aan hetzelfde retailwinkelmandje.
- Zwarte balk onderaan toont totaal aantal + subtotaal.
- Klik op winkelmandje stuurt naar /shop?cart=open en opent daar de bestaande cart.
- Light/dark mode + NL/EN.

GEDEELD WINKELMANDJE
retail-cart-bridge.js bewaart de retailcart in:
pure20_retail_cart_v1
Hierdoor blijft het winkelmandje behouden tussen /shop en productpagina's.

FOTO'S
Er staan momenteel nog geen echte productfoto's in de repository of database.
Daarom toont de site een nette PURE20 productvisual als fallback.
Zodra pure20_compounds.image_url wordt ingevuld, gebruikt:
- de shop automatisch de foto als miniatuur
- de productpagina automatisch dezelfde foto groot

Er hoeft dus later geen code meer aangepast te worden om foto's toe te voegen.
