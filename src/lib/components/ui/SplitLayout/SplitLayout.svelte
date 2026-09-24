<script lang="ts">
  import type { SplitLayoutProps } from "./types.js";

  const componentCssClassName = "ds split-layout";

  let { aside, main, class: className, ...rest }: SplitLayoutProps = $props();
</script>

<div
  class={[componentCssClassName, "grid", "responsive", "app-columns", className]}
  {...rest}
>
  <div class="app-columns__aside">{@render aside()}</div>
  <div class="app-columns__main">{@render main()}</div>
</div>
