<script lang="ts">
  import FeedbackBanner from "$lib/components/rock/FeedbackBanner.svelte";
  import RichContent from "$lib/components/rock/RichContent.svelte";
  import RockHero from "$lib/components/rock/RockHero.svelte";
  import RockSidebar from "$lib/components/rock/RockSidebar.svelte";
  import Tabs from "$lib/components/ui/Tabs.svelte";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
  const rock = $derived(data.rock);

  const tabs = [
    { id: "description", label: "Description" },
    { id: "tags", label: "Tags and channels" },
    { id: "parameters", label: "Parameters", disabled: true },
  ];
  let activeTab = $state("description");

  function showTags() {
    activeTab = "tags";
  }
</script>

<svelte:head>
  <title>{rock.name} · Rock Store</title>
  <meta name="description" content={`${rock.name} — a Canonical rock published by ${rock.publisher.name}.`} />
</svelte:head>

<article>
  <RockHero {rock} onSeeAllTags={showTags} />

  <div class="p-strip is-shallow">
    <div class="row">
      <Tabs {tabs} bind:active={activeTab} />
    </div>

    {#if activeTab === "description"}
      <div class="row rock-body">
        <div class="col-4">
          <RockSidebar {rock} />
        </div>
        <div class="col-8">
          <RichContent html={rock.descriptionHtml} />
          <RichContent html={rock.documentationHtml} />
        </div>
      </div>

      <div class="row">
        <FeedbackBanner href={rock.feedbackHref} />
      </div>
    {:else if activeTab === "tags"}
      <div class="row">
        <p>Tags and channels — coming soon.</p>
      </div>
    {/if}
  </div>
</article>

