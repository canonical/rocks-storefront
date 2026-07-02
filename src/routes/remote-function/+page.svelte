<script lang="ts">
  import { getRocks } from "$lib/remote/api.remote";

  const rocks = (await getRocks({})).results;
</script>

<h1>Rocks store</h1>
<h2>
    Result: {rocks.length} rocks
</h2>
<ul>
    {#each rocks as rock}
        <li>{rock.name}</li>
    {/each}
</ul>
