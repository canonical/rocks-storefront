<script lang="ts">
  import { getRocks } from "$lib/remote/api.remote";
  import debounced from "$lib/utils/debounced.svelte";

  type Props = {
    name: string;
    value?: string | null;
  };

  let { name, value }: Props = $props();
  let query = debounced(() => value, 200);
  const autocomplete = $derived(getRocks({ query: query() }));
</script>

<label for={name}>Search:</label>
<input type="search" id={name} {name} bind:value />

{#await autocomplete}
    <p>Loading</p>
{:then response}
    {@const rocks = response.results}
    <p>
        Found {rocks?.length ?? 0} rock{rocks?.length == 1 ? "" : "s"}
    </p>

    <ul>
        {#each rocks.slice(0, 5) as rock}
            <li>{rock.name}</li>
        {/each}
        {#if rocks?.length > 5}
            <li>and {rocks.length - 5} more...</li>
        {/if}
    </ul>
{:catch}
    <p>Error</p>
{/await}
