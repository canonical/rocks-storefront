<script lang="ts">
  import {
    Table as DsTable,
    type TableProps,
  } from "@canonical/svelte-ds-app-launchpad";
  import "./styles.css";

  const componentCssClassName = "ds table-scroll";

  let props: TableProps = $props();
</script>

<div class={componentCssClassName}>
  <DsTable {...props} />
</div>
