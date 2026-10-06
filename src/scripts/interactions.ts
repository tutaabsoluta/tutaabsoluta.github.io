/**
 * Small native-API interactions: mobile menu, project details disclosure,
 * experience-log toggles, and the "Seen in" chip highlight with its return link.
 */

const FLASH_MS = 1600;

function controlled(button: HTMLElement): HTMLElement[] {
  return (button.getAttribute("aria-controls") ?? "")
    .split(/\s+/)
    .map((id) => (id ? document.getElementById(id) : null))
    .filter((el): el is HTMLElement => el !== null);
}

function initMenu(): void {
  const toggle =
    document.querySelector<HTMLButtonElement>("[data-menu-toggle]");
  const [menu] = toggle ? controlled(toggle) : [];
  if (!toggle || !menu) return;

  const setOpen = (open: boolean): void => {
    toggle.setAttribute("aria-expanded", String(open));
    toggle.textContent =
      (open ? toggle.dataset["labelClose"] : toggle.dataset["labelOpen"]) ?? "";
    menu.hidden = !open;
  };

  toggle.addEventListener("click", () => {
    setOpen(toggle.getAttribute("aria-expanded") !== "true");
  });

  menu.querySelectorAll("[data-menu-link]").forEach((link) => {
    link.addEventListener("click", () => setOpen(false));
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !menu.hidden) {
      setOpen(false);
      toggle.focus();
    }
  });

  // The menu only exists below 760px; reset it when the desktop nav takes over.
  window
    .matchMedia("(min-width: 760px)")
    .addEventListener("change", (event) => {
      if (event.matches) setOpen(false);
    });
}

function initDisclosures(): void {
  document
    .querySelectorAll<HTMLButtonElement>("[data-disclosure]")
    .forEach((button) => {
      const [panel] = controlled(button);
      if (!panel) return;
      button.addEventListener("click", () => {
        const open = button.getAttribute("aria-expanded") !== "true";
        button.setAttribute("aria-expanded", String(open));
        panel.hidden = !open;
      });
    });
}

function initTileFlips(): void {
  document
    .querySelectorAll<HTMLButtonElement>("[data-flip]")
    .forEach((button) => {
      const [original] = controlled(button);
      if (!original) return;
      button.addEventListener("click", () => {
        const open = button.getAttribute("aria-expanded") !== "true";
        button.setAttribute("aria-expanded", String(open));
        button.setAttribute(
          "aria-label",
          (open ? button.dataset["labelHide"] : button.dataset["labelShow"]) ??
            "",
        );
        original.hidden = !open;
      });
    });
}

/** Calls `done` once the page has stopped scrolling for `quietMs`. */
function afterScrollSettles(done: () => void, quietMs = 120): () => void {
  let timer = window.setTimeout(finish, quietMs);
  function onScroll(): void {
    window.clearTimeout(timer);
    timer = window.setTimeout(finish, quietMs);
  }
  function finish(): void {
    window.removeEventListener("scroll", onScroll);
    done();
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  return () => {
    window.clearTimeout(timer);
    window.removeEventListener("scroll", onScroll);
  };
}

function initChipFlash(): void {
  let timer: number | undefined;
  let cancelWait: (() => void) | undefined;
  let flashed: HTMLElement | null = null;
  // The one visible "back to How I work" link, if any.
  let back: HTMLAnchorElement | null = null;

  const hideBack = (): void => {
    if (back) back.hidden = true;
    back = null;
  };

  document
    .querySelectorAll<HTMLAnchorElement>("[data-back]")
    .forEach((link) => link.addEventListener("click", hideBack));

  document
    .querySelectorAll<HTMLAnchorElement>("[data-flash-target]")
    .forEach((chip) => {
      chip.addEventListener("click", () => {
        const target = document.getElementById(
          chip.dataset["flashTarget"] ?? "",
        );
        if (!target) return;
        window.clearTimeout(timer);
        cancelWait?.();
        flashed?.removeAttribute("data-flash");
        flashed = null;
        hideBack();
        const stage = chip.closest<HTMLElement>("[id^='stage-']");
        // Wait for the smooth scroll to land so the highlight is seen in full.
        cancelWait = afterScrollSettles(() => {
          flashed = target;
          target.setAttribute("data-flash", "");
          back = target.querySelector<HTMLAnchorElement>("[data-back]");
          if (back && stage) {
            back.href = `#${stage.id}`;
            back.hidden = false;
          }
          timer = window.setTimeout(() => {
            target.removeAttribute("data-flash");
            flashed = null;
          }, FLASH_MS);
        });
      });
    });
}

export function initInteractions(): void {
  initMenu();
  initDisclosures();
  initTileFlips();
  initChipFlash();
}
