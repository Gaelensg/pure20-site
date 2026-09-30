PURE20 — Supplier Hub met Emlin's

VERVANG in de root van Gaelensg/pure20-site:
- supplier-order.html
- supplier-order.css
- supplier-order.js

Wat is nieuw:
- Leverancierstabbladen:
  1. HHPeptide Factory
  2. Emlin's
- Emlin's bevat subtabbladen:
  - Peptides
  - Orals
  - Oliën
- Emlin's winkelmand blijft behouden wanneer je van categorie wisselt.
- HHPeptide houdt de bestaande $500 wholesale-logica.
- Emlin's gebruikt de enkele prijs uit de aangeleverde prijslijsten.
- Emlin's: 195 peptidevarianten, 79 orals, 67 oils.
- Alle prijzen worden pas na admin-login uit Supabase geladen.
- Vaste balk onderaan past zich aan per leverancier.
- Copy order vermeldt leverancier en categorie.

BELANGRIJK:
De Emlin PDF's tonen geen valuta. Daarom staat Emlin's in Supabase momenteel
zonder valuta-symbool. Zodra je bevestigt of dit USD, EUR, GBP, ... is, kan
currency_code/currency_symbol met één instelling worden ingevuld.

Database:
De nieuwe tabellen pure20_suppliers en pure20_supplier_catalogue zijn al live
aangemaakt en gevuld. De oude pure20_supplier_products-tabel is niet verwijderd,
dus je huidige live pagina blijft werken tot je deze frontendbestanden uploadt.
