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

## Content

All copy comes from `src/data/content.json`, loaded and validated by `src/data/content.ts`.
Replace the `[PLACEHOLDER]` values there (links, dates, project details); hrefs use the same fields.
Interface labels from the approved design (nav, notes, button text) live in `ui` in `src/data/content.ts`.
