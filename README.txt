PURE20 ADMIN INLINE PRICE + STOCK V1

UPLOAD / VERVANG:
- NIEUW: admin-inline-edit.js
- VERVANG: supabase-config.js

admin.html en admin.js hoef je NIET te vervangen.

WAT VERANDERT OP ADMIN > PRODUCTS
- PRICE wordt rechtstreeks een bewerkbaar invoervak.
- STOCK wordt rechtstreeks een bewerkbaar invoervak.
- De gewone Edit-knop blijft bestaan voor:
  variant, category, code, foto, visibility, enz.
- Je kunt meerdere producten achter elkaar wijzigen.
- Gewijzigde rijen krijgen een subtiele markering.
- Zoeken/filteren mag tussendoor: niet-opgeslagen wijzigingen blijven in de sessie.
- Onderaan de productenlijst staat een sticky Save-bar.
- De Save-bar toont hoeveel producten gewijzigd zijn.
- Eén klik op WIJZIGINGEN OPSLAAN schrijft alle aangepaste prijs/stock-regels naar Supabase.
- Na succesvolle save herlaadt Admin één keer zodat ook de interne admin-store,
  stats en Edit-modal de nieuwe waarden gebruiken.
- Bij verlaten/herladen met niet-opgeslagen wijzigingen geeft de browser een waarschuwing.

DATABASE
De module update alleen:
- pure20_products.price_eur
- pure20_products.stock
- pure20_products.updated_at

Geen productfoto-, naam-, variant- of andere velden worden aangeraakt.
