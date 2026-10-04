# Verificatie — 5 oktober 2026

**Resultaat: 22 automatische tests geslaagd, 0 fouten.**

## Matching

- Gevraagde naamaliasen, inclusief GHK-CU met verschillende codes.
- Bestaande verborgen producten tellen mee.
- Nieuwe sterktes erven exacte retailnaam en categorie.
- Gelijke suppliervarianten worden samengevoegd; exacte broncode blijft behouden.
- Orals, oils, inactieve bronnen en onbekende leveranciers uitgesloten.
- mg/g/mcg-omrekening; IU en ml blijven apart.
- Blends, packtotalen, ontbrekende of tegenstrijdige sterktes geblokkeerd.
- Verdachte naam 5-Amino-10MQ en ongeschikte verpakkingen geblokkeerd.
- Conflicterende codes en onduidelijke bestaande families geblokkeerd.
- Geen mutatie van de ingelezen retail-/supplierobjecten.
- Opnieuw importeren geeft Bestaat.

## Toevoegflow met gesimuleerde Supabase-client

- Alleen geselecteerde veilige regels worden geschreven; bestaande retailrijen blijven byte-voor-byte gelijk.
- Alle veilige defaults en sortering na bestaande producten gecontroleerd.
- Dubbelklikken veroorzaakt één INSERT.
- Twee gelijktijdige syncsessies voegen dezelfde varianten niet dubbel toe.
- Gewijzigde brongegevens of inmiddels bestaande varianten blokkeren de selectie.
- Gepagineerde reads werken ook wanneer de server minder rijen teruggeeft dan gevraagd.
- Geen volledige telling, readfout of ontbrekende adminbevoegdheid blokkeert toevoegen.
- RLS-fouten tonen geen vals succes.
- Verloren respons na een geslaagde INSERT veroorzaakt geen automatische retry; vernieuwen herkent de toegevoegde regels.
- Openstaande inline wijzigingen blokkeren toevoegen.
- Suppliergegevens met HTML worden als tekst getoond.

## Browsercontrole

De lokale testpagina gebruikt de aangepaste admin.html, de echte admin.js-tab-/productlijstlogica en de nieuwe module, met een testdatabase. Productfoto-/COA-scripts en overige externe integraties zijn niet onderdeel van deze browserfixture; hun bestaande code is niet gewijzigd.

- Desktop: SUPPLIER SYNC-tab, vier statustellers en selectie zichtbaar.
- Toevoegen: 2 geselecteerde testregels bevestigd; direct zichtbaar in Products als verborgen, €0, stock 0.
- Bestaande testregel blijft €39,99 en stock 9.
- Geen JavaScript-errors geregistreerd tijdens die flow.
- Mobiele viewport 390 × 844: leesbare kaarten, tellers in twee kolommen en knoppen onder elkaar. Gemeten contentbreedte 375px = viewport-contentbreedte 375px; geen horizontale pagina-overloop.
- Mobiel filter Nieuwe variant selecteert alleen de zichtbare veilige kandidaat.

## Statische controle

- Syntaxis: admin.js, supplier-sync-core.js en admin-supplier-sync.js geslaagd.
- Alle 7 inline JavaScriptblokken in admin.html gecompileerd zonder syntaxfouten.
- Git diff whitespace-controle geslaagd.
- De bestaande savefuncties zijn niet gewijzigd; alleen een afzonderlijke listener voor bevestigde nieuwe rijen is toegevoegd.
- Repository-main stond bij eindcontrole nog op dezelfde basiscommit.

## Reproduceren (optioneel, voor een ontwikkelaar)

De tests staan in `tests/`. De pure matchingtests vereisen alleen Node.js:

```sh
node --test tests/supplier-sync.test.cjs
```

De integratietests gebruiken `linkedom@0.18.13`. Installeer dit desgewenst in een aparte tijdelijke testmap en zet `PURE20_LINKEDOM` op het absolute pad naar die module:

```sh
PURE20_LINKEDOM=/absoluut/pad/naar/node_modules/linkedom node --test tests/supplier-sync*.test.cjs
```

## Niet uitgevoerd

Geen INSERT op de productiedatabase, geen live adminlogin, geen deployment. De werkelijke afgeschermde suppliergegevens en eventuele databasespecifieke triggers/constraints konden zonder adminsessie niet worden getest. De module stopt met een foutmelding als de database een aanvraag weigert.
