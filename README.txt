PURE20 Admin cache-proof v5

DIT IS DE FIX VOOR 'IK ZIE DE STERKTES NOG STEEDS NIET'.

De actuele GitHub-code bevat de sterktes al, maar admin.html laadde:
supabase-config.js
zonder versienummer. Safari kon daardoor de oude loader blijven cachen.

UPLOAD / VERVANG DEZE 4 BESTANDEN IN DE ROOT VAN GITHUB:
- admin.html
- admin-product-pages.js
- admin-product-pages.css
- supabase-config.js

admin.html laadt nu:
- supabase-config.js?v=20261001-5
- api.js?v=20261001-5
- admin.js?v=20261001-5

supabase-config.js laadt:
- admin-product-pages.js?v=20261001-5
- admin-product-pages.css?v=20261001-5

NA VERCEL DEPLOY:
1. sluit de bestaande admin-tab volledig
2. open /admin opnieuw
3. ga naar Product pages
4. tik een peptide open

BOVENAAN DE EDITOR MOET DAN STAAN:
STERKTES & FOTO'S
Afbeelding per variant

Daaronder verschijnen alle databasevarianten.

De Supabase-permissiefout voor pure20_compounds is al live opgelost.
