/**
 * Stand-ins for the two network sources of the footer pill: the deployed
 * `/ci-report.json` and GitHub's workflow-runs API. Every test gets them
 * (see fixtures.ts), so no test ever calls the real API or depends on a
 * report existing in `dist/`.
 */

export const RUN_URL =
  "https://github.com/tutaabsoluta/tutaabsoluta.github.io/actions/runs/1";

/** Shape of scripts/ci-report.mjs output. One title runs in both projects. */
export const sampleReport = {
  run: {
    number: 7,
    url: RUN_URL,
    sha: "ddb9b10c0ffee",
    branch: "main",
    startedAt: "2026-10-06T22:45:00.000Z",
    duration: 46_000,
  },
  totals: { passed: 4, failed: 0, flaky: 0, skipped: 1 },
  tests: [
    {
      file: "smoke.spec.ts",
      title: "the page loads without errors and says who it is",
      project: "desktop",
      status: "passed",
      duration: 1200,
    },
    {
      file: "smoke.spec.ts",
      title: "the page loads without errors and says who it is",
      project: "mobile",
      status: "passed",
      duration: 1400,
    },
    {
      file: "navigation.spec.ts",
      title: "Mobile menu › opens and closes from the Menu button",
      project: "mobile",
      status: "passed",
      duration: 900,
    },
    {
      file: "navigation.spec.ts",
      title: "Mobile menu › opens and closes from the Menu button",
      project: "desktop",
      status: "skipped",
      duration: 0,
    },
    {
      file: "toggles.spec.ts",
      title: 'Project cards › every "How it works" panel opens and closes',
      project: "desktop",
      status: "passed",
      duration: 3100,
    },
  ],
};

/** Unique test titles in sampleReport that actually ran. */
export const SAMPLE_LINES = 3;

/** `number` defaults to the report's run (the deployed one). */
export type RunMock =
  | {
      status: "completed";
      conclusion: "success" | "failure";
      hoursAgo: number;
      number?: number;
    }
  | {
      status: "in_progress";
      conclusion: null;
      hoursAgo: number;
      number?: number;
    }
  | "offline";

export const passingRun: RunMock = {
  status: "completed",
  conclusion: "success",
  hoursAgo: 2,
};

/** GitHub's `GET …/actions/workflows/{file}/runs` response, trimmed. */
export function runsResponse(run: Exclude<RunMock, "offline">): object {
  return {
    total_count: 1,
    workflow_runs: [
      {
        run_number: run.number ?? sampleReport.run.number,
        status: run.status,
        conclusion: run.conclusion,
        updated_at: new Date(
          Date.now() - run.hoursAgo * 3_600_000,
        ).toISOString(),
        html_url: RUN_URL,
      },
    ],
  };
}
