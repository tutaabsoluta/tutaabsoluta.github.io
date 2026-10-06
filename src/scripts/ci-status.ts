/**
 * The footer test-status pill and its receipt (see CiStatus.astro).
 *
 * Two sources:
 * - `/ci-report.json`: written by the pipeline and deployed with the site,
 *   so it describes the exact run that shipped this page. The receipt
 *   replays it. In `npm run dev` there is no local file, so it falls back to
 *   the deployed report. A production build without one keeps the egg hidden.
 * - GitHub's public API: the latest run of the pipeline, for the live
 *   status on the pill. Cached for 10 minutes (the unauthenticated limit is
 *   60 requests per hour per visitor); the report is the fallback.
 */
import { ui } from "../data/content";

const REPO = "tutaabsoluta/tutaabsoluta.github.io";
const WORKFLOW = "pipeline.yml";
const CACHE_KEY = "ci-latest-run";
const CACHE_MS = 10 * 60 * 1000;
/** `npm run dev` has no local report, so it shows the deployed one. */
const LIVE_REPORT = "https://tutaabsoluta.github.io/ci-report.json";

interface ReportTest {
  file: string;
  title: string;
  project: string;
  status: "passed" | "failed" | "flaky" | "skipped";
  duration: number;
}

interface Report {
  run: {
    number: number;
    url: string | null;
    sha: string | null;
    branch: string | null;
    startedAt: string;
    duration: number;
  };
  totals: { passed: number; failed: number; flaky: number; skipped: number };
  tests: ReportTest[];
}

interface LatestRun {
  number: number;
  status: string;
  conclusion: string | null;
  updatedAt: string;
  url: string;
}

type State = "passed" | "running" | "failed";

async function getJson(url: string): Promise<unknown> {
  try {
    const response = await fetch(url);
    return response.ok ? await response.json() : null;
  } catch {
    return null;
  }
}

function isReport(value: unknown): value is Report {
  const r = value as Partial<Report> | null;
  return Boolean(r?.run && r.totals && Array.isArray(r.tests));
}

async function loadLatestRun(): Promise<LatestRun | null> {
  try {
    const cached = sessionStorage.getItem(CACHE_KEY);
    if (cached) {
      const { at, run } = JSON.parse(cached) as { at: number; run: LatestRun };
      if (Date.now() - at < CACHE_MS) return run;
    }
  } catch {
    // Storage blocked: just ask the API.
  }

  const data = (await getJson(
    `https://api.github.com/repos/${REPO}/actions/workflows/${WORKFLOW}/runs?branch=main&per_page=1`,
  )) as { workflow_runs?: Record<string, unknown>[] } | null;
  const raw = data?.workflow_runs?.[0];
  if (!raw) return null;

  const run: LatestRun = {
    number: Number(raw["run_number"]),
    status: String(raw["status"]),
    conclusion: raw["conclusion"] == null ? null : String(raw["conclusion"]),
    updatedAt: String(raw["updated_at"]),
    url: String(raw["html_url"]),
  };
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), run }));
  } catch {
    // Not cached; fine.
  }
  return run;
}

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 31_536_000],
  ["month", 2_592_000],
  ["week", 604_800],
  ["day", 86_400],
  ["hour", 3_600],
  ["minute", 60],
];

function ago(iso: string): string {
  const seconds = (Date.parse(iso) - Date.now()) / 1000;
  const format = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  for (const [unit, size] of UNITS) {
    if (Math.abs(seconds) >= size) {
      return format.format(Math.round(seconds / size), unit);
    }
  }
  return "just now";
}

/** One line per test title: the same test runs at desktop and phone size. */
function receiptLines(
  tests: ReportTest[],
): { group: string; title: string; ok: boolean; seconds: number }[] {
  const byTitle = new Map<
    string,
    { group: string; title: string; ok: boolean; ran: boolean; ms: number }
  >();
  for (const t of tests) {
    const title = t.title.split(" › ").at(-1) ?? t.title;
    const key = `${t.file}::${title}`;
    const line = byTitle.get(key) ?? {
      group: ui.ci.groups[t.file] ?? t.file,
      title,
      ok: true,
      ran: false,
      ms: 0,
    };
    if (t.status !== "skipped") line.ran = true;
    if (t.status === "failed") line.ok = false;
    line.ms = Math.max(line.ms, t.duration);
    byTitle.set(key, line);
  }
  // Sections print in the order of ui.ci.groups; unknown files go last.
  const order = Object.values(ui.ci.groups);
  const rank = (group: string): number => {
    const i = order.indexOf(group);
    return i === -1 ? order.length : i;
  };
  return [...byTitle.values()]
    .filter((line) => line.ran)
    .sort((a, b) => rank(a.group) - rank(b.group))
    .map(({ group, title, ok, ms }) => ({
      group,
      title,
      ok,
      seconds: ms / 1000,
    }));
}

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className: string,
  text = "",
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  node.className = className;
  node.textContent = text;
  return node;
}

function line(mark: string, name: string, time: string): HTMLLIElement {
  const li = el("li", "receipt__line");
  li.append(
    el("span", "receipt__mark", mark),
    el("span", "receipt__name", name),
    el("span", "receipt__time", time),
  );
  return li;
}

