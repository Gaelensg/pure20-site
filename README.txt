PURE20 BUSINESS DASHBOARD

Backend:
- Already installed in Supabase:
  * pure20_orders
  * pure20_customers
  * secure admin RLS
  * pure20_record_order RPC

Upload these files to the ROOT of the existing GitHub repository:
- dashboard.html
- dashboard.js
- order-recorder.js

Then add this one line BEFORE </body> in BOTH:
- index.html
- wholesale.html

<script src="order-recorder.js"></script>

After Vercel deploys:
Dashboard:
https://pure20-site.vercel.app/dashboard

What happens:
- When a customer clicks Copy order or WhatsApp, the order is recorded once.
- Repeating the exact same order within 10 minutes is ignored to reduce duplicates.
- Customers with an email address are automatically added/updated.
- Dashboard shows order count, order value, customer count, average order, popular products, retail vs wholesale, order status and customer notes.

Important:
- Old orders from before installing order-recorder.js cannot be reconstructed automatically.
- Custom domain setup still needs the domain name you want to use.
