<script lang="ts">
  import {
    Button,
    Link,
    RelativeDateTime,
    Select,
    Table,
  } from "@canonical/svelte-ds-app-launchpad";
  import {
    BookIcon,
    ChevronRightIcon,
    OpenTerminalIcon,
  } from "@canonical/svelte-icons";
  import { RockChannelPanel } from "$lib/components/rock/RockChannelPanel";
  import { CopyableCode } from "$lib/components/ui/CopyableCode";
  import { Heading } from "$lib/components/ui/Heading";
  import { SmallCaps } from "$lib/components/ui/SmallCaps";
  import {
    getArchitectures,
    getGroupedChannelRows,
    getImageReference,
    getVersions,
  } from "$lib/utils/rock";
  import "./styles.css";
  import type { RockChannelsProps } from "./types.js";

  const LEARN_USE_HREF =
    "https://documentation.ubuntu.com/rockcraft/en/stable/tutorial/";
  const LEARN_CHISEL_HREF =
    "https://documentation.ubuntu.com/rockcraft/en/stable/explanation/chisel/";

  const PAGE_SIZE = 10;

  const componentCssClassName = "ds rock-channels";

  let { rock }: RockChannelsProps = $props();

  const imageReference = $derived(getImageReference(rock));

  const rows = $derived(getGroupedChannelRows(rock));
  const versions = $derived(getVersions(rock));
  const latestVersion = $derived(rows.find((r) => r.version)?.version);
  const architectures = $derived(getArchitectures(rock));

  let panel = $state<ReturnType<typeof RockChannelPanel> | undefined>();
  let selectedChannelTag = $state<string | null>(null);

  function openChannel(channelTag: string) {
    selectedChannelTag = channelTag;
    panel?.showModal();
  }

  let versionFilter = $state("");
  let architectureFilter = $state("");
  let currentPage = $state(1);

  const filteredRows = $derived(
    rows.filter(
      (r) =>
        (!versionFilter || r.version === versionFilter) &&
        (!architectureFilter || r.architectures.includes(architectureFilter)),
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
    <Heading level={3}>Get started</Heading>
    <div class="rock-channels__cards">
      <article class="rock-channels__card">
        <div class="rock-channels__card-header">
          <OpenTerminalIcon />
          <Heading level={3}>Get a rock</Heading>
        </div>
        <p>
          Rocks are compatible with a wide variety of tools. To get a rock,
          choose a channel tag, add it to the registry address, and use the
          tool of your choice to access the image.
        </p>
        <CopyableCode value={imageReference} />
      </article>
      <article class="rock-channels__card">
        <div class="rock-channels__card-header">
          <BookIcon />
          <Heading level={3}>Learn more about rocks</Heading>
        </div>
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

  <section class="rock-channels__section">
    <Heading level={3}>Tags and channels</Heading>

    <div class="rock-channels__filters">
      <label class="rock-channels__filter">
        <span>Version</span>
        <Select bind:value={versionFilter} onchange={resetPage}>
          <option value="">All</option>
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
    </div>

    {#if filteredRows.length === 0}
      <p class="rock-channels__empty">No channels available yet.</p>
    {:else}
      <Table>
        <thead>
          <tr>
            <th scope="col"><SmallCaps>Channel tag</SmallCaps></th>
            <th scope="col"><SmallCaps>Version</SmallCaps></th>
            <th scope="col"><SmallCaps>Architecture</SmallCaps></th>
            <th scope="col"><SmallCaps>Updated</SmallCaps></th>
          </tr>
        </thead>
        <tbody>
          {#each pagedRows as row (row.channelTag)}
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
              <td>{row.version || "—"}</td>
              <td>{row.architectures.join(", ") || "—"}</td>
              <td>
                {#if row.lastUpdated}
                  <RelativeDateTime date={row.lastUpdated} />
                {:else}
                  -
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
