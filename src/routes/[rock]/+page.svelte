<script lang="ts">
  import { RockHero } from "$lib/components/rock/RockHero";
  import { getRockTitle } from "$lib/utils/rock";
  import type { PageProps } from "./$types";

  let { data }: PageProps = $props();
  const rock = $derived(data.rock);
</script>

<svelte:head>
  <title>{getRockTitle(rock)} · Rock Store</title>
</svelte:head>

<RockHero {rock} />
