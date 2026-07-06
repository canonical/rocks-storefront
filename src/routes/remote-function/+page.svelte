<script lang="ts">
  import { getRocks } from "$lib/remote/api.remote";
  import { type RockFindResponse } from "$lib/server/api/types";
</script>

<h1>Rocks store</h1>
{@render rocksList(await getRocks({}))}

{#snippet rocksList(rocks: RockFindResponse)}
    {@const results = rocks.results}
    <h2>
        Result: {results.length} rocks
    </h2>
    <ul>
        {#each results as rock (rock.name)}
            <li>{rock.name}</li>
        {/each}
    </ul>
{/snippet}
