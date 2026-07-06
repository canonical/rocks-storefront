<script lang="ts">
  import type { PageProps } from "./$types";

  const { data }: PageProps = $props();
  const rocks = $derived(data.rocks);
</script>

<h1>
    Rocks store
</h1>
<h2>
    Result: {rocks.length} rocks
</h2>
<ul>
    {#each rocks as rock (rock.name)}
        <li><a href={`/${encodeURIComponent(rock.name)}`}>{rock.name}</a></li>
    {/each}
</ul>
