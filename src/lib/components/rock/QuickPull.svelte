<script lang="ts">
  import type { Rock } from "$lib/data/types";

  let {
    quickPull,
    onSeeAllTags,
  }: { quickPull: Rock["quickPull"]; onSeeAllTags?: () => void } = $props();
</script>

<div class="quick-pull">
  <h2 class="p-muted-heading">Quick pull</h2>
  <!-- Custom flex row: Vanilla has no flex/gap utility for aligning mixed code + button + link. -->
  <div class="quick-pull__row">
    <code>{quickPull.latestTag}</code>
    <button type="button" class="p-button u-no-margin--bottom" onclick={onSeeAllTags}>
      See all tags
    </button>
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
  /* Match the code token's height to the adjacent button. */
  .quick-pull__row code {
    display: inline-flex;
    align-items: center;
    align-self: stretch;
    margin: 0;
    padding: 0 0.75rem;
  }
</style>
