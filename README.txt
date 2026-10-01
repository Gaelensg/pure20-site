PURE20 PRODUCTPAGINA'S V7

Vervang in GitHub:
- admin.html
- admin-product-pages.js

Als admin-product-pages.css al bestaat, hoef je die NIET te vervangen.
(Er zit voor de volledigheid eventueel een kopie in deze map.)

Na deploy:
1. Open /admin
2. Bovenaan staat nu: PRODUCTEN | PRODUCTPAGINA'S | KORTINGSCODES | ...
3. Open PRODUCTPAGINA'S
4. Tik HGH 191AA aan
5. Wijzig "Tekst onder productnaam NL"
6. Klik Opslaan

Dit veld is exact de tekst onder de productnaam op /product.

Technische wijziging:
De tab wordt nu al geïnjecteerd zodra de admin-DOM bestaat.
Hij wacht niet meer op de Supabase-client om überhaupt zichtbaar te worden.
De database wordt pas afgewacht wanneer je de tab opent.
