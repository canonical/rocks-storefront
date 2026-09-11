<script lang="ts">
  import { Code } from "$lib/components/ui/Code";
  import { CopyButton } from "$lib/components/ui/CopyButton";
  import type { CopyableCodeProps } from "./types.js";
  import "./styles.css";

  const componentCssClassName = "ds copyable-code";

  let { value, class: className, ...rest }: CopyableCodeProps = $props();
</script>

<div class={[componentCssClassName, className]} {...rest}>
  <Code>{value}</Code>
  <CopyButton {value} class="copy" />
</div>
