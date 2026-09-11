<script lang="ts" module>
  const DATE_FORMATTER = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
</script>

<script lang="ts">
  import {
    DateTime,
    Select,
    SidePanel,
    type SidePanelMethods,
  } from "@canonical/svelte-ds-app-launchpad";
  import { CloseIcon } from "@canonical/svelte-icons";
  import { Table } from "@canonical/svelte-ds-app-launchpad";
  import { CopyButton } from "$lib/components/ui/CopyButton";
  import { Heading } from "$lib/components/ui/Heading";
  import { SmallCaps } from "$lib/components/ui/SmallCaps";
  import { formatFileSize, truncateDigest } from "$lib/utils/format";
  import { getChannelRevisions } from "$lib/utils/rock";
  import type { RockChannelPanelProps } from "./types.js";
  import "./styles.css";

  const componentCssClassName = "ds rock-channel-panel";

  const { rock, channelTag }: RockChannelPanelProps = $props();

  let panel = $state<SidePanelMethods>();
  let architectureFilter = $state("");

  const revisions = $derived(
    channelTag ? getChannelRevisions(rock, channelTag) : [],
  );
  const architectures = $derived(
    [...new Set(revisions.map((r) => r.architecture).filter(Boolean))].sort(),
  );
  const visibleRevisions = $derived(
    revisions.filter(
      (r) => !architectureFilter || r.architecture === architectureFilter,
    ),
  );

  export const showModal = () => {
    architectureFilter = "";
    panel?.showModal();
  };
</script>

<SidePanel bind:this={panel} class={componentCssClassName}>
  {#snippet children(_commandfor, close)}
    <div class="rock-channel-panel__content">
      <div class="rock-channel-panel__header">
        <Heading level={4}>{channelTag}</Heading>
        <button
          type="button"
          class="rock-channel-panel__close"
          onclick={close}
          aria-label="Close the channel panel"
        >
          <CloseIcon />
        </button>
      </div>

      <div class="rock-channel-panel__intro-group">
        <Heading level={5}>Channel information</Heading>
        <p class="rock-channel-panel__intro">
          Stable channels receive regular update that are maintained by
          Canonical.
        </p>
      </div>

      {#if architectures.length > 1}
        <label class="rock-channel-panel__filter">
          <span>Architecture</span>
          <Select bind:value={architectureFilter}>
            <option value="">All</option>
            {#each architectures as architecture (architecture)}
              <option value={architecture}>{architecture}</option>
            {/each}
          </Select>
        </label>
      {/if}

      {#if visibleRevisions.length === 0}
        <p class="rock-channel-panel__empty">No revisions available yet.</p>
      {:else}
        <Table>
          <thead>
            <tr>
              <th scope="col"><SmallCaps>Revision</SmallCaps></th>
              <th scope="col"><SmallCaps>Architecture</SmallCaps></th>
              <th scope="col"><SmallCaps>Size</SmallCaps></th>
              <th scope="col"><SmallCaps>Updated</SmallCaps></th>
              <th scope="col"><SmallCaps>Digest</SmallCaps></th>
            </tr>
          </thead>
          <tbody>
            {#each visibleRevisions as row (`${row.revision}|${row.architecture}`)}
              <tr>
                <td>{row.revision ?? "—"}</td>
                <td>{row.architecture || "—"}</td>
                <td>{formatFileSize(row.size)}</td>
                <td>
                  {#if row.updated}
                    <DateTime date={row.updated} formatter={DATE_FORMATTER} />
                  {:else}
                    —
                  {/if}
                </td>
                <td>
                  {#if row.digest}
                    {@render digestCell(row.digest, row.revision)}
                  {:else}
                    —
                  {/if}
                </td>
              </tr>
            {/each}
          </tbody>
        </Table>
      {/if}
    </div>
  {/snippet}
</SidePanel>

{#snippet digestCell(digest: string, revision: number | null)}
  <span class="rock-channel-panel__digest">
    <span>sha:{truncateDigest(digest)}</span>
    <CopyButton
      value={digest}
      label={`Copy the digest for revision ${revision}`}
    />
  </span>
{/snippet}
