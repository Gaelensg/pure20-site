PURE20 variant photo editor v8

FIXT:
1. 'Foto uploaden' deed niets op iPhone/Safari.
2. De module zei 'Open een bestaand product' terwijl een bestaande variant open stond.

WAT IS VERANDERD
- De file picker gebruikt nu een echte <label for="variantPhotoFile">.
- De file input blijft technisch aanwezig (niet display:none), wat betrouwbaarder is op iOS.
- De exacte variant wordt zelf in Supabase gezocht via:
  product_name + variant + code
  wanneer prodId niet beschikbaar is.
- Na openen moet de status nu bijvoorbeeld worden:
  Klaar voor upload: HGH 191AA · 10iu.

UPLOAD / VERVANG:
- admin.html
- variant-photo-editor.js
- variant-photo-editor.css

Daarna Vercel laten deployen en /admin volledig sluiten/heropenen.
