<script lang="ts">
  import { onDestroy } from "svelte";

  let { code }: { code: string } = $props();

  let copied = $state(false);
  let resetTimer: ReturnType<typeof setTimeout>;

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      copied = true;
      clearTimeout(resetTimer);
      resetTimer = setTimeout(() => {
        copied = false;
      }, 2000);
    } catch {
      // Clipboard API unavailable (e.g. insecure context); nothing to do.
    }
  }

  onDestroy(() => clearTimeout(resetTimer));
</script>

<div class="p-code-snippet code-snippet u-no-margin--bottom">
  <pre class="p-code-snippet__block"><code>{code}</code></pre>
  <button
    type="button"
    class="code-snippet__copy"
    onclick={copy}
    aria-label={copied ? "Copied to clipboard" : "Copy to clipboard"}
  >
    <i class={copied ? "p-icon--success" : "p-icon--copy"}></i>
  </button>
</div>

<style>
  .code-snippet {
    position: relative;
  }
  /* Room so the copy button never overlaps the command text. */
  .code-snippet :global(.p-code-snippet__block) {
    padding-right: 2.5rem;
  }
  .code-snippet__copy {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    padding: 0.25rem;
    border: 0;
    background: transparent;
    cursor: pointer;
    line-height: 1;
  }
</style>
