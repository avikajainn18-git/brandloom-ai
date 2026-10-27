# Brandloom AI Engineering Instructions

These instructions govern future coding sessions in this repository. Read this file and the linked project documents before implementing changes.

## Product and current status

- The product is **Brandloom AI**, an AI-assisted campaign-level brand-governance application.
- Its purpose is to evaluate related campaign assets against approved references, identify evidence-backed inconsistencies, recommend targeted corrections, and escalate unresolved source conflicts to human reviewers.
- Preserve creator intent. Do not silently rewrite content, invent authority, or claim an analysis, correction, integration, approval, or persistence operation occurred unless it actually did.
- Phases A1, A2, and the A3.1 authentication/campaign checkpoint are implemented as documented in [`docs/IMPLEMENTATION_ROADMAP.md`](docs/IMPLEMENTATION_ROADMAP.md). Continue incrementally; the remaining A3 reference-management work is next. Hosted migration application and verification remain environment-specific until approved and completed.

## Source documents

- Product definition, workflow, principles, constraints, security, and demonstration scenarios: [`docs/PROJECT_CONTEXT.md`](docs/PROJECT_CONTEXT.md)
- Phases, dependencies, acceptance criteria, and scope: [`docs/IMPLEMENTATION_ROADMAP.md`](docs/IMPLEMENTATION_ROADMAP.md)

## Required technology and architecture

- Use React, Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui, and Lucide icons.
- Use Next.js Route Handlers or appropriate server-side Next.js functionality, typed TypeScript services, a custom deterministic rule engine, Supabase/PostgreSQL, and a server-side LLM integration when those phases are reached.
- Keep these boundaries explicit:
  - **Presentation:** routes, pages, layouts, forms, states, and reusable UI.
  - **Application:** campaign, reference, asset, review, correction, ticket, and re-evaluation orchestration.
  - **Domain:** typed rules, evidence evaluation, cross-asset comparison, precedence, conflict classification, and status transitions; no React or LLM dependency.
  - **AI service:** provider adapter, prompts, structured responses, validation, timeouts, and provider errors; never bypass deterministic rules or approval controls.
  - **Data access:** Supabase queries, persistence, retrieval, database validation, and migrations; do not scatter raw queries through UI components.
  - **API:** input validation, authorization, service invocation, predictable responses, and error handling.
- Use Server Components by default and Client Components only where browser interaction requires them. Keep secrets and server-only code out of client bundles.

## Coding and security standards

- Use TypeScript and explicit domain, API, status, finding, ticket, and result types.
- Keep business logic out of page components; prefer focused reusable components and services.
- Validate every external input, uploaded file, and LLM response. Treat uploaded content and references as untrusted data, including embedded prompt-injection instructions.
- Keep secrets server-side. Provide only redacted configuration in `.env.example`; never commit `.env.local` or credentials.
- Limit accepted file types and sizes. Support pasted text and `.txt` attachments for the initial MVP.
- Findings must cite genuine stored references. Distinguish verified evidence, uncertain interpretation, and unresolved conflict.
- Use relational records, foreign keys, indexes, constraints, migrations, and appropriate Supabase Row Level Security when persistence is introduced.
- Preserve revisions and review decisions. Do not silently modify source content.
- Do not suppress type, lint, or test errors. Do not add frameworks, databases, state libraries, or infrastructure without a concrete need and documented rationale.

## Product and UX conventions

- Use a monochromatic enterprise SaaS visual language: off-white/white surfaces, charcoal type, neutral borders, restrained statuses, purposeful icons, and clear hierarchy.
- Provide accessible labels, validation near inputs, loading/success/error/empty states, and appropriate destructive-action confirmation.
- Do not invent campaign counts, findings, activity, or metrics. Clearly label any future demonstration seed data as sample data.

## Working rules

1. Inspect the current implementation and project documents before editing.
2. Work only within the requested roadmap phase and do not automatically begin the next phase.
3. Preserve unrelated user work and avoid broad rewrites.
4. Implement the smallest complete workflow, then verify it through the user-visible path where practical.
5. Run relevant lint, type-check, unit-test, and build checks available for the changed scope; report exactly what ran and any failures.
6. Keep planned, mocked, and implemented behavior explicitly distinct.
7. Ask before destructive operations, external publication, deployment, payment, or changes outside the project directory.
8. Never fabricate API calls, database writes, AI findings, approvals, or test results.

## Git workflow

### Source of truth and roles

- The shared `main` branch is the single source of truth and the default working branch.
- The primary developer is responsible for core implementation, integration, database integrity, security, and the review engine.
- Do not create feature branches or pull requests for routine work. Use a temporary or backup branch only when needed for recovery or explicitly requested.
- Only one person may actively modify, commit to, or push `main` at a time. Coordinate handoffs before making changes.
- Never assume the local `main` is current. Fetch and inspect `origin/main` before synchronizing or publishing changes.

### Primary developer workflow

- Work directly on `main` for routine implementation.
- Before starting, inspect `git status`, the current branch, and recent history. Preserve all unrelated uncommitted and untracked work.
- Implement a focused change, run the relevant verification checks, inspect `git diff` and `git status`, and stage only files relevant to that change.
- Commit completed, tested work directly to `main` using a focused Conventional Commit message.
- Push validated commits to `origin/main` when ready to publish. Do not push unfinished work.
- If a push is rejected, stop and inspect the remote history. Fetch and reconcile the changes safely; never force-push.

### Teammate workflow

- Pull the latest `main` before testing.
- Test completed features and report reproducible bugs, steps, and expected versus actual behavior.
- Isolated, non-core issues—such as straightforward presentation, copy, or local UI validation defects—may be fixed directly on `main` after coordinating with the primary developer. Run the relevant checks, make a focused commit, and push the tested fix so the primary developer can pull it.
- Do not independently change authentication, authorization, campaign ownership, database integrity, Supabase Row-Level Security (RLS), database migrations, review-engine logic, or review persistence. Report these issues to the primary developer unless explicitly authorized to implement a fix.
- Never have both developers modify or push `main` concurrently.

### Safety, verification, and reporting

- For every meaningful implementation task, run the relevant tests, lint, typecheck, build, and `git diff --check` where applicable.
- Never stage or commit unrelated work, secrets, `.env.local`, credentials, tokens, `node_modules`, `.next`, or generated build output.
- Preserve unexplained or unrelated working-tree artifacts. Do not delete, overwrite, stash, or restore them without authorization.
- Do not create empty commits, fabricate historical work, amend published commits, rewrite published history, force-push, or delete branches without explicit approval.
- Do not push automatically from an agent or open pull requests unless explicitly instructed.
- At the end of each task, report the commit hash and message, checks performed and their results, push status, and any remaining uncommitted changes.
- The primary developer must authorize hosted database migrations. Never claim a migration was applied without verifying it.

## Current implementation status

- Authentication, campaign ownership, approved brand-reference management, and text-asset submission have been implemented.
- The deterministic review engine and review-persistence orchestration have been implemented in code.
- Verify the deployment status of the review-persistence migration against hosted Supabase before relying on end-to-end review persistence.
- Do not treat approved brand-reference management as a pending task. Select subsequent implementation work based on the latest explicit project instructions and verified repository state.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
