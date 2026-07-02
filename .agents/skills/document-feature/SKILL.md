---
name: document-feature
description: Use when the user asks for documentation. Use when a new feature has been built or significantly changed and its design/decisions should be recorded in the repo's docs/. Captures the approach (and optional rationale) into per-topic markdown files (testing, api-endpoints, routes, data-loading, components, state-management, business-logic, forms-actions, auth, error-handling, build-deployment). Do NOT use for bugfixes, style tweaks, or other small tasks.
---

# Document feature

Record durable design decisions for **new features** into the repo's `docs/`
directory. Documentation is organized as **one file per topic**, with each
feature appending a new section to the relevant topic file(s).

## When to use this skill

Use it when a change introduces or meaningfully reshapes a feature, e.g.:

- A new route, page, or API endpoint
- A new shared component or component pattern
- New domain/business logic or a new data-loading strategy
- A new testing approach, auth flow, error-handling pattern, or build/deploy change

**Do NOT use it for:**

- Bugfixes
- Styling/CSS tweaks
- Renames, refactors with no behavioral change, dependency bumps
- Any small, self-contained task

If unsure whether something qualifies as a "feature", ask the user before
writing docs.

## Topics and files

All docs live under `docs/` at the repo root. There is exactly one file per
topic. Create the file the first time a topic is documented; otherwise append
to it.

| Topic              | File                        | Scope                                              |
| ------------------ | --------------------------- | -------------------------------------------------- |
| Testing            | `docs/testing.md`           | Unit, browser, and e2e testing strategy            |
| API endpoints      | `docs/api-endpoints.md`     | `+server.ts` request handlers, contracts           |
| Routes & navigation| `docs/routes.md`            | Route structure, layouts, navigation               |
| Data loading       | `docs/data-loading.md`      | `load` functions, SSR vs CSR, caching              |
| Components         | `docs/components.md`        | Shared UI components and patterns                  |
| State management   | `docs/state-management.md`  | Stores, runes, shared/global state                 |
| Business logic     | `docs/business-logic.md`    | Domain rules and specific business logic           |
| Forms & actions    | `docs/forms-actions.md`     | Form handling and server actions                   |
| Auth               | `docs/auth.md`              | Authentication and authorization                   |
| Error handling     | `docs/error-handling.md`    | Error pages, boundaries, logging                   |
| Build & deployment | `docs/build-deployment.md`  | Config, adapters, CI/CD                            |

A single feature often spans multiple topics (e.g. a checkout feature touches
`routes`, `data-loading`, `business-logic`, and `testing`). Add a section to
each relevant file rather than cramming everything into one.

If a feature genuinely doesn't fit any topic above, ask the user whether to add
a new topic file rather than forcing it into an unrelated one.

## Section format

Each documented feature is a single `##` section appended to the topic file.
Use this exact structure:

```markdown
## <Descriptive title>

**Approach:** <What we do — the concrete approach taken for this feature.>

**Why:** <Why this approach — tradeoffs, alternatives rejected, constraints.>
```

Rules:

- **Title** is required and descriptive — name the feature and what the section
  covers (e.g. `## Cart checkout flow (multi-step server actions)`), not just
  `## Checkout`.
- **Approach** is required. Describe what we actually do: key files, patterns,
  data flow, contracts. Reference real paths with `file_path` and, where
  useful, `file_path:line_number`.
- **Why** is **optional**. Include it only when there is a real decision or
  tradeoff to capture (an alternative was rejected, a constraint forced the
  choice, a non-obvious pattern was chosen deliberately). If the user did not
  state a rationale and none is evident, omit the `**Why:**` line entirely — do
  not invent one and do not leave a placeholder.

Keep the contents as concise as possible without losing any context. 

## Workflow

1. Confirm the change is a feature (not a bugfix/small task) or a meaningful change
   to an existing one. If not, stop and tell the user no docs are needed.
2. Identify which topic file(s) the feature touches.
3. For each topic file:
  - If it doesn't exist, create it with a top-level `# <Topic>` heading, then
    the new section.
  - If it exists, append the new `##` section at the end. Don't rewrite or
    reorder existing sections.
  - If documenting a meaningful change to an existing feature, update its
    corresponding section without rewriting unrelated entries.
4. Write a descriptive title and the **Approach**. Add **Why** only if a real
   rationale exists.
5. Keep entries concise and factual; link to code with paths instead of pasting
   large code blocks.
6. Show the user a summary of which files were created/updated.

## New topic file template

When creating a topic file for the first time:

```markdown
# <Topic name>

> Documentation of feature-level decisions for <topic>. Each section below
> records one feature: its approach and, where relevant, why.

## <First feature title>

**Approach:** ...
```
