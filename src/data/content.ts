/**
 * Typed access to the site copy. `./content.json` is the single source of
 * truth; this module adds types, validates links and cross-references at
 * build time, and holds the interface labels (`ui`).
 */
import raw from "./content.json" with { type: "json" };

export type LinkKind = "GitHub" | "LinkedIn" | "Email";

export interface Person {
  name: string;
  role: string;
  company: string;
  location: string;
  summary: string;
  /** The two lines on the taped label in the intro. */
  label: string[];
  tenure: string;
  /** The phrase of the summary that gets the highlighter. */
  highlight: string;
}

export interface Link {
  kind: LinkKind;
  label: string;
  href: string;
}

export interface DetailRow {
  k: string;
  v: string;
}

export interface Project {
  n: string;
  title: string;
  status: string;
  description: string;
  stack: string[];
  repository: string;
  details: DetailRow[];
}

export interface WorkTile {
  id: string;
  title: string;
  detail: string;
  original: string;
  /** A word struck through in pen before the title (a visible correction). */
  correction?: string;
}

export interface Experience {
  company: string;
  role: string;
  dates: string;
  duration: string;
  tiles: WorkTile[];
  toolsIndex: string[];
}

export interface SeenIn {
  tile: string;
  label: string;
}

export interface Stage {
  n: string;
  name: string;
  what: string;
  seen: SeenIn[];
}

/** A tear-off tab in Contact: opens an email draft for one reason to write. */
export interface ContactTab {
  /** Printed on the tab. */
  tab: string;
  /** The email subject (also the tab's accessible name). */
  subject: string;
  /** Blank lines to fill in, written into the draft. */
  prompts: string[];
}

export interface Volunteer {
  kicker: string;
  title: string;
  body: string;
  who: string[];
  helpLabel: string;
  help: string[];
}

export interface Content {
  person: Person;
  links: Link[];
  projects: Project[];
  experience: Experience;
  howIWork: { intro: string; stages: Stage[] };
  volunteer: Volunteer;
  contact: {
    title: string;
    line: string;
    note: string;
    order: LinkKind[];
    tabs: ContactTab[];
  };
}

const linkKinds: readonly LinkKind[] = ["GitHub", "LinkedIn", "Email"];

function oneOf<T extends string>(
  allowed: readonly T[],
  value: string,
  where: string,
): T {
  if ((allowed as readonly string[]).includes(value)) return value as T;
  throw new Error(`content.json: unexpected value "${value}" at ${where}`);
}

const tileIds = new Set(raw.experience.tiles.map((t) => t.id));

if (!raw.person.summary.includes(raw.person.highlight)) {
  throw new Error("content.json: person.highlight must be part of the summary");
}

export const content: Content = {
  person: raw.person,
  links: raw.links.map((l, i) => ({
    ...l,
    kind: oneOf(linkKinds, l.kind, `links[${i}].kind`),
  })),
  projects: raw.projects,
  experience: raw.experience,
  howIWork: {
    intro: raw.howIWork.intro,
    stages: raw.howIWork.stages.map((s, i) => ({
      ...s,
      seen: s.seen.map((x, j) => {
        if (!tileIds.has(x.tile)) {
          throw new Error(
            `content.json: unknown tile "${x.tile}" at howIWork.stages[${i}].seen[${j}]`,
          );
        }
        return x;
      }),
    })),
  },
  volunteer: raw.volunteer,
  contact: {
    ...raw.contact,
    order: raw.contact.order.map((k, i) =>
      oneOf(linkKinds, k, `contact.order[${i}]`),
    ),
  },
};

export function linkByKind(kind: LinkKind): Link {
  const link = content.links.find((l) => l.kind === kind);
  if (!link) throw new Error(`content.json: missing link "${kind}"`);
  return link;
}

/** True for a real address (not a "[PLACEHOLDER]"). */
export function isUrl(href: string): boolean {
  return /^(https?:\/\/|mailto:)/.test(href);
}

/** Email address without the `mailto:`. */
export function emailAddress(): string {
  return linkByKind("Email").href.replace(/^mailto:/, "");
}

/**
 * Interface copy: navigation labels, hand-written notes and button text.
 * Section names are written once here and lowercased by CSS, so the nav,
 * the page-break tab and the heading always match.
 */
