<script lang="ts">
  import type { SplitLayoutProps } from "./types.js";
  import "./styles.css";

  const componentCssClassName = "ds split-layout";

  let { aside, main, class: className, ...rest }: SplitLayoutProps = $props();
</script>

<div class={[componentCssClassName, "grid", "responsive", className]} {...rest}>
  <div class="split-layout__aside">{@render aside()}</div>
  <div class="split-layout__main">{@render main()}</div>
</div>
