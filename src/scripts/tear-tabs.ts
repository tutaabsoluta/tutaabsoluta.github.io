/**
 * Contact's tear-off tabs (TearTabs.astro). Each tab is a mailto link with
 * an email already half written for one reason to get in touch.
 *
 * - Click / tap / Enter: the tab rips off the perforation and falls away,
 *   then the email draft opens.
 * - With a mouse or pen you can also pull it: drag down, the paper resists
 *   and stretches a little, and past a point it rips.
 * - Torn tabs leave a ragged stub; the link stays in place (still works).
 * - Reduced motion: no animation, the link just opens and the stub shows.
 */

const RIP_AT = 64; // px of downward pull before the paper gives
const OPEN_AFTER = 380; // ms: let the rip be seen before the mail app opens

const reducedMotion = (): boolean =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function showTaken(): void {
  document
    .querySelectorAll<HTMLElement>("[data-tear-taken]")
    .forEach((el) => (el.hidden = false));
}

function tilt(slot: HTMLElement): number {
  return parseFloat(getComputedStyle(slot).getPropertyValue("--tilt")) || 0;
}

/** Drops a copy of the tab from where it is, with a little flutter. */
function fall(tab: HTMLElement, slot: HTMLElement, dx: number): void {
  const rect = tab.getBoundingClientRect();
  const loose = tab.cloneNode(true) as HTMLElement;
  loose.removeAttribute("href");
  loose.removeAttribute("data-tear");
  loose.removeAttribute("data-pulling");
  loose.removeAttribute("style");
  loose.setAttribute("aria-hidden", "true");
  loose.classList.add("tab-falling");
  Object.assign(loose.style, {
    left: `${rect.left}px`,
    top: `${rect.top}px`,
    width: `${tab.offsetWidth}px`,
    height: `${tab.offsetHeight}px`,
  });
  document.body.append(loose);

  const dir = dx === 0 ? (Math.random() < 0.5 ? -1 : 1) : Math.sign(dx);
  const start = tilt(slot) + dx * 0.08;
  const animation = loose.animate(
    [
      { translate: `0 0`, rotate: `${start}deg` },
      // The rip: a jerk down and sideways as the last fibres let go.
      {
        translate: `${dir * 6}px 14px`,
        rotate: `${start + dir * 7}deg`,
        offset: 0.14,
      },
      // Then it drifts, swings back once, and drops out of sight.
      {
        translate: `${dir * 34}px 120px`,
        rotate: `${start - dir * 10}deg`,
        offset: 0.5,
      },
      {
        translate: `${dir * 70}px ${window.innerHeight * 0.6}px`,
        rotate: `${start + dir * 32}deg`,
        opacity: 0,
      },
    ],
    {
      duration: 1100,
      easing: "cubic-bezier(.4,0,.8,.6)",
      fill: "forwards",
      composite: "replace",
    },
  );
  animation.addEventListener("finish", () => loose.remove());
}

function initTab(tab: HTMLAnchorElement): void {
  const slot = tab.closest<HTMLElement>(".tab-slot");
  if (!slot) return;

  let origin: { x: number; y: number } | null = null;
  let moved = false;
  let ripped = false; // torn by a drag: the click that follows must not re-tear
  let pull = { dx: 0, dy: 0 };

  const isTorn = (): boolean => slot.hasAttribute("data-torn");

  const resetPull = (): void => {
    tab.removeAttribute("data-pulling");
    tab.style.translate = "";
    tab.style.rotate = "";
    tab.style.scale = "";
  };

  const rip = (): void => {
    origin = null;
    // Measured while still pulled, so the copy falls from where it was let go.
    fall(tab, slot, pull.dx);
    resetPull();
    slot.setAttribute("data-torn", "");
    showTaken();
    window.setTimeout(() => {
      window.location.href = tab.href;
    }, OPEN_AFTER);
  };

  tab.addEventListener("pointerdown", (event) => {
    // Touch scrolls the page; a tap tears instead (see click).
    if (event.pointerType === "touch" || event.button !== 0) return;
    if (isTorn() || reducedMotion()) return;
    origin = { x: event.clientX, y: event.clientY };
    moved = false;
    pull = { dx: 0, dy: 0 };
    tab.setPointerCapture(event.pointerId);
  });

  tab.addEventListener("pointermove", (event) => {
    if (!origin) return;
    const dx = event.clientX - origin.x;
    const dy = Math.max(0, event.clientY - origin.y);
    if (!moved && Math.hypot(dx, dy) < 5) return;
    moved = true;
    pull = { dx, dy };
    tab.setAttribute("data-pulling", "");
    // Paper resists: it moves less than the pointer, and stretches a hair.
    tab.style.translate = `${dx * 0.12}px ${dy * 0.45}px`;
    tab.style.rotate = `${dx * 0.08}deg`;
    tab.style.scale = `1 ${1 + Math.min(dy, RIP_AT) / 1600}`;
    if (dy >= RIP_AT) {
      ripped = true;
      rip();
    }
  });

  const release = (): void => {
    if (!origin) return;
    origin = null;
    if (!moved) return;
    // Let go too early: the tab springs back into the strip.
    const from = {
      translate: tab.style.translate,
      rotate: tab.style.rotate,
      scale: tab.style.scale,
    };
    resetPull();
    tab.animate([from, { translate: "0 0", rotate: "0deg", scale: "1 1" }], {
      duration: 420,
      easing: "cubic-bezier(.3,1.6,.5,1)",
    });
  };
  tab.addEventListener("pointerup", release);
  tab.addEventListener("pointercancel", release);

  tab.addEventListener("click", (event) => {
    if (ripped || (moved && !isTorn())) {
      // The drag already did (or cancelled) the work.
      event.preventDefault();
      ripped = false;
      moved = false;
      return;
    }
    if (isTorn()) return; // a stub: just open the draft again
    if (reducedMotion()) {
      slot.setAttribute("data-torn", "");
      showTaken();
      return; // the link opens as usual
    }
    event.preventDefault();
    pull = { dx: 0, dy: 0 };
    rip();
  });
}

export function initTearTabs(): void {
  document
    .querySelectorAll<HTMLAnchorElement>("[data-tear]")
    .forEach((tab) => initTab(tab));
}
