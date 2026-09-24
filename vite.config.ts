import adapter from "@sveltejs/adapter-node";
import { sveltekit } from "@sveltejs/kit/vite";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";

// SvelteKit injects onload and onerror event handlers on all img tags with the
// content being "this.__e=event"; the hash of this script must be added to the
// CSP header as a script-src-attr, otherwise it will trigger errors.
// See: https://github.com/sveltejs/svelte/issues/14014
const EVENT_HANDLER_HASH =
  "sha256-7dQwUgLau1NFCCGjfn9FsYptB6ZtWxJin6VohGIu20I=";

// check if running the dev command or a prod build
const isDev = process.env.NODE_ENV === "development";

export default defineConfig({
  plugins: [
    sveltekit({
      compilerOptions: {
        // Force runes mode for the project, except for libraries. Can be removed in svelte 6.
        runes: ({ filename }) =>
          filename.split(/[/\\]/).includes("node_modules") ? undefined : true,
        experimental: {
          async: true,
        },
      },
      adapter: adapter(),
      experimental: {
        remoteFunctions: true,
      },
      csp: {
        directives: {
          "default-src": ["self"], // anything unset falls back to this
          "script-src-attr": ["self", "unsafe-hashes", EVENT_HANDLER_HASH],
          "font-src": ["self", "assets.ubuntu.com"],
          "img-src": ["self", "assets.ubuntu.com"],
          "frame-ancestors": ["self"],
          "form-action": ["self"],
          // SvelteKit injects a worker as a blob when running in dev mode
          "worker-src": isDev ? ["blob:"] : [],
          // TODO: remove inline styles so we can skip unsafe-inline here
          "style-src": ["self", "unsafe-inline"],
        },
      },
    }),
  ],
  test: {
    expect: { requireAssertions: true },
    projects: [
      {
        extends: "./vite.config.ts",
        test: {
          name: "client",
          browser: {
            enabled: true,
            provider: playwright(),
            instances: [{ browser: "chromium", headless: true }],
          },
          include: ["src/**/*.svelte.{test,spec}.{js,ts}"],
          exclude: ["src/lib/server/**"],
        },
      },

      {
        extends: "./vite.config.ts",
        test: {
          name: "server",
          environment: "node",
          include: ["src/**/*.{test,spec}.{js,ts}"],
          exclude: ["src/**/*.svelte.{test,spec}.{js,ts}"],
        },
      },
    ],
  },
});
