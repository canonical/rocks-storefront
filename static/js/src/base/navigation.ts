function toggleDropdown(toggle: HTMLElement, open: boolean) {
  const parentElement = toggle.parentNode;
  const dropdown = document.getElementById(
    toggle.getAttribute("aria-controls")!
  );
  dropdown?.setAttribute("aria-hidden", (!open).toString());

  if (open) {
    (parentElement as HTMLElement).classList.add("is-active", "is-selected");
  } else {
    (parentElement as HTMLElement).classList.remove("is-active", "is-selected");
  }
}

function closeAllDropdowns(toggles: HTMLElement[]) {
  toggles.forEach((toggle) => {
    toggleDropdown(toggle, false);
  });
}

function handleClickOutside(
  toggles: HTMLElement[],
  containerClass: string
): void {
  document.addEventListener("click", (event: MouseEvent) => {
    const target = event.target as HTMLElement;

    if (target.closest) {
      if (!target.closest(containerClass)) {
        closeAllDropdowns(toggles);
      }
    }
  });
}

function initNavDropdowns(containerClass: string): void {
  const toggles = Array.from(
    document.querySelectorAll(containerClass + " [aria-controls]")
  ) as HTMLElement[];

  handleClickOutside(toggles, containerClass);

  toggles.forEach((toggle) => {
    toggle.addEventListener("click", (e: MouseEvent) => {
      e.preventDefault();

      const parentElement = (e.target as HTMLElement).parentNode as HTMLElement;
      const isOpen = parentElement.classList.contains("is-active");

      closeAllDropdowns(toggles);
      toggleDropdown(toggle, !isOpen);
    });
  });
}

initNavDropdowns(".p-navigation__item--dropdown-toggle");

export {
  toggleDropdown,
  closeAllDropdowns,
  handleClickOutside,
  initNavDropdowns,
};
