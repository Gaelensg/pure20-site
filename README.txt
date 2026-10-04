PURE20 ADMIN SAVE FIX V3

UPLOAD / VERVANG IN GITHUB:
- admin.html
- admin-inline-edit.js
- supabase-config.js

1. SNEL BEWERKEN
- De zwarte Save-balk is voortaan volledig verborgen zolang er niets gewijzigd is.
- Pas je prijs of stock aan, dan verschijnt de balk.
- Na succesvol opslaan verdwijnt hij automatisch.
- Alfabetische Admin-sortering uit V2 blijft actief.
- Compacte mobiele prijs/stockvelden uit V2 blijven actief.

2. VOLLEDIG EDIT PRODUCT-SCHERM
De bestaande V14 saveflow had een belangrijk probleem:
lege formulierwaarden konden worden vervangen door de OUDE databasewaarde.

Daardoor kon bijvoorbeeld het leegmaken/wijzigen van:
- variant
- code
- badge
- note
- COA URL
weer terugvallen naar de oude inhoud.

V3/V15 behandelt het formulier als de bron van waarheid:
- exacte product-ID wordt gebruikt
- productnaam
- variant
- code
- categorie
- unit
- prijs
- stock
- sort order
- badge
- note
- visibility/active
- COA URL
worden rechtstreeks op die bestaande Supabase-rij opgeslagen.

Daarna wordt dezelfde rij meteen opnieuw vanuit Supabase teruggelezen.
"OPGESLAGEN ✓" wordt alleen getoond als de teruggelezen waarden daadwerkelijk
overeenkomen met wat in het formulier stond.

Foto-upload / productfoto en shop-cover logica blijven in admin.html behouden.
