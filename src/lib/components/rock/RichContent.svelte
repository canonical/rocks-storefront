<script lang="ts">
  // `html` must already be sanitized upstream.
  let { html }: { html: string } = $props();
</script>

<div class="rich-content">{@html html}</div>

<style>
  .rich-content :global(pre) {
    overflow-x: auto;
  }
</style>
