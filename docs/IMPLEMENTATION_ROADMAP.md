cd# Brandloom AI Implementation Roadmap

This roadmap is the delivery plan for the product context in [`PROJECT_CONTEXT.md`](PROJECT_CONTEXT.md). Complete and verify each phase before starting the next. Phases A1 and A2 are implemented and verified locally; the remaining phases below are planned until completed and checked.

## Delivery rules

- Work within one requested phase/component at a time.
- Establish the smallest complete workflow before adding breadth.
- Keep deterministic review logic independent of React and LLM services.
- Preserve evidence, revisions, decisions, and actual statuses in persisted records.
- Distinguish implemented and tested behavior from planned or mocked behavior in code and documentation.
- Run the narrowest relevant checks first, then broader checks when practical; report exact commands and failures.

## Dependency order

The dependency chain is:

**A1 foundation → A2 persistence foundation → A3 campaigns/references → A4 assets → B1 shared findings → B2 deterministic rules → B3 cross-asset comparison → B4 review UI → C1 findings/evidence → C2 corrections/revisions → C3 conflict detection → C4 tickets → C5 decisions/re-evaluation → C6 review states → D1 provider integration → D2 structured semantic findings → D3 evidence/correction validation → D4 tone/claim analysis → D5 pipeline integration → E testing/refinement/deployment.**

Later items may refine earlier interfaces, but must not bypass their validation or approval controls.

## Phase A — Foundation and basic data management

### A1. Project setup, application shell, design system, and routing

**Scope:** Initialize the Next.js App Router TypeScript application, npm configuration, Tailwind/shadcn foundations, Lucide usage, shared monochromatic layout primitives, and initial navigation/routes.

**Acceptance criteria:** The app starts with documented commands; TypeScript and lint/build checks run; the shell has accessible navigation, page title/description conventions, loading/error/empty-state patterns, and no invented campaign data; server/client boundaries are intentional.

### A2. Supabase configuration, schema, and data-access foundation

**Scope:** Establish verified environment configuration, initial migrations, typed data-access modules, and protected access patterns for the entities needed by the implemented workflow.

**Acceptance criteria:** Configuration is documented in `.env.example` without credentials; migrations are version-controlled; data access is not scattered in UI code; constraints, indexes, foreign keys, and authorization/RLS approach are documented and tested for the implemented scope.

### A3. Campaign creation and approved-reference management

**Scope:** Create, retrieve, and manage campaigns and their approved references, including reference type, approval state, authority, and precedence where applicable.

**Acceptance criteria:** Valid campaigns and references persist and can be retrieved by campaign; invalid input is rejected near the relevant control and API boundary; source authority/precedence is explicit; no reference is treated as approved without an implemented approval state/action.

#### A3.1. Authentication and campaign ownership checkpoint

**Status:** Implemented and verified in code; the hosted ownership migration is applied and migration history is synchronized.

**Scope completed:** Supabase email/password sign-in, sign-up, sign-out, callback exchange, SSR session refresh through Next.js `proxy.ts`, protected workspace redirects, server-side user verification, campaign create/list/detail/update flows, input validation, and a separate ownership/RLS migration.

**Acceptance criteria:** Campaign operations use the authenticated server user, `campaigns.owner_id` is protected by authenticated-user policies, unauthenticated workspace access redirects to sign-in, and campaign records are not fabricated or accepted from browser-supplied owner IDs. Hosted migration history is synchronized and the campaign ownership policies are present.

#### A3.2. Campaign-scoped brand-reference management

**Status:** Implemented and verified against the current hosted project.

**Scope completed:** Authenticated users can list, create, inspect, and edit references for campaigns they own. Server-side validation, campaign ownership checks, campaign-scoped routes, explicit reference type, approval status, authority, and precedence fields, and the campaign-scoped RLS policies are implemented.

**Acceptance criteria:** Reference operations use the authenticated server user, reference records are constrained to owned campaigns in the application and RLS policies, invalid input is rejected at the action boundary, and reference retrieval/edit routes do not accept cross-campaign access through manipulated identifiers.

### A4. Text asset submission, `.txt` parsing, and persistence

