# Supabase foundation

This directory contains the version-controlled PostgreSQL migrations for Brandloom AI. Phase A2 establishes the relational schema and protected baseline; Phase A3.1 adds authenticated campaign ownership policies.

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
- No anonymous or authenticated public policies exist yet.

For Phase A3.1, review `migrations/20261026010000_campaign_ownership.sql` before applying it. It adds `campaigns.owner_id`, stops if existing campaigns cannot be assigned an owner, and adds authenticated-user-only select, insert, and update policies for campaigns.

## Schema decisions

- Statuses use PostgreSQL enums so application and database values remain predictable.
- `brand_references.precedence` is optional. Higher numeric values take precedence; equal or null values do not resolve a conflict and must be routed to human review later.
- Finding evidence and ticket relationships use join tables because a finding or ticket can cite multiple references and affect multiple assets.
- Delete relationships use `restrict` to avoid silently removing review history. Revision history will be added with the correction workflow.
- Review-run summary counts are stored as scalar fields. The schema does not store the entire application state in a JSON document.

## Access-control boundary

RLS with no policies denies access through Supabase's anonymous and authenticated Data API roles. This is intentionally safer than adding unrestricted policies for development. Before campaign or reference CRUD is exposed, the project must implement authentication or another secure identity strategy, define campaign ownership/membership, add narrowly scoped policies, and verify them with authenticated and unauthenticated tests.

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
- `lib/data-access/database.ts` exposes the typed server client and table helper types. It intentionally contains no campaign, reference, asset, review, or ticket CRUD until later phases.
- `lib/supabase/database.types.ts` is the checked-in schema contract for this migration. Regenerate or update it when migrations change.
