<script lang="ts">
  import type { TabsProps } from "./types.js";
  import "./styles.css";

  const componentCssClassName = "ds tabs";

  let {
    tabs,
    active,
    class: className,
    "aria-label": ariaLabel = "Tabs",
    ...rest
  }: TabsProps = $props();
</script>

<nav class={[componentCssClassName, className]} aria-label={ariaLabel} {...rest}>
  <ul class="tabs__list">
    {#each tabs as tab (tab.id)}
      <li class="tabs__item">
        <a
          class="tabs__link"
          href={tab.href}
          aria-current={tab.id === active ? "page" : undefined}
          data-sveltekit-noscroll
        >
          {tab.label}
        </a>
      </li>
    {/each}
  </ul>
</nav>
