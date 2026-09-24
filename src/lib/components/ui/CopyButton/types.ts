import type { HTMLButtonAttributes } from "svelte/elements";

export interface CopyButtonProps
  extends Omit<HTMLButtonAttributes, "onclick" | "children"> {
  value: string;
  label?: string;
}
