# Thirst

Next.js website, Supabase-backed admin dashboard, and POS.

## Production setup

1. Set the variables in [.env.example](.env.example) on the deployment host. Keep SUPABASE_SERVICE_ROLE_KEY server-only. Set APP_ORIGIN to the exact HTTPS website origin. For local development, use http://localhost:3000 as APP_ORIGIN.
2. For an existing database, apply [20261013_production_security.sql](supabase/migrations/20261013_production_security.sql) after the earlier migrations, then [20261013_performance.sql](supabase/migrations/20261013_performance.sql) in the Supabase SQL editor **before deploying this app version**. The earlier [company-settings migration](supabase/migrations/20261005_company_settings.sql) must also be installed; a 404 from `/rest/v1/company_settings` indicates a missing/exposed-schema configuration problem. For a new database, run [schema.sql](supabase/schema.sql), which includes both security and performance changes. Pause billing while deploying the migrations and app together, then refresh open POS tabs. Never restore the old policies/RPC to work around an error.
3. Verify existing staff roles before rollout. The migration links staff to confirmed Supabase Auth users by email and stores their immutable auth_user_id. Unmatched staff have no access. For a new installation, create the first confirmed Auth user in Supabase, then insert their staff profile with matching auth_user_id, role = 'admin', and status = 'active' using the SQL editor. Subsequent staff are created by an administrator in the app.
4. Serve over HTTPS. Run npm ci, npm test, npm run lint, and npm run build. Deploy the app, then test a real admin, manager, cashier, and inactive account against the deployed database before opening billing.

Set TRUST_PROXY=true only when the deployment proxy overwrites client-supplied X-Forwarded-For. Otherwise franchise submissions share a conservative limit. Rate keys are hashed; raw IPs are not stored. Public franchise submissions require the server key; direct anonymous inserts are disabled.

The migration is repeatable. New checks are NOT VALID so older data does not stop installation; new and changed rows must satisfy them. Review legacy phone formats and other invalid records before validating constraints across historical data. Back up the database before applying migrations.

## Access

| Role | Access |
| --- | --- |
| Admin | All dashboards, staff accounts, and company identity |
| Manager | Daily operations, billing, orders, CRM, inventory, reports, offers, gallery, franchise applications, notifications; no staff management or company-settings dashboard |
| Cashier | Billing, available products, own staff profile, and limited recent-customer lookup; no full CRM, reports, order administration, stock/settings/staff edits, or uploads |
| Inactive/non-staff/anonymous | Public website content only; no private API/data access or order RPC |

Roles and status come from database staff records, never user-editable Auth metadata. Private APIs verify bearer tokens and current membership on every request. RLS and restricted RPC grants also apply when a caller uses Supabase directly. Staff administration uses a server-only client and an administrator-checked transaction. Company settings are writable only by active admins. Administrators cannot remove their own access, and the last active administrator is protected.

Sessions remain signed in using the existing Supabase refresh behavior. **No inactivity timeout or forced periodic logout was added.** Disabled accounts immediately lose database/API permissions. Supabase project-level session settings remain under the project's configuration; the application does not override them.

## Order and browser protections

- Checkout validates products, price changes, quantities, stock, discounts, and payment method in one transaction. Prices, cashier attribution, bill number, customer linking, and loyalty accounting are authoritative in the database.
- A request UUID makes retries of the current sale idempotent. If a response is uncertain, the cart stays fixed and the same request can be retried. There is no direct-insert fallback. Bill numbers use an atomic sequence and Asia/Kolkata dates.
- Cancellation is manager/admin only and reverses stock/spend/points exactly once. Review historical accounting before voiding imported legacy sales.
- Private APIs enforce bounded JSON, field allowlists, role checks, same-origin browser requests, persistent request limits, generic backend errors, and no-store responses.
- Uploads accept PNG/JPEG/WebP up to 5 MB, restricted by role and storage policy. SVG uploads are blocked. Image optimization only fetches this project's public product-image bucket.
- Receipt HTML escapes stored text; printing uses a sandbox without scripts. Fresh CSP nonces authorize framework scripts. Inline event scripts, object embeds, and external framing are blocked. Existing inline styles, Maps, and fonts remain supported.

## Development and checks

Run npm ci, npm run dev, npm test, npm run lint, and npm run build.

## Performance and request flow

