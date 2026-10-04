# PURE20 Supplier Sync v1

Gemaakt voor Gaelensg/pure20-site op basis van main commit
`e8f173d7efd504f29da01e86af14746c36dd7d05` (5 oktober 2026).

## Uploaden

1. Pak het ZIP-bestand uit.
2. Open in GitHub de root van **Gaelensg/pure20-site**, waar de huidige admin.html staat.
3. Upload samen deze **vijf bestanden**, met exact deze namen:

   | Bestand | Actie |
   | --- | --- |
   | admin.html | Vervangen |
   | admin.js | Vervangen |
   | supplier-sync-core.js | Nieuw |
   | admin-supplier-sync.js | Nieuw |
   | admin-supplier-sync.css | Nieuw |

4. Commit de bestanden en wacht op je gebruikelijke deployment. Als je repository sinds bovengenoemde commit veranderd is, vergelijk eerst de wijzigingen in admin.html/admin.js; overschrijf geen nieuwere eigen wijzigingen.
5. Herlaad Retail Admin volledig en meld je aan met je bestaande adminaccount. Open **SUPPLIER SYNC**.

Upload niet de hele map als submap: de vijf bestanden horen naast de bestaande admin.html. LEESMIJ, TESTVERSLAG en tests zijn documentatie, geen uploadvereisten.

`supabase-config.js`, `api.js`, `admin-inline-edit.js`, de quick-nav, foto- en COA-bestanden blijven zoals ze zijn. Er is geen SQL-migratie, nieuwe tabel of nieuwe API-sleutel nodig. Bestaande Supabase-rechten worden gebruikt en niet uitgebreid. Een geweigerde aanvraag blokkeert toevoegen; maak de suppliertabellen niet publiek om dat te omzeilen.

## Gebruik

- De tab laadt een preview; dit schrijft nog niets naar de database.
- Alleen actieve regels met suppliercategorie **peptides**, van actieve leveranciers uit pure20_suppliers, worden meegenomen. Orals en oils komen niet in aanmerking.
- De volledige retailcatalogus, inclusief verborgen producten, telt mee bij de vergelijking.
- Zoek of filter op status. Vink individuele regels aan, of gebruik **Selecteer toevoegbare zichtbare regels**. Dit selecteert alleen veilige nieuwe regels binnen het actuele filter. Reeds aangevinkte regels buiten het filter blijven geselecteerd; de toevoegknop toont het totale aantal. **Selectie wissen** wist alles.
- Klik **Geselecteerde regels toevoegen**. De module haalt eerst de actuele catalogi opnieuw op. Als de selectie veranderd of inmiddels toegevoegd is, wordt de hele actie afgebroken en moet je opnieuw selecteren.
- Na bevestiging verschijnen de nieuwe regels direct in Products. Ze zijn verborgen: `active=false`, `price_eur=0`, `stock=0`, `unit=vial`. Stel later in de bestaande producteditor zelf prijs, voorraad en zichtbaarheid in.
- Sla eventuele openstaande inline prijs-/voorraadwijzigingen eerst op. De sync blokkeert toevoegen zolang die wijzigingen zichtbaar openstaan.

## Betekenis van de statussen

| Status | Betekenis | Selecteerbaar |
| --- | --- | --- |
| Bestaat | Product/alias met dezelfde sterkte bestaat al, eventueel met een andere code | Nee |
| Nieuwe variant | Bekende retailfamilie met een ontbrekende sterkte | Ja |
| Nieuw product | Geen overeenkomende retailfamilie gevonden | Ja |
| Controleren | Onduidelijke sterkte/verpakking, ontbrekende informatie, codeconflict of onduidelijke bestaande productfamilie | Nee |

Nieuwe varianten erven letterlijk de bestaande PURE20-productnaam en categorie. Volledig nieuwe families krijgen categorie **Peptides**. Als de bestaande familie meerdere verschillende namen/categorieën gebruikt, kiest de module niet willekeurig: de regel krijgt Controleren.

