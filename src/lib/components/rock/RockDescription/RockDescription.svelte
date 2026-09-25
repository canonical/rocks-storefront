<script lang="ts">
  import { renderMarkdown, renderReadmeMarkdown } from "$lib/utils/markdown";
  import type { RockDescriptionProps } from "./types.js";
  import "./styles.css";

  const componentCssClassName = "ds rock-description";

  let { rock, readme, upstream }: RockDescriptionProps = $props();

  const bodyHtml = $derived.by(() => {
    const readmeSource = readme?.trim();
    if (readmeSource && upstream) {
      return renderReadmeMarkdown(readmeSource, upstream);
    }

    const source = rock.metadata?.description?.trim();
    return source ? renderMarkdown(source) : "";
  });
</script>

<div class={componentCssClassName}>
  {#if bodyHtml}
    <!-- eslint-disable-next-line svelte/no-at-html-tags -- sanitised by markdown-it -->
    <div class="rock-description__body editorial content-flow">
      {@html bodyHtml}
    </div>
  {:else}
    <p class="rock-description__empty">No description provided.</p>
  {/if}
</div>