- Pages render immediately without an artificial loading screen. Poppins/Inter are served by Next.js instead of a Google Fonts CSS import. The small shared stylesheet is inlined using Next's `experimental.inlineCss` option to prevent streamed content painting with default browser layout; this trades separate CSS caching for roughly 32 KB of uncompressed CSS in HTML. CSP nonces and private no-store responses are preserved.
- Public menu data is server-rendered and cached for 60 seconds using **only the anonymous key**, availability/stock filters, and selected columns. Only public business settings are coalesced/cached in browser memory for 60 seconds. Neither public path loads the Auth SDK until it is needed. Billing and private permissions always use fresh database/API checks.
- The admin layout verifies staff on entry and rechecks on focus/sign-in. It retains that identity while navigating, and billing consumes it without a duplicate request. Every private API and RLS/RPC operation independently enforces current access; this UI identity is not an authorization cache.
- Dashboard and reports receive small PostgreSQL summaries rather than downloading order history. Reports use Indian time consistently; Daily is today, Weekly is seven days, Monthly groups the current year by month, and Yearly groups the current and previous two years. Totals and exports use the selected period. CSV details are fetched in batches only on export (up to 100,000 bills).
- Orders, CRM, and franchise lists request 25 rows at a time. Search/status filters apply in the database before pagination; customer totals are aggregated separately. Indexes cover chronological lists, customer order lookup, and rate-bucket cleanup. Rate-bucket housekeeping runs in small opportunistic batches, instead of scanning/deleting on every request.
- PDF/image-export libraries and charts load separately. Confirmed checkout does not wait for a catalogue refresh. Network waits are bounded to 15 seconds; uncertain checkout retries retain their request ID. **These are request timeouts, not session or inactivity timeouts.**
- Public contact form opens an email draft instead of delaying and falsely reporting successful delivery. The visitor sends it using their email app; existing WhatsApp contact remains available.

Place Vercel functions near the Supabase database region and your main customers. Check the actual Supabase project region before changing Vercel's function region; geography and real database latency cannot be inferred from local tests. `next dev` includes compilation overhead; measure a production build.

Browser measurements (cold browser cache, desktop and mobile with 4× CPU slowdown):

```powershell
$env:TEST_BASE_URL = 'http://127.0.0.1:3107'
$env:PERF_OUTPUT = '../performance-results.json'
# Optional: also click through the homepage gallery and review controls.
$env:PERF_PUBLIC_FLOW = '1'
node tests/browser-performance.mjs
```

The script records navigation/FCP/LCP, layout-shift entries, long tasks, transfer sizes, failed requests, and basic heading/button accessibility. These are lab samples, not field Core Web Vitals or a Lighthouse score. The raw layout-shift sum covers the sampled load only; INP requires real interaction/field measurement.

The authenticated browser flow uses fixtures and requires a **local test build** with non-secret public placeholder configuration. It intercepts Auth, API and database calls, so it never creates real sales or staff. Do not deploy the fixture build; hosting must build with its own real environment.

```powershell
$env:NEXT_PUBLIC_SUPABASE_URL = 'https://placeholder.supabase.co'
$env:NEXT_PUBLIC_SUPABASE_ANON_KEY = 'fixture-public-anon-key'
npm run build
npm run start -- --hostname 127.0.0.1 --port 3107
# In another terminal:
$env:TEST_BASE_URL = 'http://127.0.0.1:3107'
node tests/browser-admin-flow.mjs
```

The flow checks shared staff verification, navigation, cart preservation during connection failures, identical checkout retries, independent stock refresh, lazy PDF export, pagination/search, report ranges, and revoked access. The SQL tests separately execute real PostgreSQL permissions and transactions, including summaries with more than 1,000 sales. Deployed authenticated flows still require verification against your live Supabase project.

Tests exercise the APIs with mocked network calls and the real SQL schema/migration in embedded PostgreSQL (PGlite). They cover role bypass, anonymous access, deactivation, legacy policies, uploads, rate limits, rollback, idempotency, pricing, cancellation, request validation, CSP, and receipt escaping. They do not replace verification of the deployed Supabase project.

For the optional browser check, start a local production server:

```powershell
npm run start -- --hostname 127.0.0.1 --port 3107
# In another terminal:
$env:TEST_BASE_URL = 'http://127.0.0.1:3107'
node tests/browser-security.mjs
```

The check uses Chrome (set CHROME_BIN for another compatible executable). It verifies login hydration, blocked inline-script injection, unauthenticated dashboard redirects, private API rejection, caching, and fresh CSP nonces.

Run npm audit --omit=dev for the shipped runtime tree. Its current audit is clean. The complete audit still flags the linter's braces dependency chain (five high findings); the registry provides no patched compatible chain and recommends downgrading Next's lint preset. That downgrade is not applied. These development linting packages are not application runtime dependencies. Do not feed untrusted glob patterns into tooling.
