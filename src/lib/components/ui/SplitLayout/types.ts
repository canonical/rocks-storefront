import type { Snippet } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

export interface SplitLayoutProps
  extends Omit<SvelteHTMLElements["div"], "children"> {
  aside: Snippet;
  main: Snippet;
}
