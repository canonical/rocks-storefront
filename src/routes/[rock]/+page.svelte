<script lang="ts">
  import { page } from "$app/state";
  import FeedbackBanner from "$lib/components/rock/FeedbackBanner.svelte";
  import RichContent from "$lib/components/rock/RichContent.svelte";
  import RockHero from "$lib/components/rock/RockHero.svelte";
  import RockSidebar from "$lib/components/rock/RockSidebar.svelte";
  import Tabs from "$lib/components/ui/Tabs.svelte";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
  const rock = $derived(data.rock);

  // The selected tab lives in the URL (`?tab=…`) so it's shareable and survives a refresh.
  const activeTab = $derived(
    page.url.searchParams.get("tab") === "tags" ? "tags" : "description",
  );
    { id: "description", label: "Description", href: page.url.pathname },
    {
      id: "tags",
      label: "Tags and channels",
      href: `${page.url.pathname}?tab=tags`,
    },
  ]);
</script>

<svelte:head>
  <title>{rock.name} · Rock Store</title>
  <meta name="description" content={`${rock.name} — a Canonical rock published by ${rock.publisher.name}.`} />
</svelte:head>

<article>
  <RockHero {rock} />

  <div class="p-strip is-shallow">
    <div class="row">
      <Tabs {tabs} active={activeTab} />
    </div>

    {#if activeTab === "description"}
      <div class="row rock-body">
        <div class="col-4">
          <RockSidebar {rock} />
        </div>
        <div class="col-8">
          {#if rock.descriptionHtml}
            <RichContent html={rock.descriptionHtml} />
          {/if}
          {#if rock.documentationHtml}
            <RichContent html={rock.documentationHtml} />
          {/if}
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

