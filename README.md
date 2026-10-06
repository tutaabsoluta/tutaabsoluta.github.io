# portfolio-2.0

Sergio Duran's portfolio ("Working Parts"). Astro + strict TypeScript, static output, plain CSS tokens, no UI library.

## Scripts

| command           | does                                |
| ----------------- | ----------------------------------- |
| `npm run dev`     | dev server at http://localhost:4321 |
| `npm run build`   | static build to `dist/`             |
| `npm run preview` | serve the built site                |
| `npm run lint`    | ESLint (typescript-eslint + astro)  |
| `npm run check`   | `astro check` (types + diagnostics) |
| `npm run format`  | Prettier (write)                    |
| `npm test`        | build + Playwright suite            |
| `npm run test:ui` | Playwright UI mode                  |

## Tests and deploy

Playwright tests (`tests/`, page objects + fixtures) run against the built site at desktop and phone sizes: cross-links, toggles, navigation, motion, visual snapshots and axe accessibility checks.
`.github/workflows/pipeline.yml` checks, tests and builds every push; only a passing `main` is deployed to GitHub Pages, together with `ci-report.json`, a public summary of the run.
After an intended visual change, run the **Update visual baselines** workflow, then re-run **Test & deploy**.

## Content

All copy comes from `src/data/content.json`, loaded and validated by `src/data/content.ts`.
Replace the `[PLACEHOLDER]` values there (links, dates, project details); hrefs use the same fields.
Interface labels from the approved design (nav, notes, button text) live in `ui` in `src/data/content.ts`.
