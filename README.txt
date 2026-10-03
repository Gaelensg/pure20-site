PURE20 SUPPLIER COMPARE V1

UPLOAD / VERVANG IN GITHUB ROOT:
- VERVANG: supplier-order.html
- NIEUW: supplier-compare.js

NIET VERVANGEN:
- supplier-order.js
- supplier-order.css
- supabase-config.js

WAT JE KRIJGT
Bovenaan Supplier Hub:
- BESTELLEN
- PRIJZEN VERGELIJKEN

Vergelijkmodule:
- live HHPeptide Factory vs Emlin's
- matching primair op categorie + exacte productcode
- conservatieve fallback op productnaam + specificatie
- HH retail én wholesale zichtbaar
- toggle voor verschilberekening op HH retail of HH wholesale
- Emlin's catalogusprijs
- prijs per vial / unit
- absoluut prijsverschil per unit
- procentueel verschil
- markering welke leverancier de lagere prijs heeft
- waarschuwing wanneer packgroottes verschillen
- zoeken
- categorieën
- alleen matched producten aan/uit
- sorteren op product, grootste verschil, HH lager of Emlin's lager

BELANGRIJK
- Leveranciersprijzen staan NIET hardcoded in deze module.
- Data wordt pas na ingelogde adminsessie uit pure20_suppliers en
  pure20_supplier_catalogue geladen.
- Bestaande supplier bestelmandjes / supplier-order.js zijn niet aangepast.
- HH wholesale threshold wordt live uit pure20_suppliers gelezen.
- Beide huidige leveranciers gebruiken USD, dus er is geen FX-conversie nodig.

Matching:
De huidige catalogi gebruiken bij veel overlappende peptides dezelfde codes,
zoals RT10, BC10, CU50, TSM10 enz. Daardoor is de vergelijking voor die regels
exact en niet gebaseerd op een gok uit de productnaam.
