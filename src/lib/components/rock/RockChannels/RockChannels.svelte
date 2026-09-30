<script lang="ts">
  import {
    Button,
    Link,
    RelativeDateTime,
    Select,
    Table,
    Tooltip,
  } from "@canonical/svelte-ds-app-launchpad";
  import { ChevronRightIcon, InformationIcon } from "@canonical/svelte-icons";
  import { RockChannelPanel } from "$lib/components/rock/RockChannelPanel";
  import { RockCommandPanel } from "$lib/components/rock/RockCommandPanel";
  import { CopyableCode } from "$lib/components/ui/CopyableCode";
  import { EmptyCell } from "$lib/components/ui/EmptyCell";
  import { Heading } from "$lib/components/ui/Heading";
  import { SmallCaps } from "$lib/components/ui/SmallCaps";
  import {
    getArchitectures,
    getBase,
    getBases,
    getGroupedChannelRows,
    getImageReference,
    getLatestVersion,
    getVersions,
  } from "$lib/utils/rock";
  import "./styles.css";
  import type { RockChannelsProps } from "./types.js";

  const LEARN_USE_HREF =
    "https://ubuntu.com/containers/rockcraft/docs/1/tutorial/hello-world/#tutorial-create-a-hello-world-rock";
  const LEARN_CHISEL_HREF =
    "https://ubuntu.com/containers/rockcraft/docs/1/how-to/chiseling/chisel-existing-rock/";

  const PAGE_SIZE = 10;

  const componentCssClassName = "ds rock-channels";

  let { rock, rockcraftUrls = {} }: RockChannelsProps = $props();

  const imageReference = $derived(getImageReference(rock));

  const rows = $derived(getGroupedChannelRows(rock));
  const versions = $derived(getVersions(rock));
  const latestVersion = $derived(getLatestVersion(rock));
  const architectures = $derived(getArchitectures(rock));
  const bases = $derived(getBases(rock));

  let panel = $state<ReturnType<typeof RockChannelPanel> | undefined>();
  let commandPanel = $state<ReturnType<typeof RockCommandPanel> | undefined>();
  let selectedChannelTag = $state<string | null>(null);

  function openChannel(channelTag: string) {
    selectedChannelTag = channelTag;
    panel?.showModal();
  }

  let versionFilter = $derived(latestVersion ?? "");
  let architectureFilter = $state("");
  let osFilter = $state("");
  let currentPage = $state(1);

  const filteredRows = $derived(
    rows.filter(
      (r) =>
        r.version === versionFilter &&
        (!architectureFilter || r.architectures.includes(architectureFilter)) &&
        (!osFilter || getBase(r.track) === osFilter),
    ),
  );

  const totalPages = $derived(
    Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE)),
  );
  const page = $derived(Math.min(currentPage, totalPages));
  const pagedRows = $derived(
    filteredRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
  );

  function resetPage() {
    currentPage = 1;
  }
</script>

