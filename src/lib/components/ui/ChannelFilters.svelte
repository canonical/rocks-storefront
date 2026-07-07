<script lang="ts">
  import Tag from "$lib/components/ui/Tag.svelte";

  interface Filter {
    label: string;
    options: string[];
    /** Option selected on first render. */
    selected?: string;
    /** Chip shown inside the control (e.g. "latest"); renders a select-styled dropdown. */
    badge?: string;
  }

  let {
    filters,
    onChange,
  }: {
    filters: Filter[];
    onChange?: (selections: Record<string, string>) => void;
  } = $props();

  let openLabel = $state<string | null>(null);
  const picked = $state<Record<string, string>>({});

  const selectedValue = (filter: Filter) =>
    picked[filter.label] ?? filter.selected;

  $effect(() => {
    const selections: Record<string, string> = {};
    for (const filter of filters)
      selections[filter.label] = selectedValue(filter) ?? "All";
    onChange?.(selections);
  });

  function toggle(label: string) {
    openLabel = openLabel === label ? null : label;
  }

  function choose(label: string, option: string) {
    picked[label] = option;
    openLabel = null;
  }

  function handleWindowClick(event: MouseEvent) {
    if (openLabel === null) return;
    if (!(event.target as HTMLElement).closest(".p-contextual-menu")) {
      openLabel = null;
    }
  }
</script>

<svelte:window
  onclick={handleWindowClick}
  onkeydown={(event) => event.key === "Escape" && (openLabel = null)}
/>

<div class="channel-filters">
  {#each filters as filter (filter.label)}
    <div class="channel-filters__group">
      <label class="channel-filters__label" for={`filter-${filter.label}`}>{filter.label}</label>
      {#if filter.badge}
        <!-- Native <select> can't contain a chip, so this control is a select-styled dropdown. -->
        <span class="p-contextual-menu">
          <button
            id={`filter-${filter.label}`}
            type="button"
            class="channel-combobox u-no-margin--bottom"
            aria-haspopup="listbox"
            aria-expanded={openLabel === filter.label}
            onclick={() => toggle(filter.label)}
          >
            <span>{selectedValue(filter)}</span>
            <Tag label={filter.badge} variant="information" />
            <i class="p-icon--chevron-down channel-combobox__chevron"></i>
          </button>
          <span
            class="p-contextual-menu__dropdown"
            role="listbox"
            aria-hidden={openLabel !== filter.label}
          >
            <span class="p-contextual-menu__group">
              {#each filter.options as option (option)}
                <button
                  type="button"
                  class="p-contextual-menu__link"
                  role="option"
                  aria-selected={selectedValue(filter) === option}
                  onclick={() => choose(filter.label, option)}
                >
                  {option}{#if option === filter.selected}&nbsp;<Tag
                      label={filter.badge}
                      variant="information"
                      inline
                    />{/if}
                </button>
              {/each}
            </span>
          </span>
        </span>
      {:else}
        <select
          id={`filter-${filter.label}`}
          class="channel-filters__select u-no-margin--bottom"
          onchange={(event) => {
            picked[filter.label] = event.currentTarget.value;
          }}
        >
          {#each filter.options as option (option)}
            <option selected={option === filter.selected}>{option}</option>
          {/each}
        </select>
      {/if}
    </div>
  {/each}
</div>

<style>
  .channel-filters {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 1.5rem;
    margin-bottom: 1.5rem;
  }
  .channel-filters__group {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .channel-combobox {
    display: inline-flex;
    align-items: center;
    gap: 0.75rem;
    background-color: #f5f5f5;
    border: 0 solid transparent;
    border-top: 1px solid transparent;
    border-bottom: 1px solid #707070;
    cursor: pointer;
    padding-right: 0.5rem;
  }
  .channel-combobox :global(.p-chip) {
    margin: 0;
  }
</style>
