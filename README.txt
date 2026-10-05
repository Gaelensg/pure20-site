PURE20 SUPPLIER SMART ORDER SYNC V3

UPLOAD / VERVANG:
- supplier-auto-cart.js
- supplier-order.html

FIX:
Wanneer je in de gewone leverancierweergave op WISSEN drukt, werden alleen de
supplier-cart regels verwijderd. De gekoppelde Smart Order aantallen bleven in:
pure20_supplier_smart_qty_v1

Daardoor bleven producten in SLIM BESTELLEN:
- een aantal tonen
- geselecteerd gemarkeerd
- potentieel opnieuw in een suppliermandje verschijnen

V3 synchroniseert dit nu twee kanten op.

GEDRAG:
- Wis HH-mandje -> alleen de Smart Order regels die aan HH waren toegewezen
  worden ook op 0 gezet.
- Wis Emlin's-mandje -> alleen de aan Emlin's toegewezen Smart Order regels
  worden op 0 gezet.
- Het andere leveranciermandje blijft intact.
- Annuleer je de bevestiging bij Wissen, dan verandert Smart Order niets.
- Wanneer je terug naar SLIM BESTELLEN gaat, leest de module de actuele
  opgeslagen aantallen opnieuw in.
- 'Slimme lijst wissen' zet daarnaast alle zichtbare aantallen direct op 0
  en verwijdert de selected-markering.

De prijsoptimizer en supplierverdeling zijn verder niet gewijzigd.
