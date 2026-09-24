<script lang="ts">
  import type { EmptyCellProps } from "./types.js";

  let { label = "Not available" }: EmptyCellProps = $props();
</script>

<span aria-hidden="true">—</span>
<span class="visually-hidden">{label}</span>
