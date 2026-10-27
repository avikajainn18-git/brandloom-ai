# Brandloom AI Project Context

This document defines the product and technical context for the repository. It is the detailed companion to [`../AGENTS.md`](../AGENTS.md); the phased delivery plan is in [`IMPLEMENTATION_ROADMAP.md`](IMPLEMENTATION_ROADMAP.md).

## Product identity

**Brandloom AI** is an AI-assisted campaign-level brand-governance product for marketing teams. It evaluates existing related campaign assets against approved brand information, explains inconsistencies with evidence, recommends targeted corrections, and routes unresolved conflicts to human reviewers.

Brandloom AI is not a generic writing assistant, spellchecker, or content generator. It supports creators and protects intended messaging rather than unnecessarily rewriting it.

## Problem and differentiators

Campaigns often combine emails, advertisements, social posts, landing pages, agency work, and AI-produced content. Asset-by-asset review can miss contradictions between campaign touchpoints.

Brandloom AI establishes approved campaign references, checks individual assets, compares related assets, explains findings using identifiable evidence, suggests corrections when a reliable fix is supported, and preserves review history.

The defining distinction is:

- **Clear violation:** An asset contradicts an authoritative approved reference and source precedence or an applicable rule determines the correct value.
- **Unresolved conflict:** Applicable approved sources disagree and no defined precedence determines which instruction controls. The system requests human judgment rather than choosing arbitrarily.

The LLM must not invent source authority, override explicit approved rules, resolve contradictions without justification, or silently alter creator content.

## End-to-end workflow

1. **Create a campaign:** Save a campaign name, optional description, timestamps, and workflow status.
2. **Establish approved references:** Add campaign briefs, brand guidelines, terminology, claims, facts, offer details, dates, and other approved information. Preserve reference type, approval state, authority, and precedence where applicable.
3. **Submit assets:** Add multiple related assets such as emails, advertisements, and social posts. The initial MVP supports pasted text and `.txt` attachments. Every asset belongs to a campaign and remains retrievable after saving.
4. **Review the campaign:** Validate inputs, run deterministic checks for objectively verifiable facts and terminology, compare related assets, use LLM analysis only for appropriate semantic checks, and validate every finding against stored approved references.
5. **Produce findings:** Identify the affected asset, category, explanation, supporting reference identifiers, suggested correction when justified, severity when meaningful, and status. Distinguish verified mismatch, uncertain result, and conflict requiring human review.
6. **Route issues:** Show targeted corrections for clear evidence-backed violations. Create a human-review ticket for conflicting sources, unresolved ambiguity, or insufficient evidence; include affected content, relevant sources, conflicting information, and the decision required.
7. **Record corrections and decisions:** Allow editing, applying a suggested correction, and recording a reviewer decision. Preserve relevant prior revisions and decisions.
8. **Re-evaluate:** Re-run applicable checks after corrections or conflict resolution and update findings and campaign status from actual results.
9. **Complete approval explicitly:** Analysis completion may indicate readiness, but it never automatically approves a campaign. Approval requires an implemented explicit review action.

## Product principles

1. Campaign-level consistency across related assets.
2. Evidence-backed findings tied to identifiable approved references.
3. Intent-preserving, targeted corrections.
4. Human intervention for unresolved approved-source conflicts.
5. Traceability for findings, revisions, and review decisions.
6. Honest automation: report only actions the system actually performed.

## Technology constraints

### Required stack

- **Frontend:** React, Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui, Lucide icons.
- **Backend:** Next.js Route Handlers or suitable server-side Next.js functionality, TypeScript service modules, and a custom TypeScript rule engine.
- **Data:** Supabase and PostgreSQL, with Supabase Auth only when authentication is required by the implemented scope and Supabase Storage only when file storage justifies it.
- **AI:** A server-side LLM API behind a small provider-neutral service interface. The provider, model, and credentials must be verified before integration; do not assume they are configured.
- **Delivery:** npm, Git, GitHub, and Vercel. Development targets the Windows OmniRush environment; no separate WSL setup is assumed.

