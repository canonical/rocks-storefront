<script lang="ts">
  import type { PageProps } from "./$types";

  const { data }: PageProps = $props();
  // svelte-ignore state_referenced_locally
  const rocks = data.rocks;
</script>

<h1>
    Result: {rocks.length} rocks
</h1>
<ul>
    {#each rocks as rock}
        <li>{rock.name}</li>
    {/each}
</ul>
