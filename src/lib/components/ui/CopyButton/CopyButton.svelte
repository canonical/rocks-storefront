<script lang="ts">
  import { CheckmarkIcon, CopyIcon } from "@canonical/svelte-icons";
  import { onDestroy } from "svelte";
  import { copier } from "$lib/utils/clipboard.svelte";
  import type { CopyButtonProps } from "./types.js";
  import "./styles.css";

  const componentCssClassName = "ds copy-button";

  let {
    value,
    label = "Copy to clipboard",
    class: className,
    ...rest
  }: CopyButtonProps = $props();

  const clipboard = copier();
  const copied = $derived(clipboard.copied);

  onDestroy(() => clipboard.destroy());
</script>

<button
  type="button"
  class={[componentCssClassName, className]}
  onclick={() => clipboard.copy(value)}
  aria-label={copied ? "Copied to clipboard" : label}
  {...rest}
>
  {#if copied}<CheckmarkIcon />{:else}<CopyIcon />{/if}
</button>
