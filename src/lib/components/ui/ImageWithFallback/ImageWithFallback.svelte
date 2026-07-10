<script lang="ts">
  import type { HTMLAttributes } from "svelte/elements";

  export interface Props extends HTMLAttributes<HTMLImageElement> {
    src: string;
    fallback: string;
    alt: string;
  }

  let { src: srcInput, fallback, alt, ...rest }: Props = $props();

  let src = $derived(srcInput);
</script>

<img
    {src}
    {alt}
    {...rest}
    onerror={(event) => {
        rest.onerror?.(event);

        if (src !== fallback) {
            src = fallback;
        }
    }}
/>
