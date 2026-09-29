# PURE20 — Nederlands en Engels

Dit pakket bevat een automatische Nederlandse vertaling naast de volledige Engelse tekst. Nederlands is standaard. De knoppen NL en EN wisselen de bediening én artikeltekst; de gekozen taal wordt onthouden.

## Status

- 243 documenten uit de nieuwe PeptideDosages-collectie.
- De eerdere 41 PURE20-detailpagina’s zijn eveneens meegenomen.
- De inhoud is met een lokaal Engels-Nederlands vertaalmodel vertaald. Er zijn automatische controles en gerichte correcties uitgevoerd. Er is geen volledige taalkundige of medische eindredactie uitgevoerd. De zichtbare melding op de pagina’s vermeldt dit.
- Wetenschappelijke identificaties, bibliografische gegevens en oorspronkelijke afbeeldingen kunnen in de brontaal blijven staan.
- De Engelse tekst blijft beschikbaar om passages te vergelijken.
- De bestanden zijn lokaal gemaakt; dit pakket is nog niet live gepubliceerd.

## Uploaden

1. Pak de ZIP uit.
2. Upload de bestanden uit deze map naar de hoofdmap van je bestaande website-repository. Deze versie sluit aan op de huidige indeling: de detailpagina’s staan rechtstreeks in de hoofdmap, niet in library/.
3. Vervang de bestanden met dezelfde namen, waaronder knowledge.html, pure20-knowledge.css, pure20-knowledge.js en de detailpagina’s met een korte identificatie aan het einde van de bestandsnaam.
4. Voeg de nieuwe bestanden knowledge-existing.html en pure20-previous-* toe. Deze houden de eerdere collectie apart bereikbaar.
5. Laat je shop-, dashboard-, account- en databasebestanden staan. Upload ook de volledige map knowledge-assets uit dit pakket. Houd deze map intact; de afbeeldingen mogen niet los in de hoofdmap belanden.
6. Publiceer via de bestaande GitHub/Vercel-werkwijze.

De vercel.json met de library-doorverwijzing is ook inbegrepen; dit is dezelfde correctie als eerder geleverd. De nieuwe kennislinks gebruiken rechtstreeks de bestanden in de hoofdmap.

LEESMIJ.md en CONTROLE.json zijn overdrachtsdocumenten en hoeven niet online te staan.

## Vertaalmethode

Lokaal uitgevoerd met het Argos/OpenNMT Engels-Nederlands-pakket 1.8, gebaseerd op OPUS-MT. Bronvermelding model: Jörg Tiedemann en Santhosh Thottingal, “OPUS-MT — Building open translation services for the World”, EAMT 2020 (CC BY 4.0).

Doseringen of aanbevelingen zijn niet inhoudelijk herzien. De controle van getallen en eenheden is een vertaalcontrole, geen bevestiging dat bronclaims, protocollen of berekeningen klinisch juist zijn. Controleer betekenis, medische terminologie en brontekst voordat je de vertaling als definitieve publieke medische informatie gebruikt.

## Uitgevoerde controle

286 HTML-pagina’s (243 documenten, 41 eerdere profielen, 2 overzichten); 274 oorspronkelijke tabellen behouden. Geen ontbrekende interne bestandslinks of lokale afbeeldingsbestanden gevonden. De Engelse artikeltekst kan ongewijzigd worden teruggezet. Getallen zijn automatisch vergeleken; gevonden verschillen en diverse eenheden en wetenschappelijke identificaties zijn hersteld. Deze controle garandeert geen foutloze vertaling.

In het lokale voorbeeld zijn zoeken, doorklikken, NL/EN, taalkeuze onthouden en de mobiele weergave getest. Het uploadpakket gebruikt dezelfde pagina’s, met links aangepast aan de huidige hoofdmapindeling.
