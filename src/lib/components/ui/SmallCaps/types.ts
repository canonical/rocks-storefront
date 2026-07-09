import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";

export interface SmallCapsProps extends HTMLAttributes<HTMLSpanElement> {
  children: Snippet;
}
