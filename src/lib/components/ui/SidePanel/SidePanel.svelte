<script lang="ts">
  import { SidePanel as DsSidePanel } from "@canonical/svelte-ds-app-launchpad";
  import type { SidePanelMethods, SidePanelProps } from "./types.js";
  import "./styles.css";

  let { class: className, ...rest }: SidePanelProps = $props();

  let panel = $state<SidePanelMethods>();

  export function showModal() {
    panel?.showModal();
  }

  export function close() {
    panel?.close();
  }
</script>

<DsSidePanel
  bind:this={panel}
  class={["app-side-panel", className].filter(Boolean).join(" ")}
  {...rest}
/>
