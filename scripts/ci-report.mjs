/**
 * Turns Playwright's JSON report into a small public summary,
 * `dist/ci-report.json`, deployed with the site so the page can show the
 * pipeline run that shipped it.
 *
 * Usage (after `playwright test`): node scripts/ci-report.mjs
 */
import { readFile, writeFile } from "node:fs/promises";

const REPORT = "reports/results.json";
const OUT = "dist/ci-report.json";

const STATUS = {
  expected: "passed",
  unexpected: "failed",
  flaky: "flaky",
  skipped: "skipped",
};

/** Depth-first walk over Playwright's nested suites. */
function* walk(suite, path = []) {
  const here =
    suite.title && !suite.file?.endsWith(suite.title)
      ? [...path, suite.title]
      : path;
  for (const spec of suite.specs ?? []) {
    for (const test of spec.tests) {
      const last = test.results.at(-1);
      yield {
        file: spec.file,
        title: [...here, spec.title].join(" › "),
        project: test.projectName,
        status: STATUS[test.status] ?? test.status,
        duration: last?.duration ?? 0,
      };
    }
  }
  for (const child of suite.suites ?? []) yield* walk(child, here);
}

const report = JSON.parse(await readFile(REPORT, "utf8"));
const tests = report.suites.flatMap((suite) => [...walk(suite)]);
const count = (status) => tests.filter((t) => t.status === status).length;

const env = process.env;
const summary = {
  run: {
    number: Number(env.GITHUB_RUN_NUMBER ?? 0),
    url: env.GITHUB_RUN_ID
      ? `${env.GITHUB_SERVER_URL}/${env.GITHUB_REPOSITORY}/actions/runs/${env.GITHUB_RUN_ID}`
      : null,
    sha: env.GITHUB_SHA ?? null,
    branch: env.GITHUB_REF_NAME ?? null,
    startedAt: report.stats.startTime,
    duration: Math.round(report.stats.duration),
  },
  totals: {
    passed: count("passed"),
    failed: count("failed"),
    flaky: count("flaky"),
    skipped: count("skipped"),
  },
  tests,
};

await writeFile(OUT, `${JSON.stringify(summary, null, 2)}\n`);
console.log(
  `ci-report: ${summary.totals.passed} passed, ${summary.totals.failed} failed → ${OUT}`,
);
