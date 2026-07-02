<script lang="ts">
  import type { ChannelRow } from "$lib/data/types";
  import { formatRelativeTime } from "$lib/utils/date";

  interface Column {
    key: string;
    label: string;
  }

  let { columns, rows }: { columns: Column[]; rows: ChannelRow[] } = $props();

  const rowKey = (row: ChannelRow) =>
    `${row.channelTag ?? ""}-${row.version}-${row.architecture}`;
</script>

<table>
  <thead>
    <tr>
      {#each columns as col (col.key)}
        <th><span class="p-muted-heading u-no-margin--bottom">{col.label}</span></th>
      {/each}
    </tr>
  </thead>
  <tbody>
    {#each rows as row (rowKey(row))}
      <tr>
        {#each columns as col (col.key)}
          <td>
            {#if col.key === "channelTag"}
              <a href={row.channelTagHref ?? "#"}>{row.channelTag}</a>
            {:else if col.key === "lastUpdated"}
              {formatRelativeTime(row.lastUpdated)}
            {:else if col.key === "securityCompliance"}
              {row.securityCompliance.length ? row.securityCompliance.join(", ") : "-"}
            {:else if col.key === "registries"}
              {row.registries.join(", ")}
            {:else}
              {row[col.key as keyof ChannelRow]}
            {/if}
          </td>
        {/each}
      </tr>
    {/each}
  </tbody>
</table>
