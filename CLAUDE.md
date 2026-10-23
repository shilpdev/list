# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

pnpm monorepo (pnpm 11.9, Node 22) for `@shilp.dev/react-list` and `@shilp.dev/vue-list` — headless list components (fetch, paginate, search, filter, sort) where the consumer owns the UI via slot components. The two packages are parallel implementations of one API.

## Product context

From the 7Span docs (https://7span.com/open-source/vue-list/ and https://7span.com/open-source/react-list/ — these are for older versions, so props/methods may differ from the code; the purpose is the same):

- Removes boilerplate for list layouts: API integration, pagination, and state management.
- **Headless / UI-agnostic:** consumers control all markup through slots (scoped slots in Vue).
- **Centralized request handling:** API logic is configured once via a global `requestHandler` option rather than per component.
- **Reactive:** changes to props such as page, filters, or params trigger a refetch automatically.
- **State persistence:** page, items per page, and filters can be saved to localStorage or synced with an API (`stateManager` option).
- Created by 7Span (Harsh Kansagara is the primary creator).

Treat the code and the `shared/` types as the source of truth for the current API; use the docs only for intent.

## Layout

- `packages/react`, `packages/vue` — the published libraries (built with Vite lib mode, output to `dist/`).
- `shared/` — code both libraries use. `shared/types/` holds the TypeScript types (`ListProps`, `RequestHandlerResponse`, etc.) `shared/constants.ts` holds every default (`DEFAULT_PER_PAGE`, `DEFAULT_PAGE_LINKS`, ...), and `shared/utils.ts` holds the framework-agnostic logic (equality, row indexing, pagination maths, query-change detection, ...). Not a workspace package: both libraries import types from `@shared`, and logic and defaults from `@shared/utils` and `@shared/constants` (the `@shared` alias is set in each package's `vite.config.ts` and `tsconfig.json`; keep them separate so utils are not re-exported as public API); `shared/` resolves npm packages from the repo root, so a package it imports (such as `fast-deep-equal`) must be a root dependency. Vite bundles the utils into each library and its `dts` plugin inlines the types (`rollupTypes: true`) into the emitted `.d.ts`. When changing the list API, update `shared/` first, then keep both React and Vue implementations in sync. Put logic that is the same in both frameworks in `shared/utils.ts`, not in each package.
- `apps/{react,vue}/playground` — Vite apps for manual testing against the packages.
- `apps/{react,vue}/story` — Storybook apps; their stories double as the test suite (Vitest + Playwright browser via `@storybook/addon-vitest`). There are no unit tests inside `packages/`.
- `.cursor/skills/react-list/` — usage documentation for the public API (props, slots, `requestHandler` contract).

## Architecture

A root component (`List` in `packages/react/src/components/list.tsx`, `list.vue` in Vue) owns all state, calls the user-supplied `requestHandler(state)` (must return `{ rows, count, meta? }`), and exposes state/actions through a context (`useListContext` in React, `use-list-context` composable in Vue). Slot components (`ListRows`, `ListPagination`, `ListSearch`, `ListLoadMore`, `ListEmpty`, `ListError`, loaders, etc.) read that context and throw if used outside the root. Every slot scope has a `context` key (the `Context`: state plus actions); `requestHandler` and `stateManager` get only the `State` (data, no methods); a component adds extra keys only for values it computes (for example `pagesToDisplay`). Both roots keep one piece of state per field: Vue uses a `ref` each, React a `useState` each. Vue actions set refs and call `getData` directly. React actions only set state; the query effect (which also watches `refreshKey`, bumped by `refresh`) runs the request after that render, so `requestHandler` always gets the committed values. Each root builds its `State` in one place (Vue's `reactive` state, React's `state` `useMemo`) from the shared helpers (`computeHasMore`, `computeFilters`, `computeColumns`); React memoizes `state`, `actions` and `context` with `useMemo`, so they change identity only when a field changes; `stateManager.set` after a response runs in an effect (keyed by `responseKey`) on the committed `state`, and `stateManager` and the hook callbacks are read through refs so inline props do not rebuild the context. The component files mirror each other 1:1 between `packages/react/src/components/*.tsx` and `packages/vue/src/components/*.vue`.

## Engineering rules

These rules came out of the cleanup, renaming and reuse work on this repo. They apply to any new code, in every package and app. When a rule and the existing code disagree, follow the rule and fix the code you touch.

### Parity between implementations
- Implementations of the same feature (one per framework) must have the same API, props, state keys, events, event order, defaults, default markup and default text. When you change one, change the others in the same task.
- Anything that is the same in every implementation lives once in `shared/`: types in `shared/types/`, defaults in `shared/constants.ts`, framework-agnostic logic in `shared/utils.ts`. Do not copy a helper into a package.
- The framework layer only adapts: reactivity, lifecycle hooks, rendering and event wiring. If a function has no framework API in it, it belongs in `shared/`.
- Defaults are named constants in one place. Do not write a default value inline in a component.
- User-visible default text (labels, messages) comes from a shared function so the packages cannot drift.
- Record a known difference between packages in the parity document, with a priority, and remove the row once it is fixed.

### Types
- Define a type once. Do not re-declare fields another type already has; extend or derive instead (`extends`, `Pick`, `Partial`).
- Do not keep a type that is only used inside one other type, only used together with another, or not used at all. Merge it in or delete it.
- Do not add an alias that only renames another type. If a package needs extra fields, extend the shared type there under its own name.
- Keep framework-specific types (anything that mentions a framework's own types) in that package. Shared types stay framework-agnostic.
- Make a field required when it is always set. Optional means "may really be missing".
- Do not force a data shape on values the library does not read. Use a loose object type for free-form data, and let the consumer narrow it.
- Do not use names that collide with globals or framework types (for example `Response`, `Context` from a framework). Choose a more specific name.
- Names that differ by one letter (`RowScope` vs `RowsScope`) are a trap. Pick clearer ones.
- Use one vocabulary everywhere: the same word for the same thing in types, state keys, components, docs and default text.

### State and API shape
- Prefer flat keys over nested objects (`page`, `isLoading`, `sortBy`, not `pagination.page`).
- Booleans start with `is` or `has`. Use one name for one concept (do not have `initialLoading` and `isInitializing`).
- Separate data from behaviour: a data-only `State` for anything handed to consumer callbacks, and a `Context` (state plus actions) for the UI layer.
- A slot scope contains the context plus only the values that component computes. Do not rebuild a new scope for fields the context already has.
- Prefer two small, independent actions over one that takes a combined object (`setSortBy` and `setSortOrder`, not `setSort({ by, order })`).
- Do not add a prop, option or exported helper without a real use. Remove an option when its job is covered elsewhere.
- Hooks are named the same in every package: `before*` and `after*` for request phases, `on*` for the rest. Define their payloads once as an event map and derive each framework's form from it. The firing order must be identical and documented.
- Hooks should fire only for a real change (compare before and after), not on every internal reset.

### Naming and files
- File names are kebab-case and have no prefix. An exported component is `List` plus the PascalCase file name (`loader-initial.tsx` exports `ListLoaderInitial`).
- Props types end in `Props`, slot scopes in `Scope`.
- Internal state setters take a `_` prefix (`const [page, _setPage] = useState(...)`), never a `Value` suffix, so they cannot be confused with the public actions of the same name (`setPage`).
- CSS classes use one shared prefix in every package, not a per-framework one.
- Use the same component names in the framework-specific `name` option, exports and docs.
- Use import aliases (such as `@shared`) for code outside the package folder. Do not write long relative paths like `../../../shared`.
- Import types and runtime code separately, so runtime helpers are never re-exported as public API by accident.

### Code style
- Always use braces and put the body on its own lines. No single-line `if (x) return`.
- No ternaries for logic. Use `if` / `else`. A short ternary for a label or a class name is fine.
- A function that returns a value uses braces and an explicit `return`, including `map`/`filter` callbacks, `computed` and `useMemo` factories, and default-value factories. Single-expression arrows are only for functions that return nothing.
- Build conditional markup with a `content` variable filled by `if` / `else if` / `else`, then render it once. Do not nest ternaries in markup.
- Vue props declare their defaults by destructuring (`const { page = DEFAULT_PAGE } = defineProps<...>()`, Vue 3.5+), not with `withDefaults`. React does the same with destructured parameters.
- Comments explain why, or describe the lifecycle step the code belongs to. Delete comments that repeat the code. Keep lifecycle comments numbered the same as the lifecycle document.
- Prefer a well-known, small npm package over hand-writing a generic utility (for example deep equality). Add it where the importing code resolves it from, and note it in the docs.

### Verification and process
- After a change, run the type check, lint, the library builds, the type checks of every app, and the story tests. Fix everything before reporting done.
- Read build output for errors too. A build can succeed while a declaration step prints errors.
- To check behaviour that the existing tests do not cover (hooks, ordering, edge cases), write a temporary story or script, run it, then delete it.
- Run the formatter from a package that has it installed, and check a file is already formatted before running it over the whole file. Do not reformat unrelated code in a change.
- Do not use destructive git commands (`git stash`, `reset --hard`) on a working tree with uncommitted work.
- Keep the documentation in step with the code in the same task: `CLAUDE.md`, the usage docs, the lifecycle document and the parity document.
- When you finish, list the breaking changes for consumers (renamed or removed exports, changed payloads, changed behaviour) and any decision you made on the user's behalf.

## Commands

Run from repo root:

```bash
pnpm install
pnpm build:packages          # build both libs (required before typecheck/lint/apps/tests; CI caches dist/)
pnpm build:react-list        # or build:vue-list
pnpm typecheck               # tsc --noEmit for both packages
pnpm lint                    # eslint for both packages
pnpm format                  # prettier --write src/ in both packages
pnpm dev:react:playground    # also dev:vue:playground, dev:react:docs, dev:vue:docs
pnpm dev:react:story         # Storybook on :6007 (dev:vue:story for Vue)
pnpm test:react:story        # installs Playwright chromium, then vitest run (test:vue:story for Vue)
pnpm build:react:playground  # also build:vue:playground, build:{react,vue}:story
```

Run a single story test file: `pnpm --filter react-story exec vitest run <path-or-name-filter>` (Playwright chromium must be installed via `pnpm test:setup`).

CI (`.github/workflows/ci.yml`) order: build packages → typecheck / lint / story tests → build playgrounds and storybooks.
