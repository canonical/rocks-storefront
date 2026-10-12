<script lang="ts">
  import { page } from "$app/state";
  import { Heading } from "$lib/components/ui/Heading";
  import { SearchForm } from "$lib/components/ui/SearchForm";
  import "./error.css";

  type ErrorContent = {
    title?: string;
    heading?: string;
    subheading: string;
    search: boolean;
  };

  const NOT_FOUND: ErrorContent = {
    title: "404: Page not found",
    heading: "404: We couldn't find that page",
    subheading: "Looking for a rock? Try searching:",
    search: true,
  };

  const CONTENT: Record<number, ErrorContent> = {
    404: NOT_FOUND,
    410: {
      ...NOT_FOUND,
      heading: "410: The page you are looking for was deleted",
    },
    503: {
      title: "Maintenance mode enabled",
      heading: "We're experiencing issues or doing maintenance",
      subheading: "Please try again later",
      search: false,
    },
  };

  const content = $derived(
    CONTENT[page.status] ?? {
      title: page.error?.message,
      heading: page.error?.message,
      subheading: "Please try again later",
      search: false,
    },
  );
</script>

<svelte:head>
  <title>{content.title} · Rock Store</title>
</svelte:head>

<div class="app-container error-page">
  <Heading level={1}>{content.heading}</Heading>
  <Heading level={2}>{content.subheading}</Heading>
  {#if content.search}
    <div class="grid responsive">
      <div class="error-page__search">
        <SearchForm name="q" />
      </div>
    </div>
  {/if}
</div>
