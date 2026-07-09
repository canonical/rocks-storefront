<script lang="ts">
  import { Heading } from "$lib/components/ui/Heading";
  import type { RockFindResultItem } from "$lib/server/api/types";
  import RockCard from "./RockCard/RockCard.svelte";
  import "./styles.css";

  export type Props = {
    rocks: RockFindResultItem[];
  };

  const { rocks }: Props = $props();
</script>

<Heading level={2} class="visually-hidden">Search results</Heading>

{#if rocks.length > 0}
    <ul class="ds rocks-list">
        {#each rocks as rock (rock.name)}
            <li>
                <RockCard {rock} />
                <hr />
            </li>
        {/each}
    </ul>
{:else}
    No results :(
{/if}
