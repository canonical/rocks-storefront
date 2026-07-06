<script lang="ts">
  let {
    label,
    href,
    variant,
    inline = false,
  }: {
    label: string;
    href?: string;
    variant?: string;
    inline?: boolean;
  } = $props();

  const base = $derived(
    ["p-chip", variant && `p-chip--${variant}`, inline && "is-inline"]
      .filter(Boolean)
      .join(" "),
  );
</script>

{#if href}
  <a class={base} {href}><span class="p-chip__value">{label}</span></a>
{:else}
  <span class={`${base} is-readonly`}><span class="p-chip__value">{label}</span></span>
{/if}
