PURE20 HOME + ADMIN V4

Vervang in GitHub:
- index.html
- home.css
- home.js
- admin.html

Database is al voorbereid:
- pure20_settings.home bestaat.
- publieke homepage mag alleen de home-config lezen.
- alleen een geauthenticeerde PURE20-admin kan home-instellingen wijzigen.

NIEUW IN ADMIN
Er staat een vaste tab HOMEpagina naast Productpagina's.
Daar kun je per sectie NL en EN aanpassen:
- Hero
- Uitgelicht
- Knowledge
- Calculator
- Shop-kaart
- Wholesale
- Onderste CTA
- Footer

Klik "Homepagina opslaan" en open daarna "Homepagina bekijken ↗".

KLEUREN
De homepage gebruikt nu één rustiger warm-stone palet:
- basis: warm off-white
- surfaces: één lichte cream
- secondary surface: één stone-beige
- bijna-zwart als donker anker
- minder zuiver wit en minder concurrerende beigevarianten

Productfoto's in Uitgelicht blijven automatisch live uit Supabase komen.

EXTRA KLEURFIX
De homepage laadt niet langer /supabase-config.js, omdat dat bestand ook de
universele site-header + site-theme.css injecteert. Die laag botste met home.css.
De publieke Supabase URL/publishable key staan daarom rechtstreeks in index.html.
De bestaande site-gate blijft apart geladen.
