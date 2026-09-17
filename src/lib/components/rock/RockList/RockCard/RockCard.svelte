<script lang="ts">
  import {
    Chip,
    Link,
    RelativeDateTime,
  } from "@canonical/svelte-ds-app-launchpad";
  import { RevisionsIcon } from "@canonical/svelte-icons";
  import { Heading } from "$lib/components/ui/Heading";
  import ImageWithFallback from "$lib/components/ui/ImageWithFallback/ImageWithFallback.svelte";
  import type { RockFindResultItem } from "$lib/server/api/types";
  import {
    FALLBACK_ICON,
    getRockIconUrl,
    getRockPublisher,
    getRockTitle,
  } from "$lib/utils/rock";
  import "./styles.css";

  type Props = {
    rock: RockFindResultItem;
  };

  const VERIFIED_ICON = "https://assets.ubuntu.com/v1/ba8a4b7b-Verified.svg";

  const { rock }: Props = $props();

  const publisher = $derived(getRockPublisher(rock));
  const verified = $derived(
    rock.metadata?.publisher?.validation === "verified",
  );
  const channel = $derived(rock["default-release"]?.channel.name);
  const latestUpdate = $derived(
    rock["default-release"]?.channel["released-at"],
  );
  const [primaryCategory, ...otherCategories] = $derived(
    rock.metadata?.categories ?? [],
  );
</script>

<article class="ds rocks-list-card">
    <div class="body">
        <ImageWithFallback class="logo" src={getRockIconUrl(rock)} alt="" fallback={FALLBACK_ICON} />

        <div class="identity">
            <Link class="name" soft href={`/${encodeURIComponent(rock.name)}`}>
                <Heading level={5}>{getRockTitle(rock)}</Heading>
            </Link>

            {#if publisher}
                <span class="publisher">
                    {publisher}
                    {#if verified}
                        <img
                            class="verified"
                            src={VERIFIED_ICON}
                            alt="Verified account"
                            title="Verified account"
                            width="14"
                            height="14"
                        />
                    {/if}
                </span>
            {/if}
        </div>

        <p class={["summary", !rock.metadata?.summary && "empty"]}>
            {rock.metadata?.summary || "No summary"}
        </p>
    </div>

    <footer class="footer">
        <div class="categories">
            {#if primaryCategory}
                <Chip readonly density="dense" value={primaryCategory.name} />
            {/if}
            {#if otherCategories.length > 0}
                <Chip
                    readonly
                    density="dense"
                    value={`+${otherCategories.length}`}
                    title={otherCategories.map((c) => c.name).join(", ")}
                />
            {/if}
        </div>

        <div class="meta">
            {#if channel}
                <span class="channel" title="Default channel {channel}">{channel}</span>
            {/if}
            <span class="last-update">
                {@render latestUpdateText(latestUpdate)}
            </span>
        </div>
    </footer>
</article>

{#snippet latestUpdateText(latestUpdate?: string | null)}
    <RevisionsIcon aria-label="{rock.name} last updated" />
    {#if !isNaN(Date.parse(latestUpdate!))}
        <RelativeDateTime date={latestUpdate!} />
    {:else}
        unknown
    {/if}
{/snippet}
