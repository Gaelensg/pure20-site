PURE20 PRODUCTPAGINA'S STATIC V8

VERVANG ALLEEN:
- admin.html
- admin-product-pages.js

NIET nodig:
- admin-product-pages.css (ongewijzigd)

Wat is anders:
- De tab PRODUCTPAGINA'S staat nu statisch in admin.html.
- Hij hoeft dus niet meer eerst door JavaScript gemaakt te worden.
- admin.js ziet hem meteen bij het laden.
- admin-product-pages.js hergebruikt die bestaande tab en maakt alleen de inhoud.
- Nieuwe cacheversie: 20261001-8.

Na deploy moet de bovenste tabbalk letterlijk beginnen met:
PRODUCTEN | PRODUCTPAGINA'S | KORTINGSCODES | INSTELLINGEN | BACKUP

In Productpagina's:
open HGH 191AA en wijzig 'Tekst onder productnaam NL'.
