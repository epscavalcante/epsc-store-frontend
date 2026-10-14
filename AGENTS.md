# Repository Guidelines

## Project Structure & Module Organization

Application code lives in `src/`. Vue pages are in `src/views/`, reusable UI in
`src/components/`, Pinia state in `src/stores/`, and routing in `src/router/`. Keep API transport
in `src/api/`, endpoint adapters in `src/gateways/`, checkout domain logic and Zod schemas in
`src/checkout/`, and reusable Vue behavior in `src/composables/`. Static assets belong in
`public/`. Tests are TypeScript files under `tests/`; generated output in `dist/` must not be
edited directly.

## Build, Test, and Development Commands

- `npm install`: install the locked dependency set.
- `npm run dev`: start Vite locally; `/api` is proxied to the configured backend.
- `npm run build`: run Vue/TypeScript checks and create the production bundle.
- `npm test`: execute `tests/*.test.ts` with Node's built-in test runner.
- `npm run lint`: run Oxlint and ESLint, applying safe automatic fixes.
- `npm run lint-check`: check Oxlint and ESLint rules without modifying files.
- `npm run format`: format files under `src/` with Oxfmt.
- `npm run preview`: serve the completed production build locally.

Use a Node version allowed by `package.json` (currently Node 22.18+ or 24.12+).

## Coding Style & Naming Conventions

Use TypeScript and Vue Single-File Components. Follow `.editorconfig`: UTF-8, LF endings,
two-space indentation, final newlines, and a 100-character line target. Oxfmt enforces single
quotes and no semicolons. Name Vue components and views in PascalCase (`OrderSummary.vue`),
composables with a `use` prefix (`useCheckout.ts`), and stores and utilities with descriptive
lowercase names. Keep gateway contracts typed and validate external/form data with Zod.

## Testing Guidelines

Add focused `*.test.ts` files in `tests/`, using `node:test` and `node:assert/strict`. Cover both
valid inputs and failure boundaries, especially payment normalization, API payloads, expiration,
and sensitive-data cleanup. There is no numeric coverage gate; every behavior change should have
a regression test. Run `npm test` and `npm run build` before opening a pull request.

## Commit & Pull Request Guidelines

History generally uses short, imperative Conventional Commit subjects such as `feat:`, `fix:`,
`refactor:`, and `ci:`. Keep each commit scoped to one concern. Pull requests should explain the
user-visible change, link the issue, list verification performed, and include screenshots for UI
changes. Call out API contract or environment-variable changes explicitly.

## Security & Configuration

Copy settings from `.env.example`; never commit credentials or production secrets. Do not persist
customer or card data in browser storage. Treat checkout retries carefully: POST requests are not
automatically idempotent, and uncertain network failures can otherwise create duplicate charges.
