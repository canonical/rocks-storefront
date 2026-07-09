<script lang="ts">
  import type { SmallCapsProps } from "./types.js";
  import "./styles.css";

  const componentCssClassName = "ds small-caps";

  let { class: className, children, ...rest }: SmallCapsProps = $props();
</script>

<span class={[componentCssClassName, className]} {...rest}>
  {@render children()}
</span>
