<script lang="ts">
  import favicon from "$lib/assets/favicon.png";
  import { SiteHeader } from "$lib/components/layout/SiteHeader";
  import "../app.css";

  let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<SiteHeader />

<main>
  {@render children()}
</main>
