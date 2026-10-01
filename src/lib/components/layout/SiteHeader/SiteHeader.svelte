<script lang="ts" module>
  const NAV_ITEMS = [
    { label: "Explore", href: "/" },
    {
      label: "Community",
      href: "https://ubuntu.com/project/docs/community/teams/rocks-team/",
      target: "_blank",
      rel: "noopener",
    },
    {
      label: "Forum",
      href: "https://discourse.ubuntu.com/c/project/rocks/117",
      target: "_blank",
      rel: "noopener",
    },
  ];
</script>

<script lang="ts">
  import logo from "$lib/assets/rockstore-logo.svg?raw";
  import "./styles.css";
</script>

<header class="ds site-header">
  <div class="app-container grid responsive app-columns site-header__bar">
    <a
      class="site-header__logo app-columns__aside"
      href="/"
      aria-label="Rockstore home"
    >
      {@html logo}
    </a>
    <nav class="app-columns__main" aria-label="Main">
      <ul class="site-header__nav">
        {#each NAV_ITEMS as { label, href, target, rel }}
          <li>
            <a class="site-header__link" {href} {target} {rel}>{label}</a>
          </li>
        {/each}
      </ul>
    </nav>
  </div>
</header>
