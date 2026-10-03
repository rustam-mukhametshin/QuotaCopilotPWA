# Copilot Instructions for QuotaCopilotPWA

## Project state
This is an Angular v22 application scaffolded via `ng new` (standalone components, no NgModules).
The app features a month-calendar interface with AI credit budgeting, persistent state via Dexie
IndexedDB, and a responsive PWA architecture.

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

## Versioning
- **Conventional Commits:** all commits must follow the format: `type(scope): message`, where type is
  one of: `feat`, `fix`, `refactor`, `docs`, `chore`, `test`, `perf`, etc.
  - `feat:` increments minor version (0.1.0 → 0.2.0)
  - `fix:` increments patch version (0.1.0 → 0.1.1)
  - `feat!:` or commit body containing `BREAKING CHANGE:` increments major version, but since the
    project is pre-1.0.0, breaking changes increment minor instead
- **Release workflow:** GitHub Actions runs `googleapis/release-please-action` on every push to
  `main`. Release-please automatically creates a Release PR when commits match Conventional Commits
  patterns. Review and merge the Release PR to trigger the release (tags, CHANGELOG, version bumps).
- **Version in code:** the current version is defined in `src/app/version.ts` as `APP_VERSION` with
  a marker comment `// x-release-please-version` on the same line — release-please updates this
  automatically during release. Do not edit version manually.
- **Version in UI:** the footer displays the app version via `APP_VERSION` imported in
  `src/app/app.ts`.