export const ui = {
  skipLink: "Skip to content",
  brand: "sergio_duran/portfolio",
  nav: [
    { href: "#build", label: "What I build" },
    { href: "#experience", label: "What I've worked on" },
    { href: "#how", label: "How I work" },
    { href: "#volunteer", label: "Volunteer" },
  ],
  navContact: { href: "#contact", label: "Contact" },
  menuOpen: "Menu",
  menuClose: "Close",
  /** Page-break tabs (decorative) and the mono kickers next to headings. */
  tabs: {
    build: "02 · What I build",
    experience: "03 · What I've worked on",
    how: "04 · How I work",
    volunteer: "+ · Volunteer",
    contact: "05 · Contact",
  },
  intro: {
    kicker: "01 — intro",
    note: ["no photo.", "the work is below ↓"],
  },
  build: {
    kicker: "02 —",
    title: "What I build",
    note: "(both still unfinished)",
    stamp: "Work in progress",
    project: (n: string) => `project ${n} / test automation`,
    started: "started",
    finished: "finished",
    notYet: "— not yet",
    howItWorks: "how it works",
    repo: "repo:",
  },
  experience: {
    kicker: "03 —",
    title: "What I've worked on",
    card: (n: number, total: number) =>
      `card ${String(n).padStart(2, "0")} / ${String(total).padStart(2, "0")}`,
    full: "the full version",
    fold: "fold it back",
    showFull: "Show full description:",
    hideFull: "Hide full description:",
    toolsUsed: "tools used:",
    backToHow: "back to how i work",
  },
  how: { kicker: "04 —", title: "How I work", stage: "Stage" },
  volunteer: {
    cta: "tell me about your project — take a tab ↓",
  },
  contact: {
    kicker: "05 — contact",
    takeTab: "or take a tab",
    takeTabHint: "each one opens an email, half written",
    tabsLabel: "Tear-off tabs: each opens an email draft",
    tabAria: (subject: string) => `Email draft: ${subject}`,
    body: (subject: string, prompts: readonly string[]) =>
      [
        "Hi Sergio,",
        "",
        `I took a tab from your portfolio: ${subject.toLowerCase()}.`,
        "",
        ...prompts,
        ...(prompts.length ? [""] : []),
        "Thanks!",
      ].join("\n"),
    taken: "tab's yours. your email app should open with a draft.",
    noApp: "nothing opened? the address is right above ↑",
  },
  footer: {
    madeBy: (name: string, location: string) =>
      `made by hand · ${name} · ${location}`,
    backToTop: "back to top ↑",
  },
  /** The 404 page: a receipt for the one test that failed. */
  notFound: {
    title: "Page not found · Sergio Duran",
    description: "This address doesn't exist on Sergio Duran's portfolio.",
    kicker: "sergio_duran/portfolio · test receipt",
    heading: "404",
    replaying: "a test just failed. live. in front of you.",
    group: "This visit",
    siteUp: "site is up",
    lastRun: (n: number, passed: number) =>
      `run #${n}: ${passed} tests passed (so it's not us)`,
    searched: "looked under the footer",
    asked: "asked the GitHub API",
    pageExists: (path: string) => `page exists: ${path}`,
    error: "Error: expect(page).toExist()",
    expected: (path: string) => `Expected: ${path}`,
    received: "Received: this receipt",
    note: "100% reproducible. Filed under: probably a typo.",
    stamp: "Failed",
    home: "← back to the notebook",
  },
  /** The share-preview card (/og, screenshotted by scripts/og-image.mjs). */
  og: {
    alt: (name: string) =>
      `${name}'s portfolio: test automation, built to be checked.`,
    tag: "sergio_duran/portfolio",
    tested: (n: number) => `${n} tests pass on every deploy`,
    at: (company: string) => `@ ${company}`,
  },
  /** The footer test-status pill and its receipt (the easter egg). */
  ci: {
    note: "psst… this site tests itself",
    passed: (n: number) => `${n} tests passed`,
    running: "tests running right now",
    failed: "latest run failed",
    statusPrefix: "Test status:",
    open: "Open the test receipt.",
    kicker: "sergio_duran/portfolio · test receipt",
    run: (n: number) => `Run #${n}`,
    replaying: "replaying the run that shipped this page",
    pipeline: "Pipeline",
    steps: ["type check", "lint", "build"],
    /** Receipt sections, in print order. */
    groups: {
      "smoke.spec.ts": "Smoke",
      "cross-links.spec.ts": "How I work → index card",
      "toggles.spec.ts": "Toggles",
      "tear-tabs.spec.ts": "Tear-off tabs",
      "navigation.spec.ts": "Navigation",
      "motion.spec.ts": "Motion",
      "visual.spec.ts": "Looks",
      "accessibility.spec.ts": "Accessibility",
      "not-found.spec.ts": "Lost pages",
      "easter-egg.spec.ts": "This receipt",
    } as Record<string, string>,
    totals: (passed: number, failed: number) =>
      `${passed} passed · ${failed} failed`,
    across: "every check runs at desktop and phone size",
    stampPassed: "Passed",
    stampFailed: "Failed",
    /** Shown on the receipt when the latest run failed (it never deploys). */
    oops: (failed: number, shipped: number) =>
      `well… run #${failed} didn't go so well. Don't worry, the tests caught it before you could: you're looking at run #${shipped}, the last one that passed.`,
    oopsLink: "see the damage →",
    viewRun: "see it on GitHub →",
    close: "Close receipt",
  },
} as const;

/**
 * Attributes for a link: external http(s) links open in a new tab without
 * exposing this page (noopener) or the referrer (noreferrer). mailto: and
 * in-page links are left alone.
 */
export function linkAttrs(href: string): {
  target?: "_blank";
  rel?: "noopener noreferrer";
} {
  return /^https?:\/\//.test(href)
    ? { target: "_blank", rel: "noopener noreferrer" }
    : {};
}
