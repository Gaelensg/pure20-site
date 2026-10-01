PURE20 LIST IMAGES — DIRECT LOAD v2

Deze versie lost de loader/cache-problemen op.

UPLOAD / VERVANG:
- admin.html
- shop.html
- admin-product-thumbnails.js
- product-catalogue.js
- supabase-config.js

BELANGRIJK:
admin.html laadt admin-product-thumbnails.js nu RECHTSTREEKS.
shop.html laadt product-catalogue.js + product-catalogue.css nu RECHTSTREEKS.
Alle URLs gebruiken de nieuwe unieke cacheversie:
20261001-list2

Wat je na deploy moet zien:

ADMIN > PRODUCTEN
- HGH 191AA 10iu heeft een thumbnail
- HGH 191AA 12iu heeft een thumbnail
- HGH 191AA 15iu heeft een thumbnail

SHOP
- maar één thumbnail bij HGH 191AA
- de andere sterktes krijgen alleen uitlijning/spacer
- productpagina blijft per gekozen sterkte wisselen

De foto's voor HGH 10iu, 12iu en 15iu staan al daadwerkelijk in Supabase.
