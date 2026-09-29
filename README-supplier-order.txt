PURE20 — private supplier order page

What is already configured:
- Private Supabase table: pure20_supplier_products
- 152 supplier price rows imported from the uploaded Excel file
- Row Level Security enabled
- Anonymous users have no table access
- Only authenticated PURE20 admins can read the table

Upload these 3 files to the ROOT of the existing Gaelensg/pure20-site repository:
- supplier-order.html
- supplier-order.css
- supplier-order.js

No existing file needs to be replaced.
Because vercel.json already has cleanUrls=true, the page will be available as:
/supplier-order

The page:
- requires the existing PURE20 admin login
- shows retail price by default and wholesale price in parentheses
- automatically switches the whole basket to wholesale pricing once the wholesale basket value reaches $500
- counts 1 quantity as 10 vials
- saves the draft basket locally on the device
- has search, +/- quantity controls, live totals and a wholesale progress bar
- can copy a formatted supplier order to the clipboard
- does not embed the private price list in the static files
