PURE20 ADMIN SAVE FIX V6 / BUILD V20

UPLOAD / VERVANG:
- admin.html
- admin-inline-edit.js
- supabase-config.js

BELANGRIJKSTE FIX
- Prijsvelden zijn nu text + inputmode=decimal in plaats van HTML type=number.
- Zowel 39,99 als 39.99 werkt.
- Elke wijziging in het volledige Edit-scherm wordt tijdens het typen bewaard.
- Save gebruikt die bewaarde tekst als bron.
- Supabase wordt daarna teruggelezen en exact geverifieerd.

GEEN LOGIN-FLASH MEER
- Automatische location.reload() na Edit Save is verwijderd.
- Automatische location.reload() na inline prijs/stock Save is verwijderd.
- De zichtbare rij wordt direct bijgewerkt.
- Een tweede Edit van hetzelfde product gebruikt de zojuist opgeslagen cache.

BESTAAND BLIJFT
- foto-upload
- COA
- shop-cover
- alfabetische productlijst
- compacte mobiele prijs/stockvelden
- quick-save balk alleen zichtbaar bij wijzigingen
