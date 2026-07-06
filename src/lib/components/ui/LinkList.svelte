<script lang="ts">
  import type { LinkItem } from "$lib/data/types";

  let { items }: { items: LinkItem[] } = $props();

  const ICON_CLASS: Record<string, string> = {
    github: "p-icon--github",
    terminal: "p-icon--code",
    file: "p-icon--code",
    bug: "p-icon--submit-bug",
  };
</script>

<ul class="p-list link-list u-no-margin--bottom">
  {#each items as item (item.url)}
    <li class="link-list__item">
      {#if item.icon && ICON_CLASS[item.icon]}
        <i class={ICON_CLASS[item.icon]} aria-hidden="true"></i>
      {/if}
      <a class="p-link--external" href={item.url}>{item.label}</a>
    </li>
  {/each}
</ul>

<style>
  .link-list__item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.25rem 0;
  }
  .link-list__item :global(.p-icon--github) {
    width: 0.9rem;
    height: 0.9rem;
    background-size: contain;
  }
</style>