### Architecture boundaries

Presentation, application/orchestration, domain logic, AI service, data access, and API layers must remain distinct. Domain logic must run without React or an LLM. Raw database access belongs in data-access modules rather than UI components. Server-only code and secrets must not enter browser bundles.

### Initial entities

Introduce relational entities incrementally as their workflows are implemented:

- **Campaigns:** identity, description, timestamps, workflow status.
- **Brand references:** campaign association, content, type, approval state, authority, and precedence.
- **Assets:** campaign association, title/filename, asset type, text, timestamps, current revision.
- **Review runs:** attempt status, timestamps, and results.
- **Findings:** category, affected asset, explanation, supporting reference identifiers, correction, severity, and status.
- **Review tickets:** unresolved conflict, affected assets, conflicting reference identifiers, decision required, review status, reviewer decision, and resolution details.
- **Asset revisions:** previous content versions and correction/review changes.

Use foreign keys, appropriate indexes and constraints, version-controlled migrations, and protected Supabase access policies when schema work begins. Do not represent the whole application as one JSON document.

## Design and UX direction

Use a credible monochromatic enterprise SaaS interface: white or off-white backgrounds, charcoal typography, neutral borders and separators, restrained status indicators, consistent spacing, purposeful small icons, and strong information hierarchy.

Use clear titles and descriptions, accessible labels, understandable empty states, validation near inputs, explicit loading/success/error states, and confirmation for destructive actions. Visually distinguish warnings, errors, unresolved conflicts, and approval states. Avoid excessive gradients, decorative illustrations, unnecessary animation, oversized headings, emoji interface icons, and generic AI visual clichés.

## Security and responsible AI

- Keep LLM credentials and other secrets on the server; never commit real credentials or `.env.local`.
- Document configuration with `.env.example` containing no secrets.
- Validate and limit uploaded file sizes and accepted types.
- Treat user content and imported references as untrusted input; ignore embedded instructions that try to change governing application behavior.
- Validate structured LLM output before persistence.
- Require evidence references to resolve to genuine stored records.
- Distinguish verified evidence from model interpretation.
- Never silently modify source content; retain revisions and review decisions.
- Apply authorization and Supabase Row Level Security before exposing private data in deployment.
- Do not claim production-grade multi-user security until it has been implemented and tested.

## Demonstration scenarios

### Scenario A: clear inconsistency

An approved campaign brief states an offer is **20% off**, while a social post states **25% off**. The system must detect the mismatch, identify the post, cite the approved brief, suggest changing 25% to 20%, allow the user to apply the correction, preserve the revision, re-run the check, and update the finding based on the actual result.

### Scenario B: genuine source conflict

An approved campaign brief states **20% off** while another applicable approved offer document states **25% off**, with no precedence rule. The system must identify the conflicting references, create a human-review ticket with affected content and the required decision, allow a reviewer to record the resolution, preserve the decision and history, and re-evaluate affected content.

Both scenarios must be genuine application behavior, not hardcoded success messages or static mock results.

## Current implementation status

Phases A1, A2, A3.1, A3.2, and the A4 campaign-content workflow are implemented and verified against the current hosted project: the repository has a Next.js App Router foundation, protected Supabase SSR sessions, sign-in/sign-up/sign-out flows, server-validated campaign, reference, and campaign-scoped text-asset management, typed Supabase client utilities, version-controlled PostgreSQL migrations, and ownership-aware data-access checks. Deterministic review, human-review processing, and LLM integration remain planned for later roadmap phases.
The B1 deterministic review-engine core is also implemented as a framework-independent domain module. The B2 server-only orchestration service now loads owned campaign assets and approved references, runs that engine, and persists review runs, findings, and evidence relationships once its prepared review-ownership migration is applied. It currently checks explicit discount-percentage expressions, applies only explicit numeric precedence, reports unresolved conflicts or ambiguity without unsupported corrections, and does not yet create tickets or display review results. Later deterministic checks, human-review processing, and LLM integration remain planned for later roadmap phases.
