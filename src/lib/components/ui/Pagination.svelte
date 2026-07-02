<script lang="ts">
  let { page = 1 }: { page?: number } = $props();
</script>

<nav class="p-pagination" aria-label="Pagination">
  <ol class="p-pagination__items">
    <li class="p-pagination__item">
      <button type="button" class="p-pagination__link--previous" disabled aria-label="Previous page">
        <i class="p-icon--chevron-left"></i>
      </button>
    </li>
    <li class="p-pagination__item">
      <span class="p-pagination__link is-active" aria-current="page">{page}</span>
    </li>
    <li class="p-pagination__item">
      <button type="button" class="p-pagination__link--next" disabled aria-label="Next page">
        <i class="p-icon--chevron-right"></i>
      </button>
    </li>
  </ol>
</nav>
