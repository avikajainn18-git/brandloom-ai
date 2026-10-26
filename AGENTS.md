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

The A3.1 authentication and campaign checkpoint is complete. The next authorized implementation task is the remaining **A3: approved-reference management** work. Do not begin it unless explicitly requested.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
