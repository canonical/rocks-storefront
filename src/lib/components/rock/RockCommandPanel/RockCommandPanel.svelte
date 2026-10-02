<script lang="ts">
  import { Button, Select } from "@canonical/svelte-ds-app-launchpad";
  import { CloseIcon } from "@canonical/svelte-icons";
  import { onDestroy } from "svelte";
  import { CopyableCode } from "$lib/components/ui/CopyableCode";
  import { Heading } from "$lib/components/ui/Heading";
  import {
    SidePanel,
    type SidePanelMethods,
  } from "$lib/components/ui/SidePanel";
  import { copier } from "$lib/utils/clipboard.svelte";
  import {
    ANY,
    buildCommand,
    getChannelTag,
    getCommandOptions,
    TOOLS,
  } from "$lib/utils/command";
  import { getLatestVersion, getRepository, getRisks } from "$lib/utils/rock";
  import type { RockCommandPanelProps } from "./types.js";
  import "./styles.css";

  const componentCssClassName = "ds rock-command-panel";

  let { rock, onViewDetails }: RockCommandPanelProps = $props();

  let panel = $state<SidePanelMethods>();

  const registry = $derived(getRepository(rock) ?? "");

  let tool = $state(TOOLS[0].id);
  let architecture = $state(ANY);
  let version = $derived(getLatestVersion(rock) ?? "");
  let risk = $derived(getRisks(rock)[0] ?? "");

  const options = $derived(
    getCommandOptions(rock, { version, architecture, risk }),
  );

  $effect(() => {
    if (!options.versions.includes(version)) {
      version = options.versions[0] ?? "";
    }
    if (!options.risks.includes(risk)) {
      risk = options.risks[0] ?? "";
    }
    if (architecture !== ANY && !options.architectures.includes(architecture)) {
      architecture = ANY;
    }
  });

  const channelTag = $derived(getChannelTag(rock, version, risk));

  const clipboard = copier();

  onDestroy(() => clipboard.destroy());

  const command = $derived(
    buildCommand(rock, registry, { tool, version, architecture, risk }),
  );

  export const showModal = () => panel?.showModal();
</script>

<SidePanel bind:this={panel} class={componentCssClassName}>
  {#snippet children(_commandfor, close)}
    <div class="rock-command-panel__content">
      <div class="rock-command-panel__header">
        <Heading level={4}>Command builder</Heading>
        <button
          type="button"
          class="rock-command-panel__close"
          onclick={close}
          aria-label="Close the command builder"
        >
          <CloseIcon />
        </button>
      </div>

      <label class="rock-command-panel__field">
        <span>Tool</span>
        <Select bind:value={tool}>
          {#each TOOLS as option (option.id)}
            <option value={option.id}>{option.label}</option>
          {/each}
        </Select>
      </label>

      <label class="rock-command-panel__field">
        <span>Version</span>
        <Select bind:value={version}>
          {#each options.versions as option (option)}
            <option value={option}>{option}</option>
          {/each}
        </Select>
      </label>

      <label class="rock-command-panel__field">
        <span>Architecture</span>
        <Select bind:value={architecture}>
          <option value={ANY}>{ANY}</option>
          {#each options.architectures as option (option)}
            <option value={option}>{option}</option>
          {/each}
        </Select>
      </label>

      <label class="rock-command-panel__field">
        <span>Risk level</span>
        <Select bind:value={risk}>
          {#each options.risks as option (option)}
            <option value={option}>{option}</option>
          {/each}
        </Select>
      </label>

      {#if command}
        <CopyableCode value={command} />
      {/if}

      {#if channelTag}
        <div class="rock-command-panel__actions">
          <Button
            severity="positive"
            type="button"
            onclick={() => clipboard.copy(command)}
          >
            {clipboard.copied ? "Copied" : "Copy"}
          </Button>
          <Button
            type="button"
            onclick={() => {
              close();
              onViewDetails?.(channelTag);
            }}
          >
            View details
          </Button>
        </div>
      {/if}
    </div>
  {/snippet}
</SidePanel>