**Scope:** Add campaign assets from pasted text and `.txt` attachments with title/filename and asset type, validate size/type/content, and persist retrievable assets and current revision information.

**Status:** Implemented and verified against the current hosted project.

**Scope completed:** Authenticated users can list, create, inspect, and edit text assets for campaigns they own. Pasted text and UTF-8 `.txt` imports are validated on the client and server, with a 1 MiB limit. The existing schema persists extracted text, title, type, and current revision metadata; it has no filename column, so no unsupported filename persistence is claimed.

**Acceptance criteria:** Valid text assets save and display after retrieval; invalid or oversized uploads fail predictably; content is treated as untrusted input; asset-to-campaign relationships and current revisions are retained; unauthorized campaign access is rejected by application checks and hosted RLS policies; no unsupported file-storage behavior is claimed.

## Phase B — Deterministic review

### B1. Shared finding data model

Define typed review runs, findings, evidence references, suggested corrections, severity, and statuses. Include distinctions for verified mismatch, uncertain result, and conflict requiring review.

**Status:** Implemented as a pure, deterministic domain core; persistence and UI integration remain later checkpoints.

**Scope completed:** Added framework-independent review input/result contracts, persistence-shaped review-run/finding/evidence records, explicit finding/evidence/conflict states, guarded status transitions, and a discount-percentage rule with approved-source precedence handling. Unit tests run locally without Supabase credentials or network access.

**Current limitation:** B1 evaluates explicit discount expressions only. It does not persist review runs/findings, create tickets, modify assets, or expose review results in campaign pages.

**Acceptance criteria:** Types and persistence/API contracts are explicit, reference identifiers resolve to supplied approved-reference inputs, status transitions reject invalid changes, and deterministic findings distinguish verified mismatches, uncertainty, and unresolved source conflicts.

### B2. Deterministic rule checking

Implement rules for objectively verifiable facts and terminology, including normalized comparison and clear source precedence behavior.

**Status:** Implemented as a server-only orchestration service; the hosted review ownership migration remains pending explicit approval/application.

**Scope completed:** The service verifies the authenticated user owns the campaign, loads campaign-scoped assets and approved references, maps them to the B1 domain contract, runs the deterministic engine, and persists review runs, findings, and evidence relationships. It preserves conflict-required-review states and serialized correction/evidence details. Failed writes mark an already-created run as failed when possible and never return a completed summary.

**Current limitation:** B2 does not create human-review tickets, expose review results in the UI, apply corrections, or add additional deterministic rule families. The prepared RLS migration must be applied before hosted review persistence can succeed.

**Acceptance criteria:** Rules run without React or an LLM; findings identify affected assets and genuine references; clear violations produce targeted corrections only when the correct value is supported; edge cases, ownership boundaries, persistence mapping, and failure handling are tested.

### B3. Cross-asset fact comparison

Compare applicable facts across related campaign assets and distinguish an asset mismatch from conflicting approved sources.

**Acceptance criteria:** The clear 20%-versus-25% scenario produces an evidence-backed mismatch; conflicting references do not get silently resolved; results retain review-run traceability.

### B4. Review results in the campaign interface

Connect review runs and deterministic results to campaign and asset views with actual loading, empty, error, and completion states.

**Acceptance criteria:** A user can start/retrieve a review and see real persisted results; the interface does not imply approval merely because analysis completed; no fabricated counts or findings appear.

## Phase C — Findings and human intervention

### C1. Findings with evidence

Display category, affected asset, explanation, supporting references, confidence/uncertainty distinction, severity where justified, and status.

**Acceptance criteria:** Every displayed evidence citation resolves to a stored reference and users can understand why the finding exists.

### C2. Targeted corrections and revisions

Enable editing and applying supported suggestions while preserving previous asset versions and change details.

**Acceptance criteria:** Applying the 25%-to-20% correction changes only the intended content, records a revision, and makes the asset retrievable in its new state; unsupported corrections cannot be applied as verified fixes.

### C3. Unresolved approved-source conflict detection

Classify applicable approved references that disagree without precedence as unresolved conflicts.

