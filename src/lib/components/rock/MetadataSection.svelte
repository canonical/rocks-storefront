<script lang="ts">
  import type { Snippet } from "svelte";

  let { title, children }: { title: string; children: Snippet } = $props();
</script>

<li class="p-list__item">
  <h3 class="p-muted-heading">{title}</h3>
  {@render children()}
</li>
