<script lang="ts">
  import type { Rock } from "$lib/data/types";

  let {
    quickPull,
    seeAllTagsHref = "?tab=tags",
  }: { quickPull: Rock["quickPull"]; seeAllTagsHref?: string } = $props();
</script>

<div class="quick-pull">
  <h2 class="p-muted-heading">Quick pull</h2>
  <div class="quick-pull__row">
    <code>{quickPull.latestTag}</code>
    <a class="p-button u-no-margin--bottom" href={seeAllTagsHref} data-sveltekit-noscroll>
      See all tags
    </a>
    <a class="p-link--external" href={quickPull.learnMoreHref}>Learn how to use rocks</a>
  </div>
</div>

<style>
  .quick-pull__row {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
  }
  .quick-pull__row code {
    display: inline-flex;
    align-items: center;
    align-self: stretch;
    margin: 0;
    padding: 0 0.75rem;
  }
</style>
