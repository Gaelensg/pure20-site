PURE20 — BACTERIOSTATISCH WATER V1

UPLOAD / VERVANG IN GITHUB ROOT:

NIEUW:
- bac-water.js

VERVANG:
- shop.html
- product.html

NIET VERVANGEN:
- app.js
- product.js
- product-variant-sync.js
- product-catalogue.js
- product.css

GEDRAG PRODUCTPAGINA
- Keuze:
  • Zonder bacteriostatisch water
  • Met bacteriostatisch water
- Met BAC water: +€4,50 per geselecteerde vial.
- Vanaf 5 peptide-vials totaal in het winkelmandje: al het gekozen BAC water gratis.
- De weergegeven productprijs past mee aan.
- BAC water wordt 1-op-1 opgeslagen voor de vials die op dat moment worden toegevoegd.

GEDRAG WINKELMANDJE
- Houdt per productvariant bij hoeveel vials mét BAC water werden toegevoegd.
- Als een peptide-aantal later wordt verlaagd, wordt overtollig BAC water automatisch begrensd.
- Als er minder BAC water dan peptide-vials is, verschijnt een reminder.
- Met één knop kan BAC water worden aangevuld tot 1 per peptide-vial.
- Vanaf 5 peptide-vials wordt alle gekozen BAC water automatisch €0,00.
- BAC water krijgt een aparte regel in het winkelmandje.
- Subtotaal en totaal worden aangepast.
- Gekopieerde en WhatsApp-bestellingen bevatten de BAC-waterregel.
- Opgeslagen orderhistoriek bevat de BAC-waterregel.

CENTRALE INSTELLING IN SUPABASE
pure20_settings.store.data.bacWater:
{
  "enabled": true,
  "unitPriceEur": 4.5,
  "freeFromPeptideVials": 5
}

BAC Water zelf / Supplies & Solvents tellen niet mee als peptide-vial voor de gratisgrens.