<div class={componentCssClassName}>
  <section class="rock-channels__section">
    <Heading level={2}>Get started</Heading>
    <div class="rock-channels__cards">
      <article class="rock-channels__card">
        <Heading level={3}>Get a rock</Heading>
        <p>
          Rocks are compatible with a wide variety of tools. To get a rock,
          choose a channel tag, add it to the registry address, and use the
          tool of your choice to access the image.
        </p>
        <div class="rock-channels__get">
          {#if imageReference}
            <CopyableCode value={imageReference} />
          {/if}
          <Button type="button" onclick={() => commandPanel?.showModal()}>
            Build your command
          </Button>
        </div>
      </article>
      <article class="rock-channels__card">
        <Heading level={3}>Learn more about rocks</Heading>
        <p>
          Rocks are part of a rich ecosystem of tools to build and package more
          secure and performant OCI images.
        </p>
        <p class="rock-channels__card-links">
          <Link href={LEARN_USE_HREF} target="_blank" rel="noopener">
            Learn how to build a rock
            <ChevronRightIcon />
          </Link>
          <Link href={LEARN_CHISEL_HREF} target="_blank" rel="noopener">
            Learn how to optimise a rock with Chisel
            <ChevronRightIcon />
          </Link>
        </p>
      </article>
    </div>
  </section>

  <RockChannelPanel bind:this={panel} {rock} channelTag={selectedChannelTag} />
  <RockCommandPanel
    bind:this={commandPanel}
    {rock}
    onViewDetails={openChannel}
  />

  <section class="rock-channels__section">
    <Heading level={2}>Tags and channels</Heading>

    <div class="rock-channels__filters">
      <label class="rock-channels__filter">
        <span>Version</span>
        <Select bind:value={versionFilter} onchange={resetPage}>
          {#each versions as version (version)}
            <option value={version}>
              {version === latestVersion ? `${version} (latest)` : version}
            </option>
          {/each}
        </Select>
      </label>
      <label class="rock-channels__filter">
        <span>Architecture</span>
        <Select bind:value={architectureFilter} onchange={resetPage}>
          <option value="">All</option>
          {#each architectures as architecture (architecture)}
            <option value={architecture}>{architecture}</option>
          {/each}
        </Select>
      </label>
      <label class="rock-channels__filter">
        <span>OS</span>
        <Select bind:value={osFilter} onchange={resetPage}>
          <option value="">All</option>
          {#each bases as base (base)}
            <option value={base}>{base}</option>
          {/each}
        </Select>
      </label>
    </div>

    {#if filteredRows.length === 0}
      <p class="rock-channels__empty">No channels available yet.</p>
    {:else}
      <Table>
        <thead>
          <tr>
            <th scope="col"><SmallCaps>Channel tag</SmallCaps></th>
            <th scope="col"><SmallCaps>Architecture</SmallCaps></th>
            <th scope="col"><SmallCaps>Updated</SmallCaps></th>
            <th scope="col">
              <span class="rock-channels__heading-with-hint">
                <SmallCaps>OS</SmallCaps>
                <Tooltip>
                  {#snippet trigger(triggerProps)}
                    <button
                      type="button"
                      class="rock-channels__hint"
                      aria-label="About the OS column"
                      onclick={(event) => event.detail > 0 && event.currentTarget.blur()}
                      {...triggerProps}
                    >
                      <InformationIcon />
                    </button>
                  {/snippet}
                  Rocks using the same OS are meant to work together and are
                  maintained as a unified distribution.
                </Tooltip>
              </span>
            </th>
            <th scope="col"><SmallCaps>Recipe</SmallCaps></th>
          </tr>
        </thead>
        <tbody>
          {#each pagedRows as row (row.channelTag)}
            {@const base = getBase(row.track)}
            {@const rockcraftUrl = rockcraftUrls[row.track]}
            <tr>
              <td>
                <button
                  type="button"
                  class="rock-channels__channel-tag"
                  onclick={() => openChannel(row.channelTag)}
                >
                  {row.channelTag}
                </button>
              </td>
              <td>
                {#if row.architectures.length}
                  {row.architectures.join(", ")}
                {:else}
                  <EmptyCell />
                {/if}
              </td>
              <td>
                {#if row.lastUpdated}
                  <RelativeDateTime date={row.lastUpdated} />
                {:else}
                  <EmptyCell />
                {/if}
              </td>
              <td>
                {#if base}{base}{:else}<EmptyCell />{/if}
              </td>
              <td>
                {#if rockcraftUrl}
                  <Link href={rockcraftUrl} target="_blank" rel="noopener">
                    rockcraft.yaml
                  </Link>
                {:else}
                  <EmptyCell />
                {/if}
              </td>
            </tr>
          {/each}
        </tbody>
      </Table>

      {#if totalPages > 1}
        <div class="rock-channels__pagination">
          <Button
            type="button"
            disabled={page <= 1}
            onclick={() => (currentPage = page - 1)}
          >
            Previous
          </Button>
          <span class="rock-channels__page-status">Page {page} of {totalPages}</span>
          <Button
            type="button"
            disabled={page >= totalPages}
            onclick={() => (currentPage = page + 1)}
          >
            Next
          </Button>
        </div>
      {/if}
    {/if}
  </section>
</div>
