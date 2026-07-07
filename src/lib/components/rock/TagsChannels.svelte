<script lang="ts">
  import ChannelFilters from "$lib/components/ui/ChannelFilters.svelte";
  import ChannelTable from "$lib/components/ui/ChannelTable.svelte";
  import CodeSnippet from "$lib/components/ui/CodeSnippet.svelte";
  import InfoCard from "$lib/components/ui/InfoCard.svelte";
  import type { ChannelRow, Rock } from "$lib/data/types";

  let { rock }: { rock: Rock } = $props();
  const tc = $derived(rock.tagsChannels);

  let selections = $state<Record<string, string>>({});

  function matches(row: ChannelRow): boolean {
    const equals = (label: string, value: string) => {
      const selected = selections[label];
      return !selected || selected === "All" || selected === value;
    };
    return (
      equals("Version", row.version) &&
      equals("Architecture", row.architecture) &&
      equals("Base", row.collection)
    );
  }

  const filteredChannels = $derived(tc.channels.filter(matches));

  const columns = [
    { key: "channelTag", label: "Channel tag" },
    { key: "version", label: "Version" },
    { key: "architecture", label: "Architecture" },
    { key: "lastUpdated", label: "Last updated" },
    { key: "registries", label: "Available registries" },
    { key: "collection", label: "Base" },
  ];

  const distinct = (values: string[]) => ["All", ...new Set(values)];
  const filters = $derived([
    {
      label: "Version",
      options: distinct(tc.channels.map((row) => row.version)),
    },
    {
      label: "Architecture",
      options: distinct(tc.channels.map((row) => row.architecture)),
    },
    {
      label: "Base",
      options: distinct(tc.channels.map((row) => row.collection)),
    },
  ]);
</script>

<section>
  <h3>Get started</h3>
  <div class="row">
    <div class="col-6">
      <InfoCard icon="p-icon--open-terminal" title="Pull the image">
        <p>Copy the channel tag and use the tool of your choice to pull an image.</p>
        <CodeSnippet code={tc.pullCommand} />
      </InfoCard>
    </div>
    <div class="col-6">
      <InfoCard icon="p-icon--book" title="Learn more about rocks">
        <p>
          Rocks are part of a rich ecosystem of tools to build and package more secure and
          performant OCI images.
        </p>
        <p class="u-no-margin--bottom">
          <a class="p-link" href="https://documentation.ubuntu.com/rockcraft/">
            Learn how to use a rock &rsaquo;
          </a>
        </p>
        <p class="u-no-margin--bottom">
          <a class="p-link" href="https://documentation.ubuntu.com/rockcraft/en/latest/explanation/chisel/">
            Learn how to optimise a rock with Chisel &rsaquo;
          </a>
        </p>
      </InfoCard>
    </div>
  </div>
</section>

<section class="tags-channels__section">
  <h3>Tags and channels</h3>
  <ChannelFilters {filters} onChange={(next) => (selections = next)} />
  <ChannelTable {columns} rows={filteredChannels} />
</section>

<style>
  .tags-channels__section {
    margin-top: 3rem;
  }
</style>
