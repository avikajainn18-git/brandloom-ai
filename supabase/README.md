# Supabase foundation

This directory contains the version-controlled PostgreSQL migrations for Brandloom AI. Phase A2 establishes the relational schema and protected baseline; Phase A3.1 adds authenticated campaign ownership policies; Phase A3.2 adds campaign-scoped brand-reference policies; Phase A4 adds campaign-scoped asset policies; Phase B2 adds campaign-scoped review-run, finding, and evidence policies.

## Local configuration

Copy `.env.example` to `.env.local` and fill in the values from a Supabase project:

```text
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

The application reads the configured project URL and publishable key from `.env.local`. Never commit `.env.local`, a service-role key, or any other secret.

## Applying the migration

Apply migrations through the Supabase CLI after linking the intended project, or through the SQL editor only after reviewing the exact SQL. The application does not apply migrations automatically.

After applying it, verify the migration in the Supabase dashboard by checking:

- The nine tables exist under the `public` schema.
- Foreign keys, constraints, indexes, enums, and timestamp triggers exist.
- RLS is enabled on every table.
- Anonymous users have no access. Authenticated users can access only their campaigns and brand references attached to those campaigns.

For Phase A3.1, review `migrations/20261026010000_campaign_ownership.sql` before applying it. It adds `campaigns.owner_id`, stops if existing campaigns cannot be assigned an owner, and adds authenticated-user-only select, insert, and update policies for campaigns.

For Phase A3.2, review `migrations/20261027000000_brand_reference_ownership.sql` before applying it. It adds authenticated-user-only select, insert, and update policies for `brand_references` when the related campaign is owned by the authenticated user.

For Phase A4, review `migrations/20261027010000_asset_ownership.sql` before applying it. It adds authenticated-user-only select, insert, and update policies for `assets` when the related campaign is owned by the authenticated user. The existing `assets` table has no filename column; `.txt` filenames are used during import, while extracted text is persisted in `text_content`.

For Phase B2, review `migrations/20261027020000_review_ownership.sql` before applying it. It adds authenticated-user-only select, insert, and update policies for `review_runs`, insert/select policies for `findings`, and insert/select policies for `finding_references`. Each policy verifies campaign ownership through the review run and, for findings/evidence, verifies that affected assets and cited references belong to the same campaign.

## Schema decisions

- Statuses use PostgreSQL enums so application and database values remain predictable.
- `brand_references.precedence` is optional. Higher numeric values take precedence; equal or null values do not resolve a conflict and must be routed to human review later.
- Finding evidence and ticket relationships use join tables because a finding or ticket can cite multiple references and affect multiple assets.
- Delete relationships use `restrict` to avoid silently removing review history. Revision history will be added with the correction workflow.
- Review-run summary counts are stored as scalar fields. The schema does not store the entire application state in a JSON document.

## Access-control boundary

RLS denies access through Supabase's anonymous and authenticated Data API roles unless a narrowly scoped policy grants it. Campaign operations use authenticated campaign ownership policies. Brand-reference, asset, and review operations additionally require the related campaign to belong to the authenticated user; the relevant migrations must be applied before hosted persistence can be accepted.

The service-role key is not part of the browser or current application configuration. If a future server-only administrative operation requires it, it must be isolated to server code and documented separately.

## Auth dashboard configuration

Enable Supabase Auth email/password sign-in. If **Confirm email** is enabled, sign-up returns a confirmation message and the user must open the email before signing in. Add these redirect URLs under Supabase Auth URL Configuration:

- `http://localhost:3000/auth/callback`
- `http://127.0.0.1:3000/auth/callback`
- The equivalent callback URL for the deployed application

Set the Site URL to the URL used for the current environment. The app uses the request origin when creating confirmation links and exchanges the callback code server-side.

The application protects workspace routes with Next.js `proxy.ts`, verifies sessions server-side with Supabase Auth, and performs a second `getUser()` check in the workspace/data-access layer. No browser-supplied user ID is trusted for ownership.

## TypeScript clients

- `lib/supabase/client.ts` creates a typed browser client using the public publishable key.
- `lib/supabase/server.ts` creates a typed server client with Next.js cookie handling and is marked server-only.
- `lib/data-access/database.ts` exposes the typed server client and table helper types. Campaign, brand-reference, asset, and review persistence remains in focused server-side modules.
- `lib/supabase/database.types.ts` is the checked-in schema contract for this migration. Regenerate or update it when migrations change.
