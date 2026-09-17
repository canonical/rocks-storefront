<script lang="ts">
  import { CheckmarkIcon, CopyIcon } from "@canonical/svelte-icons";
  import { onDestroy } from "svelte";
  import type { CopyButtonProps } from "./types.js";
  import "./styles.css";

  const componentCssClassName = "ds copy-button";
  const CONFIRMATION_MS = 2000;

  let {
    value,
    label = "Copy to clipboard",
    class: className,
    ...rest
  }: CopyButtonProps = $props();

  let copied = $state(false);
  let copyResetTimer: ReturnType<typeof setTimeout>;

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      copied = true;
      clearTimeout(copyResetTimer);
      copyResetTimer = setTimeout(() => (copied = false), CONFIRMATION_MS);
    } catch {
      // Clipboard API unavailable do nothing
    }
  }

  onDestroy(() => clearTimeout(copyResetTimer));
</script>

<button
  type="button"
  class={[componentCssClassName, className]}
  onclick={copy}
  aria-label={copied ? "Copied to clipboard" : label}
  {...rest}
>
  {#if copied}<CheckmarkIcon />{:else}<CopyIcon />{/if}
</button>
