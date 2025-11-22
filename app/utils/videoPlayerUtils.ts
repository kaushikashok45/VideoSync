export function closeAllOpenPopovers() {
  if (document) {
    const popovers = document.querySelectorAll(".popover");
    if (popovers) {
      popovers.forEach((popover) => {
        popover.classList.add("opacity-0", "hidden");
      });
    }
  }
}
