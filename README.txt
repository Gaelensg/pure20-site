PURE20 SUPPLIER SMART ORDER V2

UPLOAD / VERVANG:
- supplier-order.html
- supplier-compare.js
- supplier-auto-cart.js

supplier-compare.js is dezelfde vergelijkmodule uit V1.
supplier-auto-cart.js is nieuw.

MODI BOVENAAN
1. BESTELLEN
2. PRIJZEN VERGELIJKEN
3. SLIM BESTELLEN

SLIM BESTELLEN
Je kiest producten maar één keer op één gezamenlijke lijst.

Voorbeeld:
RT10 x 3
CU50 x 2
BC10 x 1

PURE20 verdeelt daarna automatisch de bestelling over:
- HHPeptide Factory
- Emlin's

De twee winkelmandjes staan tegelijk naast elkaar.

PRIJSOPTIMALISATIE
De optimizer kijkt niet alleen naar de laagste prijs per regel.

Hij berekent twee scenario's:
A. HH retail tegenover Emlin's
B. HH wholesale tegenover Emlin's

Voor HH wholesale houdt hij rekening met de ingestelde $500 wholesale-drempel.

Als HH wholesale nog niet actief is, kan de optimizer berekenen of het goedkoper
is om één of meer geselecteerde regels bewust naar HH te verplaatsen zodat de
wholesale-drempel wordt gehaald en de TOTALE bestelling goedkoper wordt.

Dat gebeurt met een kleine optimalisatieberekening. Eén productregel wordt niet
half over twee leveranciers verdeeld.

MATCHING
Primair:
categorie + exacte productcode

Huidige database:
- 104 exacte HH ↔ Emlin productcode-matches
- alle 104 hebben dezelfde packgrootte

Voorbeelden:
RT10
BC10
CU50
TSM10

Daarom zijn deze regels zeer geschikt voor automatisch verdelen.

BESTAANDE MANDJES
Slim bestellen synchroniseert automatisch naar:
pure20_supplier_hub_draft_v3

De klassieke leveranciermandjes blijven dus bestaan.
Klik "Open leveranciermandjes →" om de gewone bestelmodus opnieuw te laden met
de automatisch verdeelde regels.

Handmatig bestaande regels die NIET door Slim bestellen worden beheerd blijven
in het draft-mandje staan. Slim bestellen onthoudt welke regels het zelf beheert.

PRIJZEN
Alle supplierprijzen worden live uit Supabase geladen.
Er staan geen leveranciersprijzen hardcoded in de JS.
