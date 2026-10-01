PURE20 PHOTO V10 — één bestand, één uploadflow

Vervang ALLEEN:
- admin.html

Daarna:
1. wacht op de Vercel deploy
2. sluit Safari-tab volledig
3. open https://pure20-site.vercel.app/admin?v=10
4. open Producten > een variant
5. kies een foto

De preview MOET onmiddellijk verschijnen, nog vóór SAVE PRODUCT.

Daarna:
- optioneel 'Gebruik deze variant als shopminiatuur'
- druk SAVE PRODUCT
- foto wordt geüpload naar pure20-products
- image_url wordt opgeslagen op de exacte pure20_products-variant
- admin reloadt automatisch

Er wordt GEEN extern foto-JavaScriptbestand meer geladen.
De volledige logica zit inline in admin.html.
