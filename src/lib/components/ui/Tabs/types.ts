import type { SvelteHTMLElements } from "svelte/elements";

export interface TabItem {
  /** Stable id, compared against `active` to mark the current tab. */
  id: string;
  /** Visible tab label. */
  label: string;
  /** Destination for the tab link. */
  href: string;
}

export interface TabsProps extends Omit<SvelteHTMLElements["nav"], "children"> {
  tabs: TabItem[];
  active: string;
}
