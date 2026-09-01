<script lang="ts">
  import { renderMarkdown } from "$lib/utils/markdown";
  import type { RockDescriptionProps } from "./types.js";
  import "./styles.css";

  const componentCssClassName = "ds rock-description";

  let { rock }: RockDescriptionProps = $props();

  const summary = $derived(rock.metadata?.summary?.trim());

  const descriptionHtml = $derived.by(() => {
    const source = rock.metadata?.description?.trim();
    return source ? renderMarkdown(source) : "";
  });
</script>

<div class={componentCssClassName}>
  {#if summary}
    <p class="rock-description__summary">{summary}</p>
  {/if}
  {#if descriptionHtml}
    <!-- eslint-disable-next-line svelte/no-at-html-tags -- sanitised by markdown-it -->
    <div class="rock-description__body">{@html descriptionHtml}</div>
  {:else if !summary}
    <p class="rock-description__empty">No description provided.</p>
  {/if}
</div>
