PURE20 PHOTO V13

Vervang ALLEEN admin.html.

Fix:
V12 controleerde de zichtbare productnaam vóór de bestaande variant uit Supabase
werd opgehaald. Op mobiel kon dat veld leeg zijn, waardoor:
'Product name is required.'

V13:
- haalt eerst de bestaande pure20_products rij op;
- herstelt automatisch product_name, variant, code en categorie;
- uploadt daarna de foto;
- slaat image_url op bij exact die variant.

Controle:
In de editor moet staan: PRODUCTFOTO V13

Flow:
1. Kies foto
2. Preview verschijnt
3. Druk SAVE PRODUCT + FOTO
4. Status doorloopt:
   Variant controleren…
   Foto uploaden naar Supabase…
   Productgegevens opslaan…
   Opgeslagen ✓
