<script lang="ts">
  import { page } from "$app/state";
  import { RockChannels } from "$lib/components/rock/RockChannels";
  import { RockDescription } from "$lib/components/rock/RockDescription";
  import { RockFeedback } from "$lib/components/rock/RockFeedback";
  import { RockHero } from "$lib/components/rock/RockHero";
  import { RockSidebar } from "$lib/components/rock/RockSidebar";
  import { SplitLayout } from "$lib/components/ui/SplitLayout";
  import { Tabs } from "$lib/components/ui/Tabs";
  import { getRockTitle } from "$lib/utils/rock";
  import type { PageProps } from "./$types";

  let { data }: PageProps = $props();
  const rock = $derived(data.rock);

  const tabs = [
    { id: "description", label: "Description", href: "?tab=description" },
    { id: "tags", label: "Tags and channels", href: "?tab=tags" },
  ];
  const activeTab = $derived.by(() => {
    const tab = page.url.searchParams.get("tab");
    return tab && tabs.some((t) => t.id === tab) ? tab : "description";
  });
</script>

<svelte:head>
  <title>{getRockTitle(rock)} · Rock Store</title>
</svelte:head>

<RockHero {rock} />

<div class="app-container rock-detail__body">
  <Tabs {tabs} active={activeTab} aria-label="Rock details" />

  <div class="rock-detail__content">
    {#if activeTab === "tags"}
      <RockChannels {rock} />
    {:else}
      <SplitLayout>
        {#snippet aside()}
          <RockSidebar {rock} />
        {/snippet}
        {#snippet main()}
          <RockDescription {rock} />
        {/snippet}
      </SplitLayout>
    {/if}
  </div>

  {#if activeTab !== "tags"}
    <RockFeedback />
  {/if}
</div>

<style>
  .rock-detail__body {
    padding-block: var(--space-400);
  }

  .rock-detail__content {
    padding-block-start: var(--space-400);
  }
</style>
