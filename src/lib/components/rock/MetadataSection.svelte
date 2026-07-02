<script lang="ts">
  import type { Snippet } from "svelte";

  // A `p-list__item` so a parent `p-list--divided` draws the dividers between sections.
  let { title, children }: { title: string; children: Snippet } = $props();
</script>

<li class="p-list__item">
  <h3 class="p-muted-heading">{title}</h3>
  {@render children()}
</li>
