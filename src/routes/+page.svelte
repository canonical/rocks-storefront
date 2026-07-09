<script lang="ts">
  import { Link } from "@canonical/svelte-ds-app-launchpad";
  import { Heading } from "$lib/components/ui/Heading";
  import type { PageProps } from "./$types";

  const { data }: PageProps = $props();
  const rocks = $derived(data.rocks);
</script>

<Heading level={1}>Rocks store</Heading>
<Heading level={2}>Result: {rocks.length} rocks</Heading>
<ul>
    {#each rocks as rock (rock.name)}
        <li><Link href={`/${encodeURIComponent(rock.name)}`}>{rock.name}</Link></li>
    {/each}
</ul>