function renderReceipt(
  dialog: HTMLDialogElement,
  report: Report,
  live: LatestRun | null,
): void {
  const q = <T extends Element>(selector: string): T | null =>
    dialog.querySelector<T>(selector);
  const { run, totals } = report;
  const failed = totals.failed > 0;

  const title = q("[data-ci-title]");
  const meta = q("[data-ci-meta]");
  const list = q("[data-ci-lines]");
  if (!title || !meta || !list) return;

  title.textContent = ui.ci.run(run.number);
  const date = new Date(run.startedAt).toLocaleDateString("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  meta.textContent = [
    run.branch,
    run.sha?.slice(0, 7),
    date,
    `${Math.round(run.duration / 1000)}s`,
  ]
    .filter(Boolean)
    .join(" · ");

  // Rebuilt on every open so the printing replays.
  list.replaceChildren();
  const items: HTMLLIElement[] = [el("li", "receipt__group", ui.ci.pipeline)];
  for (const step of ui.ci.steps) items.push(line("✓", step, ""));
  let group = "";
  for (const l of receiptLines(report.tests)) {
    if (l.group !== group) {
      group = l.group;
      items.push(el("li", "receipt__group", group));
    }
    items.push(line(l.ok ? "✓" : "✗", l.title, `${l.seconds.toFixed(1)}s`));
  }
  items.forEach((item, i) => item.style.setProperty("--i", String(i)));
  list.append(...items);

  // Totals, note and stamp print after the last line.
  const after = [
    "[data-ci-totals]",
    "[data-ci-across]",
    "[data-ci-oops]",
    "[data-ci-end]",
  ];
  after.forEach((selector, i) =>
    q<HTMLElement>(selector)?.style.setProperty(
      "--i",
      String(items.length + i),
    ),
  );
  const totalsEl = q("[data-ci-totals]");
  if (totalsEl) {
    totalsEl.textContent = ui.ci.totals(totals.passed, totals.failed);
  }
  // A newer run failed: own up to it (the replayed run is the last good one).
  const oops = q<HTMLElement>("[data-ci-oops]");
  const oopsed =
    live?.status === "completed" &&
    live.conclusion !== "success" &&
    live.number > run.number;
  if (oops) {
    oops.hidden = !oopsed;
    const text = q("[data-ci-oops-text]");
    const link = q<HTMLAnchorElement>("[data-ci-oops-link]");
    if (oopsed && live && text && link) {
      text.textContent = ui.ci.oops(live.number, run.number);
      link.href = live.url;
    }
  }

  const stamp = q<HTMLElement>("[data-ci-stamp]");
  if (stamp) {
    stamp.textContent = failed ? ui.ci.stampFailed : ui.ci.stampPassed;
    stamp.dataset["state"] = failed ? "failed" : "passed";
  }
  const link = q<HTMLAnchorElement>("[data-ci-link]");
  if (link) {
    link.hidden = !run.url;
    if (run.url) link.href = run.url;
  }
}

function pillText(
  report: Report,
  live: LatestRun | null,
): { state: State; text: string } {
  if (live && live.status !== "completed") {
    return { state: "running", text: ui.ci.running };
  }
  if (live && live.conclusion !== "success") {
    return {
      state: "failed",
      text: `${ui.ci.failed} · ${ago(live.updatedAt)}`,
    };
  }
  const state: State = report.totals.failed > 0 ? "failed" : "passed";
  const when = ago(live?.updatedAt ?? report.run.startedAt);
  return { state, text: `${ui.ci.passed(report.totals.passed)} · ${when}` };
}

export async function initCiStatus(): Promise<void> {
  const root = document.querySelector<HTMLElement>("[data-ci]");
  const pill = root?.querySelector<HTMLButtonElement>("[data-ci-pill]");
  const label = root?.querySelector("[data-ci-label]");
  const dialog = document.querySelector<HTMLDialogElement>("[data-ci-receipt]");
  if (!root || !pill || !label || !dialog) return;

  let report = await getJson("/ci-report.json");
  if (!isReport(report) && import.meta.env.DEV) {
    report = await getJson(LIVE_REPORT);
  }
  if (!isReport(report)) return;
  const live = await loadLatestRun();

  const { state, text } = pillText(report, live);
  pill.dataset["state"] = state;
  label.textContent = text;
  pill.setAttribute(
    "aria-label",
    `${ui.ci.statusPrefix} ${text}. ${ui.ci.open}`,
  );
  root.hidden = false;

  pill.addEventListener("click", () => {
    delete dialog.dataset["skipped"];
    renderReceipt(dialog, report, live);
    dialog.showModal();
  });

  dialog.addEventListener("click", (event) => {
    const target = event.target as Element;
    // The backdrop is the dialog itself; the paper fills the rest.
    if (target === dialog || target.closest("[data-ci-close]")) {
      dialog.close();
    } else if (!target.closest("a")) {
      dialog.dataset["skipped"] = "";
    }
  });

  dialog.addEventListener("close", () => pill.focus());
}
