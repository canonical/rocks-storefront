<script lang="ts">
  import type { Snippet } from "svelte";

  let {
    icon,
    title,
    children,
  }: { icon: string; title: string; children: Snippet } = $props();
</script>

<div class="p-card info-card">
  <div class="info-card__header">
    <i class={icon}></i>
    <h3 class="p-heading--5 u-no-margin--bottom">{title}</h3>
  </div>
  {@render children()}
</div>

<style>
  .info-card {
    height: 100%;
  }
  .info-card__header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }
</style>
