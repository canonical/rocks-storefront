<script lang="ts">
  import { Checkbox } from "@canonical/svelte-ds-app-launchpad";
  import { array, optional, string } from "valibot";
  import { RockList } from "$lib/components/rock/RockList";
  import { Heading } from "$lib/components/ui/Heading";
  import SearchForm from "$lib/components/ui/SearchForm/SearchForm.svelte";
  import { SmallCaps } from "$lib/components/ui/SmallCaps";
  import { getRocks } from "$lib/remote/api.remote";
  import debounced from "$lib/utils/debounced.svelte";
  import searchParams from "$lib/utils/searchParams.svelte";

  const CATEGORIES = [
    "Featured",
    "Data",
    "Identity",
    "Networks",
    "Observability",
    "OS/Bases",
    "Toolchains/Languages",
    "Web",
  ] as const;

  const params = searchParams({
    q: optional(string(), ""),
    category: optional(array(string()), []),
  });

  const query = debounced(() => params.q, 200);
  const rocksRequest = $derived.by(() => {
    return getRocks({
      query: query(),
      categories: params.category,
    });
  });
</script>

<svelte:head>
    {#if params.q}
        <title>
            Search results for "{params.q}" · Rock Store
        </title>
    {:else}
        <title>
            Rock Store
        </title>
    {/if}
</svelte:head>

<div class="app-container">
    <Heading class="visually-hidden" level={1}>Rocks store</Heading>

    <div class="grid responsive">
        <aside style="grid-column: span 3">
            <Heading level={2}><SmallCaps>Categories</SmallCaps></Heading>

            <!-- TODO: change this in some way to move the form logic into the SearchForm component -->
            <fieldset class="ds checkbox-group">
                <legend class="visually-hidden">Categories</legend>
                {#each CATEGORIES as category}
                    {@const lower = category.toLowerCase() }
                    <label class="ds checkbox-label" for="checkbox-{lower}">
                        <Checkbox id="checkbox-{lower}" form="search-form" name="category" bind:group={params.category} value={category}/>
                        {category}
                    </label>
                {/each}
            </fieldset>
        </aside>

        <section style="grid-column: span 9">
            <SearchForm name="q" bind:value={params.q} loading={$effect.pending() > 0} />

            <RockList rocks={(await rocksRequest).results} />
        </section>
    </div>
</div>

<style>
    .app-container {
        margin-block: var(--dimension-500);
    }

    .ds.checkbox-group {
      --x-gap: var(--space-200);
      --y-gap: var(--space-100);

      padding: 0;
      border: none;
      display: grid;
      row-gap: var(--y-gap);
      margin-block-end: var(--space-400);

      label {
        display: grid;
        grid-template-columns: auto 1fr;
        column-gap: var(--x-gap);
        align-items: center;
        cursor: pointer;
      }
    }
</style>
