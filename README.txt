PURE20 — productpagina route + thumbnail fix

DIT PAKKET LOST DE HUIDIGE 2 PROBLEMEN OP:

1. 404 BIJ PRODUCTPAGINA
Links gebruiken voortaan:
  /product?slug=retatrutide
in plaats van:
  /product/retatrutide

Daarmee wordt rechtstreeks product.html gebruikt via Vercel cleanUrls en
zijn we niet meer afhankelijk van een dynamische rewrite.

2. VIERKANT MET '20.'
De tijdelijke PURE20-placeholder is volledig verwijderd.
Zolang een product GEEN echte afbeelding heeft, verschijnt er GEEN vierkant.
Zodra je via Admin > Product pages een echte afbeelding uploadt:
- verschijnt die automatisch als miniatuur in de shop
- verschijnt dezelfde foto groot op de productpagina
- andere sterktes van hetzelfde peptide krijgen geen tweede foto

BELANGRIJK
Op dit moment hebben de producten nog geen echte image_url in Supabase.
Daarom zie je na deze fix eerst een cleane lijst zonder thumbnail.
Upload daarna foto's via:
  /admin > Product pages

UPLOAD / VERVANG ALLE BESTANDEN UIT DEZE ZIP IN DE ROOT VAN GITHUB.

Nieuw indien nog niet aanwezig:
- admin-product-pages.js
- admin-product-pages.css

Vervangen:
- supabase-config.js
- product.html
- product.css
- product.js
- product-catalogue.js
- product-catalogue.css
- retail-cart-bridge.js
- vercel.json

Daarna Vercel laten deployen en Safari eventueel één keer hard refreshen.
