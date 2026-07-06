<script lang="ts">
  let { title = "Verified publisher" }: { title?: string } = $props();
</script>

<i class="p-icon--certification" title={title} aria-label={title} role="img"></i>
