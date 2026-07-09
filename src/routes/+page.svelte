<script lang="ts">
  import { queryParameters } from "sveltekit-search-params";
  import { RockList } from "$lib/components/rocks/RockList";
  import { Heading } from "$lib/components/ui/Heading";
  import SearchForm from "$lib/components/ui/SearchForm/SearchForm.svelte";
  import { SmallCaps } from "$lib/components/ui/SmallCaps";
  import { getRocks } from "$lib/remote/api.remote";
  import debounced from "$lib/utils/debounced.svelte";

  const params = queryParameters({ q: true });
  const query = debounced(() => params.q, 200);
  const rocksRequest = $derived(getRocks({ query: query() }));
</script>

<svelte:head>
    {#if query()}
        <title>
            Search results for "{query()}" · Rock Store
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

            TODO...
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
</style>
