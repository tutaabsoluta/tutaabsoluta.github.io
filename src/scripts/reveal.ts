/**
 * One-shot reveal animations driven by IntersectionObserver + Web
 * Animations. Nothing loops.
 *
 * Elements opt in with `data-fx` (and optional `data-delay`). An element can
 * switch effect/delay below a breakpoint with `data-narrow` (a media query),
 * `data-fx-narrow` and `data-delay-narrow`. SVG strokes opt in with
 * `data-draw` (they draw themselves, like a pen).
 *
 * `data-fx-done` is set the moment an element starts revealing, so CSS can
 * chain its own follow-up animations onto it (a strike-through being drawn,
 * a highlighter stroke).
 *
 * The inline head script only adds `html.fx` when motion is allowed, so with
 * reduced motion or no JS everything is simply visible.
 */

type Effect = "settle" | "drop" | "pop" | "fade" | "stamp" | "tape" | "rise";

const EASE = "cubic-bezier(.2,.8,.25,1)";
const STAMP = "cubic-bezier(.3,1.5,.5,1)";

interface EffectSpec {
  /** Added on top of the element's own rotate/translate (tilts are kept). */
  motion?: Keyframe[];
  /** Replaces `scale` (no element sets its own). */
  scale?: Keyframe[];
  duration: number;
  easing?: string;
}

const EFFECTS: Record<Effect, EffectSpec> = {
  // Paper set down on the page: slides up and straightens into its tilt.
  settle: {
    motion: [
      { translate: "0 18px", rotate: "1.5deg" },
      { translate: "0 0", rotate: "0deg" },
    ],
    duration: 420,
  },
  // A label dropped from above.
  drop: {
    motion: [
      { translate: "0 -28px", rotate: "-4deg" },
      { translate: "0 0", rotate: "0deg" },
    ],
    duration: 480,
  },
  pop: { scale: [{ scale: "0.85" }, { scale: "1" }], duration: 300 },
  fade: { duration: 400 },
  // A rubber stamp: comes down big and lands with a thump.
  stamp: {
    scale: [{ scale: "1.8" }, { scale: "1" }],
    motion: [{ rotate: "8deg" }, { rotate: "0deg" }],
    duration: 380,
    easing: STAMP,
  },
  // A tape strip pulled across and pressed down.
  tape: {
    scale: [{ scale: "0.3 1.1" }, { scale: "1 1" }],
    duration: 340,
  },
  // A divider tab poking up out of the perforation.
  rise: {
    motion: [{ translate: "0 22px" }, { translate: "0 0" }],
    duration: 460,
  },
};

function isEffect(value: string | undefined): value is Effect {
  return value !== undefined && value in EFFECTS;
}

/** Resolve the effect and delay for the current viewport. */
function resolve(el: HTMLElement | SVGElement): {
  fx: string | undefined;
  delay: number;
} {
  const { narrow, fx, fxNarrow, delay, delayNarrow } = el.dataset;
  const useNarrow = narrow !== undefined && window.matchMedia(narrow).matches;
  return {
    fx: useNarrow && fxNarrow !== undefined ? fxNarrow : fx,
    delay: Number(
      (useNarrow && delayNarrow !== undefined ? delayNarrow : delay) ?? 0,
    ),
  };
}

function play(el: HTMLElement | SVGElement): void {
  const { fx, delay } = resolve(el);
  el.dataset["fxDone"] = "";

  if (el.hasAttribute("data-draw")) {
    el.animate([{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], {
      duration: Number(el.dataset["duration"] ?? 520),
      delay,
      easing: EASE,
      fill: "backwards",
    });
    return;
  }

  if (!isEffect(fx)) return;
  const effect = EFFECTS[fx];
  const timing: KeyframeAnimationOptions = {
    duration: effect.duration,
    delay,
    easing: effect.easing ?? EASE,
    fill: "backwards",
  };
  // Only a start frame: it fades up to the element's own opacity (stamps
  // and faded ink sit below 1).
  el.animate([{ opacity: 0, offset: 0 }], {
    ...timing,
    easing: EASE,
    duration: Math.min(effect.duration, 260),
  });
  if (effect.scale) el.animate(effect.scale, timing);
  if (effect.motion) el.animate(effect.motion, { ...timing, composite: "add" });
}

export function initReveal(): void {
  const root = document.documentElement;
  if (!root.classList.contains("fx")) return;

  const targets = document.querySelectorAll<HTMLElement | SVGElement>(
    "[data-fx], [data-draw]",
  );
  if (
    !("IntersectionObserver" in window) ||
    typeof Element.prototype.animate !== "function"
  ) {
    root.classList.remove("fx");
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        observer.unobserve(entry.target);
        play(entry.target as HTMLElement | SVGElement);
      }
    },
    { threshold: 0.12 },
  );

  targets.forEach((el) => {
    // No effect at this width (often because the element is hidden here, so
    // it would never intersect): mark it done now so it is visible if the
    // viewport later grows.
    if (resolve(el).fx === "none") {
      el.dataset["fxDone"] = "";
      return;
    }
    observer.observe(el);
  });
}
