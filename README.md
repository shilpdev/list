# Shilp List

Headless list components for React and Vue: fetching, pagination, search, sorting and filters, with your own markup.

Use it to build data tables, data grids, listing pages, card grids, infinite lists and admin dashboards that load from an API, with server-side pagination, sorting, filtering and search.

[![react-list](https://img.shields.io/npm/v/@shilp.dev/react-list.svg?label=react-list)](https://www.npmjs.com/package/@shilp.dev/react-list)
[![vue-list](https://img.shields.io/npm/v/@shilp.dev/vue-list.svg?label=vue-list)](https://www.npmjs.com/package/@shilp.dev/vue-list)
[![license](https://img.shields.io/github/license/shilpdev/list)](./LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/shilpdev/list?style=social)](https://github.com/shilpdev/list)

Enjoy this library? Give it a ⭐ on [GitHub](https://github.com/shilpdev/list), it helps others find it.

## Packages

| Framework | Package                                     | Docs                                                    | Source                             |
| --------- | ------------------------------------------- | ------------------------------------------------------- | ---------------------------------- |
| React     | [`@shilp.dev/react-list`](./packages/react) | [React docs](https://7span.com/open-source/react-list/) | [packages/react](./packages/react) |
| Vue       | [`@shilp.dev/vue-list`](./packages/vue)     | [Vue docs](https://7span.com/open-source/vue-list/)     | [packages/vue](./packages/vue)     |

Both packages share the same props, state, actions and events, so moving a list between React and Vue means changing the markup, not the logic.

## Quick Features

- Headless: you write all the markup (render props in React, scoped slots in Vue), and nothing is styled for you
- Works with any backend (REST, GraphQL, anything that returns a promise)
- One shared `requestHandler` for every list in your app
- Refetches automatically when page, page size, search, sort or filters change
- Only the latest response is used, so a slow old request never overwrites a newer one
- Numbered pagination or load more, switched with one prop
- Debounced search
- Filters, sorting and column visibility
- Row selection with select all and a partial (indeterminate) state
- Loading, initial loading, empty and error states
- Saves page, filters and search to `localStorage`, the URL or your API through a `stateManager`
- SSR ready: start from a server-fetched response in Next.js or Nuxt
- Lifecycle events: `beforePageChange`, `afterPageChange`, `onResponse`, `onError` and more
- Written in TypeScript, with types included
- About 5 to 6 kB gzipped, with no dependencies besides the framework

## Install

```bash
npm install @shilp.dev/react-list
```

```bash
npm install @shilp.dev/vue-list
```

## Repository layout

| Path             | What it holds                                             |
| ---------------- | --------------------------------------------------------- |
| `packages/react` | `@shilp.dev/react-list`                                   |
| `packages/vue`   | `@shilp.dev/vue-list`                                     |
| `shared`         | Types, defaults, messages and logic used by both packages |
| `apps/next-demo` | Next.js demo app for the React package                    |
| `apps/nuxt-demo` | Nuxt demo app for the Vue package                         |

## Contributing

Issues and pull requests are welcome. This is a pnpm monorepo (Node 22, pnpm 11):

```bash
pnpm install
pnpm build:packages
pnpm dev
```

Run `pnpm typecheck` and `pnpm lint` before opening a pull request. A change to the list API goes into both packages in the same pull request, so they stay in step.
