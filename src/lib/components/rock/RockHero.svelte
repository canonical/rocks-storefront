<script lang="ts">
  import Badge from "$lib/components/ui/Badge.svelte";
  import Tag from "$lib/components/ui/Tag.svelte";
  import type { Rock } from "$lib/data/types";
  import { formatRelativeTime } from "$lib/utils/date";
  import QuickPull from "./QuickPull.svelte";

  const FALLBACK_ICON =
    "https://assets.ubuntu.com/v1/be6eb412-snapcraft-missing-icon.svg";

  let { rock }: { rock: Rock } = $props();

  let iconSrc = $derived(rock.iconUrl || FALLBACK_ICON);

  function handleIconError(event: Event) {
    const img = event.currentTarget as HTMLImageElement;
    if (img.src !== FALLBACK_ICON) {
      img.src = FALLBACK_ICON;
    }
  }
</script>

<section class="p-strip--light rock-hero">
  <div class="row rock-hero__row">
    <div class="col-8">
      <div class="rock-hero__heading">
        <img
          class="rock-hero__icon"
          src={iconSrc}
          alt=""
          width="100"
          height="100"
          onerror={handleIconError}
        />
        <div class="rock-hero__body">
          <h1 class="p-heading--1 u-no-margin--bottom">{rock.name}</h1>
          <p class="rock-hero__meta u-no-margin--bottom">
            <span>{rock.publisher.name}</span>
            {#if rock.publisher.verified}<Badge />{/if}
            <span aria-hidden="true">|</span>
            <span>{rock.category}</span>
          </p>
          <p class="p-text--small u-text--muted rock-hero__updated">
            <i class="p-icon--revisions"></i>
            <time datetime={rock.publishedAt}>{formatRelativeTime(rock.publishedAt)}</time>
          </p>

          <QuickPull quickPull={rock.quickPull} />
        </div>
      </div>
    </div>

    {#if rock.securityCompliance.length}
      <div class="col-4">
        <h2 class="p-muted-heading">Security and compliance options</h2>
        {#each rock.securityCompliance as option (option)}
          <Tag label={option} />
        {/each}
      </div>
    {/if}
  </div>
</section>

<style>
  .rock-hero__heading {
    display: flex;
    align-items: flex-start;
    gap: 1.5rem;
  }
  .rock-hero__body :global(.quick-pull) {
    margin-top: 1.5rem;
  }
  .rock-hero__meta {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  /* Parent-qualified to out-specify Vanilla's `p + p { margin-top: -0.5rem }` rule. */
  .rock-hero__body .rock-hero__updated {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-top: 0.1rem;
  }
  .rock-hero__icon {
    border-radius: 50%;
    flex-shrink: 0;
  }
</style>
