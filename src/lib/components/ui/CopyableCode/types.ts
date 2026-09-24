import type { HTMLAttributes } from "svelte/elements";

export interface CopyableCodeProps extends HTMLAttributes<HTMLDivElement> {
  /** The command shown, and the text written to the clipboard. */
  value: string;
}
