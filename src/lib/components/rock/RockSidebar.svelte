<script lang="ts">
  import LinkList from "$lib/components/ui/LinkList.svelte";
  import type { Rock } from "$lib/data/types";
  import MetadataSection from "./MetadataSection.svelte";

  let { rock }: { rock: Rock } = $props();
</script>

<aside>
  <ul class="p-list--divided u-no-margin--bottom">
    {#if rock.sourceCode.length}
      <MetadataSection title="Source code">
        <LinkList items={rock.sourceCode} />
      </MetadataSection>
    {/if}

    {#if rock.architectures.length}
      <MetadataSection title="Architectures">
        <p class="u-no-margin--bottom u-text--muted">{rock.architectures.join(", ")}</p>
      </MetadataSection>
    {/if}

    {#if rock.bases.length}
      <MetadataSection title="Base">
        <p class="u-no-margin--bottom u-text--muted">{rock.bases.join(", ")}</p>
      </MetadataSection>
    {/if}

    {#if rock.license}
      <MetadataSection title="License">
        <p class="u-no-margin--bottom u-text--muted">{rock.license}</p>
      </MetadataSection>
    {/if}

    {#if rock.contacts.length}
      <MetadataSection title="Contacts">
        <LinkList items={rock.contacts} />
      </MetadataSection>
    {/if}
  </ul>

  <hr class="p-rule" />
  <p>Share your thoughts on this rock with the community on discourse.</p>
  <a class="p-button" href={rock.discussionHref}>Join the discussion</a>
</aside>
