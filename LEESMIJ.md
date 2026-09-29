# PURE20 — uitbreiding van het kennisgedeelte

Deze bestanden zijn gereed voor integratie in de bestaande PURE20-site. Ze zijn lokaal getest en nog niet naar GitHub of de live website gepubliceerd.

## Wat is aangepast

- 243 pagina’s uit het aangeleverde PeptideDosages-archief in de bestaande PURE20-vormgeving: warme lichte achtergrond, zwarte typografie, dunne lijnen en sobere indeling.
- 205 documenten in de kenniscollectie en 38 pagina’s in het afzonderlijke bronarchief. Dat bronarchief bevat onder meer de auteurs-, categorie- en beleidspagina’s van de oorspronkelijke website; deze gelden niet als PURE20-beleid.
- Zoeken op naam, paginatitel en sterkte; filters voor artikelen, protocollen, mengsels, combinaties, gidsen en bronarchief.
- Nederlandse bediening als standaard en Engelse bediening als keuze; de keuze wordt in de browser onthouden.
- De volledige inhoud van de 243 documenten is nog Engels. De taalkeuze vertaalt uitsluitend de bediening. Een volledige Nederlandse inhoudelijke vertaling is niet inbegrepen.
- 274 tabellen. Alle celteksten zijn automatisch met het bronarchief vergeleken en komen overeen.
- 356 lokale afbeeldingen. Afbeeldingen die niet beschikbaar waren verwijzen naar de bron; ze zijn niet nagemaakt.
- Bronverwijzingen, auteursnamen, context en waarschuwingen behouden. Geen nieuwe medische beoordeling of klinische validatie.
- Aanmeldknoppen om documenten op de bronsite op te slaan en Pure Lab-leverancierslinks verwijderd uit de leesversie. Bronafbeeldingen kunnen nog hun oorspronkelijke merk bevatten.
- Interactieve broncalculators zijn alleen als documentatie beschikbaar, met verwijzing naar de bronsite.
- De eerdere PURE20-collectie van 41 detailpagina’s is als aparte kopie opgenomen onder existing/. De eerdere pagina’s op de live website worden niet overschreven door dit pakket.

## Upload naar de bestaande website

1. Pak de ZIP uit.
2. Plaats de INHOUD van de map PURE20-knowledge-update in de hoofdmap van de bestaande website-repository.
3. Vervang knowledge.html. Voeg pure20-knowledge.css, pure20-knowledge.js, knowledge-index.json en de mappen library/, knowledge-assets/ en existing/ toe. Houd de mappenstructuur intact.
4. Laat de bestaande shopbestanden, beheerschermen, database-instellingen en vercel.json staan. Er is geen databasewijziging nodig.
5. Publiceer via de bestaande GitHub/Vercel-werkwijze. Het overzicht blijft bereikbaar op /knowledge (met de bestaande cleanUrls-instelling).

LEESMIJ.md, knowledge-build-report.json en VERIFICATIE.json zijn overdrachtsdocumenten en hoeven niet gepubliceerd te worden.

## Controles

- Alle nieuwe lokale bestandslinks en afbeeldingspaden gecontroleerd: geen ontbrekende bestanden.
- Alle 274 tabellen cel voor cel vergeleken met de brondata: identiek.
- Browser: zoeken op “retatrutide 10” toont het juiste protocol; de detailpagina opent; Engelse taalkeuze blijft behouden op de detailpagina; Nederlandse taalkeuze werkt.
- Browser: bronarchief toont 38 documenten; lege zoekresultaten en wissen werken; standaardcollectie toont 205 documenten.
- Weergave bekeken op 390 pixels en 1280 pixels breed; geteste protocolpagina heeft geen horizontale pagina-overloop. Brede tabellen hebben een eigen scrolgebied.
- Geen browser-consolefouten bij de geteste protocolpagina.
- Niet onafhankelijk gecontroleerd: medische juistheid, alle externe referenties en veranderingen aan de live website sinds de eerdere PURE20-bestanden.

De volledige oorspronkelijke bronexport met dekking en downloadfouten blijft apart beschikbaar in peptidedosages-knowledge.zip.
