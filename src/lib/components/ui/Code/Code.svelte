<script lang="ts">
  import type { CodeProps } from "./types.js";
  import "./styles.css";

  const componentCssClassName = "ds code";

  let { class: className, children, ...rest }: CodeProps = $props();
</script>

<code class={[componentCssClassName, className]} {...rest}>
  {@render children()}
</code>
