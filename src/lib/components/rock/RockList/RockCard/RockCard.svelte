<script lang="ts">
  import { Link, RelativeDateTime } from "@canonical/svelte-ds-app-launchpad";
  import { RevisionsIcon } from "@canonical/svelte-icons";
  import { Heading } from "$lib/components/ui/Heading";
  import ImageWithFallback from "$lib/components/ui/ImageWithFallback/ImageWithFallback.svelte";
  import type { RockFindResultItem } from "$lib/server/api/types";
  import "./styles.css";

  type Props = {
    rock: RockFindResultItem;
  };

  const FALLBACK_ICON =
    "https://assets.ubuntu.com/v1/be6eb412-snapcraft-missing-icon.svg";

  const { rock }: Props = $props();

  const latestRevision = $derived(rock["default-release"]?.version || "?");
  const latestUpdate = $derived(
    rock["default-release"]?.channel["released-at"],
  );
  const iconUrl = $derived(
    rock.metadata?.media?.find((m) => m.type === "icon")?.url ?? FALLBACK_ICON,
  );
</script>

<article class="ds rocks-list-card">
    <ImageWithFallback class="logo" src={iconUrl} alt="" fallback={FALLBACK_ICON} />

    <Link class="name" href={`/${encodeURIComponent(rock.name)}`}>
        <Heading level={3}>{rock.name}</Heading>
    </Link>

    {#if rock.metadata?.categories?.length}
        <div class="categories">
            {#each rock.metadata?.categories as category}
                <a href="/?category={encodeURIComponent(category.name)}"
                    >{category.name}</a
                >
            {/each}
        </div>
    {/if}

    <p class={["description", !rock.metadata?.description && "empty"]}>
        {rock.metadata?.description || "No description"}
    </p>

    <span class="revision small">
        Latest: {latestRevision}
    </span>

    <span class="last-update small">
        {@render latestUpdateText(latestUpdate)}
    </span>
</article>

{#snippet latestUpdateText(latestUpdate?: string | null)}
    <RevisionsIcon aria-label="{rock.name} last updated" />&nbsp;
    {#if !isNaN(Date.parse(latestUpdate!))}
        <RelativeDateTime date={latestUpdate!} />
    {:else}
        unknown
    {/if}
{/snippet}
