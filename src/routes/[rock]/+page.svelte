<script lang="ts">
  import { page } from "$app/state";
  import { Heading } from "$lib/components/ui/Heading";

  const rockName = $derived(page.params.rock);
</script>

<svelte:head>
  <title>{rockName} · Rock Store</title>
</svelte:head>

<Heading level={1}>{rockName}</Heading>
