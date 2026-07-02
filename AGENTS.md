# AGENTS.md

SvelteKit app (Svelte 5, server-rendered via `adapter-node`) for rockstore.io, maintained by Canonical's Web & Design team.

## Commands

- `npm run dev` — dev server at http://localhost:5173
- `npm test` — full Vitest suite, single run (`vitest --run`)
- `npx vitest --project=server src/path/to/file.spec.ts` — run one server test
- `npx vitest --project=client src/path/to/File.svelte.spec.ts` — run one component test
- `npm run check` — Biome lint + format check (CI gate; use `npm run fix` to auto-fix)
- `npm run svelte-check` — type check (runs `svelte-kit sync` first)
- `npm run build` / `npm run start` — production build / run `node build`

## Documentation

Any documentation for the project architecture and business logic decisions can be found
in `README.md` and the relevant source files and tests.

Read those files lazily - only those you need for the task at hand - when you need to understand a given part of the application
(along with reading any code files for more specific details).

## Workflow

### Small changes

For bugfixes, style modifications and similar small changes:
- Read any relevant `README.md` section and source file
- Implement the change
- Update the tests (if necessary)
- Run the Verification steps detailed in the next section.

### Big changes

For complex changes or new features:
- Make sure to create a plan.
- Ask the user for approval of the plan before continuing.
- For each task/slice present in the `plan.md` file created, and following the required order for each task:
  - Spawn an agent to implement the changes and pass it the task/slice context.
  - Write the tests for the slice, which will be failing (red).
  - Make the necessary implementation.
  - Run the created tests.
  - Iterate between implementation and running tests until the latter pass (green).
  - Apply the [Refactoring](#refactoring) rules for both implementation and tests.
  - Spawn a new agent to review the changes.
  - Implement the fixes from the review making sure all the tests pass at every modification.
- After all the tasks are done spawn an agent to implement end-to-end tests.
  - Read the `plan.md` file to discover the scope and acceptance criteria of the feature.
  - Implement end-to-end tests that fulfill the acceptance criteria.
- Run the [Verification](#verification) rules.
- Fix any issues reported in the verification output.
- Repeat verification-fix steps until there are no issues left and ALL tests (unit, component, e2e) pass.
- Document the changes.
- Remove the `plan.md` file.

## Verification

- `npm run svelte-check`
- `npm run check`
- `npm test`

## Refactoring

- Extract duplication
- Deepen modules (move complexity behind simple interfaces)
- Apply SOLID principles where natural
- Run tests after each refactor step
