<script lang="ts">
  import { page } from "$app/state";
  import { RockChannels } from "$lib/components/rock/RockChannels";
  import { RockDescription } from "$lib/components/rock/RockDescription";
  import { RockGetInTouch } from "$lib/components/rock/RockGetInTouch";
  import { RockHero } from "$lib/components/rock/RockHero";
  import { RockSidebar } from "$lib/components/rock/RockSidebar";
  import { SplitLayout } from "$lib/components/ui/SplitLayout";
  import { Tabs } from "$lib/components/ui/Tabs";
  import { getRockTitle } from "$lib/utils/rock";
  import type { PageProps } from "./$types";
  import "./page.css";

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

<div class="rock-detail">
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
            <RockDescription
              {rock}
              readme={data.readme}
              upstream={data.upstream}
            />
          {/snippet}
        </SplitLayout>
      {/if}
    </div>

    <RockGetInTouch />
  </div>
</div>

