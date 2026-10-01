PURE20 PHOTO V12

Vervang ALLEEN admin.html.

Dit is bewust anders dan de vorige fixes:
- de file input heeft rechtstreeks een onchange-handler in de HTML;
- preview gebruikt FileReader, niet URL.createObjectURL;
- SAVE PRODUCT heeft rechtstreeks een onclick-handler;
- die handler blokkeert de oude admin.js-saveflow zodat er maar één save gebeurt;
- foto wordt geüpload naar pure20-products;
- image_url wordt rechtstreeks op de exacte pure20_products variant opgeslagen.

CONTROLE:
In Edit product moet bovenaan het fotoblok staan:
PRODUCTFOTO V12

Als je een foto kiest:
1. de preview verschijnt DIRECT;
2. status wordt 'Nieuwe foto geselecteerd ... Preview OK';
3. knop wordt 'SAVE PRODUCT + FOTO'.

Als PRODUCTFOTO V12 niet zichtbaar is, draait de nieuwe admin.html niet.
