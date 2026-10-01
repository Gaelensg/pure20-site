PURE20 BAC WATER V2

UPLOAD / VERVANG:
- bac-water.js
- product.html
- shop.html

Wat v2 anders doet:
- BAC Water 3 ml / WAC3 is nu een ECHT product in het normale winkelmandje.
- Databaseprijs van WAC3 is centraal ingesteld op €4,50.
- Kiest iemand op de productpagina 'met bacteriostatisch water', dan wordt
  automatisch 1 × WAC3 toegevoegd per gekozen peptide-vial.
- Daardoor wordt BAC Water letterlijk als aparte winkelmandregel weergegeven.
- Minder dan 5 peptide-vials: €4,50 per BAC Water.
- Vanaf 5 peptide-vials: aanwezige BAC Water 3 ml wordt gratis weergegeven en
  uit het subtotaal/totaal gehaald.
- Bij te weinig BAC water verschijnt een reminder.
- De reminder kan het winkelmandje aanvullen tot 1 × BAC Water per peptide-vial.

BELANGRIJK:
De databasefout bij prijzen aanpassen is los hiervan al live opgelost:
pure20_products.image_url, image_alt_nl en image_alt_en mogen nu NULL zijn.
Je kunt dus opnieuw een productprijs opslaan zonder dat er een productfoto is.
