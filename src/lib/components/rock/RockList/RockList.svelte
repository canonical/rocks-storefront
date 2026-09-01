<script lang="ts">
  import { Heading } from "$lib/components/ui/Heading";
  import SearchSuggestions from "$lib/components/ui/SearchSuggestions/SearchSuggestions.svelte";
  import type { RockFindResultItem } from "$lib/server/api/types";
  import RockCard from "./RockCard/RockCard.svelte";
  import "./styles.css";

  export type Props = {
    rocks: RockFindResultItem[];
  };

  const { rocks }: Props = $props();
</script>


{#if rocks.length > 0}
    <Heading level={2} class="visually-hidden">Search results</Heading>
    <ul class="ds rocks-list">
        {#each rocks as rock (rock.name)}
            <li>
                <RockCard {rock} />
                <hr />
            </li>
        {/each}
    </ul>

    {#if rocks.length < 5}
        <SearchSuggestions title="Not quite what you are looking for?" />
    {/if}
{:else}
    <SearchSuggestions title="No results found" />
{/if}

<!-- TODO: generalize this component to show featured rocks -->
