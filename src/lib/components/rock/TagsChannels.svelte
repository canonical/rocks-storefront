<script lang="ts">
  import ChannelFilters from "$lib/components/ui/ChannelFilters.svelte";
  import ChannelTable from "$lib/components/ui/ChannelTable.svelte";
  import CodeSnippet from "$lib/components/ui/CodeSnippet.svelte";
  import InfoCard from "$lib/components/ui/InfoCard.svelte";
  import Pagination from "$lib/components/ui/Pagination.svelte";
  import type { Rock } from "$lib/data/types";

  let { rock }: { rock: Rock } = $props();
  const tc = $derived(rock.tagsChannels);

  const freeColumns = [
    { key: "channelTag", label: "Channel tag" },
    { key: "version", label: "Version" },
    { key: "architecture", label: "Architecture" },
    { key: "lastUpdated", label: "Last updated" },
    { key: "registries", label: "Available registries" },
    { key: "collection", label: "Collection" },
  ];

  const proColumns = [
    { key: "version", label: "Version" },
    { key: "architecture", label: "Architecture" },
    { key: "lastUpdated", label: "Last updated" },
    { key: "securityCompliance", label: "Security and compliance" },
    { key: "registries", label: "Available registries" },
    { key: "collection", label: "Collection" },
  ];

  const distinct = (values: string[]) => ["All", ...new Set(values)];
  // The version tagged "latest" is preselected in the Version filter.
  const latestVersion = $derived(
    tc.free.find((row) => row.channelTag === "latest")?.version,
  );
  const filters = $derived([
    {
      label: "Version",
      options: tc.pro.map((row) => row.version),
      selected: latestVersion,
      badge: "latest",
    },
    {
      label: "Architecture",
      options: distinct(tc.pro.map((row) => row.architecture)),
    },
    {
      label: "Compliance",
      options: distinct(tc.pro.flatMap((row) => row.securityCompliance)),
    },
    {
      label: "Collection",
      options: distinct(tc.pro.map((row) => row.collection)),
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
  <h3>Free</h3>
  <p class="u-no-max-width">
    Free images do not require an Ubuntu Pro subscription to access. They are not maintained and
    supported long term.
  </p>
  <ChannelTable columns={freeColumns} rows={tc.free} />
</section>

<section class="tags-channels__section">
  <h2>Available with Ubuntu Pro</h2>
  <p class="u-no-max-width">
    Access all images, get security updates, and explore support options with Ubuntu Pro. If you are
    an individual user or a community member, get an Ubuntu Pro account for free
    <a href="https://ubuntu.com/pro">here</a>. Check
    <a href="https://ubuntu.com/pro/subscribe">pricing</a> for more information.
  </p>
  <p>
    <a class="p-button" href="https://ubuntu.com/pro">Get Ubuntu Pro</a>
  </p>

  <ChannelFilters {filters} />
  <ChannelTable columns={proColumns} rows={tc.pro} />

  <div class="tags-channels__pagination">
    <Pagination page={1} />
  </div>

  <p class="tags-channels__footer">
    Can't find the version you are looking for, or the architecture you need?<br />
    <a href="https://ubuntu.com/contact-us">Contact us</a> to get a consultation.
  </p>
</section>

<style>
  .tags-channels__section {
    margin-top: 3rem;
  }
  .tags-channels__pagination {
    display: flex;
    justify-content: flex-end;
    margin-top: 1rem;
  }
  .tags-channels__footer {
    margin-top: 2rem;
  }
</style>
