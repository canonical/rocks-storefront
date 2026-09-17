<script lang="ts">
  import { Button, Chip, Link } from "@canonical/svelte-ds-app-launchpad";
  import { ChevronRightIcon } from "@canonical/svelte-icons";
  import { CopyableCode } from "$lib/components/ui/CopyableCode";
  import { Heading } from "$lib/components/ui/Heading";
  import ImageWithFallback from "$lib/components/ui/ImageWithFallback/ImageWithFallback.svelte";
  import { getImageReference, getRockTitle } from "$lib/utils/rock";
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
  const categories = $derived(rock.metadata?.categories ?? []);
  let iconUrl = $derived(
    rock.metadata?.media?.find((m) => m.type === "icon")?.url ?? FALLBACK_ICON,
  );
  const imageReference = $derived(getImageReference(rock));
</script>

<header class={componentCssClassName}>
  <div class="app-container rock-hero__inner">
    <ImageWithFallback src={iconUrl} alt="" fallback={FALLBACK_ICON} />

    <div class="rock-hero__body">
      <Heading level={1}>{title}</Heading>
      {#if publisher || categories.length}
        <p class="rock-hero__meta">
          {#if publisher}<span>By {publisher}</span>{/if}
          {#if publisher && categories.length}
            <span class="rock-hero__divider" aria-hidden="true"></span>
          {/if}
          {#each categories as category (category.name)}
            <Chip value={category.name} />
          {/each}
        </p>
      {/if}

      <div class="rock-hero__quick-pull">
        <div class="rock-hero__quick-pull-row">
          <CopyableCode value={imageReference} />
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
