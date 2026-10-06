/**
 * One-shot reveal animations (settle, drop, pop, fade, draw) driven by
 * IntersectionObserver + Web Animations. Nothing loops.
 *
 * Elements opt in with `data-fx` (and optional `data-delay`). An element can
 * switch effect/delay below a breakpoint with `data-narrow` (a media query),
 * `data-fx-narrow` and `data-delay-narrow`. Arrows opt in with `data-draw`.
 *
 * The inline head script only adds `html.fx` when motion is allowed, so with
 * reduced motion or no JS everything is simply visible.
 */

type Effect = "settle" | "drop" | "pop" | "fade";

const EASE = "cubic-bezier(.2,.8,.25,1)";

const EFFECTS: Record<Effect, { motion: Keyframe[] | null; duration: number }> =
  {
    settle: {
      motion: [
        { translate: "0 18px", rotate: "1.5deg" },
        { translate: "0 0", rotate: "0deg" },
      ],
      duration: 420,
    },
    drop: {
      motion: [
        { translate: "0 -28px", rotate: "-3deg" },
        { translate: "0 0", rotate: "0deg" },
      ],
      duration: 460,
    },
    pop: { motion: [{ scale: "0.85" }, { scale: "1" }], duration: 300 },
    fade: { motion: null, duration: 400 },
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
      duration: 380,
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
    easing: EASE,
    fill: "backwards",
  };
  el.animate([{ opacity: 0 }, { opacity: 1 }], timing);
  // Added on top of the element's own rotate/translate, so tilts are kept.
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

  targets.forEach((el) => observer.observe(el));
}
