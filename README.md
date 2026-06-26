# ![rockstore.io](https://user-images.githubusercontent.com/6353928/94026467-9dff1480-fdb1-11ea-8026-e866246815fc.png "Rockstore") rockstore.io codebase

Rocks are OCI-compliant artefacts, designed for the secure software supply chain, in order to provide a solid foundation for cloud-native software.


This repo is the application for the rockstore website.

The site is maintained by the [Web and Design team](https://ubuntu.com/blog/topics/design) at [Canonical](https://www.canonical.com). It is a [SvelteKit](https://svelte.dev/docs/kit) application rendered server-side and served by `adapter-node`.

## Local development

This project uses Node.js (see `mise.toml` for the pinned version) and npm.

```bash
npm install                       # install dependencies
npx playwright install chromium   # one-time: browser for component tests
npm run dev                       # start the dev server (http://localhost:5173)
```

Other useful commands:

| Command | Description |
| --- | --- |
| `npm run build` | Build the production app (`./build`) |
| `npm run start` | Run the production server (`node build`) |
| `npm test` | Run the Vitest suite (component + server) |
| `npm run check` | Lint and format check (Biome) |
| `npm run fix` | Apply Biome lint/format fixes |
| `npm run svelte-check` | Type-check the project |

If you use [Task](https://taskfile.dev), the same actions are available as `task dev`, `task start`, `task test`, etc. (run `task --list`).

## Working with agents

For small changes or bugfixes just prompt the agent to do what you want.

For bigger features it is recommended to start running the agent in **plan** mode (or use the web interface of a model like Gemini, ChatGPT, Claude...).
Use this to help you write a complete specification for the feature you want to implement. Tips:
- Ask the agent to question you about any non clear detail that is needed for the implementation of the feature.
- Ask the agent to offer you multiple approaches with advantages and disadvantages.
- Ask the agent to consider security and performance implications for the specification.

If you already have a spec written (the usual workflow for features in Canonical's Web Engineering department), use an agent to make it concise and
strip any useless information (i.e. the author, reviewers...).

Once you have the specification for the feature, paste it as prompt for the coding agent.
The agent will create a plan with sub-tasks for the implementation of the feature.
Make sure the plan and each sub-task makes sense and is properly testable.
Tell the agent to go ahead and implement the changes.

Remember to clear the session after you are done with the feature to empty the agent context for future prompts.

## Bugs and issues

If you have found a bug on the site or have an idea for a new feature, feel free to [create a new issue](https://github.com/canonical/rocks-storefront/issues/new), or suggest a fix by [creating a pull request](https://help.github.com/articles/creating-a-pull-request/). You can also find a link to create issues in the footer of every page of the site itself.

With ♥ from Canonical
