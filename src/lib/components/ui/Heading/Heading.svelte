<script lang="ts">
  import type { HeadingProps } from "./types.js";
  import "./styles.css";

  const componentCssClassName = "ds heading";

  let {
    level = 1,
    class: className,
    children,
    ...rest
  }: HeadingProps = $props();
</script>

<svelte:element
  this={`h${level}`}
  class={[componentCssClassName, className]}
  data-level={level}
  {...rest}
>
  {@render children()}
</svelte:element>
