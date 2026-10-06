<script lang="ts">
  import { Link } from "@canonical/svelte-ds-app-launchpad";
  import { Heading } from "$lib/components/ui/Heading";
  import { renderMarkdown } from "$lib/utils/markdown";
  import type { RockDescriptionProps } from "./types.js";
  import "./styles.css";

  const componentCssClassName = "ds rock-description";

  const GET_IN_TOUCH_HREF = "https://ubuntu.com/containers#get-in-touch";

  let { rock }: RockDescriptionProps = $props();

  const bodyHtml = $derived.by(() => {
    const source = rock.metadata?.description?.trim();
    return source ? renderMarkdown(source) : "";
  });
</script>

<div class={componentCssClassName}>
  <section>
    <Heading level={2}>Description</Heading>
    {#if bodyHtml}
      <!-- eslint-disable-next-line svelte/no-at-html-tags -- sanitised by markdown-it -->
      <div class="rock-description__body editorial content-flow">
        {@html bodyHtml}
      </div>
    {:else}
      <p class="rock-description__empty">No description provided.</p>
    {/if}
  </section>

  <section class="rock-description__commercial">
    <Heading level={2}>Commercial use</Heading>
    <p>
      Individual developers and community members can access all rocks for free.
      If your usage includes commercial redistribution, requires security
      maintenance or support, or needs access to features like FIPS compliance,
      <Link href={GET_IN_TOUCH_HREF} target="_blank" rel="noopener">
        get in touch
      </Link>
      to discuss your needs.
    </p>
  </section>
</div>
