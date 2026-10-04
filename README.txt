PURE20 ADMIN SAVE FIX V4

UPLOAD / VERVANG:
- admin.html
- admin-inline-edit.js
- supabase-config.js

WAAROM V4
Supabase toont dat 5-Amino-1MQ 1mg exact om 11:54 werd geüpdatet,
maar price_eur en stock werden opnieuw als 0 / 0 geschreven.

Dat bewijst:
- verbinding werkt
- adminrechten werken
- update bereikt Supabase
- probleem zat in de waarden die de browser naar Supabase stuurde

INLINE PRIJS/STOCK
- Bij Save wordt het actieve invoerveld eerst geblurd/gecommit.
- Daarna worden alle zichtbare prijs/stock-inputs OPNIEUW rechtstreeks uit de DOM gelezen.
- Er wordt niet meer blind vertrouwd op een eerder sessionStorage-draft.
- Elke update gebruikt UPDATE ... SELECT.
- Supabase MOET de aangepaste rij teruggeven.
- Daarna worden prijs en stock exact gecontroleerd.
- 0 bijgewerkte rijen = harde fout, nooit meer vals 'opgeslagen'.
- Pas na succesvolle verificatie wordt het draft gewist.

VOLLEDIG EDIT PRODUCT
- admin.js had nog een tweede Save-listener op dezelfde knop.
- V4 vervangt de Save-knop na admin.js door een schone clone.
- Daardoor blijven er fysiek geen oude click-listeners over.
- Er is nog maar 1 savepad: PURE20_PHOTO_V14/V15.
- Actieve mobiele input wordt vóór Save gecommit.
- Prijs/order/stock worden locale-safe uitgelezen met valueAsNumber + komma/punt fallback.
- Na database-update wordt de rij teruggelezen en vergeleken.
- De status toont na succes ook de werkelijk opgeslagen prijs en stock.

BESTAAND
- foto-upload blijft
- COA blijft
- productpagina-cover blijft
- alfabetische Admin-sortering blijft
- compacte mobiele prijs/stockvelden blijven
- Save-balk blijft verborgen zolang niets gewijzigd is
