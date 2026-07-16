<script lang="ts">
  import { expoOut } from "svelte/easing";
  import { slide } from "svelte/transition";
  import { navigating } from "$app/state";
  import favicon from "$lib/assets/favicon.png";
  import { SiteHeader } from "$lib/components/layout/SiteHeader";
  import "../app.css";

  let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{#if navigating.complete !== null}
  <!--
    Loading animation for next page since svelte doesn't show any indicator.
     - delay 100ms because most page loads are instant, and we don't want to flash
     - long 10s duration because we don't actually know how long it will take
     - exponential easing so fast loads (>100ms and <1s) still see enough progress,
       while slow networks see it moving for a full 12 seconds
  -->
  <div
    class="ds navigation-loader"
    in:slide={{ delay: 100, duration: 10000, axis: "x", easing: expoOut }}
  ></div>
{/if}

<SiteHeader />

<main>
  {@render children()}
</main>

<style lang="css">
  .ds.navigation-loader {
    position: fixed;
    top: 0;
    right: 0;
    left: 0;
    z-index: 100;
    height: var(--dimension-050);
    background-color: var(--color-brand-primary);
  }
</style>
