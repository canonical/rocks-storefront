---
name: plan-feature
description: Use when the user wants a plan or breakdown for building a feature (or significantly reshaping one) before any code is written. Turns a feature request into a written implementation plan of self-contained, independently testable vertical slices. Do NOT use for bugfixes, refactors with no behavior change, or trivial one-step tasks.
---

# Plan feature

Turn a feature request into a written implementation plan composed of
**self-contained, independently testable vertical slices**. The plan is saved
as a markdown file in the repo so it can be reviewed, tracked, and executed
task-by-task.

This skill plans only. It does **not** implement the feature. After writing the
plan, hand control back to the user.

## Core rules

1. **Never assume.** Read the user's request literally. Any gap, ambiguity, or
   unstated decision is a blocker, not a thing to guess at.
2. **Block until ambiguities are resolved.** Do not write a plan while
   open questions remain. Use the `question` tool to ask, wait for answers, and
   only then proceed. If new ambiguities surface mid-planning, stop and ask
   again.
3. **Every sub-task is a vertical slice.** Each task delivers an end-to-end,
   user-or-API-observable piece of behavior (e.g. route + load + component +
   test), not a horizontal layer (e.g. "write all the types").
4. **Every sub-task is independently testable.** Each task names the concrete
   test(s) that prove it works and the command to run them. A task is not done
   until its tests pass. If in doubt of what it is the required outcome for a
   given task, ask.

## Workflow

### 1. Confirm scope

Confirm the request is a new feature or a meaningful reshape of one. If it's a
bugfix, a refactor with no behavior change, or a trivial one-step task, say so
and stop — no plan is needed.

### 2. Interrogate until unambiguous

Read the request and list everything you do not know for certain. Ask the user
about all of it using the `question` tool before planning. Cover at least:

- **Goal & scope** — what's explicitly in scope, and what's out of scope.
- **User stories / acceptance criteria** — what observable behavior defines
  "done"?
- **Inputs & data** — data sources, shapes, validation, edge cases, empty/error
  states.
- **UI & UX** — routes, pages, components, states (loading/empty/error),
  responsive/a11y expectations — only if the feature has a UI.
- **API & contracts** — endpoints, request/response shapes, status codes, auth.
- **Server vs client** — SSR vs CSR, where logic runs, what's in `src/lib/server/`.
- **Auth & permissions** — who can use it, what gates access.
- **Dependencies & constraints** — new packages, external services, existing
  code to reuse or avoid touching.
- **Non-functional** — performance, accessibility, i18n, telemetry, if relevant.
- **Testing expectations** — what must be covered and at what level (see Testing
  below).

Do not ask about things the user already specified. Ask only real, decision-
changing questions. Keep asking until you could implement the feature without
guessing.

### 3. Decompose into vertical slices

Break the feature into the smallest sequence of slices where each slice:

- Delivers an end-to-end, observable behavior on its own.
- Builds on prior slices but does not depend on later ones.
- Can be implemented, tested, and merged independently.
- Has a clear, verifiable acceptance check backed by tests.

Prefer a "walking skeleton" first slice (thinnest end-to-end path), then
layer behavior in subsequent slices.

Make sure the created slices (each corresponds to a sub-task) follow a
DAG (Direct Acyclic Graph) based on the dependencies of each task.

### 4. Write the plan file

Save to `plan.md`. Use the template below. Do not start implementing.

### 5. Hand off

Show the user the path to the plan and a one-line summary of the slices. Let
them review and decide when to start. Do not begin coding unless they ask.

## Testing (project conventions)

Reference these in each slice's test section so tasks are runnable in isolation:

- **Component tests** (browser/chromium project): name files
  `*.svelte.spec.ts`. Run one with
  `npx vitest --project=client src/path/to/File.svelte.spec.ts`.
- **Server/unit tests** (node project): any other `*.spec.ts`. Run one with
  `npx vitest --project=server src/path/to/file.spec.ts`.
- Full suite: `npm test`. Type check: `npm run svelte-check`. Lint/format:
  `npm run check`.
- `expect.requireAssertions` is on — every test must assert at least once.

Each slice should specify the exact test file path(s) and the exact command to
verify that slice alone.

## Plan file template

```markdown
# Plan: <Feature name>

## Summary

<2–4 sentences: what the feature is and the observable outcome.>

## Scope

**In scope:** <bullets>
**Out of scope:** <bullets>

## Acceptance criteria

- <Observable, testable criterion>
- <...>

## Open questions

<Resolved decisions captured from the Q&A, or "None — all resolved." There must
be no unresolved blockers here before implementation starts.>

## Slices

### Slice 1 — <thin end-to-end behavior>

- **Delivers:** <observable behavior this slice adds>
- **Changes:** <files/areas to create or edit, with paths>
- **Tests:** <test file path(s)> — <what they assert>
- **Verify:** `<exact command to run this slice's tests>`
- **Depends on:** <none | earlier slice numbers>

### Slice 2 — <next behavior>

- **Delivers:** ...
- **Changes:** ...
- **Tests:** ...
- **Verify:** ...
- **Depends on:** Slice 1

<...more slices...>
```

## Anti-patterns to avoid

- Writing a plan while any requirement is still assumed or unclear.
- Horizontal tasks ("define all types", "build all components", "write all
  tests") — these aren't independently testable.
- Slices with no concrete test or no run command.
- A slice that can't be verified until a later slice exists.
- Starting implementation. This skill stops at the written plan.
