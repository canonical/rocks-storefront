<script lang="ts">
  interface TabItem {
    id: string;
    label: string;
    href?: string;
    disabled?: boolean;
  }

  // Tabs are links so selection lives in the URL (SSR + shareable). Vanilla styles the
  // active tab off `aria-selected`.
  let { tabs, active }: { tabs: TabItem[]; active: string } = $props();
</script>

<nav class="p-tabs">
  <ul class="p-tabs__list" role="tablist">
    {#each tabs as tab (tab.id)}
      <li class="p-tabs__item" role="presentation">
        {#if tab.disabled}
          <button type="button" class="p-tabs__link" role="tab" aria-selected="false" disabled>
            {tab.label}
          </button>
        {:else}
          <a
            class="p-tabs__link"
            role="tab"
            href={tab.href}
            aria-selected={active === tab.id}
            data-sveltekit-noscroll
          >
            {tab.label}
          </a>
        {/if}
      </li>
    {/each}
  </ul>
</nav>
