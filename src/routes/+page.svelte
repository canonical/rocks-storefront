<script lang="ts">
  import { Link } from "@canonical/svelte-ds-app-launchpad";
  import { queryParameters } from "sveltekit-search-params";
  import { Heading } from "$lib/components/ui/Heading";
  import Search from "$lib/components/ui/Search.svelte";
  import { getRocks } from "$lib/remote/api.remote";
  import { type RockFindResponse } from "$lib/server/api/types";

  const params = queryParameters({ q: true });
  const query = $derived(params.q);
</script>

<Heading level={1}>Rocks store</Heading>

<form data-sveltekit-keepfocus>
    <Search name="q" value={query} />
</form>

{@render rocksList(await getRocks({ query }))}

{#snippet rocksList(response: RockFindResponse)}
    {@const rocks = response.results}
    <Heading level={2}>Result: {rocks.length} rocks</Heading>
    <ul>
        {#each rocks as rock (rock.name)}
            <li><Link href={`/${encodeURIComponent(rock.name)}`}>{rock.name}</Link></li>
        {/each}
    </ul>
{/snippet}
