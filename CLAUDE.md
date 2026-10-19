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

A root component (`List` in `packages/react/src/components/list.tsx`, `list.vue` in Vue) owns all state, calls the user-supplied `requestHandler(state)` (must return `{ rows, count, meta? }`), and exposes state/actions through a context (`useListContext` in React, `use-list-context` composable in Vue). Slot components (`ListRows`, `ListPagination`, `ListSearch`, `ListLoadMore`, `ListEmpty`, `ListError`, loaders, etc.) read that context and throw if used outside the root. Every slot scope has a `context` key (the `Context`: state plus actions); `requestHandler` and `stateManager` get only the `State` (data, no methods); a component adds extra keys only for values it computes (for example `pagesToDisplay`). The component files mirror each other 1:1 between `packages/react/src/components/*.tsx` and `packages/vue/src/components/*.vue`.

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
