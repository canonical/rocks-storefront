<script lang="ts">
  let { label, href }: { label: string; href?: string } = $props();
</script>

{#if href}
  <a class="p-chip" {href}><span class="p-chip__value">{label}</span></a>
{:else}
  <span class="p-chip is-readonly"><span class="p-chip__value">{label}</span></span>
{/if}
