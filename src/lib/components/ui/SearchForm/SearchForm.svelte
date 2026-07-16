<script lang="ts">
  import { SearchBox } from "@canonical/svelte-ds-app-launchpad";
  import { SpinnerIcon } from "@canonical/svelte-icons";
  import "./styles.css";

  export type Props = {
    name: string;
    value?: string;
    loading?: boolean;
  };

  let { name, value = $bindable(), loading }: Props = $props();
</script>

<form id="search-form" class="ds search-form" data-sveltekit-keepfocus>
    <label class="visually-hidden" for={name}>Search rocks</label>
    <SearchBox
        id={name}
        {name}
        bind:value
        placeholder="Search for a rock"
        aria-label="Search rocks"
    >
        <div class="ds search-box-children">
            {#if loading}
                <SpinnerIcon class="ds search-box-loading" />
            {/if}
            <SearchBox.SearchButton />
        </div>
    </SearchBox>
</form>
