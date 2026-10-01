PURE20 PHOTO V14

Vervang ALLEEN admin.html.

Waarom v13 faalde:
Op iPhone werd prodId/productnaam niet betrouwbaar meegegeven aan de losse
fotocode, hoewel de productrij wel correct geopend was.

V14:
- onthoudt exact het data-id van de productrij zodra je erop tikt;
- gebruikt DAT id bij Save;
- haalt de volledige pure20_products-rij uit Supabase;
- productnaam, variant, code en categorie komen dus rechtstreeks uit de database;
- er wordt niets meer afgeleid of geraden.

Controle:
Je moet PRODUCTFOTO V14 zien.

Verwachte flow:
1. tik product in Producten
2. kies foto
3. preview verschijnt
4. SAVE PRODUCT + FOTO
5. status:
   Exacte variant ophalen…
   Foto uploaden voor HGH 191AA 10iu…
   Productgegevens opslaan…
   Opgeslagen ✓ HGH 191AA 10iu

Als je het editvenster al open had vóór de V14-deploy:
SLUIT HET VENSTER EERST en tik de productvariant opnieuw aan, zodat V14 het rij-ID kan onthouden.
