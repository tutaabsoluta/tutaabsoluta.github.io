/**
 * The bug hunt, a two-part joke for desktop visitors.
 *
 * 1. FleeBug (02): the bug runs from the cursor. Each escape changes the
 *    pencil note; after the last one it runs off down the page.
 * 2. BugFight (volunteer): click to swing the sword. Five hits, each one
 *    adds visible damage (`hit-1` … `hit-5` on the svg); the fifth knocks
 *    it out, legs up with X eyes.
 */
import { ui } from "../data/content";

const NEAR = 120; // px: how close the cursor gets before the bug bolts
const HITS = 5;

const reducedMotion = (): boolean =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function setNote(note: Element, text: string): void {
  note.textContent = text;
  note.removeAttribute("data-changed");
  void (note as HTMLElement).offsetWidth; // restart the swap animation
  note.setAttribute("data-changed", "");
}

function initFlee(): void {
  const root = document.querySelector<HTMLElement>("[data-flee]");
  const bug = root?.querySelector<SVGElement>("[data-flee-bug]");
  const note = root?.querySelector("[data-flee-note]");
  const section = root?.closest("section");
  if (!root || !bug || !note || !section) return;

  let x = 0;
  let y = 0;
  let escapes = 0;
  let gone = false;
  let resting = true; // one escape per approach, not one per pixel

  const runOff = (): void => {
    gone = true;
    setNote(note, ui.bug.flee[ui.bug.flee.length - 1] ?? "");
    if (reducedMotion()) {
      bug.style.visibility = "hidden";
      return;
    }
    const animation = bug.animate(
      [
        { translate: `${x}px ${y}px`, rotate: "-10deg" },
        { translate: `${x - 30}px ${y + 20}px`, rotate: "-40deg", offset: 0.3 },
        {
          translate: `${x - 10}px ${y + 260}px`,
          rotate: "-170deg",
          opacity: 0,
        },
      ],
      { duration: 900, easing: "cubic-bezier(.5,0,.9,.6)", fill: "forwards" },
    );
    animation.addEventListener("finish", () => {
      bug.style.visibility = "hidden";
    });
  };

  const flee = (px: number, py: number): void => {
    const box = bug.getBoundingClientRect();
    const cx = box.left + box.width / 2;
    const cy = box.top + box.height / 2;
    const dx = cx - px;
    const dy = cy - py;
    const dist = Math.hypot(dx, dy) || 1;
    // Run directly away, with a sideways dodge; stay in its corner of the page.
    x = Math.min(0, Math.max(-320, x + (dx / dist) * 90 - 30));
    y = Math.min(10, Math.max(-110, y + (dy / dist) * 60));
    bug.style.translate = `${x}px ${y}px`;
    bug.style.rotate = `${-10 + (dx < 0 ? 18 : -18)}deg`;
    escapes += 1;
    if (escapes >= ui.bug.flee.length - 1) {
      window.setTimeout(runOff, 250);
    } else {
      setNote(note, ui.bug.flee[escapes] ?? "");
    }
  };

  section.addEventListener("pointermove", (event) => {
    if (gone) return;
    const box = bug.getBoundingClientRect();
    const near =
      Math.hypot(
        box.left + box.width / 2 - event.clientX,
        box.top + box.height / 2 - event.clientY,
      ) < NEAR;
    if (near && resting) {
      resting = false;
      flee(event.clientX, event.clientY);
      window.setTimeout(() => (resting = true), 350);
    }
  });
}

function initFight(): void {
  const button = document.querySelector<HTMLButtonElement>("[data-fight]");
  const scene = button?.querySelector<SVGElement>("[data-fight-scene]");
  const arm = scene?.querySelector<SVGElement>("[data-fight-arm]");
  const bug = scene?.querySelector<SVGElement>("[data-fight-bug]");
  const pow = scene?.querySelector<SVGElement>("[data-fight-pow]");
  const note = document.querySelector("[data-fight-note]");
  if (!button || !scene || !arm || !bug || !pow || !note) return;

  let hits = 0;

  button.addEventListener("click", () => {
    if (hits >= HITS) {
      setNote(note, ui.bug.done);
      return;
    }
    hits += 1;
    scene.classList.add(`hit-${hits}`);
    setNote(note, ui.bug.fight[hits] ?? "");
    if (hits === HITS) button.setAttribute("aria-label", ui.bug.doneLabel);

    if (reducedMotion()) return;
    // Swing, knock the bug back, and a "bonk!".
    arm.animate(
      [
        { rotate: "0deg" },
        { rotate: "-45deg" },
        { rotate: "25deg" },
        { rotate: "0deg" },
      ],
      { duration: 320, easing: "ease-out", composite: "add" },
    );
    bug.animate(
      [
        { translate: "0 0" },
        { translate: "7px -3px", offset: 0.35 },
        { translate: "-2px 0", offset: 0.7 },
        { translate: "0 0" },
      ],
      { duration: 360, delay: 120, easing: "ease-out" },
    );
    pow.removeAttribute("data-pop");
    void pow.getBoundingClientRect();
    pow.setAttribute("data-pop", "");
  });
}

export function initBugHunt(): void {
  initFlee();
  initFight();
}
