# Copilot Instructions for QuotaCopilotPWA

## Project state
This is an Angular v22 application scaffolded via `ng new` (standalone components, no NgModules).
It is currently a minimal skeleton (single `App` root component, empty routes) — most application
architecture has not been built yet. Despite the "PWA" name, no service worker / `@angular/pwa`
setup exists yet.

## Commands
- `npm start` / `ng serve` — dev server at `http://localhost:4200/`
- `npm run build` / `ng build` — production build to `dist/`
- `npm run watch` / `ng build --watch --configuration development` — incremental dev build
- `npm test` / `ng test` — runs unit tests via **Vitest** (through `@angular/build:unit-test`,
  not the legacy Karma runner)
  - Run a single test file: `ng test -- src/app/app.spec.ts` (Vitest CLI args pass through after `--`)
  - Filter by test name: `ng test -- -t "should render title"`
- No lint script is configured in `package.json`; don't invent one.
- Prettier is configured (`.prettierrc`: 100 char width, single quotes, Angular parser for
  `*.html`), but no `format`/`lint` npm script wraps it — invoke `npx prettier --write <files>`
  directly when formatting.

## Conventions
- Components are standalone (`imports: [...]` on `@Component`, no `NgModule`).
- Files follow Angular CLI naming: component class files have no `.component.ts` suffix
  (e.g. `app.ts`, `app.html`, `app.css`, `app.spec.ts` for the root `App` component) — this
  project uses the newer Angular CLI file-naming schematic, not the older `*.component.ts` style.
- Use `signal()` for component state (see `App.title` in `src/app/app.ts`) rather than plain
  class fields, consistent with modern Angular reactivity primitives.
- Routes live in `src/app/app.routes.ts` and are wired into `provideRouter(routes)` in
  `src/app/app.config.ts`.
- 2-space indentation, single quotes in TS, per `.editorconfig`/`.prettierrc`.