## Matching en veiligheid

- Hoofdletters, spaties en leestekens in productnamen worden genormaliseerd; productcodes worden getrimd en zonder hoofdletterverschil vergeleken.
- Expliciete aliasen: BPC157/BPC 157, Epitalon/Epithalon, Adipotide/FTPP/FTPP(Adi), GHK-CU/GHK Cu. GHK-CU met retailcode CU en suppliercode CU50 wordt via naam + sterkte herkend.
- Sterktes in mg, g, mcg/µg/ug, iu en ml worden genormaliseerd. Bijvoorbeeld 5000mcg = 5mg. IU, ml en mg blijven verschillende eenheden.
- Herkenbare per-vial specificaties zoals `5mg*10vials` worden 5mg. Een packtotaal zoals `50mg/10vials`, concentraties en onduidelijke blendverhoudingen worden NIET berekend of geraden: Controleren.
- Een code die op een andere naam/sterkte wijst, blokkeert de kandidaat. Een code is nooit voldoende om een tegenstrijdige sterkte te negeren.
- Gelijke varianten uit meerdere leveranciers worden één kandidaat. Alle broncodes en specificaties blijven in de preview zichtbaar. De gekozen code is letterlijk een suppliercode; bij meerdere equivalente bronnen wordt de supplier-sort_order gebruikt, daarna supplier_key/code voor een stabiele keuze. Er wordt geen code verzonnen of uit de sterkte afgeleid.
- De verdachte naam 5-Amino-10MQ wordt expliciet geblokkeerd. Niet-geregistreerde aliasen worden niet door fuzzy guessing gelijkgesteld. Bekijk nieuwe productfamilies daarom vóór selectie.
- De write is één INSERT-batch naar pure20_products. Er zijn geen updates, upserts, deletes of writes naar suppliers. Bestaande product-ID's worden niet gebruikt.
- Nieuwe rijen krijgen een deterministische SHA-256-ID per genormaliseerde familie + sterkte. De bestaande primary key blokkeert dezelfde variant bij gelijktijdige syncs en herhaalde pogingen. Dubbele klikken zijn daarnaast in de interface geblokkeerd.
- De teruggestuurde rijen en veilige velden moeten exact overeenkomen voordat succes wordt getoond. Bij een onzekere netwerkrespons wordt nooit automatisch opnieuw geschreven: eerst preview vernieuwen.
- De module bewaart de bestaande opslaghandlers. In admin.js zijn alleen zeven regels toegevoegd om bevestigde nieuwe producten in de productlijst op te nemen, zonder pagina-reload.

## Grenzen en eerste live controle

De 22 automatische tests en de browsercontrole gebruiken een gesimuleerde database. De openbare retail-API is read-only gecontroleerd; de echte suppliercatalogus vereist een adminsessie. Er zijn geen productieproducten toegevoegd of veranderd, en dit pakket is niet gepusht of gedeployed.

Controleer na upload met je eigen adminsessie of de tellers en brongegevens kloppen. Onbekende specificaties blijven veilig geblokkeerd. De bestaande adminrol moet SELECT op alle drie tabellen hebben (inclusief verborgen retailregels) en INSERT + SELECT op pure20_products. De module controleert de bestaande `is_pure20_admin`-functie; RLS blijft de databasebeveiliging.

De dubbele-ID-bescherming geldt voor deze syncmodule. Er wordt geen algemene unieke naam/sterkte-constraint aan de database toegevoegd. Een andere import of handmatige toevoeging die exact tussen de laatste controle en de INSERT schrijft, valt buiten die bescherming. Voer daarom geen andere catalogusimport of handmatige producttoevoeging tegelijk uit. Nieuwe, nog onbekende naamaliasen vragen menselijke controle.

Terugdraaien van de interface: herstel admin.html en admin.js vanuit de vorige GitHub-versie en verwijder de drie nieuwe bestanden. Dit verwijdert geen eerder door jou geïmporteerde producten.
