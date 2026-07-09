<script lang="ts">
  import { Heading } from "$lib/components/ui/Heading";
  import { page } from "$app/state";

  const rockName = $derived(page.params.rock);
</script>

<svelte:head>
  <title>{rockName} · Rock Store</title>
</svelte:head>

<Heading level={1}>{rockName}</Heading>
