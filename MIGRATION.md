# Next.js migration security/configuration notes

This change is a security/configuration patch to the existing migrated storefront. The Bengali storefront, admin features, checkout, Supabase tables, Auth users, Storage, policies and stored rows are preserved. No database reset, table recreation, seed, or schema migration is required.

## Security changes

- The entire `/admin` surface now renders the existing Merchant Login screen until server authorization confirms a merchant. There is no guest-accessible admin overview or storage route.
- Every order-management request is checked on the server with the Supabase Auth user plus the existing `ADMIN_EMAILS` allowlist and/or `merchants` table. `GET /api/orders?all=1` and order updates require merchant authorization.
- The former public `?ids=` and `?search=` order queries no longer return data. Customer tracking uses a random, signed order-access token issued at checkout and stored on the customer's device. It is verified server-side against the existing order record; a LocalStorage order ID is not accepted as authorization.
- Tracking responses contain only order ID/date, purchased line items, delivery/total and status. They omit customer name, phone, address, payment/TrxID, customer note and merchant note. For recovery on a different device, the existing tracking screen requires both the exact order ID and the phone number used at checkout and returns the same limited projection.
- The tracking signature key uses `ORDER_ACCESS_TOKEN_SECRET` when configured, otherwise the server-only `SUPABASE_SERVICE_ROLE_KEY`. No tracking column or table changes were made.
- The checked-in `.env.production` file that referenced the old Supabase project was removed. Environment files other than `.env.example` are ignored by Git.

## Current Supabase project

`.env.example` points to the requested current project. Configure the matching values in Vercel for the deployment environment; do not place the service-role key in any `NEXT_PUBLIC_*` variable:

- `NEXT_PUBLIC_SUPABASE_URL=https://lljorpbhxboobynksfxp.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — current project's public anon/publishable key
- `SUPABASE_SERVICE_ROLE_KEY` — current project's service-role key; server-only and required by privileged database/Storage API operations
- `ADMIN_EMAILS` — optional comma-separated merchant bootstrap email list; existing authorized rows in `merchants` also work
- `ORDER_ACCESS_TOKEN_SECRET` — optional independent, stable random secret for order tokens; if omitted the server-only service-role key is used
- `NEXT_PUBLIC_SITE_URL` — production origin for canonical metadata
- `RESEND_API_KEY`, `RESEND_FROM_EMAIL` — optional merchant order email notifications

No credential values are embedded in application code. The current project's anon and service-role keys were not available to this build environment, so they must be entered in Vercel before live Auth/database operations can succeed. Never publish the service-role key or copy it into browser code.

## Preserved behavior / known limitation

Existing products, categories, settings, coupons, stock, delivery calculations, payment methods, checkout email and admin order workflows continue to use the existing tables. The existing stock updates span multiple rows and order insertion without a database transaction/RPC; this patch does not change that legacy behavior or alter the database schema.
