<script lang="ts">
  interface TabItem {
    id: string;
    label: string;
    disabled?: boolean;
  }

  let {
    tabs,
    active = $bindable(tabs[0]?.id),
  }: { tabs: TabItem[]; active?: string } = $props();
</script>

<nav class="p-tabs">
  <ul class="p-tabs__list" role="tablist">
    {#each tabs as tab (tab.id)}
      <li class="p-tabs__item" role="presentation">
        <button
          type="button"
          class="p-tabs__link"
          role="tab"
          aria-selected={active === tab.id}
          disabled={tab.disabled}
          onclick={() => !tab.disabled && (active = tab.id)}
        >
          {tab.label}
        </button>
      </li>
    {/each}
  </ul>
</nav>