**Acceptance criteria:** The two-approved-source 20%-versus-25% scenario is escalated rather than arbitrarily resolved; the conflicting references and affected content are retained.

### C4. Human-review tickets

Create and manage tickets containing the conflict, affected assets, source identifiers, conflicting values, required decision, status, and timestamps.

**Acceptance criteria:** A ticket is created from a real conflict, is retrievable, and clearly states the human decision required.

### C5. Reviewer decisions and re-evaluation

Allow an authorized reviewer to record the decision and resolution details, then re-run affected checks.

**Acceptance criteria:** The decision and relevant history persist; re-evaluation uses the recorded resolution and actual current content; findings and tickets update according to results.

### C6. Revision and review-state tracking

Complete campaign, finding, ticket, review-run, and asset-revision state transitions needed to show traceability.

**Acceptance criteria:** Invalid transitions are rejected; prior versions and decisions remain accessible; readiness and approval are distinct, and approval requires an explicit implemented action.

## Phase D — LLM-assisted analysis

### D1. Provider integration

Verify the selected provider, model, and server-side credentials before implementing a provider adapter.

**Acceptance criteria:** Provider-specific code is behind a small interface; timeouts, provider errors, unavailable configuration, and secret handling are explicit; no browser exposure occurs.

### D2. Structured semantic findings

Add structured model responses for semantic checks appropriate to approved references.

**Acceptance criteria:** Responses are schema-validated before use; malformed, uncertain, or unsupported output fails safely; semantic results cannot bypass deterministic findings or approval controls.

### D3. Evidence and correction validation

Validate model evidence against stored references and proposed corrections against actual asset content and applicable rules.

**Acceptance criteria:** Unsupported references or corrections are rejected or marked uncertain; model interpretation is visibly distinct from verified evidence.

### D4. Tone and claim analysis

Add only tone and claim checks supported by applicable approved references and documented scope.

**Acceptance criteria:** The system does not invent brand authority or claim verification it cannot perform; findings remain traceable and actionable.

### D5. Pipeline integration

Integrate validated LLM findings into the existing review pipeline without replacing deterministic checks, conflict handling, or human approval.

**Acceptance criteria:** Review results combine sources predictably, preserve provenance, handle partial AI failure honestly, and never auto-approve publication.

## Phase E — Testing, refinement, and deployment

### E1. Deterministic and error-condition testing

Cover rule behavior, input limits, invalid transitions, missing references, and failure paths.

### E2. Conflict and human-resolution testing

Exercise source conflict creation, ticket management, reviewer decisions, history, and re-evaluation.

### E3. Persistence and access-control verification

Verify migrations, retrieval, revision history, authorization, and RLS for the implemented deployment scope.

### E4. UX and responsiveness refinement

Improve accessibility, responsive layouts, clear state messaging, and information hierarchy without adding decorative complexity.

### E5. Deployment and demonstration preparation

Prepare Vercel deployment configuration, documentation, repeatable setup, and a demonstration using the two required scenarios. Report any feature that remains planned or mocked.

**Phase E acceptance criteria:** Relevant lint, type-check, unit/integration, build, persistence, security, and user-path checks pass or have documented blockers; both demonstration scenarios work through genuine application behavior; deployment documentation is repeatable.

## Out of scope for the initial MVP

- Visual/image analysis and video review.
- Publishing-platform or marketing-automation integrations.
- Advanced analytics and broad campaign reporting.
- Complex approval hierarchies beyond the explicit implemented review action.
- Generic content generation, generic spellchecking, or wholesale rewriting.
- Additional frameworks, databases, state-management libraries, or infrastructure without an approved concrete need.

## Current status and next task

Phases A1 and A2 are implemented and verified locally. In addition to the application foundation, A2 provides typed Supabase browser/server utilities, environment documentation, a version-controlled relational PostgreSQL migration, indexes, constraints, timestamp triggers, and RLS with no public policies. No hosted Supabase project is configured or claimed, and no campaign or reference CRUD has been implemented. The next authorized task is **Phase A3: campaign creation and approved-reference management**; stop after A2 and do not begin A3 automatically.
