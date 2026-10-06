/**
 * Typed access to the site copy. `./content.json` is the
 * single source of truth; this module only adds types and validates the
 * enumerated fields (tones, shapes, link kinds) at build time.
 */
import raw from "./content.json";

export type LinkKind = "GitHub" | "LinkedIn" | "Email";
export type Tone = "lavender" | "blue" | "green" | "peach" | "beige";
export type TintTone = "greenTint" | "peachTint" | "blueTint" | "lavenderTint";
export type Shape = "rounded" | "circle" | "square" | "leaf";

export interface Person {
  name: string;
  role: string;
  company: string;
  location: string;
  summary: string;
}

export interface Link {
  kind: LinkKind;
  label: string;
  href: string;
}

export interface HeroCard {
  n: string;
  title: string;
  fact: string;
  href: string;
  tone: Tone;
  sticker?: string;
}

export interface DetailRow {
  k: string;
  v: string;
}

export interface Project {
  n: string;
  title: string;
  status: string;
  tone: Tone;
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
  tone: TintTone;
  glyph: string;
  shape: Shape;
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
  glyph: string;
  tone: Tone;
  shape: Shape;
}

export interface Content {
  person: Person;
  links: Link[];
  heroCards: HeroCard[];
  projects: Project[];
  experience: Experience;
  howIWork: { intro: string; stages: Stage[] };
  contact: { title: string; line: string; note: string; order: LinkKind[] };
}

const tones: readonly Tone[] = ["lavender", "blue", "green", "peach", "beige"];
const tintTones: readonly TintTone[] = [
  "greenTint",
  "peachTint",
  "blueTint",
  "lavenderTint",
];
const shapes: readonly Shape[] = ["rounded", "circle", "square", "leaf"];
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

export const content: Content = {
  person: raw.person,
  links: raw.links.map((l, i) => ({
    ...l,
    kind: oneOf(linkKinds, l.kind, `links[${i}].kind`),
  })),
  heroCards: raw.heroCards.map((c, i) => ({
    ...c,
    tone: oneOf(tones, c.tone, `heroCards[${i}].tone`),
  })),
  projects: raw.projects.map((p, i) => ({
    ...p,
    tone: oneOf(tones, p.tone, `projects[${i}].tone`),
  })),
  experience: {
    ...raw.experience,
    tiles: raw.experience.tiles.map((t, i) => ({
      ...t,
      tone: oneOf(tintTones, t.tone, `experience.tiles[${i}].tone`),
      shape: oneOf(shapes, t.shape, `experience.tiles[${i}].shape`),
    })),
  },
  howIWork: {
    intro: raw.howIWork.intro,
    stages: raw.howIWork.stages.map((s, i) => ({
      ...s,
      tone: oneOf(tones, s.tone, `howIWork.stages[${i}].tone`),
      shape: oneOf(shapes, s.shape, `howIWork.stages[${i}].shape`),
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
  contact: {
    ...raw.contact,
    order: raw.contact.order.map((k, i) =>
      oneOf(linkKinds, k, `contact.order[${i}]`),
    ),
  },
};

/** Pastel surface colour for each tone, as a CSS custom property reference. */
export const toneVar: Record<Tone, string> = {
  lavender: "var(--lavender)",
  blue: "var(--muted-blue)",
  green: "var(--dusty-green)",
  peach: "var(--soft-peach)",
  beige: "var(--warm-beige)",
};

export const tintVar: Record<TintTone, string> = {
  greenTint: "var(--block-sage)",
  peachTint: "var(--block-peach)",
  blueTint: "var(--tint-blue)",
  lavenderTint: "var(--block-lavender)",
};

/** Border radius for each "printed object" shape. */
export const shapeRadius: Record<Shape, string> = {
  rounded: "10px",
  circle: "50%",
  square: "6px",
  leaf: "10px 30px 10px 30px",
};

export function linkByKind(kind: LinkKind): Link {
  const link = content.links.find((l) => l.kind === kind);
  if (!link) throw new Error(`content.json: missing link "${kind}"`);
  return link;
}

/**
 * Interface copy that appears in the approved design (the handoff reference page)
 * but is not part of content.json: navigation labels, notes and button text.
 */
export const ui = {
  skipLink: "Skip to content",
  nav: [
    { href: "#build", label: "What I build" },
    { href: "#experience", label: "Experience" },
    { href: "#how", label: "How I work" },
  ],
  navContact: { href: "#contact", label: "Contact" },
  menuOpen: "Menu",
  menuClose: "Close",
  tags: {
    intro: "01 · Intro",
    build: "02 · What I build",
    experience: "03 · What I've worked on",
    how: "04 · How I work",
    contact: "05 · Contact",
  },
  intro: { letsTalk: ["Let's", "talk →"], note: "start anywhere" },
  build: {
    title: "What I build",
    note: "both still in the workshop",
    kicker: (n: string) => `Project ${n} · Test automation`,
    howItWorks: "How it works",
  },
  experience: {
    title: "What I've worked on",
    now: "Now",
    showFull: "Show full description:",
    hideFull: "Hide full description:",
    toolsUsed: "Tools used",
  },
  how: { title: "How I work", stage: "Stage", seenIn: "Seen in" },
  footer: { backToTop: "Back to top ↑" },
} as const;
