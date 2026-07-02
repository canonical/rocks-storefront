<script lang="ts">
  import type { PageProps } from "./$types";

  const { data }: PageProps = $props();
  // svelte-ignore state_referenced_locally
  const rocks = data.rocks;
</script>

<h1>
    Rocks store
</h1>
<h2>
    Result: {rocks.length} rocks
</h2>
<ul>
    {#each rocks as rock (rock.name)}
        <li>{rock.name}</li>
    {/each}
</ul>
