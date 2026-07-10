<script lang="ts">
  import {
    Button,
    Link,
    RelativeDateTime,
  } from "@canonical/svelte-ds-app-launchpad";
  import { ChevronRightIcon, RevisionsIcon } from "@canonical/svelte-icons";
  import { Code } from "$lib/components/ui/Code";
  import { Heading } from "$lib/components/ui/Heading";
  import ImageWithFallback from "$lib/components/ui/ImageWithFallback/ImageWithFallback.svelte";
  import { SmallCaps } from "$lib/components/ui/SmallCaps";
  import { getRockTitle } from "$lib/utils/rock";
  import "./styles.css";
  import type { RockHeroProps } from "./types.js";

  const FALLBACK_ICON =
    "https://assets.ubuntu.com/v1/be6eb412-snapcraft-missing-icon.svg";
  const SEE_ALL_TAGS_HREF = "?tab=tags";
  const LEARN_MORE_HREF = "https://documentation.ubuntu.com/rockcraft/";

  const componentCssClassName = "ds rock-hero";

  let { rock }: RockHeroProps = $props();

  const title = $derived(getRockTitle(rock));
  const publisher = $derived(
    rock.metadata?.publisher?.["display-name"] ??
      rock.metadata?.publisher?.username,
  );
  const category = $derived(rock.metadata?.categories?.[0]?.name);
  let iconUrl = $derived(
    rock.metadata?.media?.find((m) => m.type === "icon")?.url ?? FALLBACK_ICON,
  );
  const publishedAt = $derived.by(() => {
    const dates = (rock["channel-map"] ?? [])
      .map((c) => c.channel?.["released-at"] ?? c.revision?.["created-at"])
      .filter((d): d is string => Boolean(d));
    return dates.length ? dates.reduce((a, b) => (b > a ? b : a)) : undefined;
  });
  const latestTag = $derived(rock["default-track"] || "latest");
</script>

<header class={componentCssClassName}>
  <div class="app-container rock-hero__inner">
    <ImageWithFallback src={iconUrl} alt="" fallback={FALLBACK_ICON} />

    <div class="rock-hero__body">
      <Heading level={1}>{title}</Heading>
      {#if publisher || category}
        <p class="rock-hero__meta">
          {#if publisher}<span>{publisher}</span>{/if}
          {#if publisher && category}<span aria-hidden="true">·</span>{/if}
          {#if category}<span>{category}</span>{/if}
        </p>
      {/if}
      {#if publishedAt}
        <p class="rock-hero__updated">
          <RevisionsIcon />
          <RelativeDateTime date={publishedAt} />
        </p>
      {/if}

      <div class="rock-hero__quick-pull">
        <SmallCaps>Quick pull</SmallCaps>
        <div class="rock-hero__quick-pull-row">
          <Code>{latestTag}</Code>
          <Button href={SEE_ALL_TAGS_HREF} data-sveltekit-noscroll>See all tags</Button>
          <Link
            class="rock-hero__learn"
            href={LEARN_MORE_HREF}
            target="_blank"
            rel="noopener"
          >
            Learn how to use rocks
            <ChevronRightIcon />
          </Link>
        </div>
      </div>
    </div>
  </div>
</header>
